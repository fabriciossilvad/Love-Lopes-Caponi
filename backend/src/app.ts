import Fastify from 'fastify';

import { giftRoutes } from './modules/gifts/gift.routes.js';
import { healthRoutes } from './modules/health/health.routes.js';
import { invitationRoutes } from './modules/invitations/invitation.routes.js';
import { rsvpRoutes } from './modules/rsvp/rsvp.routes.js';

export function buildApp() {
  const app = Fastify({
    logger: true,
  });

  app.register(healthRoutes, { prefix: '/health' });
  app.register(invitationRoutes, { prefix: '/api/invitations' });
  app.register(giftRoutes, { prefix: '/api' });
  app.register(rsvpRoutes, { prefix: '/api/rsvp' });

  return app;
}
