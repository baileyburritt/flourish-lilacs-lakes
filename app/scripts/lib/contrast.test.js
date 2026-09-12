const { contrastRatio } = require('./contrast');
// Sourced from the generated token file rather than hand-written hex, so
// this file doesn't itself trip check-token-conformance.js (A4) — colors
// belong in theme/tokens.ts and nowhere else in app/ source.
const { colors } = require('../../theme/tokens');

test('white text on navy primary — a pair the app actually uses — clears 14:1', () => {
  expect(contrastRatio(colors['on-primary'], colors['primary'])).toBeGreaterThan(14);
});

test('a color against itself is the minimum ratio, 1:1', () => {
  expect(contrastRatio(colors['primary'], colors['primary'])).toBeCloseTo(1, 5);
});

test('ratio is symmetric regardless of argument order', () => {
  expect(contrastRatio(colors['primary'], colors['surface'])).toBeCloseTo(contrastRatio(colors['surface'], colors['primary']), 10);
});
