import { afterAll, describe, expect, test } from 'vitest';
import type { FastifyInstance } from 'fastify';

import { buildApp } from '../src/app.js';
import { PER_IP_MAX_REQUESTS, PER_USER_MAX_REQUESTS } from '../src/lib/rateLimitConfig.js';
import { authHeader, createTestUser, deleteTestUser, type TestUser } from './helpers.js';

// E7 (§12): "no rate limiting anywhere" — this is the load test the ticket's
// done-when asks for. Each case builds its own app via buildApp() so its
// rate-limit store starts empty and can't inherit counts from another test
// or file (vitest.config.ts's fileParallelism:false only guarantees files
// don't race each other; it says nothing about state inside a shared app).

describe('per-IP rate limiting', () => {
  test('a single client is cut off after the per-IP limit, within one time window', async () => {
    const app = buildApp();
    await app.ready();

    let sawTooManyRequests = false;
    let successes = 0;
    for (let i = 0; i < PER_IP_MAX_REQUESTS + 5; i++) {
      const res = await app.inject({ method: 'GET', url: '/health' });
      if (res.statusCode === 429) {
        sawTooManyRequests = true;
        break;
      }
      expect(res.statusCode).toBe(200);
      successes++;
    }

    expect(sawTooManyRequests).toBe(true);
    expect(successes).toBe(PER_IP_MAX_REQUESTS);

    await app.close();
  });

  test('a different client IP is not blocked by another client exhausting its own limit', async () => {
    const app = buildApp();
    await app.ready();

    for (let i = 0; i < PER_IP_MAX_REQUESTS; i++) {
      const res = await app.inject({ method: 'GET', url: '/health', remoteAddress: '10.0.0.1' });
      expect(res.statusCode).toBe(200);
    }
    const exhausted = await app.inject({ method: 'GET', url: '/health', remoteAddress: '10.0.0.1' });
    expect(exhausted.statusCode).toBe(429);

    const otherClient = await app.inject({ method: 'GET', url: '/health', remoteAddress: '10.0.0.2' });
    expect(otherClient.statusCode).toBe(200);

    await app.close();
  });
});

describe('per-user rate limiting', () => {
  let app: FastifyInstance;
  let userA: TestUser;
  let userB: TestUser;

  afterAll(async () => {
    await deleteTestUser(userA);
    await deleteTestUser(userB);
    await app.close();
  });

  test('a single authenticated user is cut off after the per-user limit', async () => {
    app = buildApp();
    await app.ready();
    userA = await createTestUser('ratelimit-a');
    userB = await createTestUser('ratelimit-b');

    let sawTooManyRequests = false;
    let successes = 0;
    for (let i = 0; i < PER_USER_MAX_REQUESTS + 5; i++) {
      // Each request gets its own remoteAddress so the per-IP limiter above
      // (300/min) never fires first and masks what this test is checking.
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/me',
        headers: authHeader(userA),
        remoteAddress: `10.1.0.${i}`,
      });
      if (res.statusCode === 429) {
        sawTooManyRequests = true;
        break;
      }
      expect(res.statusCode).toBe(200);
      successes++;
    }

    expect(sawTooManyRequests).toBe(true);
    expect(successes).toBe(PER_USER_MAX_REQUESTS);
  });

  test('a different user is not blocked by another user exhausting their own limit', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/me',
      headers: authHeader(userB),
      remoteAddress: '10.2.0.1',
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().userId).toBe(userB.id);
  });
});
