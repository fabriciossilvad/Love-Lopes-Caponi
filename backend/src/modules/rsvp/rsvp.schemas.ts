import { z } from 'zod';

export const rsvpBodySchema = z.object({
  token: z.string().min(24),
  guestId: z.uuid(),
  eventId: z.uuid(),
  status: z.enum(['CONFIRMED', 'DECLINED']),
});

export type RsvpBody = z.infer<typeof rsvpBodySchema>;
