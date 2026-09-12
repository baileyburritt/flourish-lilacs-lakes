import { sql } from 'drizzle-orm';
import Fastify from 'fastify';
import { clerkPlugin } from '@clerk/fastify';

import { requireAuth } from './auth.js';
import { db } from './db/client.js';
import { bookmarksRoutes } from './routes/bookmarks.js';
import { gemsRoutes } from './routes/gems.js';
import { tripsRoutes } from './routes/trips.js';

// Split from index.ts so tests can build the app and use .inject() without
// binding a port — E4's ownership suite (server/test/ownership.test.ts)
// does exactly that.
export function buildApp() {
  const app = Fastify({ logger: true });

  app.register(clerkPlugin);

  // Proves the service boots and can reach the database it was just
  // migrated against; not part of the API surface itself.
  app.get('/health', async () => {
    await db.execute(sql`SELECT 1`);
    return { status: 'ok' };
  });

  // E5 (§12): the ownership-scoped endpoints E4's suite defines the contract
  // for. Each plugin scopes its own preHandler(requireAuth) via Fastify's
  // encapsulation, so /health and /api/v1/me stay unaffected.
  app.register(gemsRoutes, { prefix: '/api/v1/gems' });
  app.register(tripsRoutes, { prefix: '/api/v1/trips' });
  app.register(bookmarksRoutes, { prefix: '/api/v1/bookmarks' });

  // E2's done-when: "the API receives a verified user id on every
  // authenticated request." This route is the proof, not a real resource —
  // app/components/AccountBanner.tsx calls it right after sign-in to confirm
  // the client and server halves of auth actually agree on who's signed in.
  app.get('/api/v1/me', { preHandler: requireAuth }, async (request) => {
    return { userId: request.userId };
  });

  return app;
}
