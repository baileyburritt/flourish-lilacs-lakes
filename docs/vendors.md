# Vendor and cost register (F5)

One page, one source of truth. Billing owner for every account below is
`baileyburritt@gmail.com`. Plan tier and monthly cost are filled in from each
provider's own dashboard — an agent's API keys are scoped to product
functionality, not billing, so those columns need a human read at least
once, and again whenever a plan changes.

| Vendor | Used for | Plan | Monthly cost | Billing alert configured? | What breaks if it goes down |
| --- | --- | --- | --- | --- | --- |
| Neon | Managed Postgres + PostGIS (E1) | `free_v3` (confirmed via API 2026-09-13) | $0 on free tier | _human to confirm in Neon dashboard_ | Every read and write in the app — full outage. Also caps point-in-time recovery to a 6-hour window; see `docs/runbook.md`. |
| Clerk | Auth / sign-in (E2) | _human to confirm in Clerk dashboard_ | _human to confirm_ | _human to confirm_ | No one can sign in or refresh a session; existing sessions may keep working briefly depending on token TTL. |
| Cloudflare R2 | Private bucket for gem photos + audio memos (E6); public bucket for destination/event catalog photography (E10) | _human to confirm in Cloudflare dashboard_ | _human to confirm_ | _human to confirm_ | Private bucket down: no gem photo/audio upload, playback, or signed-URL delivery. Public bucket down: destination/event photography fails to load app-wide. |
| Sentry | Client + server error visibility (F3) | _chosen 2026-09-13; account not yet created_ — code/CI wiring for both `server/` and `app/` landed in F3, activates once a real `SENTRY_DSN` / `EXPO_PUBLIC_SENTRY_DSN` exists | — | — | No functional outage, but the only failure signal reverts to app store reviews — the exact gap §13 flagged as unacceptable. |
| UptimeRobot | Alerting on downtime (F3) | _chosen 2026-09-13; account not yet created_ — `server/src/app.ts`'s existing `/health` endpoint is the intended monitor target, documented in `docs/runbook.md` | — | — | An outage can run indefinitely before anyone notices. |
| Fly.io | Hosting for the `server/` Fastify API (F4) — two apps, `flourish-api-staging` and `flourish-api-production`; see `docs/runbook.md`'s F4 section for why two apps rather than one | _chosen 2026-09-13; account not yet created_ | — | — | Full API outage — no gem/trip/bookmark endpoints, no auth verification round-trip. |
| Cloudflare Pages | Hosting for the Expo web static export (F4) — two projects, `flourish-web-staging` and `flourish-web-production` | _chosen 2026-09-13; reuses the same Cloudflare account already used for R2 (confirm the account ID matches `R2_ACCOUNT_ID`), but needs its own **Pages-edit-scoped** API token (`CLOUDFLARE_PAGES_API_TOKEN`), created separately from the R2-scoped token — do not reuse the R2 credential here, and do not give the Pages token R2 permissions either. Account not yet created._ | — | — | Web PWA unreachable; native iOS/Android unaffected. |
| Mapbox | Drive-time estimates between itinerary stops (§16) | _not yet provisioned_ | — | — | Itinerary drive-time estimates fail; no turn-by-turn dependency since that was cut. |

## Notes

- Neon's `free_v3` plan and 6-hour PITR window were read directly from the
  Neon API against project `damp-thunder-23634085` on 2026-09-13 — see
  `docs/runbook.md` for detail and the open decision on whether to upgrade
  before launch.
- Sentry and UptimeRobot: F3 landed the code/CI side (server error capture,
  client error capture on native platforms, a `/health` monitor target, a
  deliberate-test-error endpoint) without creating either vendor account,
  per this repo's rule that the human creates every vendor account
  personally. Both are pure no-ops today (unset DSN, no monitor configured
  yet) and only start doing anything once the human creates the accounts and
  hands over `SENTRY_DSN` / `EXPO_PUBLIC_SENTRY_DSN` — see `docs/runbook.md`'s
  "Error tracking and uptime alerting (F3)" section for the exact activation
  steps and the manual verification this ticket's done-when requires.
- Fly.io and Cloudflare Pages each still need an account created by the
  human before F4 can start — an agent does not create these on its own
  initiative. Note they need **two** accounts' worth of resources (two Fly
  apps, two Pages projects — see their rows above and `docs/runbook.md`),
  but not two separate vendor *accounts*: one Fly account holding both
  apps, and Cloudflare Pages likely riding on the existing R2 Cloudflare
  account, just with its own scoped token.
- Billing alert configuration is a per-vendor dashboard action taken with
  account owner (not API-key) access. Until every "confirmed?" cell above
  reads yes, F5 is not fully closed even though this file exists.
