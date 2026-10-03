import { z } from 'zod';

export const giftIdParamsSchema = z.object({ giftId: z.uuid() });

const giftFieldsSchema = z.object({
  eventId: z.uuid(),
  categoryId: z.uuid().nullable().optional(),
  name: z.string().trim().min(1),
  description: z.string().trim().min(1).nullable().optional(),
  imagePath: z.string().trim().min(1).nullable().optional(),
  estimatedValue: z.number().nonnegative().nullable().optional(),
  quantity: z.number().int().positive(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  displayOrder: z.number().int().nonnegative(),
});

export const createGiftBodySchema = giftFieldsSchema.extend({
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  displayOrder: z.number().int().nonnegative().default(0),
});

export const updateGiftBodySchema = giftFieldsSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Informe ao menos um campo para atualização.' },
);

export type CreateGiftBody = z.infer<typeof createGiftBodySchema>;
export type UpdateGiftBody = z.infer<typeof updateGiftBodySchema>;
