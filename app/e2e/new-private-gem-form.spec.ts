import path from 'path';
import { expect, test } from '@playwright/test';

// B2: the New Private Gem form previously shipped with someone's example
// content pre-filled — asserting a fresh load stays empty from here on.
test('New Private Gem form loads with empty fields, not sample content', async ({ page }) => {
  const filePath = path.resolve(__dirname, '../../new_private_gem_flourish/code.html');
  await page.goto(`file://${filePath}`);

  await expect(page.locator('#gem-name')).toHaveValue('');
  await expect(page.locator('#location-input')).toHaveValue('');
  await expect(
    page.getByPlaceholder('Landmark clue: Behind the red fruit packing barn off Route 21')
  ).toHaveValue('');
  await expect(page.locator('#insider-notes')).toHaveValue('');
});
