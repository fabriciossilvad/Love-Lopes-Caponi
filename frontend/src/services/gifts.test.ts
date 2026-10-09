import {afterEach,describe,expect,it,vi} from 'vitest';
import {cancelGift,fetchGifts,GiftError,reserveGift} from './gifts';
afterEach(()=>vi.unstubAllGlobals());
describe('gift service',()=>{
 it('loads event catalog',async()=>{const fn=vi.fn().mockResolvedValue({ok:true,status:200,json:async()=>[]});vi.stubGlobal('fetch',fn);await expect(fetchGifts('token','event')).resolves.toEqual([]);expect(fn.mock.calls[0][0]).toContain('/api/events/event/gifts?token=token')});
 it('reserves a gift',async()=>{const fn=vi.fn().mockResolvedValue({ok:true,status:201,json:async()=>({reservation_id:'r1',gift_id:'g1',status:'ACTIVE',reserved_at:'now'})});vi.stubGlobal('fetch',fn);await expect(reserveGift('token','g1')).resolves.toMatchObject({reservation_id:'r1'});expect(fn.mock.calls[0][1].method).toBe('POST')});
 it('handles unavailable gifts',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false,status:409}));await expect(reserveGift('token','g1')).rejects.toEqual(new GiftError('unavailable'))});
 it('cancels using token',async()=>{const fn=vi.fn().mockResolvedValue({ok:true,status:200,json:async()=>({status:'CANCELLED'})});vi.stubGlobal('fetch',fn);await cancelGift('token','r1');expect(JSON.parse(fn.mock.calls[0][1].body)).toEqual({token})});
});
