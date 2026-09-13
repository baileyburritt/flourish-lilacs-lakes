import { randomUUID } from 'node:crypto';

import type { FastifyInstance } from 'fastify';

import { requireAuth } from '../auth.js';
import { pick } from '../lib/pick.js';
import { deleteObject, putObject, signedGetUrl } from '../lib/storage.js';
import { MAX_AUDIO_BYTES, MAX_PHOTOS_PER_GEM, MAX_PHOTO_BYTES } from '../lib/uploadLimits.js';
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

  // E11 (§04, §16): the audio-memo capture flow attaches an upload to a gem
  // by id (POST /:id/audio below), which means a gem has to exist first —
  // E4's locked ownership contract (server/test/ownership.test.ts) never
  // included a create route because nothing before this ticket needed the
  // client to make one. Scoped to the caller the same way every other
  // gemsRepo call is: `userId` comes from requireAuth, never the body.
  app.post('/', async (request, reply) => {
    const body = request.body as Partial<Gem> | undefined;
    if (typeof body?.title !== 'string' || !body.title.trim()) {
      return reply.code(400).send({ error: 'title is required' });
    }
    const gem = await gemsRepo.create(request.userId!, pick(body, PATCHABLE_FIELDS));
    return reply.code(201).send(gem);
  });

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

    // E11 (§04, §16, applying E8's account-deletion pattern to a single gem):
    // the row disappearing doesn't touch R2 on its own. Without this, a
    // deleted gem's audio memo — "the most sensitive artifact this product
    // stores" per §16 — would silently outlive the gem it was recorded for.
    const keys = gem.audioUrl ? [...gem.photoUrls, gem.audioUrl] : gem.photoUrls;
    await Promise.all(keys.map((key) => deleteObject(key)));

    return { ok: true };
  });

  // E7 (§12): the actual upload path the count/size caps below exist to
  // guard — until this, photoUrls/audioUrl could only be set to arbitrary
  // strings via PATCH, with nothing that ever touched storage. Object keys
  // (not signed URLs, which expire) are what gets stored; resolving a
  // photoUrls key to a short-lived signed GET URL at read time is still
  // unfinished work from E6 this ticket doesn't need to close — E11 below
  // closes it for audioUrl specifically, since a memo is unplayable without it.
  app.post('/:id/photos', async (request, reply) => {
    const { id } = request.params as { id: string };
    const gem = await gemsRepo.find(id, request.userId!);
    if (!gem) return reply.code(404).send({ error: 'Not found' });

    // Count cap enforced before the file is even read off the wire — an
    // over-quota upload never reaches storage, per this ticket's done-when.
    if (gem.photoUrls.length >= MAX_PHOTOS_PER_GEM) {
      return reply.code(400).send({ error: `A gem can have at most ${MAX_PHOTOS_PER_GEM} photos` });
    }

    const file = await request.file({ limits: { fileSize: MAX_PHOTO_BYTES } });
    if (!file) return reply.code(400).send({ error: 'No photo file provided' });

    let buffer: Buffer;
    try {
      buffer = await file.toBuffer();
    } catch {
      return reply.code(413).send({ error: `Photo exceeds the ${MAX_PHOTO_BYTES / (1024 * 1024)} MB limit` });
    }

    const key = `gems/${request.userId}/${id}/photos/${randomUUID()}`;
    await putObject(key, buffer, file.mimetype);

    const updated = await gemsRepo.update(id, request.userId!, {
      photoUrls: [...gem.photoUrls, key],
      updatedAt: new Date(),
    });
    return reply.code(201).send(updated);
  });

  app.post('/:id/audio', async (request, reply) => {
    const { id } = request.params as { id: string };
    const gem = await gemsRepo.find(id, request.userId!);
    if (!gem) return reply.code(404).send({ error: 'Not found' });

    const file = await request.file({ limits: { fileSize: MAX_AUDIO_BYTES } });
    if (!file) return reply.code(400).send({ error: 'No audio file provided' });

    let buffer: Buffer;
    try {
      buffer = await file.toBuffer();
    } catch {
      return reply.code(413).send({ error: `Audio exceeds the ${MAX_AUDIO_BYTES / (1024 * 1024)} MB limit` });
    }

    const key = `gems/${request.userId}/${id}/audio/${randomUUID()}`;
    await putObject(key, buffer, file.mimetype);

    const updated = await gemsRepo.update(id, request.userId!, { audioUrl: key, updatedAt: new Date() });
    return reply.code(201).send(updated);
  });

  // E11 (§04, §16): resolves the stored object key to a short-lived signed
  // GET URL at playback time, rather than handing out `audioUrl` as-is —
  // the raw key in a PATCH/GET response is meaningless to R2 without a
  // signature (E6), so this is the endpoint a client actually plays from.
  // 404 covers both "no such gem" and "gem exists but has no memo yet",
  // same as every other gems.ts route: existence itself is private.
  app.get('/:id/audio', async (request, reply) => {
    const { id } = request.params as { id: string };
    const gem = await gemsRepo.find(id, request.userId!);
    if (!gem?.audioUrl) return reply.code(404).send({ error: 'Not found' });
    return { url: await signedGetUrl(gem.audioUrl) };
  });
}
