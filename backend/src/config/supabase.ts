import { createClient } from '@supabase/supabase-js';

import { getEnv } from './env.js';

function normalizeSupabaseUrl(url: string) {
  return url.trim().replace(/\/+$/, '');
}

export function createSupabaseAnonClient() {
  const env = getEnv();

  return createClient(normalizeSupabaseUrl(env.SUPABASE_URL), env.SUPABASE_ANON_KEY.trim(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function createSupabaseAdminClient() {
  const env = getEnv();

  return createClient(
    normalizeSupabaseUrl(env.SUPABASE_URL),
    env.SUPABASE_SERVICE_ROLE_KEY.trim(),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
