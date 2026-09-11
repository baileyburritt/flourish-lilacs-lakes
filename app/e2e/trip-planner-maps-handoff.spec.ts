import path from 'path';
import { chromium, expect, test } from '@playwright/test';

// B6: "Start Navigation" hands off to the platform maps app instead of
// simulating in-app turn-by-turn. Verifies the URL scheme chosen for each
// platform without actually following it (custom schemes like maps:/geo:
// aren't real navigable targets in a test browser).
const SCREEN_URL = `file://${path.resolve(__dirname, '../../trip_planner_flourish/code.html')}`;
const DESTINATION = 'Seneca Lake, Watkins Glen, New York';
const ENCODED_DESTINATION = encodeURIComponent(DESTINATION);

async function capturedHandoffUrl(userAgent: string | undefined) {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext(userAgent ? { userAgent } : {});
    const page = await context.newPage();
    await page.goto(SCREEN_URL);

    // Dispatches the click via the DOM directly rather than a real pointer
    // click: an unrelated pre-existing issue on this screen leaves the
    // (never-invoked) gem-modal dialog without its `hidden` class by default,
    // so it visually covers the page and would intercept a real click.
    return await page.evaluate(
      () =>
        new Promise<string>((resolve) => {
          window.addEventListener('flourish:maps-handoff', (e) => resolve((e as CustomEvent).detail.url), {
            once: true,
          });
          document.getElementById('start-navigation-btn')!.click();
        })
    );
  } finally {
    await browser.close();
  }
}

test('iOS hands off via the maps: scheme', async () => {
  const url = await capturedHandoffUrl(
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
  );
  expect(url).toBe(`maps://?q=${ENCODED_DESTINATION}`);
});

test('Android hands off via the geo: scheme', async () => {
  const url = await capturedHandoffUrl('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36');
  expect(url).toBe(`geo:0,0?q=${ENCODED_DESTINATION}`);
});

test('web/PWA falls back to a Google Maps URL', async () => {
  const url = await capturedHandoffUrl(undefined);
  expect(url).toBe(`https://maps.google.com/?q=${ENCODED_DESTINATION}`);
});
