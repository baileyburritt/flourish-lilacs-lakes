import 'dotenv/config';
import { createClerkClient } from '@clerk/backend';
import { eq } from 'drizzle-orm';

import { ensureUserSynced } from '../src/auth.js';
import { db } from '../src/db/client.js';
import { users } from '../src/db/schema.js';

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export type TestUser = { id: string; token: string };

// E4 (§12): real Clerk users and real session JWTs, not mocked auth — the
// finding this suite exists to prevent is specifically about what a real
// verified request can reach, so the verification step has to be real too.
export async function createTestUser(label: string): Promise<TestUser> {
  const user = await clerk.users.createUser({
    emailAddress: [`e4-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`],
    firstName: 'E4',
    lastName: label,
    skipPasswordChecks: true,
    skipPasswordRequirement: true,
  });
  const session = await clerk.sessions.createSession({ userId: user.id });
  const { jwt } = await clerk.sessions.getToken(session.id);
  // Mirrors what requireAuth does on a real first request, done here
  // up front so fixture rows (gems/trips/bookmarks) have a users row to
  // reference before any HTTP request happens.
  await ensureUserSynced(user.id);
  return { id: user.id, token: jwt };
}

export async function deleteTestUser(user: TestUser) {
  await clerk.users.deleteUser(user.id).catch(() => {});
  // Cascades to any trips/gems/bookmarks the test created for this user.
  await db.delete(users).where(eq(users.id, user.id));
}

export function authHeader(user: TestUser) {
  return { authorization: `Bearer ${user.token}` };
}
