import type { FastifyPluginAsync } from 'fastify';

import { invitationTokenParamsSchema } from './invitation.schemas.js';
import { getInvitationContext } from './invitation.service.js';

export const invitationRoutes: FastifyPluginAsync = async (app) => {
  app.get('/:token', async (request, reply) => {
    const parsed = invitationTokenParamsSchema.safeParse(request.params);

    if (!parsed.success) {
      return reply.status(400).send({
        error: 'INVALID_INVITATION_TOKEN',
        message: 'Token de convite inválido.',
      });
    }

    try {
      return await getInvitationContext(parsed.data.token);
    } catch (error) {
      app.log.warn({ err: error }, 'Invitation context lookup failed');

      return reply.status(404).send({
        error: 'INVITATION_NOT_FOUND',
        message: 'Convite inválido ou indisponível.',
      });
    }
  });
};
