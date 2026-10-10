import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

import { getEnv } from '../../../config/env.js';
import type { UpdatePhotoBody } from './admin-photo.schemas.js';

const BUCKET = 'wedding-gallery';
const allowedTypes = new Map([['image/jpeg', 'jpg'], ['image/png', 'png'], ['image/webp', 'webp']]);

function client(accessToken: string) {
  const env = getEnv();
  return createClient(env.SUPABASE_URL.trim().replace(/\/+$/, ''), env.SUPABASE_ANON_KEY.trim(), {
    global: { headers: { Authorization: 'Bearer ' + accessToken } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export function isAllowedPhotoType(mimetype: string) { return allowedTypes.has(mimetype); }

export function hasValidPhotoSignature(file: Buffer, mimetype: string) {
  if (mimetype === 'image/jpeg') return file.length >= 3 && file[0] === 0xff && file[1] === 0xd8 && file[2] === 0xff;
  if (mimetype === 'image/png') {
    const signature = [0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a];
    return file.length >= 8 && signature.every((byte, index) => file[index] === byte);
  }
  if (mimetype === 'image/webp') return file.length >= 12 && file.subarray(0,4).toString('ascii') === 'RIFF' && file.subarray(8,12).toString('ascii') === 'WEBP';
  return false;
}

export async function listAdminPhotos(accessToken: string) {
  const { data, error } = await client(accessToken).from('photos')
    .select('id, event_id, storage_path, caption, display_order, active, created_at, updated_at, events(id, name, slug)')
    .order('display_order').order('created_at', { ascending: false });
  if (error) throw error;
  return data.map((photo) => ({ ...photo, public_url: client(accessToken).storage.from(BUCKET).getPublicUrl(photo.storage_path).data.publicUrl }));
}

export async function createAdminPhoto(accessToken: string, file: Buffer, mimetype: string, fields: { eventId?: string | null | undefined; caption?: string | null | undefined; displayOrder: number; active: boolean }) {
  const extension = allowedTypes.get(mimetype);
  if (!extension) throw new Error('INVALID_PHOTO_TYPE');
  const supabase = client(accessToken);

  if (fields.eventId) {
    const { data: event, error } = await supabase.from('events').select('id').eq('id', fields.eventId).maybeSingle();
    if (error) throw error;
    if (!event) throw new Error('EVENT_NOT_FOUND');
  }

  const path = `${randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: mimetype, upsert: false });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase.from('photos').insert({
    event_id: fields.eventId ?? null, storage_path: path, caption: fields.caption ?? null,
    display_order: fields.displayOrder, active: fields.active,
  }).select('*').single();

  if (error) {
    await supabase.storage.from(BUCKET).remove([path]);
    throw error;
  }

  return { photo: data, publicUrl: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl };
}

export async function updateAdminPhoto(accessToken: string, photoId: string, input: UpdatePhotoBody) {
  const patch: Record<string, unknown> = {};
  if (input.eventId !== undefined) patch.event_id = input.eventId;
  if (input.caption !== undefined) patch.caption = input.caption;
  if (input.displayOrder !== undefined) patch.display_order = input.displayOrder;
  if (input.active !== undefined) patch.active = input.active;

  const { data, error } = await client(accessToken).from('photos').update(patch).eq('id', photoId).select('*').maybeSingle();
  if (error) throw error;
  return data;
}
