import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/modules/gift-reservations/gift-reservation.service.js', () => ({
  reserveGift: vi.fn(),
  cancelGiftReservation: vi.fn(),
}));

import { buildApp } from '../src/app.js';
import {
  cancelGiftReservation,
  reserveGift,
} from '../src/modules/gift-reservations/gift-reservation.service.js';

const apps: ReturnType<typeof buildApp>[] = [];
const mockedReserveGift = vi.mocked(reserveGift);
const mockedCancelGiftReservation = vi.mocked(cancelGiftReservation);

afterEach(async () => {
  mockedReserveGift.mockReset();
  mockedCancelGiftReservation.mockReset();
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

describe('gift reservation API', () => {
  it('creates a reservation', async () => {
    mockedReserveGift.mockResolvedValue({
      reservation_id: '21fc9614-4aa0-473c-8e50-b0fafe69933a',
      gift_id: 'c1f744d2-4249-4fab-a92c-ad2c7aa43bc8',
      status: 'ACTIVE',
      reserved_at: '2026-10-03T18:00:00+00:00',
    });

    const app = buildApp();
    apps.push(app);

    const response = await app.inject({
      method: 'POST',
      url: '/api/gift-reservations',
      payload: {
        token: 'TESTE-FAMILIA-SILVA-2027-AAAA',
        giftId: 'c1f744d2-4249-4fab-a92c-ad2c7aa43bc8',
        guestId: '9af9c542-d480-48b1-87c4-631c566df14c',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({ status: 'ACTIVE' });
  });

  it('returns conflict when the reservation is rejected', async () => {
    mockedReserveGift.mockRejectedValue(new Error('Gift is no longer available'));

    const app = buildApp();
    apps.push(app);

    const response = await app.inject({
      method: 'POST',
      url: '/api/gift-reservations',
      payload: {
        token: 'TESTE-JOAO-ANA-2027-BBBBBBBB',
        giftId: 'c1f744d2-4249-4fab-a92c-ad2c7aa43bc8',
      },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({
      error: 'GIFT_RESERVATION_NOT_ALLOWED',
    });
  });

  it('cancels an owned active reservation', async () => {
    mockedCancelGiftReservation.mockResolvedValue({
      reservation_id: '21fc9614-4aa0-473c-8e50-b0fafe69933a',
      gift_id: 'c1f744d2-4249-4fab-a92c-ad2c7aa43bc8',
      status: 'CANCELLED',
      cancelled_at: '2026-10-03T18:05:00+00:00',
    });

    const app = buildApp();
    apps.push(app);

    const response = await app.inject({
      method: 'DELETE',
      url: '/api/gift-reservations/21fc9614-4aa0-473c-8e50-b0fafe69933a',
      payload: {
        token: 'TESTE-FAMILIA-SILVA-2027-AAAA',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: 'CANCELLED' });
  });
});
