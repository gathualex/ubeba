import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { supabaseServer } from '@/lib/supabase/server'
import { listProducts } from '@/lib/catalog'
import { ProductCard } from '@/components/product-card'

type CategoryParams = { params: Promise<{ slug: string }>; searchParams?: Promise<{ page?: string }> }

export async function generateMetadata({ params }: CategoryParams): Promise<Metadata> {
  const { slug } = await params
  const db = await supabaseServer()
  const { data } = db
    ? await db.from('categories').select('name,description').eq('slug', slug).maybeSingle()
    : { data: null }

  return {
    title: data?.name ?? 'Category',
    description: data?.description || `Explore ${data?.name ?? 'this category'} in the Ubeba catalog.`,
    alternates: { canonical: `/categories/${slug}` },
  }
}

export default async function Category({ params, searchParams }: CategoryParams) {
  const { slug } = await params
  const query = searchParams ? await searchParams : {}
  const page = Math.max(1, Math.floor(Number(query.page) || 1))
  const pageSize = 20
  const db = await supabaseServer()

  if (!db) {
    return <section className="shell catalog-results"><div className="setup-notice">Connect Supabase to browse the catalog.</div></section>
  }

  const { data: category } = await db.from('categories').select('*').eq('slug', slug).maybeSingle()
  if (!category) notFound()

  const { products, count, categories } = await listProducts({ category: category.id, limit: pageSize, offset: (page - 1) * pageSize })
  const pages = Math.max(1, Math.ceil(count / pageSize))

  return <section className="shell category-page">
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <Link href="/">Home</Link><span aria-hidden="true">/</span><Link href="/shop">Shop</Link><span aria-hidden="true">/</span><span aria-current="page">{category.name}</span>
    </nav>

    <header className="category-hero">
      <div className="category-hero-copy">
        <span className="eyebrow">Explore the collection</span>
        <h1>{category.name}</h1>
        <p>{category.description || `A considered collection of ${category.name.toLowerCase()} finds, sourced from the USA.`}</p>
        <a className="category-hero-link" href="#category-products">Browse the collection <span aria-hidden="true">↓</span></a>
      </div>
      <div className="category-hero-art" aria-hidden="true">
        <span className="category-art-orbit" />
        <span className="category-art-disc" />
        <span className="category-art-card category-art-card-back" />
        <span className="category-art-card category-art-card-front"><i>U</i><b>GOOD FINDS</b><small>USA → KENYA</small></span>
      </div>
      <div className="category-hero-index"><span>Collection</span><b>{String(categories.findIndex(item => item.id === category.id) + 1).padStart(2, '0')}</b></div>
    </header>

    {categories.length > 1 && <nav className="category-switcher" aria-label="Browse categories">
      <span className="category-switcher-label">Browse categories</span>
      <div className="category-switcher-links">
        {categories.map(item => <Link key={item.id} href={`/categories/${item.slug}`} aria-current={item.id === category.id ? 'page' : undefined}>
          {item.name}<span aria-hidden="true">↗</span>
        </Link>)}
        <Link href="/shop">All products<span aria-hidden="true">↗</span></Link>
      </div>
    </nav>}

    <div className="category-products" id="category-products">
      <div className="category-products-heading">
        <div><span className="eyebrow">The collection</span><h2>Find your next favourite.</h2></div>
        <span className="category-product-count">{count} {count === 1 ? 'find' : 'finds'}</span>
      </div>
      {products.length ? <div className="product-grid">{products.map(product => <ProductCard key={product.id} product={product}/>)}</div> : <div className="empty-state category-empty">
        <span className="empty-icon" aria-hidden="true">✳</span><h3>New finds are on their way.</h3>
        <p>There aren’t any products in this collection just yet. Explore the full catalog in the meantime.</p>
        <Link className="button button-dark" href="/shop">Browse all products</Link>
      </div>}
      {pages > 1 && <nav className="pagination" aria-label="Category product pages">
        {page > 1 && <Link href={`/categories/${slug}?page=${page - 1}`}>← Previous</Link>}
        <span>Page {page} of {pages}</span>
        {page < pages && <Link href={`/categories/${slug}?page=${page + 1}`}>Next →</Link>}
      </nav>}
    </div>
  </section>
}
