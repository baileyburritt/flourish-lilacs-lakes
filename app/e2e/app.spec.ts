import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('scaffold screen loads and has no automatic accessibility violations', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Open up App.tsx to start working on your app!')).toBeVisible();

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});
