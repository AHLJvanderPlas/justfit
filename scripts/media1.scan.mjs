// Media 1 — exercise photos (offline scan, run by smoke). One line per broken rule; exit 1.
//
//  1. Every exercise in scripts/fixtures/exercise-photos.json has 0.jpg and 1.jpg in
//     packages/client-app/public/exercise-media/<slug>/, each a real JPEG of at most 60 KB.
//  2. migrations/0127_exercise_photos.sql and docs/exercise-photos.md are what
//     scripts/generate-exercise-photos-migration.mjs renders from the fixture today (regenerated
//     in memory and compared byte for byte) — a fixture edit without a regeneration fails.
//  3. Nothing in public/exercise-media without a fixture entry: no orphan folder, no third file.
//  4. _headers: one Content-Security-Policy, a Cache-Control rule for /exercise-media/*; the
//     generated service worker precaches only /assets/*.js|css (never the photo folder).
import fs from 'node:fs';
import path from 'node:path';
import { render, OUT, DOC } from './generate-exercise-photos-migration.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const rd = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const MEDIA = path.join(ROOT, 'packages/client-app/public/exercise-media');
const MAX = 60 * 1024;
const errs = [];

const fixture = JSON.parse(rd('scripts/fixtures/exercise-photos.json'));
const slugs = Object.keys(fixture.exercises ?? {});
if (slugs.length === 0) errs.push('exercise-photos.json: no exercises');

// 1 — files for every fixture entry
for (const slug of slugs) {
  for (const f of ['0.jpg', '1.jpg']) {
    const p = path.join(MEDIA, slug, f);
    if (!fs.existsSync(p)) { errs.push(`exercise-media/${slug}/${f}: missing`); continue; }
    const st = fs.statSync(p);
    if (st.size > MAX) errs.push(`exercise-media/${slug}/${f}: ${(st.size / 1024).toFixed(1)} KB > 60 KB`);
    const head = Buffer.alloc(3);
    const fd = fs.openSync(p, 'r'); fs.readSync(fd, head, 0, 3, 0); fs.closeSync(fd);
    if (head[0] !== 0xff || head[1] !== 0xd8 || head[2] !== 0xff) errs.push(`exercise-media/${slug}/${f}: not a JPEG`);
  }
}

// 2 — migration + review table in step with the fixture
const r = render(fixture);
if (r.errs.length) errs.push(...r.errs.map((e) => `exercise-photos.json: ${e}`));
if (!fs.existsSync(path.join(ROOT, OUT)) || rd(OUT) !== r.sql) errs.push(`${OUT}: out of step with the fixture — run node scripts/generate-exercise-photos-migration.mjs (and ship a change as a NEW migration once 0127 is applied)`);
if (!fs.existsSync(path.join(ROOT, DOC)) || rd(DOC) !== r.doc) errs.push(`${DOC}: out of step with the fixture — regenerate`);

// 3 — no orphans
if (fs.existsSync(MEDIA)) {
  for (const d of fs.readdirSync(MEDIA)) {
    const full = path.join(MEDIA, d);
    if (!fs.statSync(full).isDirectory()) { errs.push(`exercise-media/${d}: a loose file (only <slug>/0.jpg and 1.jpg belong here)`); continue; }
    if (!fixture.exercises[d]) errs.push(`exercise-media/${d}: no entry in exercise-photos.json`);
    for (const f of fs.readdirSync(full)) if (f !== '0.jpg' && f !== '1.jpg') errs.push(`exercise-media/${d}/${f}: unexpected file`);
  }
} else errs.push('packages/client-app/public/exercise-media: missing');

// 4 — headers and the service worker
const headers = rd('packages/client-app/public/_headers');
if ((headers.match(/^\s*Content-Security-Policy:/gm) ?? []).length !== 1) errs.push('_headers: exactly one Content-Security-Policy');
if (!/^\/exercise-media\/\*\n\s+Cache-Control: public, max-age=\d{6,}/m.test(headers)) errs.push('_headers: /exercise-media/* needs a long public Cache-Control');
const vite = rd('packages/client-app/vite.config.js');
if (!vite.includes(".filter(f => /^assets\\/.+\\.(js|css)$/.test(f))") || /exercise-media/.test(vite)) errs.push('vite.config.js: the service worker must precache only /assets/*.js|css, never the photos');

if (errs.length) { console.log(errs.join('\n')); process.exit(1); }
