import { expect, test } from '@playwright/test';

// D5: chip selection was previously conveyed by background color alone.
// Chip.tsx now sets aria-pressed itself (see its D5 comment), but that's
// only proven for the component in isolation by Chip.test.tsx — this checks
// the real thing in every screen context a Chip group actually appears in:
// clicking a chip flips its own aria-pressed to true and flips the
// previously-selected chip in the same group back to false.

test('Explore filter chips expose aria-pressed and stay a single-select group', async ({ page }) => {
  await page.goto('/');

  const all = page.getByRole('button', { name: 'All', exact: true });
  const waterfalls = page.getByRole('button', { name: 'Waterfalls & Gorges', exact: true });
  await expect(all).toHaveAttribute('aria-pressed', 'true');
  await expect(waterfalls).toHaveAttribute('aria-pressed', 'false');

  await waterfalls.click();
  await expect(waterfalls).toHaveAttribute('aria-pressed', 'true');
  await expect(all).toHaveAttribute('aria-pressed', 'false');
});

test('Music & Live filter chips expose aria-pressed and stay a single-select group', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'Music & Live' }).click();

  const allEvents = page.getByRole('button', { name: 'All Events', exact: true });
  const jazz = page.getByRole('button', { name: 'Jazz & Blues', exact: true });
  await expect(allEvents).toHaveAttribute('aria-pressed', 'true');
  await expect(jazz).toHaveAttribute('aria-pressed', 'false');

  await jazz.click();
  await expect(jazz).toHaveAttribute('aria-pressed', 'true');
  await expect(allEvents).toHaveAttribute('aria-pressed', 'false');
});

test('New Private Gem category and region chips each expose aria-pressed as a single-select group', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Add Private Gem' }).click();

  const categoryDefault = page.getByRole('button', { name: 'Waterfalls & Gorges', exact: true });
  const categoryOther = page.getByRole('button', { name: 'City Gems', exact: true });
  await expect(categoryDefault).toHaveAttribute('aria-pressed', 'true');
  await expect(categoryOther).toHaveAttribute('aria-pressed', 'false');
  await categoryOther.click();
  await expect(categoryOther).toHaveAttribute('aria-pressed', 'true');
  await expect(categoryDefault).toHaveAttribute('aria-pressed', 'false');

  const regionDefault = page.getByRole('button', { name: 'Canandaigua Lake', exact: true });
  const regionOther = page.getByRole('button', { name: 'Keuka Lake Bluff', exact: true });
  await expect(regionDefault).toHaveAttribute('aria-pressed', 'true');
  await expect(regionOther).toHaveAttribute('aria-pressed', 'false');
  await regionOther.click();
  await expect(regionOther).toHaveAttribute('aria-pressed', 'true');
  await expect(regionDefault).toHaveAttribute('aria-pressed', 'false');
});

test('Destination Detail gem category chips expose aria-pressed as a single-select group', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'View Guide' }).click();

  const categoryDefault = page.getByRole('button', { name: 'Waterfalls & Gorges', exact: true });
  const categoryOther = page.getByRole('button', { name: 'Dining & Markets', exact: true });
  await expect(categoryDefault).toHaveAttribute('aria-pressed', 'true');
  await expect(categoryOther).toHaveAttribute('aria-pressed', 'false');

  await categoryOther.click();
  await expect(categoryOther).toHaveAttribute('aria-pressed', 'true');
  await expect(categoryDefault).toHaveAttribute('aria-pressed', 'false');
});

test('Trip Planner custom gem modal day chips expose aria-pressed as a single-select group', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'Itinerary' }).click();
  await page.getByRole('button', { name: '+ Add Custom Hidden Gem' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();

  const dayDefault = page.getByRole('button', { name: 'Day 2', exact: true });
  const dayOther = page.getByRole('button', { name: 'Day 3', exact: true });
  await expect(dayDefault).toHaveAttribute('aria-pressed', 'true');
  await expect(dayOther).toHaveAttribute('aria-pressed', 'false');

  await dayOther.click();
  await expect(dayOther).toHaveAttribute('aria-pressed', 'true');
  await expect(dayDefault).toHaveAttribute('aria-pressed', 'false');
});
