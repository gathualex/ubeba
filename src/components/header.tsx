import Link from 'next/link'
import { ThemeControl } from '@/components/theme-control'
export function Header() { return <header className="site-header"><div className="shell nav"><Link href="/" className="brand"><span className="brand-mark">U</span><span>ubeba<small>USA finds, made closer.</small></span></Link><nav className="site-nav"><Link href="/shop">Shop</Link><Link href="/#how-it-works">How it works</Link><ThemeControl/></nav></div></header> }
