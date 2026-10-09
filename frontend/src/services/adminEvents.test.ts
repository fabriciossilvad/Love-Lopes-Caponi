import { afterEach, describe, expect, it, vi } from 'vitest';
import { createEvent, EventApiError, listEvents, updateEvent, type EventInput } from './adminEvents';
afterEach(()=>vi.unstubAllGlobals());
const input:EventInput={name:'Casamento',slug:'casamento',description:null,eventDate:'2027-08-14T18:00:00.000Z',venueName:null,address:null,mapsUrl:null,rsvpDeadline:null,status:'DRAFT',additionalInfo:null};
describe('admin events API',()=>{
 it('lists events with bearer token',async()=>{
  const fn=vi.fn().mockResolvedValue({ok:true,status:200,json:async()=>[]});vi.stubGlobal('fetch',fn);
  await expect(listEvents('jwt')).resolves.toEqual([]);
  expect(fn.mock.calls[0][0]).toBe('/api/admin/events');
  expect(fn.mock.calls[0][1].headers.Authorization).toBe('Bearer jwt');
 });
 it('creates an event using camelCase API fields',async()=>{
  const fn=vi.fn().mockResolvedValue({ok:true,status:201,json:async()=>({id:'e1'})});vi.stubGlobal('fetch',fn);
  await createEvent('jwt',input);
  expect(fn.mock.calls[0][1].method).toBe('POST');
  expect(JSON.parse(fn.mock.calls[0][1].body)).toEqual(input);
 });
 it('updates an event using PATCH',async()=>{
  const fn=vi.fn().mockResolvedValue({ok:true,status:200,json:async()=>({id:'e1'})});vi.stubGlobal('fetch',fn);
  await updateEvent('jwt','e1',input);
  expect(fn.mock.calls[0][0]).toBe('/api/admin/events/e1');
  expect(fn.mock.calls[0][1].method).toBe('PATCH');
 });
 it('identifies unauthorized sessions',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false,status:401}));
  await expect(listEvents('expired')).rejects.toEqual(new EventApiError('unauthorized'));
 });
 it('identifies invalid or conflicting event data',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false,status:409}));
  await expect(createEvent('jwt',input)).rejects.toEqual(new EventApiError('conflict'));
 });
});
