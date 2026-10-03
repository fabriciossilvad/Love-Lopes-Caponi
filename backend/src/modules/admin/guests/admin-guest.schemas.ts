import { z } from 'zod';

export const guestIdParamsSchema = z.object({ guestId: z.uuid() });

export const createGuestBodySchema = z.object({
  invitationId: z.uuid(),
  name: z.string().trim().min(1),
  phone: z.string().trim().min(1).nullable().optional(),
  email: z.email().nullable().optional(),
  notes: z.string().trim().min(1).nullable().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  eventIds: z.array(z.uuid()).min(1),
});

export const updateGuestBodySchema = z.object({
  name: z.string().trim().min(1).optional(),
  phone: z.string().trim().min(1).nullable().optional(),
  email: z.email().nullable().optional(),
  notes: z.string().trim().min(1).nullable().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'Informe ao menos um campo para atualização.',
});

export type CreateGuestBody = z.infer<typeof createGuestBodySchema>;
export type UpdateGuestBody = z.infer<typeof updateGuestBodySchema>;
