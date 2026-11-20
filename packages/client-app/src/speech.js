// Media 1 — read an exercise aloud with the device's own voice (window.speechSynthesis).
//
// Free, offline, no third-party origin, nothing leaves the phone. Pure parts (tested in
// tests/speech.test.js): buildSpokenScript() turns a plan step into a coach script of
// { text, lang } parts; rankVoices() / pickVoice() choose the best installed voice for a
// language; planUtterances() splits the script per sentence and assigns voices. The thin
// browser layer below queues one short utterance at a time, because iOS Safari stalls on long
// utterances and Chrome stops after ~15 s of one; and it never reads English text with a
// Dutch voice — a part whose language has no voice installed is left out.
//
// This is not the screen-reader channel: announce.js / Announcer.jsx keep their live regions,
// and timer sounds are untouched. Speech is only started by the user (the button) or by the
// opt-in "Oefening automatisch voorlezen" setting (readAloudPref.js).

export const RATE = 0.95;
const LANG_TAG = { nl: "nl-NL", en: "en-GB" };

// ── Voices ──────────────────────────────────────────────────────────────────
const GOOD = /(premium|enhanced|natural|neural)/i;   // Apple's downloaded voices, Microsoft's neural ones
const BRAND = /(google|siri)/i;
const POOR = /(compact|espeak|robot|novelty|whisper|bad news|bells|boing|bubbles|cellos|jester|organ|superstar|trinoids|zarvox)/i;

function langScore(voiceLang, lang) {
  const tag = String(voiceLang ?? "").replace("_", "-").toLowerCase();
  if (lang === "nl") {
    if (tag === "nl-nl") return 30;
    if (tag.startsWith("nl")) return 20;   // Flemish beats no Dutch at all
    return -1;
  }
  if (tag === "en-gb") return 30;
  if (tag === "en-us") return 28;
  if (tag.startsWith("en")) return 20;
  return -1;
}

/** Installed voices that speak `lang` ('nl' | 'en'), best first. */
export function rankVoices(voices, lang) {
  return (voices ?? [])
    .map((v, i) => {
      const l = langScore(v?.lang, lang);
      if (l < 0) return null;
      const name = String(v?.name ?? "");
      const score = l + (GOOD.test(name) ? 40 : 0) + (BRAND.test(name) ? 25 : 0) - (POOR.test(name) ? 50 : 0) + (v?.default ? 2 : 0);
      return { v, score, i };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .map((x) => x.v);
}

export function pickVoice(voices, lang) {
  return rankVoices(voices, lang)[0] ?? null;
}

// ── The script ──────────────────────────────────────────────────────────────
const W = {
  nl: {
    sets: (n) => (n === 1 ? "1 set" : `${n} sets`),
    of: "van",
    reps: (n) => (n === 1 ? "1 herhaling" : `${n} herhalingen`),
    sec: (n) => (n === 1 ? "1 seconde" : `${n} seconden`),
    min: (n) => (n === 1 ? "1 minuut" : `${n} minuten`),
    and: "en",
    maxReps: (d) => `Zoveel herhalingen als je kunt in ${d}.`,
    tip: "Tip:",
    deg: " graden", to: " tot ", about: "ongeveer ", times: " keer ",
  },
  en: {
    sets: (n) => (n === 1 ? "1 set" : `${n} sets`),
    of: "of",
    reps: (n) => (n === 1 ? "1 rep" : `${n} reps`),
    sec: (n) => (n === 1 ? "1 second" : `${n} seconds`),
    min: (n) => (n === 1 ? "1 minute" : `${n} minutes`),
    and: "and",
    maxReps: (d) => `As many reps as you can in ${d}.`,
    tip: "Tip:",
    deg: " degrees", to: " to ", about: "about ", times: " times ",
  },
};

export function durationWords(sec, lang) {
  const w = W[lang] ?? W.en;
  const s = Math.max(0, Math.round(Number(sec) || 0));
  if (s < 60) return w.sec(s);
  const m = Math.floor(s / 60), r = s % 60;
  return r ? `${w.min(m)} ${w.and} ${w.sec(r)}` : w.min(m);
}

/** "3 sets van 12 herhalingen." / "3 sets of 30 seconds." — null when the step prescribes nothing. */
export function prescriptionWords(step, lang) {
  const w = W[lang] ?? W.en;
  if (step?.max_effort) return w.maxReps(durationWords(step.measure_window_sec ?? 120, lang));
  const sets = Number(step?.sets) || 0;
  const reps = Number(step?.target_reps) || 0;
  const dur = Number(step?.target_duration_sec) || 0;
  const what = reps ? w.reps(reps) : dur ? durationWords(dur, lang) : null;
  if (!what) return null;
  return sets > 0 ? `${w.sets(sets)} ${w.of} ${what}.` : `${what[0].toUpperCase()}${what.slice(1)}.`;
}

const LEVEL_PREFIX = /^(beginner|intermediate|advanced|beginners?|gevorderd|halfgevorderd)\s*:/i;
const PICTO = /[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu;

/** One instruction line → one spoken sentence: no numbering, no emoji, symbols in words, a full stop. */
export function speakable(text, lang) {
  const w = W[lang] ?? W.en;
  let s = String(text ?? "").replace(PICTO, " ");
  s = s.replace(/^\s*(?:(?:step|stap)\s*\d+\s*[:.)-]?|\d+\s*[.)]|[-•*])\s*/i, "");
  s = s.replace(/(\d)\s*[–-]\s*(\d)/g, `$1${w.to}$2`)
    .replace(/(\d)\s*°/g, `$1${w.deg}`)
    .replace(/~\s*(\d)/g, `${w.about}$1`)
    .replace(/(\d)\s*[×x]\s*(?=\d)/g, `$1${w.times}`)
    .replace(/[→←↑↓⇒]/g, ", ")
    .replace(/\s*\/\s*/g, " / ")
    .replace(/\s+/g, " ")
    .trim();
  if (!s) return "";
  if (!/[.!?…]$/.test(s)) s += ".";
  return s;
}

function parseInstructions(raw) {
  try {
    const j = raw ? (typeof raw === "string" ? JSON.parse(raw) : raw) : null;
    return j && typeof j === "object" && !Array.isArray(j) ? j : null;
  } catch {
    return null;
  }
}

const strings = (a) => (Array.isArray(a) ? a.filter((x) => typeof x === "string" && x.trim()) : []);

/**
 * A plan step → the coach script, as parts { text, lang } in speaking order: the name, the
 * prescription in words, a body-mode note when one applies, the steps as flowing sentences
 * (no "step 1 / 2"), then the general tips. Dutch when the app is Dutch and the row has Dutch
 * steps (migration 0126); a Dutch app with English-only instructions gets the Dutch name and
 * prescription in Dutch and the English steps as a separate English part. Level-specific cues
 * ("Beginner: …") and advanced 💡💡 cues are left out, as on screen for a non-advanced user.
 *
 * opts: { bodyMode: 'pregnant' | 'postnatal' | …, level: 'beginner' | 'intermediate' | 'advanced' }
 */
export function buildSpokenScript(step, lang, opts = {}) {
  if (!step) return [];
  const ui = lang === "en" ? "en" : "nl";
  const instr = parseInstructions(step.instructions_json) ?? {};
  const en = { steps: strings(instr.steps), cues: strings(instr.cues) };
  const hasNl = ui === "nl" && Array.isArray(instr.steps_nl) && strings(instr.steps_nl).length === en.steps.length && en.steps.length > 0;
  const body = hasNl
    ? { lang: "nl", steps: strings(instr.steps_nl), cues: Array.isArray(instr.cues_nl) && instr.cues_nl.length === (instr.cues ?? []).length ? strings(instr.cues_nl) : [] }
    : { lang: "en", ...en };

  const noteKey = opts.bodyMode === "pregnant" ? "pregnancy_note" : opts.bodyMode === "postnatal" ? "postnatal_note" : null;
  const note = noteKey
    ? (body.lang === "nl" && typeof instr[`${noteKey}_nl`] === "string" ? { text: instr[`${noteKey}_nl`], lang: "nl" }
      : typeof instr[noteKey] === "string" ? { text: instr[noteKey], lang: "en" } : null)
    : null;

  const nameNl = typeof step.name_nl === "string" && step.name_nl.trim() ? step.name_nl.trim() : null;
  const nameEn = typeof step.name === "string" && step.name.trim() ? step.name.trim() : null;
  const head = [];   // name + prescription, in the UI language where possible
  const tail = [];   // instructions, in the language they are written in
  const add = (list, text, l) => { const s = speakable(text, l); if (s) list.push({ text: s, lang: l }); };

  if (ui === "nl") {
    if (nameNl) add(head, nameNl, "nl"); else if (nameEn) add(head, nameEn, "en");
  } else if (nameEn) add(head, nameEn, "en");
  const presc = prescriptionWords(step, ui);
  if (presc) head.push({ text: presc, lang: ui });

  if (note) add(tail, note.text, note.lang);
  for (const s of body.steps) add(tail, s, body.lang);
  const tips = body.cues.filter((c) => {
    const bulbs = (c.match(/^(?:💡\s*)+/u)?.[0].match(/💡/gu) ?? []).length;
    const clean = c.replace(/^(?:💡\s*)+/u, "").trim();
    return !LEVEL_PREFIX.test(clean) && (bulbs < 2 || opts.level === "advanced");
  });
  tips.forEach((c, i) => {
    const s = speakable(c, body.lang);
    if (s) tail.push({ text: i === 0 ? `${W[body.lang].tip} ${s}` : s, lang: body.lang });
  });

  // Merge neighbours that share a language: fewer voice switches, same sentences.
  const out = [];
  for (const p of [...head, ...tail]) {
    const last = out[out.length - 1];
    if (last && last.lang === p.lang) last.text = `${last.text} ${p.text}`;
    else out.push({ ...p });
  }
  return out;
}

/** Split a part into sentences short enough for iOS (long ones break at ; , : as well). */
export function splitSentences(text, max = 180) {
  const out = [];
  for (const sentence of String(text ?? "").split(/(?<=[.!?…])\s+/)) {
    let s = sentence.trim();
    while (s.length > max) {
      const cut = Math.max(s.lastIndexOf("; ", max), s.lastIndexOf(", ", max), s.lastIndexOf(": ", max));
      const at = cut > 40 ? cut + 1 : s.lastIndexOf(" ", max) > 40 ? s.lastIndexOf(" ", max) : max;
      out.push(s.slice(0, at).trim());
      s = s.slice(at).trim();
    }
    if (s) out.push(s);
  }
  return out;
}

/**
 * Script parts → the utterances to queue: one per sentence, each with its language tag and the
 * best voice. When the voice list is known and has no voice for a part's language, that part
 * is dropped (an English part is never read by a Dutch voice). With no voice list yet
 * (voiceschanged not fired) the tag alone goes along and the browser picks.
 */
export function planUtterances(parts, voices) {
  const known = Array.isArray(voices) && voices.length > 0;
  const out = [];
  for (const p of parts ?? []) {
    const voice = known ? pickVoice(voices, p.lang) : null;
    if (known && !voice) continue;
    for (const text of splitSentences(p.text)) out.push({ text, lang: voice?.lang ?? LANG_TAG[p.lang] ?? "en-GB", voice });
  }
  return out;
}

// ── The browser layer ────────────────────────────────────────────────────────
const synth = () => (typeof window !== "undefined" ? window.speechSynthesis : undefined);

export function speechSupported() {
  return typeof window !== "undefined" && !!window.speechSynthesis && typeof window.SpeechSynthesisUtterance === "function";
}

let _voices = [];
let _listening = false;
function voices() {
  const s = synth();
  if (!s) return [];
  const now = s.getVoices?.() ?? [];
  if (now.length) _voices = now;
  if (!_listening && s.addEventListener) {
    _listening = true;   // Chrome and Android fill the list late, after voiceschanged
    s.addEventListener("voiceschanged", () => { _voices = s.getVoices?.() ?? _voices; });
  }
  return _voices;
}

let _run = 0;
let _primed = false;

/** iOS only lets speech start inside a user gesture; call from a tap before auto-reading. */
export function primeSpeech() {
  if (_primed || !speechSupported()) return;
  _primed = true;
  try { voices(); synth().speak(new window.SpeechSynthesisUtterance("")); } catch { /* ignore */ }
}

export function stopSpeaking() {
  _run += 1;
  try { synth()?.cancel(); } catch { /* ignore */ }
}

/** Queue the script, one sentence after the other; onEnd fires once when it finishes or is stopped by another speak. */
export function speakScript(parts, { onEnd } = {}) {
  if (!speechSupported()) return false;
  stopSpeaking();
  const run = _run;
  const queue = planUtterances(parts, voices());
  if (!queue.length) { onEnd?.(); return false; }
  _primed = true;
  let done = false;
  const finish = () => { if (!done) { done = true; onEnd?.(); } };
  const next = () => {
    if (run !== _run) return finish();
    const item = queue.shift();
    if (!item) return finish();
    const u = new window.SpeechSynthesisUtterance(item.text);
    u.lang = item.lang;
    if (item.voice) u.voice = item.voice;
    u.rate = RATE;
    u.onend = next;
    u.onerror = next;
    synth().speak(u);
  };
  next();
  return true;
}

export function speak(text, lang) {
  return speakScript([{ text, lang: lang === "en" ? "en" : "nl" }]);
}
