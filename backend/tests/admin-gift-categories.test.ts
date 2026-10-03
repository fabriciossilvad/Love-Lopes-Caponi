import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/modules/admin/admin-auth.service.js', () => ({
  getAuthenticatedAdmin: vi.fn(),
}));

vi.mock('../src/modules/admin/gift-categories/admin-gift-category.service.js', () => ({
  listAdminGiftCategories: vi.fn(),
  createAdminGiftCategory: vi.fn(),
  updateAdminGiftCategory: vi.fn(),
}));

import { buildApp } from '../src/app.js';
import { getAuthenticatedAdmin } from '../src/modules/admin/admin-auth.service.js';
import {
  createAdminGiftCategory,
  listAdminGiftCategories,
  updateAdminGiftCategory,
} from '../src/modules/admin/gift-categories/admin-gift-category.service.js';

const apps: ReturnType<typeof buildApp>[] = [];
const mockedAuth = vi.mocked(getAuthenticatedAdmin);
const mockedList = vi.mocked(listAdminGiftCategories);
const mockedCreate = vi.mocked(createAdminGiftCategory);
const mockedUpdate = vi.mocked(updateAdminGiftCategory);

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

describe('admin gift category API', () => {
  it('lists categories for admin', async () => {
    mockedAuth.mockResolvedValue(admin);
    mockedList.mockResolvedValue([{ id: 'f5a07ae7-6932-42de-ae87-0259d20677b1', name: 'Cozinha', slug: 'cozinha', active: true }] as never);
    const app = buildApp(); apps.push(app);

    const response = await app.inject({
      method: 'GET', url: '/api/admin/gift-categories',
      headers: { authorization: 'Bearer test-admin-token' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()[0]).toMatchObject({ name: 'Cozinha', active: true });
    expect(mockedList).toHaveBeenCalledWith('test-admin-token');
  });

  it('creates a category', async () => {
    mockedAuth.mockResolvedValue(admin);
    mockedCreate.mockResolvedValue({ id: '9e39cfe1-5cec-4b5c-adcd-a222002b1b79', name: 'Nova', slug: 'nova', display_order: 0, active: true } as never);
    const app = buildApp(); apps.push(app);

    const response = await app.inject({
      method: 'POST', url: '/api/admin/gift-categories',
      headers: { authorization: 'Bearer test-admin-token' },
      payload: { name: 'Nova', slug: 'nova' },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({ slug: 'nova', active: true });
    expect(mockedCreate).toHaveBeenCalledWith('test-admin-token', expect.objectContaining({
      name: 'Nova', slug: 'nova', displayOrder: 0, active: true,
    }));
  });

  it('rejects an invalid category payload', async () => {
    mockedAuth.mockResolvedValue(admin);
    const app = buildApp(); apps.push(app);

    const response = await app.inject({
      method: 'POST', url: '/api/admin/gift-categories',
      headers: { authorization: 'Bearer test-admin-token' },
      payload: { name: '', slug: 'Slug Inválido' },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ error: 'INVALID_GIFT_CATEGORY' });
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it('updates a category partially', async () => {
    mockedAuth.mockResolvedValue(admin);
    mockedUpdate.mockResolvedValue({ id: '9e39cfe1-5cec-4b5c-adcd-a222002b1b79', name: 'Atualizada', slug: 'teste-categoria-api', active: false } as never);
    const app = buildApp(); apps.push(app);

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/admin/gift-categories/9e39cfe1-5cec-4b5c-adcd-a222002b1b79',
      headers: { authorization: 'Bearer test-admin-token' },
      payload: { active: false },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ active: false });
    expect(mockedUpdate).toHaveBeenCalledWith(
      'test-admin-token',
      '9e39cfe1-5cec-4b5c-adcd-a222002b1b79',
      { active: false },
    );
  });

  it('returns not found when updating an unknown category', async () => {
    mockedAuth.mockResolvedValue(admin);
    mockedUpdate.mockResolvedValue(null);
    const app = buildApp(); apps.push(app);

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/admin/gift-categories/9e39cfe1-5cec-4b5c-adcd-a222002b1b79',
      headers: { authorization: 'Bearer test-admin-token' },
      payload: { active: false },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ error: 'GIFT_CATEGORY_NOT_FOUND' });
  });

  it('returns conflict when category creation violates a database constraint', async () => {
    mockedAuth.mockResolvedValue(admin);
    mockedCreate.mockRejectedValue(new Error('duplicate key'));
    const app = buildApp(); apps.push(app);

    const response = await app.inject({
      method: 'POST', url: '/api/admin/gift-categories',
      headers: { authorization: 'Bearer test-admin-token' },
      payload: { name: 'Duplicada', slug: 'cozinha' },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ error: 'GIFT_CATEGORY_CREATION_FAILED' });
  });
});
