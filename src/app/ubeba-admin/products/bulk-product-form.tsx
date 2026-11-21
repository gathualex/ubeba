'use client'

import { useState, type FormEvent } from 'react'
import { ImageUpload } from '@/components/image-upload'
import { ProductNameSlugFields } from '@/components/product-name-slug-fields'
import { createProducts } from '../actions'

type Category = { id: string; name: string }
type ProductRow = { key: string }
const MAX_PRODUCTS = 20
const MAX_IMAGE_BYTES = 60 * 1024 * 1024

export function BulkProductForm({ categories }: { categories: Category[] }) {
  const [products, setProducts] = useState<ProductRow[]>([{ key: 'first-product' }])
  const [activeProduct, setActiveProduct] = useState(0)
  const [uploadError, setUploadError] = useState('')

  function checkUploadSize(event: FormEvent<HTMLFormElement>) {
    const inputs = Array.from(event.currentTarget.querySelectorAll<HTMLInputElement>('input[type="file"]'))
    const totalBytes = inputs.reduce((total, input) => total + Array.from(input.files ?? []).reduce((size, file) => size + file.size, 0), 0)
    if (totalBytes > MAX_IMAGE_BYTES) {
      event.preventDefault()
      setUploadError('Keep all selected images under 60 MB per batch.')
      return
    }
    setUploadError('')
  }

  return <form action={createProducts} className="bulk-product-form" onSubmit={checkUploadSize}>
    <input type="hidden" name="product_count" value={products.length}/>
    <div className="bulk-product-tabs" role="group" aria-label="Choose a product to edit">
      {products.map((product, index) => <button
        className="bulk-product-tab"
        type="button"
        key={product.key}
        aria-pressed={activeProduct === index}
        onClick={() => setActiveProduct(index)}
      >Product {index + 1}</button>)}
    </div>
    {products.map((product, index) => {
      const field = (name: string) => `product_${index}_${name}`
      return <fieldset className="bulk-product-entry" key={product.key} hidden={activeProduct !== index}>
        <legend>Product {index + 1}</legend>
        {products.length > 1 && <button className="bulk-product-remove" type="button" onClick={() => {
          setProducts(current => current.filter(item => item.key !== product.key))
          setActiveProduct(current => current > index ? current - 1 : current === index ? Math.max(0, index - 1) : current)
        }}>Remove</button>}
        <div className="admin-form bulk-product-fields">
          <ProductNameSlugFields nameField={field('name')} slugField={field('slug')}/>
          <label>Description<textarea name={field('description')} maxLength={5000}/></label>
          <label>Price in KES<input name={field('price')} type="number" min="0" step="0.01"/></label>
          <label>Category<select name={field('category_id')} defaultValue=""><option value="">Uncategorised</option>{categories.map(category => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label>
          <label>Availability<select name={field('status')} defaultValue="available"><option value="available">Available</option><option value="reserved">Reserved</option><option value="sold">Sold</option></select></label>
          <label><input type="checkbox" name={field('price_on_request')}/> Price on request</label>
          <label><input type="checkbox" name={field('featured')}/> Featured</label>
          <label><input type="checkbox" name={field('published')}/> Publish now</label>
          <div className="admin-form-field"><span>Product images</span><ImageUpload name={field('images')} primaryName={field('primary_image_index')}/></div>
        </div>
      </fieldset>
    })}
    {uploadError && <p className="error" role="alert">{uploadError}</p>}
    <div className="bulk-product-actions">
      <button className="button button-outline" type="button" disabled={products.length >= MAX_PRODUCTS} onClick={() => {
        setActiveProduct(products.length)
        setProducts(current => [...current, { key: crypto.randomUUID() }])
      }}>Add another product</button>
      <span>{products.length} of {MAX_PRODUCTS}</span>
      <button className="button button-dark" type="submit">Save products</button>
    </div>
  </form>
}
