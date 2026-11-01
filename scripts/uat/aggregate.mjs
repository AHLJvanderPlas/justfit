// Aggregates out/<id>/log.json into one summary: per persona flows, failures, page errors, audit findings.
import { readdirSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import { PERSONAS } from './personas.mjs';
const OUT = new URL('../../.uat-out/', import.meta.url).pathname;
const rows = []; const fails = []; const errors = []; const audits = {}; const tinyByScreen = {}; const smallByScreen = {}; const underNav = {};
for (const p of PERSONAS) {
  const f = `${OUT}${p.id}/log.json`; if (!existsSync(f)) { rows.push({ id: p.id, missing: true }); continue; }
  const log = JSON.parse(readFileSync(f, 'utf8'));
  const flows = log.flows.map((x) => ({ name: x.name, ok: x.ok, taps: x.taps, screens: x.screens, s: Math.round((x.ms ?? 0) / 100) / 10, notes: x.notes }));
  const taps = flows.reduce((a, x) => a + x.taps, 0);
  const nFail = flows.filter((x) => !x.ok).length;
  rows.push({ id: p.id, who: p.who, device: p.device, lang: p.lang, flows: flows.length, failed: nFail, taps, sec: Math.round(flows.reduce((a, x) => a + x.s, 0)), shots: readdirSync(`${OUT}${p.id}`).filter((n) => n.endsWith('.png')).length });
  for (const x of flows) { for (const n of x.notes) { if (n.startsWith('FAIL')) fails.push({ id: p.id, flow: x.name, note: n }); if (n.startsWith('PAGEERROR') || n.startsWith('CONSOLE')) errors.push({ id: p.id, flow: x.name, note: n }); } }
  const NAV = /^(Vandaag|Voortgang|Deze week|Instellingen|Today|Progress|This Week|Settings|Coach)$/;
  const MODAL = /^(onboarding|checkin|path|login)/;
  for (const a of log.audits) {
    const key = a.screen.replace(/-\d+$/, '');
    a.tiny = (a.tiny ?? []).filter((t) => !NAV.test(t.text)); a.tinyCount = a.tiny.length;
    a.small = (a.small ?? []).filter((t) => !/^(CHECK-IN|0|\d+)$/.test(t.text)); a.smallCount = a.small.length;
    if (MODAL.test(key)) a.underNav = [];
    audits[key] ??= { n: 0, overflow: 0, small: 0, tiny: 0, underNav: 0, vw: new Set() };
    const k = audits[key]; k.n += 1; k.vw.add(a.vw); if (a.overflow) k.overflow += 1; if (a.smallCount) k.small += 1; if (a.tinyCount) k.tiny += 1; if (a.underNav?.length) k.underNav += 1;
    for (const t of a.tiny ?? []) { const kk = `${key} · "${t.text}" ${t.px}px`; tinyByScreen[kk] = (tinyByScreen[kk] ?? 0) + 1; }
    for (const s of a.small ?? []) { const kk = `${key} · "${s.text}" ${s.w}×${s.h}`; smallByScreen[kk] = (smallByScreen[kk] ?? 0) + 1; }
    for (const u of a.underNav ?? []) { const kk = `${key} · "${u}"`; underNav[kk] = (underNav[kk] ?? 0) + 1; }
  }
}
const top = (o, n = 40) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n);
const summary = { rows, fails, errors, audits: Object.fromEntries(Object.entries(audits).map(([k, v]) => [k, { ...v, vw: [...v.vw] }])), tiny: top(tinyByScreen), small: top(smallByScreen, 60), underNav: top(underNav) };
writeFileSync(`${OUT}summary.json`, JSON.stringify(summary, null, 1));
console.log('persona                 flows fail taps  sec shots');
for (const r of rows) console.log(r.missing ? `${r.id.padEnd(22)} (no run)` : `${r.id.padEnd(22)} ${String(r.flows).padStart(5)} ${String(r.failed).padStart(4)} ${String(r.taps).padStart(4)} ${String(r.sec).padStart(4)} ${String(r.shots).padStart(5)}`);
console.log(`\nFAILURES (${fails.length})`); for (const f of fails) console.log(` ${f.id} · ${f.flow}: ${f.note}`);
console.log(`\nPAGE/CONSOLE ERRORS (${errors.length})`); for (const e of errors) console.log(` ${e.id} · ${e.flow}: ${e.note}`);
console.log('\nAUDIT per screen (n, overflow, small-controls, tiny-text, under-nav)'); for (const [k, v] of Object.entries(audits)) console.log(` ${k.padEnd(28)} n=${v.n} ov=${v.overflow} small=${v.small} tiny=${v.tiny} nav=${v.underNav} vw=${[...v.vw].join('/')}`);
console.log('\nTINY TEXT (<11px) top'); for (const [k, n] of top(tinyByScreen, 25)) console.log(` ${n}× ${k}`);
console.log('\nSMALL CONTROLS (<40px) top'); for (const [k, n] of top(smallByScreen, 30)) console.log(` ${n}× ${k}`);
console.log('\nCONTROLS UNDER NAV top'); for (const [k, n] of top(underNav, 15)) console.log(` ${n}× ${k}`);
