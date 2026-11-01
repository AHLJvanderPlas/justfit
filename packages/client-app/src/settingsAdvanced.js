// UAT release 5 — Settings → Doel & coach → Geavanceerd: the eight planner settings that used to
// fill Jij, each as one row with a title, one plain sentence and its CURRENT value. Pure: `tr`
// is i18n's t (identity in tests), `names` maps an equipment / sport id to its English label.
const ONOFF = (on, tr) => (on ? tr("On") : tr("Off"));
const DOW = [[1, "Mon"], [2, "Tue"], [3, "Wed"], [4, "Thu"], [5, "Fri"], [6, "Sat"], [0, "Sun"]];

export const ADVANCED_ROW_IDS = ["checkin", "schedule", "overhead", "equipment", "sports", "bias", "polarised", "replan", "rest"];

export function minutesLabel(m) {
  return m === 60 ? "1h" : m === 90 ? "1.5h" : m === 120 ? "2h" : `${m} min`;
}

function listValue(items, empty, tr) {
  if (!items.length) return tr(empty);
  return items.length <= 3 ? items.join(", ") : `${items.slice(0, 2).join(", ")} +${items.length - 2}`;
}

export function overheadTotals(timeOverhead) {
  const total = (p) => Object.values(p?.presets ?? {}).reduce((s, v) => s + (v || 0), 0) + (p?.custom ?? []).reduce((s, c) => s + (c.minutes || 0), 0);
  return { short: total(timeOverhead?.short), long: total(timeOverhead?.long) };
}

/**
 * state: { checkinMode, planDuration, advancedSchedule, timeOverhead, equipment[], sportPrefs,
 *          dailyReplan, isPro, blockedWeekdays[] }
 * names: { equipment(id) → English label, sport(id) → English label }
 * Returns [{ id, title, sentence, value }] in display order.
 */
export function advancedRows(state, tr = (k) => k, names = { equipment: (v) => v, sport: (v) => v }) {
  const s = state;
  const sp = s.sportPrefs ?? {};
  const oh = overheadTotals(s.timeOverhead);
  const kit = (s.equipment ?? []).filter((v) => v !== "none").map((v) => tr(names.equipment(v)));
  const sports = (sp.sports ?? []).map((v) => tr(names.sport(v)));
  const biasOn = sp.bias_enabled !== false;
  const proGate = (on) => (s.isPro ? ONOFF(on, tr) : tr("Pro only"));
  const rest = DOW.filter(([d]) => (s.blockedWeekdays ?? []).includes(d)).map(([, n]) => tr(n));
  return [
    { id: "checkin", title: tr("Daily check-in"), sentence: tr("Controls when the Daily Intelligence Prompt appears."),
      value: tr({ every_time: "Every time", once_a_day: "Once a day", manual: "Manual" }[s.checkinMode] ?? "Once a day") },
    { id: "schedule", title: tr("Available time per session"), sentence: tr("Sets the default length of your daily plan. You can always adjust on the day."),
      value: s.advancedSchedule ? tr("Per day of the week") : minutesLabel(s.planDuration) },
    { id: "overhead", title: tr("Time overhead"), sentence: tr("Minutes for changing, setting up and showering, taken off your training window."),
      value: s.timeOverhead?.enabled && (oh.short > 0 || oh.long > 0) ? tr("Quick {a} min · Full {b} min", { a: oh.short, b: oh.long }) : tr("Not set") },
    { id: "equipment", title: tr("Available equipment"), sentence: tr("The planner only suggests exercises you can actually do."),
      value: listValue(kit, "No equipment — bodyweight only", tr) },
    { id: "sports", title: tr("Sports & Activities"), sentence: tr("Tell the planner which sports you do, so gym sessions complement them."),
      value: listValue(sports, "No sports selected", tr) },
    { id: "bias", title: tr("Sport-aware training bias"),
      sentence: biasOn ? tr("Planner fills the gaps your sport doesn't cover.") : tr("Planner ignores your sport — trains all axes equally."),
      value: ONOFF(biasOn, tr) },
    { id: "polarised", title: tr("Polarised Training"), sentence: tr("Alternates high-intensity (HIIT) and easy aerobic (Zone 2). On low-energy days, Zone 2 is always chosen."),
      value: proGate(!!sp.polarised_training) },
    { id: "replan", title: tr("Daily Adaptive Replan"), sentence: tr("Recalibrates your plan each morning based on your check-in."),
      value: proGate(!!s.dailyReplan) },
    { id: "rest", title: tr("Rest days"), sentence: tr("Marked days automatically become rest days. You can always start a session by hand."),
      value: listValue(rest, "Not set", tr) },
  ];
}
