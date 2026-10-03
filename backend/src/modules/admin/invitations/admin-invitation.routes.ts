import type { FastifyPluginAsync } from 'fastify';

import { requireAdmin } from '../admin-auth.js';
import { createInvitationBodySchema, invitationIdParamsSchema, invitationListQuerySchema, updateInvitationBodySchema } from './admin-invitation.schemas.js';
import { createAdminInvitation, getAdminInvitationDetails, listAdminInvitations, updateAdminInvitation } from './admin-invitation.service.js';

export const adminInvitationRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireAdmin);

  app.get('/', async (request, reply) => {
    const query = invitationListQuerySchema.safeParse(request.query);
    if (!query.success) {
      return reply.status(400).send({ error: 'INVALID_INVITATION_FILTER', message: 'Filtros de convite inválidos.' });
    }

    try {
      return await listAdminInvitations(request.adminAccessToken, query.data);
    } catch (error) {
      request.log.error({ err: error }, 'Admin invitation list failed');
      return reply.status(500).send({ error: 'INVITATION_LIST_FAILED', message: 'Não foi possível listar os convites.' });
    }
  });


  app.get('/:invitationId', async (request, reply) => {
    const params = invitationIdParamsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: 'INVALID_INVITATION_ID', message: 'Convite inválido.' });
    }

    try {
      const invitation = await getAdminInvitationDetails(request.adminAccessToken, params.data.invitationId);
      if (!invitation) {
        return reply.status(404).send({ error: 'INVITATION_NOT_FOUND', message: 'Convite não encontrado.' });
      }
      return invitation;
    } catch (error) {
      request.log.error({ err: error }, 'Admin invitation details failed');
      return reply.status(500).send({ error: 'INVITATION_DETAILS_FAILED', message: 'Não foi possível carregar o convite.' });
    }
  });

  app.post('/', async (request, reply) => {
    const parsed = createInvitationBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'INVALID_INVITATION', message: 'Dados do convite inválidos.' });
    }
    try {
      return reply.status(201).send(await createAdminInvitation(request.adminAccessToken, parsed.data));
    } catch (error) {
      request.log.warn({ err: error }, 'Admin invitation creation failed');
      return reply.status(409).send({ error: 'INVITATION_CREATION_FAILED', message: 'Não foi possível criar o convite.' });
    }
  });

  app.patch('/:invitationId', async (request, reply) => {
    const params = invitationIdParamsSchema.safeParse(request.params);
    const body = updateInvitationBodySchema.safeParse(request.body);
    if (!params.success || !body.success) {
      return reply.status(400).send({ error: 'INVALID_INVITATION_UPDATE', message: 'Dados da atualização inválidos.' });
    }
    try {
      const invitation = await updateAdminInvitation(request.adminAccessToken, params.data.invitationId, body.data);
      if (!invitation) return reply.status(404).send({ error: 'INVITATION_NOT_FOUND', message: 'Convite não encontrado.' });
      return invitation;
    } catch (error) {
      request.log.warn({ err: error }, 'Admin invitation update failed');
      return reply.status(409).send({ error: 'INVITATION_UPDATE_FAILED', message: 'Não foi possível atualizar o convite.' });
    }
  });
};
