import multipart from '@fastify/multipart';
import Fastify from 'fastify';

import { adminRoutes } from './modules/admin/admin.routes.js';
import { adminSessionRoutes } from './modules/admin/admin-session.routes.js';
import { adminEventRoutes } from './modules/admin/events/admin-event.routes.js';
import { adminGiftCategoryRoutes } from './modules/admin/gift-categories/admin-gift-category.routes.js';
import { adminGiftReservationRoutes } from './modules/admin/gift-reservations/admin-gift-reservation.routes.js';
import { adminGuestRoutes } from './modules/admin/guests/admin-guest.routes.js';
import { adminGiftRoutes } from './modules/admin/gifts/admin-gift.routes.js';
import { adminInvitationRoutes } from './modules/admin/invitations/admin-invitation.routes.js';
import { adminPhotoRoutes } from './modules/admin/photos/admin-photo.routes.js';
import { adminSiteContentRoutes } from './modules/admin/site-contents/admin-site-content.routes.js';
import { giftReservationRoutes } from './modules/gift-reservations/gift-reservation.routes.js';
import { giftRoutes } from './modules/gifts/gift.routes.js';
import { healthRoutes } from './modules/health/health.routes.js';
import { invitationRoutes } from './modules/invitations/invitation.routes.js';
import { photoRoutes } from './modules/photos/photo.routes.js';
import { rsvpRoutes } from './modules/rsvp/rsvp.routes.js';
import { siteContentRoutes } from './modules/site-contents/site-content.routes.js';

export function buildApp() {
  const app = Fastify({
    logger: {
      serializers: {
        req(request) {
          return {
            method: request.method,
            hostname: request.hostname,
            remoteAddress: request.ip,
          };
        },
      },
    },
  });

  app.register(multipart, {
    limits: { files: 1, fileSize: 5 * 1024 * 1024 },
  });

  app.register(healthRoutes, { prefix: '/health' });
  app.register(adminRoutes, { prefix: '/api/admin' });
  app.register(adminSessionRoutes, { prefix: '/api/admin' });
  app.register(adminEventRoutes, { prefix: '/api/admin/events' });
  app.register(adminInvitationRoutes, { prefix: '/api/admin/invitations' });
  app.register(adminGuestRoutes, { prefix: '/api/admin/guests' });
  app.register(adminGiftRoutes, { prefix: '/api/admin/gifts' });
  app.register(adminGiftCategoryRoutes, { prefix: '/api/admin/gift-categories' });
  app.register(adminGiftReservationRoutes, { prefix: '/api/admin/gift-reservations' });
  app.register(adminSiteContentRoutes, { prefix: '/api/admin/site-contents' });
  app.register(adminPhotoRoutes, { prefix: '/api/admin/photos' });
  app.register(invitationRoutes, { prefix: '/api/invitations' });
  app.register(giftRoutes, { prefix: '/api' });
  app.register(giftReservationRoutes, { prefix: '/api/gift-reservations' });
  app.register(rsvpRoutes, { prefix: '/api/rsvp' });
  app.register(siteContentRoutes, { prefix: '/api/site-contents' });
  app.register(photoRoutes, { prefix: '/api/photos' });

  return app;
}
