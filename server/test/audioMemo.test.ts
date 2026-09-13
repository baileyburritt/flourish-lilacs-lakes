import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { eq } from 'drizzle-orm';
import FormData from 'form-data';
import type { FastifyInstance } from 'fastify';

import { buildApp } from '../src/app.js';
import { db } from '../src/db/client.js';
import { userPrivateGems } from '../src/db/schema.js';
import { deleteObject, signedGetUrl } from '../src/lib/storage.js';
import { authHeader, createTestUser, deleteTestUser, type TestUser } from './helpers.js';

// E11 (§04, §16): the committed audio-memo feature end to end, against real
// infra rather than mocks — the same standard E6/E7/E8 set for the pieces
// this ticket depends on. A memo needs a gem to attach to (POST
// /api/v1/gems, this ticket's addition — E4's locked ownership.test.ts never
// included a create route because nothing needed one before this), a way to
// turn the uploaded key back into something playable (GET /:id/audio,
// signed rather than the stored raw key per E6/§16), and to actually leave
// storage when the gem it belongs to is deleted rather than being orphaned.

let app: FastifyInstance;
let user: TestUser;
let other: TestUser;
const cleanupGemIds: string[] = [];
const cleanupKeys: string[] = [];

function multipartAudio(body = 'e11 fixture memo, safe to delete') {
  const form = new FormData();
  form.append('audio', Buffer.from(body), { filename: 'memo.m4a', contentType: 'audio/m4a' });
  return { payload: form.getBuffer(), headers: form.getHeaders() };
}

async function createGem(as: TestUser, title: string) {
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/gems',
    headers: authHeader(as),
    payload: { title },
  });
  cleanupGemIds.push(res.json().id);
  return res;
}

beforeAll(async () => {
  app = buildApp();
  await app.ready();
  user = await createTestUser('audio-memo');
  other = await createTestUser('audio-memo-other');
});

afterAll(async () => {
  await Promise.all(cleanupKeys.map((key) => deleteObject(key).catch(() => {})));
  // Cascades away automatically once the users are gone, but a test failing
  // mid-suite could otherwise leave a fixture gem behind under a live user.
  await Promise.all(cleanupGemIds.map((id) => db.delete(userPrivateGems).where(eq(userPrivateGems.id, id))));
  await deleteTestUser(user);
  await deleteTestUser(other);
  await app.close();
});

describe('creating a gem to attach a memo to', () => {
  test('the creator owns the new gem; a title is required', async () => {
    const missingTitle = await app.inject({ method: 'POST', url: '/api/v1/gems', headers: authHeader(user), payload: {} });
    expect(missingTitle.statusCode).toBe(400);

    const res = await createGem(user, 'E11 Creation Test Gem — safe to delete');
    expect(res.statusCode).toBe(201);
    expect(res.json().title).toBe('E11 Creation Test Gem — safe to delete');

    const otherRes = await app.inject({
      method: 'GET',
      url: `/api/v1/gems/${res.json().id}`,
      headers: authHeader(other),
    });
    expect(otherRes.statusCode).toBe(404);
  });
});

describe('recording, uploading, and playing back a memo', () => {
  let gemId: string;
  let audioKey: string;

  beforeAll(async () => {
    const createRes = await createGem(user, 'E11 Playback Test Gem — safe to delete');
    gemId = createRes.json().id;
  });

  test('an uploaded memo attaches to the gem and resolves to a working signed playback URL', async () => {
    const { payload, headers } = multipartAudio();
    const uploadRes = await app.inject({
      method: 'POST',
      url: `/api/v1/gems/${gemId}/audio`,
      headers: { ...headers, ...authHeader(user) },
      payload,
    });
    expect(uploadRes.statusCode).toBe(201);
    audioKey = uploadRes.json().audioUrl;
    cleanupKeys.push(audioKey);

    const urlRes = await app.inject({ method: 'GET', url: `/api/v1/gems/${gemId}/audio`, headers: authHeader(user) });
    expect(urlRes.statusCode).toBe(200);

    // The playback URL has to actually work, not just exist — fetching it
    // is what proves E6's signed-URL scheme resolved correctly, the same
    // check server/test/storage.test.ts and accountDeletion.test.ts use.
    const playback = await fetch(urlRes.json().url);
    expect(playback.status).toBe(200);
    expect(await playback.text()).toBe('e11 fixture memo, safe to delete');
  });

  test('another user cannot resolve a playback URL for a memo they do not own', async () => {
    const res = await app.inject({ method: 'GET', url: `/api/v1/gems/${gemId}/audio`, headers: authHeader(other) });
    expect(res.statusCode).toBe(404);
  });

  test('a gem with no memo yet returns 404 rather than a broken URL', async () => {
    const emptyGem = await createGem(user, 'E11 No Memo Yet Test Gem — safe to delete');
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/gems/${emptyGem.json().id}/audio`,
      headers: authHeader(user),
    });
    expect(res.statusCode).toBe(404);
  });

  test('deleting the gem removes its memo from storage, not just the database', async () => {
    const res = await app.inject({ method: 'DELETE', url: `/api/v1/gems/${gemId}`, headers: authHeader(user) });
    expect(res.statusCode).toBe(200);

    const gone = await db.select().from(userPrivateGems).where(eq(userPrivateGems.id, gemId));
    expect(gone).toHaveLength(0);

    // Signing a fresh URL only proves a key *could* be fetched if it still
    // existed — a 404 here is R2 saying the object itself is gone, not
    // merely that Postgres stopped pointing at it.
    const afterDelete = await fetch(await signedGetUrl(audioKey));
    expect(afterDelete.status).toBe(404);
  });
});
