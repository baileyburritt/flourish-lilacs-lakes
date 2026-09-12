import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { eq, like } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';

import { buildApp } from '../src/app.js';
import { db } from '../src/db/client.js';
import { bookmarks, destinations, trips, userPrivateGems } from '../src/db/schema.js';
import { authHeader, createTestUser, deleteTestUser, type TestUser } from './helpers.js';

// E4 (§12), non-delegable per CLAUDE.md: this suite is the human-approved
// gate that must exist and fail *before* E5 writes a single endpoint. It
// defines the contract E5 implements against, not just documents one:
//
//   GET    /api/v1/gems           list the caller's own gems
//   GET    /api/v1/gems/:id       one gem, only if the caller owns it
//   PATCH  /api/v1/gems/:id       update, only if the caller owns it
//   DELETE /api/v1/gems/:id       delete, only if the caller owns it
//   GET    /api/v1/gems/export    every gem the caller owns
//   (the same five, s/gems/trips/)
//   GET    /api/v1/bookmarks      list the caller's own bookmarks
//   DELETE /api/v1/bookmarks/:id  delete, only if the caller owns it
//
// None of this exists yet — every test below is expected to fail right now,
// and should keep failing until E5 lands. Each test asserts the *owner's*
// access first: since none of these routes exist, that assertion fails
// immediately (expected 200, got 404) and the test stops there, rather than
// silently passing the cross-user check for the wrong reason (no route to
// even reach) once E5 partially lands. Only once the owner path genuinely
// works does the cross-user assertion mean anything.
//
// Cross-user access to another real record returns 404, not 403 — a gem or
// trip's existence is itself private, per §12's specific finding.
// Unauthenticated requests get 401 (blocked before ownership is even
// evaluated), which is a different failure mode from "exists but not
// yours."

let app: FastifyInstance;
let userA: TestUser;
let userB: TestUser;
let destinationId: string;
let gemId: string;
let tripId: string;
let bookmarkId: string;

beforeAll(async () => {
  app = buildApp();
  await app.ready();

  userA = await createTestUser('owner');
  userB = await createTestUser('other');

  const [destination] = await db
    .insert(destinations)
    .values({
      slug: `e4-test-destination-${Date.now()}`,
      title: 'E4 Test Destination',
      description: 'Fixture destination for server/test/ownership.test.ts — not a real place.',
      region: 'ROCHESTER_METRO',
      category: 'CIVIC_LANDMARK',
      latitude: '43.1566000',
      longitude: '-77.6088000',
      coverImageUrl: 'https://example.test/images/e4-fixture.jpg',
    })
    .returning();
  destinationId = destination.id;

  const [gem] = await db
    .insert(userPrivateGems)
    .values({ userId: userA.id, title: "E4 Test Gem — Owner's" })
    .returning();
  gemId = gem.id;

  const [trip] = await db.insert(trips).values({ userId: userA.id, title: "E4 Test Trip — Owner's" }).returning();
  tripId = trip.id;

  const [bookmark] = await db
    .insert(bookmarks)
    .values({ userId: userA.id, subjectType: 'DESTINATION', destinationId })
    .returning();
  bookmarkId = bookmark.id;
});

afterAll(async () => {
  await deleteTestUser(userA);
  await deleteTestUser(userB);
  // LIKE, not a tracked id: the "listing" test below creates a second
  // fixture destination of its own.
  await db.delete(destinations).where(like(destinations.slug, 'e4-test-destination%'));
  await app.close();
});

describe('private gems', () => {
  test('the owner can read their own gem', async () => {
    const res = await app.inject({ method: 'GET', url: `/api/v1/gems/${gemId}`, headers: authHeader(userA) });
    expect(res.statusCode).toBe(200);
    expect(res.json().id).toBe(gemId);
  });

  test('another user reading it gets 404, not 403', async () => {
    const owner = await app.inject({ method: 'GET', url: `/api/v1/gems/${gemId}`, headers: authHeader(userA) });
    expect(owner.statusCode).toBe(200);

    const other = await app.inject({ method: 'GET', url: `/api/v1/gems/${gemId}`, headers: authHeader(userB) });
    expect(other.statusCode).toBe(404);
  });

  test('an unauthenticated request gets 401', async () => {
    const owner = await app.inject({ method: 'GET', url: `/api/v1/gems/${gemId}`, headers: authHeader(userA) });
    expect(owner.statusCode).toBe(200);

    const anon = await app.inject({ method: 'GET', url: `/api/v1/gems/${gemId}` });
    expect(anon.statusCode).toBe(401);
  });

  test('another user cannot update it', async () => {
    const owner = await app.inject({ method: 'GET', url: `/api/v1/gems/${gemId}`, headers: authHeader(userA) });
    expect(owner.statusCode).toBe(200);

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/gems/${gemId}`,
      headers: authHeader(userB),
      payload: { title: 'Hijacked' },
    });
    expect(res.statusCode).toBe(404);

    const stillOwners = await db.select().from(userPrivateGems).where(eq(userPrivateGems.id, gemId));
    expect(stillOwners[0]?.title).not.toBe('Hijacked');
  });

  test('another user cannot delete it', async () => {
    const owner = await app.inject({ method: 'GET', url: `/api/v1/gems/${gemId}`, headers: authHeader(userA) });
    expect(owner.statusCode).toBe(200);

    const res = await app.inject({ method: 'DELETE', url: `/api/v1/gems/${gemId}`, headers: authHeader(userB) });
    expect(res.statusCode).toBe(404);

    const stillExists = await db.select().from(userPrivateGems).where(eq(userPrivateGems.id, gemId));
    expect(stillExists).toHaveLength(1);
  });

  test("listing does not leak another user's gem", async () => {
    const ownerList = await app.inject({ method: 'GET', url: '/api/v1/gems', headers: authHeader(userA) });
    expect(ownerList.statusCode).toBe(200);
    expect(ownerList.json().map((g: { id: string }) => g.id)).toContain(gemId);

    const otherList = await app.inject({ method: 'GET', url: '/api/v1/gems', headers: authHeader(userB) });
    expect(otherList.statusCode).toBe(200);
    expect(otherList.json().map((g: { id: string }) => g.id)).not.toContain(gemId);
  });

  test("exporting does not leak another user's gem", async () => {
    const ownerExport = await app.inject({ method: 'GET', url: '/api/v1/gems/export', headers: authHeader(userA) });
    expect(ownerExport.statusCode).toBe(200);
    expect(ownerExport.json().map((g: { id: string }) => g.id)).toContain(gemId);

    const otherExport = await app.inject({ method: 'GET', url: '/api/v1/gems/export', headers: authHeader(userB) });
    expect(otherExport.statusCode).toBe(200);
    expect(otherExport.json().map((g: { id: string }) => g.id)).not.toContain(gemId);
  });
});

describe('trips', () => {
  test('the owner can read their own trip', async () => {
    const res = await app.inject({ method: 'GET', url: `/api/v1/trips/${tripId}`, headers: authHeader(userA) });
    expect(res.statusCode).toBe(200);
    expect(res.json().id).toBe(tripId);
  });

  test('another user reading it gets 404, not 403', async () => {
    const owner = await app.inject({ method: 'GET', url: `/api/v1/trips/${tripId}`, headers: authHeader(userA) });
    expect(owner.statusCode).toBe(200);

    const other = await app.inject({ method: 'GET', url: `/api/v1/trips/${tripId}`, headers: authHeader(userB) });
    expect(other.statusCode).toBe(404);
  });

  test('an unauthenticated request gets 401', async () => {
    const owner = await app.inject({ method: 'GET', url: `/api/v1/trips/${tripId}`, headers: authHeader(userA) });
    expect(owner.statusCode).toBe(200);

    const anon = await app.inject({ method: 'GET', url: `/api/v1/trips/${tripId}` });
    expect(anon.statusCode).toBe(401);
  });

  test('another user cannot update it', async () => {
    const owner = await app.inject({ method: 'GET', url: `/api/v1/trips/${tripId}`, headers: authHeader(userA) });
    expect(owner.statusCode).toBe(200);

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/trips/${tripId}`,
      headers: authHeader(userB),
      payload: { title: 'Hijacked' },
    });
    expect(res.statusCode).toBe(404);

    const stillOwners = await db.select().from(trips).where(eq(trips.id, tripId));
    expect(stillOwners[0]?.title).not.toBe('Hijacked');
  });

  test('another user cannot delete it', async () => {
    const owner = await app.inject({ method: 'GET', url: `/api/v1/trips/${tripId}`, headers: authHeader(userA) });
    expect(owner.statusCode).toBe(200);

    const res = await app.inject({ method: 'DELETE', url: `/api/v1/trips/${tripId}`, headers: authHeader(userB) });
    expect(res.statusCode).toBe(404);

    const stillExists = await db.select().from(trips).where(eq(trips.id, tripId));
    expect(stillExists).toHaveLength(1);
  });

  test("listing does not leak another user's trip", async () => {
    const ownerList = await app.inject({ method: 'GET', url: '/api/v1/trips', headers: authHeader(userA) });
    expect(ownerList.statusCode).toBe(200);
    expect(ownerList.json().map((t: { id: string }) => t.id)).toContain(tripId);

    const otherList = await app.inject({ method: 'GET', url: '/api/v1/trips', headers: authHeader(userB) });
    expect(otherList.statusCode).toBe(200);
    expect(otherList.json().map((t: { id: string }) => t.id)).not.toContain(tripId);
  });

  test("exporting does not leak another user's trip", async () => {
    const ownerExport = await app.inject({ method: 'GET', url: '/api/v1/trips/export', headers: authHeader(userA) });
    expect(ownerExport.statusCode).toBe(200);
    expect(ownerExport.json().map((t: { id: string }) => t.id)).toContain(tripId);

    const otherExport = await app.inject({ method: 'GET', url: '/api/v1/trips/export', headers: authHeader(userB) });
    expect(otherExport.statusCode).toBe(200);
    expect(otherExport.json().map((t: { id: string }) => t.id)).not.toContain(tripId);
  });
});

describe('bookmarks', () => {
  test('another user cannot delete it, and the owner can', async () => {
    // Owner-first, same reasoning as the gems/trips suites above: this
    // fails at the owner assertion right now (no route exists), so the
    // "other user" check below never gets a chance to pass vacuously.
    const otherAttempt = await app.inject({
      method: 'DELETE',
      url: `/api/v1/bookmarks/${bookmarkId}`,
      headers: authHeader(userB),
    });
    expect(otherAttempt.statusCode).toBe(404);

    const stillExists = await db.select().from(bookmarks).where(eq(bookmarks.id, bookmarkId));
    expect(stillExists).toHaveLength(1);

    const ownerAttempt = await app.inject({
      method: 'DELETE',
      url: `/api/v1/bookmarks/${bookmarkId}`,
      headers: authHeader(userA),
    });
    expect(ownerAttempt.statusCode).toBe(200);

    const gone = await db.select().from(bookmarks).where(eq(bookmarks.id, bookmarkId));
    expect(gone).toHaveLength(0);
  });

  test('an unauthenticated request gets 401', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/bookmarks' });
    expect(res.statusCode).toBe(401);
  });

  test("listing does not leak another user's bookmark", async () => {
    // Own destination fixture (not the shared one above): the delete test's
    // bookmark can't be reused here because it's only actually gone once
    // E5 implements DELETE — right now that request 404s without deleting
    // anything, and reusing the same (user, destination) pair would trip
    // the bookmarks_user_destination_unique constraint.
    const [otherDestination] = await db
      .insert(destinations)
      .values({
        slug: `e4-test-destination-2-${Date.now()}`,
        title: 'E4 Test Destination 2',
        description: 'Second fixture destination for server/test/ownership.test.ts — not a real place.',
        region: 'ROCHESTER_METRO',
        category: 'CIVIC_LANDMARK',
        latitude: '43.1600000',
        longitude: '-77.6100000',
        coverImageUrl: 'https://example.test/images/e4-fixture-2.jpg',
      })
      .returning();

    const [ownBookmark] = await db
      .insert(bookmarks)
      .values({ userId: userA.id, subjectType: 'DESTINATION', destinationId: otherDestination.id })
      .returning();

    const ownerList = await app.inject({ method: 'GET', url: '/api/v1/bookmarks', headers: authHeader(userA) });
    expect(ownerList.statusCode).toBe(200);
    expect(ownerList.json().map((b: { id: string }) => b.id)).toContain(ownBookmark.id);

    const otherList = await app.inject({ method: 'GET', url: '/api/v1/bookmarks', headers: authHeader(userB) });
    expect(otherList.statusCode).toBe(200);
    expect(otherList.json()).toEqual([]);
  });
});
