'use client'

import { useState } from 'react'
import Image from 'next/image'
import { animate } from 'animejs/animation'
import { imageUrl, type Product } from '@/lib/product'

type GalleryImage = { storage_path: string; alt_text: string | null; sort_order: number }

export function ProductGallery({ product, images }: { product: Product; images: GalleryImage[] }) {
  const [active, setActive] = useState(0)
  const shown = images[active]
  const url = imageUrl(shown?.storage_path)

  function showPrevious() {
    setActive(current => (current - 1 + images.length) % images.length)
  }

  function showNext() {
    setActive(current => (current + 1) % images.length)
  }

  return <div className="product-gallery">
    <div className="detail-image-stage">
      {url ? <Image key={url} className="detail-image" src={url} alt={shown?.alt_text || product.name} fill sizes="(max-width: 900px) 100vw, 55vw" unoptimized preload onLoad={event => animate(event.currentTarget, { opacity: [0, 1], scale: [1.025, 1], duration: 420, ease: 'outCubic' })}/> : <span className="image-placeholder"><b>U</b><small>Product image coming soon</small></span>}
      {images.length > 1 && <>
        <button className="gallery-arrow gallery-arrow-previous" type="button" onClick={showPrevious} aria-label="Show previous product image">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m15 18-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <button className="gallery-arrow gallery-arrow-next" type="button" onClick={showNext} aria-label="Show next product image">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m9 18 6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <span className="gallery-image-count" aria-live="polite">{String(active + 1).padStart(2, '0')} <i>/</i> {String(images.length).padStart(2, '0')}</span>
      </>}
    </div>
    {images.length > 1 && <div className="product-thumbnails" aria-label="Choose product image">
      {images.map((image, index) => {
        const thumb = imageUrl(image.storage_path)
        return <button className={index === active ? 'is-active' : ''} key={image.storage_path} type="button" onClick={() => setActive(index)} aria-label={`Show product image ${index + 1}`} aria-pressed={index === active}>
          {thumb && <Image src={thumb} alt="" width={82} height={82} unoptimized/>}
        </button>
      })}
    </div>}
  </div>
}
