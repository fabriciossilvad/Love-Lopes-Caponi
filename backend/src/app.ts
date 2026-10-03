import Fastify from 'fastify';

import { adminRoutes } from './modules/admin/admin.routes.js';
import { giftReservationRoutes } from './modules/gift-reservations/gift-reservation.routes.js';
import { giftRoutes } from './modules/gifts/gift.routes.js';
import { healthRoutes } from './modules/health/health.routes.js';
import { invitationRoutes } from './modules/invitations/invitation.routes.js';
import { rsvpRoutes } from './modules/rsvp/rsvp.routes.js';

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

  app.register(healthRoutes, { prefix: '/health' });
  app.register(adminRoutes, { prefix: '/api/admin' });
  app.register(invitationRoutes, { prefix: '/api/invitations' });
  app.register(giftRoutes, { prefix: '/api' });
  app.register(giftReservationRoutes, { prefix: '/api/gift-reservations' });
  app.register(rsvpRoutes, { prefix: '/api/rsvp' });

  return app;
}
