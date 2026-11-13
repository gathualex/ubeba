import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { getAdminContext } from '@/lib/admin'
import { imageUrl } from '@/lib/product'
import { deleteProduct } from '../actions'
import { ConfirmDelete } from '@/components/confirm-delete'
import './admin-products.css'
type AdminProduct={id:string;name:string;slug:string;status:string;published:boolean;price:number|null;price_on_request:boolean;view_count?:number;product_images?:{storage_path:string;alt_text:string|null;sort_order:number}[]}
export default async function AdminProducts({searchParams}:{searchParams:Promise<{q?:string}>}) {
	const {db,user,isAdmin}=await getAdminContext()
	if(!db)redirect('/admin/login?error=setup')
	if(!user)redirect('/admin/login')
	if(!isAdmin)redirect('/admin/login?error=unauthorized')
	const params=await searchParams
	const query=typeof params.q==='string'?params.q.trim().slice(0,100):''
	let productsQuery=db.from('products').select('id,name,slug,status,published,price,price_on_request,view_count,product_images(storage_path,alt_text,sort_order)').order('created_at',{ascending:false})
	if(query)productsQuery=productsQuery.ilike('name',`%${query}%`)
	const result=await productsQuery
	let products=result.data as AdminProduct[]|null
	let error=result.error
	let viewsAvailable=!error
	if(error?.code==='42703'){
		viewsAvailable=false
		let fallbackQuery=db.from('products').select('id,name,slug,status,published,price,price_on_request,product_images(storage_path,alt_text,sort_order)').order('created_at',{ascending:false})
		if(query)fallbackQuery=fallbackQuery.ilike('name',`%${query}%`)
		const fallback=await fallbackQuery
		products=fallback.data as AdminProduct[]|null
		error=fallback.error
	}

	return <div className="admin-panel">
		<div className="section-head">
			<div><span className="eyebrow">Inventory</span><h1>Products</h1></div>
			<div className="product-list-actions">
				<Link className="button button-outline" href="/admin/products/bulk">Add multiple</Link>
				<Link className="button button-dark" href="/admin/products/new">Add product</Link>
			</div>
		</div>
		<p className="admin-product-hint">Hover or focus a product name to preview its image.</p>
		<form className="admin-search" action="/admin/products">
			<label className="sr-only" htmlFor="admin-product-search">Search products</label>
			<input id="admin-product-search" type="search" name="q" placeholder="Search products…" defaultValue={query}/>
			<button className="button button-dark" type="submit">Search</button>
			{query&&<Link className="admin-search-clear" href="/admin/products">Clear</Link>}
		</form>
		{error?<p className="error">Could not load products.</p>:products?.length?
			<div className="admin-table-wrap">
				<table className="admin-table">
					  <thead><tr><th>Product</th><th>Status</th><th>Visibility</th><th>Price</th><th>Views</th><th>Actions</th></tr></thead>
					<tbody>{products.map(p=>{
						const firstImage=p.product_images?.sort((a,b)=>a.sort_order-b.sort_order)[0]
						const preview=imageUrl(firstImage?.storage_path)
						return <tr key={p.id}>
							<td><Link className="admin-product-preview" href={`/admin/products/${p.id}/edit`}>{p.name}{preview&&<span className="admin-product-preview-popover" aria-hidden="true"><Image src={preview} alt="" width={180} height={180} sizes="180px" unoptimized/></span>}</Link></td>
							<td>{p.status}</td>
							<td>{p.published?'Published':'Draft'}</td>
							<td>{p.price_on_request||p.price==null?'On request':`KES ${Number(p.price).toLocaleString()}`}</td>
							  <td>{viewsAvailable?Number(p.view_count??0).toLocaleString():'—'}</td>
							<td><div className="product-row-actions">
								<Link className="product-action-icon" href={`/admin/products/${p.id}/edit`} aria-label={`Edit ${p.name}`} title={`Edit ${p.name}`}>
									<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5 4 4M4 20l4.3-.9L19 8.4a2.1 2.1 0 0 0-3-3L5.3 16.1 4 20Z"/></svg>
								</Link>
								<ConfirmDelete action={deleteProduct} id={p.id} label={p.name} iconOnly/>
							</div></td>
						</tr>
					})}</tbody>
				</table>
			</div>:<p>{query?`No products found for “${query}”.`:'No products yet. Add the first one.'}</p>}
	</div>
}
