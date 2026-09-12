import type { FastifyReply, FastifyRequest } from 'fastify';
import { clerkClient, getAuth } from '@clerk/fastify';
import { eq } from 'drizzle-orm';

import { db } from './db/client.js';
import { users } from './db/schema.js';

declare module 'fastify' {
  interface FastifyRequest {
    userId?: string;
  }
}

// E4 (§12): users.id IS the Clerk user id (schema.ts) — this is the lazy
// provisioning step instead of a Clerk webhook, since there's nowhere for a
// webhook to call yet (no deployed server, Stage F). Only queries Clerk's
// API and inserts on a user's first-ever authenticated request; every
// request after that is a single indexed SELECT.
export async function ensureUserSynced(clerkUserId: string) {
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.id, clerkUserId)).limit(1);
  if (existing.length > 0) return;

  const clerkUser = await clerkClient.users.getUser(clerkUserId);
  const email = clerkUser.primaryEmailAddress?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) {
    throw new Error(`Clerk user ${clerkUserId} has no email address to sync.`);
  }
  const displayName = clerkUser.fullName ?? clerkUser.username ?? email;

  await db
    .insert(users)
    .values({ id: clerkUserId, email, displayName, avatarUrl: clerkUser.imageUrl })
    .onConflictDoNothing();
}

// E2 (§03): one place that turns "does this request carry a verified Clerk
// session" into either a 401 or a userId on the request — E5's endpoints
// (and their ownership-scoping work against E4's suite) build on this
// rather than each calling getAuth() themselves.
export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const { isAuthenticated, userId } = getAuth(request);
  if (!isAuthenticated) {
    reply.code(401).send({ error: 'Unauthorized' });
    return;
  }
  await ensureUserSynced(userId);
  request.userId = userId;
}
