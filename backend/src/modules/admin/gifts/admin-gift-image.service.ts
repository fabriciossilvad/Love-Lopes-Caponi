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

export function hasValidGiftImageSignature(file: Buffer, mimetype: string) {
  if (mimetype === 'image/jpeg') {
    return file.length >= 3 && file[0] === 0xff && file[1] === 0xd8 && file[2] === 0xff;
  }

  if (mimetype === 'image/png') {
    const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return file.length >= signature.length && signature.every((byte, index) => file[index] === byte);
  }

  if (mimetype === 'image/webp') {
    return file.length >= 12
      && file.subarray(0, 4).toString('ascii') === 'RIFF'
      && file.subarray(8, 12).toString('ascii') === 'WEBP';
  }

  return false;
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

  const { data: currentGift, error: giftError } = await storage
    .from('gifts')
    .select('id, image_path')
    .eq('id', giftId)
    .maybeSingle();

  if (giftError) throw giftError;
  if (!currentGift) throw new Error('GIFT_NOT_FOUND');

  const previousImagePath = currentGift.image_path;
  const path = `${giftId}/${randomUUID()}.${extension}`;

  const { error: uploadError } = await storage.storage.from(BUCKET).upload(path, file, {
    contentType: mimetype,
    upsert: false,
  });
  if (uploadError) throw uploadError;

  try {
    const gift = await updateAdminGift(accessToken, giftId, { imagePath: path } as UpdateGiftBody);

    if (previousImagePath && previousImagePath !== path) {
      const { error: removeError } = await storage.storage.from(BUCKET).remove([previousImagePath]);
      if (removeError) {
        console.warn('Gift image replaced, but previous image cleanup failed', {
          giftId,
          previousImagePath,
          message: removeError.message,
        });
      }
    }

    return {
      gift,
      imagePath: path,
      publicUrl: storage.storage.from(BUCKET).getPublicUrl(path).data.publicUrl,
    };
  } catch (error) {
    await storage.storage.from(BUCKET).remove([path]);
    throw error;
  }
}
