#!/usr/bin/env node
/**
 * Copy the curated exercise photos into packages/client-app/public/exercise-media/<slug>/{0,1}.jpg.
 *
 * Source: a local checkout of free-exercise-db (public domain, Unlicense) — passed as the only
 * argument, never committed. The folder is treated as data: this script reads two JPEGs per
 * fixture row and hands their paths to /usr/bin/sips; nothing in it is executed.
 *
 * Which photo goes where comes from scripts/fixtures/exercise-photos.json (source_id, and
 * `swap: true` where the source numbers end → start, so 0.jpg is always the start position).
 * Each photo is resized to at most 640 px on its longest side, JPEG at sips quality 45 (about libjpeg 70),
 * stepped down by 5 (not below 25) until it is at most 35 KB.
 *
 * Usage:  node scripts/import-exercise-photos.mjs /path/to/free-exercise-db
 * The output is committed; scripts/media1.scan.mjs checks it against the fixture on every smoke.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(ROOT, 'packages/client-app/public/exercise-media');
const SIPS = '/usr/bin/sips';
// sips' scale is not libjpeg's: 45 here is about libjpeg 70 (a 640 px photo comes out at ~30 KB instead of ~60 KB).
const QUALITY = 45, FLOOR = 25, TARGET_BYTES = 35 * 1024;   // the smoke scan's hard limit is 60 KB
const src = process.argv[2];
if (!src || !existsSync(path.join(src, 'exercises'))) {
  console.error('usage: node scripts/import-exercise-photos.mjs <free-exercise-db checkout>');
  process.exit(2);
}
const { readFileSync } = await import('node:fs');
const fixture = JSON.parse(readFileSync(path.join(ROOT, 'scripts/fixtures/exercise-photos.json'), 'utf8'));
const rows = Object.entries(fixture.exercises);
const SAFE = /^[a-z0-9][a-z0-9-]*$/, SAFE_ID = /^[A-Za-z0-9_,().'-]+$/;

// Slugs that left the fixture lose their folder: the scan fails on an orphan.
if (existsSync(OUT)) for (const d of readdirSync(OUT)) if (!fixture.exercises[d]) rmSync(path.join(OUT, d), { recursive: true });

let bytes = 0;
for (const [slug, e] of rows) {
  if (!SAFE.test(slug) || !SAFE_ID.test(e.source_id)) throw new Error(`refusing an unexpected name: ${slug} / ${e.source_id}`);
  const dir = path.join(OUT, slug);
  mkdirSync(dir, { recursive: true });
  // `hold: true` — a static hold whose source start photo shows getting into position: the hold photo fills both frames.
  const order = e.hold ? [1, 1] : e.swap ? [1, 0] : [0, 1];
  order.forEach((from, to) => {
    const inFile = path.join(src, 'exercises', e.source_id, `${from}.jpg`);
    const outFile = path.join(dir, `${to}.jpg`);
    // A busy gym background compresses badly: step the quality down until the photo fits the budget.
    for (let q = QUALITY; ; q -= 5) {
      execFileSync(SIPS, ['-s', 'format', 'jpeg', '-s', 'formatOptions', String(q), '-Z', '640', inFile, '--out', outFile], { stdio: 'pipe' });
      if (statSync(outFile).size <= TARGET_BYTES || q <= FLOOR) break;
    }
    bytes += statSync(outFile).size;
  });
}
console.log(`${rows.length} exercises, ${rows.length * 2} photos, ${(bytes / 1024).toFixed(0)} KB in ${path.relative(ROOT, OUT)}`);
