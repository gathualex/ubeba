import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAdminContext } from '@/lib/admin'
import { BulkProductForm } from '../bulk-product-form'
import { ProductCreatePageShell } from '../product-create-page-shell'

export default async function BulkProducts() {
  const { db, user, isAdmin } = await getAdminContext()
  if (!db) redirect('/ubeba-admin/login?error=setup')
  if (!user) redirect('/ubeba-admin/login')
  if (!isAdmin) redirect('/ubeba-admin/login?error=unauthorized')

  const { data: categories } = await db.from('categories').select('id,name').order('sort_order')

  return <ProductCreatePageShell title="Add multiple products" eyebrow="Batch entry" description="Enter several products below and save them together. Each one can have its own details and images.">
    <BulkProductForm categories={categories ?? []}/>
    <div className="product-create-page-cancel"><Link className="text-link" href="/ubeba-admin/products">Cancel and return to products</Link></div>
  </ProductCreatePageShell>
}
