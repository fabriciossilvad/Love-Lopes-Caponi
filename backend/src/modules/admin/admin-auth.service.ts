import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';
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

// Authorization cache is process-local; each token is still verified on every request.
// Cache entries never outlive the JWT and are not sliding/extended on reads.
const ADMIN_CACHE_TTL_MS = 30 * 60 * 1000;
const MAX_CACHE_ENTRIES = 500;
type AdminIdentity = { userId: string; email: string | null; name: string; role: string };
const adminCache = new Map<string, { admin: AdminIdentity; expiresAt: number }>();
const inFlight = new Map<string, Promise<AdminIdentity | null>>();
const cacheKey = (token: string) => createHash('sha256').update(token).digest('hex');

export function clearAdminAuthorizationCache() {
  adminCache.clear();
  inFlight.clear();
}

function pruneCache(now: number) {
  for (const [key, entry] of adminCache) {
    if (entry.expiresAt <= now) adminCache.delete(key);
  }
  while (adminCache.size >= MAX_CACHE_ENTRIES) {
    const oldest = adminCache.keys().next().value;
    if (!oldest) break;
    adminCache.delete(oldest);
  }
}

export async function getAuthenticatedAdmin(accessToken: string) {
  const started = performance.now();
  const authClient = createBaseClient();
  // Never trust a cached authorization without verifying the supplied JWT.
  const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(accessToken);
  const claims = claimsData?.claims;
  const expiresAt = typeof claims?.exp === 'number' ? claims.exp * 1000 : 0;
  const now = Date.now();
  if (claimsError || !claims?.sub || !expiresAt || expiresAt <= now) return null;

  const key = cacheKey(accessToken);
  const cached = adminCache.get(key);
  if (cached && cached.expiresAt > now && cached.admin.userId === claims.sub) return cached.admin;
  if (cached) adminCache.delete(key);

  const existing = inFlight.get(key);
  if (existing) return existing;

  const lookup = (async (): Promise<AdminIdentity | null> => {
    const dbStarted = performance.now();
    const userClient = createUserClient(accessToken);
    const { data: admin, error: adminError } = await userClient
      .from('admin_users')
      .select('id, name, role, active')
      .eq('id', claims.sub)
      .eq('active', true)
      .maybeSingle();
    if (adminError || !admin) return null;
    const identity: AdminIdentity = {
      userId: claims.sub,
      email: typeof claims.email === 'string' ? claims.email : null,
      name: admin.name,
      role: admin.role,
    };
    const time = Date.now();
    const validUntil = Math.min(time + ADMIN_CACHE_TTL_MS, expiresAt);
    if (validUntil > time) {
      pruneCache(time);
      adminCache.set(key, { admin: identity, expiresAt: validUntil });
    }
    if (process.env.ADMIN_AUTH_TIMING === 'true') {
      console.info('[admin-auth] authorization lookup', {
        dbMs: Math.round(performance.now() - dbStarted),
        totalMs: Math.round(performance.now() - started),
      });
    }
    return identity;
  })();
  inFlight.set(key, lookup);
  try {
    return await lookup;
  } finally {
    if (inFlight.get(key) === lookup) inFlight.delete(key);
  }
}
