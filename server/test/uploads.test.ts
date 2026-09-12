import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { eq } from 'drizzle-orm';
import FormData from 'form-data';
import type { FastifyInstance } from 'fastify';

import { buildApp } from '../src/app.js';
import { db } from '../src/db/client.js';
import { userPrivateGems } from '../src/db/schema.js';
import { deleteObject } from '../src/lib/storage.js';
import { MAX_AUDIO_BYTES, MAX_PHOTOS_PER_GEM, MAX_PHOTO_BYTES } from '../src/lib/uploadLimits.js';
import { authHeader, createTestUser, deleteTestUser, type TestUser } from './helpers.js';

// E7 (§12): "photo and audio uploads are unbounded" — this proves the caps
// against the real Fastify app, real Postgres and the real R2 bucket, the
// same no-mocks standard test/storage.test.ts (E6) set: the finding is about
// what a real oversized/over-quota request does, not what a mock says it
// would do.

let app: FastifyInstance;
let user: TestUser;
let gemId: string;
const createdKeys: string[] = [];

function multipartRequest(fieldName: string, buffer: Buffer, filename: string, contentType: string) {
  const form = new FormData();
  form.append(fieldName, buffer, { filename, contentType });
  return { payload: form.getBuffer(), headers: form.getHeaders() };
}

async function currentGem() {
  const [row] = await db.select().from(userPrivateGems).where(eq(userPrivateGems.id, gemId));
  return row;
}

beforeAll(async () => {
  app = buildApp();
  await app.ready();
  user = await createTestUser('uploads');

  const [gem] = await db
    .insert(userPrivateGems)
    .values({ userId: user.id, title: 'E7 Upload Test Gem — safe to delete' })
    .returning();
  gemId = gem.id;
});

afterAll(async () => {
  await Promise.all(createdKeys.map((key) => deleteObject(key).catch(() => {})));
  await deleteTestUser(user);
  await app.close();
});

describe('photo uploads', () => {
  test('a photo within the size limit uploads and is attached to the gem', async () => {
    const { payload, headers } = multipartRequest(
      'photo',
      Buffer.from('a tiny real photo, safe to delete'),
      'tiny.jpg',
      'image/jpeg',
    );
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/gems/${gemId}/photos`,
      headers: { ...headers, ...authHeader(user) },
      payload,
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.photoUrls).toHaveLength(1);
    createdKeys.push(...body.photoUrls);
  });

  test('a photo over the size limit is rejected with 413 before it reaches storage', async () => {
    const oversized = Buffer.alloc(MAX_PHOTO_BYTES + 1024, 'x');
    const { payload, headers } = multipartRequest('photo', oversized, 'huge.jpg', 'image/jpeg');
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/gems/${gemId}/photos`,
      headers: { ...headers, ...authHeader(user) },
      payload,
    });
    expect(res.statusCode).toBe(413);

    // Still just the one photo from the previous test — the oversized
    // upload never got far enough to call putObject.
    const gem = await currentGem();
    expect(gem.photoUrls).toHaveLength(1);
  });

  test('a gem already at the photo count cap rejects another upload without reading the file', async () => {
    const fullPhotoUrls = Array.from(
      { length: MAX_PHOTOS_PER_GEM },
      (_, i) => `gems/${user.id}/${gemId}/photos/fixture-${i}`,
    );
    await db.update(userPrivateGems).set({ photoUrls: fullPhotoUrls }).where(eq(userPrivateGems.id, gemId));

    const { payload, headers } = multipartRequest('photo', Buffer.from('one too many'), 'onemore.jpg', 'image/jpeg');
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/gems/${gemId}/photos`,
      headers: { ...headers, ...authHeader(user) },
      payload,
    });
    expect(res.statusCode).toBe(400);

    const gem = await currentGem();
    expect(gem.photoUrls).toEqual(fullPhotoUrls);
  });
});

describe('audio uploads', () => {
  test('an audio memo within the size limit uploads and is attached to the gem', async () => {
    const { payload, headers } = multipartRequest(
      'audio',
      Buffer.from('a tiny real audio memo, safe to delete'),
      'tiny.m4a',
      'audio/m4a',
    );
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/gems/${gemId}/audio`,
      headers: { ...headers, ...authHeader(user) },
      payload,
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.audioUrl).toBeTruthy();
    createdKeys.push(body.audioUrl);
  });

  test('an audio memo over the size limit is rejected with 413 before it reaches storage', async () => {
    const previousAudioUrl = (await currentGem()).audioUrl;

    const oversized = Buffer.alloc(MAX_AUDIO_BYTES + 1024, 'x');
    const { payload, headers } = multipartRequest('audio', oversized, 'huge.m4a', 'audio/m4a');
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/gems/${gemId}/audio`,
      headers: { ...headers, ...authHeader(user) },
      payload,
    });
    expect(res.statusCode).toBe(413);

    const gem = await currentGem();
    expect(gem.audioUrl).toBe(previousAudioUrl);
  });
});

describe('ownership on upload endpoints', () => {
  test('another user uploading to a gem they do not own gets 404, not 403', async () => {
    const other = await createTestUser('uploads-other');
    const { payload, headers } = multipartRequest('photo', Buffer.from('hijack attempt'), 'hijack.jpg', 'image/jpeg');
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/gems/${gemId}/photos`,
      headers: { ...headers, ...authHeader(other) },
      payload,
    });
    expect(res.statusCode).toBe(404);
    await deleteTestUser(other);
  });
});
