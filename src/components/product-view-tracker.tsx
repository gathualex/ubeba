'use client'

import { useEffect } from 'react'

export function ProductViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `ubeba:product-view:${slug}`
    try {
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, 'pending')
    } catch {}

    fetch('/api/product-views', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
      keepalive: true,
    }).then(response => {
      if (!response.ok) throw new Error('View count request failed')
      try { sessionStorage.setItem(key, 'recorded') } catch {}
    }).catch(() => {
      try { sessionStorage.removeItem(key) } catch {}
    })
  }, [slug])

  return null
}