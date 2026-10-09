import type { RsvpStatus } from '../types/invitation';
export type RsvpChoice = Exclude<RsvpStatus, 'PENDING'>;
export interface RsvpResult { guest_id: string; event_id: string; rsvp_status: RsvpChoice; responded_at: string }
export class RsvpError extends Error { constructor(public readonly kind: 'not-allowed' | 'network') { super(kind); } }
export async function saveRsvp(input: {token:string;guestId:string;eventId:string;status:RsvpChoice}): Promise<RsvpResult> {
  let response: Response;
  try { response = await fetch('/api/rsvp', { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(input) }); }
  catch { throw new RsvpError('network'); }
  if (response.status===400 || response.status===403 || response.status===404) throw new RsvpError('not-allowed');
  if (!response.ok) throw new RsvpError('network');
  try {
    const data:unknown=await response.json();
    if (!data || typeof data!=='object' || !('guest_id' in data) || !('event_id' in data) || !('rsvp_status' in data) || !('responded_at' in data) || data.guest_id!==input.guestId || data.event_id!==input.eventId || data.rsvp_status!==input.status || typeof data.responded_at!=='string') throw new Error('Invalid response');
    return data as RsvpResult;
  } catch { throw new RsvpError('network'); }
}
