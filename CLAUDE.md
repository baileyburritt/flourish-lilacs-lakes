# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Flourish: Lilacs & Lakes — a regional discovery and trip-planning app for Rochester, the Finger Lakes, and Western NY.

**It is not an application yet.** It is five AI-exported (Google Stitch) static HTML screens plus design documentation. There is no repo, no package manager, no build step, no test runner, no backend, and nothing survives a page refresh — every save, bookmark, and form submit is a DOM mutation. Treat the screens as a design proof, not as a codebase that is nearly done.

There are no build, lint, or test commands. To preview a screen, open its `code.html` directly in a browser; each file is fully self-contained and renders standalone with no server.

## Layout

Each screen lives in its own directory with a `code.html` and a `screen.png` reference render:

| Directory | Screen |
| --- | --- |
| `explore_curate_flourish/` | Explore & Curate — discovery feed, filters, search |
| `music_live_events_flourish/` | Music & Live Events |
| `trip_planner_flourish/` | Trip Planner — multi-day itinerary builder |
| `destination_detail_private_gem_flourish/` | Destination Detail & Private Gem |
| `new_private_gem_flourish/` | New Private Gem — quick-entry capture form |

`flourish_lilacs_lakes_technical_handoff_prd.md` holds the intended data model, API sketch, and integration plan. Its schema is **incomplete** — it undercounts what the screens already capture (notably audio memos) — so do not treat it as authoritative over the review findings.

The `stitch_*.zip` files and the remaining image directories are export artifacts and brand-asset scratch. Nothing reads from them.

## Architecture of the screens

Every `code.html` is a standalone document, roughly 300–520 lines, that pulls in:

- **Tailwind via the Play CDN** (`cdn.tailwindcss.com`) with an **inline `tailwind.config` block in each file**
- Google Fonts — Outfit (headings) and Plus Jakarta Sans (body)
- Material Symbols Outlined for icons
- All imagery from `lh3.googleusercontent.com` — third-party export URLs that can vanish without notice

The per-file `tailwind.config` is the single most important structural fact here. The full token set is **duplicated verbatim into all five files**, so any token change means five edits, and the files can silently diverge. Extracting a shared component library and one token source is the prerequisite for most other work — do that before making the same fix five times.

## The token system — read this before touching any color

`DESIGN.md` exists in **three byte-identical copies**: repo root, `flourish_roc_lakes/`, and `trip_planner_flourish/`. They agree today; if they ever differ, that is a bug, not a variant. Consolidate to one rather than picking a favorite.

Within `DESIGN.md`, the **YAML frontmatter and the prose below it disagree with each other**, and the code follows the frontmatter:

| Role | Frontmatter + code | Prose section says |
| --- | --- | --- |
| `primary` | `#00152f` | `#162A45` "Deep Lake Navy" |
| `primary-container` | `#162a45` | — |
| `secondary` | `#6f48b2` | `#7E57C2` "Rochester Lilac" |
| `tertiary` | `#280d00` | `#D97736` "Finger Lakes Terracotta" (this is `on-tertiary-container` in fact) |
| canvas | `#f8f9ff` | `#F8FAFC` "Soft Lake Mist" |
| "Lake Slate" `#475569` | does not exist as a token | described as the neutral |

So the documented brand navy `#162a45` **is** present in the shipped code — demoted to `primary-container`, with a darker `#00152f` occupying `primary`. The drift is in role assignment and in `DESIGN.md` contradicting itself, not in a missing color.

The **radius scale is shifted one step** between `DESIGN.md` and the code: frontmatter has `sm/DEFAULT/md/lg/xl` = `0.25/0.5/0.75/1/1.5rem`, while the Tailwind config has `DEFAULT/lg/xl` = `0.25/0.5/0.75rem`. A `rounded-lg` in code is `0.5rem`, but `DESIGN.md` calls `lg` `1rem`. Typography and spacing tokens match cleanly and did not drift.

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

## Private gems are the product's one privacy promise

When the backend exists: every query against `user_private_gems` filters by the authenticated user id, with no exempt endpoint, job, admin path, or export. Enforce it in one layer — a repository or row-level security — rather than a `WHERE` clause repeated per handler. Gem photos **and audio memos** are served via signed, expiring URLs, never a public bucket path.

## Intended target architecture

Per the review's stack plan, for when implementation starts: Expo / React Native for iOS, Android and the PWA from one codebase; REST over a small managed Node or Rails service (not GraphQL yet); managed PostgreSQL with PostGIS; bought auth wrapping Apple/Google sign-in; R2 or S3 behind a CDN replacing every `lh3.googleusercontent.com` reference; Mapbox for maps; a managed platform for hosting; and three environments with synthetic-only data in staging.

## Working style for this project

Delivery is one human overseeing AI agents, which makes reviewability the binding constraint rather than throughput. Consequences:

- CI and a test harness come **first**, ahead of feature work — they are the review mechanism, not developer convenience.
- Prefer verification by test over verification by reading. Assert absence for the deleted features above, so they cannot quietly return.
- One ticket per change, small diffs. Never reformat a file you were not asked to change — a large diff hiding one real edit is unreviewable.
- Do not report a test as passing unless it ran and you read the output.
