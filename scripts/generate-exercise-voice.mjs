#!/usr/bin/env node
/**
 * Recorded coach voice (release voice 1): generate one mp3 per exercise and language from the
 * spoken scripts in scripts/fixtures/exercise-voice.json with ElevenLabs text-to-speech, keep a
 * manifest so a rerun costs nothing, and (re)write migration 0128 + the review table.
 *
 * Run by the owner, with the key in a vault file (never on the command line, never printed):
 *   JUSTFIT_VAULT_FILE=/path/to/vault.env node scripts/generate-exercise-voice.mjs --dry-run
 *   JUSTFIT_VAULT_FILE=/path/to/vault.env node scripts/generate-exercise-voice.mjs --max-credits 6000
 *
 * Flags:
 *   --dry-run            print what would be generated and the credits (characters); call nothing
 *   --max-credits N      refuse to start when the pending characters exceed N (default 5000)
 *   --only a,b           only these slugs
 *   --lang nl|en         only this language
 *   --migration-only     do not call the API: regenerate migrations/0128_exercise_voice.sql and
 *                        docs/exercise-voice.md from what is on disk
 *
 * Files: packages/client-app/public/exercise-audio/<slug>/<lang>.mp3 and manifest.json
 * ({ files: { "<slug>/<lang>.mp3": { sha256, chars } } }, sha256 of script + voice + model).
 * Migration: media_json gets {"audio": {"nl": "/exercise-audio/<slug>/nl.mp3", ...}} through
 * json_patch (images survive), only for files that exist, idempotent, with an assert (house
 * pattern of generate-exercise-photos-migration.mjs / 0127). With no file on disk there is no 0128.
 * scripts/voice1.scan.mjs (smoke) fails when fixture, manifest, files and migration disagree.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { baselineDb } from './generate-exercise-photos-migration.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
export const SRC = 'scripts/fixtures/exercise-voice.json';
export const OUT = 'migrations/0128_exercise_voice.sql';
export const DOC = 'docs/exercise-voice.md';
export const AUDIO_DIR = 'packages/client-app/public/exercise-audio';
export const MANIFEST = `${AUDIO_DIR}/manifest.json`;
export const LANGS = ['nl', 'en'];
export const MAX_BYTES = 400 * 1024;
const STAMP = 1795305600000;   // 2026-11-21, fixed so a regeneration is byte-identical (as 0127)
const API = 'https://api.elevenlabs.io/v1/text-to-speech';
const rd = (f) => readFileSync(path.join(ROOT, f), 'utf8');

export const audioPath = (slug, lang) => `/exercise-audio/${slug}/${lang}.mp3`;
export const fileKey = (slug, lang) => `${slug}/${lang}.mp3`;

// ── Pure parts (unit-tested) ─────────────────────────────────────────────────

/** sha256 of script + voice + model: any of the three changing makes the file stale. */
export function entryHash(text, voiceId, model) {
  return createHash('sha256').update([text, voiceId, model].join('\u0000')).digest('hex');
}

/**
 * The value of ELEVENLABS_API_KEY from the text of a vault file, or null. Tolerates `export `,
 * spaces around `=`, single or double quotes, CRLF, a trailing ` # comment` on an unquoted
 * value; ignores commented-out lines and other keys that merely contain the name. The last
 * assignment wins (as a shell would).
 */
export function parseKeyLine(text) {
  let found = null;
  for (const raw of String(text ?? '').replace(/^﻿/, '').split(/\r\n|\n|\r/)) {
    const m = raw.match(/^\s*(?:export\s+)?ELEVENLABS_API_KEY\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    let v = m[1];
    const q = v.match(/^(["'])(.*?)\1(?:\s+#.*)?$/);
    if (q) v = q[2];
    else v = v.replace(/\s+#.*$/, '');
    v = v.trim();
    if (v) found = v;
  }
  return found;
}

export function readManifest(fileText) {
  try {
    const m = JSON.parse(fileText);
    return m && typeof m.files === 'object' && m.files && !Array.isArray(m.files) ? m : { files: {} };
  } catch { return { files: {} }; }
}

/** Every slug × language of the fixture, in fixture order (slug), nl before en. */
export function allEntries(fixture) {
  const out = [];
  for (const [slug, e] of Object.entries(fixture.exercises ?? {})) {
    for (const lang of LANGS) {
      if (typeof e?.[lang] !== 'string') continue;
      const voice = fixture.voices?.[lang] ?? {};
      out.push({ slug, lang, text: e[lang], chars: e[lang].length, voice_id: voice.voice_id, model: fixture.model, hash: entryHash(e[lang], voice.voice_id, fixture.model) });
    }
  }
  return out;
}

/**
 * What must be generated: entries (filtered by only / lang) whose mp3 is missing or whose
 * manifest hash differs. `exists(key)` says whether the mp3 is on disk.
 */
export function selectPending(fixture, manifest, exists, { only, lang } = {}) {
  const slugs = only ? new Set(only) : null;
  return allEntries(fixture).filter((e) => {
    if (slugs && !slugs.has(e.slug)) return false;
    if (lang && e.lang !== lang) return false;
    const key = fileKey(e.slug, e.lang);
    return !exists(key) || manifest.files?.[key]?.sha256 !== e.hash;
  });
}

export const sumCredits = (entries) => entries.reduce((n, e) => n + e.chars, 0);

export function parseArgs(argv) {
  const o = { dryRun: false, maxCredits: 5000, only: null, lang: null, migrationOnly: false, errors: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') o.dryRun = true;
    else if (a === '--migration-only') o.migrationOnly = true;
    else if (a === '--max-credits') {
      const n = Number(argv[++i]);
      if (!Number.isInteger(n) || n < 0) o.errors.push('--max-credits needs a whole number');
      else o.maxCredits = n;
    } else if (a === '--only') {
      const v = argv[++i];
      if (!v) o.errors.push('--only needs a comma-separated list of slugs');
      else o.only = v.split(',').map((s) => s.trim()).filter(Boolean);
    } else if (a === '--lang') {
      const v = argv[++i];
      if (!LANGS.includes(v)) o.errors.push('--lang must be nl or en');
      else o.lang = v;
    } else o.errors.push(`unknown argument ${a}${/key/i.test(a) ? ' (the key is never passed on the command line)' : ''}`);
  }
  return o;
}

/**
 * { sql, doc, errs, rows }. `has(slug, lang)` says whether the mp3 exists on disk; sql is null
 * when no file exists (there is nothing to migrate). The doc is built from the fixture alone.
 */
export function render(fixture, has, db = baselineDb()) {
  const errs = [];
  const active = new Map(db.prepare('SELECT slug, name, name_nl FROM exercises WHERE is_active = 1 AND gym_id IS NULL').all().map((r) => [r.slug, r]));
  const rows = [];
  for (const [slug, e] of Object.entries(fixture.exercises ?? {})) {
    if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) errs.push(`${slug}: not a plain slug`);
    else if (!active.has(slug)) errs.push(`${slug}: not an active global row in the baseline`);
    const langs = LANGS.filter((l) => typeof e?.[l] === 'string' && has(slug, l));
    if (langs.length && active.has(slug)) rows.push({ slug, langs });
  }

  const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
  const patch = ({ slug, langs }) => JSON.stringify({ audio: Object.fromEntries(langs.map((l) => [l, audioPath(slug, l)])) });
  const update = (r) => `UPDATE exercises SET media_json = json_patch(CASE WHEN json_valid(media_json) THEN media_json ELSE '{}' END, ${q(patch(r))}), updated_at_ms = ${STAMP} WHERE slug = ${q(r.slug)} AND gym_id IS NULL AND is_active = 1;`;
  let sql = null;
  if (rows.length) {
    const counts = LANGS.map((l) => [l, rows.filter((r) => r.langs.includes(l))]).filter(([, rs]) => rs.length);
    const check = counts.map(([l, rs]) => `  AND (SELECT COUNT(*) FROM exercises x WHERE x.gym_id IS NULL AND x.is_active = 1 AND x.slug IN (${rs.map((r) => q(r.slug)).join(', ')}) AND json_valid(x.media_json) AND json_extract(x.media_json, '$.audio.${l}') = '/exercise-audio/' || x.slug || '/${l}.mp3') = ${rs.length}`).join('\n');
    sql = `-- 0128 — recorded coach voice (an mp3 per exercise and language) for ${rows.length} exercises.
--
-- GENERATED by scripts/generate-exercise-voice.mjs from scripts/fixtures/exercise-voice.json and
-- the files in packages/client-app/public/exercise-audio; the review table docs/exercise-voice.md
-- is built from the same JSON. Do not hand-edit: change the JSON, regenerate the audio and ship the
-- change as a NEW migration (this one is applied history once applied).
--
-- Release voice 1. The clips are served from this app at /exercise-audio/<slug>/<lang>.mp3 — no
-- third-party origin. Storage: media_json = {..., "audio": {"nl": path, "en": path}}, merged with
-- json_patch into the row's existing media_json (images survive), only for files that exist; a
-- second run changes nothing. Written: ${counts.map(([l, rs]) => `${l} ${rs.length}`).join(', ')}.
--
-- The assert at the end fails the whole file unless every listed row ends with its paths.
${rows.map(update).join('\n')}

CREATE TABLE _0128_assert (ok INTEGER NOT NULL CHECK (ok = 1)) STRICT;
INSERT INTO _0128_assert (ok) SELECT CASE WHEN 1 = 1
${check}
  THEN 1 ELSE 0 END;
DROP TABLE _0128_assert;
`;
  }

  const cell = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
  const entries = allEntries(fixture);
  const total = (l) => entries.filter((e) => e.lang === l).reduce((n, e) => n + e.chars, 0);
  const doc = [
    '# Exercise voice — review table',
    '',
    `GENERATED by \`scripts/generate-exercise-voice.mjs\` from \`${SRC}\` (migration \`${OUT}\`, written once the audio exists).`,
    'Corrections: edit the JSON and regenerate; never edit this file. Model: `' + fixture.model + '`. Voices: ' + LANGS.map((l) => `${l} = ${fixture.voices?.[l]?.name ?? '?'}`).join(', ') + '.',
    '',
    `Credits (characters) for the whole pilot: nl ${total('nl')}, en ${total('en')}.`,
    '',
    '| Exercise | Language | Characters | Script |',
    '|---|---|---|---|',
    ...Object.entries(fixture.exercises ?? {}).flatMap(([slug, e]) => LANGS.filter((l) => typeof e?.[l] === 'string')
      .map((l) => `| ${cell(active.get(slug)?.name ?? slug)} (\`${slug}\`) | ${l} | ${e[l].length} | ${cell(e[l])} |`)),
    '',
  ].join('\n');
  return { sql, doc, errs, rows };
}

// ── The run ──────────────────────────────────────────────────────────────────

const isMp3 = (b) => b.length > 3 && ((b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33) || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0));

/**
 * deps: { fetch, root, log, env, readFile, now } — all injectable so tests run with a fake
 * fetch and a temp directory. Returns an exit code.
 */
export async function run(argv, deps = {}) {
  const root = deps.root ?? ROOT;
  const log = deps.log ?? ((s) => console.log(s));
  const err = deps.err ?? ((s) => console.error(s));
  const env = deps.env ?? process.env;
  const doFetch = deps.fetch ?? globalThis.fetch;
  const at = (f) => path.join(root, f);
  const o = parseArgs(argv);
  if (o.errors.length) { err(o.errors.join('\n')); return 2; }
  const fixture = JSON.parse(readFileSync(at(SRC), 'utf8'));
  const exists = (key) => existsSync(at(`${AUDIO_DIR}/${key}`));
  const mpath = at(MANIFEST);
  const manifest = existsSync(mpath) ? readManifest(readFileSync(mpath, 'utf8')) : { files: {} };

  if (!o.migrationOnly) {
    const pending = selectPending(fixture, manifest, exists, { only: o.only, lang: o.lang });
    const credits = sumCredits(pending);
    const unknown = (o.only ?? []).filter((s) => !fixture.exercises?.[s]);
    if (unknown.length) { err(`--only: not in ${SRC}: ${unknown.join(', ')}`); return 2; }
    const tbd = [...new Set(pending.filter((e) => !e.voice_id || e.voice_id === 'TBD').map((e) => e.lang))];
    log(`${pending.length} file(s) to generate, ${credits} characters (credits)${LANGS.map((l) => ` · ${l} ${sumCredits(pending.filter((e) => e.lang === l))}`).join('')}`);
    for (const e of pending) log(`  ${fileKey(e.slug, e.lang)}  ${e.chars} chars`);
    if (tbd.length) { err(`voice_id for ${tbd.join(', ')} is still TBD in ${SRC}: set it, or run with --lang for the other language`); if (!o.dryRun) return 2; }
    if (o.dryRun) { log('dry run: nothing was called, nothing was written'); return 0; }
    if (credits > o.maxCredits) { err(`refusing to start: ${credits} characters pending exceeds --max-credits ${o.maxCredits}`); return 2; }

    if (pending.length) {
      const vault = env.JUSTFIT_VAULT_FILE;
      if (!vault) { err('JUSTFIT_VAULT_FILE is not set: point it at the vault file that holds the line ELEVENLABS_API_KEY=<value>'); return 2; }
      let text;
      try { text = (deps.readFile ?? ((f) => readFileSync(f, 'utf8')))(vault); } catch { err(`cannot read the file named in JUSTFIT_VAULT_FILE`); return 2; }
      const key = parseKeyLine(text);
      if (!key) { err('no ELEVENLABS_API_KEY=<value> line in the vault file'); return 2; }

      let used = 0;
      for (const e of pending) {
        const res = await doFetch(`${API}/${encodeURIComponent(e.voice_id)}?output_format=mp3_44100_64`, {
          method: 'POST',
          headers: { 'xi-api-key': key, 'content-type': 'application/json', accept: 'audio/mpeg' },
          body: JSON.stringify({ text: e.text, model_id: e.model, language_code: e.lang }),
        });
        if (!res.ok) {
          let detail = ''; try { detail = (await res.text()).slice(0, 200).split(key).join('[key]'); } catch { /* ignore */ }
          err(`${fileKey(e.slug, e.lang)}: ElevenLabs answered ${res.status} ${detail}`.trim());
          err(`stopped after ${used} characters; the manifest keeps what was done, rerun to continue`);
          return 1;
        }
        const buf = Buffer.from(await res.arrayBuffer());
        if (!isMp3(buf) || buf.length > MAX_BYTES) { err(`${fileKey(e.slug, e.lang)}: the answer is not an mp3 of at most ${MAX_BYTES / 1024} KB (${buf.length} bytes); not written`); return 1; }
        const target = at(`${AUDIO_DIR}/${fileKey(e.slug, e.lang)}`);
        mkdirSync(path.dirname(target), { recursive: true });
        writeFileSync(target, buf);
        manifest.files[fileKey(e.slug, e.lang)] = { sha256: e.hash, chars: e.chars };
        const sorted = Object.fromEntries(Object.entries(manifest.files).sort(([a], [b]) => a.localeCompare(b)));
        writeFileSync(mpath, JSON.stringify({ files: sorted }, null, 2) + '\n');
        used += e.chars;
        log(`  ${fileKey(e.slug, e.lang)}: ${e.chars} credits, ${buf.length} bytes`);
      }
      log(`total credits used: ${used}`);
    }
  }

  const r = render(fixture, exists, deps.db);
  if (r.errs.length) { err(r.errs.join('\n')); return 1; }
  writeFileSync(at(DOC), r.doc);
  if (r.sql) { writeFileSync(at(OUT), r.sql); log(`wrote ${OUT} (${r.rows.length} UPDATE statements) and ${DOC}`); }
  else {
    if (existsSync(at(OUT))) unlinkSync(at(OUT));
    log(`no mp3 on disk: no ${OUT}; wrote ${DOC}`);
  }
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(await run(process.argv.slice(2)));
}
