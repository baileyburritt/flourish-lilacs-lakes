import * as Sentry from '@sentry/node';

// F3 (§13): error tracking. This is an observability nice-to-have, not a
// hard dependency like Clerk's secret key (server/src/auth.ts) — no Sentry
// account exists yet (see docs/vendors.md), so the server must boot and
// serve traffic exactly the same whether SENTRY_DSN is set or not. When
// it's unset, this no-ops with a one-line warning instead of throwing.
//
// Exported as a function (rather than bare top-level code) so
// test/errorTracking.test.ts can re-invoke it under a deliberately-cleared
// env to prove the no-op path, while index.ts still gets the "runs at
// import time, before any other module" behavior it needs by calling this
// via `import './instrument.js'` — the side-effect call below — placed
// before index.ts's import of ./app.js so Sentry is live before any other
// module's own top-level code (Fastify, Clerk, Drizzle, ...) executes.
export function initErrorTracking() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    console.warn('SENTRY_DSN not set — server error tracking is disabled.');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    // Error tracking only for F3; no perf/tracing scope was asked for, and
    // sampling traces isn't free on Sentry's paid plans.
    tracesSampleRate: 0,
  });
}

initErrorTracking();

export { Sentry };
