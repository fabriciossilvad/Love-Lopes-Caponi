import { randomUUID } from 'node:crypto';

import { createClient } from '@supabase/supabase-js';

import { getEnv } from '../../../config/env.js';
import type { UpdateGiftBody } from './admin-gift.schemas.js';
import { updateAdminGift } from './admin-gift.service.js';

const BUCKET = 'gift-images';
const allowedTypes = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);

function client(accessToken: string) {
  const env = getEnv();
  return createClient(env.SUPABASE_URL.trim().replace(/\/+$/, ''), env.SUPABASE_ANON_KEY.trim(), {
    global: { headers: { Authorization: 'Bearer ' + accessToken } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export function isAllowedGiftImageType(mimetype: string) {
  return allowedTypes.has(mimetype);
}

export async function uploadAdminGiftImage(
  accessToken: string,
  giftId: string,
  file: Buffer,
  mimetype: string,
) {
  const extension = allowedTypes.get(mimetype);
  if (!extension) throw new Error('INVALID_GIFT_IMAGE_TYPE');

  const storage = client(accessToken);
  const path = `${giftId}/${randomUUID()}.${extension}`;

  const { error: uploadError } = await storage.storage.from(BUCKET).upload(path, file, {
    contentType: mimetype,
    upsert: false,
  });
  if (uploadError) throw uploadError;

  try {
    const gift = await updateAdminGift(accessToken, giftId, { imagePath: path } as UpdateGiftBody);
    return { gift, imagePath: path, publicUrl: storage.storage.from(BUCKET).getPublicUrl(path).data.publicUrl };
  } catch (error) {
    await storage.storage.from(BUCKET).remove([path]);
    throw error;
  }
}
