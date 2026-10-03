import { createClient } from '@supabase/supabase-js';

import { getEnv } from '../../../config/env.js';
import type { CreateEventBody, UpdateEventBody } from './admin-event.schemas.js';

function createAdminRlsClient(accessToken: string) {
  const env = getEnv();

  return createClient(
    env.SUPABASE_URL.trim().replace(/\/+$/, ''),
    env.SUPABASE_ANON_KEY.trim(),
    {
      global: { headers: { Authorization: 'Bearer ' + accessToken } },
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    },
  );
}

function toDatabasePayload(input: CreateEventBody | UpdateEventBody) {
  return {
    ...(input.name !== undefined && { name: input.name }),
    ...(input.slug !== undefined && { slug: input.slug }),
    ...(input.description !== undefined && { description: input.description }),
    ...(input.eventDate !== undefined && { event_date: input.eventDate }),
    ...(input.venueName !== undefined && { venue_name: input.venueName }),
    ...(input.address !== undefined && { address: input.address }),
    ...(input.mapsUrl !== undefined && { maps_url: input.mapsUrl }),
    ...(input.rsvpDeadline !== undefined && { rsvp_deadline: input.rsvpDeadline }),
    ...(input.status !== undefined && { status: input.status }),
    ...(input.additionalInfo !== undefined && { additional_info: input.additionalInfo }),
  };
}

const fields = 'id, name, slug, description, event_date, venue_name, address, maps_url, rsvp_deadline, status, additional_info, created_at, updated_at';

export async function listAdminEvents(accessToken: string) {
  const { data, error } = await createAdminRlsClient(accessToken)
    .from('events').select(fields).order('event_date', { ascending: true });
  if (error) throw error;
  return data;
}

export async function createAdminEvent(accessToken: string, input: CreateEventBody) {
  const { data, error } = await createAdminRlsClient(accessToken)
    .from('events').insert(toDatabasePayload(input)).select(fields).single();
  if (error) throw error;
  return data;
}

export async function updateAdminEvent(accessToken: string, eventId: string, input: UpdateEventBody) {
  const { data, error } = await createAdminRlsClient(accessToken)
    .from('events').update(toDatabasePayload(input)).eq('id', eventId).select(fields).maybeSingle();
  if (error) throw error;
  return data;
}
