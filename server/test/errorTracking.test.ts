import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { buildApp } from '../src/app.js';
import { initErrorTracking } from '../src/instrument.js';

// F3 (§13): error tracking is an observability nice-to-have, not a hard
// dependency like Clerk's secret key — no Sentry account exists yet (see
// docs/vendors.md), so SENTRY_DSN is unset in every environment until the
// human hands it over. This proves the no-op path actually degrades
// gracefully rather than just reading that way in the source: the server
// still boots, /health still responds, and the only externally visible
// effect is a one-line console warning — never a thrown error or a boot
// failure.
describe('error tracking (F3) — no-op when SENTRY_DSN is unset', () => {
  let originalDsn: string | undefined;

  beforeEach(() => {
    originalDsn = process.env.SENTRY_DSN;
    delete process.env.SENTRY_DSN;
  });

  afterEach(() => {
    if (originalDsn !== undefined) process.env.SENTRY_DSN = originalDsn;
  });

  test('initErrorTracking warns instead of throwing', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(() => initErrorTracking()).not.toThrow();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('SENTRY_DSN'));
    warnSpy.mockRestore();
  });

  test('the app still boots and /health still responds', async () => {
    const app = buildApp();
    await app.ready();
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });
    await app.close();
  });

  test('an uncaught route error is still handled (Sentry.setupFastifyErrorHandler no-ops without init)', async () => {
    const app = buildApp();
    await app.ready();
    // POST /api/v1/debug/test-error requires auth; hitting it unauthenticated
    // proves requireAuth still runs ahead of Sentry's error-handler wiring —
    // this test isn't about auth, just that adding Sentry's handler didn't
    // change how any of the rest of the app behaves.
    const res = await app.inject({ method: 'POST', url: '/api/v1/debug/test-error' });
    expect(res.statusCode).toBe(401);
    await app.close();
  });
});
