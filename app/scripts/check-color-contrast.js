// D7: fails if any token pair the app actually paints text over a
// background with drops below WCAG AA's 4.5:1 (§1.4.3). Reads colors from
// DESIGN.md's frontmatter (the same source generate-tokens.js reads), so a
// future color edit that quietly breaks contrast is caught here rather than
// noticed by a person looking at a screenshot.
const { readDesignTokens } = require('./lib/design-tokens');
const { contrastRatio } = require('./lib/contrast');

const AA_NORMAL_TEXT = 4.5;

// The Material-style "on-X" / "X" role pairs the token set defines — each
// is meant to be used together (on-primary text on a primary fill, etc.).
const ROLE_PAIRS = [
  ['on-primary', 'primary'],
  ['on-primary-container', 'primary-container'],
  ['on-secondary', 'secondary'],
  ['on-secondary-container', 'secondary-container'],
  ['on-tertiary', 'tertiary'],
  ['on-tertiary-container', 'tertiary-container'],
  ['on-error', 'error'],
  ['on-error-container', 'error-container'],
  ['on-surface', 'surface'],
  ['on-background', 'background'],
  ['inverse-on-surface', 'inverse-surface'],
  ['on-primary-fixed', 'primary-fixed'],
  ['on-primary-fixed-variant', 'primary-fixed'],
  ['on-secondary-fixed', 'secondary-fixed'],
  ['on-secondary-fixed-variant', 'secondary-fixed'],
  ['on-tertiary-fixed', 'tertiary-fixed'],
  ['on-tertiary-fixed-variant', 'tertiary-fixed'],
];

// Pairs the five screens actually paint directly against the canvas or an
// accent fill, rather than a role's own dedicated container — e.g. `tertiary`
// and `secondary` used as eyebrow/CTA text color on `surface` in place of
// `on-tertiary-container`, which measures only ~3.16:1 there (see the
// contrast comments in ExploreScreen, MusicScreen, DestinationDetailScreen,
// TripPlannerScreen and Header). Listed explicitly so a future screen can't
// reintroduce that failing combination without this check catching it.
const APPLIED_PAIRS = [
  ['on-surface-variant', 'surface'],
  ['tertiary', 'surface'],
  ['secondary', 'surface'],
  ['neutral', 'surface'],
  ['primary', 'surface'],
  ['on-primary', 'secondary'],
  ['on-tertiary', 'secondary'],
];

const { colors } = readDesignTokens();
const violations = [];

for (const [fg, bg] of [...ROLE_PAIRS, ...APPLIED_PAIRS]) {
  if (!colors[fg] || !colors[bg]) {
    throw new Error(`check-color-contrast: unknown token in pair [${fg}, ${bg}] — DESIGN.md's colors changed shape`);
  }
  const ratio = contrastRatio(colors[fg], colors[bg]);
  if (ratio < AA_NORMAL_TEXT) {
    violations.push({ fg, bg, ratio });
  }
}

if (violations.length > 0) {
  console.error(`Color contrast check FAILED — below WCAG AA's ${AA_NORMAL_TEXT}:1 for normal text (§1.4.3):`);
  for (const v of violations) {
    console.error(`  ${v.fg} on ${v.bg}: ${v.ratio.toFixed(2)}:1`);
  }
  process.exit(1);
}

console.log(`Color contrast check passed — ${ROLE_PAIRS.length + APPLIED_PAIRS.length} token pair(s) all clear ${AA_NORMAL_TEXT}:1.`);
