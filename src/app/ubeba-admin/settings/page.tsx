import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAdminContext } from '@/lib/admin'
import { saveWhatsAppPhone } from '../actions'

export default async function AdminSettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const params = await searchParams
  const { db, user, isAdmin } = await getAdminContext()
  if (!db) return <div className="admin-panel"><h1>Connect your catalog</h1><p>Add Supabase credentials to enable administration.</p><Link href="/ubeba-admin/login">Admin sign in</Link></div>
  if (!user) redirect('/ubeba-admin/login')
  if (!isAdmin) redirect('/ubeba-admin/login?error=unauthorized')

  const site = db ? await db.from('site_settings').select('whatsapp_phone').maybeSingle() : { data: null }
  const value = site.data?.whatsapp_phone ?? ''

  return <div className="admin-panel">
    <span className="eyebrow">Settings</span>
    <h1>WhatsApp contact</h1>
    <p>Set the phone number customers should use for direct inquiries.</p>
    {params.saved === '1' && <p role="status">WhatsApp contact saved.</p>}
    {params.error === 'phone' && <p className="error" role="alert">Enter a phone number with 8 to 15 digits, including the country code.</p>}
    {params.error === 'migration' && <p className="error" role="alert">The WhatsApp settings table is missing in Supabase. Apply <code>supabase/migrations/202611130002_site_settings.sql</code> to this project, then try again.</p>}
    {params.error === 'save' && <p className="error" role="alert">Could not save the WhatsApp contact. Check the Supabase site_settings migration and administrator permissions, then try again.</p>}
    <form action={saveWhatsAppPhone} style={{ display: 'grid', gap: 12, maxWidth: 420 }}>
      <label style={{ display: 'grid', gap: 6 }}>
        <span>Phone number</span>
        <input name="whatsapp_phone" defaultValue={value} placeholder="+254 700 000000" inputMode="tel" />
      </label>
      <button className="button button-dark" type="submit">Save contact</button>
    </form>
  </div>
}
