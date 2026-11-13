import Link from 'next/link'
import Image from 'next/image'
import { type Product } from '@/lib/product'
import { imageUrl } from '@/lib/product'
import { whatsappUrl } from '@/lib/whatsapp'

export async function ProductCard({ product }: { product: Product }) {
  const image = imageUrl(product.product_images?.sort((a,b)=>a.sort_order-b.sort_order)[0]?.storage_path)
  const wa = await whatsappUrl(product, `/product/${product.slug}`)
  return <article className="product-card">
    <Link className="product-photo" href={`/product/${product.slug}`} aria-label={`View ${product.name}`}>
      {image ? <Image src={image} alt={product.product_images?.[0]?.alt_text || product.name} fill sizes="(max-width: 527px) calc(100vw - 28px), (max-width: 750px) 48vw, (max-width: 900px) 33vw, 23vw" unoptimized/> : <span className="image-placeholder"><b>U</b><small>Product image coming soon</small></span>}
      {product.status !== 'available' && <span className="status">{product.status}</span>}
      {product.featured && <span className="featured">Featured</span>}
    </Link>
    <div className="product-copy"><span className="eyebrow">{product.categories?.name ?? 'USA import'}</span><Link className="product-title" href={`/product/${product.slug}`}>{product.name}</Link>
      <div className="product-foot"><strong>{product.price_on_request || product.price == null ? 'Price on request' : `KES ${Number(product.price).toLocaleString()}`}</strong>{wa && <a className="ask-link" href={wa} target="_blank" rel="noopener noreferrer">Ask on WhatsApp ↗</a>}</div>
    </div>
  </article>
}
