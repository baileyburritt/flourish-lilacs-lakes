import 'dotenv/config';
import { sql } from 'drizzle-orm';
import Fastify from 'fastify';

import { db } from './db/client.js';

const app = Fastify({ logger: true });

// Bootstrapping only — E5 adds the real (ownership-scoped) endpoints against
// E4's test suite. This proves the service boots and can reach the database
// it was just migrated against; it is not the API surface itself.
app.get('/health', async () => {
  await db.execute(sql`SELECT 1`);
  return { status: 'ok' };
});

const port = Number(process.env.PORT ?? 3000);

app
  .listen({ port, host: '0.0.0.0' })
  .then(() => app.log.info(`server listening on ${port}`))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
