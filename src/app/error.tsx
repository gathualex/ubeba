'use client'
export default function ErrorPage({reset}:{error:Error & {digest?:string};reset:()=>void}){return <section className="shell empty-state" style={{marginBlock:70}}><span className="eyebrow">Something went wrong</span><h1>That didn’t load properly.</h1><p>Please try again in a moment.</p><button className="button button-dark" onClick={()=>reset()}>Try again</button></section>}
