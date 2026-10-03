import { createClient } from '@supabase/supabase-js';

import { getEnv } from '../../../config/env.js';
import type { CreateGiftCategoryBody, UpdateGiftCategoryBody } from './admin-gift-category.schemas.js';

function client(accessToken: string) {
  const env = getEnv();
  return createClient(env.SUPABASE_URL.trim().replace(/\/+$/, ''), env.SUPABASE_ANON_KEY.trim(), {
    global: { headers: { Authorization: 'Bearer ' + accessToken } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export async function listAdminGiftCategories(accessToken: string) {
  const { data, error } = await client(accessToken).from('gift_categories').select('*').order('display_order').order('name');
  if (error) throw error;
  return data;
}

export async function createAdminGiftCategory(accessToken: string, input: CreateGiftCategoryBody) {
  const { data, error } = await client(accessToken).from('gift_categories').insert({
    name: input.name, slug: input.slug, description: input.description ?? null,
    display_order: input.displayOrder, active: input.active,
  }).select('*').single();
  if (error) throw error;
  return data;
}

export async function updateAdminGiftCategory(accessToken: string, categoryId: string, input: UpdateGiftCategoryBody) {
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.slug !== undefined) patch.slug = input.slug;
  if (input.description !== undefined) patch.description = input.description;
  if (input.displayOrder !== undefined) patch.display_order = input.displayOrder;
  if (input.active !== undefined) patch.active = input.active;

  const { data, error } = await client(accessToken).from('gift_categories').update(patch).eq('id', categoryId).select('*').maybeSingle();
  if (error) throw error;
  return data;
}
