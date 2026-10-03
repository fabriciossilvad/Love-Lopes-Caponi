import { randomBytes } from 'node:crypto';

import { createClient } from '@supabase/supabase-js';

import { getEnv } from '../../../config/env.js';
import type { CreateInvitationBody, InvitationListQuery, UpdateInvitationBody } from './admin-invitation.schemas.js';

function createAdminRlsClient(accessToken: string) {
  const env = getEnv();
  return createClient(env.SUPABASE_URL.trim().replace(/\/+$/, ''), env.SUPABASE_ANON_KEY.trim(), {
    global: { headers: { Authorization: 'Bearer ' + accessToken } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

const fields = 'id, display_name, token, status, internal_notes, created_at, updated_at';

function payload(input: CreateInvitationBody | UpdateInvitationBody) {
  return {
    ...(input.displayName !== undefined && { display_name: input.displayName }),
    ...(input.internalNotes !== undefined && { internal_notes: input.internalNotes }),
    ...(input.status !== undefined && { status: input.status }),
  };
}

export async function listAdminInvitations(accessToken: string, filters: InvitationListQuery = {}) {
  const supabase = createAdminRlsClient(accessToken);

  if (!filters.eventId && !filters.rsvpStatus) {
    const { data, error } = await supabase
      .from('invitations').select(fields).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  let memberships = supabase
    .from('guest_events')
    .select('guest_id, event_id, rsvp_status, guests!inner(invitation_id)');

  if (filters.eventId) memberships = memberships.eq('event_id', filters.eventId);
  if (filters.rsvpStatus) memberships = memberships.eq('rsvp_status', filters.rsvpStatus);

  const { data: matches, error: membershipError } = await memberships;
  if (membershipError) throw membershipError;

  const invitationIds = [...new Set(
    (matches ?? []).map((row) => {
      const guest = row.guests as unknown as { invitation_id: string };
      return guest.invitation_id;
    }),
  )];

  if (invitationIds.length === 0) return [];

  const { data, error } = await supabase
    .from('invitations')
    .select(fields)
    .in('id', invitationIds)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createAdminInvitation(accessToken: string, input: CreateInvitationBody) {
  const token = randomBytes(32).toString('base64url');
  const { data, error } = await createAdminRlsClient(accessToken)
    .from('invitations').insert({ ...payload(input), token }).select(fields).single();
  if (error) throw error;
  return data;
}

export async function updateAdminInvitation(accessToken: string, invitationId: string, input: UpdateInvitationBody) {
  const { data, error } = await createAdminRlsClient(accessToken)
    .from('invitations').update(payload(input)).eq('id', invitationId).select(fields).maybeSingle();
  if (error) throw error;
  return data;
}


export async function getAdminInvitationDetails(accessToken: string, invitationId: string) {
  const supabase = createAdminRlsClient(accessToken);

  const { data: invitation, error: invitationError } = await supabase
    .from('invitations')
    .select(fields)
    .eq('id', invitationId)
    .maybeSingle();

  if (invitationError) throw invitationError;
  if (!invitation) return null;

  const { data: guests, error: guestsError } = await supabase
    .from('guests')
    .select(`
      id,
      invitation_id,
      name,
      phone,
      email,
      notes,
      status,
      created_at,
      updated_at,
      guest_events (
        event_id,
        rsvp_status,
        responded_at,
        events (
          id,
          name,
          slug,
          event_date,
          rsvp_deadline,
          status
        )
      )
    `)
    .eq('invitation_id', invitationId)
    .order('name', { ascending: true });

  if (guestsError) throw guestsError;

  return {
    ...invitation,
    guests: guests ?? [],
  };
}
