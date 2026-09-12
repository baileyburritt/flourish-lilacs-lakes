import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// E2 (§03): proves the sign-in gate itself. Every other e2e spec navigates
// to '/' and relies on EXPO_PUBLIC_E2E_BYPASS_AUTH (see App.tsx) to skip
// straight to the app; this one adds ?e2e_no_bypass to cancel that for just
// this navigation, so it's the one spec that actually sees this screen.
test('a signed-out visitor sees the sign-in screen, not the app, with no automatic accessibility violations', async ({
  page,
}) => {
  await page.goto('/?e2e_no_bypass');

  await expect(page.getByText('Continue with Google')).toBeVisible();

  // The gate actually gates: none of the main app's bottom-nav tabs exist
  // on this screen.
  await expect(page.getByText('Discover Rochester & Finger Lakes')).toHaveCount(0);

  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(results.violations).toEqual([]);
});
