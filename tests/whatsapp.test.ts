import { afterEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { resolveWhatsappPhoneNumber, whatsappUrl } from '../src/lib/whatsapp'

describe('WhatsApp inquiry links', () => {
  const site=process.env.NEXT_PUBLIC_SITE_URL
  afterEach(()=>{if(site===undefined)delete process.env.NEXT_PUBLIC_SITE_URL;else process.env.NEXT_PUBLIC_SITE_URL=site})
  it('includes encoded product, price and canonical URL', async()=>{process.env.NEXT_PUBLIC_SITE_URL='https://ubeba.example';const url=await whatsappUrl({id:'x',name:'Camera & lens',slug:'camera',price:1200,currency:'KES',price_on_request:false,status:'available',featured:false,category_id:null,description:null},'/product/camera',{whatsapp_phone:'+254 700-111222'});assert.ok(url);const parsed=new URL(url!);assert.equal(parsed.pathname,'/254700111222');assert.match(parsed.searchParams.get('text')!,/Camera & lens/);assert.match(parsed.searchParams.get('text')!,/KES 1,200/);assert.match(parsed.searchParams.get('text')!,/https:\/\/ubeba\.example\/product\/camera/)})
  it('returns null when the database contact is empty', async()=>{assert.equal(await whatsappUrl(undefined,undefined,{whatsapp_phone:''}),null)})
  it('marks requested prices clearly', async()=>{const url=await whatsappUrl({id:'x',name:'Lamp',slug:'lamp',price:null,currency:'KES',price_on_request:true,status:'available',featured:false,category_id:null,description:null},undefined,{whatsapp_phone:'254700111222'});assert.match(new URL(url!).searchParams.get('text')!,/price on request/)})
  it('normalizes the database-configured WhatsApp number', async()=>{const phone=await resolveWhatsappPhoneNumber({whatsapp_phone:'+254 700-222333'});assert.equal(phone,'254700222333')})
})
