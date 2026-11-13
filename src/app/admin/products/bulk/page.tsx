import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAdminContext } from '@/lib/admin'
import { BulkProductForm } from '../bulk-product-form'

export default async function BulkProducts() {
  const { db, user, isAdmin } = await getAdminContext()
  if (!db) redirect('/admin/login?error=setup')
  if (!user) redirect('/admin/login')
  if (!isAdmin) redirect('/admin/login?error=unauthorized')

  const { data: categories } = await db.from('categories').select('id,name').order('sort_order')

  return <div className="admin-panel bulk-products-panel">
    <div className="section-head">
      <div><span className="eyebrow">Inventory</span><h1>Add multiple products</h1></div>
      <Link className="text-link" href="/admin/products">Back to products</Link>
    </div>
    <p className="bulk-product-intro">Enter several products below and save them together. Each product can have its own details and images.</p>
    <BulkProductForm categories={categories ?? []}/>
  </div>
}
