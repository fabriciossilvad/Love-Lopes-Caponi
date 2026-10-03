import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/modules/rsvp/rsvp.service.js', () => ({
  setRsvp: vi.fn(),
}));

import { buildApp } from '../src/app.js';
import { setRsvp } from '../src/modules/rsvp/rsvp.service.js';

const apps: ReturnType<typeof buildApp>[] = [];
const mockedSetRsvp = vi.mocked(setRsvp);

afterEach(async () => {
  mockedSetRsvp.mockReset();
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

describe('PUT /api/rsvp', () => {
  it('updates a valid RSVP', async () => {
    mockedSetRsvp.mockResolvedValue({
      guest_id: '9af9c542-d480-48b1-87c4-631c566df14c',
      event_id: '2d475c27-636a-48b4-a3aa-520dcf5eed4b',
      rsvp_status: 'CONFIRMED',
      responded_at: '2026-10-03T17:46:49.355319+00:00',
    });

    const app = buildApp();
    apps.push(app);

    const response = await app.inject({
      method: 'PUT',
      url: '/api/rsvp',
      payload: {
        token: 'TESTE-FAMILIA-SILVA-2027-AAAA',
        guestId: '9af9c542-d480-48b1-87c4-631c566df14c',
        eventId: '2d475c27-636a-48b4-a3aa-520dcf5eed4b',
        status: 'CONFIRMED',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ rsvp_status: 'CONFIRMED' });
  });

  it('rejects an invalid request before calling the service', async () => {
    const app = buildApp();
    apps.push(app);

    const response = await app.inject({
      method: 'PUT',
      url: '/api/rsvp',
      payload: {
        token: 'short',
        guestId: 'not-a-uuid',
        eventId: 'not-a-uuid',
        status: 'PENDING',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(mockedSetRsvp).not.toHaveBeenCalled();
  });

  it('does not expose the database error to the client', async () => {
    mockedSetRsvp.mockRejectedValue(new Error('Guest is not invited to this event'));

    const app = buildApp();
    apps.push(app);

    const response = await app.inject({
      method: 'PUT',
      url: '/api/rsvp',
      payload: {
        token: 'TESTE-FAMILIA-SILVA-2027-AAAA',
        guestId: '6a99032c-154b-4d30-a67e-081f7ead6ba7',
        eventId: '2d475c27-636a-48b4-a3aa-520dcf5eed4b',
        status: 'CONFIRMED',
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toEqual({
      error: 'RSVP_NOT_ALLOWED',
      message: 'Não foi possível registrar este RSVP.',
    });
  });
});
