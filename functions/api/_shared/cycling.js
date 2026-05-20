// Cycling Coach helpers
// Protocol-to-workout conversion, block periodization, TSS calculation, autoregulation.
// Primary source: workout_protocols + workout_protocol_steps.
// Fallback source: cycling_workouts table (retained — not yet retired).

// Cycling Coach helpers
// ---------------------------------------------------------------------------

// Convert workout_protocols + workout_protocol_steps JOIN rows into
// the same in-memory shape as cycling_workouts rows so R557 is unchanged.
export function buildCyclingWorkoutsFromProtocols(rows) {
  const map = {};
  for (const r of rows) {
    if (!map[r.wp_id]) {
      const tags = JSON.parse(r.tags_json || '[]');
      const sgTag = tags.find(t => t.startsWith('sub_goal:'));
      const wtTag = tags.find(t => t.startsWith('workout_type:'));
      map[r.wp_id] = {
        id: r.wp_id,
        slug: r.slug,
        name: r.name,
        sub_goal: sgTag ? sgTag.slice(9) : 'build_fitness',
        workout_type: wtTag ? wtTag.slice(13) : 'endurance',
        steps: [],
      };
    }
    map[r.wp_id].steps.push(r);
  }
  return Object.values(map).map(({ id, slug, name, sub_goal, workout_type, steps }) => {
    const intervals = steps
      .sort((a, b) => a.step_order - b.step_order)
      .map(s => {
        const intensity = JSON.parse(s.intensity_json || '{}');
        const notes = JSON.parse(s.notes_json || '{}');
        const iv = {
          label: notes.label ?? s.step_type,
          duration_sec: s.duration_sec,
          power_pct_low: intensity.power_pct_low ?? 50,
          power_pct_high: intensity.power_pct_high ?? 70,
          sets: s.sets ?? 1,
        };
        if (notes.min_sets != null) iv.min_sets = notes.min_sets;
        if (notes.max_sets != null) iv.max_sets = notes.max_sets;
        return iv;
      });
    const duration_min = Math.round(
      intervals.reduce((s, iv) => s + iv.duration_sec * (iv.sets ?? 1), 0) / 60
    );
    return { id, slug, name, sub_goal, workout_type, duration_min, intervals_json: JSON.stringify(intervals) };
  });
}

// 3-session weekly rotation per sub_goal: [session0_type, session1_type, session2_type]
export const CYCLING_PROFILES = {
  build_fitness: ['endurance', 'sweet_spot', 'endurance'],
  climbing:      ['endurance', 'threshold',  'vo2max'],
  sprint:        ['endurance', 'anaerobic',  'endurance'],
  aerobic_base:  ['endurance', 'endurance',  'endurance'],
  race_fitness:  ['endurance', 'vo2max',     'endurance'],
};

// 7-week block cycle (21 sessions): weeks 1-2=base, 3-6=build, 7=recovery
export function getCyclingBlockPhase(totalSessions) {
  const positionInCycle = totalSessions % 21;
  const weekInCycle = Math.floor(positionInCycle / 3) + 1;
  if (weekInCycle <= 2) return 'base';
  if (weekInCycle <= 6) return 'build';
  return 'recovery';
}

// TSS from intervals_json array (formula: (dur/3600) * IF² * 100 * sets)
export function calcCyclingTSS(intervals) {
  return Math.round(intervals.reduce((sum, iv) => {
    const IF = (iv.power_pct_low + iv.power_pct_high) / 2 / 100;
    return sum + (iv.duration_sec / 3600) * IF * IF * 100 * (iv.sets ?? 1);
  }, 0) * 10) / 10;
}

// Scale steps that have min_sets/max_sets to fit available time
export function scaleCyclingIntervals(intervals, timeBudgetMin) {
  if (!timeBudgetMin) return intervals;
  const scalable = intervals.filter(iv => iv.min_sets != null && iv.max_sets != null);
  if (!scalable.length) return intervals;
  const fixedSec = intervals
    .filter(iv => iv.min_sets == null)
    .reduce((s, iv) => s + iv.duration_sec * (iv.sets ?? 1), 0);
  const availSec = Math.max(0, timeBudgetMin * 60 - fixedSec);
  const oneCycleSec = scalable.reduce((s, iv) => s + iv.duration_sec, 0);
  if (oneCycleSec <= 0) return intervals;
  const targetSets = Math.max(
    scalable[0].min_sets,
    Math.min(scalable[0].max_sets, Math.round(availSec / oneCycleSec))
  );
  return intervals.map(iv => iv.min_sets == null ? iv : { ...iv, sets: targetSets });
}

// Compute current TSB (CTL − ATL) from raw execution rows (same EMA as cycling-pmc.js)
export function computeCyclingTsb(tssRows, planDate) {
  if (!tssRows?.length) return null;
  const tssMap = {};
  for (const row of tssRows) {
    tssMap[row.date] = (tssMap[row.date] ?? 0) + (row.tss_actual ?? row.tss_planned ?? 0);
  }
  const ctlDecay = Math.exp(-1 / 42);
  const atlDecay = Math.exp(-1 / 7);
  let ctl = 0, atl = 0;
  const cur = new Date(tssRows[0].date + 'T00:00:00Z');
  const end = new Date(planDate + 'T00:00:00Z');
  while (cur <= end) {
    const d = cur.toISOString().slice(0, 10);
    const tss = tssMap[d] ?? 0;
    ctl = ctl * ctlDecay + tss * (1 - ctlDecay);
    atl = atl * atlDecay + tss * (1 - atlDecay);
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return Math.round((ctl - atl) * 10) / 10;
}

// Build a coaching note describing target watts or HR for the main interval
export function buildCyclingCoachNote(workout, scaledIntervals, cycleCoach) {
  const ftp = cycleCoach.ftp_watts ?? 200;
  const isWatts = (cycleCoach.unit ?? 'watts') === 'watts';
  const maxHr = cycleCoach.max_hr ?? 180;
  const mainIv = scaledIntervals.find(iv =>
    !iv.label.toLowerCase().includes('warm') &&
    !iv.label.toLowerCase().includes('cool') &&
    !iv.label.toLowerCase().includes('recovery') &&
    !iv.label.toLowerCase().includes('pyramid recovery') &&
    !iv.label.toLowerCase().includes('block recovery')
  );
  if (!mainIv) return workout.name;
  const sets = mainIv.sets ?? 1;
  const durMin = Math.round(mainIv.duration_sec / 60);
  const prefix = sets > 1 && mainIv.duration_sec >= 60
    ? `${sets}×${durMin}min ` : sets > 1 ? `${sets} efforts ` : '';
  if (isWatts) {
    const wLo = Math.round(ftp * mainIv.power_pct_low / 100);
    const wHi = Math.round(ftp * mainIv.power_pct_high / 100);
    return `${workout.name}: ${prefix}${wLo}–${wHi}W (${mainIv.power_pct_low}–${mainIv.power_pct_high}% FTP).`;
  } else {
    const hLo = Math.round(maxHr * mainIv.power_pct_low / 100);
    const hHi = Math.round(maxHr * mainIv.power_pct_high / 100);
    return `${workout.name}: ${prefix}${hLo}–${hHi} bpm (${mainIv.power_pct_low}–${mainIv.power_pct_high}% max HR).`;
  }
}

// ---------------------------------------------------------------------------
