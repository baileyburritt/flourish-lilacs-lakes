import { Platform } from 'react-native';
import * as Sentry from '@sentry/react-native';

// F3 (§13): client-side error tracking. Scoped to native (iOS/Android)
// only — this repo's e2e/axe suite runs against a static `expo export -p
// web` build (playwright.config.ts), and getting Sentry's web support
// working well there needs the Expo config plugin's Metro source-map
// wiring (getSentryExpoConfig) plus a real Sentry org/project/auth token
// this repo doesn't have yet (no Sentry account exists — see
// docs/vendors.md). A working native-only integration was chosen over
// fighting an incomplete web one; revisit once EAS/native builds and real
// Sentry credentials exist. No Sentry account exists yet, so
// EXPO_PUBLIC_SENTRY_DSN is unset in every environment until the human
// hands over a real one — this must never throw or block app startup.
const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

export function initSentry() {
  if (Platform.OS === 'web') return;
  if (!dsn) {
    console.warn('EXPO_PUBLIC_SENTRY_DSN not set — client error tracking is disabled.');
    return;
  }
  Sentry.init({ dsn });
}
