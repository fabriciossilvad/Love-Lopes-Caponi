import { z } from 'zod';

export const giftCategoryIdParamsSchema = z.object({ categoryId: z.uuid() });

const fields = z.object({
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().min(1).nullable().optional(),
  displayOrder: z.number().int().nonnegative(),
  active: z.boolean(),
});

export const createGiftCategoryBodySchema = fields.extend({
  displayOrder: z.number().int().nonnegative().default(0),
  active: z.boolean().default(true),
});

export const updateGiftCategoryBodySchema = fields.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Informe ao menos um campo para atualização.' },
);

export type CreateGiftCategoryBody = z.infer<typeof createGiftCategoryBodySchema>;
export type UpdateGiftCategoryBody = z.infer<typeof updateGiftCategoryBodySchema>;
