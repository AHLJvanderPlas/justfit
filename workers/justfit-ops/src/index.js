// justfit-ops — scheduled operations worker.
// Two crons (see wrangler.toml):
//   0 2 * * 0  weekly D1 export → R2 (EU jurisdiction), keep newest 12   (X-29)
//   0 7 * * *  daily push-notification dispatch via /api/push-dispatch   (C-E18)
// CF Pages Functions cannot take scheduled triggers, hence this separate worker.

const KEEP_BACKUPS = 12;

export default {
  async scheduled(event, env, ctx) {
    if (event.cron === '0 2 * * SUN') ctx.waitUntil(runBackup(env));
    if (event.cron === '0 7 * * *') ctx.waitUntil(runPushDispatch(env));
  },

  // Manual triggers for ops testing: POST /run-backup or /run-push,
  // guarded by the same Bearer secret as the push dispatch endpoint.
  async fetch(request, env) {
    const auth = request.headers.get('Authorization') ?? '';
    if (!env.PUSH_DISPATCH_SECRET || auth !== `Bearer ${env.PUSH_DISPATCH_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }
    const path = new URL(request.url).pathname;
    if (request.method === 'POST' && path === '/run-backup') {
      await runBackup(env);
      const list = await env.BACKUPS.list({ prefix: 'backups/' });
      return Response.json({ ok: true, backups: list.objects.map((o) => ({ key: o.key, size: o.size })) });
    }
    if (request.method === 'POST' && path === '/run-push') {
      await runPushDispatch(env);
      return Response.json({ ok: true });
    }
    return new Response('Not found', { status: 404 });
  },
};

// ── Weekly D1 backup ─────────────────────────────────────────────────────────

async function runBackup(env) {
  try {
    // Dump via the D1 binding — no API token needed, nothing that can expire.
    const master = await env.DB.prepare(
      `SELECT type, name, sql FROM sqlite_master
       WHERE sql IS NOT NULL AND name NOT LIKE '\\_cf%' ESCAPE '\\' AND name != 'sqlite_sequence'
       ORDER BY CASE type WHEN 'table' THEN 0 ELSE 1 END, name`
    ).all();

    const parts = [`-- justfit-db dump ${new Date().toISOString()}\nPRAGMA foreign_keys=OFF;\n`];
    for (const row of master.results) {
      parts.push(row.sql.trim() + ';\n');
      if (row.type !== 'table') continue;
      const { results } = await env.DB.prepare(`SELECT * FROM "${row.name}"`).all();
      for (const r of results) {
        const cols = Object.keys(r);
        const vals = cols.map((c) => sqlLiteral(r[c]));
        parts.push(`INSERT INTO "${row.name}" (${cols.map((c) => `"${c}"`).join(',')}) VALUES (${vals.join(',')});\n`);
      }
    }

    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const key = `backups/justfit-db-${stamp}.sql`;
    await env.BACKUPS.put(key, parts.join(''));

    // Prune: keep the newest KEEP_BACKUPS objects
    const list = await env.BACKUPS.list({ prefix: 'backups/' });
    const sorted = list.objects.sort((a, b) => (a.key < b.key ? 1 : -1));
    for (const obj of sorted.slice(KEEP_BACKUPS)) await env.BACKUPS.delete(obj.key);

    console.log(`[backup] stored ${key} (${master.results.length} objects), kept ${Math.min(sorted.length, KEEP_BACKUPS)}`);
  } catch (e) {
    console.error('[backup] failed:', e.message);
    await alert(env, 'JustFit D1 backup FAILED', `Weekly justfit-db dump failed: ${e.message}`);
  }
}

function sqlLiteral(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return String(v);
  if (v instanceof ArrayBuffer || ArrayBuffer.isView(v)) {
    const bytes = v instanceof ArrayBuffer ? new Uint8Array(v) : new Uint8Array(v.buffer);
    return `X'${[...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')}'`;
  }
  return `'${String(v).replace(/'/g, "''")}'`;
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
