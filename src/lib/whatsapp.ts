import { supabaseAdmin, supabaseServer } from './supabase/server'
import type { Product } from './product'

export function normalizePhoneNumber(value?: string | null) {
  return value?.replace(/\D/g, '') || null
}

export async function resolveWhatsappPhoneNumber(settings?: { whatsapp_phone?: string | null } | null) {
  if (settings !== undefined) return normalizePhoneNumber(settings?.whatsapp_phone)

  const db = await supabaseAdmin()
  if (!db) return null

  const { data, error } = await db.from('site_settings').select('whatsapp_phone').maybeSingle()
  if (error) {
    console.error('Could not load WhatsApp contact:', error.message)
    return null
  }
  return normalizePhoneNumber(data?.whatsapp_phone)
}

async function productImageLink(product?: Product) {
  const image = product?.product_images?.slice().sort((a, b) => a.sort_order - b.sort_order)[0]
  if (!image?.storage_path) return null

  const db = await supabaseAdmin() ?? await supabaseServer()
  if (!db) return null

  const { data, error } = await db.storage
    .from('product-images')
    .createSignedUrl(image.storage_path, 60 * 60 * 24 * 30)

  if (error || !data?.signedUrl) {
    console.error('Could not create WhatsApp product image link:', error?.message ?? 'No signed URL returned')
    return null
  }
  return data.signedUrl
}

export async function whatsappUrl(product?: Product, path?: string, settings?: { whatsapp_phone?: string | null } | null) {
  const phone = await resolveWhatsappPhoneNumber(settings)
  if (!phone) return null
  const imageLink = await productImageLink(product)
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
  const isLocalhost = base ? /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(base) : false
  const productLink = base && !isLocalhost && path ? `${base}${path}` : ''
  const link = imageLink ? `Product image: ${imageLink}` : productLink
  const text = product ? `Hi Ubeba! I'm interested in the ${product.name}${product.price_on_request || product.price == null ? ' (price on request)' : ` listed at KES ${product.price.toLocaleString()}`} on your website. Is it still available? Please share more details.${link ? ` ${link}` : ''}` : 'Hi Ubeba! I would like to know more about your products.'
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
}
