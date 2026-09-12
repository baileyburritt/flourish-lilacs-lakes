import { expect, test } from '@playwright/test';

// D6: placeholder text disappears the moment a user types, so it can never
// be a field's only descriptor (WCAG 3.3.2). scripts/check-no-placeholder-
// only-labels.js proves this statically for every screen; this proves the
// real behavior — the visible label stays put and remains the field's
// accessible name after the placeholder itself is gone from view.
test('a New Private Gem field keeps its visible label as the accessible name after its placeholder is typed over', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Add Private Gem' }).click();

  const field = page.getByLabel('Gem / Spot Name, required');
  await expect(field).toHaveAttribute('placeholder', 'e.g. Bare Hill Sunset Ledge');

  await field.fill('Bare Hill Sunset Ledge');

  await expect(page.getByText('Gem / Spot Name')).toBeVisible();
  await expect(field).toHaveValue('Bare Hill Sunset Ledge');
  await expect(page.getByLabel('Gem / Spot Name, required')).toBeVisible();
});
