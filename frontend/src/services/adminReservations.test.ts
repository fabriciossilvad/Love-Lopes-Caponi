import { afterEach, describe, expect, it, vi } from 'vitest';
import { AdminReservationError, cancelAdminReservation, listAdminReservations } from './adminReservations';
afterEach(()=>vi.unstubAllGlobals());
describe('admin gift reservations',()=>{
 it('lists reservations using admin bearer token',async()=>{
  const fn=vi.fn().mockResolvedValue({ok:true,status:200,json:async()=>[]});vi.stubGlobal('fetch',fn);
  await expect(listAdminReservations('jwt')).resolves.toEqual([]);
  expect(fn.mock.calls[0][0]).toBe('/api/admin/gift-reservations');
  expect(fn.mock.calls[0][1].headers.Authorization).toBe('Bearer jwt');
 });
 it('releases a reservation with DELETE',async()=>{
  const fn=vi.fn().mockResolvedValue({ok:true,status:200,json:async()=>({status:'CANCELLED'})});vi.stubGlobal('fetch',fn);
  await cancelAdminReservation('jwt','reservation-id');
  expect(fn.mock.calls[0][0]).toBe('/api/admin/gift-reservations/reservation-id');
  expect(fn.mock.calls[0][1].method).toBe('DELETE');
 });
 it('rejects expired sessions',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false,status:401}));
  await expect(listAdminReservations('jwt')).rejects.toEqual(new AdminReservationError('unauthorized'));
 });
 it('rejects conflicting cancellations',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false,status:409}));
  await expect(cancelAdminReservation('jwt','reservation-id')).rejects.toEqual(new AdminReservationError('invalid'));
 });
 it('rejects unexpected payloads',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,status:200,json:async()=>({items:[]})}));
  await expect(listAdminReservations('jwt')).rejects.toEqual(new AdminReservationError('network'));
 });
});
