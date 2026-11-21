import Link from 'next/link'

export function ProductCreatePageShell({ title, description, eyebrow = 'New listing', children }: { title: string; description: string; eyebrow?: string; children: React.ReactNode }) {
  return <div className="admin-panel product-create-page">
    <header className="product-create-page-header">
      <Link className="product-create-page-back" href="/ubeba-admin/products"><span aria-hidden="true">←</span> Products</Link>
      <span className="eyebrow">Inventory · {eyebrow}</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
    <div className="product-create-page-content">{children}</div>
  </div>
}
