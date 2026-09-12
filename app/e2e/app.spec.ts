import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

// D4: axe's own `label-content-name-mismatch` rule (WCAG 2.5.3) already
// checks for "a visible label and a conflicting aria-label" on one control —
// it's just off by default because Deque still marks it experimental. It
// belongs in scope alongside the other WCAG 2.1 A/AA tags this project
// scans against, so every screen check below force-enables it rather than
// relying on a hand-rolled substring check.
function scanA11y(page: Page) {
  return new AxeBuilder({ page })
    .options({ rules: { 'label-content-name-mismatch': { enabled: true } } })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
}

// C4: the app now renders the five ported screens from a shared component
// library instead of the scaffold placeholder. This scans every screen
// reachable from the bottom nav (plus the two detail screens) so a11y
// regressions are caught here rather than deferred entirely to Stage D.
test('Explore loads as the initial screen with no automatic accessibility violations', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Discover Rochester & Finger Lakes')).toBeVisible();

  const results = await scanA11y(page);
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

    const results = await scanA11y(page);
    expect(results.violations).toEqual([]);
  }
});

test('drilling into Letchworth reaches Destination Detail with no tab falsely marked active', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'View Guide' }).click();

  await expect(page.getByText('Letchworth & Upper Falls')).toBeVisible();
  const selectedTabs = await page.getByRole('tab', { name: /Explore|Music|Itinerary|My Spots/ }).evaluateAll((els) => els.filter((el) => el.getAttribute('aria-selected') === 'true'));
  expect(selectedTabs).toHaveLength(0);

  const results = await scanA11y(page);
  expect(results.violations).toEqual([]);
});

test('Add Private Gem preserves both the text notes field and the audio memo control', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Add Private Gem' }).click();

  await expect(page.getByLabel('Insider Tips & Route Logistics')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Record an audio memo' })).toBeVisible();

  const results = await scanA11y(page);
  expect(results.violations).toEqual([]);
});

// D4: the privacy switches had no accessible name at all, and neither did
// icon-only utility buttons like this modal's close control — this is the
// one privacy toggle (Trip Planner's "Add Custom Hidden Gem" sheet) no
// earlier a11y scan actually opened, so it was never proven to be fixed.
test('the Trip Planner custom gem modal exposes a named privacy switch and a named close button', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'Itinerary' }).click();
  await page.getByRole('button', { name: '+ Add Custom Hidden Gem' }).click();

  // RN Web's <Modal> only applies role="dialog" once its entrance animation
  // finishes — waiting for that avoids scanning the brief mid-transition
  // state axe correctly treats as invalid (aria-modal with no dialog role).
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('switch', { name: 'Keep this gem secret, visible only on your device' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close form' })).toBeVisible();

  const results = await scanA11y(page);
  expect(results.violations).toEqual([]);
});

// D2: focus indicators were previously stripped from primary inputs with no
// replacement. This checks the real, shared fix (FocusRingStyle.tsx) rather
// than trusting a screenshot — a focused tab and a focused text field must
// both compute a visible (non-"none", non-zero-width) outline.
test('focusing a nav tab and a form field shows a visible focus indicator', async ({ page }) => {
  await page.goto('/');

  const musicTab = page.getByRole('tab', { name: 'Music & Live' });
  await musicTab.focus();
  await expect(musicTab).toBeFocused();
  const tabOutline = await musicTab.evaluate((el) => {
    const style = getComputedStyle(el);
    return { style: style.outlineStyle, width: style.outlineWidth };
  });
  expect(tabOutline.style).not.toBe('none');
  expect(tabOutline.width).not.toBe('0px');

  await page.getByRole('button', { name: 'Add Private Gem' }).click();
  const notesField = page.getByLabel('Insider Tips & Route Logistics');
  await notesField.focus();
  await expect(notesField).toBeFocused();
  const inputOutline = await notesField.evaluate((el) => {
    const style = getComputedStyle(el);
    return { style: style.outlineStyle, width: style.outlineWidth };
  });
  expect(inputOutline.style).not.toBe('none');
  expect(inputOutline.width).not.toBe('0px');
});

// D3: save/bookmark/error toasts were previously silent to screen readers.
// These check the one shared aria-live="polite" region (LiveRegion.tsx)
// actually changes text on each kind of status event, rather than trusting
// that a visible toast implies an accessible one.
test('bookmarking a spot announces a status change in the shared live region', async ({ page }) => {
  await page.goto('/');

  const liveRegion = page.locator('[aria-live="polite"]');
  await expect(liveRegion).toHaveText('');

  await page.getByRole('button', { name: 'Save High Falls & Genesee Gorge to My Spots' }).click();
  await expect(liveRegion).toHaveText('Saved High Falls & Genesee Gorge to My Spots.');

  await page.getByRole('button', { name: 'Remove High Falls & Genesee Gorge from My Spots' }).click();
  await expect(liveRegion).toHaveText('Removed High Falls & Genesee Gorge from My Spots.');
});

test('saving a new private gem announces success, and an empty name announces the error instead', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Add Private Gem' }).click();

  const liveRegion = page.locator('[aria-live="polite"]');

  await page.getByRole('button', { name: 'Save to My Private Gems' }).click();
  await expect(liveRegion).toHaveText('Enter a gem name before saving.');

  await page.getByLabel('Gem / Spot Name').fill('Bare Hill Sunset Ledge');
  await page.getByRole('button', { name: 'Save to My Private Gems' }).click();
  await expect(liveRegion).toHaveText('Saved Bare Hill Sunset Ledge to My Private Gems.');
});
