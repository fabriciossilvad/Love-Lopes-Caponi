import { afterEach, describe, expect, it, vi } from 'vitest';
import { AdminGiftError, createAdminGift, listAdminGifts, updateAdminGift, uploadGiftImage } from './adminGifts';
afterEach(()=>vi.unstubAllGlobals());
const input={eventId:'event-id',categoryId:null,name:'Jogo de panelas',description:null,estimatedValue:250,quantity:2,status:'ACTIVE' as const,displayOrder:0};
describe('admin gifts API',()=>{
 it('lists gifts with admin authorization',async()=>{
  const fn=vi.fn().mockResolvedValue({ok:true,status:200,json:async()=>[]});vi.stubGlobal('fetch',fn);
  await expect(listAdminGifts('jwt')).resolves.toEqual([]);
  expect(fn.mock.calls[0][0]).toBe('/api/admin/gifts');
  expect(fn.mock.calls[0][1].headers.Authorization).toBe('Bearer jwt');
 });
 it('creates a gift',async()=>{
  const fn=vi.fn().mockResolvedValue({ok:true,status:201,json:async()=>({id:'gift-id'})});vi.stubGlobal('fetch',fn);
  await createAdminGift('jwt',input);
  expect(fn.mock.calls[0][1].method).toBe('POST');
  expect(JSON.parse(fn.mock.calls[0][1].body)).toEqual(input);
 });
 it('updates a gift',async()=>{
  const fn=vi.fn().mockResolvedValue({ok:true,status:200,json:async()=>({id:'gift-id'})});vi.stubGlobal('fetch',fn);
  await updateAdminGift('jwt','gift-id',input);
  expect(fn.mock.calls[0][0]).toBe('/api/admin/gifts/gift-id');
  expect(fn.mock.calls[0][1].method).toBe('PATCH');
 });
 it('uploads multipart image without manually setting content type',async()=>{
  const fn=vi.fn().mockResolvedValue({ok:true,status:201,json:async()=>({imagePath:'gift-id/file.png',publicUrl:'https://example.com/file.png'})});vi.stubGlobal('fetch',fn);
  const file=new File(['test'],'image.png',{type:'image/png'});
  await uploadGiftImage('jwt','gift-id',file);
  expect(fn.mock.calls[0][0]).toBe('/api/admin/gifts/gift-id/image');
  expect(fn.mock.calls[0][1].body).toBeInstanceOf(FormData);
  expect(fn.mock.calls[0][1].headers).not.toHaveProperty('Content-Type');
 });
 it('rejects oversized files',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false,status:413}));
  await expect(listAdminGifts('jwt')).rejects.toEqual(new AdminGiftError('too-large'));
 });
 it('rejects expired sessions',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false,status:401}));
  await expect(listAdminGifts('jwt')).rejects.toEqual(new AdminGiftError('unauthorized'));
 });
});
