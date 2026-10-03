import type { FastifyPluginAsync } from 'fastify';

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', async () => ({
    status: 'ok',
    service: 'love-lopes-caponi-api',
    timestamp: new Date().toISOString(),
  }));
};
