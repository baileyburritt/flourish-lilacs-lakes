import type { FastifyInstance } from 'fastify';

import { requireAuth } from '../auth.js';

// F3 (§13): manual verification hook for the human, once a real SENTRY_DSN
// is wired up. See docs/runbook.md's "Error tracking and uptime alerting
// (F3)" section for the exact command to run against a deployed instance.
// Behind requireAuth like every other mutating endpoint in this file, so it
// can't be used as an open, unauthenticated way to spam the Sentry project.
export async function debugRoutes(app: FastifyInstance) {
  app.post('/test-error', { preHandler: requireAuth }, async () => {
    throw new Error('F3 manual test error — thrown deliberately to verify Sentry captures it');
  });
}
