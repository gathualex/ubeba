'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { animate } from 'animejs/animation'

type ProductCardImageProps = {
  href: string
  name: string
  images: { src: string; alt: string }[]
  sizes: string
  status?: string
  featured?: boolean
}

export function ProductCardImage({ href, name, images, sizes, status, featured }: ProductCardImageProps) {
  const imageRef = useRef<HTMLImageElement>(null)
  const [index, setIndex] = useState(0)
  const [hovering, setHovering] = useState(false)
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null)
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const current = images[index]
  const loaded = loadedSrc === current?.src
  const failed = failedSrc === current?.src

  useEffect(() => {
    const preloadAdditionalImages = () => {
      for (const imageData of images.slice(1)) {
        const preload = new window.Image()
        preload.decoding = 'async'
        preload.fetchPriority = 'low'
        preload.src = imageData.src
      }
    }

    if (typeof window.requestIdleCallback === 'function') {
      const idleId = window.requestIdleCallback(preloadAdditionalImages, { timeout: 1200 })
      return () => window.cancelIdleCallback(idleId)
    }
    const timer = window.setTimeout(preloadAdditionalImages, 250)
    return () => window.clearTimeout(timer)
  }, [images])

  useEffect(() => {
    const image = imageRef.current
    if (image?.complete && image.naturalWidth > 0) setLoadedSrc(current?.src ?? null)
  }, [current?.src])

  useEffect(() => {
    if (!hovering || images.length < 2 || index >= images.length - 1) return
    const timer = window.setTimeout(() => {
      setIndex(currentIndex => Math.min(currentIndex + 1, images.length - 1))
    }, 1400)
    return () => window.clearTimeout(timer)
  }, [hovering, images.length, index])

  function stopCarousel() {
    setHovering(false)
    setIndex(0)
  }

  return <Link
    className={`product-photo${status === 'sold' ? ' is-out-of-stock' : ''}`}
    href={href}
    aria-label={`View ${name}`}
    onMouseEnter={() => setHovering(true)}
    onMouseLeave={stopCarousel}
    onFocus={() => setHovering(true)}
    onBlur={stopCarousel}
  >
    {current && <span className="product-image-frame" aria-busy={!loaded && !failed}>
      {!loaded && !failed && <span className="product-image-skeleton" aria-hidden="true"><b>U</b><i/></span>}
      {!failed && <Image
        key={current.src}
        ref={imageRef}
        className={`product-card-image${loaded ? ' is-loaded' : ''}`}
        src={current.src}
        alt={current.alt}
        fill
        sizes={sizes}
        unoptimized
        onLoad={event => {
          setLoadedSrc(current.src)
          animate(event.currentTarget, { opacity: [0, 1], duration: 380, ease: 'outCubic' })
        }}
        onError={() => setFailedSrc(current.src)}
      />}
      {failed && <span className="image-placeholder"><b>U</b><small>Image unavailable</small></span>}
      {images.length > 1 && <span className="product-image-dots" aria-hidden="true">
        {images.map((image, dotIndex) => <i key={image.src} className={dotIndex === index ? 'is-active' : undefined}/>) }
      </span>}
    </span>}
    {!current && <span className="image-placeholder"><b>U</b><small>Product image coming soon</small></span>}
    {status === 'sold' ? <span className="status out-of-stock-tag">Out of stock</span> : status && status !== 'available' && <span className="status">{status}</span>}
    {featured && <span className="featured">Featured</span>}
  </Link>
}
