import { createClient } from '@supabase/supabase-js';

import { getEnv } from '../../config/env.js';

function createUserClient(accessToken: string) {
  const env = getEnv();

  return createClient(env.SUPABASE_URL.trim().replace(/\/+$/, ''), env.SUPABASE_ANON_KEY.trim(), {
    accessToken: async () => accessToken,
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export async function getAuthenticatedAdmin(accessToken: string) {
  const supabase = createUserClient(accessToken);

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(accessToken);

  if (claimsError || !claimsData?.claims?.sub) {
    return null;
  }

  const userId = claimsData.claims.sub;

  const { data: admin, error: adminError } = await supabase
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
