import { NextResponse } from 'next/server'
import { supabaseAdmin, supabaseServer } from '@/lib/supabase/server'

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const storagePath = path.join('/')
  const db = await supabaseServer()
  if (!db) return new NextResponse(null, { status: 503 })

  const { data: row, error: imageError } = await db
    .from('product_images')
    .select('storage_path,products!inner(published)')
    .eq('storage_path', storagePath)
    .maybeSingle()

  if (imageError) {
    console.error('Product image lookup failed:', imageError.message)
    return new NextResponse(null, { status: 500 })
  }
  if (!row) return new NextResponse(null, { status: 404 })

  const published = (row.products as unknown as { published: boolean }).published
  if (!published) {
    const { data: { user }, error: authError } = await db.auth.getUser()
    if (authError) {
      console.error('Product image authorization failed:', authError.message)
      return new NextResponse(null, { status: 500 })
    }
    if (!user) return new NextResponse(null, { status: 404 })

    const { data: role, error: roleError } = await db
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (roleError) {
      console.error('Product image authorization failed:', roleError.message)
      return new NextResponse(null, { status: 500 })
    }
    if (!role) return new NextResponse(null, { status: 404 })
  }

  const storageClient = await supabaseAdmin() ?? db
  const { data, error } = await storageClient.storage.from('product-images').createSignedUrl(storagePath, 300)
  if (error || !data) {
    console.error('Could not create product image URL:', error?.message ?? 'No signed URL returned')
    return new NextResponse(null, { status: 500 })
  }

  return NextResponse.redirect(data.signedUrl, { headers: { 'Cache-Control': 'private, no-store' } })
}
