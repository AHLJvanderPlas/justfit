// UAT release 3 — one source for the body-mode numbers. The pregnancy banner said
// "Week 21 of your pregnancy" over a milestone that began "Week 20 · Halfway there";
// the postnatal one said "Day 56 after birth" over "Week 6". Both lines are now
// built from the same helper, and a milestone carries only its message — the number
// in front of it is the helper's, not a literal that goes stale until the next one.
const DAY_MS = 86_400_000;
const dayNumber = (d) => Math.floor(Date.parse(`${String(d).slice(0, 10)}T00:00:00Z`) / DAY_MS);

/** Pregnancy week, 1-based (the server's own: functions/api/profile.js), capped at 42; null before conception. */
export function pregnancyWeek(dueDate, today) {
  if (!dueDate || !today) return null;
  const days = dayNumber(today) - (dayNumber(dueDate) - 280);
  if (!(days >= 0)) return null;
  return Math.min(Math.floor(days / 7) + 1, 42);
}

/** Days since the birth (0 on the day); null for a future or missing date. */
export function postnatalDays(birthDate, today) {
  if (!birthDate || !today) return null;
  const days = dayNumber(today) - dayNumber(birthDate);
  return days >= 0 ? days : null;
}

/** Completed weeks since the birth: day 42 → 6, day 56 → 8. */
export function postnatalWeek(birthDate, today) {
  const days = postnatalDays(birthDate, today);
  return days == null ? null : Math.floor(days / 7);
}

export const PREGNANCY_MILESTONES = [
  { week: 4,  msg: "Your baby is the size of a poppy seed. Movement is good — keep it gentle." },
  { week: 8,  msg: "First trimester well underway. Listen to your body — rest counts too." },
  { week: 13, msg: "Welcome to the second trimester. Energy often improves from here." },
  { week: 16, msg: "Time to move away from exercises lying flat on your back." },
  { week: 20, msg: "Halfway there. Your sessions are adapting with you." },
  { week: 24, msg: "Pelvic floor work pays dividends now and after birth." },
  { week: 28, msg: "Third trimester begins. Slower and steadier — you're doing brilliantly." },
  { week: 32, msg: "Breathlessness is normal. Short breaks are part of the session." },
  { week: 36, msg: "Practise your labour breathing — it's the most useful thing now." },
  { week: 40, msg: "Due any day. Movement can help — rest when you need to." },
];

// `clearance: true` is the midwife/GP prompt — it shows only while no clearance is recorded.
export const POSTNATAL_MILESTONES = [
  { day: 3,   msg: "Rest and pelvic floor breathing. That's everything right now." },
  { day: 7,   msg: "Gentle heel slides and pelvic tilts are a great start." },
  { day: 14,  msg: "Your body is healing quietly. Every breath counts." },
  { day: 42,  msg: "Time to check in with your midwife or GP about exercise clearance.", clearance: true },
  { day: 84,  msg: "Core rebuilding is underway. Take it one week at a time." },
  { day: 140, msg: "Great progress. Strength is returning." },
  { day: 182, msg: "You're in the returning phase. Full programme available when you're ready." },
];

/** The latest pregnancy milestone reached at `week`, or null. */
export function pregnancyMilestone(week) {
  return [...PREGNANCY_MILESTONES].reverse().find((m) => week >= m.week) ?? null;
}

/** The latest postnatal milestone reached at `days`; the clearance prompt is skipped once cleared. */
export function postnatalMilestone(days, cleared = false) {
  const m = [...POSTNATAL_MILESTONES].reverse().find((x) => days >= x.day) ?? null;
  return m && m.clearance && cleared ? null : m;
}

/** Number label in front of a postnatal milestone: "Day 5" in the first week, then "Week 8". */
export function postnatalLabel(days) {
  return days < 7 ? { key: "Day {n}", n: days } : { key: "Week {n}", n: Math.floor(days / 7) };
}
