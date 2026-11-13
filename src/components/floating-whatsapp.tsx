import { whatsappUrl } from '@/lib/whatsapp'

export async function FloatingWhatsApp() {
  const href = await whatsappUrl()
  if (!href) return null

  return <a className="whatsapp-float" href={href} target="_blank" rel="noopener noreferrer" aria-label="Chat with us on WhatsApp">
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M16 3.2A12.6 12.6 0 0 0 5.2 22.3L3.5 28l5.9-1.5A12.6 12.6 0 1 0 16 3.2Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M10.2 8.6c-.3-.7-.6-.7-.9-.7h-.8c-.3 0-.7.1-1.1.5-.4.4-1.4 1.4-1.4 3.4s1.5 4 1.7 4.2c.2.3 2.9 4.5 7 6.1 3.4 1.3 4.1 1 4.8.8.7-.1 2.5-1 2.8-2.1.4-1 .4-1.9.2-2.1-.1-.2-.4-.3-.8-.5l-2.9-1.4c-.4-.2-.7-.3-.9.2-.3.4-1.1 1.4-1.4 1.7-.2.3-.5.3-.9.1-.4-.2-1.7-.6-3.2-1.9-1.2-1.1-2-2.4-2.2-2.8-.2-.4 0-.6.2-.8.2-.2.4-.5.6-.7.2-.2.3-.4.4-.6.1-.3 0-.5 0-.7l-1.3-3.1Z" fill="currentColor" transform="translate(4 2) scale(.9)"/>
    </svg>
    <span>Chat with us</span>
  </a>
}
