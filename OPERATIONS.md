# JustFit — Operations Runbook

## Health endpoint

| Property | Value |
|---|---|
| URL | `https://justfit.cc/api/ping` |
| Method | `GET` |
| Auth | None required |
| Expected response | `200 { ok: true, db: true, ts: <ms> }` |
| DB-down response | `200 { ok: true, db: false, ts: <ms> }` — app up, DB unreachable |

### Alert thresholds (recommended)

| Condition | Action |
|---|---|
| 3 consecutive failures (non-200) within 5 min | Page on-call |
| `db: false` in response | Investigate D1 binding / Cloudflare status |
| Response time > 2s | Investigate cold start / D1 latency |

### Monitor setup (no vendor lock-in)

Any tool that supports HTTP checks works. Minimal example with `curl` in a cron job:

```bash
# cron: */5 * * * *
STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://justfit.cc/api/ping)
DB=$(curl -s https://justfit.cc/api/ping | grep -o '"db":true' | wc -l)
if [ "$STATUS" != "200" ] || [ "$DB" = "0" ]; then
  # send alert (email, Slack webhook, etc.)
  echo "ALERT: justfit.cc health check failed (status=$STATUS db_ok=$DB)"
fi
```

Free external monitors: UptimeRobot (5-min interval), Better Stack (3-min), Freshping (1-min).

**UptimeRobot setup (recommended — free tier, 5-min interval):**
1. Create account at https://uptimerobot.com
2. Add monitor: HTTP(s), URL = `https://justfit.cc/api/ping`, interval = 5 minutes
3. Alert contact: your email
4. Set alert threshold: 2 failures before alert (avoids one-off cold-start false positives)
5. Optional: add a second monitor for `https://justfit.cc` (the SPA shell itself)

---

## Incident response

### App returns 5xx / non-200 from /api/ping

1. Check Cloudflare Pages status: https://www.cloudflarestatus.com
2. Check recent deployments: `npx wrangler pages deployment list --project-name=justfit`
3. View live logs: `npx wrangler pages deployment tail --project-name=justfit`
4. Roll back if needed (see below)

### Rollback

```bash
# List recent deployments
npx wrangler pages deployment list --project-name=justfit

# Roll back to a specific deployment ID
npx wrangler pages deployment rollback <deployment-id> --project-name=justfit
```

### D1 database issue

```bash
# Check if D1 is reachable
npx wrangler d1 execute justfit-db --remote --command "SELECT 1"

# Check recent schema migrations applied
npx wrangler d1 execute justfit-db --remote --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
```

### Rate limit false positives

If legitimate users report 429 errors, check `auth_rate_limits` table:

```bash
npx wrangler d1 execute justfit-db --remote --command "SELECT bucket, count, window_start_ms FROM auth_rate_limits ORDER BY count DESC LIMIT 20;"

# Clear a specific bucket if needed
npx wrangler d1 execute justfit-db --remote --command "DELETE FROM auth_rate_limits WHERE bucket='login:email:user@example.com';"
```

---

---

## D1 Database Backup

D1 does not have automatic scheduled snapshots. Export manually before any significant migration or release.

```bash
# Export full database to a local SQLite file
npx wrangler d1 export justfit-db --remote --output justfit-backup-$(date +%Y%m%d).sql

# Verify the export is non-empty
wc -l justfit-backup-*.sql
```

Recommended cadence: before each migration, and once per week during active development.
Store the `.sql` files outside the repo (not committed — may contain user data).

---

## Deployment

GitHub auto-deploy is **suspended**. Always deploy manually in this order:

```bash
npm run smoke          # must pass before deploying
git add . && git commit -m "feat: ..." && git push
npm run build && npx wrangler pages deploy dist --project-name=justfit --branch=main
```

## Useful wrangler commands

```bash
npx wrangler whoami                                    # verify logged-in account
npx wrangler pages deployment list --project-name=justfit
npx wrangler pages deployment tail --project-name=justfit   # live logs
npx wrangler d1 execute justfit-db --remote --command "..."
```
