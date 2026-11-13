'use client'
import { useState } from 'react'
import Image from 'next/image'
import { imageUrl, type Product } from '@/lib/product'
type Image={storage_path:string;alt_text:string|null;sort_order:number}
export function ProductGallery({product,images}:{product:Product;images:Image[]}){const [active,setActive]=useState(0);const shown=images[active];const url=imageUrl(shown?.storage_path);return <div><div className="detail-image">{url?<Image src={url} alt={shown?.alt_text||product.name} width={900} height={900} sizes="(max-width: 640px) 100vw, 50vw" unoptimized/>:<span className="image-placeholder"><b>U</b><small>Product image coming soon</small></span>}</div>{images.length>1&&<div className="thumbs" aria-label="Product images">{images.map((im,i)=>{const src=imageUrl(im.storage_path);return <button key={im.storage_path} type="button" onClick={()=>setActive(i)} aria-label={`View image ${i+1}`} aria-pressed={i===active} style={{padding:0,border:i===active?'2px solid #183d34':'2px solid transparent',background:'none',cursor:'pointer'}}>{src&&<Image src={src} alt="" width={65} height={65} unoptimized/>}</button>})}</div>}</div>}
