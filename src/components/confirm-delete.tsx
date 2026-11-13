'use client'
import type { FormEvent } from 'react'
export function ConfirmDelete({action,id,label='item',iconOnly=false}:{action:(form:FormData)=>void|Promise<void>;id:string;label?:string;iconOnly?:boolean}){
	function submit(event:FormEvent<HTMLFormElement>){if(!window.confirm(`Delete ${label}? This cannot be undone.`))event.preventDefault()}
	return <form action={action} onSubmit={submit} className={iconOnly?'confirm-delete-icon-form':undefined} style={{display:'inline'}}>
		<input type="hidden" name="id" value={id}/>
		<button className={iconOnly?'product-action-icon product-action-delete':undefined} aria-label={iconOnly?`Delete ${label}`:undefined} title={iconOnly?`Delete ${label}`:undefined} style={iconOnly?undefined:{border:0,background:'none',color:'#a13a2b',cursor:'pointer'}}>
			{iconOnly?<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m3 4v6m6-6v6"/></svg>:label}
		</button>
	</form>
}
