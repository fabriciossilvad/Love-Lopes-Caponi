import { afterEach, describe, expect, it, vi } from 'vitest';
import { CONTENT_FIELDS, contentValue, fetchSiteContents, toContentMap, SiteContentError } from './siteContents';
import { AdminSiteContentError, listAdminSiteContents, saveAdminSiteContent } from './adminSiteContents';
afterEach(()=>vi.unstubAllGlobals());
describe('site content',()=>{
 it('falls back to defaults when content is absent or blank',()=>{
  expect(contentValue({},'home.title')).toBe('Love, Lopes & Caponi');
  expect(contentValue({'home.title':'   '},'home.title')).toBe('Love, Lopes & Caponi');
 });
 it('uses saved content and ignores unknown keys',()=>{
  const map=toContentMap([{key:'home.title',value:'Nossa celebração',updated_at:''},{key:'unknown',value:'ignore',updated_at:''}]);
  expect(contentValue(map,'home.title')).toBe('Nossa celebração');
  expect(Object.keys(map)).toEqual(['home.title']);
 });
 it('keeps distinct field keys',()=>expect(new Set(CONTENT_FIELDS.map(field=>field.key)).size).toBe(CONTENT_FIELDS.length));
 it('fetches public content without authorization',async()=>{
  const fn=vi.fn().mockResolvedValue({ok:true,status:200,json:async()=>[]});vi.stubGlobal('fetch',fn);
  await expect(fetchSiteContents()).resolves.toEqual([]);
  expect(fn.mock.calls[0][0]).toBe('/api/site-contents');
  expect(fn.mock.calls[0][1].headers).toBeUndefined();
 });
 it('rejects malformed public response',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,status:200,json:async()=>({})}));
  await expect(fetchSiteContents()).rejects.toBeInstanceOf(SiteContentError);
 });
 it('loads administrative content with token',async()=>{
  const fn=vi.fn().mockResolvedValue({ok:true,status:200,json:async()=>[]});vi.stubGlobal('fetch',fn);
  await expect(listAdminSiteContents('jwt')).resolves.toEqual([]);
  expect(fn.mock.calls[0][1].headers.Authorization).toBe('Bearer jwt');
 });
 it('saves nullable content via PUT',async()=>{
  const fn=vi.fn().mockResolvedValue({ok:true,status:200,json:async()=>({key:'home.title',value:null})});vi.stubGlobal('fetch',fn);
  await saveAdminSiteContent('jwt','home.title',null);
  expect(fn.mock.calls[0][0]).toBe('/api/admin/site-contents/home.title');
  expect(fn.mock.calls[0][1].method).toBe('PUT');
  expect(JSON.parse(fn.mock.calls[0][1].body)).toEqual({value:null});
 });
 it('handles expired admin session',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false,status:401}));
  await expect(listAdminSiteContents('jwt')).rejects.toEqual(new AdminSiteContentError('unauthorized'));
 });
});
