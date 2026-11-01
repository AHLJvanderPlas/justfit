// UAT release 3 — the week pill on Voortgang. "ACHTERSTAND" in red after a single
// session on day one is a verdict the user has not earned. The pill is neutral
// ("Nog n te gaan") in the first seven days since the first activity and whenever
// the week's count is on pace for the days elapsed; red only from the second week,
// on Thursday or later.
//   target        sessions per week
//   done          sessions counted this week
//   weekday       1 = Monday … 7 = Sunday
//   daysSinceFirst days since the first activity (0 = first day, or no activity yet)
// Returns { kind: 'on-track' | 'togo' | 'building' | 'behind', toGo }.
export const FIRST_WEEK_DAYS = 7;
export const BEHIND_FROM_WEEKDAY = 4;   // Thursday

export function weekdayMondayFirst(date = new Date()) {
  return ((date.getDay() + 6) % 7) + 1;
}

export function weekPill({ target, done, weekday, daysSinceFirst }) {
  const tgt = Math.max(1, Number(target) || 1);
  const d = Math.max(0, Number(done) || 0);
  const toGo = Math.max(0, tgt - d);
  if (toGo === 0) return { kind: 'on-track', toGo };
  const firstWeek = (Number(daysSinceFirst) || 0) < FIRST_WEEK_DAYS;
  const onPace = d >= Math.floor((tgt * Math.min(7, Math.max(1, Number(weekday) || 1))) / 7);
  if (firstWeek || onPace || (Number(weekday) || 1) < BEHIND_FROM_WEEKDAY) return { kind: 'togo', toGo };
  return { kind: d >= Math.ceil(tgt * 0.6) ? 'building' : 'behind', toGo };
}
