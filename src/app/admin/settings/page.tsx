import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAdminContext } from '@/lib/admin'
import { saveWhatsAppPhone } from '../actions'
import { supabaseServer } from '@/lib/supabase/server'

export default async function AdminSettingsPage() {
  const { db, user, isAdmin } = await getAdminContext()
  if (!db) return <div className="admin-panel"><h1>Connect your catalog</h1><p>Add Supabase credentials to enable administration.</p><Link href="/admin/login">Admin sign in</Link></div>
  if (!user) redirect('/admin/login')
  if (!isAdmin) redirect('/admin/login?error=unauthorized')

  const site = db ? await db.from('site_settings').select('whatsapp_phone').maybeSingle() : { data: null }
  const value = site.data?.whatsapp_phone ?? process.env.WHATSAPP_PHONE_NUMBER ?? ''

  return <div className="admin-panel">
    <span className="eyebrow">Settings</span>
    <h1>WhatsApp contact</h1>
    <p>Set the phone number customers should use for direct inquiries.</p>
    <form action={saveWhatsAppPhone} style={{ display: 'grid', gap: 12, maxWidth: 420 }}>
      <label style={{ display: 'grid', gap: 6 }}>
        <span>Phone number</span>
        <input name="whatsapp_phone" defaultValue={value} placeholder="+254 700 000000" inputMode="tel" />
      </label>
      <button className="button button-dark" type="submit">Save contact</button>
    </form>
  </div>
}
