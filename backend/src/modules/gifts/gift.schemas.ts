import { z } from 'zod';

export const eventGiftParamsSchema = z.object({
  eventId: z.uuid(),
});

export const invitationTokenQuerySchema = z.object({
  token: z.string().min(24),
});

export type EventGiftParams = z.infer<typeof eventGiftParamsSchema>;
export type InvitationTokenQuery = z.infer<typeof invitationTokenQuerySchema>;
