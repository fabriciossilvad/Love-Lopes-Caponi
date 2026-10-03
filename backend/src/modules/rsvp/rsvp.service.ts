import { createSupabaseAnonClient } from '../../config/supabase.js';

import type { RsvpBody } from './rsvp.schemas.js';

export async function setRsvp(input: RsvpBody) {
  const supabase = createSupabaseAnonClient();

  const { data, error } = await supabase.rpc('set_rsvp', {
    p_token: input.token,
    p_guest_id: input.guestId,
    p_event_id: input.eventId,
    p_status: input.status,
  });

  if (error) {
    throw error;
  }

  return data?.[0] ?? null;
}
