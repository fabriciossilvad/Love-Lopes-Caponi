import type { FastifyPluginAsync } from 'fastify';

import { requireAdmin } from '../admin-auth.js';
import { createGuestBodySchema, guestIdParamsSchema, updateGuestBodySchema } from './admin-guest.schemas.js';
import { createAdminGuest, updateAdminGuest } from './admin-guest.service.js';

export const adminGuestRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireAdmin);

  app.post('/', async (request, reply) => {
    const parsed = createGuestBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'INVALID_GUEST', message: 'Dados do convidado inválidos.' });
    }
    try {
      return reply.status(201).send(await createAdminGuest(request.adminAccessToken, parsed.data));
    } catch (error) {
      request.log.warn({ err: error }, 'Admin guest creation failed');
      return reply.status(409).send({ error: 'GUEST_CREATION_FAILED', message: 'Não foi possível criar o convidado.' });
    }
  });

  app.patch('/:guestId', async (request, reply) => {
    const params = guestIdParamsSchema.safeParse(request.params);
    const body = updateGuestBodySchema.safeParse(request.body);
    if (!params.success || !body.success) {
      return reply.status(400).send({ error: 'INVALID_GUEST_UPDATE', message: 'Dados da atualização inválidos.' });
    }
    try {
      const guest = await updateAdminGuest(request.adminAccessToken, params.data.guestId, body.data);
      if (!guest) return reply.status(404).send({ error: 'GUEST_NOT_FOUND', message: 'Convidado não encontrado.' });
      return guest;
    } catch (error) {
      request.log.warn({ err: error }, 'Admin guest update failed');
      return reply.status(409).send({ error: 'GUEST_UPDATE_FAILED', message: 'Não foi possível atualizar o convidado.' });
    }
  });
};
