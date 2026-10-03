import type { FastifyPluginAsync } from 'fastify';

import { requireAdmin } from './admin-auth.js';

export const adminRoutes: FastifyPluginAsync = async (app) => {
  app.get('/me', { preHandler: requireAdmin }, async (request) => request.admin);
};
