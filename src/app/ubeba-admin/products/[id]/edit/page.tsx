import { notFound, redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getAdminContext } from '@/lib/admin'
import { ImageUpload } from '@/components/image-upload'
import { imageUrl } from '@/lib/product'
import { updateProduct, deleteProductImage, setImageOrder } from '../../../actions'

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params
	const { db, user, isAdmin } = await getAdminContext()
	if (!user) redirect('/ubeba-admin/login')
	if (!db || !isAdmin) redirect('/ubeba-admin/login?error=unauthorized')

	const { data: product } = await db.from('products').select('*').eq('id', id).maybeSingle()
	if (!product) notFound()

	const [{ data: categories }, { data: images }] = await Promise.all([
		db.from('categories').select('id,name').order('sort_order'),
		db.from('product_images').select('id,storage_path,alt_text,sort_order').eq('product_id', id).order('sort_order'),
	])

	return <div className="admin-panel product-edit-page">
		<header className="product-edit-header">
			<div className="product-edit-heading-copy">
				<Link className="product-edit-back" href="/ubeba-admin/products"><span aria-hidden="true">←</span> Products</Link>
				<span className="eyebrow">Inventory · Edit listing</span>
				<h1>{product.name}</h1>
				<p>Update the details, availability, and images customers see.</p>
			</div>
			<div className="product-edit-header-actions">
				<span className={`product-edit-published${product.published ? ' is-live' : ''}`}><i aria-hidden="true"/>{product.published ? 'Published' : 'Draft'}</span>
				<button className="button button-dark" type="submit" form="edit-product">Save changes <span aria-hidden="true">↗</span></button>
			</div>
		</header>
		<form id="edit-product" action={updateProduct} className="product-edit-form">
			<input type="hidden" name="id" value={id}/>
			<input type="hidden" name="slug" value={product.slug}/>
			<section className="product-edit-section">
				<header className="product-edit-section-heading"><span>01</span><div><h2>Product details</h2><p>Help customers understand what you’re offering.</p></div></header>
				<div className="product-edit-fields">
					<label className="product-edit-name">Product name<input name="name" defaultValue={product.name} required minLength={2}/></label>
					<label className="product-edit-description">Description<textarea name="description" defaultValue={product.description || ''} placeholder="Describe the product and its condition."/></label>
					<label>Price in KES<input name="price" type="number" min="0" step="0.01" defaultValue={product.price ?? ''} placeholder="e.g. 4,500"/></label>
					<label>Category<select name="category_id" defaultValue={product.category_id || ''}>
						<option value="">Uncategorised</option>
						{categories?.map(category => <option value={category.id} key={category.id}>{category.name}</option>)}
					</select></label>
					<label>Availability<select name="status" defaultValue={product.status}>
						<option value="available">Available</option><option value="reserved">Reserved</option><option value="sold">Out of stock</option>
					</select></label>
				</div>
				<div className="product-edit-options">
					<label><input type="checkbox" name="price_on_request" defaultChecked={product.price_on_request}/><span><b>Price on request</b><small>Hide the listed price from customers.</small></span></label>
					<label><input type="checkbox" name="featured" defaultChecked={product.featured}/><span><b>Featured product</b><small>Highlight this item in the catalog.</small></span></label>
					<label><input type="checkbox" name="published" defaultChecked={product.published}/><span><b>Published</b><small>Make this product visible to customers.</small></span></label>
				</div>
			</section>
			<section className="product-edit-section product-edit-image-section">
				<header className="product-edit-section-heading"><span>02</span><div><h2>Add images</h2><p>Upload more photos to the product gallery.</p></div></header>
				<div className="product-edit-upload"><ImageUpload/></div>
			</section>
			<div className="product-edit-save-row"><span>Changes are saved when you select Save changes.</span><button className="button button-dark" type="submit">Save changes</button></div>
		</form>
		<section className="product-edit-section product-edit-gallery-section">
			<header className="product-edit-section-heading"><span>03</span><div><h2>Product gallery</h2><p>Manage image order and remove photos from this listing.</p></div><span className="product-gallery-count">{images?.length ?? 0} {(images?.length ?? 0) === 1 ? 'image' : 'images'}</span></header>
			{images?.length ? <div className="gallery-admin product-edit-gallery">{images.map((image, index) => <article className="gallery-admin-item product-edit-gallery-item" key={image.id}>
				<div className="product-edit-gallery-image"><Image src={imageUrl(image.storage_path)!} alt={image.alt_text || product.name} width={180} height={180} unoptimized/><span>{String(index + 1).padStart(2, '0')}</span></div>
				<div className="product-edit-gallery-controls">
					<form action={setImageOrder}>
						<input type="hidden" name="id" value={image.id}/><input type="hidden" name="product_id" value={id}/>
						<label>Display order<input type="number" min="0" name="sort_order" defaultValue={image.sort_order}/></label>
						<button className="button button-outline" type="submit">Save order</button>
					</form>
					<form action={deleteProductImage}>
						<input type="hidden" name="id" value={image.id}/><input type="hidden" name="product_id" value={id}/>
						<button className="product-edit-remove" type="submit">Remove image</button>
					</form>
				</div>
			</article>)}</div> : <div className="product-edit-empty-gallery"><span aria-hidden="true">▧</span><p>No gallery images yet. Upload images above to get started.</p></div>}
		</section>
	</div>
}
