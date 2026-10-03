import type { FastifyPluginAsync } from 'fastify';

import { requireAdmin } from '../admin-auth.js';
import { siteContentKeyParamsSchema, upsertSiteContentBodySchema } from './admin-site-content.schemas.js';
import { listAdminSiteContents, upsertAdminSiteContent } from './admin-site-content.service.js';

export const adminSiteContentRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireAdmin);

  app.get('/', async (request, reply) => {
    try {
      return await listAdminSiteContents(request.adminAccessToken);
    } catch (error) {
      request.log.error({ err: error }, 'Admin site content list failed');
      return reply.status(500).send({ error: 'SITE_CONTENT_LIST_FAILED', message: 'Não foi possível listar os conteúdos.' });
    }
  });

  app.put('/:key', async (request, reply) => {
    const params = siteContentKeyParamsSchema.safeParse(request.params);
    const body = upsertSiteContentBodySchema.safeParse(request.body);
    if (!params.success || !body.success) {
      return reply.status(400).send({ error: 'INVALID_SITE_CONTENT', message: 'Dados do conteúdo inválidos.' });
    }

    try {
      return await upsertAdminSiteContent(request.adminAccessToken, params.data.key, body.data);
    } catch (error) {
      request.log.error({ err: error }, 'Admin site content update failed');
      return reply.status(500).send({ error: 'SITE_CONTENT_UPDATE_FAILED', message: 'Não foi possível salvar o conteúdo.' });
    }
  });
};
