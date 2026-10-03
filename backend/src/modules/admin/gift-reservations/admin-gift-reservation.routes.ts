import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

import { requireAdmin } from '../admin-auth.js';
import { cancelAdminGiftReservation, listAdminGiftReservations } from './admin-gift-reservation.service.js';

const paramsSchema = z.object({ reservationId: z.uuid() });

export const adminGiftReservationRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireAdmin);

  app.get('/', async (request, reply) => {
    try {
      return await listAdminGiftReservations(request.adminAccessToken);
    } catch (error) {
      request.log.error({ err: error }, 'Admin gift reservation list failed');
      return reply.status(500).send({
        error: 'GIFT_RESERVATION_LIST_FAILED',
        message: 'Não foi possível listar as reservas de presentes.',
      });
    }
  });

  app.delete('/:reservationId', async (request, reply) => {
    const params = paramsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: 'INVALID_RESERVATION_ID', message: 'Reserva inválida.' });
    }

    try {
      const reservation = await cancelAdminGiftReservation(request.adminAccessToken, params.data.reservationId);
      if (!reservation) {
        return reply.status(404).send({ error: 'GIFT_RESERVATION_NOT_FOUND', message: 'Reserva não encontrada.' });
      }
      return reservation;
    } catch (error) {
      request.log.warn({ err: error }, 'Admin gift reservation cancellation failed');
      return reply.status(409).send({
        error: 'GIFT_RESERVATION_CANCELLATION_FAILED',
        message: 'Não foi possível liberar esta reserva.',
      });
    }
  });
};
