import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/modules/admin/admin-auth.service.js', () => ({ getAuthenticatedAdmin: vi.fn() }));
vi.mock('../src/modules/admin/photos/admin-photo.service.js', () => ({
  isAllowedPhotoType: vi.fn((mimetype: string) => ['image/jpeg', 'image/png', 'image/webp'].includes(mimetype)),
  hasValidPhotoSignature: vi.fn(() => true),
  listAdminPhotos: vi.fn(),
  createAdminPhoto: vi.fn(),
  updateAdminPhoto: vi.fn(),
}));
vi.mock('../src/config/supabase.js', () => ({
  createSupabaseAnonClient: vi.fn(),
  createSupabaseAdminClient: vi.fn(),
}));

import { buildApp } from '../src/app.js';
import { createSupabaseAnonClient } from '../src/config/supabase.js';
import { getAuthenticatedAdmin } from '../src/modules/admin/admin-auth.service.js';
import { createAdminPhoto, hasValidPhotoSignature, listAdminPhotos, updateAdminPhoto } from '../src/modules/admin/photos/admin-photo.service.js';

const apps: ReturnType<typeof buildApp>[] = [];
const auth = vi.mocked(getAuthenticatedAdmin);
const list = vi.mocked(listAdminPhotos);
const create = vi.mocked(createAdminPhoto);
const update = vi.mocked(updateAdminPhoto);
const signature = vi.mocked(hasValidPhotoSignature);
const anon = vi.mocked(createSupabaseAnonClient);
const admin = { userId: '6ace1121-3164-4ea0-a0c4-da029e3d5898', email: 'admin@example.com', name: 'Admin', role: 'ADMIN' as const };

afterEach(async () => {
  vi.clearAllMocks();
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

function multipart(boundary: string, parts: Buffer[]) {
  return Buffer.concat(parts.map((part) => Buffer.concat([Buffer.from(`--${boundary}\r\n`), part, Buffer.from('\r\n')])).concat(Buffer.from(`--${boundary}--\r\n`)));
}
function field(name: string, value: string) {
  return Buffer.from(`Content-Disposition: form-data; name="${name}"\r\n\r\n${value}`);
}
function pngFile() {
  return Buffer.concat([
    Buffer.from('Content-Disposition: form-data; name="file"; filename="photo.png"\r\nContent-Type: image/png\r\n\r\n'),
    Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]),
  ]);
}

describe('photo API', () => {
  it('lists photos for admin', async () => {
    auth.mockResolvedValue(admin);
    list.mockResolvedValue([{ id: '923480d4-e3b2-4bc6-9cf0-8a5f33986a2e', active: false }] as never);
    const app = buildApp(); apps.push(app);
    const response = await app.inject({ method: 'GET', url: '/api/admin/photos', headers: { authorization: 'Bearer token' } });
    expect(response.statusCode).toBe(200);
    expect(response.json()[0]).toMatchObject({ active: false });
  });

  it('uploads a photo and parses fields even when they come after the file', async () => {
    auth.mockResolvedValue(admin);
    create.mockResolvedValue({ photo: { id: '65ae74cb-b004-414c-90bf-fecbe051e1b0', caption: 'Foto teste', display_order: 10 }, publicUrl: 'https://example.test/photo.png' } as never);
    const app = buildApp(); apps.push(app);
    const boundary = 'photo-boundary';
    const body = multipart(boundary, [
      pngFile(),
      field('eventId', '2d475c27-636a-48b4-a3aa-520dcf5eed4b'),
      field('caption', 'Foto teste'),
      field('displayOrder', '10'),
      field('active', 'true'),
    ]);
    const response = await app.inject({
      method: 'POST', url: '/api/admin/photos',
      headers: { authorization: 'Bearer token', 'content-type': `multipart/form-data; boundary=${boundary}` }, payload: body,
    });
    expect(response.statusCode).toBe(201);
    expect(create).toHaveBeenCalledWith('token', expect.any(Buffer), 'image/png', {
      eventId: '2d475c27-636a-48b4-a3aa-520dcf5eed4b', caption: 'Foto teste', displayOrder: 10, active: true,
    });
  });

  it('rejects spoofed image content', async () => {
    auth.mockResolvedValue(admin);
    signature.mockReturnValueOnce(false);
    const app = buildApp(); apps.push(app);
    const boundary = 'fake-photo';
    const response = await app.inject({
      method: 'POST', url: '/api/admin/photos',
      headers: { authorization: 'Bearer token', 'content-type': `multipart/form-data; boundary=${boundary}` },
      payload: multipart(boundary, [pngFile()]),
    });
    expect(response.statusCode).toBe(415);
    expect(response.json()).toMatchObject({ error: 'INVALID_PHOTO_CONTENT' });
    expect(create).not.toHaveBeenCalled();
  });

  it('updates photo visibility', async () => {
    auth.mockResolvedValue(admin);
    update.mockResolvedValue({ id: '923480d4-e3b2-4bc6-9cf0-8a5f33986a2e', active: false } as never);
    const app = buildApp(); apps.push(app);
    const response = await app.inject({
      method: 'PATCH', url: '/api/admin/photos/923480d4-e3b2-4bc6-9cf0-8a5f33986a2e',
      headers: { authorization: 'Bearer token' }, payload: { active: false },
    });
    expect(response.statusCode).toBe(200);
    expect(update).toHaveBeenCalledWith('token', '923480d4-e3b2-4bc6-9cf0-8a5f33986a2e', { active: false });
  });

  it('serves public photos with generated public URLs', async () => {
    const order2 = vi.fn().mockResolvedValue({ data: [{ id: '65ae74cb-b004-414c-90bf-fecbe051e1b0', storage_path: 'photo.png' }], error: null });
    const order1 = vi.fn().mockReturnValue({ order: order2 });
    const eq = vi.fn().mockReturnValue({ order: order1 });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    const getPublicUrl = vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.test/photo.png' } });
    const storageFrom = vi.fn().mockReturnValue({ getPublicUrl });
    anon.mockReturnValue({ from, storage: { from: storageFrom } } as never);
    const app = buildApp(); apps.push(app);
    const response = await app.inject({ method: 'GET', url: '/api/photos' });
    expect(response.statusCode).toBe(200);
    expect(eq).toHaveBeenCalledWith('active', true);
    expect(response.json()[0]).toMatchObject({ public_url: 'https://example.test/photo.png' });
  });
});
