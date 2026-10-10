import { afterEach, describe, expect, it, vi } from 'vitest';
import { createGuest, GuestApiError, setGuestEvents, updateGuest } from './adminGuests';
afterEach(()=>vi.unstubAllGlobals());
const guest={invitationId:'invite-id',name:'Ana',phone:null,email:null,notes:null,status:'ACTIVE' as const,eventIds:['event-id']};
describe('admin guests API',()=>{
 it('creates a guest with event membership',async()=>{
  const fn=vi.fn().mockResolvedValue({ok:true,status:201,json:async()=>({id:'guest-id'})});vi.stubGlobal('fetch',fn);
  await createGuest('jwt',guest);
  expect(fn.mock.calls[0][0]).toBe('/api/admin/guests');
  expect(fn.mock.calls[0][1].headers.Authorization).toBe('Bearer jwt');
  expect(JSON.parse(fn.mock.calls[0][1].body)).toEqual(guest);
 });
 it('edits guest details without changing invitation',async()=>{
  const fn=vi.fn().mockResolvedValue({ok:true,status:200,json:async()=>({id:'guest-id'})});vi.stubGlobal('fetch',fn);
  const {name,phone,email,notes,status}=guest;
  await updateGuest('jwt','guest-id',{name,phone,email,notes,status});
  expect(fn.mock.calls[0][1].method).toBe('PATCH');
  expect(JSON.parse(fn.mock.calls[0][1].body)).not.toHaveProperty('invitationId');
 });
 it('sets guest event memberships using PUT',async()=>{
  const fn=vi.fn().mockResolvedValue({ok:true,status:200,json:async()=>({})});vi.stubGlobal('fetch',fn);
  await setGuestEvents('jwt','guest-id',['event-id']);
  expect(fn.mock.calls[0][0]).toBe('/api/admin/guests/guest-id/events');
  expect(fn.mock.calls[0][1].method).toBe('PUT');
  expect(JSON.parse(fn.mock.calls[0][1].body)).toEqual({eventIds:['event-id']});
 });
 it('rejects invalid data',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false,status:400}));
  await expect(createGuest('jwt',guest)).rejects.toEqual(new GuestApiError('invalid'));
 });
 it('identifies expired sessions',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false,status:401}));
  await expect(createGuest('jwt',guest)).rejects.toEqual(new GuestApiError('unauthorized'));
 });
});
