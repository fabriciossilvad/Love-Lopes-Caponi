import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/modules/admin/admin-auth.service.js', () => ({
  getAuthenticatedAdmin: vi.fn(),
}));

vi.mock('../src/modules/admin/site-contents/admin-site-content.service.js', () => ({
  listAdminSiteContents: vi.fn(),
  upsertAdminSiteContent: vi.fn(),
}));

vi.mock('../src/config/supabase.js', () => ({
  createSupabaseAnonClient: vi.fn(),
  createSupabaseAdminClient: vi.fn(),
}));

import { buildApp } from '../src/app.js';
import { createSupabaseAnonClient } from '../src/config/supabase.js';
import { getAuthenticatedAdmin } from '../src/modules/admin/admin-auth.service.js';
import {
  listAdminSiteContents,
  upsertAdminSiteContent,
} from '../src/modules/admin/site-contents/admin-site-content.service.js';

const apps: ReturnType<typeof buildApp>[] = [];
const mockedAuth = vi.mocked(getAuthenticatedAdmin);
const mockedList = vi.mocked(listAdminSiteContents);
const mockedUpsert = vi.mocked(upsertAdminSiteContent);
const mockedAnon = vi.mocked(createSupabaseAnonClient);

const admin = {
  userId: '6ace1121-3164-4ea0-a0c4-da029e3d5898',
  email: 'admin@example.com',
  name: 'Admin',
  role: 'ADMIN' as const,
};

afterEach(async () => {
  vi.clearAllMocks();
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

describe('site content API', () => {
  it('lists contents for admin', async () => {
    mockedAuth.mockResolvedValue(admin);
    mockedList.mockResolvedValue([{ id: '11111111-1111-4111-8111-111111111111', key: 'home.subtitle', value: 'Texto' }] as never);
    const app = buildApp(); apps.push(app);

    const response = await app.inject({
      method: 'GET', url: '/api/admin/site-contents',
      headers: { authorization: 'Bearer test-admin-token' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()[0]).toMatchObject({ key: 'home.subtitle', value: 'Texto' });
    expect(mockedList).toHaveBeenCalledWith('test-admin-token');
  });

  it('upserts a site content key', async () => {
    mockedAuth.mockResolvedValue(admin);
    mockedUpsert.mockResolvedValue({ id: '11111111-1111-4111-8111-111111111111', key: 'home.subtitle', value: 'Novo texto' } as never);
    const app = buildApp(); apps.push(app);

    const response = await app.inject({
      method: 'PUT', url: '/api/admin/site-contents/home.subtitle',
      headers: { authorization: 'Bearer test-admin-token' },
      payload: { value: 'Novo texto' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ key: 'home.subtitle', value: 'Novo texto' });
    expect(mockedUpsert).toHaveBeenCalledWith('test-admin-token', 'home.subtitle', { value: 'Novo texto' });
  });

  it('rejects invalid content keys', async () => {
    mockedAuth.mockResolvedValue(admin);
    const app = buildApp(); apps.push(app);

    const response = await app.inject({
      method: 'PUT', url: '/api/admin/site-contents/INVALID%20KEY',
      headers: { authorization: 'Bearer test-admin-token' },
      payload: { value: 'Texto' },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ error: 'INVALID_SITE_CONTENT' });
    expect(mockedUpsert).not.toHaveBeenCalled();
  });

  it('requires a value property', async () => {
    mockedAuth.mockResolvedValue(admin);
    const app = buildApp(); apps.push(app);

    const response = await app.inject({
      method: 'PUT', url: '/api/admin/site-contents/home.subtitle',
      headers: { authorization: 'Bearer test-admin-token' },
      payload: {},
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ error: 'INVALID_SITE_CONTENT' });
  });

  it('serves public site contents without authentication', async () => {
    const order = vi.fn().mockResolvedValue({
      data: [{ key: 'home.subtitle', value: 'Texto público', updated_at: '2026-10-03T21:00:00Z' }],
      error: null,
    });
    const select = vi.fn().mockReturnValue({ order });
    const from = vi.fn().mockReturnValue({ select });
    mockedAnon.mockReturnValue({ from } as never);

    const app = buildApp(); apps.push(app);
    const response = await app.inject({ method: 'GET', url: '/api/site-contents' });

    expect(response.statusCode).toBe(200);
    expect(response.json()[0]).toMatchObject({ key: 'home.subtitle', value: 'Texto público' });
  });
});
