import { supabaseServer } from './supabase/server'
export { imageUrl } from './product'
import type { Product } from './product'
export type { Product } from './product'

export function isCatalogPermissionError(error?: { message?: string } | null) {
  if (!error?.message) return false
  return /permission denied/i.test(error.message) && /is_ubeba_admin/i.test(error.message)
}

export async function listProducts(options: { limit?:number; offset?:number; search?:string; category?:string; categorySlug?:string; sort?:string; featured?:boolean; priceOnRequest?:boolean } = {}) {
  const db = await supabaseServer()
  if (!db) return { products: [] as Product[], categories: [] as {id:string;name:string;slug:string}[], configured: false, count:0 }
  const categoriesQuery = db.from('categories').select('id,name,slug').order('sort_order')
  const categoriesResult = await categoriesQuery
  let query = db.from('products').select('*,categories(name,slug),product_images(storage_path,alt_text,sort_order)',{count:'exact'}).eq('published', true)
  if (options.search) { const term = options.search.replace(/[^\p{L}\p{N}\s-]/gu, ' ').trim().slice(0,100); if (term) query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`) }
  if (options.category) query = query.eq('category_id', options.category)
  if (options.categorySlug) { const category = categoriesResult.data?.find(c=>c.slug===options.categorySlug); query = query.eq('category_id',category?.id??'00000000-0000-0000-0000-000000000000') }
  if (options.featured) query = query.eq('featured', true)
  if (options.priceOnRequest) query = query.or('price_on_request.eq.true,price.is.null')
  if (options.sort === 'price_asc') query = query.eq('price_on_request', false).not('price', 'is', null).order('price', {ascending:true})
  else if (options.sort === 'price_desc') query = query.eq('price_on_request', false).not('price', 'is', null).order('price', {ascending:false})
  else query = query.order('created_at', {ascending:false})
  if (options.limit) query = query.range(options.offset??0,(options.offset??0)+options.limit-1)
  const p = await query

  if (isCatalogPermissionError(p.error) || isCatalogPermissionError(categoriesResult.error)) {
    return { products: [] as Product[], categories: [] as {id:string;name:string;slug:string}[], configured: false, count:0 }
  }

  if (p.error) console.error('Catalog query failed', p.error.message)
  if (categoriesResult.error) console.error('Category query failed', categoriesResult.error.message)
  return { products:(p.data ?? []) as Product[], categories:categoriesResult.data ?? [], configured:true,count:p.count??0 }
}
