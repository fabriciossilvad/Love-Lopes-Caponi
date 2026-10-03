import type { FastifyPluginAsync } from 'fastify';

import { requireAdmin } from '../admin-auth.js';
import { createGiftBodySchema, giftIdParamsSchema, updateGiftBodySchema } from './admin-gift.schemas.js';
import { isAllowedGiftImageType, uploadAdminGiftImage } from './admin-gift-image.service.js';
import { createAdminGift, listAdminGifts, updateAdminGift } from './admin-gift.service.js';

export const adminGiftRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireAdmin);

  app.get('/', async (request, reply) => {
    try {
      return await listAdminGifts(request.adminAccessToken);
    } catch (error) {
      request.log.error({ err: error }, 'Admin gift list failed');
      return reply.status(500).send({ error: 'GIFT_LIST_FAILED', message: 'Não foi possível listar os presentes.' });
    }
  });

  app.post('/', async (request, reply) => {
    const body = createGiftBodySchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'INVALID_GIFT', message: 'Dados do presente inválidos.' });
    }
    try {
      return reply.status(201).send(await createAdminGift(request.adminAccessToken, body.data));
    } catch (error) {
      request.log.warn({ err: error }, 'Admin gift creation failed');
      return reply.status(409).send({ error: 'GIFT_CREATION_FAILED', message: 'Não foi possível criar o presente.' });
    }
  });

  app.post('/:giftId/image', async (request, reply) => {
    const params = giftIdParamsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: 'INVALID_GIFT_ID', message: 'Presente inválido.' });
    }

    try {
      const part = await request.file();
      if (!part) {
        return reply.status(400).send({ error: 'GIFT_IMAGE_REQUIRED', message: 'Envie uma imagem.' });
      }
      if (!isAllowedGiftImageType(part.mimetype)) {
        part.file.resume();
        return reply.status(415).send({ error: 'INVALID_GIFT_IMAGE_TYPE', message: 'Use JPEG, PNG ou WebP.' });
      }

      const buffer = await part.toBuffer();
      return reply.status(201).send(
        await uploadAdminGiftImage(request.adminAccessToken, params.data.giftId, buffer, part.mimetype),
      );
    } catch (error) {
      request.log.warn({ err: error }, 'Admin gift image upload failed');
      const code = (error as { code?: string }).code;
      if (code === 'FST_REQ_FILE_TOO_LARGE') {
        return reply.status(413).send({ error: 'GIFT_IMAGE_TOO_LARGE', message: 'A imagem deve ter no máximo 5 MB.' });
      }
      return reply.status(409).send({ error: 'GIFT_IMAGE_UPLOAD_FAILED', message: 'Não foi possível salvar a imagem.' });
    }
  });

  app.patch('/:giftId', async (request, reply) => {
    const params = giftIdParamsSchema.safeParse(request.params);
    const body = updateGiftBodySchema.safeParse(request.body);
    if (!params.success || !body.success) {
      return reply.status(400).send({ error: 'INVALID_GIFT_UPDATE', message: 'Dados da atualização inválidos.' });
    }
    try {
      const gift = await updateAdminGift(request.adminAccessToken, params.data.giftId, body.data);
      if (!gift) return reply.status(404).send({ error: 'GIFT_NOT_FOUND', message: 'Presente não encontrado.' });
      return gift;
    } catch (error) {
      request.log.warn({ err: error }, 'Admin gift update failed');
      return reply.status(409).send({ error: 'GIFT_UPDATE_FAILED', message: 'Não foi possível atualizar o presente.' });
    }
  });
};
