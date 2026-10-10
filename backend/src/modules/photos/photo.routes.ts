import type { FastifyPluginAsync } from 'fastify';
import { createSupabaseAnonClient } from '../../config/supabase.js';

export const photoRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', async (_request, reply) => {
    const supabase = createSupabaseAnonClient();
    const { data, error } = await supabase.from('photos')
      .select('id, event_id, storage_path, caption, display_order, created_at')
      .eq('active', true)
      .order('display_order').order('created_at');
    if (error) return reply.status(500).send({ error: 'PHOTO_LIST_FAILED', message: 'Não foi possível carregar a galeria.' });

    return data.map((photo) => ({
      ...photo,
      public_url: supabase.storage.from('wedding-gallery').getPublicUrl(photo.storage_path).data.publicUrl,
    }));
  });
};
