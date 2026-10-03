import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/modules/admin/admin-auth.service.js', () => ({
  getAuthenticatedAdmin: vi.fn(),
}));

vi.mock('../src/modules/admin/gifts/admin-gift.service.js', () => ({
  listAdminGifts: vi.fn(),
  createAdminGift: vi.fn(),
  updateAdminGift: vi.fn(),
}));

import { buildApp } from '../src/app.js';
import { getAuthenticatedAdmin } from '../src/modules/admin/admin-auth.service.js';
import { createAdminGift, listAdminGifts, updateAdminGift } from '../src/modules/admin/gifts/admin-gift.service.js';

const apps: ReturnType<typeof buildApp>[] = [];
const mockedAuth = vi.mocked(getAuthenticatedAdmin);
const mockedList = vi.mocked(listAdminGifts);
const mockedCreate = vi.mocked(createAdminGift);
const mockedUpdate = vi.mocked(updateAdminGift);

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

describe('admin gift API', () => {
  it('lists gifts', async () => {
    mockedAuth.mockResolvedValue(admin);
    mockedList.mockResolvedValue([{ id: 'c1f744d2-4249-4fab-a92c-ad2c7aa43bc8', name: 'Cafeteira' }] as never);
    const app = buildApp(); apps.push(app);
    const response = await app.inject({ method: 'GET', url: '/api/admin/gifts', headers: { authorization: 'Bearer test-admin-token' } });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject([{ name: 'Cafeteira' }]);
  });

  it('creates a gift', async () => {
    mockedAuth.mockResolvedValue(admin);
    mockedCreate.mockResolvedValue({ id: '11111111-1111-4111-8111-111111111111', name: 'Presente Teste API', quantity: 3 } as never);
    const app = buildApp(); apps.push(app);
    const response = await app.inject({
      method: 'POST', url: '/api/admin/gifts', headers: { authorization: 'Bearer test-admin-token' },
      payload: { eventId: '2d475c27-636a-48b4-a3aa-520dcf5eed4b', name: 'Presente Teste API', quantity: 3 },
    });
    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({ quantity: 3 });
  });

  it('rejects invalid gift quantity before service', async () => {
    mockedAuth.mockResolvedValue(admin);
    const app = buildApp(); apps.push(app);
    const response = await app.inject({
      method: 'POST', url: '/api/admin/gifts', headers: { authorization: 'Bearer test-admin-token' },
      payload: { eventId: '2d475c27-636a-48b4-a3aa-520dcf5eed4b', name: 'Inválido', quantity: 0 },
    });
    expect(response.statusCode).toBe(400);
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it('updates a gift through the atomic service', async () => {
    mockedAuth.mockResolvedValue(admin);
    mockedUpdate.mockResolvedValue({ id: '11111111-1111-4111-8111-111111111111', quantity: 2 } as never);
    const app = buildApp(); apps.push(app);
    const response = await app.inject({
      method: 'PATCH', url: '/api/admin/gifts/11111111-1111-4111-8111-111111111111',
      headers: { authorization: 'Bearer test-admin-token' }, payload: { quantity: 2 },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ quantity: 2 });
    expect(mockedUpdate).toHaveBeenCalledWith('test-admin-token', '11111111-1111-4111-8111-111111111111', { quantity: 2 });
  });

  it('maps a rejected atomic update to conflict', async () => {
    mockedAuth.mockResolvedValue(admin);
    mockedUpdate.mockRejectedValue(new Error('Gift quantity cannot be lower than active reservations'));
    const app = buildApp(); apps.push(app);
    const response = await app.inject({
      method: 'PATCH', url: '/api/admin/gifts/11111111-1111-4111-8111-111111111111',
      headers: { authorization: 'Bearer test-admin-token' }, payload: { quantity: 1 },
    });
    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ error: 'GIFT_UPDATE_FAILED' });
  });
});
