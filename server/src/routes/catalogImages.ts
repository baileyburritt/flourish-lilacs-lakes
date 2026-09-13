import { randomUUID } from 'node:crypto';

import type { FastifyInstance } from 'fastify';

import { requireAuth } from '../auth.js';
import { putCatalogImage } from '../lib/catalogStorage.js';
import { MAX_CATALOG_IMAGE_BYTES } from '../lib/uploadLimits.js';

// E10 (§03, §06): the actual upload path a human-supplied destination/event
// photo goes through — infrastructure only, per CLAUDE.md's image-ticket
// scope. There's no destinations admin API yet to attach the returned URL
// to a row automatically; a human pastes it in by hand until that exists.
// Gated behind requireAuth only to keep it off the open internet — there's
// no admin role yet to scope it to more tightly than "any signed-in user."
export async function catalogImagesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  app.post('/', async (request, reply) => {
    const file = await request.file({ limits: { fileSize: MAX_CATALOG_IMAGE_BYTES } });
    if (!file) return reply.code(400).send({ error: 'No image file provided' });

    let buffer: Buffer;
    try {
      buffer = await file.toBuffer();
    } catch {
      return reply.code(413).send({ error: `Image exceeds the ${MAX_CATALOG_IMAGE_BYTES / (1024 * 1024)} MB limit` });
    }

    const key = `catalog/${randomUUID()}`;
    const url = await putCatalogImage(key, buffer, file.mimetype);
    return reply.code(201).send({ key, url });
  });
}
