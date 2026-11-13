import Link from 'next/link'
export default function NotFound(){return <section className="shell empty-state" style={{marginBlock:70}}><span className="eyebrow">404</span><h1>We couldn’t find that page.</h1><p>It may have moved, or the link may be out of date.</p><Link className="button button-dark" href="/shop">Browse the catalog</Link></section>}
