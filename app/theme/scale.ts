// Converts DESIGN.md-derived tokens (theme/tokens.ts, all rem/px/em strings —
// the format Tailwind expects) into the numeric px values React Native's
// StyleSheet requires. Hand-written, not generated: theme/tokens.ts stays the
// only generated file, this just adapts its units for native use.
import { radius, spacing, typography } from './tokens';

const ROOT_FONT_SIZE_PX = 16;

function toPx(value: string): number {
  if (value.endsWith('rem')) return parseFloat(value) * ROOT_FONT_SIZE_PX;
  if (value.endsWith('px')) return parseFloat(value);
  return parseFloat(value);
}

function emToPx(value: string | undefined, fontSizePx: number): number | undefined {
  if (!value) return undefined;
  if (!value.endsWith('em')) return toPx(value);
  return parseFloat(value) * fontSizePx;
}

type SpacingKey = keyof typeof spacing;
type RadiusKey = keyof typeof radius;
type TypographyKey = keyof typeof typography;

export const space = Object.fromEntries(
  Object.entries(spacing).map(([key, value]) => [key, toPx(value)])
) as Record<SpacingKey, number>;

export const rad = Object.fromEntries(
  Object.entries(radius).map(([key, value]) => [key, toPx(value)])
) as Record<RadiusKey, number>;

export function textStyle(key: TypographyKey) {
  const t = typography[key] as { fontFamily: string; fontSize: string; fontWeight: string; lineHeight: string; letterSpacing?: string };
  const fontSize = toPx(t.fontSize);
  return {
    fontFamily: t.fontFamily,
    fontSize,
    fontWeight: t.fontWeight as
      | 'normal'
      | 'bold'
      | '100'
      | '200'
      | '300'
      | '400'
      | '500'
      | '600'
      | '700'
      | '800'
      | '900',
    lineHeight: toPx(t.lineHeight),
    letterSpacing: emToPx(t.letterSpacing, fontSize),
  };
}
