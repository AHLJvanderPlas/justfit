// justfit-ops — scheduled operations worker.
// Two crons (see wrangler.toml):
//   0 2 * * 0  weekly D1 export → R2 (EU jurisdiction), keep newest 12   (X-29)
//   0 7 * * *  daily push-notification dispatch via /api/push-dispatch   (C-E18)
// CF Pages Functions cannot take scheduled triggers, hence this separate worker.

const KEEP_BACKUPS = 12;

export default {
  async scheduled(event, env, ctx) {
    if (event.cron === '0 2 * * 0') ctx.waitUntil(runBackup(env));
    if (event.cron === '0 7 * * *') ctx.waitUntil(runPushDispatch(env));
  },
};

// ── Weekly D1 backup ─────────────────────────────────────────────────────────

async function runBackup(env) {
  try {
    const base = `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/d1/database/${env.D1_DATABASE_ID}/export`;
    const headers = {
      Authorization: `Bearer ${env.D1_EXPORT_API_TOKEN}`,
      'Content-Type': 'application/json',
    };

    // The export API is a polling flow: first call starts the export, subsequent
    // calls with current_bookmark poll until signed_url appears.
    let body = { output_format: 'polling' };
    let signedUrl = null;
    for (let attempt = 0; attempt < 30; attempt++) {
      const res = await fetch(base, { method: 'POST', headers, body: JSON.stringify(body) });
      const data = await res.json();
      if (!data.success) throw new Error(`export API: ${JSON.stringify(data.errors)}`);
      const r = data.result ?? {};
      if (r.signed_url || r.result?.signed_url) {
        signedUrl = r.signed_url ?? r.result.signed_url;
        break;
      }
      if (r.at_bookmark) body = { output_format: 'polling', current_bookmark: r.at_bookmark };
      await new Promise((ok) => setTimeout(ok, 2000));
    }
    if (!signedUrl) throw new Error('export never produced a signed_url after 30 polls');

    const dump = await fetch(signedUrl);
    if (!dump.ok) throw new Error(`signed_url fetch: ${dump.status}`);

    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const key = `backups/justfit-db-${stamp}.sql`;
    await env.BACKUPS.put(key, dump.body);

    // Prune: keep the newest KEEP_BACKUPS objects
    const list = await env.BACKUPS.list({ prefix: 'backups/' });
    const sorted = list.objects.sort((a, b) => (a.key < b.key ? 1 : -1));
    for (const obj of sorted.slice(KEEP_BACKUPS)) await env.BACKUPS.delete(obj.key);

    console.log(`[backup] stored ${key}, pruned to ${Math.min(sorted.length, KEEP_BACKUPS)}`);
  } catch (e) {
    console.error('[backup] failed:', e.message);
    await alert(env, 'JustFit D1 backup FAILED', `Weekly justfit-db export failed: ${e.message}`);
  }
}

// ── Daily push dispatch ──────────────────────────────────────────────────────

async function runPushDispatch(env) {
  try {
    const res = await fetch(`${env.APP_ORIGIN}/api/push-dispatch`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.PUSH_DISPATCH_SECRET}` },
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`push-dispatch ${res.status}: ${text.slice(0, 200)}`);
    console.log(`[push] dispatched: ${text.slice(0, 200)}`);
  } catch (e) {
    console.error('[push] failed:', e.message);
    await alert(env, 'JustFit push dispatch FAILED', `Daily push dispatch failed: ${e.message}`);
  }
}

// ── Failure alerts ───────────────────────────────────────────────────────────

async function alert(env, subject, text) {
  if (!env.RESEND_API_KEY) return;
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'JustFit Ops <noreply@justfit.cc>',
      to: [env.ALERT_EMAIL],
      subject,
      html: `<p>${text}</p><p>Worker: justfit-ops · ${new Date().toISOString()}</p>`,
    }),
  }).catch(() => {});
}
