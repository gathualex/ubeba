'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
type Preview={file:File;url:string}
export function ImageUpload({name='images'}:{name?:string}){
	const [items,setItems]=useState<Preview[]>([]),[error,setError]=useState('')
	useEffect(()=>()=>items.forEach(item=>URL.revokeObjectURL(item.url)),[items])
	function change(event:React.ChangeEvent<HTMLInputElement>){
		const all=Array.from(event.target.files??[])
		const valid=all.filter(file=>['image/jpeg','image/png','image/webp','image/avif'].includes(file.type)&&file.size<=8*1024*1024)
		setError(valid.length===all.length?'':`Some files were skipped. Use JPG, PNG, WebP or AVIF under 8 MB each.`)
		const transfer=new DataTransfer()
		valid.forEach(file=>transfer.items.add(file))
		event.target.files=transfer.files
		setItems(valid.map(file=>({file,url:URL.createObjectURL(file)})))
	}
	function remove(file:File){
		const next=items.filter(item=>item.file!==file)
		const input=document.querySelector<HTMLInputElement>(`input[name="${name}"]`)
		if(input){
			const transfer=new DataTransfer()
			next.forEach(item=>transfer.items.add(item.file))
			input.files=transfer.files
		}
		setItems(next)
	}
	return <div>
		<input type="file" name={name} accept="image/jpeg,image/png,image/webp,image/avif" multiple onChange={change}/>
		<p className="upload-help">Select multiple images together in the file picker. Hold Ctrl on Windows or Command on Mac while choosing files.</p>
		{error&&<p className="error" role="status">{error}</p>}
		{items.length>0&&<div className="upload-previews">{items.map(item=><div key={`${item.file.name}-${item.file.lastModified}`}><Image src={item.url} alt={`Preview: ${item.file.name}`} width={110} height={90} unoptimized/><small>{item.file.name}</small><button type="button" onClick={()=>remove(item.file)}>Remove</button></div>)}</div>}
	</div>
}
