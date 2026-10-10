import { afterEach, describe, expect, it, vi } from 'vitest';
import { AdminPhotoError, createAdminPhoto, listAdminPhotos, updateAdminPhoto } from './adminPhotos';
afterEach(()=>vi.unstubAllGlobals());
const fields={eventId:null,caption:'Nossa história',displayOrder:2,active:true};
describe('admin gallery API',()=>{
 it('lists photos with admin authorization',async()=>{
  const fn=vi.fn().mockResolvedValue({ok:true,status:200,json:async()=>[]});vi.stubGlobal('fetch',fn);
  await expect(listAdminPhotos('jwt')).resolves.toEqual([]);
  expect(fn.mock.calls[0][0]).toBe('/api/admin/photos');
  expect(fn.mock.calls[0][1].headers.Authorization).toBe('Bearer jwt');
 });
 it('uploads multipart with fields and file',async()=>{
  const fn=vi.fn().mockResolvedValue({ok:true,status:201,json:async()=>({photo:{id:'1'},publicUrl:'url'})});vi.stubGlobal('fetch',fn);
  await createAdminPhoto('jwt',new File(['image'],'photo.png',{type:'image/png'}),fields);
  const options=fn.mock.calls[0][1];
  expect(options.method).toBe('POST');
  expect(options.body).toBeInstanceOf(FormData);
  expect(options.body.get('displayOrder')).toBe('2');
  expect(options.body.get('active')).toBe('true');
  expect(options.headers).not.toHaveProperty('Content-Type');
 });
 it('updates photo metadata',async()=>{
  const fn=vi.fn().mockResolvedValue({ok:true,status:200,json:async()=>({id:'1'})});vi.stubGlobal('fetch',fn);
  await updateAdminPhoto('jwt','photo-id',{...fields,active:false});
  expect(fn.mock.calls[0][0]).toBe('/api/admin/photos/photo-id');
  expect(JSON.parse(fn.mock.calls[0][1].body).active).toBe(false);
 });
 it('rejects expired sessions',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false,status:401}));
  await expect(listAdminPhotos('jwt')).rejects.toEqual(new AdminPhotoError('unauthorized'));
 });
 it('rejects oversized images',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false,status:413}));
  await expect(listAdminPhotos('jwt')).rejects.toEqual(new AdminPhotoError('too-large'));
 });
});
