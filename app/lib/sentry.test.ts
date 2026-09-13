import { Platform } from 'react-native';

// F3 (§13): client-side error tracking must never throw or block app
// startup — no Sentry account exists yet (see docs/vendors.md), so
// EXPO_PUBLIC_SENTRY_DSN is unset in every environment until the human
// hands over a real one. This proves the no-op path (both "unset" and
// "web, where this is intentionally scoped out" — see lib/sentry.ts's own
// comment) actually degrades gracefully instead of just reading that way.
jest.mock('@sentry/react-native', () => ({ init: jest.fn() }));

const nativeOS = Platform.OS;
const originalDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

afterEach(() => {
  Platform.OS = nativeOS;
  if (originalDsn === undefined) delete process.env.EXPO_PUBLIC_SENTRY_DSN;
  else process.env.EXPO_PUBLIC_SENTRY_DSN = originalDsn;
  jest.resetModules();
});

test('on native with no DSN set, warns instead of calling Sentry.init', async () => {
  delete process.env.EXPO_PUBLIC_SENTRY_DSN;
  Platform.OS = 'ios';
  const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

  const Sentry = require('@sentry/react-native');
  const { initSentry } = require('./sentry');
  expect(() => initSentry()).not.toThrow();

  expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('EXPO_PUBLIC_SENTRY_DSN'));
  expect(Sentry.init).not.toHaveBeenCalled();
  warnSpy.mockRestore();
});

test('on web, never calls Sentry.init even with a DSN set', async () => {
  process.env.EXPO_PUBLIC_SENTRY_DSN = 'https://example@o0.ingest.sentry.io/1';
  Platform.OS = 'web';

  const Sentry = require('@sentry/react-native');
  const { initSentry } = require('./sentry');
  expect(() => initSentry()).not.toThrow();

  expect(Sentry.init).not.toHaveBeenCalled();
});
