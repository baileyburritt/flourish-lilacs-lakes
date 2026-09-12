import type { FastifyInstance } from 'fastify';

import { requireAuth } from '../auth.js';
import { bookmarksRepo } from '../repositories/index.js';

// E5 (§12): only the two routes E4's suite specifies — list and delete.
// There's no PATCH (a bookmark has nothing to edit) or per-id GET in the
// contract, so none is added here.
export async function bookmarksRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  app.get('/', async (request) => bookmarksRepo.list(request.userId!));

  app.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const bookmark = await bookmarksRepo.remove(id, request.userId!);
    if (!bookmark) return reply.code(404).send({ error: 'Not found' });
    return { ok: true };
  });
}
