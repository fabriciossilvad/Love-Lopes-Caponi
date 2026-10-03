import type { FastifyPluginAsync } from 'fastify';

import { requireAdmin } from '../admin-auth.js';
import { createEventBodySchema, eventIdParamsSchema, updateEventBodySchema } from './admin-event.schemas.js';
import { createAdminEvent, listAdminEvents, updateAdminEvent } from './admin-event.service.js';

export const adminEventRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireAdmin);

  app.get('/', async (request, reply) => {
    try {
      return await listAdminEvents(request.adminAccessToken);
    } catch (error) {
      request.log.error({ err: error }, 'Admin event list failed');
      return reply.status(500).send({ error: 'EVENT_LIST_FAILED', message: 'Não foi possível listar os eventos.' });
    }
  });

  app.post('/', async (request, reply) => {
    const parsed = createEventBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'INVALID_EVENT', message: 'Dados do evento inválidos.' });
    }

    try {
      const event = await createAdminEvent(request.adminAccessToken, parsed.data);
      return reply.status(201).send(event);
    } catch (error) {
      request.log.warn({ err: error }, 'Admin event creation failed');
      return reply.status(409).send({ error: 'EVENT_CREATION_FAILED', message: 'Não foi possível criar o evento.' });
    }
  });

  app.patch('/:eventId', async (request, reply) => {
    const params = eventIdParamsSchema.safeParse(request.params);
    const body = updateEventBodySchema.safeParse(request.body);
    if (!params.success || !body.success) {
      return reply.status(400).send({ error: 'INVALID_EVENT_UPDATE', message: 'Dados da atualização inválidos.' });
    }

    try {
      const event = await updateAdminEvent(request.adminAccessToken, params.data.eventId, body.data);
      if (!event) {
        return reply.status(404).send({ error: 'EVENT_NOT_FOUND', message: 'Evento não encontrado.' });
      }
      return event;
    } catch (error) {
      request.log.warn({ err: error }, 'Admin event update failed');
      return reply.status(409).send({ error: 'EVENT_UPDATE_FAILED', message: 'Não foi possível atualizar o evento.' });
    }
  });
};
