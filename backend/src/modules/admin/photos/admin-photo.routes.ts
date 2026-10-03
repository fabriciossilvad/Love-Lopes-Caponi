import type { FastifyPluginAsync } from 'fastify';

import { requireAdmin } from '../admin-auth.js';
import { createPhotoFieldsSchema, photoIdParamsSchema, updatePhotoBodySchema } from './admin-photo.schemas.js';
import { createAdminPhoto, hasValidPhotoSignature, isAllowedPhotoType, listAdminPhotos, updateAdminPhoto } from './admin-photo.service.js';

export const adminPhotoRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireAdmin);

  app.get('/', async (request, reply) => {
    try { return await listAdminPhotos(request.adminAccessToken); }
    catch (error) {
      request.log.error({ err: error }, 'Admin photo list failed');
      return reply.status(500).send({ error: 'PHOTO_LIST_FAILED', message: 'Não foi possível listar as fotos.' });
    }
  });

  app.post('/', async (request, reply) => {
    try {
      const part = await request.file();
      if (!part) return reply.status(400).send({ error: 'PHOTO_REQUIRED', message: 'Envie uma imagem.' });
      if (!isAllowedPhotoType(part.mimetype)) {
        part.file.resume();
        return reply.status(415).send({ error: 'INVALID_PHOTO_TYPE', message: 'Use JPEG, PNG ou WebP.' });
      }

      const fieldsRaw: Record<string, string> = {};
      for (const [key, value] of Object.entries(part.fields)) {
        if (value && typeof value === 'object' && 'value' in value) fieldsRaw[key] = String(value.value);
      }
      const fields = createPhotoFieldsSchema.safeParse({
        eventId: fieldsRaw.eventId || undefined,
        caption: fieldsRaw.caption || undefined,
        displayOrder: fieldsRaw.displayOrder ?? undefined,
        active: fieldsRaw.active ?? undefined,
      });
      if (!fields.success) return reply.status(400).send({ error: 'INVALID_PHOTO', message: 'Dados da foto inválidos.' });

      const buffer = await part.toBuffer();
      if (!hasValidPhotoSignature(buffer, part.mimetype)) {
        return reply.status(415).send({ error: 'INVALID_PHOTO_CONTENT', message: 'O conteúdo do arquivo não corresponde a uma imagem válida.' });
      }
      return reply.status(201).send(await createAdminPhoto(request.adminAccessToken, buffer, part.mimetype, fields.data));
    } catch (error) {
      request.log.warn({ err: error }, 'Admin photo creation failed');
      const code = (error as { code?: string }).code;
      if (code === 'FST_REQ_FILE_TOO_LARGE') return reply.status(413).send({ error: 'PHOTO_TOO_LARGE', message: 'A imagem excede o limite permitido.' });
      if ((error as Error).message === 'EVENT_NOT_FOUND') return reply.status(404).send({ error: 'EVENT_NOT_FOUND', message: 'Evento não encontrado.' });
      return reply.status(409).send({ error: 'PHOTO_CREATION_FAILED', message: 'Não foi possível salvar a foto.' });
    }
  });

  app.patch('/:photoId', async (request, reply) => {
    const params = photoIdParamsSchema.safeParse(request.params);
    const body = updatePhotoBodySchema.safeParse(request.body);
    if (!params.success || !body.success) return reply.status(400).send({ error: 'INVALID_PHOTO_UPDATE', message: 'Dados da atualização inválidos.' });
    try {
      const photo = await updateAdminPhoto(request.adminAccessToken, params.data.photoId, body.data);
      if (!photo) return reply.status(404).send({ error: 'PHOTO_NOT_FOUND', message: 'Foto não encontrada.' });
      return photo;
    } catch (error) {
      request.log.warn({ err: error }, 'Admin photo update failed');
      return reply.status(409).send({ error: 'PHOTO_UPDATE_FAILED', message: 'Não foi possível atualizar a foto.' });
    }
  });
};
