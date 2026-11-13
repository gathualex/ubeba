import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAdminContext } from '@/lib/admin'
type OverviewProduct={id:string;name:string;slug:string;status:string;published:boolean;price:number|null;price_on_request:boolean;view_count?:number}
export default async function AdminHome(){
	const {db,user,isAdmin}=await getAdminContext()
	if(!db)return <div className="admin-panel"><h1>Connect your catalog</h1><p>Add Supabase credentials to enable administration.</p><Link href="/admin/login">Admin sign in</Link></div>
	if(!user)redirect('/admin/login')
	if(!isAdmin)redirect('/admin/login?error=unauthorized')

	const summary=await db.from('products').select('id,name,slug,status,published,price,price_on_request,view_count').order('created_at',{ascending:false})
	let products=summary.data as OverviewProduct[]|null
	let error=summary.error
	let viewsAvailable=!error
	if(error?.code==='42703'){
		viewsAvailable=false
		const fallback=await db.from('products').select('id,name,slug,status,published,price,price_on_request').order('created_at',{ascending:false})
		products=fallback.data as OverviewProduct[]|null
		error=fallback.error
	}
	if(error)return <div className="admin-panel"><h1>Overview unavailable</h1><p className="error">Could not load catalog metrics.</p></div>

	const items=products??[]
	const soldValue=items.reduce((total,item)=>total+(item.status==='sold'&&!item.price_on_request&&item.price!=null?Number(item.price):0),0)
	const totalViews=items.reduce((total,item)=>total+Number(item.view_count??0),0)
	const stats=[
		{label:'Total products',value:items.length.toLocaleString(),detail:'Across all catalog statuses'},
		{label:'Published',value:items.filter(item=>item.published).length.toLocaleString(),detail:'Visible in the storefront'},
		{label:'Drafts',value:items.filter(item=>!item.published).length.toLocaleString(),detail:'Not yet published'},
		{label:'Reserved',value:items.filter(item=>item.status==='reserved').length.toLocaleString(),detail:'Currently reserved'},
		{label:'Sold',value:items.filter(item=>item.status==='sold').length.toLocaleString(),detail:'Marked as sold'},
		{label:'Product views',value:viewsAvailable?totalViews.toLocaleString():'—',detail:viewsAvailable?'One view per product per tab session':'Apply the product views migration'},
		{label:'Revenue generated (estimate)',value:`KES ${soldValue.toLocaleString()}`,detail:'Listed prices of products marked sold; not payment-confirmed'},
	]

	return <div className="admin-panel">
		<span className="eyebrow">Overview</span>
		<h1>Good to see you.</h1>
		<div className="admin-stats">{stats.map(stat=><div className="stat-card" key={stat.label}>
			<span className="stat-label">{stat.label}</span>
			<strong>{stat.value}</strong>
			<small>{stat.detail}</small>
		</div>)}</div>
		<section className="overview-recent">
			<div className="overview-recent-head"><h2>Recent products</h2><Link className="text-link" href="/admin/products">View all products</Link></div>
			{items.length?<ul className="overview-product-list">{items.slice(0,5).map(item=><li key={item.id}>
				<Link className="overview-product-row" href={`/admin/products/${item.id}/edit`}>
					<strong>{item.name}</strong>
					<span className={`overview-product-status status-${item.status}`}>{item.status}</span>
					<span className="overview-product-views">{viewsAvailable?Number(item.view_count??0).toLocaleString():'—'} views</span>
				</Link>
			</li>)}</ul>:<p>No products yet. Add your first product to start building the catalog.</p>}
		</section>
		<div className="overview-actions"><Link className="button button-dark" href="/admin/products/new">Add a product</Link><Link className="text-link" href="/admin/products">Manage products</Link></div>
	</div>
}
