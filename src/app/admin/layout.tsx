import Link from 'next/link'
import { getAdminContext } from '@/lib/admin'
import { logoutAction } from './actions'
export const metadata={robots:{index:false,follow:false}}
export const dynamic='force-dynamic'
export default async function AdminLayout({children}:{children:React.ReactNode}){const {isAdmin}=await getAdminContext();return <div className="shell admin-wrap">{isAdmin&&<div className="admin-menu"><strong>Admin</strong><Link href="/admin">Overview</Link><Link href="/admin/products">Products</Link><Link href="/admin/categories">Categories</Link><Link href="/admin/settings">Settings</Link><form action={logoutAction}><button className="ask-link" style={{border:0,background:'none',cursor:'pointer'}}>Sign out</button></form></div>}{children}</div>}
