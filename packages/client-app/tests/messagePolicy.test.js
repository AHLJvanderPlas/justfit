import { describe, it, expect } from 'vitest';
import {
  RULE_POLICY,
  RULE_LABELS,
  INTERNAL_RULE_CODES,
  VOLUME_REASON_TEXT,
  parseRuleTrace,
  parseVolumeTrace,
  buildVolumeSentence,
  hasBlockingSafety,
  deriveCoachSentence,
  deriveChipLabel,
} from '../src/messagePolicy.js';

// ── RULE_POLICY ───────────────────────────────────────────────────────────────

describe('RULE_POLICY', () => {
  it('maps R539 to blocking_safety', () => {
    expect(RULE_POLICY.R539).toBe('blocking_safety');
  });

  it('maps all adaptation rules to adaptive_safety', () => {
    const adaptive = ['R510', 'R511', 'R512', 'R513', 'R514', 'R515', 'R516', 'R558', 'R559'];
    for (const code of adaptive) {
      expect(RULE_POLICY[code]).toBe('adaptive_safety');
    }
  });

  it('has no unknown severity values', () => {
    const valid = new Set(['blocking_safety', 'adaptive_safety']);
    for (const val of Object.values(RULE_POLICY)) {
      expect(valid.has(val)).toBe(true);
    }
  });
});

// ── RULE_LABELS ───────────────────────────────────────────────────────────────

describe('RULE_LABELS', () => {
  it('each label has category and text fields', () => {
    for (const [code, label] of Object.entries(RULE_LABELS)) {
      expect(typeof label.category).toBe('string', `${code} missing category`);
      expect(typeof label.text).toBe('string', `${code} missing text`);
    }
  });

  it('uses only known category values', () => {
    const known = new Set(['Safety adaptation', 'Training adaptation', 'Suggested action']);
    for (const [code, label] of Object.entries(RULE_LABELS)) {
      expect(known.has(label.category)).toBe(true, `${code} has unknown category: ${label.category}`);
    }
  });

  it('R539 includes a cta field', () => {
    expect(typeof RULE_LABELS.R539.cta).toBe('string');
  });
});

// ── parseRuleTrace ────────────────────────────────────────────────────────────

describe('parseRuleTrace', () => {
  it('returns empty buckets for empty trace', () => {
    const r = parseRuleTrace([]);
    expect(r.safety).toHaveLength(0);
    expect(r.training).toHaveLength(0);
    expect(r.suggested).toHaveLength(0);
    expect(r.blocking).toHaveLength(0);
  });

  it('returns empty buckets for null/undefined trace', () => {
    expect(parseRuleTrace(null)).toEqual({ safety: [], training: [], suggested: [], blocking: [] });
    expect(parseRuleTrace(undefined)).toEqual({ safety: [], training: [], suggested: [], blocking: [] });
  });

  it('routes R539 to blocking bucket', () => {
    const r = parseRuleTrace(['R539 — postnatal clearance gate']);
    expect(r.blocking).toHaveLength(1);
    expect(r.blocking[0].code).toBe('R539');
    expect(r.safety).toHaveLength(0);
  });

  it('routes R514 (pain → rest day) to safety bucket', () => {
    const r = parseRuleTrace(['R514 — general pain, rest day assigned']);
    expect(r.safety.some(e => e.code === 'R514')).toBe(true);
    expect(r.blocking).toHaveLength(0);
  });

  it('routes R511 (low sleep) to training bucket', () => {
    const r = parseRuleTrace(['R511 — sleep ≤5h, intensity lowered']);
    expect(r.training.some(e => e.code === 'R511')).toBe(true);
  });

  it('routes R543 (diastasis check) to suggested bucket', () => {
    const r = parseRuleTrace(['R543 — rebuilding phase, check diastasis recti']);
    expect(r.suggested.some(e => e.code === 'R543')).toBe(true);
  });

  it('deduplicates codes appearing in multiple trace strings', () => {
    const r = parseRuleTrace(['R511 low energy', 'R511 repeated']);
    const r511s = r.training.filter(e => e.code === 'R511');
    expect(r511s).toHaveLength(1);
  });

  it('handles multiple distinct rules in a single trace string', () => {
    const r = parseRuleTrace(['R511 low sleep / R512 low energy']);
    expect(r.training.some(e => e.code === 'R511')).toBe(true);
    expect(r.training.some(e => e.code === 'R512')).toBe(true);
  });

  it('includes code and text on each entry', () => {
    const r = parseRuleTrace(['R510 micro session']);
    const entry = r.training.find(e => e.code === 'R510');
    expect(entry?.text).toBeTruthy();
  });
});

// ── hasBlockingSafety ─────────────────────────────────────────────────────────

describe('hasBlockingSafety', () => {
  it('returns true when R539 present', () => {
    expect(hasBlockingSafety(['R539 — postnatal clearance'])).toBe(true);
  });

  it('returns false when R539 absent', () => {
    expect(hasBlockingSafety(['R511 low sleep', 'R512 low energy'])).toBe(false);
  });

  it('returns false for empty trace', () => {
    expect(hasBlockingSafety([])).toBe(false);
  });

  it('returns false for null/undefined', () => {
    expect(hasBlockingSafety(null)).toBe(false);
    expect(hasBlockingSafety(undefined)).toBe(false);
  });
});

// ── deriveCoachSentence ───────────────────────────────────────────────────────

describe('deriveCoachSentence', () => {
  it('returns null for empty trace', () => {
    expect(deriveCoachSentence([], null)).toBeNull();
  });

  it('returns null for no matching rule', () => {
    expect(deriveCoachSentence(['R999 unknown'], null)).toBeNull();
  });

  it('returns a sentence for R558 (return to training)', () => {
    const s = deriveCoachSentence(['R558 — back after break'], null);
    expect(typeof s).toBe('string');
    expect(s.length).toBeGreaterThan(0);
  });

  it('returns a sentence for R514 (pain, rest day)', () => {
    const s = deriveCoachSentence(['R514 — pain, rest assigned'], null);
    expect(s).toContain('pain');
  });

  it('R514 has higher severity than R511', () => {
    const s = deriveCoachSentence(['R511 low sleep', 'R514 pain'], null);
    expect(s).toContain('pain');
  });

  it('prefixes with "Adapted for pregnancy" for pregnant mode', () => {
    const s = deriveCoachSentence(['R511 low sleep'], null, 'pregnant');
    expect(s).toMatch(/adapted for pregnancy/i);
  });

  it('prefixes with "Postnatal-safe" for postnatal mode', () => {
    const s = deriveCoachSentence(['R511 low sleep'], null, 'postnatal');
    expect(s).toMatch(/postnatal-safe/i);
  });

  it('does not prefix pregnancy for R535 (nausea — body-mode rule)', () => {
    const s = deriveCoachSentence(['R535 nausea'], null, 'pregnant');
    expect(s).not.toMatch(/adapted for pregnancy/i);
  });

  it('skips training rules on rest days', () => {
    // R516 (bodyweight only) should be suppressed on rest days
    const withoutRest = deriveCoachSentence(['R516 no equipment'], null, 'standard', '');
    const onRest = deriveCoachSentence(['R516 no equipment'], null, 'standard', 'rest');
    expect(withoutRest).not.toBeNull();
    expect(onRest).toBeNull();
  });
});

// ── deriveChipLabel ───────────────────────────────────────────────────────────

describe('deriveChipLabel', () => {
  it('returns null for empty trace and no notes', () => {
    expect(deriveChipLabel([], null)).toBeNull();
  });

  it('returns "Clearance required" for R539', () => {
    expect(deriveChipLabel(['R539'], null)).toBe('Clearance required');
  });

  it('returns "Rest day — pain" for R514', () => {
    expect(deriveChipLabel(['R514'], null)).toBe('Rest day — pain');
  });

  it('R539 takes priority over R514', () => {
    expect(deriveChipLabel(['R539', 'R514'], null)).toBe('Clearance required');
  });

  it('returns "Bodyweight only" for R516', () => {
    expect(deriveChipLabel(['R516'], null)).toBe('Bodyweight only');
  });

  it('returns "Recovery mode" for R559', () => {
    expect(deriveChipLabel(['R559'], null)).toBe('Recovery mode');
  });

  it('returns "Pregnancy-adapted" for R530', () => {
    expect(deriveChipLabel(['R530'], null)).toBe('Pregnancy-adapted');
  });

  it('returns "Adapted today" when only session notes present', () => {
    expect(deriveChipLabel([], 'Some coaching note')).toBe('Adapted today');
  });

  it('returns "Adapted for you" when notes contain "bmi"', () => {
    expect(deriveChipLabel([], 'BMI-adjusted session')).toBe('Adapted for you');
  });
});

// ── R557 + R561 coverage ──────────────────────────────────────────────────────

describe('R557 (cycling coach TSB)', () => {
  it('is mapped to adaptive_safety in RULE_POLICY', () => {
    expect(RULE_POLICY['R557']).toBe('adaptive_safety');
  });
  it('has a label with Training adaptation category', () => {
    expect(RULE_LABELS['R557'].category).toBe('Training adaptation');
    expect(typeof RULE_LABELS['R557'].text).toBe('string');
  });
  it('is suppressed on rest days by deriveCoachSentence', () => {
    const s = deriveCoachSentence(['R557 — TSB override'], null, 'standard', 'rest');
    expect(s).toBeNull();
  });
});

describe('R561 (sport mobility injection)', () => {
  it('is mapped to adaptive_safety in RULE_POLICY', () => {
    expect(RULE_POLICY['R561']).toBe('adaptive_safety');
  });
  it('has a label with Training adaptation category', () => {
    expect(RULE_LABELS['R561'].category).toBe('Training adaptation');
    expect(typeof RULE_LABELS['R561'].text).toBe('string');
  });
  it('returns a sentence for R561', () => {
    const s = deriveCoachSentence(['R561 — Sport mobility injection: Hip Flexor Stretch added for running'], null);
    expect(typeof s).toBe('string');
    expect(s.length).toBeGreaterThan(0);
  });
  it('is suppressed on rest days by deriveCoachSentence', () => {
    const s = deriveCoachSentence(['R561 — mobility injection'], null, 'standard', 'rest');
    expect(s).toBeNull();
  });
});

// ── W2 — explainability: the internal registry and the volume sentence ───────

describe('INTERNAL_RULE_CODES', () => {
  it('never overlaps RULE_LABELS — a rule is explained or internal, not both', () => {
    const both = Object.keys(INTERNAL_RULE_CODES).filter((c) => RULE_LABELS[c]);
    expect(both).toEqual([]);
  });

  it('states a reason for every internal code', () => {
    for (const [code, why] of Object.entries(INTERNAL_RULE_CODES)) {
      expect(typeof why, code).toBe('string');
      expect(why.trim().length, code).toBeGreaterThan(20);
    }
  });
});

describe('parseVolumeTrace', () => {
  const line = 'R519 — Volume 48% of baseline · factors: experience ×0.80, situational ×0.75, bodyweight ×0.80 · reasons: experience,sleep,return,bodyweight';

  it('returns null for anything that is not an R519 line', () => {
    expect(parseVolumeTrace('R511 — Poor sleep')).toBeNull();
    expect(parseVolumeTrace(null)).toBeNull();
  });

  it('reads the percentage, the factors and the reasons', () => {
    const v = parseVolumeTrace(line);
    expect(v.pct).toBe(48);
    expect(v.factors).toEqual({ experience: 0.8, situational: 0.75, bodyweight: 0.8 });
    expect(v.reasons).toEqual(['sleep', 'return', 'bodyweight', 'experience']);
  });

  it('recomputes the product so the stated percentage can be verified', () => {
    const v = parseVolumeTrace(line);
    expect(Math.abs(v.pct / 100 - v.product)).toBeLessThan(0.01);
  });

  it('orders reasons for reading, not by emission', () => {
    const v = parseVolumeTrace('R519 — Volume 90% of baseline · factors: experience ×0.90 · reasons: experience,sleep');
    expect(v.reasons[0]).toBe('sleep');
    expect(v.reasons[v.reasons.length - 1]).toBe('experience');
  });
});

describe('buildVolumeSentence', () => {
  const entryFor = (trace) => parseRuleTrace([trace]).training.find((e) => e.code === 'R519');

  it('builds one sentence from the real factors', () => {
    const entry = entryFor('R519 — Volume 48% of baseline · factors: experience ×0.80, situational ×0.75, bodyweight ×0.80 · reasons: experience,sleep,return,bodyweight');
    expect(buildVolumeSentence(entry)).toBe(
      'Today 48% of your normal volume: less sleep, back after a break, a calm build-up, and your experience level.'
    );
  });

  it('joins two reasons without a list comma', () => {
    const entry = entryFor('R519 — Volume 64% of baseline · factors: experience ×0.80, situational ×0.80 · reasons: experience,sleep');
    expect(buildVolumeSentence(entry)).toBe('Today 64% of your normal volume: less sleep and your experience level.');
  });

  it('goes through the translator it is given', () => {
    const nl = { 'less sleep': 'minder geslapen', and: 'en', 'Today {pct}% of your normal volume: {reasons}.': 'Vandaag {pct}% van je normale volume: {reasons}.' };
    const t = (key, vars) => {
      const str = nl[key] ?? key;
      return vars ? str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? vars[k] : `{${k}}`)) : str;
    };
    const entry = entryFor('R519 — Volume 85% of baseline · factors: situational ×0.85 · reasons: sleep');
    expect(buildVolumeSentence(entry, t)).toBe('Vandaag 85% van je normale volume: minder geslapen.');
  });

  it('returns null for an advisory that carries no numbers', () => {
    expect(buildVolumeSentence({ code: 'R511', text: 'x' })).toBeNull();
    expect(buildVolumeSentence(null)).toBeNull();
  });

  it('every reason key the planner can emit has a fragment', () => {
    for (const key of Object.keys(VOLUME_REASON_TEXT)) {
      expect(typeof VOLUME_REASON_TEXT[key], key).toBe('string');
    }
  });
});

describe('parseRuleTrace — dynamic advisories', () => {
  it('carries the volume numbers on the R519 entry', () => {
    const r = parseRuleTrace(['R519 — Volume 48% of baseline · factors: experience ×0.80, situational ×0.60 · reasons: experience,energy']);
    const entry = r.training.find((e) => e.code === 'R519');
    expect(entry.volume.pct).toBe(48);
    expect(entry.volume.reasons).toContain('energy');
  });

  it('says nothing rather than rendering empty placeholders', () => {
    const r = parseRuleTrace(['R519 — volume summary unavailable']);
    expect(r.training.find((e) => e.code === 'R519')).toBeUndefined();
  });

  it('R524 reads as a gentle start downwards and as a higher count upwards', () => {
    const down = parseRuleTrace(['R524 — Bodyweight reps ×0.80 on 2 exercise(s) · direction: down'])
      .training.find((e) => e.code === 'R524');
    const up = parseRuleTrace(['R524 — Bodyweight reps ×1.08 on 2 exercise(s) · direction: up'])
      .training.find((e) => e.code === 'R524');
    expect(down.text).toMatch(/start gently/);
    expect(up.text).toMatch(/a little higher/);
    expect(up.text).not.toMatch(/gently/);
  });

  it('falls back to the default text when no direction is stated', () => {
    const entry = parseRuleTrace(['R524 — Bodyweight reps rescaled']).training.find((e) => e.code === 'R524');
    expect(entry.text).toBe(RULE_LABELS.R524.text);
  });
});
