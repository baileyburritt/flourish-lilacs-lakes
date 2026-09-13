import { sql } from 'drizzle-orm';
import Fastify from 'fastify';
import * as Sentry from '@sentry/node';
import { clerkPlugin } from '@clerk/fastify';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';

import { requireAuth } from './auth.js';
import { db } from './db/client.js';
import { PER_IP_MAX_REQUESTS, PER_IP_WINDOW } from './lib/rateLimitConfig.js';
import { MAX_AUDIO_BYTES } from './lib/uploadLimits.js';
import { accountRoutes } from './routes/account.js';
import { bookmarksRoutes } from './routes/bookmarks.js';
import { catalogImagesRoutes } from './routes/catalogImages.js';
import { debugRoutes } from './routes/debug.js';
import { gemsRoutes } from './routes/gems.js';
import { tripsRoutes } from './routes/trips.js';

// Split from index.ts so tests can build the app and use .inject() without
// binding a port — E4's ownership suite (server/test/ownership.test.ts)
// does exactly that.
export function buildApp() {
  const app = Fastify({ logger: true });

  // F3 (§13): captures uncaught exceptions thrown by any route handler into
  // Sentry. Safe to call unconditionally — Sentry's SDK no-ops on capture
  // calls when Sentry.init was never called (SENTRY_DSN unset, see
  // instrument.ts), so this never blocks boot or masks the underlying
  // error, it just skips reporting it anywhere.
  Sentry.setupFastifyErrorHandler(app);

  app.register(clerkPlugin);

  // E7 (§12): "no rate limiting anywhere" — this is the per-IP half (keyed
  // on request.ip by default), applied globally so it covers unauthenticated
  // routes like /health too, not just the ownership-scoped ones below. The
  // per-user half lives in auth.ts's requireAuth, since userId isn't known
  // until a route's own preHandler(requireAuth) has run.
  app.register(rateLimit, { global: true, max: PER_IP_MAX_REQUESTS, timeWindow: PER_IP_WINDOW });

  // E7 (§12): registered once here rather than per-route so gems.ts's photo
  // and audio upload endpoints share one busboy instance. The global
  // fileSize is the larger of the two caps (audio); each upload endpoint
  // passes its own tighter limit to request.file() per call.
  app.register(multipart, { limits: { fileSize: MAX_AUDIO_BYTES, files: 1 } });

  // Every route below is added inside .after() rather than directly against
  // `app`: @fastify/rate-limit's global mode attaches itself via an onRoute
  // hook, which only affects routes registered *after* that hook exists.
  // Fastify's plugin queue (avvio) doesn't run rateLimit's registration
  // synchronously just because .register() was called first in this
  // function body — without .after(), routes declared here were observed to
  // register before the hook attached and silently went unlimited.
  app.after(() => {
    // Proves the service boots and can reach the database it was just
    // migrated against; not part of the API surface itself.
    app.get('/health', async () => {
      await db.execute(sql`SELECT 1`);
      return { status: 'ok' };
    });

    // E5 (§12): the ownership-scoped endpoints E4's suite defines the
    // contract for. Each plugin scopes its own preHandler(requireAuth) via
    // Fastify's encapsulation, so /health and /api/v1/me stay unaffected.
    app.register(gemsRoutes, { prefix: '/api/v1/gems' });
    app.register(tripsRoutes, { prefix: '/api/v1/trips' });
    app.register(bookmarksRoutes, { prefix: '/api/v1/bookmarks' });

    // E8 (§12): DELETE /api/v1/account — Apple 5.1.1(v) in-app account
    // deletion. Its own preHandler(requireAuth) scopes it to the caller.
    app.register(accountRoutes, { prefix: '/api/v1/account' });

    // E10 (§03, §06): the upload half of the owned image pipeline. Not
    // ownership-scoped like the plugins above — catalog images aren't a
    // private, per-user resource — but still behind requireAuth.
    app.register(catalogImagesRoutes, { prefix: '/api/v1/catalog-images' });

    // F3 (§13): POST /api/v1/debug/test-error — a deliberate throw for the
    // human to verify Sentry capture against a real deployed instance once
    // SENTRY_DSN is configured. See docs/runbook.md.
    app.register(debugRoutes, { prefix: '/api/v1/debug' });

    // E2's done-when: "the API receives a verified user id on every
    // authenticated request." This route is the proof, not a real resource
    // — app/components/AccountBanner.tsx calls it right after sign-in to
    // confirm the client and server halves of auth actually agree on who's
    // signed in.
    app.get('/api/v1/me', { preHandler: requireAuth }, async (request) => {
      return { userId: request.userId };
    });
  });

  return app;
}
