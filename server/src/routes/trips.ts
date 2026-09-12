import type { FastifyInstance } from 'fastify';

import { requireAuth } from '../auth.js';
import { pick } from '../lib/pick.js';
import { tripsRepo } from '../repositories/index.js';
import type { trips } from '../db/schema.js';

type Trip = typeof trips.$inferSelect;

const PATCHABLE_FIELDS = [
  'title',
  'description',
  'startDate',
  'endDate',
  'coverImageUrl',
  'isArchived',
] as const satisfies readonly (keyof Trip)[];

// E5 (§12): implements the contract server/test/ownership.test.ts defines —
// see gems.ts, same shape.
export async function tripsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  app.get('/', async (request) => tripsRepo.list(request.userId!));

  app.get('/export', async (request) => tripsRepo.list(request.userId!));

  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const trip = await tripsRepo.find(id, request.userId!);
    if (!trip) return reply.code(404).send({ error: 'Not found' });
    return trip;
  });

  app.patch('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const patch = pick(request.body as Trip, PATCHABLE_FIELDS);
    const trip = await tripsRepo.update(id, request.userId!, { ...patch, updatedAt: new Date() });
    if (!trip) return reply.code(404).send({ error: 'Not found' });
    return trip;
  });

  app.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const trip = await tripsRepo.remove(id, request.userId!);
    if (!trip) return reply.code(404).send({ error: 'Not found' });
    return { ok: true };
  });
}
