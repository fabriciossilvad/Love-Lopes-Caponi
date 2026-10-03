import { createClient } from '@supabase/supabase-js';

import { getEnv } from '../../../config/env.js';
import type { CreateGuestBody, SetGuestEventsBody, UpdateGuestBody } from './admin-guest.schemas.js';

function client(accessToken: string) {
  const env = getEnv();
  return createClient(env.SUPABASE_URL.trim().replace(/\/+$/, ''), env.SUPABASE_ANON_KEY.trim(), {
    global: { headers: { Authorization: 'Bearer ' + accessToken } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export async function createAdminGuest(accessToken: string, input: CreateGuestBody) {
  const uniqueEventIds = [...new Set(input.eventIds)];

  const { data, error } = await client(accessToken).rpc('admin_create_guest', {
    p_invitation_id: input.invitationId,
    p_name: input.name,
    p_event_ids: uniqueEventIds,
    p_phone: input.phone ?? null,
    p_email: input.email ?? null,
    p_notes: input.notes ?? null,
    p_status: input.status,
  });

  if (error) throw error;
  return data;
}

export async function updateAdminGuest(accessToken: string, guestId: string, input: UpdateGuestBody) {
  const { data, error } = await client(accessToken)
    .from('guests')
    .update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.phone !== undefined && { phone: input.phone }),
      ...(input.email !== undefined && { email: input.email }),
      ...(input.notes !== undefined && { notes: input.notes }),
      ...(input.status !== undefined && { status: input.status }),
    })
    .eq('id', guestId)
    .select('id, invitation_id, name, phone, email, notes, status, created_at, updated_at')
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function setAdminGuestEvents(accessToken: string, guestId: string, input: SetGuestEventsBody) {
  const uniqueEventIds = [...new Set(input.eventIds)];

  const { data, error } = await client(accessToken).rpc('admin_set_guest_events', {
    p_guest_id: guestId,
    p_event_ids: uniqueEventIds,
  });

  if (error) throw error;
  return data;
}
