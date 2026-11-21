import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase/server'
import { imageUrl, type Product } from '@/lib/catalog'
import { whatsappUrl } from '@/lib/whatsapp'
import { ProductGallery } from '@/components/product-gallery'
import { ProductViewTracker } from '@/components/product-view-tracker'
import { publicSiteOrigin } from '@/lib/site-url'
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;const db=await supabaseServer();const {data}=db?await db.from('products').select('name,description,product_images(storage_path)').eq('slug',slug).eq('published',true).maybeSingle():{data:null};if(!data)return {title:'Product unavailable'};const img=imageUrl(data.product_images?.[0]?.storage_path);const origin=await publicSiteOrigin();const productUrl=origin?`${origin}/product/${slug}`:undefined;const image=origin&&img?new URL(img,origin).toString():img;return {title:data.name,description:data.description?.slice(0,155)??`Ask Ubeba about ${data.name}.`,alternates:{canonical:productUrl??`/product/${slug}`},openGraph:{title:data.name,description:data.description?.slice(0,155)??undefined,url:productUrl,images:image?[image]:[]}}}
export default async function ProductPage({params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params
  const db=await supabaseServer()
  if(!db) return <section className="shell page-head"><h1>Catalog setup required</h1></section>

  const {data,error}=await db.from('products').select('*,categories(name,slug),product_images(storage_path,alt_text,sort_order)').eq('slug',slug).eq('published',true).maybeSingle()
  if(error||!data)notFound()

  const product=data as Product
  const images=(product.product_images??[]).slice().sort((a,b)=>a.sort_order-b.sort_order)
  const whatsapp=await whatsappUrl(product,`/product/${product.slug}`)

  return <>
    <ProductViewTracker slug={product.slug}/>
    <section className="shell product-detail-page">
      <nav className="breadcrumbs product-breadcrumbs" aria-label="Breadcrumb">
        <Link href="/shop">Shop</Link>
        {product.categories&&<><span aria-hidden="true">/</span><Link href={`/categories/${product.categories.slug}`}>{product.categories.name}</Link></>}
        <span aria-hidden="true">/</span><span aria-current="page">{product.name}</span>
      </nav>
      <div className="product-detail-layout">
        <ProductGallery product={product} images={images}/>
        <article className="product-detail-copy">
          <div className="product-detail-heading">
            <span className="eyebrow">{product.categories?.name??'USA find'}</span>
            <h1>{product.name}</h1>
            <span className={`detail-status detail-status-${product.status}`}><i/> {product.status}</span>
          </div>

          <div className="product-price-panel">
            <span className="eyebrow">Ubeba price</span>
            <strong>{product.price_on_request||product.price==null?'Price on request':`KES ${Number(product.price).toLocaleString()}`}</strong>
          </div>

          <div className="product-description-panel">
            <span className="eyebrow">About this find</span>
            <p>{product.description||'Ask us for more details about this product.'}</p>
          </div>

          <div className="product-detail-actions">
            {whatsapp?<a className="button detail-wa" href={whatsapp} target="_blank" rel="noopener noreferrer">Ask about this product <span aria-hidden="true">↗</span></a>:<p className="product-contact-unavailable">WhatsApp inquiries are temporarily unavailable.</p>}
            <p>Message us to confirm availability and get more details.</p>
          </div>
          <Link className="product-back-link" href="/shop"><span aria-hidden="true">←</span> Back to all finds</Link>
        </article>
      </div>
    </section>
  </>
}
