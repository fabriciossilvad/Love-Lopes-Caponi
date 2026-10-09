import type { FastifyPluginAsync } from 'fastify';
import { listGiftReservationsQuerySchema } from './gift-reservation.list.schemas.js';

import {
  cancelGiftReservationBodySchema,
  cancelGiftReservationParamsSchema,
  reserveGiftBodySchema,
} from './gift-reservation.schemas.js';
import {
  cancelGiftReservation,
  reserveGift,
  listInvitationGiftReservations,
} from './gift-reservation.service.js';

export const giftReservationRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', async (request, reply) => {
    const query = listGiftReservationsQuerySchema.safeParse(request.query);
    if (!query.success) return reply.status(400).send({error:'INVALID_TOKEN',message:'Token inválido.'});
    try { return await listInvitationGiftReservations(query.data.token); }
    catch (error) {
      app.log.warn({err:error}, 'Gift reservation lookup failed');
      return reply.status(403).send({error:'GIFT_RESERVATIONS_NOT_AVAILABLE',message:'Reservas indisponíveis para este convite.'});
    }
  });

  app.post('/', async (request, reply) => {
    const parsed = reserveGiftBodySchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        error: 'INVALID_GIFT_RESERVATION',
        message: 'Dados da reserva de presente inválidos.',
      });
    }

    try {
      const result = await reserveGift(parsed.data);
      return reply.status(201).send(result);
    } catch (error) {
      app.log.warn({ err: error }, 'Gift reservation failed');

      return reply.status(409).send({
        error: 'GIFT_RESERVATION_NOT_ALLOWED',
        message: 'Não foi possível reservar este presente.',
      });
    }
  });

  app.delete('/:reservationId', async (request, reply) => {
    const params = cancelGiftReservationParamsSchema.safeParse(request.params);
    const body = cancelGiftReservationBodySchema.safeParse(request.body);

    if (!params.success || !body.success) {
      return reply.status(400).send({
        error: 'INVALID_GIFT_RESERVATION_CANCELLATION',
        message: 'Dados do cancelamento de reserva inválidos.',
      });
    }

    try {
      const result = await cancelGiftReservation(
        body.data.token,
        params.data.reservationId,
      );

      return result;
    } catch (error) {
      app.log.warn({ err: error }, 'Gift reservation cancellation failed');

      return reply.status(403).send({
        error: 'GIFT_RESERVATION_CANCELLATION_NOT_ALLOWED',
        message: 'Não foi possível cancelar esta reserva.',
      });
    }
  });
};
