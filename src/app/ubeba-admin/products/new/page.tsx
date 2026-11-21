import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAdminContext } from '@/lib/admin'
import { ImageUpload } from '@/components/image-upload'
import { ProductNameSlugFields } from '@/components/product-name-slug-fields'
import { createProduct } from '../../actions'
import { ProductCreatePageShell } from '../product-create-page-shell'

export default async function NewProduct() {
  const { db, user, isAdmin } = await getAdminContext()
  if (!db) redirect('/ubeba-admin/login?error=setup')
  if (!user) redirect('/ubeba-admin/login')
  if (!isAdmin) redirect('/ubeba-admin/login?error=unauthorized')

  const { data: categories } = await db.from('categories').select('id,name').order('sort_order')

  return <ProductCreatePageShell title="Add a product" description="Add the details and photos customers need to discover this product.">
    <form action={createProduct} className="admin-form product-create-page-form">
      <ProductNameSlugFields nameField="name" slugField="slug"/>
      <label className="product-create-description">Description<textarea name="description" maxLength={5000} placeholder="Describe the product and its condition."/></label>
      <label>Price in KES<input name="price" type="number" min="0" step="0.01" placeholder="e.g. 4,500"/></label>
      <label>Category<select name="category_id" defaultValue=""><option value="">Uncategorised</option>{categories?.map(category => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label>
      <label>Availability<select name="status" defaultValue="available"><option value="available">Available</option><option value="reserved">Reserved</option><option value="sold">Out of stock</option></select></label>
      <label><input type="checkbox" name="price_on_request"/> Price on request</label>
      <label><input type="checkbox" name="featured"/> Featured</label>
      <label><input type="checkbox" name="published"/> Publish now</label>
      <div className="admin-form-field product-create-image-field"><span>Product images (JPG, PNG, WebP or AVIF; 8 MB max each)</span><ImageUpload primaryName="primary_image_index"/></div>
      <div className="product-create-page-actions"><Link className="button button-outline" href="/ubeba-admin/products">Cancel</Link><button className="button button-dark" type="submit">Save product</button></div>
    </form>
  </ProductCreatePageShell>
}
