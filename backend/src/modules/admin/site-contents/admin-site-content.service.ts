import { createClient } from '@supabase/supabase-js';

import { getEnv } from '../../../config/env.js';
import type { UpsertSiteContentBody } from './admin-site-content.schemas.js';

function client(accessToken: string) {
  const env = getEnv();
  return createClient(env.SUPABASE_URL.trim().replace(/\/+$/, ''), env.SUPABASE_ANON_KEY.trim(), {
    global: { headers: { Authorization: 'Bearer ' + accessToken } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export async function listAdminSiteContents(accessToken: string) {
  const { data, error } = await client(accessToken)
    .from('site_contents')
    .select('id, key, value, created_at, updated_at')
    .order('key');
  if (error) throw error;
  return data;
}

export async function upsertAdminSiteContent(accessToken: string, key: string, input: UpsertSiteContentBody) {
  const { data, error } = await client(accessToken)
    .from('site_contents')
    .upsert({ key, value: input.value }, { onConflict: 'key' })
    .select('id, key, value, created_at, updated_at')
    .single();
  if (error) throw error;
  return data;
}
