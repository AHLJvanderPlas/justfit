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
  R560: 'adaptive_safety',
  R562: 'adaptive_safety',
  R563: 'adaptive_safety',
  R564: 'adaptive_safety',
  R565: 'adaptive_safety',
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
  R520: { category: 'Training adaptation', text: 'Intensity tuned for your current cycle phase.' },
  R521: { category: 'Training adaptation', text: 'Volume adapted for your cycle phase.' },
  R522: { category: 'Training adaptation', text: 'Session type adjusted for cycle phase.' },
  R523: { category: 'Training adaptation', text: 'Cycle phase: energy boost window active.' },
  R524: { category: 'Training adaptation', text: 'Cycle phase: recovery priority.' },
  R525: { category: 'Training adaptation', text: 'Cycle phase: low-volume adaptation.' },
  R530: { category: 'Safety adaptation',   text: 'Intensity capped for this pregnancy trimester.' },
  R531: { category: 'Safety adaptation',   text: 'Lying-on-back exercises removed (from week 16).' },
  R532: { category: 'Safety adaptation',   text: 'High-impact exercises removed during pregnancy.' },
  R533: { category: 'Safety adaptation',   text: 'Core compression and inversion exercises removed.' },
  R534: { category: 'Safety adaptation',   text: 'Pelvic floor work added to your session.' },
  R535: { category: 'Safety adaptation',   text: 'Gentle session today — nausea signal detected.' },
  R536: { category: 'Safety adaptation',   text: 'Volume reduced — breathlessness reported.' },
  R539: { category: 'Safety adaptation',   text: 'Exercise on hold — postnatal clearance needed.', cta: 'Update clearance in Settings when you\'re cleared.' },
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
  R555: { category: 'Training adaptation', text: 'Safe run/walk intervals for your current conditioning level.' },
  R556: { category: 'Training adaptation', text: 'Running Coach programme active.' },
  R560: { category: 'Training adaptation', text: 'Session biased toward your primary sport.' },
  R562: { category: 'Safety adaptation',   text: 'Exercises adjusted around your injury areas.' },
  R563: { category: 'Safety adaptation',   text: 'Joint-load exercises filtered based on reported pain areas.' },
  R564: { category: 'Safety adaptation',   text: 'Safe mobility exercises added to supplement filtered pool.' },
  R565: { category: 'Safety adaptation',   text: 'Session adjusted for your current injury context. Stop any exercise that causes sharp or worsening pain.' },
};

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
        seen.add(code);
        const entry = { code, ...label };
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
 * Classify session_notes text into a severity bucket.
 * Returns 'blocking_safety' | 'adaptive_safety' | null.
 *
 * 'blocking_safety' is only for clearance gates (R539 language).
 * All other session notes are 'adaptive_safety'.
 */
export function classifySessionNotes(sessionNotes) {
  if (!sessionNotes) return null;
  const text = Array.isArray(sessionNotes) ? sessionNotes.join(' ') : sessionNotes;
  if (!text.trim()) return null;
  const lower = text.toLowerCase();
  if (lower.includes('confirm exercise clearance') || lower.includes('healthcare provider')) {
    return 'blocking_safety';
  }
  return 'adaptive_safety';
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
  if (traceStr.includes('R553'))                          return 'Mobility added';
  if (traceStr.includes('R551'))                          return 'Weakness targeted';
  if (notesLower.includes('bmi'))                         return 'Adapted for you';
  if (sessionNotes)                                       return 'Adapted today';
  return null;
}
