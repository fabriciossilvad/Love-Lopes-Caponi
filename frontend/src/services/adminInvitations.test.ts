import { afterEach, describe, expect, it, vi } from 'vitest';
import { createInvitation, getInvitation, invitationLink, InvitationApiError, listInvitations, updateInvitation } from './adminInvitations';
afterEach(()=>vi.unstubAllGlobals());
const input={displayName:'Família Silva',internalNotes:null,status:'ACTIVE' as const};
describe('admin invitations API',()=>{
 it('lists without exposing token in URL',async()=>{
  const fn=vi.fn().mockResolvedValue({ok:true,status:200,json:async()=>[]});vi.stubGlobal('fetch',fn);
  await expect(listInvitations('jwt')).resolves.toEqual([]);
  expect(fn.mock.calls[0][0]).toBe('/api/admin/invitations');
  expect(fn.mock.calls[0][1].headers.Authorization).toBe('Bearer jwt');
 });
 it('applies event and RSVP filters',async()=>{
  const fn=vi.fn().mockResolvedValue({ok:true,status:200,json:async()=>[]});vi.stubGlobal('fetch',fn);
  await listInvitations('jwt',{eventId:'event-id',rsvpStatus:'CONFIRMED'});
  expect(fn.mock.calls[0][0]).toContain('eventId=event-id');
  expect(fn.mock.calls[0][0]).toContain('rsvpStatus=CONFIRMED');
 });
 it('creates an invitation',async()=>{
  const fn=vi.fn().mockResolvedValue({ok:true,status:201,json:async()=>({id:'i1'})});vi.stubGlobal('fetch',fn);
  await createInvitation('jwt',input);
  expect(fn.mock.calls[0][1].method).toBe('POST');
  expect(JSON.parse(fn.mock.calls[0][1].body)).toEqual(input);
 });
 it('edits and reads details',async()=>{
  const fn=vi.fn().mockResolvedValue({ok:true,status:200,json:async()=>({id:'i1',guests:[]})});vi.stubGlobal('fetch',fn);
  await updateInvitation('jwt','i1',input);
  await getInvitation('jwt','i1');
  expect(fn.mock.calls[0][1].method).toBe('PATCH');
  expect(fn.mock.calls[1][0]).toBe('/api/admin/invitations/i1');
 });
 it('handles unauthorized access',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false,status:401}));
  await expect(listInvitations('bad')).rejects.toEqual(new InvitationApiError('unauthorized'));
 });
 it('builds the public invitation URL',()=>{
  expect(invitationLink('secret-token','https://example.com')).toBe('https://example.com/convite/secret-token');
 });
});
