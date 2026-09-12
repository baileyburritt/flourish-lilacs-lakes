import type { FastifyInstance } from 'fastify';

import { requireAuth } from '../auth.js';
import { pick } from '../lib/pick.js';
import { gemsRepo } from '../repositories/index.js';
import type { userPrivateGems } from '../db/schema.js';

type Gem = typeof userPrivateGems.$inferSelect;

const PATCHABLE_FIELDS = [
  'title',
  'landmarkNote',
  'notes',
  'category',
  'photoUrls',
  'audioUrl',
  'idealSeason',
  'goldenHour',
  'attachedTripId',
  'latitude',
  'longitude',
] as const satisfies readonly (keyof Gem)[];

// E5 (§12): implements the contract server/test/ownership.test.ts defines.
// Cross-user access to a real id returns 404, not 403 — existence itself is
// private — which falls straight out of gemsRepo.find/update/remove
// returning nothing for a row that exists but isn't the caller's.
export async function gemsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  app.get('/', async (request) => gemsRepo.list(request.userId!));

  app.get('/export', async (request) => gemsRepo.list(request.userId!));

  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const gem = await gemsRepo.find(id, request.userId!);
    if (!gem) return reply.code(404).send({ error: 'Not found' });
    return gem;
  });

  app.patch('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const patch = pick(request.body as Gem, PATCHABLE_FIELDS);
    const gem = await gemsRepo.update(id, request.userId!, { ...patch, updatedAt: new Date() });
    if (!gem) return reply.code(404).send({ error: 'Not found' });
    return gem;
  });

  app.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const gem = await gemsRepo.remove(id, request.userId!);
    if (!gem) return reply.code(404).send({ error: 'Not found' });
    return { ok: true };
  });
}
