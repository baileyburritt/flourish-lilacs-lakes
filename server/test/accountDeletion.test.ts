import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { eq } from 'drizzle-orm';
import FormData from 'form-data';
import type { FastifyInstance } from 'fastify';

import { buildApp } from '../src/app.js';
import { db } from '../src/db/client.js';
import { userPrivateGems } from '../src/db/schema.js';
import { deleteObject, signedGetUrl } from '../src/lib/storage.js';
import { authHeader, createTestUser, deleteTestUser, type TestUser } from './helpers.js';

// E8 (§12): Apple 5.1.1(v) requires in-app account deletion. The DB-cascade
// half of this (trips/gems/bookmarks disappearing with the user) already
// worked from E1 — the gap this ticket closes, and the only thing worth an
// end-to-end proof, is that photo and audio memo objects are actually
// removed from the real R2 bucket rather than orphaned once nothing in
// Postgres references their keys any more. So this test creates an account
// with a real uploaded photo and audio memo, deletes the account through
// the real endpoint, and confirms both objects are genuinely gone from
// storage — not just that the gem row disappeared.

let app: FastifyInstance;
let user: TestUser;
let gemId: string;
let photoKey: string;
let audioKey: string;

function multipartRequest(fieldName: string, buffer: Buffer, filename: string, contentType: string) {
  const form = new FormData();
  form.append(fieldName, buffer, { filename, contentType });
  return { payload: form.getBuffer(), headers: form.getHeaders() };
}

beforeAll(async () => {
  app = buildApp();
  await app.ready();
  user = await createTestUser('account-deletion');

  const [gem] = await db
    .insert(userPrivateGems)
    .values({ userId: user.id, title: 'E8 Account Deletion Test Gem — safe to delete' })
    .returning();
  gemId = gem.id;

  const photoUpload = multipartRequest(
    'photo',
    Buffer.from('e8 account deletion fixture photo, safe to delete'),
    'tiny.jpg',
    'image/jpeg',
  );
  const photoRes = await app.inject({
    method: 'POST',
    url: `/api/v1/gems/${gemId}/photos`,
    headers: { ...photoUpload.headers, ...authHeader(user) },
    payload: photoUpload.payload,
  });
  photoKey = photoRes.json().photoUrls[0];

  const audioUpload = multipartRequest(
    'audio',
    Buffer.from('e8 account deletion fixture audio memo, safe to delete'),
    'tiny.m4a',
    'audio/m4a',
  );
  const audioRes = await app.inject({
    method: 'POST',
    url: `/api/v1/gems/${gemId}/audio`,
    headers: { ...audioUpload.headers, ...authHeader(user) },
    payload: audioUpload.payload,
  });
  audioKey = audioRes.json().audioUrl;
});

afterAll(async () => {
  // A safety net if an assertion below fails before deletion runs — once the
  // account-deletion test itself succeeds, all of this is already a no-op.
  await Promise.all([photoKey, audioKey].map((key) => deleteObject(key).catch(() => {})));
  await deleteTestUser(user);
  await app.close();
});

describe('account deletion', () => {
  test('deleting the account cascades gems and removes their storage objects', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/account',
      headers: authHeader(user),
    });
    expect(res.statusCode).toBe(200);

    const [gemRow] = await db.select().from(userPrivateGems).where(eq(userPrivateGems.id, gemId));
    expect(gemRow).toBeUndefined();

    // Signing a URL only proves a key *could* be fetched if it existed —
    // it doesn't check existence itself, so a 404 here is R2 telling us the
    // object is actually gone, not just that the DB stopped pointing at it.
    const photoRes = await fetch(await signedGetUrl(photoKey));
    expect(photoRes.status).toBe(404);

    const audioRes = await fetch(await signedGetUrl(audioKey));
    expect(audioRes.status).toBe(404);
  });
});
