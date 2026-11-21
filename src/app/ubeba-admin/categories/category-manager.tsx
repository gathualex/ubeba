'use client'

import { useEffect, useMemo, useState } from 'react'
import { deleteCategory, saveCategory } from '../actions'

type Category = { id: string; name: string; slug: string; description: string | null; sort_order: number }

export function CategoryManager({ categories }: { categories: Category[] }) {
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [categoryName, setCategoryName] = useState('')
  const [categorySlug, setCategorySlug] = useState('')
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return categories
    return categories.filter(category => `${category.name} ${category.slug} ${category.description ?? ''}`.toLowerCase().includes(term))
  }, [categories, search])

  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen])

  function openAdd() {
    setEditing(null)
    setCategoryName('')
    setCategorySlug('')
    setIsOpen(true)
  }

  function openEdit(category: Category) {
    setEditing(category)
    setCategoryName(category.name)
    setCategorySlug(category.slug)
    setIsOpen(true)
  }

  function updateCategoryName(value: string) {
    setCategoryName(value)
    if (editing) return
    const base = value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || (value.trim() ? 'category' : '')
    if (!base) {
      setCategorySlug('')
      return
    }
    let candidate = base
    let suffix = 2
    while (categories.some(category => category.slug === candidate)) candidate = `${base}-${suffix++}`
    setCategorySlug(candidate)
  }

  return <div className="admin-panel admin-categories-page">
    <header className="admin-categories-header">
      <div>
        <span className="eyebrow">Organization</span>
        <h1>Categories</h1>
        <p>Organize products into collections customers can browse.</p>
      </div>
      <button className="button button-dark" type="button" onClick={openAdd}><span aria-hidden="true">＋</span> Add category</button>
    </header>

    <div className="admin-categories-toolbar">
      <span>{categories.length} {categories.length === 1 ? 'category' : 'categories'}</span>
      <label className="category-search">
        <span aria-hidden="true">⌕</span>
        <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search categories" aria-label="Search categories"/>
      </label>
    </div>

    {filtered.length ? <div className="category-table-wrap">
      <table className="category-table">
        <thead><tr><th scope="col">Category</th><th scope="col">Description</th><th scope="col">Order</th><th scope="col"><span className="visually-hidden">Actions</span></th></tr></thead>
        <tbody>{filtered.map(category => <tr key={category.id}>
          <td><div className="category-table-name"><strong>{category.name}</strong></div></td>
          <td className="category-table-description">{category.description || <span className="category-no-description">No description</span>}</td>
          <td><span className="category-order-pill">{category.sort_order}</span></td>
          <td><div className="category-row-actions">
            <button type="button" className="category-action-icon" onClick={() => openEdit(category)} aria-label={`Edit ${category.name}`} title={`Edit ${category.name}`}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5 4 4M4 20l4.3-.9L19 8.4a2.1 2.1 0 0 0-3-3L5.3 16.1 4 20Z"/></svg>
            </button>
            <form action={deleteCategory} onSubmit={event => {
              if (!window.confirm(`Delete “${category.name}”?`)) event.preventDefault()
            }}>
              <input type="hidden" name="id" value={category.id}/>
              <button className="category-action-icon category-delete-button" type="submit" aria-label={`Delete ${category.name}`} title={`Delete ${category.name}`}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6m4-6v6M5.5 7l1 13h11l1-13M9 7V4h6v3"/></svg>
              </button>
            </form>
          </div></td>
        </tr>)}</tbody>
      </table>
    </div> : <div className="category-table-empty">
      <span aria-hidden="true">◇</span>
      <h2>{search ? 'No matching categories' : 'No categories yet'}</h2>
      <p>{search ? 'Try a different name or clear your search.' : 'Create a category to help customers browse your products.'}</p>
      {!search && <button className="button button-dark" type="button" onClick={openAdd}>Add your first category</button>}
    </div>}

    {isOpen && <div className="category-modal-backdrop" onMouseDown={event => {
      if (event.target === event.currentTarget) setIsOpen(false)
    }}>
      <section className="category-modal" role="dialog" aria-modal="true" aria-labelledby="category-modal-title">
        <header className="category-modal-header">
          <div><span className="eyebrow">Category details</span><h2 id="category-modal-title">{editing ? 'Edit category' : 'Add a category'}</h2></div>
          <button type="button" className="category-modal-close" onClick={() => setIsOpen(false)} aria-label="Close dialog">×</button>
        </header>
        <form action={saveCategory} className="category-modal-form">
          {editing && <input type="hidden" name="id" value={editing.id}/>}
          <input type="hidden" name="slug" value={categorySlug}/>
          <label>Name<input name="name" value={categoryName} onChange={event => updateCategoryName(event.target.value)} required minLength={2} maxLength={80} autoFocus/></label>
          <label>Description<textarea name="description" defaultValue={editing?.description ?? ''} maxLength={800} rows={4} placeholder="A short introduction to this collection"/></label>
          <label>Display order<input name="sort_order" type="number" min="0" step="1" defaultValue={editing?.sort_order ?? categories.length}/><small>Lower numbers appear first.</small></label>
          <footer className="category-modal-actions">
            <button className="button button-outline" type="button" onClick={() => setIsOpen(false)}>Cancel</button>
            <button className="button button-dark" type="submit">{editing ? 'Save category' : 'Create category'}</button>
          </footer>
        </form>
      </section>
    </div>}
  </div>
}
