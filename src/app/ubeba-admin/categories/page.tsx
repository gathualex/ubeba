import { redirect } from 'next/navigation'
import { getAdminContext } from '@/lib/admin'
import { CategoryManager } from './category-manager'

export default async function AdminCategories() {
  const { db, user, isAdmin } = await getAdminContext()
  if (!db) redirect('/ubeba-admin/login')
  if (!user) redirect('/ubeba-admin/login')
  if (!isAdmin) redirect('/ubeba-admin/login?error=unauthorized')

  const { data: categories, error } = await db
    .from('categories')
    .select('id,name,slug,description,sort_order')
    .order('sort_order')

  if (error) throw new Error(`Could not load categories: ${error.message}`)

  return <CategoryManager categories={categories ?? []}/>
}
