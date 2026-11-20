// Media 1 — read aloud. The pure parts of speech.js: the coach script, the voice ranking, the
// sentence split and the utterance plan (never English text in a Dutch voice).
import { describe, it, expect } from 'vitest';
import {
  buildSpokenScript, prescriptionWords, durationWords, speakable, rankVoices, pickVoice, splitSentences, planUtterances, RATE,
} from '../src/speech.js';

// Rows as in migrations/baseline/1020_seed_exercises.sql (push-up carries the 0126 Dutch keys, air-squat does not).
const PUSH_UP = {
  exercise_slug: 'push-up', name: 'Push-up', name_nl: 'Opdrukken', sets: 3, target_reps: 12,
  instructions_json: JSON.stringify({
    steps: ['Start in a high plank with hands under shoulders.', 'Brace core and keep body in a straight line.', 'Lower chest toward the floor with control.', 'Press back up to full lockout without shrugging.'],
    cues: ['Ribs down, glutes tight.', 'Elbows ~30-45 degrees from torso.', 'Neck neutral.'],
    steps_nl: ['Start in een hoge plank met je handen onder je schouders.', 'Span je core aan en houd je lichaam in een rechte lijn.', 'Laat je borst gecontroleerd naar de vloer zakken.', 'Druk terug tot gestrekte armen zonder je schouders op te trekken.'],
    cues_nl: ['Ribben omlaag, bilspieren aangespannen.', 'Ellebogen op ~30-45 graden van je romp.', 'Nek neutraal.'],
  }),
};
const AIR_SQUAT = {
  exercise_slug: 'air-squat', name: 'Air Squat', name_nl: 'Squat zonder gewicht', sets: 2, target_reps: 15,
  instructions_json: JSON.stringify({
    steps: ['Stand with feet shoulder-width apart.', 'Sit hips back and down, keeping heels grounded.', 'Reach comfortable depth with neutral spine.', 'Stand up fully, squeezing glutes at the top.'],
    cues: ['Knees track over toes.', 'Chest tall, brace core.'],
  }),
};
const PLANK = { name: 'Plank', name_nl: 'Plank', sets: 3, target_duration_sec: 30, instructions_json: null };

const text = (parts) => parts.map((p) => p.text).join(' ');

describe('buildSpokenScript — Dutch app, Dutch instructions', () => {
  const parts = buildSpokenScript(PUSH_UP, 'nl');
  it('is one Dutch part: name, prescription in words, steps, then the tips', () => {
    expect(parts).toHaveLength(1);
    expect(parts[0].lang).toBe('nl');
    expect(parts[0].text.startsWith('Opdrukken. 3 sets van 12 herhalingen. Start in een hoge plank')).toBe(true);
    expect(parts[0].text).toContain('Tip: Ribben omlaag, bilspieren aangespannen.');
  });
  it('reads no step numbers, no emoji and symbols as words', () => {
    expect(text(parts)).not.toMatch(/stap \d|step \d|💡|~/i);
    expect(text(parts)).toContain('ongeveer 30 tot 45 graden');
  });
  it('has no English words from the English steps', () => {
    expect(text(parts)).not.toMatch(/high plank with hands|Brace core/);
  });
});

describe('buildSpokenScript — Dutch app, English-only instructions', () => {
  const parts = buildSpokenScript(AIR_SQUAT, 'nl');
  it('Dutch name + prescription in a Dutch part, the English steps in a separate English part', () => {
    expect(parts.map((p) => p.lang)).toEqual(['nl', 'en']);
    expect(parts[0].text).toBe('Squat zonder gewicht. 2 sets van 15 herhalingen.');
    expect(parts[1].text.startsWith('Stand with feet shoulder-width apart. Sit hips back')).toBe(true);
    expect(parts[1].text).toContain('Tip: Knees track over toes.');
  });
  it('never puts English text in the Dutch part', () => {
    expect(parts[0].text).not.toMatch(/Stand|feet|Knees/);
  });
  it('a Dutch list whose length no longer matches the English falls back to English', () => {
    const ex = { ...PUSH_UP, instructions_json: JSON.stringify({ ...JSON.parse(PUSH_UP.instructions_json), steps_nl: ['Eén stap.'] }) };
    expect(buildSpokenScript(ex, 'nl').map((p) => p.lang)).toEqual(['nl', 'en']);
  });
  it('a row without name_nl says its English name in an English voice, then the Dutch prescription', () => {
    const parts2 = buildSpokenScript({ ...AIR_SQUAT, name_nl: null }, 'nl');
    expect(parts2.map((p) => p.lang)).toEqual(['en', 'nl', 'en']);
    expect(parts2[0].text).toBe('Air Squat.');
    expect(parts2[1].text).toBe('2 sets van 15 herhalingen.');
    expect(parts2[2].text.startsWith('Stand with feet')).toBe(true);
  });
});

describe('buildSpokenScript — English app', () => {
  it('is one English part with the English name and words', () => {
    const parts = buildSpokenScript(PUSH_UP, 'en');
    expect(parts).toHaveLength(1);
    expect(parts[0].lang).toBe('en');
    expect(parts[0].text.startsWith('Push-up. 3 sets of 12 reps. Start in a high plank')).toBe(true);
    expect(parts[0].text).toContain('about 30 to 45 degrees');
    expect(parts[0].text).not.toMatch(/Opdrukken|herhalingen/);
  });
});

describe('buildSpokenScript — edge cases', () => {
  it('a timed step says seconds; nothing to read beyond name + prescription when there are no instructions', () => {
    expect(buildSpokenScript(PLANK, 'nl')).toEqual([{ lang: 'nl', text: 'Plank. 3 sets van 30 seconden.' }]);
    expect(buildSpokenScript(PLANK, 'en')).toEqual([{ lang: 'en', text: 'Plank. 3 sets of 30 seconds.' }]);
  });
  it('malformed instructions_json does not throw', () => {
    expect(() => buildSpokenScript({ ...PUSH_UP, instructions_json: '{broken' }, 'nl')).not.toThrow();
    expect(buildSpokenScript({ ...PUSH_UP, instructions_json: '{broken' }, 'nl')).toEqual([{ lang: 'nl', text: 'Opdrukken. 3 sets van 12 herhalingen.' }]);
  });
  it('null step → nothing', () => {
    expect(buildSpokenScript(null, 'nl')).toEqual([]);
  });
  it('strips numbering a stored step may carry', () => {
    const ex = { name: 'X', instructions_json: JSON.stringify({ steps: ['Step 1: Stand tall', '2. Breathe out'] }) };
    expect(text(buildSpokenScript(ex, 'en'))).toBe('X. Stand tall. Breathe out.');
  });
  it('leaves out level-specific and advanced (💡💡) cues unless the level is advanced', () => {
    const ex = { name: 'X', instructions_json: JSON.stringify({ steps: ['Go.'], cues: ['💡 Beginner: use a wall.', '💡 💡 Pause at the bottom.', '💡 Breathe out on effort.'] }) };
    const plain = text(buildSpokenScript(ex, 'en'));
    expect(plain).toBe('X. Go. Tip: Breathe out on effort.');
    expect(text(buildSpokenScript(ex, 'en', { level: 'advanced' }))).toContain('Pause at the bottom.');
    expect(plain).not.toMatch(/wall/);
  });
  it('reads the pregnancy note first for a pregnant user, in Dutch when translated', () => {
    const ex = { name: 'X', name_nl: 'X', sets: 1, target_reps: 8, instructions_json: JSON.stringify({ steps: ['Go.'], steps_nl: ['Ga.'], pregnancy_note: 'Keep it gentle.', pregnancy_note_nl: 'Rustig aan.' }) };
    expect(buildSpokenScript(ex, 'nl', { bodyMode: 'pregnant' })).toEqual([{ lang: 'nl', text: 'X. 1 set van 8 herhalingen. Rustig aan. Ga.' }]);
    expect(text(buildSpokenScript(ex, 'nl'))).not.toContain('Rustig aan');
  });
  it('a measurement set says what it measures', () => {
    expect(buildSpokenScript({ name: 'Push-up', name_nl: 'Opdrukken', max_effort: true, measure_window_sec: 120 }, 'nl'))
      .toEqual([{ lang: 'nl', text: 'Opdrukken. Zoveel herhalingen als je kunt in 2 minuten.' }]);
  });
});

describe('prescription and duration in words', () => {
  it.each([
    [{ sets: 3, target_reps: 12 }, 'nl', '3 sets van 12 herhalingen.'],
    [{ sets: 1, target_reps: 1 }, 'nl', '1 set van 1 herhaling.'],
    [{ sets: 3, target_reps: 12 }, 'en', '3 sets of 12 reps.'],
    [{ sets: 1, target_reps: 1 }, 'en', '1 set of 1 rep.'],
    [{ sets: 2, target_duration_sec: 45 }, 'nl', '2 sets van 45 seconden.'],
    [{ sets: 1, target_duration_sec: 90 }, 'nl', '1 set van 1 minuut en 30 seconden.'],
    [{ sets: 1, target_duration_sec: 1200 }, 'en', '1 set of 20 minutes.'],
    [{ target_duration_sec: 300 }, 'nl', '5 minuten.'],
    [{ sets: 3 }, 'nl', null],
  ])('%j %s → %s', (step, lang, want) => expect(prescriptionWords(step, lang)).toBe(want));
  it('durationWords', () => {
    expect(durationWords(1, 'nl')).toBe('1 seconde');
    expect(durationWords(60, 'en')).toBe('1 minute');
    expect(durationWords(61, 'en')).toBe('1 minute and 1 second');
  });
  it('speakable ends every line with a full stop and drops emoji', () => {
    expect(speakable('💡 Knees out', 'en')).toBe('Knees out.');
    expect(speakable('Hold 20–30 s!', 'en')).toBe('Hold 20 to 30 s!');
    expect(speakable('   ', 'en')).toBe('');
  });
});

describe('voice ranking', () => {
  const V = (name, lang, extra = {}) => ({ name, lang, ...extra });
  const IOS = [
    V('Xander', 'nl-NL'), V('Xander (Enhanced)', 'nl-NL'), V('Ellen', 'nl-BE'), V('Daniel', 'en-GB'),
    V('Samantha', 'en-US', { default: true }), V('Daniel (Premium)', 'en-GB'), V('Bad News', 'en-US'), V('Thomas', 'fr-FR'),
  ];
  const CHROME = [V('Google Nederlands', 'nl-NL'), V('Microsoft Frank - Dutch (Netherlands)', 'nl-NL'), V('Google UK English Female', 'en-GB'), V('Google US English', 'en-US')];
  const ANDROID = [V('nl-nl-x-tfb-local', 'nl_NL'), V('nl-nl-x-lfc-network', 'nl-NL'), V('en-gb-x-gba-local', 'en_GB')];

  it('prefers an Enhanced / Premium voice over the compact one of the same language', () => {
    expect(pickVoice(IOS, 'nl').name).toBe('Xander (Enhanced)');
    expect(pickVoice(IOS, 'en').name).toBe('Daniel (Premium)');
  });
  it('prefers nl-NL over nl-BE, and Flemish over no Dutch voice at all', () => {
    expect(rankVoices(IOS, 'nl').map((v) => v.name)).toEqual(['Xander (Enhanced)', 'Xander', 'Ellen']);
    expect(pickVoice([V('Ellen', 'nl-BE'), V('Daniel', 'en-GB')], 'nl').name).toBe('Ellen');
  });
  it('prefers en-GB over en-US for English when quality is equal', () => {
    expect(pickVoice([V('Samantha', 'en-US'), V('Daniel', 'en-GB')], 'en').name).toBe('Daniel');
  });
  it('a Google voice beats a plain one; a novelty voice is last', () => {
    expect(pickVoice(CHROME, 'nl').name).toBe('Google Nederlands');
    expect(rankVoices(IOS, 'en').at(-1).name).toBe('Bad News');
  });
  it('reads Android tags with an underscore', () => {
    expect(pickVoice(ANDROID, 'nl').lang).toMatch(/^nl/);
    expect(pickVoice(ANDROID, 'en').name).toBe('en-gb-x-gba-local');
  });
  it('never offers a voice of another language; empty or missing list → null', () => {
    expect(rankVoices(IOS, 'nl').every((v) => v.lang.startsWith('nl'))).toBe(true);
    expect(pickVoice([V('Thomas', 'fr-FR')], 'nl')).toBeNull();
    expect(pickVoice([], 'nl')).toBeNull();
    expect(pickVoice(undefined, 'en')).toBeNull();
  });
  it('keeps the device order between equal voices', () => {
    expect(rankVoices([V('A', 'nl-NL'), V('B', 'nl-NL')], 'nl').map((v) => v.name)).toEqual(['A', 'B']);
  });
});

describe('sentences and the utterance plan', () => {
  it('splits per sentence and breaks a very long one at a comma', () => {
    expect(splitSentences('One. Two! Three?')).toEqual(['One.', 'Two!', 'Three?']);
    const long = `${'word '.repeat(30).trim()}, ${'more '.repeat(30).trim()}.`;
    const parts = splitSentences(long);
    expect(parts.length).toBeGreaterThan(1);
    expect(parts.every((p) => p.length <= 180)).toBe(true);
    expect(parts.join(' ').replace(/\s+/g, ' ')).toBe(long);
  });
  const VOICES = [{ name: 'Xander', lang: 'nl-NL' }, { name: 'Daniel', lang: 'en-GB' }];
  it('each sentence gets the voice of its own language', () => {
    const plan = planUtterances(buildSpokenScript(AIR_SQUAT, 'nl'), VOICES);
    expect(plan[0]).toMatchObject({ text: 'Squat zonder gewicht.', lang: 'nl-NL', voice: VOICES[0] });
    expect(plan.filter((u) => /Stand|Knees|Sit hips/.test(u.text)).every((u) => u.voice === VOICES[1] && u.lang === 'en-GB')).toBe(true);
  });
  it('drops the English part when the device has no English voice — never English in a Dutch voice', () => {
    const plan = planUtterances(buildSpokenScript(AIR_SQUAT, 'nl'), [VOICES[0]]);
    expect(plan.map((u) => u.text)).toEqual(['Squat zonder gewicht.', '2 sets van 15 herhalingen.']);
    expect(plan.every((u) => u.voice === VOICES[0])).toBe(true);
  });
  it('before voiceschanged (no list yet) it sends the language tag and lets the browser choose', () => {
    const plan = planUtterances(buildSpokenScript(AIR_SQUAT, 'nl'), []);
    expect(plan[0]).toEqual({ text: 'Squat zonder gewicht.', lang: 'nl-NL', voice: null });
    expect(plan.at(-1).lang).toBe('en-GB');
  });
  it('speaks a little slower than default', () => {
    expect(RATE).toBe(0.95);
  });
});
