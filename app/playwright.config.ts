import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4173',
  },
  webServer: {
    // E2: this suite (mostly) tests the five screens' WCAG conformance, not
    // Clerk OAuth against a real Google account — EXPO_PUBLIC_E2E_BYPASS_AUTH
    // (see App.tsx) skips the sign-in gate for the whole build. The one spec
    // that needs the real gate (sign-in-gate.spec.ts) narrows it back off
    // per-request with a query param instead of needing a second build.
    // cross-env keeps this portable across the bash CI runner and Windows.
    command: 'npx cross-env EXPO_PUBLIC_E2E_BYPASS_AUTH=true npm run build:web && npx serve dist -l 4173 -s',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
