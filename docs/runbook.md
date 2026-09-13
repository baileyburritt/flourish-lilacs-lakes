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

_Not yet configured — no hosting platform is provisioned for `server/` or
the Expo web export yet. See the vendor register below._

Once a deploy pipeline exists, this section documents: what triggers a
staging deploy (merge to `master`) vs. a production deploy (tag), and the
exact one-command rollback, plus the date it was last executed and timed on
staging.

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
