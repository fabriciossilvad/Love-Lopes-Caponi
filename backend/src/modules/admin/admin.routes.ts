import type { FastifyPluginAsync } from 'fastify';

import { getAuthenticatedAdmin } from './admin-auth.service.js';

function getBearerToken(authorization: string | undefined) {
  if (!authorization) {
    return null;
  }

  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

export const adminRoutes: FastifyPluginAsync = async (app) => {
  app.get('/me', async (request, reply) => {
    const accessToken = getBearerToken(request.headers.authorization);

    if (!accessToken) {
      return reply.status(401).send({
        error: 'UNAUTHORIZED',
        message: 'Autenticação administrativa necessária.',
      });
    }

    try {
      const admin = await getAuthenticatedAdmin(accessToken);

      if (!admin) {
        return reply.status(403).send({
          error: 'ADMIN_ACCESS_DENIED',
          message: 'Usuário sem acesso administrativo.',
        });
      }

      return admin;
    } catch (error) {
      app.log.warn({ err: error }, 'Admin authentication failed');

      return reply.status(401).send({
        error: 'UNAUTHORIZED',
        message: 'Sessão administrativa inválida ou expirada.',
      });
    }
  });
};
