import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/modules/admin/admin-auth.service.js', () => ({
  getAuthenticatedAdmin: vi.fn(),
}));

vi.mock('../src/modules/admin/gift-reservations/admin-gift-reservation.service.js', () => ({
  listAdminGiftReservations: vi.fn(),
  cancelAdminGiftReservation: vi.fn(),
}));

import { buildApp } from '../src/app.js';
import { getAuthenticatedAdmin } from '../src/modules/admin/admin-auth.service.js';
import {
  cancelAdminGiftReservation,
  listAdminGiftReservations,
} from '../src/modules/admin/gift-reservations/admin-gift-reservation.service.js';

const apps: ReturnType<typeof buildApp>[] = [];
const mockedAuth = vi.mocked(getAuthenticatedAdmin);
const mockedList = vi.mocked(listAdminGiftReservations);
const mockedCancel = vi.mocked(cancelAdminGiftReservation);

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

describe('admin gift reservation API', () => {
  it('lists gift reservations with private admin data', async () => {
    mockedAuth.mockResolvedValue(admin);
    mockedList.mockResolvedValue([{
      id: '04c1e656-d1cd-490c-87e2-135b8e3e22b0',
      status: 'ACTIVE',
      gifts: { id: 'c9b4adb9-1a4c-42b3-94d0-3ba6a90fdb27', name: 'Presente Teste' },
      invitations: { id: '65b7a65c-d839-4242-b41c-ac605c91ca68', display_name: 'João e Ana' },
      guests: null,
    }] as never);
    const app = buildApp(); apps.push(app);

    const response = await app.inject({
      method: 'GET',
      url: '/api/admin/gift-reservations',
      headers: { authorization: 'Bearer test-admin-token' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()[0]).toMatchObject({
      status: 'ACTIVE',
      invitations: { display_name: 'João e Ana' },
    });
    expect(mockedList).toHaveBeenCalledWith('test-admin-token');
  });

  it('cancels an active gift reservation', async () => {
    mockedAuth.mockResolvedValue(admin);
    mockedCancel.mockResolvedValue({
      id: '04c1e656-d1cd-490c-87e2-135b8e3e22b0',
      status: 'CANCELLED',
      cancelled_at: '2026-10-03T20:30:00.000Z',
    } as never);
    const app = buildApp(); apps.push(app);

    const response = await app.inject({
      method: 'DELETE',
      url: '/api/admin/gift-reservations/04c1e656-d1cd-490c-87e2-135b8e3e22b0',
      headers: { authorization: 'Bearer test-admin-token' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: 'CANCELLED' });
    expect(mockedCancel).toHaveBeenCalledWith(
      'test-admin-token',
      '04c1e656-d1cd-490c-87e2-135b8e3e22b0',
    );
  });

  it('rejects an invalid reservation id', async () => {
    mockedAuth.mockResolvedValue(admin);
    const app = buildApp(); apps.push(app);

    const response = await app.inject({
      method: 'DELETE',
      url: '/api/admin/gift-reservations/not-a-uuid',
      headers: { authorization: 'Bearer test-admin-token' },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ error: 'INVALID_RESERVATION_ID' });
    expect(mockedCancel).not.toHaveBeenCalled();
  });

  it('returns not found for an unknown reservation', async () => {
    mockedAuth.mockResolvedValue(admin);
    mockedCancel.mockResolvedValue(null);
    const app = buildApp(); apps.push(app);

    const response = await app.inject({
      method: 'DELETE',
      url: '/api/admin/gift-reservations/04c1e656-d1cd-490c-87e2-135b8e3e22b0',
      headers: { authorization: 'Bearer test-admin-token' },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ error: 'GIFT_RESERVATION_NOT_FOUND' });
  });

  it('returns conflict when reservation cannot be cancelled again', async () => {
    mockedAuth.mockResolvedValue(admin);
    mockedCancel.mockRejectedValue(new Error('RESERVATION_NOT_ACTIVE'));
    const app = buildApp(); apps.push(app);

    const response = await app.inject({
      method: 'DELETE',
      url: '/api/admin/gift-reservations/04c1e656-d1cd-490c-87e2-135b8e3e22b0',
      headers: { authorization: 'Bearer test-admin-token' },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ error: 'GIFT_RESERVATION_CANCELLATION_FAILED' });
  });
});
