import 'dotenv/config';
// F3 (§13): must be the first import after dotenv/config — see
// instrument.ts's own comment — so Sentry (when SENTRY_DSN is set) is live
// before app.js and everything it pulls in (Fastify, Clerk, Drizzle) runs.
import { Sentry } from './instrument.js';

import { buildApp } from './app.js';

const app = buildApp();
const port = Number(process.env.PORT ?? 3000);

app
  .listen({ port, host: '0.0.0.0' })
  .then(() => app.log.info(`server listening on ${port}`))
  .catch((err) => {
    Sentry.captureException(err);
    app.log.error(err);
    process.exit(1);
  });
