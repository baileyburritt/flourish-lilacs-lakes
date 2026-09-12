import 'dotenv/config';
import { sql } from 'drizzle-orm';
import Fastify from 'fastify';
import { clerkPlugin } from '@clerk/fastify';

import { requireAuth } from './auth.js';
import { db } from './db/client.js';

const app = Fastify({ logger: true });

app.register(clerkPlugin);

// Bootstrapping only — E5 adds the real (ownership-scoped) endpoints against
// E4's test suite. This proves the service boots and can reach the database
// it was just migrated against; it is not the API surface itself.
app.get('/health', async () => {
  await db.execute(sql`SELECT 1`);
  return { status: 'ok' };
});

// E2's done-when: "the API receives a verified user id on every
// authenticated request." This route is the proof, not a real resource —
// app/components/AccountBanner.tsx calls it right after sign-in to confirm
// the client and server halves of auth actually agree on who's signed in.
app.get('/api/v1/me', { preHandler: requireAuth }, async (request) => {
  return { userId: request.userId };
});

const port = Number(process.env.PORT ?? 3000);

app
  .listen({ port, host: '0.0.0.0' })
  .then(() => app.log.info(`server listening on ${port}`))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
