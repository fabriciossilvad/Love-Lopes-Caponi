import { createClient } from '@supabase/supabase-js';

import { getEnv } from '../../../config/env.js';

function client(accessToken: string) {
  const env = getEnv();
  return createClient(env.SUPABASE_URL.trim().replace(/\/+$/, ''), env.SUPABASE_ANON_KEY.trim(), {
    global: { headers: { Authorization: 'Bearer ' + accessToken } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export async function listAdminGiftReservations(accessToken: string) {
  const { data, error } = await client(accessToken)
    .from('gift_reservations')
    .select(`
      id, status, reserved_at, cancelled_at, created_at, updated_at,
      gifts(id, name, event_id, events(id, name, slug)),
      invitations(id, display_name),
      guests(id, name)
    `)
    .order('reserved_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function cancelAdminGiftReservation(accessToken: string, reservationId: string) {
  const supabase = client(accessToken);
  const { data: reservation, error: findError } = await supabase
    .from('gift_reservations')
    .select('id, status')
    .eq('id', reservationId)
    .maybeSingle();

  if (findError) throw findError;
  if (!reservation) return null;
  if (reservation.status !== 'ACTIVE') throw new Error('RESERVATION_NOT_ACTIVE');

  const { data, error } = await supabase
    .from('gift_reservations')
    .update({ status: 'CANCELLED', cancelled_at: new Date().toISOString() })
    .eq('id', reservationId)
    .eq('status', 'ACTIVE')
    .select('id, gift_id, invitation_id, guest_id, status, reserved_at, cancelled_at, updated_at')
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('RESERVATION_NOT_ACTIVE');
  return data;
}
