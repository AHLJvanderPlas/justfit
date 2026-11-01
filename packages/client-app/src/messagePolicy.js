/**
 * messagePolicy.js — Centralised message severity and placement rules.
 *
 * Severity buckets:
 *  blocking_safety    — always visible, persistent, high emphasis, clear CTA
 *  adaptive_safety    — compact chip + collapsible "Why this plan?" panel
 *  progression_caution — shown inline only where user triggers risky choice
 *  account_security   — settings/account context only
 *  validation_error   — inline field-level, no banner
 *  system_error       — dedicated error card + retry action
 */

import { t } from './i18n.js';

// ── Rule code → severity bucket ──────────────────────────────────────────────
export const RULE_POLICY = {
  // blocking_safety
  R539: 'blocking_safety',  // postnatal clearance gate

  // adaptive_safety
  R510: 'adaptive_safety',
  R511: 'adaptive_safety',
  R512: 'adaptive_safety',
  R513: 'adaptive_safety',
  R514: 'adaptive_safety',
  R515: 'adaptive_safety',
  R516: 'adaptive_safety',
  R520: 'adaptive_safety',
  R521: 'adaptive_safety',
  R522: 'adaptive_safety',
  R523: 'adaptive_safety',
  R524: 'adaptive_safety',
  R525: 'adaptive_safety',
  R530: 'adaptive_safety',
  R531: 'adaptive_safety',
  R532: 'adaptive_safety',
  R533: 'adaptive_safety',
  R534: 'adaptive_safety',
  R535: 'adaptive_safety',
  R536: 'adaptive_safety',
  R537: 'adaptive_safety',
  R540: 'adaptive_safety',
  R541: 'adaptive_safety',
  R542: 'adaptive_safety',
  R543: 'adaptive_safety',
  R544: 'adaptive_safety',
  R545: 'adaptive_safety',
  R546: 'adaptive_safety',
  R550: 'adaptive_safety',
  R551: 'adaptive_safety',
  R552: 'adaptive_safety',
  R553: 'adaptive_safety',
  R554: 'adaptive_safety',
  R555: 'adaptive_safety',
  R556: 'adaptive_safety',
  R557: 'adaptive_safety',
  R560: 'adaptive_safety',
  R561: 'adaptive_safety',
  R558: 'adaptive_safety',
  R559: 'adaptive_safety',
  R562: 'adaptive_safety',
  R563: 'adaptive_safety',
  R564: 'adaptive_safety',
  R565: 'adaptive_safety',
  R568: 'adaptive_safety',
  R526: 'adaptive_safety',

  // W2.1 — rules that pushed a trace nobody could read until Wave 2.
  R500: 'adaptive_safety',
  R502: 'adaptive_safety',
  R517: 'adaptive_safety',
  R518: 'adaptive_safety',
  R519: 'adaptive_safety',
  R570: 'adaptive_safety',
  R571: 'adaptive_safety',
  R572: 'adaptive_safety',
  R574: 'adaptive_safety',
  R575: 'adaptive_safety',
  R576: 'adaptive_safety',
  R577: 'adaptive_safety',
  R583: 'adaptive_safety',
  R590: 'adaptive_safety',
  R591: 'adaptive_safety',
  R592: 'adaptive_safety',
  R593: 'adaptive_safety',
  R594: 'adaptive_safety',
  R595: 'adaptive_safety',
  R596: 'adaptive_safety',
  R597: 'adaptive_safety',
  R598: 'adaptive_safety',
  R999: 'adaptive_safety',
};

/**
 * Rules whose trace is engine bookkeeping, not a statement to a user (W2.1).
 *
 * `parseRuleTrace` drops any code without a RULE_LABELS entry *silently* — the user
 * is not shown a code, they are shown nothing — so "no label" and "deliberately
 * internal" used to look identical. They no longer do: smoke check W2.1 requires
 * every R-code the planner traces to appear in RULE_LABELS or here, with a reason.
 * Adding a code here is a claim that a user gains nothing from reading it.
 */
export const INTERNAL_RULE_CODES = {
  R501: 'Exercise-count arithmetic (base + goal + experience). The user reads the session; the formula that sized it tells them nothing they can act on.',
  R573: 'Military pool composition — how many military-tagged rows were available, or that the DB template was too thin and the generic pool was used. A sizing diagnostic; the session itself is explained by R570 and R574–R576.',
};

// ── Rule code → human-readable label ─────────────────────────────────────────
// category: 'Safety adaptation' | 'Training adaptation' | 'Suggested action'
export const RULE_LABELS = {
  R510: { category: 'Training adaptation', text: 'Session adapted to your available time.' },
  R511: { category: 'Training adaptation', text: 'Intensity eased — sleep recovery matters.' },
  R512: { category: 'Training adaptation', text: 'Volume reduced — low energy reported today.' },
  R513: { category: 'Training adaptation', text: 'Mobility focus selected — high stress day.' },
  R514: { category: 'Safety adaptation',   text: 'Rest day — pain reported. Recovery is training.' },
  R515: { category: 'Training adaptation', text: 'Quiet, low-impact exercises (no gym clothes).' },
  R516: { category: 'Training adaptation', text: 'Bodyweight session — no equipment or traveling today.' },
  R520: { category: 'Training adaptation', text: 'Intensity eased for your period day — your body is asking for gentleness.' },
  R521: { category: 'Training adaptation', text: 'Volume boost active — follicular energy peak, good sleep confirmed.' },
  R522: { category: 'Training adaptation', text: 'Full-effort session — you\u2019re at your ovulation peak. Take an extra minute to warm up.' },
  R523: { category: 'Training adaptation', text: 'Intensity eased — winding down for your late luteal phase.' },
  // R524 is a protective slow start, not a penalty: moving your own body is harder
  // at a higher mass, so the first weeks stay achievable and the joints intact.
  // The copy says that, and nothing about the user's body.
  // Below 70 kg the same formula raises reps instead, where "start gently" would be
  // simply untrue, so R524 carries a direction variant. Neither sentence comments on
  // the user's body; both describe what the session does.
  R524: {
    category: 'Training adaptation',
    text: 'Bodyweight exercises start gently — a gradual build-up keeps it doable and protects your joints.',
    dynamic: 'variant',
    // W3.3 — `measured`: the weight proxy would have cut reps, but a real
    // measurement (DCP self-test or progression) said no slow start is needed.
    variants: {
      up: 'Bodyweight reps are set a little higher so the effort matches the movement.',
      measured: 'Bodyweight reps follow your measured fitness level, not your body weight.',
    },
  },
  R525: { category: 'Training adaptation', text: 'Your session had no mobility work, so one mobility exercise was added at the end to keep your movement quality up.' },
  R530: { category: 'Safety adaptation',   text: 'Intensity capped for this pregnancy trimester.' },
  R531: { category: 'Safety adaptation',   text: 'Lying-on-back exercises removed (from week 16).' },
  R532: { category: 'Safety adaptation',   text: 'High-impact exercises removed during pregnancy.' },
  R533: { category: 'Safety adaptation',   text: 'Core compression and inversion exercises removed.' },
  R534: { category: 'Safety adaptation',   text: 'Pelvic floor work added to your session.' },
  R535: { category: 'Safety adaptation',   text: 'Gentle session today — nausea signal detected.' },
  R536: { category: 'Safety adaptation',   text: 'Volume reduced — breathlessness reported.' },
  // R537 was not in the audit's list of 23 — the W2.1 guard found it.
  R537: { category: 'Suggested action',    text: 'Past your due date — switch to postnatal mode in Settings when your baby arrives.' },
  R539: { category: 'Safety adaptation',   text: 'Exercise on hold — postnatal clearance needed.', cta: 'Update clearance in Settings when you\u2019re cleared.' },
  R540: { category: 'Safety adaptation',   text: 'Immediate postnatal phase — gentle movement only.' },
  R541: { category: 'Safety adaptation',   text: 'Pelvic floor exercises prioritised.' },
  R542: { category: 'Safety adaptation',   text: 'Prone exercises removed — caesarean recovery.' },
  R543: { category: 'Suggested action',    text: 'Check for abdominal separation with a physio before loading the core.' },
  R544: { category: 'Suggested action',    text: 'Confirm pelvic floor physio assessment before returning to running.' },
  R545: { category: 'Safety adaptation',   text: 'To reduce joint load, today uses low-impact cardio instead of running. This helps you build capacity safely and consistently.' },
  R546: { category: 'Safety adaptation',   text: 'Walk-run intervals used to build capacity safely. Add no more than 10% more running per week.' },
  R550: { category: 'Training adaptation', text: 'Session shaped by your progression profile.' },
  R551: { category: 'Training adaptation', text: 'Weakest fitness area prioritised today.' },
  R552: { category: 'Training adaptation', text: 'Volume adapted based on your current training mode.' },
  R553: { category: 'Training adaptation', text: 'Mobility maintenance included — over 7 days since last mobility session.' },
  R554: { category: 'Training adaptation', text: 'Session structure explained by your progression profile.' },
  R555: { category: 'Training adaptation', text: 'Safe run/walk intervals for your current conditioning level.' },
  R556: { category: 'Training adaptation', text: 'Running Coach programme active.' },
  R557: { category: 'Training adaptation', text: 'Cycling Coach programme — TSB-aware session selection.' },
  R560: { category: 'Training adaptation', text: 'Session biased toward your primary sport.' },
  R561: { category: 'Training adaptation', text: 'Sport-specific mobility exercise added to support your sport.' },
  R558: { category: 'Training adaptation', text: 'Volume reduced after a long break — easing back in safely.' },
  R559: { category: 'Training adaptation', text: 'Recovery mode — low intensity, mobility and recovery exercises only.' },
  R562: { category: 'Safety adaptation',   text: 'Exercises adjusted around your injury areas.' },
  R563: { category: 'Safety adaptation',   text: 'Joint-load exercises filtered based on reported pain areas.' },
  R564: { category: 'Safety adaptation',   text: 'Safe mobility exercises added to supplement filtered pool.' },
  R565: { category: 'Safety adaptation',   text: 'Session adjusted for your current injury context. Stop any exercise that causes sharp or worsening pain.' },
  R568: { category: 'Training adaptation', text: 'Polarised training — alternating Zone 2 endurance and HIIT sessions.' },
  R526: { category: 'Training adaptation', text: 'Perimenopause mode: intensity capped at moderate, standard cycle rules paused.' },

  // ── W2.1 — the rules that traced into a void ──────────────────────────────
  R500: { category: 'Training adaptation', text: 'Session built around your training goal.' },
  R502: { category: 'Training adaptation', text: 'Reps and durations matched to your experience level.' },
  R517: { category: 'Training adaptation', text: 'Intensity eased — you reported a low mood today.' },
  R518: { category: 'Training adaptation', text: 'Exercise choice takes your training location into account.' },
  // R519 is dynamic: the sentence is built from the factors the planner actually
  // applied, so the text below is a template and `volume` carries the numbers.
  // See buildVolumeSentence(); the placeholders are filled through t().
  R519: { category: 'Training adaptation', text: 'Today {pct}% of your normal volume: {reasons}.', dynamic: 'volume' },
  R570: { category: 'Training adaptation', text: 'Military programme — today comes from your current training block.' },
  R571: { category: 'Training adaptation', text: 'Zone 2 endurance run — building your aerobic base.' },
  R572: { category: 'Training adaptation', text: 'Interval run matched to your current running level.' },
  R574: { category: 'Training adaptation', text: 'Weighted march included — building the carry capacity your test asks for.' },
  R575: { category: 'Training adaptation', text: 'Circuit session — timed stations in the military format.' },
  R576: { category: 'Training adaptation', text: 'Cooper test scheduled — today is a measurement, not a training day.' },
  R577: { category: 'Safety adaptation',   text: 'Weighted march replaced with a walking lunge — knee pain reported.' },
  R583: { category: 'Safety adaptation',   text: 'Pace guidance added — a conversational pace builds your base fastest.' },
  R590: { category: 'Training adaptation', text: 'Order adjusted — muscle groups that are still recovering come later.' },
  R591: { category: 'Training adaptation', text: 'Warm-up sets added before your heaviest set.' },
  R592: { category: 'Training adaptation', text: 'Exercises paired into supersets so the session fits your time.' },
  R593: { category: 'Training adaptation', text: 'Your test movements are placed around muscle recovery.' },
  R594: { category: 'Training adaptation', text: 'Targets raised on your test movements — aiming above the minimum.' },
  R595: { category: 'Training adaptation', text: 'Exercise length checked against the time you have.' },
  R596: { category: 'Training adaptation', text: 'Defence protocol work left out — no military coach is active.' },
  R597: { category: 'Training adaptation', text: 'Variety check — no two exercises train the same movement today.' },
  R598: { category: 'Training adaptation', text: 'Self-measurement inside this session: max push-ups and sit-ups over two minutes.' },
  R999: { category: 'Training adaptation', text: 'Rest day — you set this weekday as a rest day.' },
  // C-B32 — the weekly training-days target (functions/api/_shared/weekTarget.js).
  // {n} is the target, read off the trace's "target=N" (dynamic: 'weektarget').
  R599: { category: 'Training adaptation', text: 'Your weekly target ({n}x) is reached — rest today.', dynamic: 'weektarget' },
  R600: { category: 'Training adaptation', text: 'Rest today — your {n} training days are spread over the week.', dynamic: 'weektarget' },
};

/**
 * R519 — reason keys the planner emits, as fragments for the volume sentence.
 *
 * Key order is display order: situational reasons first, standing ones last, so the
 * sentence reads "less sleep, back after a break, and your experience level" rather
 * than listing four multipliers. Every value needs an NL entry in i18n.js — smoke
 * check W2.1 enforces that.
 */
export const VOLUME_REASON_TEXT = {
  sleep:          'less sleep',
  return:         'back after a break',
  energy:         'low energy today',
  breathlessness: 'breathlessness today',
  cycle:          'your cycle phase',
  programme:      'your programme block',
  bodyweight:     'a calm build-up',
  bodyweight_up:  'your body weight',
  experience:     'your experience level',
  situational:    'the circumstances of today',
  // W3.2 — the stack would have gone below ctx.volumeFloor and was held there.
  floor:          'held at half, so it is still a real training day',
};

const VOLUME_REASON_ORDER = Object.keys(VOLUME_REASON_TEXT);

/**
 * Parse the R519 trace line into { pct, factors, product, reasons }.
 *
 * Shape emitted by the planner:
 *   R519 — Volume 48% of baseline · factors: experience ×0.80, situational ×0.75 · reasons: experience,sleep
 *
 * `product` is recomputed from the listed factors so a caller (smoke check W2.1)
 * can assert that the percentage the user reads really is their product.
 */
export function parseVolumeTrace(trace) {
  const text = String(trace ?? '');
  const pctMatch = /R519[^0-9]*?(\d{1,4})\s*%/.exec(text);
  if (!pctMatch) return null;
  const factors = {};
  let product = 1;
  const factorSection = /factors:\s*([^·]*)/.exec(text);
  if (factorSection) {
    for (const m of factorSection[1].matchAll(/([a-z]+)\s*×\s*([0-9]*\.?[0-9]+)/gi)) {
      const value = Number(m[2]);
      if (!Number.isFinite(value)) continue;
      factors[m[1]] = value;
      product *= value;
    }
  }
  const reasonSection = /reasons:\s*([a-z_,]+)/i.exec(text);
  const reasons = reasonSection
    ? [...new Set(reasonSection[1].split(',').map(r => r.trim()).filter(Boolean))]
      .sort((a, b) => {
        const ia = VOLUME_REASON_ORDER.indexOf(a);
        const ib = VOLUME_REASON_ORDER.indexOf(b);
        return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
      })
    : [];
  return { pct: Number(pctMatch[1]), factors, product, reasons };
}

// Fallback translator: substitutes {vars} exactly as t() does, so the sentence is
// still correct in tests and in English mode.
const _subst = (key, vars) => (vars
  ? String(key).replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? vars[k] : `{${k}}`))
  : key);

/**
 * Build the single accumulated volume sentence for a parsed R519 advisory.
 * `translate` is i18n's t(), passed in rather than imported so this module stays
 * free of browser globals and remains unit-testable.
 */
export function buildVolumeSentence(entry, translate) {
  const tr = translate ?? _subst;
  if (!entry?.volume) return null;
  const { pct, reasons } = entry.volume;
  const keys = reasons.length ? reasons : ['situational'];
  const frags = keys.map(k => tr(VOLUME_REASON_TEXT[k] ?? VOLUME_REASON_TEXT.situational));
  const and = tr('and');
  const joined = frags.length === 1
    ? frags[0]
    : frags.length === 2
      ? `${frags[0]} ${and} ${frags[1]}`
      : `${frags.slice(0, -1).join(', ')}, ${and} ${frags[frags.length - 1]}`;
  return tr('Today {pct}% of your normal volume: {reasons}.', { pct, reasons: joined });
}

/**
 * Parse rule_trace array into grouped advisory buckets.
 * Returns { safety, training, suggested, blocking } — each an array of { code, text, cta? }.
 * Deduplicates by rule code.
 */
export function parseRuleTrace(ruleTrace) {
  const safety = [], training = [], suggested = [], blocking = [];
  if (!ruleTrace?.length) return { safety, training, suggested, blocking };

  const seen = new Set();
  for (const trace of ruleTrace) {
    for (const [code, label] of Object.entries(RULE_LABELS)) {
      if (!seen.has(code) && trace.includes(code)) {
        const entry = { code, ...label };
        if (label.dynamic === 'variant') {
          // Same rule, opposite directions: the trace says which one fired.
          const dir = /direction:\s*([a-z_]+)/.exec(trace)?.[1];
          if (dir && label.variants?.[dir]) entry.text = label.variants[dir];
        }
        if (label.dynamic === 'weektarget') {
          const n = /target=(\d+)/.exec(trace)?.[1];
          if (!n) continue;
          entry.vars = { n };
        }
        if (label.dynamic === 'volume') {
          // A dynamic advisory with no parsable numbers says nothing, so it is
          // dropped rather than rendered with empty placeholders.
          const volume = parseVolumeTrace(trace);
          if (!volume) continue;
          entry.volume = volume;
        }
        seen.add(code);
        const policy = RULE_POLICY[code];
        if (policy === 'blocking_safety') {
          blocking.push(entry);
        } else if (label.category === 'Safety adaptation') {
          safety.push(entry);
        } else if (label.category === 'Suggested action') {
          suggested.push(entry);
        } else {
          training.push(entry);
        }
      }
    }
  }
  return { safety, training, suggested, blocking };
}

/**
 * Returns true if the rule_trace contains a blocking-safety rule (R539).
 * Use this — not text-matching on session_notes — to trigger the blocking banner.
 * Rule-code detection is stable even if planner copy changes.
 */
export function hasBlockingSafety(ruleTrace) {
  if (!ruleTrace?.length) return false;
  return ruleTrace.some((t) => t.includes('R539'));
}

// ── UAT release 2 — what changed today, and what is always so ────────────────
//
// The why-panel opened by default with 10–15 bullets, most of them engine
// structure ("Sessie opgebouwd rond je progressieprofiel", "Variatiecheck"), and
// the coach sentence could be a rule that fires every day (R516 "Bodyweight only
// today" for a user with dumbbells, R546 run-walk intervals above a push session).
// One classification now serves both:
//   today    — fired TODAY because of something the user said or did: the
//              check-in (R510–R517, R535/R536), pain (R514, R562–R565), the cycle
//              day (R520–R523), a break (R558), recovery mode (R559), the coach's
//              programme (R556/R557/R568/R570–R577) and a due measurement (R598).
//   standing — true every day but a statement about safety or the body mode
//              (pregnancy, postnatal, BMI, running safety). Shown, after today's.
//   more     — engine structure: goal, experience, progression profile, variety,
//              mobility maintenance, Defensie filter … behind "More".
//   hidden   — a trace line that changed nothing the label claims (R510 "Normal
//              session", R516 "Equipment filter from profile", run-walk wording
//              with no run in the session).
export const TODAY_RULE_CODES = new Set([
  'R510', 'R511', 'R512', 'R513', 'R514', 'R515', 'R516', 'R517',
  'R520', 'R521', 'R522', 'R523', 'R535', 'R536',
  'R558', 'R559', 'R562', 'R563', 'R564', 'R565', 'R592', 'R598',
  'R556', 'R557', 'R568', 'R570', 'R571', 'R572', 'R574', 'R575', 'R576', 'R577',
  'R599', 'R600',   // C-B32 — today is a rest day because of the weekly target
]);
export const STRUCTURAL_RULE_CODES = new Set([
  'R500', 'R502', 'R518', 'R519', 'R524', 'R525', 'R550', 'R551', 'R552', 'R553', 'R554',
  'R560', 'R561', 'R590', 'R591', 'R593', 'R594', 'R595', 'R596', 'R597',
]);
// R519 is today's only when a situational factor is among its reasons.
const STRUCTURAL_VOLUME_REASONS = new Set(['experience', 'bodyweight', 'bodyweight_up', 'floor']);

const _tagsOf = (s) => { try { return JSON.parse(s?.tags_json || '[]'); } catch { return []; } };
const _hasRunStep = (steps) => steps.some(s => _tagsOf(s).some(t => t === 'run_interval' || t === 'run_continuous' || t === 'running'));
const _hasCardioStep = (steps) => steps.some(s => s.category === 'cardio' || _tagsOf(s).includes('cardio'));

/**
 * Which group one rule belongs to today. `lines` are the trace lines carrying the
 * code; `steps` the session (null = unknown, nothing is hidden for lack of it).
 * Returns 'today' | 'standing' | 'more' | 'hidden'.
 */
export function ruleKind(code, lines = [], steps = null, entry = null) {
  const text = lines.join(' | ');
  if (code === 'R510') return /micro|no_time|Short session/i.test(text) || !/Normal session/.test(text) ? 'today' : 'hidden';
  if (code === 'R516') {
    if (/no_gear|traveling/.test(text)) return 'today';
    if (/Equipment filter from profile/.test(text)) return 'hidden';
    return /profile equipment=none/.test(text) ? 'more' : 'today';
  }
  if (code === 'R519' && entry?.volume) {
    return entry.volume.reasons.length && entry.volume.reasons.every(r => STRUCTURAL_VOLUME_REASONS.has(r)) ? 'more' : 'today';
  }
  if (steps && (code === 'R546' || code === 'R555') && !_hasRunStep(steps)) return 'hidden';
  if (steps && code === 'R545' && !_hasCardioStep(steps)) return 'hidden';
  if (TODAY_RULE_CODES.has(code)) return 'today';
  if (STRUCTURAL_RULE_CODES.has(code)) return 'more';
  return 'standing';
}

/**
 * The why-panel's groups: { blocking, today, standing, more }, each a list of
 * parseRuleTrace entries. Within a group the order is parseRuleTrace's (safety,
 * then training, then suggested action).
 */
export function classifyAdvisories(ruleTrace, steps = null) {
  const parsed = parseRuleTrace(ruleTrace);
  const out = { blocking: parsed.blocking, today: [], standing: [], more: [] };
  const lines = (code) => (ruleTrace ?? []).map(String).filter(t => t.includes(code));
  for (const entry of [...parsed.safety, ...parsed.training, ...parsed.suggested]) {
    const kind = ruleKind(entry.code, lines(entry.code), steps, entry);
    if (kind !== 'hidden') out[kind].push(entry);
  }
  return out;
}

// ── Coach sentence ────────────────────────────────────────────────────────────
// Warm plain-language sentences, one per rule that can carry the Today card.
const SENTENCE_VARIANTS = {
  R558: "We're easing you back in — volume capped to 75% after your break.",
  R559: "Taking it easy today — mobility and recovery only.",
  R511: "Lighter intensity today — short sleep is worth respecting.",
  R512: "Volume reduced — your energy was low at check-in.",
  R513: "Mobility session today — a high-stress day calls for something calmer.",
  R514: "Rest day — you reported pain. Recovery is part of the work.",
  R517: "Intensity eased — a low-mood day calls for something kinder.",
  R510: "Micro session — adapted to the time you have.",
  R516: "Bodyweight only today — no kit needed.",
  R515: "Quiet, low-impact session — no gym clothes required.",
  R535: "Gentle session today — nausea signal detected.",
  R536: "Volume eased — breathlessness reported.",
  R540: "Gentle postnatal movement — rebuilding from the ground up.",
  R541: "Pelvic floor work prioritised in today's session.",
  R530: "Intensity capped for this trimester.",
  R532: "High-impact exercises are left out.",
  R534: "Pelvic floor work added to today's session.",
  R563: "Joint-load exercises filtered around your reported pain areas.",
  R565: "Session adjusted around your pain areas — stop if anything feels sharp.",
  R545: "Low-impact cardio today — protecting your joints while building capacity.",
  R546: "Walk-run intervals — the safe way to build running capacity.",
  R598: "Self-measurement in today's session — max push-ups and sit-ups.",
  R599: "Weekly target reached — today is a rest day.",
  R600: "Rest day — your training days are spread over the week.",
  R526: "Perimenopause mode — intensity capped at moderate, session adapted for hormonal fluctuation.",
  R568: "Polarised training day — alternating Zone 2 and high-intensity work.",
  R560: "Session biased toward your primary sport.",
  R561: "Sport mobility added — one targeted exercise to support your sport.",
  R556: "Running Coach programme — structured progression, week by week.",
  R555: "Safe run/walk intervals matched to your current conditioning level.",
};

// Release 2 — what the user told us today outranks every standing rule; only a
// pain rest day and the clearance gate come first. Progression structure (R551,
// R553) never carries the card: it was "the reason" on day one for everyone.
const SENTENCE_SEVERITY_ORDER = [
  'R514', 'R539', 'R599', 'R600',
  'R535', 'R536', 'R559', 'R558', 'R511', 'R512', 'R513', 'R517', 'R510', 'R516', 'R515', 'R563', 'R565',
  'R598', 'R556', 'R557', 'R568',
  'R540', 'R541', 'R534', 'R532', 'R530', 'R545', 'R546', 'R555', 'R526',
  'R561', 'R560',
];

/**
 * Derive a single plain-language coach sentence from rule_trace.
 * Returns a string or null if no notable adaptation is active. `steps` (the
 * session) makes the sentence agree with it: a run-walk sentence needs a run.
 */
export function deriveCoachSentence(ruleTrace, sessionNotes, bodyMode = 'standard', slotType = '', steps = null) {
  const trace = (ruleTrace ?? []).map(String);
  // On rest days, skip training-specific rules that don't apply (e.g. "Bodyweight only today")
  const restSkip = slotType === 'rest'
    ? new Set(['R516','R515','R510','R511','R512','R513','R517','R524','R525','R553','R551','R560','R561','R557','R563','R565','R558','R520','R521','R522','R523','R555','R556','R568','R598','R534','R532','R530','R545','R546'])
    : null;
  const top = SENTENCE_SEVERITY_ORDER.find((code) => {
    if (restSkip?.has(code) || !SENTENCE_VARIANTS[code]) return false;
    const lines = trace.filter(t => t.includes(code));
    if (!lines.length) return false;
    // R510 carries the card only for a micro session; "Short session" is no news.
    if (code === 'R510' && !/micro|no_time/i.test(lines.join(' ')) && /session/i.test(lines.join(' '))) return false;
    const kind = ruleKind(code, lines, steps);
    return kind !== 'hidden' && !(code === 'R516' && kind !== 'today');
  });
  if (!top) return null;

  let sentence = SENTENCE_VARIANTS[top];
  const skipBodyPrefix = ['R535', 'R536', 'R537', 'R540', 'R541', 'R542', 'R543', 'R544'];
  if (!skipBodyPrefix.includes(top)) {
    if (bodyMode === 'pregnant')  sentence = 'Adapted for pregnancy — ' + sentence.charAt(0).toLowerCase() + sentence.slice(1);
    if (bodyMode === 'postnatal') sentence = 'Postnatal-safe — ' + sentence.charAt(0).toLowerCase() + sentence.slice(1);
  }
  return sentence;
}

// When no rule carries the card: a body-mode line for pregnancy / postnatal (their
// session names — "Today's movement" — made "Today's session: today's movement."),
// else the goal line built from the session's own title.
const BODY_FALLBACK = {
  pregnant:  'Adapted for pregnancy — steady, safe movement for today.',
  postnatal: 'Postnatal-safe — gentle movement to rebuild your strength.',
};

/**
 * The Today card's coach line, translated: the user's own session, the rule that
 * changed today, the body-mode line, or the goal line. Null on a rest day with
 * nothing to say.
 */
export function coachLine(plan, bodyMode = 'standard') {
  if (!plan) return null;
  if (plan.authored_by_user) return t("You built this session yourself — it counts like any other.");
  const sentence = deriveCoachSentence(plan.rule_trace, plan.session_notes, bodyMode, plan.slot_type ?? '', plan.steps ?? null);
  if (sentence) return coachSentenceT(sentence);
  if (plan.slot_type === 'rest') return null;
  if (BODY_FALLBACK[bodyMode]) return coachSentenceT(BODY_FALLBACK[bodyMode]);
  return plan.session_name ? t("Today's session: {name}.", { name: sessionTitle(plan.session_name, plan).toLowerCase() }) : null;
}

/**
 * Derive the most prominent compact chip label for a plan.
 * Returns a short string or null if no notable adaptation is active.
 * Priority order: blocking > BMI > injury > pregnancy/postnatal > time > cycle > sleep/stress.
 */
export function deriveChipLabel(ruleTrace, sessionNotes) {
  const traceStr = (ruleTrace ?? []).join(' ');
  const notesLower = (() => {
    if (!sessionNotes) return '';
    const text = Array.isArray(sessionNotes) ? sessionNotes.join(' ') : sessionNotes;
    return text.toLowerCase();
  })();

  if (traceStr.includes('R539'))                          return 'Clearance required';
  if (traceStr.includes('R545'))                          return 'High-impact removed';
  if (traceStr.includes('R546'))                          return 'Walk-run mode';
  if (traceStr.includes('R563') || traceStr.includes('R565')) return 'Joint-safe mode';
  if (traceStr.includes('R535'))                          return 'Gentle session';
  if (traceStr.includes('R540'))                          return 'Postnatal phase';
  if (traceStr.includes('R530') || traceStr.includes('R531') || traceStr.includes('R532')) return 'Pregnancy-adapted';
  if (traceStr.includes('R514'))                          return 'Rest day — pain';
  if (traceStr.includes('R510'))                          return 'Time-adjusted';
  if (traceStr.includes('R516'))                          return 'Bodyweight only';
  if (traceStr.includes('R515'))                          return 'Low-impact mode';
  if (traceStr.includes('R513'))                          return 'Mobility focus';
  if (traceStr.includes('R511'))                          return 'Low intensity';
  if (traceStr.includes('R512'))                          return 'Volume reduced';
  if (traceStr.includes('R559'))                          return 'Recovery mode';
  if (traceStr.includes('R558'))                          return 'Return to training';
  if (traceStr.includes('R553'))                          return 'Mobility added';
  if (traceStr.includes('R551'))                          return 'Weakness targeted';
  if (traceStr.includes('R568'))                          return 'Polarised training';
  if (notesLower.includes('bmi'))                         return 'Adapted for you';
  if (sessionNotes)                                       return 'Adapted today';
  return null;
}

// ── Builder v1.6 — words the Today card and WorkoutView share ─────────────────
// Keys are the English words (i18n.js holds the Dutch). Resolved at render, never
// at module load, because the language can change at runtime.
export const INTENSITY_LABELS = { low: 'LOW', moderate: 'MODERATE', high: 'HIGH' };
export const SLOT_LABELS = { rest: 'Rest day', micro: 'Micro session', main: 'Full session' };

export function intensityLabel(level) {
  const key = INTENSITY_LABELS[String(level ?? '').toLowerCase()];
  return key ? t(key) : String(level ?? '').toUpperCase();
}

export function slotLabel(slot) {
  const key = SLOT_LABELS[slot];
  return key ? t(key) : String(slot ?? '');
}

// The engine's session names. The fixed ones are keys of their own; the ones with
// a number in them are matched here and translated through a key with placeholders.
// Anything else (a template name the user typed, "Mijn training") passes through.
const NAME_PATTERNS = [
  [/^Cooper Test \u00b7 Block (\d+) \u00b7 (.+)$/, 'Cooper Test \u00b7 Block {n} \u00b7 {x}', (m) => ({ n: m[1], x: t(m[2]) })],
  [/^Military \u00b7 (.+) \u00b7 Block (\d+)$/, 'Military \u00b7 {x} \u00b7 Block {n}', (m) => ({ n: m[2], x: t(m[1]) })],
  [/^Running Day \u00b7 Week (\d+) \u00b7 (.+)$/, 'Running Day \u00b7 Week {n} \u00b7 {x}', (m) => ({ n: m[1], x: t(m[2]) })],
  [/^Cycling Day \u00b7 Week (\d+) \u00b7 (.+)$/, 'Cycling Day \u00b7 Week {n} \u00b7 {x}', (m) => ({ n: m[1], x: t(m[2]) })],
  [/^Cross-Training Run \u00b7 Level (\d+)$/, 'Cross-Training Run \u00b7 Level {n}', (m) => ({ n: m[1] })],
];

// Release 2 — the title follows the session. A recovery day read "CARDIOVERBRANDING"
// above "Rustig aan vandaag — alleen mobiliteit en herstel": with the plan passed
// in, recovery mode (R559) or a recovery/mobility slot reads "Easy session" and a
// rest day "Recovery". A coach's programme name and a name the user typed stay.
const EASY_SLOTS = new Set(['recovery', 'mobility']);
export function sessionTitle(name, plan = null) {
  if (plan && !plan.authored_by_user && !plan.military_program && !plan.run_program && !plan.cycling_program) {
    if (plan.slot_type === 'rest') return t('Recovery');
    if (EASY_SLOTS.has(plan.slot_type) || (plan.rule_trace ?? []).some(x => String(x).includes('R559'))) return t('Easy session');
  }
  if (!name) return name;
  for (const [re, key, vars] of NAME_PATTERNS) {
    const m = re.exec(name);
    if (m) return t(key, vars(m));
  }
  return t(name);
}

// Builder v1.6 — pregnancy/postnatal prefixes are joined to the sentence in English
// (deriveCoachSentence), so the whole string is no key. Translate the two parts apart.
const BODY_PREFIXES = ['Adapted for pregnancy', 'Postnatal-safe'];
export function coachSentenceT(sentence) {
  if (!sentence) return sentence;
  for (const prefix of BODY_PREFIXES) {
    if (sentence.startsWith(prefix + ' \u2014 ')) {
      const rest = sentence.slice(prefix.length + 3);
      const base = t(rest.charAt(0).toUpperCase() + rest.slice(1));
      return `${t(prefix)} \u2014 ${base.charAt(0).toLowerCase()}${base.slice(1)}`;
    }
  }
  return t(sentence);
}

export const CYCLE_SUBGOAL_LABELS = {
  build_fitness: 'Build fitness', climbing: 'Climbing', sprint: 'Sprint',
  aerobic_base: 'Aerobic base', race_fitness: 'Race fitness',
};
export function cycleSubGoalLabel(value) {
  const key = CYCLE_SUBGOAL_LABELS[value];
  return key ? t(key) : String(value ?? '').replace(/_/g, ' ');
}

// coach-dcp R2 — the six progression axes, ONE label source for the radar, the
// ASSENANALYSE bars, the insights and the Coach view ("zwakste as"). Dutch:
// Duwen / Trekken / Benen / Romp / Cardio / Mobiliteit.
export const AXIS_LABELS = {
  push: 'Push', pull: 'Pull', legs: 'Legs', core: 'Core', conditioning: 'Cardio', mobility: 'Mobility',
};
export function axisLabel(axis) {
  const key = AXIS_LABELS[axis];
  return key ? t(key) : String(axis ?? '');
}
