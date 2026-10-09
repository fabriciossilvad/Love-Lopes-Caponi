import { createSupabaseAnonClient } from '../../config/supabase.js';

import type { ReserveGiftBody } from './gift-reservation.schemas.js';

export async function reserveGift(input: ReserveGiftBody) {
  const supabase = createSupabaseAnonClient();

  const { data, error } = await supabase.rpc('reserve_gift', {
    p_token: input.token,
    p_gift_id: input.giftId,
    p_guest_id: input.guestId ?? null,
  });

  if (error) {
    throw error;
  }

  return data?.[0] ?? null;
}

export async function cancelGiftReservation(token: string, reservationId: string) {
  const supabase = createSupabaseAnonClient();

  const { data, error } = await supabase.rpc('cancel_gift_reservation', {
    p_token: token,
    p_reservation_id: reservationId,
  });

  if (error) {
    throw error;
  }

  return data?.[0] ?? null;
}

export async function listInvitationGiftReservations(token: string) {
  const supabase = createSupabaseAnonClient();
  const { data, error } = await supabase.rpc('list_invitation_gift_reservations', {p_token: token});
  if (error) throw error;
  return data ?? [];
}
