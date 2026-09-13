import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import FormData from 'form-data';
import type { FastifyInstance } from 'fastify';

import { buildApp } from '../src/app.js';
import { deleteCatalogImage } from '../src/lib/catalogStorage.js';
import { MAX_CATALOG_IMAGE_BYTES } from '../src/lib/uploadLimits.js';
import { authHeader, createTestUser, deleteTestUser, type TestUser } from './helpers.js';

// E10 (§03, §06): proves the owned-storage pipeline against the real app,
// a real (separate, public) R2 bucket, and real HTTP fetches to the
// returned URL — not a mock — matching the no-mocks standard test/
// storage.test.ts (E6) and test/uploads.test.ts (E7) already set. Unlike a
// gem photo, a catalog image's whole point is to be reachable unsigned:
// this is the inverse of storage.test.ts's "a raw URL is rejected" case.

let app: FastifyInstance;
let user: TestUser;
const createdKeys: string[] = [];

function multipartRequest(buffer: Buffer, filename: string, contentType: string) {
  const form = new FormData();
  form.append('image', buffer, { filename, contentType });
  return { payload: form.getBuffer(), headers: form.getHeaders() };
}

beforeAll(async () => {
  app = buildApp();
  await app.ready();
  user = await createTestUser('catalog-images');
});

afterAll(async () => {
  await Promise.all(createdKeys.map((key) => deleteCatalogImage(key).catch(() => {})));
  await deleteTestUser(user);
  await app.close();
});

describe('catalog image uploads', () => {
  test('an image within the size limit uploads and its public URL is reachable unsigned', async () => {
    const body = 'a tiny real catalog image, safe to delete';
    const { payload, headers } = multipartRequest(Buffer.from(body), 'tiny.jpg', 'image/jpeg');
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/catalog-images',
      headers: { ...headers, ...authHeader(user) },
      payload,
    });
    expect(res.statusCode).toBe(201);
    const { key, url } = res.json();
    expect(key).toBeTruthy();
    createdKeys.push(key);

    const fetched = await fetch(url);
    expect(fetched.status).toBe(200);
    expect(await fetched.text()).toBe(body);
  });

  test('an image over the size limit is rejected with 413 before it reaches storage', async () => {
    const oversized = Buffer.alloc(MAX_CATALOG_IMAGE_BYTES + 1024, 'x');
    const { payload, headers } = multipartRequest(oversized, 'huge.jpg', 'image/jpeg');
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/catalog-images',
      headers: { ...headers, ...authHeader(user) },
      payload,
    });
    expect(res.statusCode).toBe(413);
  });

  test('an unauthenticated upload is rejected', async () => {
    const { payload, headers } = multipartRequest(Buffer.from('anon'), 'anon.jpg', 'image/jpeg');
    const res = await app.inject({ method: 'POST', url: '/api/v1/catalog-images', headers, payload });
    expect(res.statusCode).toBe(401);
  });
});
