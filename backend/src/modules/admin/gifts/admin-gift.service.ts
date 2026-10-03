import { createClient } from '@supabase/supabase-js';

import { getEnv } from '../../../config/env.js';
import type { CreateGiftBody, UpdateGiftBody } from './admin-gift.schemas.js';

function client(accessToken: string) {
  const env = getEnv();
  return createClient(env.SUPABASE_URL.trim().replace(/\/+$/, ''), env.SUPABASE_ANON_KEY.trim(), {
    global: { headers: { Authorization: 'Bearer ' + accessToken } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

const fields = 'id, event_id, category_id, name, description, image_path, estimated_value, quantity, status, display_order, created_at, updated_at';

function payload(input: CreateGiftBody | UpdateGiftBody) {
  return {
    ...(input.eventId !== undefined && { event_id: input.eventId }),
    ...(input.categoryId !== undefined && { category_id: input.categoryId }),
    ...(input.name !== undefined && { name: input.name }),
    ...(input.description !== undefined && { description: input.description }),
    ...(input.imagePath !== undefined && { image_path: input.imagePath }),
    ...(input.estimatedValue !== undefined && { estimated_value: input.estimatedValue }),
    ...(input.quantity !== undefined && { quantity: input.quantity }),
    ...(input.status !== undefined && { status: input.status }),
    ...(input.displayOrder !== undefined && { display_order: input.displayOrder }),
  };
}

export async function listAdminGifts(accessToken: string) {
  const { data, error } = await client(accessToken)
    .from('gifts')
    .select(`${fields}, gift_categories(id, name, slug), events(id, name, slug)`)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createAdminGift(accessToken: string, input: CreateGiftBody) {
  const { data, error } = await client(accessToken)
    .from('gifts').insert(payload(input)).select(fields).single();
  if (error) throw error;
  return data;
}

export async function updateAdminGift(accessToken: string, giftId: string, input: UpdateGiftBody) {
  const supabase = client(accessToken);

  if (input.quantity !== undefined) {
    const { count, error: countError } = await supabase
      .from('gift_reservations')
      .select('id', { count: 'exact', head: true })
      .eq('gift_id', giftId)
      .eq('status', 'ACTIVE');
    if (countError) throw countError;
    if ((count ?? 0) > input.quantity) {
      throw new Error('Gift quantity cannot be lower than active reservations');
    }
  }

  const { data, error } = await supabase
    .from('gifts').update(payload(input)).eq('id', giftId).select(fields).maybeSingle();
  if (error) throw error;
  return data;
}
