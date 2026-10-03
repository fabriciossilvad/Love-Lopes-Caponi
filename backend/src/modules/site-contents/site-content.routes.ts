import type { FastifyPluginAsync } from 'fastify';

import { createSupabaseAnonClient } from '../../config/supabase.js';

export const siteContentRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', async (_request, reply) => {
    const { data, error } = await createSupabaseAnonClient()
      .from('site_contents')
      .select('key, value, updated_at')
      .order('key');

    if (error) {
      return reply.status(500).send({ error: 'SITE_CONTENT_LIST_FAILED', message: 'Não foi possível carregar os conteúdos.' });
    }

    return data;
  });
};
