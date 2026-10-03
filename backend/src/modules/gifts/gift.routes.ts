import type { FastifyPluginAsync } from 'fastify';

import {
  eventGiftParamsSchema,
  invitationTokenQuerySchema,
} from './gift.schemas.js';
import { getEventGifts } from './gift.service.js';

export const giftRoutes: FastifyPluginAsync = async (app) => {
  app.get('/events/:eventId/gifts', async (request, reply) => {
    const params = eventGiftParamsSchema.safeParse(request.params);
    const query = invitationTokenQuerySchema.safeParse(request.query);

    if (!params.success || !query.success) {
      return reply.status(400).send({
        error: 'INVALID_REQUEST',
        message: 'Evento ou token de convite inválido.',
      });
    }

    try {
      return await getEventGifts(query.data.token, params.data.eventId);
    } catch (error) {
      app.log.warn({ err: error }, 'Gift catalog lookup failed');

      return reply.status(403).send({
        error: 'GIFT_LIST_NOT_AVAILABLE',
        message: 'Lista de presentes indisponível para este convite.',
      });
    }
  });
};
