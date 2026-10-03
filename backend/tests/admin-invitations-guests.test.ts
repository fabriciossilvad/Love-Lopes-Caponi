import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/modules/admin/admin-auth.service.js', () => ({
  getAuthenticatedAdmin: vi.fn(),
}));

vi.mock('../src/modules/admin/invitations/admin-invitation.service.js', () => ({
  listAdminInvitations: vi.fn(),
  createAdminInvitation: vi.fn(),
  updateAdminInvitation: vi.fn(),
  getAdminInvitationDetails: vi.fn(),
}));

vi.mock('../src/modules/admin/guests/admin-guest.service.js', () => ({
  createAdminGuest: vi.fn(),
  updateAdminGuest: vi.fn(),
  setAdminGuestEvents: vi.fn(),
}));

import { buildApp } from '../src/app.js';
import { getAuthenticatedAdmin } from '../src/modules/admin/admin-auth.service.js';
import { getAdminInvitationDetails, listAdminInvitations } from '../src/modules/admin/invitations/admin-invitation.service.js';
import { setAdminGuestEvents } from '../src/modules/admin/guests/admin-guest.service.js';

const apps: ReturnType<typeof buildApp>[] = [];
const mockedAuth = vi.mocked(getAuthenticatedAdmin);
const mockedDetails = vi.mocked(getAdminInvitationDetails);
const mockedListInvitations = vi.mocked(listAdminInvitations);
const mockedSetEvents = vi.mocked(setAdminGuestEvents);

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

describe('admin invitation and guest API', () => {
  it('filters invitations by event and pending RSVP', async () => {
    mockedAuth.mockResolvedValue(admin);
    mockedListInvitations.mockResolvedValue([{ id: 'ab0a62cf-defc-4f36-956a-4d9af682059d', display_name: 'Família Silva' }] as never);
    const app = buildApp(); apps.push(app);
    const response = await app.inject({
      method: 'GET',
      url: '/api/admin/invitations?eventId=2d475c27-636a-48b4-a3aa-520dcf5eed4b&rsvpStatus=PENDING',
      headers: { authorization: 'Bearer test-admin-token' },
    });
    expect(response.statusCode).toBe(200);
    expect(mockedListInvitations).toHaveBeenCalledWith('test-admin-token', {
      eventId: '2d475c27-636a-48b4-a3aa-520dcf5eed4b', rsvpStatus: 'PENDING',
    });
  });

  it('rejects invalid invitation filters before service', async () => {
    mockedAuth.mockResolvedValue(admin);
    const app = buildApp(); apps.push(app);
    const response = await app.inject({
      method: 'GET', url: '/api/admin/invitations?rsvpStatus=INVALID',
      headers: { authorization: 'Bearer test-admin-token' },
    });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ error: 'INVALID_INVITATION_FILTER' });
    expect(mockedListInvitations).not.toHaveBeenCalled();
  });

  it('returns invitation details with guests and RSVP memberships', async () => {
    mockedAuth.mockResolvedValue(admin);
    mockedDetails.mockResolvedValue({
      id: 'ab0a62cf-defc-4f36-956a-4d9af682059d',
      display_name: 'Família Silva',
      guests: [{
        id: '9af9c542-d480-48b1-87c4-631c566df14c',
        name: 'Marcos Silva',
        guest_events: [{
          event_id: '2d475c27-636a-48b4-a3aa-520dcf5eed4b',
          rsvp_status: 'DECLINED',
          responded_at: '2026-10-03T17:47:34.254524+00:00',
        }],
      }],
    } as never);

    const app = buildApp();
    apps.push(app);

    const response = await app.inject({
      method: 'GET',
      url: '/api/admin/invitations/ab0a62cf-defc-4f36-956a-4d9af682059d',
      headers: { authorization: 'Bearer test-admin-token' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      display_name: 'Família Silva',
      guests: [{
        name: 'Marcos Silva',
        guest_events: [{ rsvp_status: 'DECLINED' }],
      }],
    });
  });

  it('rejects an invalid invitation id before calling the service', async () => {
    mockedAuth.mockResolvedValue(admin);

    const app = buildApp();
    apps.push(app);

    const response = await app.inject({
      method: 'GET',
      url: '/api/admin/invitations/not-a-uuid',
      headers: { authorization: 'Bearer test-admin-token' },
    });

    expect(response.statusCode).toBe(400);
    expect(mockedDetails).not.toHaveBeenCalled();
  });

  it('updates guest event memberships through the admin RPC service', async () => {
    mockedAuth.mockResolvedValue(admin);
    mockedSetEvents.mockResolvedValue([
      {
        event_id: '2d475c27-636a-48b4-a3aa-520dcf5eed4b',
        rsvp_status: 'DECLINED',
        responded_at: '2026-10-03T17:47:34.254524+00:00',
      },
    ] as never);

    const app = buildApp();
    apps.push(app);

    const response = await app.inject({
      method: 'PUT',
      url: '/api/admin/guests/9af9c542-d480-48b1-87c4-631c566df14c/events',
      headers: { authorization: 'Bearer test-admin-token' },
      payload: { eventIds: ['2d475c27-636a-48b4-a3aa-520dcf5eed4b'] },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject([{ rsvp_status: 'DECLINED' }]);
    expect(mockedSetEvents).toHaveBeenCalledWith(
      'test-admin-token',
      '9af9c542-d480-48b1-87c4-631c566df14c',
      { eventIds: ['2d475c27-636a-48b4-a3aa-520dcf5eed4b'] },
    );
  });

  it('rejects an empty guest event list before calling the service', async () => {
    mockedAuth.mockResolvedValue(admin);

    const app = buildApp();
    apps.push(app);

    const response = await app.inject({
      method: 'PUT',
      url: '/api/admin/guests/9af9c542-d480-48b1-87c4-631c566df14c/events',
      headers: { authorization: 'Bearer test-admin-token' },
      payload: { eventIds: [] },
    });

    expect(response.statusCode).toBe(400);
    expect(mockedSetEvents).not.toHaveBeenCalled();
  });
});
