import { createClient } from '@supabase/supabase-js';

import { getEnv } from '../../../config/env.js';
import type { CreateGuestBody, UpdateGuestBody } from './admin-guest.schemas.js';

function client(accessToken: string) {
  const env = getEnv();
  return createClient(env.SUPABASE_URL.trim().replace(/\/+$/, ''), env.SUPABASE_ANON_KEY.trim(), {
    global: { headers: { Authorization: 'Bearer ' + accessToken } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export async function createAdminGuest(accessToken: string, input: CreateGuestBody) {
  const supabase = client(accessToken);
  const uniqueEventIds = [...new Set(input.eventIds)];

  const { data: invitation, error: invitationError } = await supabase
    .from('invitations').select('id').eq('id', input.invitationId).maybeSingle();
  if (invitationError) throw invitationError;
  if (!invitation) throw new Error('INVITATION_NOT_FOUND');

  const { data: events, error: eventsError } = await supabase
    .from('events').select('id').in('id', uniqueEventIds);
  if (eventsError) throw eventsError;
  if ((events?.length ?? 0) !== uniqueEventIds.length) throw new Error('EVENT_NOT_FOUND');

  const { data: guest, error: guestError } = await supabase
    .from('guests')
    .insert({
      invitation_id: input.invitationId,
      name: input.name,
      phone: input.phone ?? null,
      email: input.email ?? null,
      notes: input.notes ?? null,
      status: input.status,
    })
    .select('id, invitation_id, name, phone, email, notes, status, created_at, updated_at')
    .single();
  if (guestError) throw guestError;

  const { error: membershipError } = await supabase.from('guest_events').insert(
    uniqueEventIds.map((eventId) => ({ guest_id: guest.id, event_id: eventId })),
  );

  if (membershipError) {
    await supabase.from('guests').delete().eq('id', guest.id);
    throw membershipError;
  }

  return { ...guest, event_ids: uniqueEventIds };
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
