import { supabaseAdmin } from './supabase/server'
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

export async function whatsappUrl(product?: Product, path?: string, settings?: { whatsapp_phone?: string | null } | null) {
  const phone = await resolveWhatsappPhoneNumber(settings)
  if (!phone) return null
  const url = process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')}${path ?? ''}` : ''
  const text = product ? `Hi Ubeba! I'm interested in the ${product.name}${product.price_on_request || product.price == null ? ' (price on request)' : ` listed at KES ${product.price.toLocaleString()}`} on your website. Is it still available? Please share more details.${url ? ` ${url}` : ''}` : 'Hi Ubeba! I would like to know more about your products.'
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
}
