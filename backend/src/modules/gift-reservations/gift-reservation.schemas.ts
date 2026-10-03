import { z } from 'zod';

export const reserveGiftBodySchema = z.object({
  token: z.string().min(24),
  giftId: z.uuid(),
  guestId: z.uuid().nullable().optional(),
});

export const cancelGiftReservationParamsSchema = z.object({
  reservationId: z.uuid(),
});

export const cancelGiftReservationBodySchema = z.object({
  token: z.string().min(24),
});

export type ReserveGiftBody = z.infer<typeof reserveGiftBodySchema>;
