import { redirect } from 'next/navigation'

export default async function LegacyAdminSubpath({ params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  redirect(`/ubeba-admin/${path.map(encodeURIComponent).join('/')}`)
}
