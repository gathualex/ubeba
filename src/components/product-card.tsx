import Link from 'next/link'
import { type Product } from '@/lib/product'
import { imageUrl } from '@/lib/product'
import { whatsappUrl } from '@/lib/whatsapp'
import { ProductCardImage } from '@/components/product-card-image'

export async function ProductCard({ product }: { product: Product }) {
  const images = (product.product_images ?? []).slice().sort((a,b)=>a.sort_order-b.sort_order).flatMap(image => {
    const src = imageUrl(image.storage_path)
    return src ? [{ src, alt: image.alt_text || product.name }] : []
  })
  const wa = await whatsappUrl(product, `/product/${product.slug}`)
  return <article className="product-card">
    <ProductCardImage href={`/product/${product.slug}`} name={product.name} images={images} status={product.status} featured={product.featured} sizes="(max-width: 527px) calc(100vw - 28px), (max-width: 750px) 48vw, (max-width: 900px) 33vw, 23vw"/>
    <div className="product-copy"><span className="eyebrow">{product.categories?.name ?? 'USA import'}</span><Link className="product-title" href={`/product/${product.slug}`}>{product.name}</Link>
      <div className="product-foot"><div className="product-price-meta"><strong>{product.price_on_request || product.price == null ? 'Price on request' : `KES ${Number(product.price).toLocaleString()}`}</strong>{Number(product.view_count ?? 0) > 0 && <span className="product-view-count" aria-label={`${Number(product.view_count).toLocaleString()} views`} title={`${Number(product.view_count).toLocaleString()} views`}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></svg><span>{Number(product.view_count).toLocaleString()}</span></span>}</div>{wa && <a className="ask-link product-ask-link" href={wa} target="_blank" rel="noopener noreferrer" aria-label={`Ask about ${product.name} on WhatsApp`} title={`Ask about ${product.name} on WhatsApp`}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 11.8a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.4-4.7A8.5 8.5 0 1 1 20.5 11.8Z"/><path d="M8.3 7.7c.2-.4.4-.4.7-.4h.4c.2 0 .3.1.4.4l.7 1.7c.1.2.1.4-.1.6l-.5.6c-.2.2-.2.4 0 .6.5.9 1.2 1.6 2.1 2.1.2.1.4.1.6-.1l.7-.8c.2-.2.4-.2.6-.1l1.6.8c.2.1.3.3.3.5-.1.8-.5 1.4-1.1 1.7-.6.3-1.3.4-2.1.1-1.3-.4-2.5-1.2-3.6-2.3-1.1-1.1-1.8-2.3-2.1-3.5-.2-.8 0-1.5.4-2.1Z"/></svg><span>Ask</span></a>}</div>
    </div>
  </article>
}
