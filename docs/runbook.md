# Operations runbook

## Database backups and point-in-time recovery (F1)

The managed Postgres from E1 is Neon project `Flourish` (`damp-thunder-23634085`,
org `org-cold-sound-92088874`, `aws-us-east-2`, Postgres 18).

Neon does not run discrete nightly backup jobs. Instead it retains write-ahead
log history continuously and lets any branch be restored (or a new branch
created) at any point within that retention window — this is what the Neon
dashboard and API call the project's **history retention** /
`history_retention_seconds`, and it is what serves as both "backup" and PITR
for this project. There is no separate "on schedule" backup artifact to point
at; the retention window itself is the backup.

**Current retention window: 6 hours** (`history_retention_seconds: 21600`),
the default ceiling on Neon's free (`free_v3`) plan, which is the plan this
project is currently on. A production incident noticed more than 6 hours
after the bad write (or delete) would be outside this window and
unrecoverable via PITR.

Longer retention (Neon's paid plans go up to 7 days on Launch and further on
Scale) requires upgrading the Neon plan, which means adding a payment method
to the account. Per this repo's standing rule, that is the human's call to
make and the human's account to put a card on — an agent should not upgrade
this on its own. **Open decision for the human:** stay on the free plan's
6-hour window, or upgrade for longer retention before launch. Whichever is
chosen, update the figure above so this stays accurate.

To restore from this window (via the Neon API or `neon branches restore`),
see the `neon-postgres` / `neon-postgres-branches` skills under
`app/.claude/skills/` — restoring means creating/resetting a branch to a
timestamp within `history_retention_seconds` of now, then pointing a scratch
connection at it.

## Restore drill (F2 — gate, performed by the human)

This is the gate, not the configuration above. Backup/PITR configuration is a
claim; a completed restore is a capability. Per the build plan, this step is
deliberately **not** performed or reported by an agent.

To run it: restore the current Neon history window into a scratch branch
(not the `development` or production branch), connect to it with a
throwaway `DATABASE_URL`, and confirm real rows come back from a query
against a table that has data (e.g. `select count(*) from destinations;`).

Record here once performed:

| Date | Performed by | Restore point | Elapsed time | Notes |
| --- | --- | --- | --- | --- |
| _(not yet performed)_ | | | | |

## Deploy and rollback (F4)

Two vendors, decided by the project owner (not re-litigated here): **Fly.io**
hosts `server/` (the Fastify API), **Cloudflare Pages** hosts `app/`'s Expo
web static export. Both are wired into `.github/workflows/deploy.yml`:
staging deploys on every merge to `master`, production deploys on a pushed
version tag (`v*`). See that file's header comment for why deploy lives in
its own workflow rather than `ci.yml`.

### Fly.io: two apps, not one app with environments

Fly's deployment unit is one app = one deployment target; it has no built-in
concept of "environments" within a single app the way some PaaS pipelines
do. The standard, documented pattern for more than one environment on Fly is
multiple apps, each with its own `fly.toml` and its own secrets — that's
what this repo does: `server/fly.staging.toml` (app `flourish-api-staging`)
and `server/fly.production.toml` (app `flourish-api-production`), both
building the same `server/Dockerfile`. This was chosen over "one app,
promote a release" because Fly has no first-class release-promotion
primitive either (promoting really means re-running `fly deploy` against a
second app or config anyway) — two apps make the staging/production
boundary explicit in the filesystem instead of implicit in a deploy
argument, at the cost of the human creating two Fly apps instead of one.

Both `fly.*.toml` files set a `release_command` that runs the compiled
database migrator (`node dist/db/migrate.js`) before Fly cuts traffic to the
new release. This repo's CLAUDE.md requires all schema changes to be
additive migrations, which is what makes it safe to run automatically ahead
of every deploy rather than behind a manual gate.

**Fly secrets a production (and staging) deploy needs** — set with
`fly secrets set KEY=value --app <app-name>`, once per app, never baked into
the image or committed to `fly.toml`. Read from `server/.env.example` for
the authoritative shape:

| Secret | From |
| --- | --- |
| `DATABASE_URL` | Neon — a direct (non-pooled) connection string, per-environment (staging app should point at a non-production Neon branch; never point staging at production data, per CLAUDE.md) |
| `R2_ACCOUNT_ID` | Cloudflare R2 (E6) |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 (E6), private gem-photo/audio-memo bucket, scoped credential |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 (E6), same credential pair as above |
| `R2_BUCKET_NAME` | Cloudflare R2 (E6) |
| `R2_CATALOG_ACCESS_KEY_ID` | Cloudflare R2 (E10), public catalog-photo bucket, a *separate* scoped credential from the private bucket's above |
| `R2_CATALOG_SECRET_ACCESS_KEY` | Cloudflare R2 (E10), same credential pair as above |
| `R2_CATALOG_BUCKET_NAME` | Cloudflare R2 (E10) |
| `R2_CATALOG_PUBLIC_BASE_URL` | Cloudflare R2 (E10) |
| `CLERK_SECRET_KEY` | Clerk (E2) — server-side secret key, distinct from the client-safe `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` baked into the web build below |

`PORT` is not a secret — Fly injects it and `server/src/index.ts` already
reads `process.env.PORT ?? 3000`; `fly.*.toml`'s `http_service.internal_port`
is set to `3000` to match.

**GitHub side** — `.github/workflows/deploy.yml` needs one secret to reach
Fly at all:

| Name | Kind | Notes |
| --- | --- | --- |
| `FLY_API_TOKEN` | GitHub Actions secret | A Fly deploy token (`fly tokens create deploy`), scoped ideally to the two apps above rather than the whole Fly org |

### Cloudflare Pages: two projects, mirroring the two Fly apps

Same reasoning as Fly, for the same reason (an explicit staging/production
boundary rather than one project's implicit preview/production split):
`flourish-web-staging` and `flourish-web-production`, both deployed via
`cloudflare/wrangler-action` (`cloudflare/pages-action` is deprecated
upstream in favor of `wrangler-action`) running `wrangler pages deploy` from
`app/`'s `npm run build:web` output (`app/dist`). Each `wrangler pages
deploy` call passes `--branch=main` — that names the Pages project's
*configured production branch* (set when the project is created), not this
repo's git branch, and it's what makes every deploy through this pipeline
count as a Production deployment in Cloudflare's UI rather than a preview
one, which matters for the rollback mechanism below.

`EXPO_PUBLIC_API_BASE_URL` is set per-job in `deploy.yml` to the matching
Fly app's `https://<app-name>.fly.dev` URL and baked into the static export
at build time (Expo inlines `EXPO_PUBLIC_*` vars at build, not at runtime) —
this is the value `app/.env.example`'s comment on that variable said would
arrive once Stage F existed.

**GitHub side:**

| Name | Kind | Notes |
| --- | --- | --- |
| `CLOUDFLARE_PAGES_API_TOKEN` | GitHub Actions secret | A **Pages-edit-scoped** Cloudflare API token, created separately from the R2-scoped token `server`'s CI jobs already use (`R2_ACCESS_KEY_ID`/`R2_SECRET_ACCESS_KEY`) — the same Cloudflare account per `docs/vendors.md`, but a distinct, narrower-scoped token. Do not reuse an R2 token here; R2 tokens don't carry Pages permissions and a Pages token shouldn't carry R2 object-storage permissions either. |
| `CLOUDFLARE_ACCOUNT_ID` | GitHub Actions repo variable (not secret — an account ID isn't a credential) | Same Cloudflare account as R2's `R2_ACCOUNT_ID` variable; confirm they match when setting this up |

### Rollback: Fly.io (server)

Fly has no dedicated `rollback` subcommand as of the current `flyctl`; the
documented mechanism is to redeploy a previously-built image by reference —
no rebuild, no checkout, just telling Fly to boot the older image:

```sh
# 1. Find the previous good release's image reference.
fly releases --app <app-name> --image

# 2. Redeploy it. This *is* the one-command rollback.
fly deploy --image registry.fly.io/<app-name>:<release-id> --app <app-name>
```

Add `--strategy immediate` to the second command to skip Fly's normal
rolling-deploy health-check pacing when the incident calls for speed over
caution. This does not undo a destructive database migration (this repo
only allows additive ones, so that's not a concern here) and does not
revert `fly secrets` or `fly.toml` changes — only the running image.

Run this against `flourish-api-staging` for the drill below; the identical
two commands (with `flourish-api-production`) are the production rollback.

### Rollback: Cloudflare Pages (web)

Wrangler's current Pages command set (`wrangler pages deployment list`,
`tail`, `delete`) has **no CLI rollback subcommand** — verified against
Cloudflare's own Wrangler command reference. The supported rollback path is
the dashboard:

1. Cloudflare dashboard → Workers & Pages → the project
   (`flourish-web-staging` or `flourish-web-production`) → **Deployments**.
2. Find the last-known-good deployment, open its **⋯** menu, choose
   **Rollback to this deployment**. This is instant — Cloudflare already has
   every prior deployment's files at the edge, so nothing rebuilds.

To identify candidate deployments from the CLI first (e.g. to get exact
timestamps before opening the dashboard):

```sh
npx wrangler pages deployment list --project-name=<project-name>
```

There is no `wrangler pages deployment rollback` command to script this
step end-to-end; the one-command rollback for Pages is the dashboard button
above, not a CLI invocation. (A CLI-only alternative that does exist but is
not a true rollback: re-run `deploy.yml`'s web job against the last-good
commit/tag, which re-uploads that build as a new deployment rather than
reactivating the old one — slower, and not what's recorded in the drill
below.)

### Rollback drill (this ticket's done-when — performed by the human)

Per the build plan, F4 is done when a rollback has actually been executed
once on staging and timed — not merely configured. Like the restore drill
above, this is deliberately **not** performed or reported by an agent.

Record here once performed:

| Date | Side (Fly / Cloudflare Pages) | Performed by | Elapsed time | Notes |
| --- | --- | --- | --- | --- |
| _(not yet performed)_ | | | | |
| _(not yet performed)_ | | | | |

## Error tracking and uptime alerting (F3)

Vendors: **Sentry** (client + server error tracking) and **UptimeRobot**
(uptime checks with alerting). Both were chosen by the project owner; as of
this writing neither account has been created yet (an agent does not create
vendor accounts on its own initiative — see CLAUDE.md's vendor rule), so the
wiring below activates the moment real credentials land and no-ops
gracefully until then. See `docs/vendors.md` for the vendor register rows.

### What's wired now

- **Server** (`server/`): `@sentry/node` is initialized in
  `server/src/instrument.ts`, imported first thing in `server/src/index.ts`
  (right after `dotenv/config`, before any other module — including
  `./app.js` and everything it pulls in — is imported). If `SENTRY_DSN` is
  unset, it logs one warning (`SENTRY_DSN not set — server error tracking is
  disabled.`) and returns without calling `Sentry.init` — the server boots
  and serves traffic identically either way. `server/src/app.ts` calls
  `Sentry.setupFastifyErrorHandler(app)` right after creating the Fastify
  instance, so any uncaught exception thrown by a route handler is reported
  to Sentry (a no-op when Sentry was never initialized) before Fastify's
  normal error response still goes out.
- **App** (`app/`): `@sentry/react-native` is initialized in
  `app/lib/sentry.ts`, called once at the top of `App.tsx`. It is scoped to
  **native platforms only** (`Platform.OS !== 'web'`) — see that file's
  comment for why: the web build this repo ships (`expo export -p web`,
  exercised by the Playwright/axe e2e suite) would need the Sentry Expo
  config plugin's Metro source-map wiring plus a real Sentry org/project/auth
  token to symbolicate anything useful on web, none of which exist yet
  (no Sentry account). A working native-only integration was chosen over a
  half-wired universal one; revisit once EAS/native builds and real Sentry
  project credentials exist. Reads `EXPO_PUBLIC_SENTRY_DSN`; unset skips init
  with a console warning, same as the server half.
- **Manual test-error hook**: `POST /api/v1/debug/test-error`, behind the
  same `requireAuth` every other mutating endpoint uses. Throws a
  deliberate error every time it's hit — only call it on purpose.
- **`/health`** (`server/src/app.ts`) already exists and is unchanged by
  this work — it's the endpoint UptimeRobot should monitor.

### Once the human has created the Sentry and UptimeRobot accounts

1. **Sentry — create two projects** (or one project, two platforms — either
   works): one for the Node/Fastify server, one for the Expo/React Native
   app. Copy each project's DSN.
2. **Hand over env vars**:
   - `SENTRY_DSN` → `server/.env` (production/staging deploy env once F4
     exists) and the `SENTRY_DSN` GitHub Actions repo **variable** (not
     secret — see `docs/vendors.md`'s note on why a DSN is write-only and
     safe as a plain variable).
   - `EXPO_PUBLIC_SENTRY_DSN` → `app/.env.local` and wherever the web/native
     builds get their env from once F4 exists.
3. **Verify server-side capture**: deploy (or run locally) with a real
   `SENTRY_DSN` set, sign in, and send an authenticated
   `POST /api/v1/debug/test-error` (e.g.
   `curl -X POST https://<server-host>/api/v1/debug/test-error -H "Authorization: Bearer <clerk-session-jwt>"`).
   Confirm the error appears in the Sentry dashboard within a minute or two.
4. **Verify client-side capture**: build/run the native app with a real
   `EXPO_PUBLIC_SENTRY_DSN` set and trigger any uncaught JS error (a
   temporary `throw` wired to a test button is the simplest way); confirm it
   appears in the Sentry dashboard for the app project.
5. **UptimeRobot**: add an HTTP(s) monitor against the deployed server's
   `/health` endpoint (expects a `200` with `{"status":"ok"}`, which itself
   depends on a live DB connection — see `server/src/app.ts`). Set the check
   interval and configure alert contacts to something the human actually
   reads (per §13 — not just another dashboard no one opens): email and/or a
   phone push via UptimeRobot's mobile app. Confirm delivery by pausing the
   monitor's target (or the server) briefly and watching a real alert land
   on a real device.
6. **Record here once both are done**:

| Date | Performed by | Test error confirmed in Sentry? | Simulated downtime confirmed alert? | Notes |
| --- | --- | --- | --- | --- |
| _(not yet performed — needs Sentry/UptimeRobot accounts)_ | | | | |

This table is this ticket's actual done-when ("a deliberately thrown test
error appears in the dashboard and a simulated downtime fires a real alert
to a real device") — like F2's restore drill above, it's a human gate an
agent cannot complete on its own, because it requires vendor accounts that
don't exist yet.
