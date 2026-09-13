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

_Not yet configured — no error-tracking or uptime-monitoring vendor is
provisioned yet. See the vendor register below._

Once configured, this section documents: where the dashboards live, who
receives alerts, and the date a deliberately-thrown test error and a
simulated downtime were each last confirmed to fire.
