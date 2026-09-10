# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Read `docs/review.html` (the cross-functional review, especially §16) and `docs/build-plan.html` (the ticketed implementation plan) before proposing scope. This file is the working summary of both — if something here seems to conflict with a ticket, the build plan wins; if a ticket seems to conflict with §16, the review wins.

## What this is

Flourish: Lilacs & Lakes — a regional discovery and trip-planning app for Rochester, the Finger Lakes, and Western NY.

**It is not an application yet.** It is five AI-exported (Google Stitch) static HTML screens plus design documentation. There is no repo, no package manager, no build step, no test runner, no backend, and nothing survives a page refresh — every save, bookmark, and form submit is a DOM mutation. Treat the screens as a design proof, not as a codebase that is nearly done.

The five screens themselves have no build, lint, or test commands. To preview one, open its `code.html` directly in a browser; each file is fully self-contained and renders standalone with no server.

## Layout

Each screen lives in its own directory with a `code.html` and a `screen.png` reference render:

| Directory | Screen |
| --- | --- |
| `explore_curate_flourish/` | Explore & Curate — discovery feed, filters, search |
| `music_live_events_flourish/` | Music & Live Events |
| `trip_planner_flourish/` | Trip Planner — multi-day itinerary builder |
| `destination_detail_private_gem_flourish/` | Destination Detail & Private Gem |
| `new_private_gem_flourish/` | New Private Gem — quick-entry capture form |

`app/` is the real application (ticket A3 on): an Expo/React Native project, one codebase targeting iOS, Android and web. It is currently an empty scaffold — none of the five screens have been ported into it yet, and porting them is explicitly out of scope until the shared component/token extraction work in a later ticket. From `app/`: `npm run web` (dev server) / `npm run build:web` (static export) work in this environment; `npm run android` / `npm run ios` require an Android SDK+emulator or a Mac, neither of which is present in every environment this repo is worked in.

`flourish_lilacs_lakes_technical_handoff_prd.md` holds the intended data model, API sketch, and integration plan. Its schema is **incomplete** — it undercounts what the screens already capture (notably audio memos) — so do not treat it as authoritative over the review findings.

The original `stitch_*.zip` export files and two brand-asset scratch directories were removed 2026-09-09 (they were unreferenced by any code, and confirmed against `code.html` first — see the git history if you need to recover one). The repo is version-controlled as of the same date: private, at `github.com/baileyburritt/flourish-lilacs-lakes`. Small diffs, one ticket per PR, normal git hygiene from here on.

## Architecture of the screens

Every `code.html` is a standalone document, roughly 300–520 lines, that pulls in:

- **Tailwind via the Play CDN** (`cdn.tailwindcss.com`) with an **inline `tailwind.config` block in each file**
- Google Fonts — Outfit (headings) and Plus Jakarta Sans (body)
- Material Symbols Outlined for icons
- All imagery from `lh3.googleusercontent.com` — third-party export URLs that can vanish without notice

The per-file `tailwind.config` is the single most important structural fact here. The full token set is **duplicated verbatim into all five files**, so any token change means five edits, and the files can silently diverge. Extracting a shared component library and one token source is the prerequisite for most other work — do that before making the same fix five times.

## The token system — read this before touching any color

`DESIGN.md` at the repo root is the **only** copy as of 2026-09-09 — two duplicate copies (`flourish_roc_lakes/`, `trip_planner_flourish/`) were byte-identical and have been deleted. Never recreate a second copy; if a screen directory seems to need its own, it doesn't.

Within `DESIGN.md`, the **YAML frontmatter and the prose below it currently disagree with each other**, and the shipped code follows the frontmatter — but the frontmatter is not the target. **This has been decided (2026-09-09): the prose wins.** The brand is Deep Lake Navy `#162A45` primary and Rochester Lilac `#7E57C2` secondary.

| Role | Frontmatter + code today (losing) | Prose — decided, the target |
| --- | --- | --- |
| `primary` | `#00152f` | `#162A45` "Deep Lake Navy" |
| `primary-container` | `#162a45` | — |
| `secondary` | `#6f48b2` | `#7E57C2` "Rochester Lilac" |
| `tertiary` | `#280d00` | `#D97736` "Finger Lakes Terracotta" (this is `on-tertiary-container` in fact) |
| canvas | `#f8f9ff` | `#F8FAFC` "Soft Lake Mist" |
| neutral | does not exist as a token | `#475569` "Lake Slate" |

This decision reversed an earlier same-day call for the frontmatter, once it became clear the approved `flourish_logo.png` already renders in the prose's lilac — choosing the frontmatter would have left the one finished brand asset disagreeing with the app. **Until ticket C1 runs, the code still implements the losing (frontmatter) values — that is expected, not a bug to fix ad hoc.** C1 rewrites the frontmatter to the decided values, regenerates tokens from it, and re-renders all five screens; it is a serial, single-agent ticket precisely because five parallel fixes would diverge. Do not hand-patch a hex in a component to get ahead of it.

The **radius scale is shifted one step** between `DESIGN.md` and the code, independent of the color decision: frontmatter has `sm/DEFAULT/md/lg/xl` = `0.25/0.5/0.75/1/1.5rem`, while the Tailwind config has `DEFAULT/lg/xl` = `0.25/0.5/0.75rem`. A `rounded-lg` in code is `0.5rem`, but `DESIGN.md` calls `lg` `1rem`. The prose's own radius language already matches the frontmatter, so C1 fixes the code to match both, not the docs. Typography and spacing tokens match cleanly and did not drift.

## Standing product decisions

These were decided in a cross-functional review and signed off. They are not open questions, and several are deletions of code that currently exists — **a fresh reading of the repo will suggest finishing them, which is wrong.**

**Do not build or restore:**
- **Turn-by-turn navigation.** "Start Navigation" hands off to the platform maps app. Mapbox Directions is in scope only for drive-time estimates between itinerary stops.
- **Drag-reordering on Trip Planner.** The Reorder control is to be removed, not implemented.
- **Community sharing of private gems.** No sharing UI and no "Coming Soon" label. The `is_private` schema column stays; the feature does not.
- **Offline map caching.** Deferred — and the simulated "42 MB downloaded" toast is deleted outright, since it reports a download that never happens.

**Committed:** the audio-memo capture on the New Private Gem screen is a real feature, not a cut candidate. The text notes field on that same form is protected — it may not be removed, hidden, or demoted behind the audio flow, because it is the equivalent path that keeps the feature accessible.

## Accessibility is a build requirement

The bar is **WCAG 2.1 AA**, treated as integral to the design rather than as a compliance floor to negotiate down. Current known violations, all reproducible:

- 25 images carry `data-alt` instead of `alt`, so meaningful photography is invisible to screen readers. `alt` is used correctly in 19 other places, so the pattern is inconsistent rather than absent.
- All five viewport tags carry `user-scalable=no, maximum-scale=1.0` (WCAG 1.4.4).
- Focus indicators are stripped from primary inputs with no replacement.
- Save/bookmark toasts are silent to assistive tech; privacy toggles and icon-only buttons lack accessible names; chips convey selection by color alone; several fields use placeholder text as their only label.

When fixing these: never use `alt=""` on a meaningful image to satisfy a linter — that passes every automated check and fails the users the work exists for. Automated scanning catches only a minority of WCAG issues, so a clean scan is a floor, not evidence of conformance.

Rules for all new and touched work, not just the violations above:

- Every interactive element needs an accessible name. Prefer a visible `<label>`; use `aria-label` only when no visible text exists, and never both on the same control.
- Never remove a focus indicator without a visible `:focus-visible` replacement landing in the *same* commit.
- Never add `user-scalable=no` or `maximum-scale=1` to a viewport meta tag.
- Status messages (saved, bookmarked, error) go through an `aria-live="polite"` region — one shared region, not one per screen.
- Placeholder text is never a substitute for a label.

## Private gems are the product's one privacy promise

When the backend exists: every query against `user_private_gems` filters by the authenticated user id, with no exempt endpoint, job, admin path, or export. Enforce it in one layer — a repository or row-level security — rather than a `WHERE` clause repeated per handler. Gem photos **and audio memos** are served via signed, expiring URLs, never a public bucket path.

## Vendors, accounts and content

- Never create a paid vendor account, enter payment details, or sign up for a service on your own initiative. The human creates every account (Postgres, auth, storage, Mapbox, hosting, error tracking) personally and hands you a scoped API key. If a ticket needs an account that doesn't exist yet, stop and ask.
- Which specific vendor (which Postgres host, which auth provider, R2 or S3, which hosting platform) is decided when its ticket is reached, not in advance. Get something working first; the architecture below is the direction, not a vendor list to pre-select from.
- Destination and gem photography is procured by the human, not sourced, scraped, or generated by you. Your job on image tickets is the pipeline — owned storage, CDN, the swap off `lh3.googleusercontent.com` — not picking photos.
- Production content (real destinations, events, the PRD's §5 integrations) is entered by the human on their own schedule. Seed data you write is synthetic only — never treat a plausible-looking destination you invented as real content.

## Intended target architecture

Per the review's stack plan, for when implementation starts: Expo / React Native for iOS, Android and the PWA from one codebase; REST over a small managed Node or Rails service (not GraphQL yet); managed PostgreSQL with PostGIS; bought auth wrapping Apple/Google sign-in; R2 or S3 behind a CDN replacing every `lh3.googleusercontent.com` reference; Mapbox for maps; a managed platform for hosting; and three environments with synthetic-only data in staging.

## Working style for this project

Delivery is one human overseeing AI agents, which makes reviewability the binding constraint rather than throughput. Consequences:

- CI and a test harness come **first**, ahead of feature work — they are the review mechanism, not developer convenience.
- Prefer verification by test over verification by reading. Assert absence for the deleted features above, so they cannot quietly return.
- One ticket per change, small diffs. Never reformat a file you were not asked to change — a large diff hiding one real edit is unreviewable.
- Do not report a test as passing unless it ran and you read the output.
- No production data in staging or dev, ever, including "just to test with."
- Schema changes are additive migrations. Never a destructive one without asking.
