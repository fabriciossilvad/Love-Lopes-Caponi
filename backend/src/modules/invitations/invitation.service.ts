import { createSupabaseAnonClient } from '../../config/supabase.js';

export async function getInvitationContext(token: string) {
  const supabase = createSupabaseAnonClient();

  const { data, error } = await supabase.rpc('get_invitation_context', {
    p_token: token,
  });

  if (error) {
    throw error;
  }

  return data;
}
