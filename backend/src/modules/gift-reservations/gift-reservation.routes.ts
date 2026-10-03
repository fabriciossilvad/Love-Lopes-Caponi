import type { FastifyPluginAsync } from 'fastify';

import {
  cancelGiftReservationBodySchema,
  cancelGiftReservationParamsSchema,
  reserveGiftBodySchema,
} from './gift-reservation.schemas.js';
import {
  cancelGiftReservation,
  reserveGift,
} from './gift-reservation.service.js';

export const giftReservationRoutes: FastifyPluginAsync = async (app) => {
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
