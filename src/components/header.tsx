import Link from 'next/link'
import { whatsappUrl } from '@/lib/whatsapp'
export async function Header() { const contact=await whatsappUrl(); return <header className="site-header"><div className="shell nav"><Link href="/" className="brand"><span className="brand-mark">U</span><span>ubeba<small>USA finds, made closer.</small></span></Link><nav><Link href="/shop">Shop</Link><Link href="/#how-it-works">How it works</Link>{contact&&<a className="nav-contact" href={contact} target="_blank" rel="noopener noreferrer">Chat with us ↗</a>}</nav></div></header> }
