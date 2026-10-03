import type { FastifyPluginAsync } from 'fastify';

import { requireAdmin } from '../admin-auth.js';
import { createGiftCategoryBodySchema, giftCategoryIdParamsSchema, updateGiftCategoryBodySchema } from './admin-gift-category.schemas.js';
import { createAdminGiftCategory, listAdminGiftCategories, updateAdminGiftCategory } from './admin-gift-category.service.js';

export const adminGiftCategoryRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireAdmin);

  app.get('/', async (request, reply) => {
    try { return await listAdminGiftCategories(request.adminAccessToken); }
    catch (error) {
      request.log.error({ err: error }, 'Admin gift category list failed');
      return reply.status(500).send({ error: 'GIFT_CATEGORY_LIST_FAILED', message: 'Não foi possível listar as categorias.' });
    }
  });

  app.post('/', async (request, reply) => {
    const body = createGiftCategoryBodySchema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: 'INVALID_GIFT_CATEGORY', message: 'Dados da categoria inválidos.' });
    try { return reply.status(201).send(await createAdminGiftCategory(request.adminAccessToken, body.data)); }
    catch (error) {
      request.log.warn({ err: error }, 'Admin gift category creation failed');
      return reply.status(409).send({ error: 'GIFT_CATEGORY_CREATION_FAILED', message: 'Não foi possível criar a categoria.' });
    }
  });

  app.patch('/:categoryId', async (request, reply) => {
    const params = giftCategoryIdParamsSchema.safeParse(request.params);
    const body = updateGiftCategoryBodySchema.safeParse(request.body);
    if (!params.success || !body.success) return reply.status(400).send({ error: 'INVALID_GIFT_CATEGORY_UPDATE', message: 'Dados da atualização inválidos.' });
    try {
      const category = await updateAdminGiftCategory(request.adminAccessToken, params.data.categoryId, body.data);
      if (!category) return reply.status(404).send({ error: 'GIFT_CATEGORY_NOT_FOUND', message: 'Categoria não encontrada.' });
      return category;
    } catch (error) {
      request.log.warn({ err: error }, 'Admin gift category update failed');
      return reply.status(409).send({ error: 'GIFT_CATEGORY_UPDATE_FAILED', message: 'Não foi possível atualizar a categoria.' });
    }
  });
};
