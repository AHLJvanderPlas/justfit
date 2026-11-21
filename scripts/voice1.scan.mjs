// Voice 1 — recorded coach voice (offline scan, run by smoke). One line per broken rule; exit 1.
//
//  1. Every manifest entry has its mp3 on disk: at most 400 KB, starting with an MP3 / ID3 signature.
//  2. No mp3 in public/exercise-audio without a manifest entry (and nothing else loose in the folder).
//  3. Manifest hashes equal the fixture's (script + voice + model): a script edit without a
//     regeneration makes the audio stale and fails.
//  4. migrations/0128_exercise_voice.sql is what the generator renders from the files on disk
//     today (byte for byte); with no mp3 there must be no 0128. docs/exercise-voice.md equals the
//     fixture's review table.
//  5. Every fixture script is 150 to 400 characters and free of digits and of the characters
//     × / ( ) [ ] (a voice stumbles on them: numbers are written as words).
//  6. _headers: one Content-Security-Policy and a long Cache-Control for /exercise-audio/*; the
//     service worker never precaches the clips.
//
// The pilot is not generated yet: an empty exercise-audio folder and an absent 0128 pass.
// scan({ root }) is exported so tests can run it on temp directories.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { SRC, OUT, DOC, AUDIO_DIR, MANIFEST, MAX_BYTES, LANGS, allEntries, fileKey, readManifest, render, CLIPS_MODULE, clipsModule } from './generate-exercise-voice.mjs';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

export function scan({ root = REPO, checkHeaders = true } = {}) {
  const errs = [];
  const at = (f) => path.join(root, f);
  const rd = (f) => fs.readFileSync(at(f), 'utf8');
  const dir = at(AUDIO_DIR);

  let fixture;
  try { fixture = JSON.parse(rd(SRC)); } catch { return [`${SRC}: missing or not JSON`]; }
  const entries = allEntries(fixture);
  if (!entries.length) errs.push(`${SRC}: no exercises`);

  // 5 — the scripts
  for (const e of entries) {
    if (e.chars < 150 || e.chars > 400) errs.push(`${SRC}: ${e.slug} ${e.lang} is ${e.chars} characters (150 to 400)`);
    if (/[0-9×/()[\]]/.test(e.text)) errs.push(`${SRC}: ${e.slug} ${e.lang} holds "${e.text.match(/[0-9×/()[\]]/)[0]}" (write numbers as words, no symbols)`);
  }

  // 1 + 3 — manifest entries: file, size, signature, hash
  const manifest = fs.existsSync(at(MANIFEST)) ? readManifest(rd(MANIFEST)) : { files: {} };
  const byKey = new Map(entries.map((e) => [fileKey(e.slug, e.lang), e]));
  for (const [key, m] of Object.entries(manifest.files)) {
    const p = path.join(dir, key);
    if (!fs.existsSync(p)) { errs.push(`exercise-audio/${key}: in the manifest but missing on disk`); continue; }
    const st = fs.statSync(p);
    if (st.size > MAX_BYTES) errs.push(`exercise-audio/${key}: ${(st.size / 1024).toFixed(1)} KB > 400 KB`);
    const head = Buffer.alloc(3);
    const fd = fs.openSync(p, 'r'); fs.readSync(fd, head, 0, 3, 0); fs.closeSync(fd);
    const id3 = head[0] === 0x49 && head[1] === 0x44 && head[2] === 0x33;
    const frame = head[0] === 0xff && (head[1] & 0xe0) === 0xe0;
    if (!id3 && !frame) errs.push(`exercise-audio/${key}: not an MP3 (no ID3 tag or frame sync)`);
    const want = byKey.get(key);
    if (!want) errs.push(`exercise-audio/${key}: no script in ${SRC} any more`);
    else if (m.sha256 !== want.hash) errs.push(`exercise-audio/${key}: stale — script, voice or model changed since it was generated; rerun generate-exercise-voice.mjs`);
  }

  // 2 — no orphans
  const onDisk = new Set();
  if (fs.existsSync(dir)) {
    for (const d of fs.readdirSync(dir)) {
      const full = path.join(dir, d);
      if (d === 'manifest.json' || d === '.gitkeep') continue;
      if (!fs.statSync(full).isDirectory()) { errs.push(`exercise-audio/${d}: a loose file (only <slug>/<lang>.mp3 and manifest.json belong here)`); continue; }
      for (const f of fs.readdirSync(full)) {
        const key = `${d}/${f}`;
        if (!LANGS.some((l) => f === `${l}.mp3`)) { errs.push(`exercise-audio/${key}: unexpected file`); continue; }
        onDisk.add(key);
        if (!manifest.files[key]) errs.push(`exercise-audio/${key}: mp3 without a manifest entry`);
      }
    }
  }

  // 4 — migration and review table
  const r = render(fixture, (slug, lang) => onDisk.has(`${slug}/${lang}.mp3`));
  errs.push(...r.errs.map((e) => `${SRC}: ${e}`));
  const has = fs.existsSync(at(OUT));
  if (r.sql === null && has) errs.push(`${OUT}: exists but no mp3 is on disk — remove it or regenerate the audio`);
  else if (r.sql !== null && (!has || rd(OUT) !== r.sql)) errs.push(`${OUT}: out of step with the files on disk — run node scripts/generate-exercise-voice.mjs --migration-only (a change after 0128 is applied ships as a NEW migration)`);
  if (!fs.existsSync(at(DOC)) || rd(DOC) !== r.doc) errs.push(`${DOC}: out of step with the fixture — run node scripts/generate-exercise-voice.mjs --migration-only`);

  // 5b — the server's list of deployed clips equals the manifest
  if (!fs.existsSync(at(CLIPS_MODULE)) || rd(CLIPS_MODULE) !== clipsModule(manifest)) errs.push(`${CLIPS_MODULE}: out of step with the manifest — run node scripts/generate-exercise-voice.mjs --migration-only`);

  // 6 — headers and the service worker
  if (checkHeaders) {
    const headers = rd('packages/client-app/public/_headers');
    if ((headers.match(/^\s*Content-Security-Policy:/gm) ?? []).length !== 1) errs.push('_headers: exactly one Content-Security-Policy');
    if (!/^\/exercise-audio\/\*\n\s+Cache-Control: public, max-age=\d{6,}/m.test(headers)) errs.push('_headers: /exercise-audio/* needs a long public Cache-Control');
    const vite = rd('packages/client-app/vite.config.js');
    if (/exercise-audio/.test(vite)) errs.push('vite.config.js: the service worker must not precache the voice clips');
  }
  return errs;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const errs = scan();
  if (errs.length) { console.log(errs.join('\n')); process.exit(1); }
}
