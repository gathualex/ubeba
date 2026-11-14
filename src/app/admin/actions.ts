'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { supabaseServer } from '@/lib/supabase/server'
import { z } from 'zod'
async function admin(){const db=await supabaseServer();if(!db)throw new Error('Supabase is not configured.');const {data:{user}}=await db.auth.getUser();if(!user)redirect('/admin/login');const {data}=await db.from('admin_users').select('user_id').eq('user_id',user.id).maybeSingle();if(!data)redirect('/admin/login?error=unauthorized');return db}
const productSchema=z.object({name:z.string().trim().min(2).max(120),slug:z.string().trim().min(2).max(140).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),description:z.string().max(5000),price:z.string(),category_id:z.string(),status:z.enum(['available','reserved','sold']),published:z.boolean(),featured:z.boolean(),price_on_request:z.boolean()})
async function saveImages(db:NonNullable<Awaited<ReturnType<typeof supabaseServer>>>,productId:string,files:File[]){
  const validFiles=files.filter(file=>file.size>0)
  for(const file of validFiles)if(!['image/jpeg','image/png','image/webp','image/avif'].includes(file.type)||file.size>8*1024*1024)throw new Error(`Unsupported image: ${file.name}. Use JPG, PNG, WebP or AVIF under 8 MB.`)
  if(!validFiles.length)return
  const {data:existing,error:queryError}=await db.from('product_images').select('sort_order').eq('product_id',productId).order('sort_order',{ascending:false}).limit(1).maybeSingle()
  if(queryError)throw new Error(`Could not load existing product images: ${queryError.message}`)
  const startOrder=(existing?.sort_order??-1)+1
  const uploads=await Promise.allSettled(validFiles.map(async(file,index)=>{
    const ext=file.type==='image/jpeg'?'jpg':file.type.split('/')[1]
    const path=`${productId}/${crypto.randomUUID()}.${ext}`
    const {error}=await db.storage.from('product-images').upload(path,file,{contentType:file.type,upsert:false})
    if(error)throw new Error(`Image upload failed: ${error.message}`)
    return {path,image:{product_id:productId,storage_path:path,alt_text:file.name.replace(/\.[^.]+$/,''),sort_order:startOrder+index}}
  }))
  const uploaded=uploads.flatMap(result=>result.status==='fulfilled'?[result.value]:[])
  const failed=uploads.find(result=>result.status==='rejected')
  if(failed){
    if(uploaded.length){
      const {error}=await db.storage.from('product-images').remove(uploaded.map(item=>item.path))
      if(error)throw new Error(`${failed.reason instanceof Error?failed.reason.message:String(failed.reason)} Cleanup failed: ${error.message}`)
    }
    throw failed.reason instanceof Error?failed.reason:new Error(String(failed.reason))
  }
  const {error:insertError}=await db.from('product_images').insert(uploads.flatMap(result=>result.status==='fulfilled'?[result.value.image]:[]))
  if(insertError){
    const {error:cleanupError}=await db.storage.from('product-images').remove(uploaded.map(item=>item.path))
    if(cleanupError)throw new Error(`Could not save product images: ${insertError.message}. Storage cleanup failed: ${cleanupError.message}`)
    throw new Error(insertError.message)
  }
}
export async function loginAction(form:FormData){const db=await supabaseServer();if(!db)redirect('/admin/login?error=setup');const email=String(form.get('email')||''),password=String(form.get('password')||'');const {error}=await db.auth.signInWithPassword({email,password});if(error)redirect('/admin/login?error=invalid');const {data:{user}}=await db.auth.getUser();const {data}=await db.from('admin_users').select('user_id').eq('user_id',user!.id).maybeSingle();if(!data){await db.auth.signOut();redirect('/admin/login?error=unauthorized')}redirect('/admin')}
export async function logoutAction(){const db=await supabaseServer();await db?.auth.signOut();redirect('/admin/login')}
export async function createProduct(form:FormData){const db=await admin();const val=productSchema.safeParse({name:form.get('name'),slug:form.get('slug'),description:form.get('description')||'',price:form.get('price')||'',category_id:form.get('category_id')||'',status:form.get('status'),published:form.get('published')==='on',featured:form.get('featured')==='on',price_on_request:form.get('price_on_request')==='on'});if(!val.success)throw new Error(val.error.issues[0]?.message||'Check product details.');const v=val.data;const amount=v.price?Number(v.price):null;if(amount!==null&&(!Number.isFinite(amount)||amount<0))throw new Error('Enter a valid non-negative price.');const {data,error}=await db.from('products').insert({name:v.name,slug:v.slug,description:v.description,price:amount,category_id:v.category_id||null,status:v.status,published:false,featured:v.featured,price_on_request:v.price_on_request,currency:'KES'}).select('id').single();if(error)throw new Error(error.message);try{await saveImages(db,data.id,form.getAll('images').filter((f):f is File=>f instanceof File));const {error:publishError}=await db.from('products').update({published:v.published}).eq('id',data.id);if(publishError)throw new Error(publishError.message)}catch(error){const {data:images}=await db.from('product_images').select('storage_path').eq('product_id',data.id);if(images?.length)await db.storage.from('product-images').remove(images.map(image=>image.storage_path));await db.from('products').delete().eq('id',data.id);throw error}revalidatePath('/');revalidatePath('/shop');redirect('/admin/products?created=1')}

export async function createProducts(form:FormData){
  const db=await admin()
  const count=Number(form.get('product_count'))
  if(!Number.isInteger(count)||count<1||count>20)throw new Error('Add between 1 and 20 products per batch.')
  const entries:Array<{value:z.infer<typeof productSchema>;amount:number|null;files:File[]}>=[]
  let totalImageBytes=0
  for(let index=0;index<count;index++){
    const field=(name:string)=>form.get(`product_${index}_${name}`)
    const parsed=productSchema.safeParse({name:field('name'),slug:field('slug'),description:field('description')||'',price:field('price')||'',category_id:field('category_id')||'',status:field('status'),published:field('published')==='on',featured:field('featured')==='on',price_on_request:field('price_on_request')==='on'})
    if(!parsed.success)throw new Error(`Product ${index+1}: ${parsed.error.issues[0]?.message||'Check product details.'}`)
    const amount=parsed.data.price?Number(parsed.data.price):null
    if(amount!==null&&(!Number.isFinite(amount)||amount<0))throw new Error(`Product ${index+1}: enter a valid non-negative price.`)
    const files=form.getAll(`product_${index}_images`).filter((file):file is File=>file instanceof File&&file.size>0)
    for(const file of files){
      if(!['image/jpeg','image/png','image/webp','image/avif'].includes(file.type)||file.size>8*1024*1024)throw new Error(`Product ${index+1}: unsupported image ${file.name}. Use JPG, PNG, WebP or AVIF under 8 MB.`)
      totalImageBytes+=file.size
    }
    entries.push({value:parsed.data,amount,files})
  }
  if(totalImageBytes>60*1024*1024)throw new Error('Keep all images in one batch under 60 MB.')
  const slugs=new Set<string>()
  for(const [index,{value}] of entries.entries()){
    if(slugs.has(value.slug))throw new Error(`Product ${index+1}: each product must have a unique URL slug.`)
    slugs.add(value.slug)
  }
  const createdIds:string[]=[]
  try{
    for(const {value,amount} of entries){
      const {data,error}=await db.from('products').insert({name:value.name,slug:value.slug,description:value.description,price:amount,category_id:value.category_id||null,status:value.status,published:false,featured:value.featured,price_on_request:value.price_on_request,currency:'KES'}).select('id').single()
      if(error)throw new Error(error.message)
      createdIds.push(data.id)
    }
    for(const [index,entry] of entries.entries())await saveImages(db,createdIds[index],entry.files)
    for(const [index,{value}] of entries.entries())if(value.published){
      const {error}=await db.from('products').update({published:true}).eq('id',createdIds[index])
      if(error)throw new Error(error.message)
    }
  }catch(error){
    if(createdIds.length){
      const {data:images}=await db.from('product_images').select('storage_path').in('product_id',createdIds)
      if(images?.length)await db.storage.from('product-images').remove(images.map(image=>image.storage_path))
      await db.from('products').delete().in('id',createdIds)
    }
    throw error
  }
  revalidatePath('/')
  revalidatePath('/shop')
  revalidatePath('/admin/products')
  redirect('/admin/products')
}
export async function updateProduct(form:FormData){const db=await admin();const id=String(form.get('id'));const val=productSchema.safeParse({name:form.get('name'),slug:form.get('slug'),description:form.get('description')||'',price:form.get('price')||'',category_id:form.get('category_id')||'',status:form.get('status'),published:form.get('published')==='on',featured:form.get('featured')==='on',price_on_request:form.get('price_on_request')==='on'});if(!val.success)throw new Error(val.error.issues[0]?.message||'Check product details.');const v=val.data;const amount=v.price?Number(v.price):null;if(amount!==null&&(!Number.isFinite(amount)||amount<0))throw new Error('Enter a valid non-negative price.');const {error}=await db.from('products').update({name:v.name,slug:v.slug,description:v.description,price:amount,category_id:v.category_id||null,status:v.status,published:v.published,featured:v.featured,price_on_request:v.price_on_request,currency:'KES'}).eq('id',id);if(error)throw new Error(error.message);await saveImages(db,id,form.getAll('images').filter((f):f is File=>f instanceof File));revalidatePath('/');revalidatePath('/shop');redirect('/admin/products')}
export async function deleteProduct(form:FormData){const db=await admin();const id=String(form.get('id'));const {data:images}=await db.from('product_images').select('storage_path').eq('product_id',id);if(images?.length){const {error}=await db.storage.from('product-images').remove(images.map(i=>i.storage_path));if(error)throw new Error(error.message)}const {error}=await db.from('products').delete().eq('id',id);if(error)throw new Error(error.message);revalidatePath('/');redirect('/admin/products')}
export async function deleteProductImage(form:FormData){const db=await admin();const id=String(form.get('id')),productId=String(form.get('product_id'));const {data:image}=await db.from('product_images').select('storage_path').eq('id',id).eq('product_id',productId).maybeSingle();if(!image)throw new Error('Image not found.');const {error:storageError}=await db.storage.from('product-images').remove([image.storage_path]);if(storageError)throw new Error(`Could not remove image: ${storageError.message}`);const {error}=await db.from('product_images').delete().eq('id',id).eq('product_id',productId);if(error)throw new Error(`Image file removed but its record needs cleanup: ${error.message}`);revalidatePath(`/admin/products/${productId}/edit`);revalidatePath(`/product`)}
export async function setImageOrder(form:FormData){const db=await admin();const id=String(form.get('id')),productId=String(form.get('product_id')),sort=Number(form.get('sort_order'));if(!Number.isInteger(sort)||sort<0)throw new Error('Image order must be a positive whole number.');const {error}=await db.from('product_images').update({sort_order:sort}).eq('id',id).eq('product_id',productId);if(error)throw new Error(error.message);revalidatePath(`/admin/products/${productId}/edit`);revalidatePath(`/product`)}
export async function saveCategory(form:FormData){const db=await admin();const id=String(form.get('id')||'');const payload={name:String(form.get('name')||'').trim(),slug:String(form.get('slug')||'').trim(),description:String(form.get('description')||'').trim(),sort_order:Number(form.get('sort_order')||0)};const schema=z.object({name:z.string().min(2).max(80),slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),description:z.string().max(800),sort_order:z.number().int().min(0)});const parsed=schema.safeParse(payload);if(!parsed.success)throw new Error(parsed.error.issues[0]?.message||'Check category details.');const result=id?await db.from('categories').update(parsed.data).eq('id',id):await db.from('categories').insert(parsed.data);if(result.error)throw new Error(result.error.message);revalidatePath('/');redirect('/admin/categories')}
export async function deleteCategory(form:FormData){const db=await admin();const id=String(form.get('id'));const {count}=await db.from('products').select('id',{count:'exact',head:true}).eq('category_id',id);if(count)throw new Error('Move or remove products in this category before deleting it.');const {error}=await db.from('categories').delete().eq('id',id);if(error)throw new Error(error.message);revalidatePath('/');redirect('/admin/categories')}
export async function saveWhatsAppPhone(form:FormData){
  const db=await admin()
  const phone=String(form.get('whatsapp_phone')||'').trim()
  const normalized=phone.replace(/\D/g,'')
  if(normalized.length<8||normalized.length>15)redirect('/admin/settings?error=phone')
  const {error}=await db.from('site_settings').upsert({id:'primary',whatsapp_phone:phone},{onConflict:'id'})
  if(error){
    console.error('Could not save WhatsApp contact:',error.message)
    if(error.code==='PGRST205'||error.code==='42P01')redirect('/admin/settings?error=migration')
    redirect('/admin/settings?error=save')
  }
  revalidatePath('/')
  revalidatePath('/shop')
  redirect('/admin/settings?saved=1')
}
