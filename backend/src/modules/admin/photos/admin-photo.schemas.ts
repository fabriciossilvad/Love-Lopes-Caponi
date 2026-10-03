import { z } from 'zod';

export const photoIdParamsSchema = z.object({ photoId: z.uuid() });

export const createPhotoFieldsSchema = z.object({
  eventId: z.uuid().nullable().optional(),
  caption: z.string().trim().min(1).nullable().optional(),
  displayOrder: z.coerce.number().int().nonnegative().default(0),
  active: z.union([z.boolean(), z.enum(['true', 'false']).transform((value) => value === 'true')]).default(true),
});

export const updatePhotoBodySchema = z.object({
  eventId: z.uuid().nullable().optional(),
  caption: z.string().trim().min(1).nullable().optional(),
  displayOrder: z.number().int().nonnegative().optional(),
  active: z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'Informe ao menos um campo para atualização.',
});

export type UpdatePhotoBody = z.infer<typeof updatePhotoBodySchema>;
