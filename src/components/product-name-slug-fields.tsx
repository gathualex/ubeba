'use client'

import { useState } from 'react'

type ProductNameSlugFieldsProps = {
  nameField: string
  slugField: string
}

const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'

function createSuffix() {
  const bytes = new Uint8Array(6)
  window.crypto.getRandomValues(bytes)
  return Array.from(bytes, value => alphabet[value % alphabet.length]).join('')
}

function createSlugPrefix(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 133)
    .replace(/-+$/g, '')
}

export function ProductNameSlugFields({ nameField, slugField }: ProductNameSlugFieldsProps) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [suffix, setSuffix] = useState('')
  const [autoSlug, setAutoSlug] = useState(true)
  const nameId = `${nameField}-input`
  const slugId = `${slugField}-input`
  const slugHelpId = `${slugField}-help`

  function updateName(value: string) {
    setName(value)
    if (!autoSlug) return
    const randomSuffix = suffix || createSuffix()
    if (!suffix) setSuffix(randomSuffix)
    const prefix = createSlugPrefix(value)
    setSlug(prefix ? `${prefix}-${randomSuffix}` : '')
  }

  return <>
    <label htmlFor={nameId}>Product name<input id={nameId} name={nameField} value={name} onChange={event => updateName(event.target.value)} required minLength={2} maxLength={120}/></label>
    <label htmlFor={slugId}>URL slug<input id={slugId} name={slugField} value={slug} onChange={event => { setSlug(event.target.value); setAutoSlug(false) }} required pattern="[a-z0-9]+(-[a-z0-9]+)*" aria-describedby={slugHelpId}/><small id={slugHelpId} className="product-slug-help">Generated from the product name with a unique 6-character suffix. You can edit it.</small></label>
  </>
}
