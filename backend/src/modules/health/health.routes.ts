import type { FastifyPluginAsync } from 'fastify';

import { createSupabaseAnonClient } from '../../config/supabase.js';

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', async () => ({
    status: 'ok',
    service: 'love-lopes-caponi-api',
    timestamp: new Date().toISOString(),
  }));

  app.get('/database', async (_request, reply) => {
    const supabase = createSupabaseAnonClient();

    const { error } = await supabase
      .from('events')
      .select('id', { head: true, count: 'exact' })
      .limit(1);

    if (error) {
      app.log.error({ err: error }, 'Supabase health check failed');

      return reply.status(503).send({
        status: 'error',
        service: 'supabase',
        timestamp: new Date().toISOString(),
      });
    }

    return {
      status: 'ok',
      service: 'supabase',
      timestamp: new Date().toISOString(),
    };
  });
};
