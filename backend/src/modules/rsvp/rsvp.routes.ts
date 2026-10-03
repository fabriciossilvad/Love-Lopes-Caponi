import type { FastifyPluginAsync } from 'fastify';

import { rsvpBodySchema } from './rsvp.schemas.js';
import { setRsvp } from './rsvp.service.js';

export const rsvpRoutes: FastifyPluginAsync = async (app) => {
  app.put('/', async (request, reply) => {
    const parsed = rsvpBodySchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        error: 'INVALID_RSVP',
        message: 'Dados de RSVP inválidos.',
      });
    }

    try {
      const result = await setRsvp(parsed.data);

      if (!result) {
        return reply.status(404).send({
          error: 'RSVP_NOT_FOUND',
          message: 'RSVP não encontrado.',
        });
      }

      return result;
    } catch (error) {
      app.log.warn({ err: error }, 'RSVP update failed');

      return reply.status(403).send({
        error: 'RSVP_NOT_ALLOWED',
        message: 'Não foi possível registrar este RSVP.',
      });
    }
  });
};
