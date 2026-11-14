import { headers } from 'next/headers'

function usableOrigin(value?: string | null) {
  if (!value) return null
  try {
    const url = new URL(value)
    if (!['http:', 'https:'].includes(url.protocol) || ['localhost', '127.0.0.1', '::1'].includes(url.hostname)) return null
    return url.origin
  } catch {
    return null
  }
}

export async function publicSiteOrigin() {
  const configured = usableOrigin(process.env.NEXT_PUBLIC_SITE_URL)
  if (configured) return configured

  const requestHeaders = await headers()
  const host = requestHeaders.get('x-forwarded-host')?.split(',')[0].trim()
    || requestHeaders.get('host')
    || requestHeaders.get('x-vercel-deployment-url')
  if (!host) return null

  const protocolHeader = requestHeaders.get('x-forwarded-proto')?.split(',')[0].trim()
  const protocol = protocolHeader === 'http' ? 'http' : 'https'
  return usableOrigin(`${protocol}://${host}`)
}
