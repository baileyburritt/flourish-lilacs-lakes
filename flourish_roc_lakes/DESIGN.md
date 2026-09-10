---
name: Flourish / ROC & Lakes
colors:
  surface: '#f8f9ff'
  surface-dim: '#ccdbf3'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e6eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d5e3fc'
  on-surface: '#0d1c2e'
  on-surface-variant: '#44474d'
  inverse-surface: '#233144'
  inverse-on-surface: '#eaf1ff'
  outline: '#74777e'
  outline-variant: '#c4c6ce'
  surface-tint: '#4c5f7d'
  primary: '#00152f'
  on-primary: '#ffffff'
  primary-container: '#162a45'
  on-primary-container: '#7e92b2'
  inverse-primary: '#b4c7ea'
  secondary: '#6f48b2'
  on-secondary: '#ffffff'
  secondary-container: '#b78efe'
  on-secondary-container: '#491d8a'
  tertiary: '#280d00'
  on-tertiary: '#ffffff'
  tertiary-container: '#481d00'
  on-tertiary-container: '#d97736'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d5e3ff'
  primary-fixed-dim: '#b4c7ea'
  on-primary-fixed: '#061c36'
  on-primary-fixed-variant: '#354764'
  secondary-fixed: '#ebdcff'
  secondary-fixed-dim: '#d4bbff'
  on-secondary-fixed: '#260058'
  on-secondary-fixed-variant: '#572e99'
  tertiary-fixed: '#ffdbc9'
  tertiary-fixed-dim: '#ffb68c'
  on-tertiary-fixed: '#321200'
  on-tertiary-fixed-variant: '#753400'
  background: '#f8f9ff'
  on-background: '#0d1c2e'
  surface-variant: '#d5e3fc'
typography:
  display-lg:
    fontFamily: Outfit
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Outfit
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Outfit
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Outfit
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.005em
  headline-sm:
    fontFamily: Outfit
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 21px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  space-xxs: 0.25rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.25rem
  space-xl: 1.5rem
  space-2xl: 2rem
  space-3xl: 3rem
  gutter-mobile: 1rem
  gutter-tablet: 1.5rem
  margin-mobile: 1rem
  margin-tablet: 2rem
---

## Brand & Style

This design system establishes a refined editorial atmosphere paired with natural discovery and outdoor exploration across Rochester, the Finger Lakes, and Western New York. The experience must feel curated rather than utilitarian—evoking the tactile richness of an independent regional travel journal coupled with the swift, polished utility of a modern native mobile tool.

### Visual Character
The aesthetic merges **Refined Editorial** with **Soft Tactility**:
- **Airy & Atmospheric:** Subtle lake mist backgrounds allow pristine white cards and rich photography to sit prominently.
- **Rooted & Earthy:** Deep lake depths anchor navigational architecture, while floral lilac tones and sunlit terracotta provide vibrant, human warmth.
- **Curated Rhythm:** Varied card structures, editorial typographic hierarchy, and pill-shaped touch targets evoke thoughtful travel itineraries, artisan cideries, glacial gorge trails, and urban cultural hubs.

## Colors

The palette directly references the microclimates and landscapes of Western New York: deep glacial lake waters, Highland Park lilacs, sun-drenched Keuka shale and brick mills, and morning mist rising off water.

### Role Assignments
- **Primary (`#162A45` - Deep Lake Navy):** Applied to primary actions, key active navigation points, dominant high-contrast text, and deep header containers.
- **Secondary (`#7E57C2` - Rochester Lilac):** Expressive cultural accents, festival discovery badges, selected state highlights, and featured destination labels.
- **Tertiary (`#D97736` - Finger Lakes Terracotta):** Adventurous accents, seasonal trail highlights, calls to action for bookings or map triggers, and weather/sun indicators.
- **Neutral (`#475569` - Lake Slate):** Balanced secondary body text, icon outlines, inactive indicators, and structural hairline borders.
- **Canvas Base:** Soft Lake Mist (`#F8FAFC`) forms the ambient foundational canvas, preventing glare during outdoor use, contrasted with crisp pure white (`#FFFFFF`) card surfaces.

## Typography

The type system blends the geometric personality of **Outfit** for editorial titles and headings with the legible, friendly proportions of **Plus Jakarta Sans** for interfaces, wayfinding, and narrative descriptions.

- **Editorial Headlines (`Outfit`):** Gives destination names, regional guides, and editorial features a contemporary, magazine-like presence.
- **Reading & Functional Elements (`Plus Jakarta Sans`):** Ensures clear legibility on high-density cards, map pins, itineraries, and technical amenity badges even under direct outdoor sunlight.
- **Letter Spacing:** Headlines utilize subtle negative tracking to preserve tightness and visual weight, while miniature labels leverage positive tracking for legibility at small scale.

## Layout & Spacing

This design system uses an **8-point spatial model** optimized for thumb-driven mobile ergonomics and fluid horizontal discovery carousels.

### Layout System
- **Mobile (Base):** Fluid grid using a 4-column structure with `16px` (`1rem`) outer screen margins and `16px` gutters.
- **Tablet / Large Mobile:** Reflows into an 8-column layout with `24px` outer margins and `20px` gutters.
- **Vertical Rhythm:** Standard component padding is `16px`, with dense sub-elements spaced at `8px` or `12px`. Section boundaries receive generous `32px` to `48px` separations to retain the calm editorial cadence.
- **Horizontal Carousels:** Cards snap along the left-margin threshold with an 80-85% viewport peek to encourage continuous swipe-based discovery.

## Elevation & Depth

Visual depth is achieved through **ambient, atmospheric shadows** paired with clean, low-contrast borders rather than harsh structural drops.

### Shadow Recipes & Light Modeling
- **Sunlit Ambient Shadow:** Shadows are subtly tinted with Lake Navy (`#162A45`) at low opacity instead of pure carbon black, preserving the natural feel.
  - *Resting Cards (Elevation 1):* `0 2px 8px -2px rgba(22, 42, 69, 0.06), 0 1px 3px -1px rgba(22, 42, 69, 0.04)`
  - *Floating Controls / Floating Action Bar (Elevation 2):* `0 8px 24px -4px rgba(22, 42, 69, 0.10), 0 4px 10px -2px rgba(22, 42, 69, 0.05)`
  - *Modal Bottom Sheets (Elevation 3):* `0 -8px 32px 0 rgba(22, 42, 69, 0.12)`
- **Boundary Control:** Every card is grounded with an ultra-soft border (`1px solid rgba(22, 42, 69, 0.06)`) to ensure crisp division over dynamic photography and gradient backdrops.
- **Glass Surfaces:** Sticky navigation headers and floating filter bars utilize backdrop blur (`backdrop-filter: blur(12px)`) over an 85% translucent mist base (`rgba(248, 250, 252, 0.85)`).

## Shapes

The shape language reflects the organic contours of regional waterways and rolling hills, balanced by crisp editorial framing.

- **Base Radius (16px / `1rem`):** Applied to content cards, destination media containers, and modal sheets.
- **Pill Radius (Full / `9999px`):** Applied consistently to chips, filter tags, interactive pills, and primary CTAs to create tactile, thumb-friendly touch targets.
- **Inner Nested Radius:** When nesting badges or image blocks within parent cards, use an 8px radius (`0.5rem`) to maintain concentric alignment.

## Components

### Buttons
- **Primary:** Deep Lake Navy (`#162A45`) background, white text (`#FFFFFF`), full pill shape (`roundedness: 3` / `9999px`), height `48px`, horizontal padding `24px`. Subtle lift on active state.
- **Accent Action:** Finger Lakes Terracotta (`#D97736`) with white text, reserved for booking tickets, starting GPS trails, or saving itineraries.
- **Secondary / Subtle:** Mist-tinted fill (`#F1F5F9`), Navy text, zero border, full pill.
- **Floating Map Button:** Centered bottom-screen floating pill with Navy background, white iconography/text, and Elevation 2 shadow.

### Chips & Filter Tags
- **Unselected:** Transparent background, `1px` border of Slate-200 (`#E2E8F0`), label in Natural Slate (`#475569`), height `32px`, pill radius.
- **Selected:** Soft Lilac tint background (`rgba(126, 87, 194, 0.12)`), Rochester Lilac border and text (`#7E57C2`), semi-bold.

### Destination & Itinerary Cards
- **Editorial Experience Card:** Pure white card surface, `16px` corner radius, `12px` interior padding. Features a 4:3 or 16:9 ratio imagery block with an organic `12px` corner radius.
- **Badging:** Category tags (e.g., "Keuka Wine Trail", "Canal Walk") sit floating within the image top-left corner as translucent blurred pills.
- **Bookmark / Save:** Placed in the top-right corner with a circular frosted glass container (`36px` diameter).

### Input Fields & Search Bars
- **Discovery Search Bar:** Large pill container (`52px` height) with white surface fill, ambient elevation, and a leading search lens icon in Terracotta (`#D97736`). Placeholder text in soft slate.
- **Form Inputs:** Soft grey fill (`#F8FAFC`), `1px` border (`#E2E8F0`), `12px` roundedness, with smooth focus transition into Lake Navy border and subtle lilac focus glow ring.

### Lists & Trail Guides
- Separators use fine, muted borders (`1px solid rgba(22, 42, 69, 0.05)`).
- Leading elements leverage rounded square thumbnails (`48px` by `48px` with `8px` radius) or route milestone icons with high-contrast badge fills.

### Navigation Elements
- **Bottom Tab Bar:** Fixed bottom bar with blurred mist surface (`rgba(255, 255, 255, 0.9)`), `64px` height, featuring 4 to 5 icons. Active tab highlighted in Lake Navy with a small Terracotta indicator dot directly below.