import { z } from 'zod';

export const invitationListQuerySchema = z.object({
  eventId: z.uuid().optional(),
  rsvpStatus: z.enum(['PENDING', 'CONFIRMED', 'DECLINED']).optional(),
});

export const invitationIdParamsSchema = z.object({
  invitationId: z.uuid(),
});

export const createInvitationBodySchema = z.object({
  displayName: z.string().trim().min(1),
  internalNotes: z.string().trim().min(1).nullable().optional(),
  status: z.enum(['ACTIVE', 'DISABLED']).default('ACTIVE'),
});

export const updateInvitationBodySchema = createInvitationBodySchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Informe ao menos um campo para atualização.',
  });

export type InvitationListQuery = z.infer<typeof invitationListQuerySchema>;
export type CreateInvitationBody = z.infer<typeof createInvitationBodySchema>;
export type UpdateInvitationBody = z.infer<typeof updateInvitationBodySchema>;
