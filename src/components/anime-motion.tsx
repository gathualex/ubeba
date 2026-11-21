'use client'

import { useEffect } from 'react'
import { animate } from 'animejs/animation'

const motionTargets = [
  '.brand',
  '.nav > *',
  '.hero-main > *',
  '.hero-art',
  '.section-head',
  '.product-card',
  '.category-strip > *',
  '.category-links > a',
  '.how-inner > *',
  '.contact-banner > *',
  '.footer-inner > *',
  '.category-hero-copy > *',
  '.category-hero-art',
  '.category-switcher',
  '.category-products-heading',
  '.product-detail-layout > *',
  '.catalog-controls',
  '.admin-panel > .section-head',
  '.login-box > *',
  '.admin-menu > *',
  '.admin-stats > *',
  '.stat-card',
  '.overview-recent > *',
  '.admin-categories-header > *',
  '.admin-categories-toolbar',
  '.category-table tbody tr',
  '.product-edit-header > *',
  '.product-edit-section',
  '.admin-form > label',
  '.overview-stat',
  '.overview-product-row',
  '.gallery-admin-item',
  '.bulk-product-entry',
  '.category-modal',
  '.image-crop-dialog',
].join(',')

export function AnimeMotion() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const animated = new WeakSet<Element>()
    let animationObserver: IntersectionObserver | null = null
    if ('IntersectionObserver' in window) {
      animationObserver = new IntersectionObserver(entries => {
          for (const entry of entries) {
            if (!entry.isIntersecting || animated.has(entry.target)) continue
            const target = entry.target as HTMLElement
            animated.add(target)
            animationObserver?.unobserve(target)
            const siblings = target.parentElement?.querySelectorAll(motionTargets)
            const index = siblings ? Array.from(siblings).indexOf(target) : 0
            const isCard = target.matches('.product-card, .gallery-admin-item, .category-table tbody tr')
            animate(target, {
              opacity: [0, 1],
              y: [isCard ? 18 : 14, 0],
              scale: isCard ? [0.985, 1] : [1, 1],
              duration: isCard ? 560 : 500,
              delay: Math.min(Math.max(index, 0) * 55, 275),
              ease: 'outCubic',
            })
          }
        }, { threshold: 0.12, rootMargin: '0px 0px -36px 0px' })
    }

    const watch = (root: ParentNode) => {
      const elements = root instanceof Element && root.matches(motionTargets)
        ? [root, ...root.querySelectorAll(motionTargets)]
        : root.querySelectorAll(motionTargets)
      elements.forEach(element => {
        if (animated.has(element)) return
        if (animationObserver) animationObserver.observe(element)
        else {
          animated.add(element)
          animate(element, { opacity: [0, 1], y: [14, 0], duration: 500, ease: 'outCubic' })
        }
      })
    }

    watch(document)
    const onPointerOver = (event: PointerEvent) => {
      if (!(event.target instanceof Element)) return
      const icon = event.target.closest<HTMLElement>('.button > span[aria-hidden="true"], .category-hero-link > span[aria-hidden="true"]')
      if (!icon || (event.relatedTarget instanceof Node && icon.contains(event.relatedTarget))) return
      animate(icon, { x: [0, 4], duration: 220, ease: 'outBack' })
    }
    const onPointerOut = (event: PointerEvent) => {
      if (!(event.target instanceof Element)) return
      const icon = event.target.closest<HTMLElement>('.button > span[aria-hidden="true"], .category-hero-link > span[aria-hidden="true"]')
      if (!icon || (event.relatedTarget instanceof Node && icon.contains(event.relatedTarget))) return
      animate(icon, { x: [4, 0], duration: 180, ease: 'outQuad' })
    }
    document.addEventListener('pointerover', onPointerOver)
    document.addEventListener('pointerout', onPointerOut)
    const mutationObserver = new MutationObserver(records => {
      for (const record of records) {
        record.addedNodes.forEach(node => {
          if (node instanceof Element) watch(node)
        })
      }
    })
    mutationObserver.observe(document.body, { childList: true, subtree: true })

    return () => {
      mutationObserver.disconnect()
      animationObserver?.disconnect()
      document.removeEventListener('pointerover', onPointerOver)
      document.removeEventListener('pointerout', onPointerOut)
    }
  }, [])

  return null
}
