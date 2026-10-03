import { createClient } from '@supabase/supabase-js';

import { getEnv } from '../../config/env.js';

function createBaseClient() {
  const env = getEnv();

  return createClient(
    env.SUPABASE_URL.trim().replace(/\/+$/, ''),
    env.SUPABASE_ANON_KEY.trim(),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
}

function createUserClient(accessToken: string) {
  const env = getEnv();

  return createClient(
    env.SUPABASE_URL.trim().replace(/\/+$/, ''),
    env.SUPABASE_ANON_KEY.trim(),
    {
      global: {
        headers: {
          Authorization: 'Bearer ' + accessToken,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
}

export async function getAuthenticatedAdmin(accessToken: string) {
  const authClient = createBaseClient();

  const { data: claimsData, error: claimsError } =
    await authClient.auth.getClaims(accessToken);

  if (claimsError || !claimsData?.claims?.sub) {
    return null;
  }

  const userId = claimsData.claims.sub;
  const userClient = createUserClient(accessToken);

  const { data: admin, error: adminError } = await userClient
    .from('admin_users')
    .select('id, name, role, active')
    .eq('id', userId)
    .eq('active', true)
    .maybeSingle();

  if (adminError || !admin) {
    return null;
  }

  return {
    userId,
    email: typeof claimsData.claims.email === 'string' ? claimsData.claims.email : null,
    name: admin.name,
    role: admin.role,
  };
}
