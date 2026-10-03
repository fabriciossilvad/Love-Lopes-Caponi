import { z } from 'zod';

export const siteContentKeyParamsSchema = z.object({
  key: z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/),
});

export const upsertSiteContentBodySchema = z.object({
  value: z.string().nullable(),
});

export type UpsertSiteContentBody = z.infer<typeof upsertSiteContentBodySchema>;
