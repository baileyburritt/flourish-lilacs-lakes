import { expect, test } from '@playwright/test';

// D7: the screens previously conveyed structure through styled Text alone —
// visually a heading, semantically nothing. These check the real thing:
// each screen exposes exactly one h1 (its page subject) and its major
// sections as h2, so a screen-reader user can navigate by heading the same
// way a sighted user scans by type size. axe's `heading-order` rule (forced
// on in app.spec.ts's scanA11y) proves no level is skipped; this proves the
// hierarchy actually exists rather than trivially having zero headings.

test('Explore exposes an h1 page heading and h2 section headings', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1, name: 'Discover Rochester & Finger Lakes' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Signature Wonders' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Curated Quick Getaways' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
});

test('Music & Live exposes an h1 page heading and h2 section headings', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'Music & Live' }).click();

  await expect(page.getByRole('heading', { level: 1, name: 'Live Sounds & Festivals' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Curated Upcoming Gigs' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
});

test('Trip Planner exposes an h1 page heading and h2 day sections', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'Itinerary' }).click();

  await expect(page.getByRole('heading', { level: 1, name: 'Weekend Getaway: ROC to Keuka & Seneca Lakes' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Day 1 • Rochester Kickoff' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Day 2 • Wine Country & Gorges' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
});

test('Destination Detail exposes an h1 page heading and h2 section headings', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'View Guide' }).click();

  await expect(page.getByRole('heading', { level: 1, name: 'Letchworth & Upper Falls' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Editorial Highlights' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Personal Notes & Local Spots Nearby' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
});

test('New Private Gem exposes its header title as the page h1 and h2 section headings', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Add Private Gem' }).click();

  await expect(page.getByRole('heading', { level: 1, name: 'Add Private Gem' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Category & Atmosphere' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Field Captures & Audio Memo' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
});
