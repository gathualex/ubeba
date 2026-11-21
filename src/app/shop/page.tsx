import type { Metadata } from 'next'
import Link from 'next/link'
import { listProducts } from '@/lib/catalog'
import { ProductCard } from '@/components/product-card'

export const metadata: Metadata = {
  title: 'Shop the catalog',
  description: 'Browse products sourced from the USA in the Ubeba catalog.',
  alternates: { canonical: '/shop' },
}

type ShopParams = { q?: string; category?: string; sort?: string; page?: string; price_on_request?: string }

export default async function Shop({ searchParams }: { searchParams: Promise<ShopParams> }) {
  const params = await searchParams
  const page = Math.max(1, Math.floor(Number(params.page) || 1))
  const size = 20
  const priceOnRequest = params.price_on_request === '1'
  const sort = priceOnRequest ? 'newest' : params.sort || 'newest'
  const { products, categories, configured, count } = await listProducts({
    search: params.q,
    categorySlug: params.category,
    sort,
    priceOnRequest,
    limit: size,
    offset: (page - 1) * size,
  })
  const pages = Math.max(1, Math.ceil(count / size))
  const query = (pageNumber: number) => new URLSearchParams({
    q: params.q ?? '',
    category: params.category ?? '',
    sort,
    price_on_request: priceOnRequest ? '1' : '',
    page: String(pageNumber),
  }).toString()

  return <section className="shell catalog-results">
    <div className="page-head">
      <span className="eyebrow">The catalog</span>
      <h1>Find your next favourite.</h1>
      <p>USA sourced finds, ready for you to explore.</p>
    </div>
    <form className="catalog-controls" action="/shop">
      <label><input name="q" defaultValue={params.q} placeholder="Search products…" aria-label="Search products"/></label>
      <label><select name="category" defaultValue={params.category || ''}>
        <option value="">All categories</option>
        {categories.map(category => <option key={category.id} value={category.slug}>{category.name}</option>)}
      </select></label>
      <label><select name="sort" defaultValue={sort}>
        <option value="newest">Newest first</option>
        {!priceOnRequest && <>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </>}
      </select></label>
      <label className="catalog-checkbox"><input type="checkbox" name="price_on_request" value="1" defaultChecked={priceOnRequest}/><span>Price on request</span></label>
      <button>Apply filters</button>
    </form>
    {!configured ? <div className="setup-notice">Connect Supabase to show the product catalog.</div> : products.length ? <>
      <p className="eyebrow">{count} {count === 1 ? 'product' : 'products'} to explore</p>
      <div className="product-grid">{products.map(product => <ProductCard key={product.id} product={product}/>)}</div>
      {pages > 1 && <div className="pagination">
        {page > 1 && <Link href={`/shop?${query(page - 1)}`}>← Previous</Link>}
        <span>Page {page} of {pages}</span>
        {page < pages && <Link href={`/shop?${query(page + 1)}`}>Next →</Link>}
      </div>}
    </> : <div className="empty-state">
      <h3>No products found</h3>
      <p>Try another search or browse all products.</p>
      <Link className="button button-dark" href="/shop">Clear filters</Link>
    </div>}
  </section>
}
