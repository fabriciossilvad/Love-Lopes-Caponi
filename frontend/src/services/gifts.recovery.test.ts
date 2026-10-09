import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchMyReservations, GiftError } from './gifts';
afterEach(() => vi.unstubAllGlobals());
describe('recover invitation reservations', () => {
 it('loads active reservations', async () => {
  const fetchMock=vi.fn().mockResolvedValue({ok:true,status:200,json:async()=>[{reservation_id:'r1',gift_id:'g1',event_id:'e1',status:'ACTIVE',reserved_at:'2026-10-09T12:00:00Z'}]});
  vi.stubGlobal('fetch',fetchMock);
  await expect(fetchMyReservations('invitation-token')).resolves.toHaveLength(1);
  expect(fetchMock.mock.calls[0][0]).toBe('/api/gift-reservations?token=invitation-token');
 });
 it('rejects invalid response shape', async () => {
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,status:200,json:async()=>[{reservation_id:'r1'}]}));
  await expect(fetchMyReservations('token')).rejects.toEqual(new GiftError('network'));
 });
});
