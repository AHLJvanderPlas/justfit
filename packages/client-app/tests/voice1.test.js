// Voice 1 — the generator's pure parts and its run with a fake fetch (no network), the 0128
// builder on the baseline, and the smoke scan on temp directories (each rule broken once).
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Buffer } from 'node:buffer';
import {
  entryHash, parseKeyLine, readManifest, allEntries, selectPending, sumCredits, parseArgs, render, run,
  SRC, OUT, DOC, AUDIO_DIR, MANIFEST, audioPath,
} from '../../../scripts/generate-exercise-voice.mjs';
import { scan } from '../../../scripts/voice1.scan.mjs';
import { baselineDb } from '../../../scripts/generate-exercise-photos-migration.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const real = JSON.parse(readFileSync(path.join(REPO, SRC), 'utf8'));
const pilot = (slugs = ['push-up', 'squat']) => structuredClone({
  ...real,
  voices: { nl: { voice_id: 'NLVOICE', name: 'N' }, en: { voice_id: 'ENVOICE', name: 'E' } },
  exercises: Object.fromEntries(slugs.map((s) => [s, real.exercises[s]])),
});
const MP3 = Buffer.concat([Buffer.from([0x49, 0x44, 0x33, 4, 0, 0, 0, 0, 0, 0]), Buffer.alloc(200, 1)]);

describe('hashing and pending selection', () => {
  const fx = pilot();
  it('the hash changes with script, voice and model — and with nothing else', () => {
    const h = entryHash('a', 'v', 'm');
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(entryHash('a', 'v', 'm')).toBe(h);
    expect(entryHash('b', 'v', 'm')).not.toBe(h);
    expect(entryHash('a', 'w', 'm')).not.toBe(h);
    expect(entryHash('a', 'v', 'n')).not.toBe(h);
    expect(entryHash('a', 'vm', '')).not.toBe(entryHash('av', 'm', ''));
  });
  const manifestFor = (entries) => ({ files: Object.fromEntries(entries.map((e) => [`${e.slug}/${e.lang}.mp3`, { sha256: e.hash, chars: e.chars }])) });
  it('everything is pending on an empty disk; nothing when files and hashes match', () => {
    const all = allEntries(fx);
    expect(all).toHaveLength(4);
    expect(selectPending(fx, { files: {} }, () => false)).toHaveLength(4);
    expect(selectPending(fx, manifestFor(all), () => true)).toHaveLength(0);
  });
  it('a missing file, a changed script, a changed voice or model and a manifest gap are pending', () => {
    const all = allEntries(fx);
    const m = manifestFor(all);
    expect(selectPending(fx, m, (k) => k !== 'squat/nl.mp3').map((e) => `${e.slug}/${e.lang}`)).toEqual(['squat/nl']);
    const edited = { ...fx, exercises: { ...fx.exercises, 'push-up': { ...fx.exercises['push-up'], en: fx.exercises['push-up'].en + ' Go.' } } };
    expect(selectPending(edited, m, () => true).map((e) => `${e.slug}/${e.lang}`)).toEqual(['push-up/en']);
    expect(selectPending({ ...fx, model: 'other' }, m, () => true)).toHaveLength(4);
    expect(selectPending({ ...fx, voices: { ...fx.voices, nl: { voice_id: 'X', name: 'x' } } }, m, () => true)).toHaveLength(2);
    expect(selectPending(fx, { files: {} }, () => true)).toHaveLength(4);
  });
  it('only and lang narrow the selection; credits are the sum of characters', () => {
    const none = { files: {} };
    expect(selectPending(fx, none, () => false, { only: ['squat'] })).toHaveLength(2);
    expect(selectPending(fx, none, () => false, { lang: 'en' }).every((e) => e.lang === 'en')).toBe(true);
    const p = selectPending(fx, none, () => false, { only: ['squat'], lang: 'nl' });
    expect(p).toHaveLength(1);
    expect(sumCredits(p)).toBe(fx.exercises.squat.nl.length);
    expect(sumCredits(selectPending(fx, none, () => false))).toBe(allEntries(fx).reduce((n, e) => n + e.text.length, 0));
    expect(sumCredits([])).toBe(0);
  });
  it('a corrupt manifest reads as empty', () => {
    expect(readManifest('{broken')).toEqual({ files: {} });
    expect(readManifest('[]')).toEqual({ files: {} });
    expect(readManifest('{"files": 3}')).toEqual({ files: {} });
  });
});

describe('parseKeyLine', () => {
  it.each([
    ['ELEVENLABS_API_KEY=abc123', 'abc123'],
    ['export ELEVENLABS_API_KEY=abc123', 'abc123'],
    ['  ELEVENLABS_API_KEY = abc123  ', 'abc123'],
    ['ELEVENLABS_API_KEY="abc 123"', 'abc 123'],
    ["ELEVENLABS_API_KEY='abc123'", 'abc123'],
    ['ELEVENLABS_API_KEY=abc123 # my key', 'abc123'],
    ['ELEVENLABS_API_KEY="abc123" # my key', 'abc123'],
    ['OTHER=1\r\nELEVENLABS_API_KEY=abc123\r\nMORE=2\r\n', 'abc123'],
    ['﻿ELEVENLABS_API_KEY=abc123', 'abc123'],
    ['# ELEVENLABS_API_KEY=old\nELEVENLABS_API_KEY=new', 'new'],
    ['ELEVENLABS_API_KEY=first\nELEVENLABS_API_KEY=second', 'second'],
    ['ELEVENLABS_API_KEY=sk_a=b==', 'sk_a=b=='],
  ])('%j → %j', (text, want) => expect(parseKeyLine(text)).toBe(want));
  it.each([
    [''], [null], ['# ELEVENLABS_API_KEY=abc'], ['ELEVENLABS_API_KEY='], ['ELEVENLABS_API_KEY=""'],
    ['MY_ELEVENLABS_API_KEY=abc'], ['ELEVENLABS_API_KEY_OLD=abc'], ['ELEVENLABS=abc'],
  ])('%j → null', (text) => expect(parseKeyLine(text)).toBeNull());
});

describe('parseArgs', () => {
  it('defaults and flags', () => {
    expect(parseArgs([])).toMatchObject({ dryRun: false, maxCredits: 5000, only: null, lang: null, migrationOnly: false, errors: [] });
    expect(parseArgs(['--dry-run', '--max-credits', '9000', '--only', 'a, b', '--lang', 'nl', '--migration-only']))
      .toMatchObject({ dryRun: true, maxCredits: 9000, only: ['a', 'b'], lang: 'nl', migrationOnly: true, errors: [] });
  });
  it('refuses nonsense, and a key on the command line', () => {
    expect(parseArgs(['--lang', 'de']).errors).toHaveLength(1);
    expect(parseArgs(['--max-credits', 'many']).errors).toHaveLength(1);
    expect(parseArgs(['--only']).errors).toHaveLength(1);
    expect(parseArgs(['--api-key', 'sk_x']).errors.join()).toMatch(/never passed on the command line/);
  });
});

describe('migration 0128 builder', () => {
  const fx = pilot(['push-up', 'plank']);
  const withBoth = (slug, lang) => ['push-up/nl', 'push-up/en', 'plank/en'].includes(`${slug}/${lang}`);
  it('no file on disk → no SQL; the review table still lists every script', () => {
    const r = render(fx, () => false);
    expect(r.sql).toBeNull();
    expect(r.errs).toEqual([]);
    expect(r.doc).toContain('Opdrukken. Begin');
    expect(r.doc).toContain('| Push-up (`push-up`) | en | 277 |');
  });
  it('writes only what exists, runs twice with the same result, keeps images, passes its assert', () => {
    const r = render(fx, withBoth);
    expect(r.sql).toContain(`'{"audio":{"nl":"/exercise-audio/push-up/nl.mp3","en":"/exercise-audio/push-up/en.mp3"}}'`);
    expect(r.sql).toContain(`'{"audio":{"en":"/exercise-audio/plank/en.mp3"}}'`);
    expect(r.sql).not.toContain('plank/nl.mp3');
    const db = baselineDb();   // the baseline carries 0127 already; applying it again must be harmless
    db.exec(readFileSync(path.join(REPO, 'migrations/0127_exercise_photos.sql'), 'utf8'));
    db.exec(r.sql);
    const snap = () => JSON.stringify(db.prepare("SELECT slug, media_json FROM exercises WHERE json_extract(media_json,'$.audio') IS NOT NULL ORDER BY slug").all());
    const first = snap();
    db.exec(r.sql);
    expect(snap()).toBe(first);
    const pu = JSON.parse(db.prepare("SELECT media_json FROM exercises WHERE slug='push-up' AND gym_id IS NULL").get().media_json);
    expect(pu.images).toEqual(['/exercise-media/push-up/0.jpg', '/exercise-media/push-up/1.jpg']);
    expect(pu.audio).toEqual({ nl: audioPath('push-up', 'nl'), en: audioPath('push-up', 'en') });
    expect(JSON.parse(db.prepare("SELECT media_json FROM exercises WHERE slug='plank' AND gym_id IS NULL").get().media_json).audio).toEqual({ en: '/exercise-audio/plank/en.mp3' });
  });
  it('the assert fails the file when a row does not end with its path', () => {
    const r = render(fx, withBoth);
    const db = baselineDb();
    const broken = r.sql.replace(/UPDATE exercises SET media_json = json_patch\([^\n]*'plank'[^\n]*\n/, '');
    expect(broken).not.toBe(r.sql);
    expect(() => db.exec(broken)).toThrow(/CHECK constraint/);
  });
  it('an unknown slug is an error', () => {
    const r = render({ ...fx, exercises: { 'no-such-exercise': fx.exercises['push-up'] } }, () => true);
    expect(r.errs.join()).toMatch(/not an active global row/);
  });
  it('a row with no media_json at all gets just the audio', () => {
    const db = baselineDb();
    db.exec("UPDATE exercises SET media_json = NULL WHERE slug = 'push-up' AND gym_id IS NULL");
    db.exec(render(fx, withBoth).sql);
    expect(JSON.parse(db.prepare("SELECT media_json FROM exercises WHERE slug='push-up' AND gym_id IS NULL").get().media_json)).toEqual({ audio: { nl: '/exercise-audio/push-up/nl.mp3', en: '/exercise-audio/push-up/en.mp3' } });
  });
});

describe('run() with a fake fetch', () => {
  let root, logs, errs;
  const key = 'sk_SECRET_KEY_VALUE';
  const setup = (fx = pilot()) => {
    mkdirSync(path.join(root, 'scripts/fixtures'), { recursive: true });
    writeFileSync(path.join(root, SRC), JSON.stringify(fx));
    mkdirSync(path.join(root, 'docs'), { recursive: true });
    mkdirSync(path.join(root, 'migrations'), { recursive: true });
  };
  const okFetch = (calls) => async (url, init) => { calls.push({ url, init }); return { ok: true, status: 200, arrayBuffer: async () => MP3, text: async () => '' }; };
  const deps = (over = {}) => ({ root, log: (s) => logs.push(s), err: (s) => errs.push(s), env: { JUSTFIT_VAULT_FILE: '/vault' }, readFile: () => `X=1\nexport ELEVENLABS_API_KEY="${key}"\n`, ...over });
  beforeEach(() => { root = mkdtempSync(path.join(tmpdir(), 'voice1-')); logs = []; errs = []; setup(); });
  afterEach(() => rmSync(root, { recursive: true, force: true }));

  it('--dry-run calls nothing, writes nothing, prints the total', async () => {
    const calls = [];
    expect(await run(['--dry-run'], deps({ fetch: okFetch(calls) }))).toBe(0);
    expect(calls).toHaveLength(0);
    expect(existsSync(path.join(root, AUDIO_DIR))).toBe(false);
    const total = allEntries(pilot()).reduce((n, e) => n + e.chars, 0);
    expect(logs[0]).toContain(`4 file(s) to generate, ${total} characters`);
  });
  it('generates, calls the right URL with the key header only, never prints the key, writes manifest + migration', async () => {
    const calls = [];
    expect(await run([], deps({ fetch: okFetch(calls), maxCredits: 0 }))).toBe(0);
    expect(calls).toHaveLength(4);
    const c = calls.find((x) => x.url.includes('/ENVOICE'));
    expect(c.url).toBe('https://api.elevenlabs.io/v1/text-to-speech/ENVOICE?output_format=mp3_44100_64');
    expect(c.init.method).toBe('POST');
    expect(c.init.headers['xi-api-key']).toBe(key);
    expect(JSON.parse(c.init.body)).toEqual({ text: expect.any(String), model_id: 'eleven_v4', language_code: expect.stringMatching(/^(en|nl)$/) });
    expect(c.url).not.toContain(key);
    expect([...logs, ...errs].join('\n')).not.toContain(key);
    expect(readFileSync(path.join(root, AUDIO_DIR, 'push-up/en.mp3'))).toEqual(MP3);
    const m = JSON.parse(readFileSync(path.join(root, MANIFEST), 'utf8'));
    expect(Object.keys(m.files)).toEqual(['push-up/en.mp3', 'push-up/nl.mp3', 'squat/en.mp3', 'squat/nl.mp3']);
    expect(m.files['push-up/nl.mp3']).toEqual({ sha256: allEntries(pilot())[0].hash, chars: pilot().exercises['push-up'].nl.length });
    expect(readFileSync(path.join(root, OUT), 'utf8')).toContain('_0128_assert');
    expect(existsSync(path.join(root, DOC))).toBe(true);
    expect(logs.join('\n')).toMatch(/total credits used: \d+/);
  });
  it('a rerun costs nothing; an edited script regenerates only that file', async () => {
    const calls = [];
    await run([], deps({ fetch: okFetch(calls) }));
    calls.length = 0;
    expect(await run([], deps({ fetch: okFetch(calls) }))).toBe(0);
    expect(calls).toHaveLength(0);
    const fx = pilot(); fx.exercises.squat.en += ' Nice.';
    writeFileSync(path.join(root, SRC), JSON.stringify(fx));
    await run([], deps({ fetch: okFetch(calls) }));
    expect(calls).toHaveLength(1);
    expect(JSON.parse(calls[0].init.body).text).toMatch(/Nice\.$/);
  });
  it('refuses to start above --max-credits (default 5000) and calls nothing', async () => {
    const calls = [];
    expect(await run(['--max-credits', '100'], deps({ fetch: okFetch(calls) }))).toBe(2);
    expect(errs.join()).toMatch(/exceeds --max-credits 100/);
    expect(calls).toHaveLength(0);
    setup({ ...pilot(), exercises: real.exercises });
    expect(await run([], deps({ fetch: okFetch(calls) }))).toBe(2);   // the whole pilot is above the 5000 default
    expect(calls).toHaveLength(0);
  });
  it('a missing env var, a missing line or an unreadable file exits with a message and calls nothing', async () => {
    const calls = [];
    expect(await run([], deps({ fetch: okFetch(calls), env: {} }))).toBe(2);
    expect(errs.join()).toMatch(/JUSTFIT_VAULT_FILE is not set/);
    expect(await run([], deps({ fetch: okFetch(calls), readFile: () => 'OTHER=1\n' }))).toBe(2);
    expect(errs.join()).toMatch(/no ELEVENLABS_API_KEY/);
    expect(await run([], deps({ fetch: okFetch(calls), readFile: () => { throw new Error('ENOENT /vault'); } }))).toBe(2);
    expect(calls).toHaveLength(0);
  });
  it('a TBD voice id is refused before any call', async () => {
    setup({ ...pilot(), voices: { nl: { voice_id: 'TBD', name: 'TBD' }, en: { voice_id: 'ENVOICE', name: 'E' } } });
    const calls = [];
    expect(await run([], deps({ fetch: okFetch(calls) }))).toBe(2);
    expect(errs.join()).toMatch(/voice_id for nl is still TBD/);
    expect(calls).toHaveLength(0);
    expect(await run(['--lang', 'en'], deps({ fetch: okFetch(calls) }))).toBe(0);
    expect(calls).toHaveLength(2);
  });
  it('an API error stops, keeps what was done, and does not leak the key', async () => {
    let n = 0;
    const f = async () => (++n === 2 ? { ok: false, status: 401, text: async () => `bad key ${key}` } : { ok: true, status: 200, arrayBuffer: async () => MP3 });
    expect(await run([], deps({ fetch: f }))).toBe(1);
    expect(errs.join('\n')).toMatch(/answered 401/);
    expect([...logs, ...errs].join('\n')).not.toContain(key);
    expect(Object.keys(JSON.parse(readFileSync(path.join(root, MANIFEST), 'utf8')).files)).toEqual(['push-up/nl.mp3']);
  });
  it('an answer that is not an mp3 is not written', async () => {
    const f = async () => ({ ok: true, status: 200, arrayBuffer: async () => Buffer.from('{"error":"x"}') });
    expect(await run([], deps({ fetch: f }))).toBe(1);
    expect(existsSync(path.join(root, AUDIO_DIR, 'push-up/nl.mp3'))).toBe(false);
  });
  it('--migration-only calls nothing and builds the SQL from what is on disk; removes a stale 0128 when nothing is left', async () => {
    const calls = [];
    await run(['--only', 'push-up', '--lang', 'en'], deps({ fetch: okFetch(calls) }));
    calls.length = 0;
    expect(await run(['--migration-only'], deps({ fetch: okFetch(calls) }))).toBe(0);
    expect(calls).toHaveLength(0);
    const sql = readFileSync(path.join(root, OUT), 'utf8');
    expect(sql).toContain('push-up/en.mp3');
    expect(sql).not.toContain('squat');
    rmSync(path.join(root, AUDIO_DIR), { recursive: true });
    await run(['--migration-only'], deps({ fetch: okFetch(calls) }));
    expect(existsSync(path.join(root, OUT))).toBe(false);
  });
});

describe('smoke scan (voice1.scan.mjs)', () => {
  let root;
  const A = (f) => path.join(root, AUDIO_DIR, f);
  const gen = async () => run([], {
    root, log: () => {}, err: () => {}, env: { JUSTFIT_VAULT_FILE: '/v' }, readFile: () => 'ELEVENLABS_API_KEY=k',
    fetch: async () => ({ ok: true, status: 200, arrayBuffer: async () => MP3 }),
  });
  const writeFx = (fx) => writeFileSync(path.join(root, SRC), JSON.stringify(fx));
  const s = () => scan({ root, checkHeaders: false });
  beforeEach(() => {
    root = mkdtempSync(path.join(tmpdir(), 'voice1scan-'));
    for (const d of ['scripts/fixtures', 'docs', 'migrations']) mkdirSync(path.join(root, d), { recursive: true });
    writeFx(pilot());
  });
  afterEach(() => rmSync(root, { recursive: true, force: true }));
  const regenDoc = () => run(['--migration-only'], { root, log: () => {}, err: () => {}, env: {} });

  it('the real repository passes today (no audio folder content, no 0128)', () => {
    expect(existsSync(path.join(REPO, OUT))).toBe(false);
    expect(readdirSync(path.join(REPO, AUDIO_DIR)).filter((f) => f !== 'manifest.json' && f !== '.gitkeep')).toEqual([]);
    expect(scan()).toEqual([]);
  });
  it('passes with an empty exercise-audio folder and an absent 0128 once the review table exists', async () => {
    await regenDoc();
    expect(s()).toEqual([]);
  });
  it('passes after a generation, and fails for each broken rule', async () => {
    await gen();
    expect(s()).toEqual([]);

    // manifest entry without a file
    const saved = readFileSync(A('squat/nl.mp3'));
    rmSync(A('squat/nl.mp3'));
    expect(s().join('\n')).toMatch(/squat\/nl\.mp3: in the manifest but missing on disk/);
    writeFileSync(A('squat/nl.mp3'), saved);
    expect(s()).toEqual([]);

    // not an mp3
    writeFileSync(A('squat/nl.mp3'), Buffer.from('<html>error</html>'));
    expect(s().join('\n')).toMatch(/squat\/nl\.mp3: not an MP3/);
    // too big
    writeFileSync(A('squat/nl.mp3'), Buffer.concat([MP3, Buffer.alloc(401 * 1024)]));
    expect(s().join('\n')).toMatch(/> 400 KB/);
    writeFileSync(A('squat/nl.mp3'), saved);
    expect(s()).toEqual([]);

    // orphan mp3 and a loose file
    mkdirSync(A('ghost'), { recursive: true });
    writeFileSync(A('ghost/nl.mp3'), MP3);
    expect(s().join('\n')).toMatch(/ghost\/nl\.mp3: mp3 without a manifest entry/);
    rmSync(A('ghost'), { recursive: true });
    writeFileSync(A('loose.mp3'), MP3);
    expect(s().join('\n')).toMatch(/loose\.mp3: a loose file/);
    rmSync(A('loose.mp3'));
    expect(s()).toEqual([]);

    // stale: the script changed after generation
    const fx = pilot(); fx.exercises['push-up'].nl += ' Rustig aan.';
    writeFx(fx);
    expect(s().join('\n')).toMatch(/push-up\/nl\.mp3: stale/);
    writeFx(pilot());
    expect(s()).toEqual([]);

    // migration out of step, and a doc out of step
    const sqlPath = path.join(root, OUT);
    const sql = readFileSync(sqlPath, 'utf8');
    writeFileSync(sqlPath, sql.replace("'squat'", "'plank'"));
    expect(s().join('\n')).toMatch(/0128_exercise_voice\.sql: out of step/);
    rmSync(sqlPath);
    expect(s().join('\n')).toMatch(/0128_exercise_voice\.sql: out of step/);
    writeFileSync(sqlPath, sql);
    expect(s()).toEqual([]);
    writeFileSync(path.join(root, DOC), 'old');
    expect(s().join('\n')).toMatch(/exercise-voice\.md: out of step/);
  });
  it('a 0128 without any mp3 fails', async () => {
    await regenDoc();
    writeFileSync(path.join(root, OUT), 'SELECT 1;');
    expect(s().join('\n')).toMatch(/exists but no mp3 is on disk/);
  });
  it('fixture scripts: length and forbidden characters', async () => {
    const base = pilot(['push-up']);
    for (const [label, text, re] of [
      ['too short', 'Opdrukken. Kort.', /is 16 characters/],
      ['too long', 'a '.repeat(201), /characters \(150 to 400\)/],
      ['a digit', base.exercises['push-up'].nl.replace('Begin', 'Begin met 3'), /holds "3"/],
      ['a times sign', base.exercises['push-up'].nl.replace('Begin', 'Begin ×'), /holds "×"/],
      ['a slash', base.exercises['push-up'].nl.replace('Begin', 'Begin /'), /holds "\/"/],
      ['a parenthesis', base.exercises['push-up'].nl.replace('Begin', 'Begin ('), /holds "\("/],
      ['a bracket', base.exercises['push-up'].nl.replace('Begin', 'Begin ]'), /holds "\]"/],
    ]) {
      writeFx({ ...base, exercises: { 'push-up': { ...base.exercises['push-up'], nl: text } } });
      await regenDoc();
      expect(s().join('\n'), label).toMatch(re);
    }
    writeFx(base);
    await regenDoc();
    expect(s()).toEqual([]);
  });
  it('the real fixture: every script passes the same rules and starts with the name', () => {
    const db = baselineDb();
    for (const [slug, e] of Object.entries(real.exercises)) {
      const r = db.prepare('SELECT name, name_nl FROM exercises WHERE slug = ? AND gym_id IS NULL').get(slug);
      expect(e.nl.startsWith(`${r.name_nl}.`), `${slug} nl starts with name_nl`).toBe(true);
      expect(e.en.toLowerCase().startsWith(`${r.name.toLowerCase()}.`), `${slug} en starts with the name`).toBe(true);
    }
    expect(Object.keys(real.exercises)).toHaveLength(10);
  });
});
