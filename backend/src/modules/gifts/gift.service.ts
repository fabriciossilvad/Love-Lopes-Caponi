import { createSupabaseAnonClient } from '../../config/supabase.js';

export async function getEventGifts(token: string, eventId: string) {
  const supabase = createSupabaseAnonClient();

  const { data, error } = await supabase.rpc('get_event_gifts', {
    p_token: token,
    p_event_id: eventId,
  });

  if (error) {
    throw error;
  }

  return data;
}
