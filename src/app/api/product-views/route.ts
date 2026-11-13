import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null) as { slug?: unknown } | null
  const slug = typeof payload?.slug === 'string' ? payload.slug.trim() : ''
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 140) {
    return NextResponse.json({ error: 'Invalid product slug.' }, { status: 400 })
  }

  const db = await supabaseAdmin()
  if (!db) return NextResponse.json({ error: 'View tracking is not configured.' }, { status: 503 })

  const { error } = await db.rpc('increment_product_view', { product_slug: slug })
  if (error) {
    if (error.code === 'PGRST202' || error.code === '42883' || error.code === '42703') {
      return NextResponse.json({ error: 'Apply the product views migration to enable tracking.' }, { status: 503 })
    }
    console.error('Product view tracking failed:', error.message)
    return NextResponse.json({ error: 'Could not record product view.' }, { status: 500 })
  }

  return new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })
}