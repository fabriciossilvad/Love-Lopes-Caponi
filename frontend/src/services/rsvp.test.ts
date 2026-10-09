import { afterEach, describe, expect, it, vi } from 'vitest';
import { saveRsvp, RsvpError } from './rsvp';
afterEach(()=>vi.unstubAllGlobals());
const input={token:'token-de-teste',guestId:'guest-1',eventId:'event-1',status:'CONFIRMED' as const};
describe('saveRsvp',()=>{
 it('sends expected payload and accepts valid response',async()=>{const fetchMock=vi.fn().mockResolvedValue({ok:true,status:200,json:async()=>({guest_id:'guest-1',event_id:'event-1',rsvp_status:'CONFIRMED',responded_at:'2026-10-09T12:00:00Z'})});vi.stubGlobal('fetch',fetchMock);await expect(saveRsvp(input)).resolves.toMatchObject({rsvp_status:'CONFIRMED'});expect(fetchMock).toHaveBeenCalledWith('/api/rsvp',expect.objectContaining({method:'PUT',body:JSON.stringify(input)}));});
 it('rejects forbidden RSVP',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false,status:403}));await expect(saveRsvp(input)).rejects.toEqual(new RsvpError('not-allowed'));});
 it('handles connection errors',async()=>{vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('offline')));await expect(saveRsvp(input)).rejects.toEqual(new RsvpError('network'));});
 it('rejects malformed responses',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,status:200,json:async()=>({})}));await expect(saveRsvp(input)).rejects.toEqual(new RsvpError('network'));});
});
