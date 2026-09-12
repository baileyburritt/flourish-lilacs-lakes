import 'dotenv/config';
import { createClerkClient } from '@clerk/backend';

// E2 (§03): manual verification, not part of `npm test` — it hits the real
// Clerk API (creates and deletes a throwaway user against whichever
// instance CLERK_SECRET_KEY points at) and requires the server already
// running on localhost. CI has no Clerk secret configured, so this can't
// run unattended; use it after rotating keys or touching auth wiring to
// confirm the client and server halves still agree on a verified userId.
//
// Usage: npm run dev (in one shell), then npm run verify:clerk-auth (in another).

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3000';

async function main() {
  const user = await clerk.users.createUser({
    emailAddress: ['e2-verify@example.com'],
    firstName: 'E2',
    lastName: 'Verify',
    skipPasswordChecks: true,
    skipPasswordRequirement: true,
  });
  console.log('Created test user', user.id);

  try {
    const session = await clerk.sessions.createSession({ userId: user.id });
    const { jwt } = await clerk.sessions.getToken(session.id);

    const response = await fetch(`${API_BASE_URL}/api/v1/me`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    const body = await response.json();

    if (response.status !== 200 || body.userId !== user.id) {
      throw new Error(`Expected 200 with userId ${user.id}, got ${response.status} ${JSON.stringify(body)}`);
    }

    console.log(`Verified: ${API_BASE_URL}/api/v1/me returned the correct userId for a real Clerk session.`);
    await clerk.sessions.revokeSession(session.id);
  } finally {
    await clerk.users.deleteUser(user.id);
    console.log('Cleaned up test user', user.id);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
