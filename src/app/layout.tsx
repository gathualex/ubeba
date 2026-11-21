import type { Metadata } from 'next'
import './globals.css'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { FloatingWhatsApp } from '@/components/floating-whatsapp'
import { AnimeMotion } from '@/components/anime-motion'
import Script from 'next/script'

export const metadata: Metadata = { metadataBase:new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'), title:{default:'Ubeba — USA finds, made closer',template:'%s | Ubeba'}, description:'Discover products sourced from the USA. Browse the Ubeba catalog and ask us about availability on WhatsApp.', robots:{index:true,follow:true} }
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en" data-theme="light" suppressHydrationWarning><head><Script src="/theme-init.js" strategy="beforeInteractive"/></head><body><Header/><main>{children}</main><Footer/><FloatingWhatsApp/><AnimeMotion/></body></html> }
