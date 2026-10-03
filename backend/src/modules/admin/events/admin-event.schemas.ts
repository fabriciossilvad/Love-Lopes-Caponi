import { z } from 'zod';

const nullableText = z.string().trim().min(1).nullable().optional();
const nullableUrl = z.url().nullable().optional();

export const eventIdParamsSchema = z.object({
  eventId: z.uuid(),
});

export const createEventBodySchema = z.object({
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: nullableText,
  eventDate: z.iso.datetime({ offset: true }),
  venueName: nullableText,
  address: nullableText,
  mapsUrl: nullableUrl,
  rsvpDeadline: z.iso.datetime({ offset: true }).nullable().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'FINISHED']).default('DRAFT'),
  additionalInfo: nullableText,
}).refine(
  (data) => !data.rsvpDeadline || new Date(data.rsvpDeadline) <= new Date(data.eventDate),
  { message: 'O prazo de RSVP deve ser anterior ou igual à data do evento.', path: ['rsvpDeadline'] },
);

export const updateEventBodySchema = createEventBodySchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Informe ao menos um campo para atualização.',
  });

export type CreateEventBody = z.infer<typeof createEventBodySchema>;
export type UpdateEventBody = z.infer<typeof updateEventBodySchema>;
