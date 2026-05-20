// ─── SHARED PLAN / DISPLAY UTILITIES ─────────────────────────────────────────
// Pure helpers shared across Dashboard, WorkoutView, HistoryView, PlanWeekView.

export function getUserId() {
  return localStorage.getItem("jf_user_id");
}

export function getToken() {
  return localStorage.getItem("jf_token");
}

export function getJwtPayload(token) {
  try {
    const b64 = token?.split('.')[1];
    if (!b64) return null;
    return JSON.parse(atob(b64.replace(/-/g, '+').replace(/_/g, '/')));
  } catch { return null; }
}

// Display label for a military cluster (KB / K1–K6 / O1–O6)
export function milClL(track, cluster) {
  if (track === 'keuring') return cluster === 0 ? 'KB' : `K${cluster}`;
  return `O${cluster}`;
}

// Format a duration in seconds to a compact human-readable string
export function formatExDuration(sec) {
  if (!sec) return null;
  if (sec < 60) return `${sec}s`;
  const rawMin = sec / 60;
  if (rawMin > 20) return `${Math.ceil(rawMin / 5) * 5} min`;
  return `${Math.ceil(rawMin)} min`;
}

// Estimate session length in minutes from a plan object
export function estimateMins(p) {
  if (!p || p.slot_type === "rest") return null;
  const steps = p.steps ?? [];
  if (!steps.length) return p.slot_type === "micro" ? 12 : 20;
  const totalSec = steps.reduce((s, step, i) => {
    const sets = step.sets ?? 3;
    const isLast = i === steps.length - 1;
    const active = step.target_duration_sec
      ? step.target_duration_sec * sets
      : (step.target_reps ?? 10) * sets * 4;
    const restPeriods = isLast ? Math.max(0, sets - 1) : sets;
    const rest = (step.rest_sec ?? 45) * restPeriods;
    return s + active + rest;
  }, 0);
  const rawMin = Math.max(1, Math.ceil(totalSec / 60));
  return rawMin > 20 ? Math.ceil(rawMin / 5) * 5 : rawMin;
}

// Derive primary/secondary muscle groups from exercise data for MuscleMap rendering
export function musclesFor(ex) {
  const tryParse = (s) => { try { return JSON.parse(s || "[]"); } catch { return []; } };
  const primary = tryParse(ex?.primary_muscles_json);
  const secondary = tryParse(ex?.secondary_muscles_json);
  if (primary.length || secondary.length) return { primary, secondary };
  const slug = (ex?.exercise_slug || ex?.name || "").toLowerCase();
  const has = (s) => slug.includes(s);
  if (has("bench") || has("push-up") || has("pushup") || has("dip"))
    return { primary: ["chest", "triceps"], secondary: ["delts_front", "core"] };
  if (has("squat"))
    return { primary: ["quads", "glutes"], secondary: ["hamstrings", "core", "lower_back"] };
  if (has("deadlift") || has("rdl") || has("romanian"))
    return { primary: ["hamstrings", "glutes", "lower_back"], secondary: ["traps", "forearms"] };
  if (has("row"))
    return { primary: ["lats", "traps"], secondary: ["biceps", "delts_rear"] };
  if (has("pull-up") || has("pullup") || has("chin"))
    return { primary: ["lats", "biceps"], secondary: ["traps", "delts_rear", "forearms"] };
  if (has("press") || has("overhead") || has("shoulder-press"))
    return { primary: ["delts_front", "triceps"], secondary: ["traps", "core"] };
  if (has("curl"))
    return { primary: ["biceps"], secondary: ["forearms"] };
  if (has("lunge") || has("split-squat") || has("step-up"))
    return { primary: ["quads", "glutes"], secondary: ["hamstrings", "calves", "core"] };
  if (has("plank"))
    return { primary: ["abs", "obliques"], secondary: ["delts_front", "glutes"] };
  if (has("sit-up") || has("crunch"))
    return { primary: ["abs"], secondary: ["obliques"] };
  if (has("kettlebell") || has("swing"))
    return { primary: ["glutes", "hamstrings"], secondary: ["lower_back", "core", "delts_front"] };
  if (has("hip-thrust") || has("glute-bridge"))
    return { primary: ["glutes"], secondary: ["hamstrings", "core"] };
  if (has("calf"))
    return { primary: ["calves"], secondary: [] };
  if (has("lateral-raise"))
    return { primary: ["delts_front", "delts_rear"], secondary: ["traps"] };
  if (has("face-pull") || has("rear-delt"))
    return { primary: ["delts_rear"], secondary: ["traps"] };
  if (has("run") || has("jog") || has("sprint") || has("cycling") || has("bike"))
    return { primary: ["quads", "hamstrings", "calves"], secondary: ["glutes", "core"] };
  return { primary: [], secondary: [] };
}
