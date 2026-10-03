import { randomBytes } from 'node:crypto';

import { createClient } from '@supabase/supabase-js';

import { getEnv } from '../../../config/env.js';
import type { CreateInvitationBody, UpdateInvitationBody } from './admin-invitation.schemas.js';

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

export async function listAdminInvitations(accessToken: string) {
  const { data, error } = await createAdminRlsClient(accessToken)
    .from('invitations').select(fields).order('created_at', { ascending: false });
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
