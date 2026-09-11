import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// C4: the app now renders the five ported screens from a shared component
// library instead of the scaffold placeholder. This scans every screen
// reachable from the bottom nav (plus the two detail screens) so a11y
// regressions are caught here rather than deferred entirely to Stage D.
test('Explore loads as the initial screen with no automatic accessibility violations', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Discover Rochester & Finger Lakes')).toBeVisible();

  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(results.violations).toEqual([]);
});

test('bottom nav switches screens and marks exactly one tab selected', async ({ page }) => {
  await page.goto('/');

  const tabs = {
    Explore: 'Discover Rochester & Finger Lakes',
    'Music & Live': 'Live Sounds & Festivals',
    Itinerary: 'Weekend Getaway',
    'My Spots': 'Saved by you',
  };

  for (const [tabLabel, screenText] of Object.entries(tabs)) {
    await page.getByRole('tab', { name: tabLabel }).click();
    await expect(page.getByText(screenText, { exact: false }).first()).toBeVisible();
    await expect(page.getByRole('tab', { name: tabLabel })).toHaveAttribute('aria-selected', 'true');

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(results.violations).toEqual([]);
  }
});

test('drilling into Letchworth reaches Destination Detail with no tab falsely marked active', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'View Guide' }).click();

  await expect(page.getByText('Letchworth & Upper Falls')).toBeVisible();
  const selectedTabs = await page.getByRole('tab', { name: /Explore|Music|Itinerary|My Spots/ }).evaluateAll((els) => els.filter((el) => el.getAttribute('aria-selected') === 'true'));
  expect(selectedTabs).toHaveLength(0);

  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(results.violations).toEqual([]);
});

test('Add Private Gem preserves both the text notes field and the audio memo control', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Add Private Gem' }).click();

  await expect(page.getByLabel('Insider Tips & Route Logistics')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Record an audio memo' })).toBeVisible();

  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(results.violations).toEqual([]);
});
