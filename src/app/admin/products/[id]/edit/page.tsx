import { notFound, redirect } from 'next/navigation'
import Image from 'next/image'
import { getAdminContext } from '@/lib/admin'
import { ImageUpload } from '@/components/image-upload'
import { imageUrl } from '@/lib/product'
import { updateProduct, deleteProductImage, setImageOrder } from '../../../actions'

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params
	const { db, user, isAdmin } = await getAdminContext()
	if (!user) redirect('/admin/login')
	if (!db || !isAdmin) redirect('/admin/login?error=unauthorized')

	const { data: product } = await db.from('products').select('*').eq('id', id).maybeSingle()
	if (!product) notFound()

	const [{ data: categories }, { data: images }] = await Promise.all([
		db.from('categories').select('id,name').order('sort_order'),
		db.from('product_images').select('id,storage_path,alt_text,sort_order').eq('product_id', id).order('sort_order'),
	])

	return <div className="admin-panel">
		<header className="edit-product-heading">
			<div><span className="eyebrow">Inventory</span><h1>Edit product</h1></div>
			<button className="button button-dark" type="submit" form="edit-product">Save changes</button>
		</header>
		<form id="edit-product" action={updateProduct} className="admin-form">
			<input type="hidden" name="id" value={id}/>
			<label>Product name<input name="name" defaultValue={product.name} required minLength={2}/></label>
			<label>URL slug<input name="slug" defaultValue={product.slug} required pattern="[a-z0-9]+(-[a-z0-9]+)*"/></label>
			<label>Description<textarea name="description" defaultValue={product.description || ''}/></label>
			<label>Price in KES<input name="price" type="number" min="0" step="0.01" defaultValue={product.price ?? ''}/></label>
			<label>Category<select name="category_id" defaultValue={product.category_id || ''}>
				<option value="">Uncategorised</option>
				{categories?.map(category => <option value={category.id} key={category.id}>{category.name}</option>)}
			</select></label>
			<label>Availability<select name="status" defaultValue={product.status}>
				<option value="available">Available</option><option value="reserved">Reserved</option><option value="sold">Sold</option>
			</select></label>
			<label><input type="checkbox" name="price_on_request" defaultChecked={product.price_on_request}/> Price on request</label>
			<label><input type="checkbox" name="featured" defaultChecked={product.featured}/> Featured</label>
			<label><input type="checkbox" name="published" defaultChecked={product.published}/> Published</label>
			<label>Add more images<ImageUpload/></label>
			<button className="button button-dark edit-product-save-bottom" type="submit">Save changes</button>
		</form>
		<h2 style={{ fontFamily: 'Georgia,serif', marginTop: 32 }}>Product gallery</h2>
		<div className="gallery-admin">{images?.map(image => <div className="gallery-admin-item" key={image.id}>
			<Image src={imageUrl(image.storage_path)!} alt={image.alt_text || product.name} width={90} height={90} unoptimized/>
			<div>
				<form action={setImageOrder}>
					<input type="hidden" name="id" value={image.id}/><input type="hidden" name="product_id" value={id}/>
					<label>Image order<input type="number" min="0" name="sort_order" defaultValue={image.sort_order}/></label>
					<button className="ask-link" style={{ border: 0, background: 'none', cursor: 'pointer' }}>Save order</button>
				</form>
				<form action={deleteProductImage}>
					<input type="hidden" name="id" value={image.id}/><input type="hidden" name="product_id" value={id}/>
					<button className="ask-link" style={{ border: 0, background: 'none', color: '#a13a2b', cursor: 'pointer' }}>Remove image</button>
				</form>
			</div>
		</div>)}</div>
	</div>
}
