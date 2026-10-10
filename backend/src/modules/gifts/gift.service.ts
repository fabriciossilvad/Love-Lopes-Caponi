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

  if (!Array.isArray(data)) return data;

  // Public gift catalog contains storage paths, never admin credentials.
  return data.map((gift) => {
    if (!gift || typeof gift !== 'object' || typeof gift.image_path !== 'string' || !gift.image_path) return gift;
    return {
      ...gift,
      image_url: supabase.storage.from('gift-images').getPublicUrl(gift.image_path).data.publicUrl,
    };
  });
}
