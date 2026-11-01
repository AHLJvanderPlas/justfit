// The check-in payload, and when the check-in asks (UAT release 6).
//
// One builder for both entry points: the sheet (CheckInModal, every signal) and the
// mood row on Today ("Hoe voel je je?" — one tap). A tap on the row sends exactly what
// the sheet sends for "mood → Toepassen" with nothing else touched, so the planner
// (R511–R513, R559, the free adapt path) cannot tell the two apart. App.handleCheckIn
// stores it and builds or adapts today's plan with it once (UAT D4).

// The three moods → the stored numbers (CheckInModal F8 mapping; 0–10 scale).
export const MOOD_MAP = {
  1: { mood: 2, stress: 8, motivation: 2 },
  2: { mood: 6, stress: 5, motivation: 5 },
  3: { mood: 9, stress: 2, motivation: 9 },
};

export const MOOD_OPTIONS = [
  { val: 1, label: "Not great" },
  { val: 2, label: "Okay" },
  { val: 3, label: "Good" },
];

const NO_PREGNANCY = { nausea: false, breathless: false, pelvic_discomfort: false };
const NO_POSTNATAL = { running_today: false, heaviness: false };

export function buildCheckinPayload({
  feeling = 2, chips = [], location = "home", freeText = "",
  painScope = null, painAreas = [], pregnancySignals = NO_PREGNANCY, postnatalSignals = NO_POSTNATAL,
  timeBudget = null,
} = {}) {
  const m = MOOD_MAP[feeling] ?? MOOD_MAP[2];
  const hasPain = chips.includes("pain");
  return {
    mood: m.mood,
    stress: m.stress,
    energy: chips.includes("low_energy") ? 3 : 5,
    sleep_hours: chips.includes("poor_sleep") ? 4 : null,
    checkin_json: {
      no_clothing: false,
      no_gear: false,
      no_time: chips.includes("zero_time"),
      equipment_profile_id: location,
      // Kept in sync for older cached clients and any consumer still reading it.
      gym_today: location === "gym",
      traveling: false,
      recovery_mode: chips.includes("taking_easy"),
      pain_level: hasPain ? 3 : 0,
      pain_scope: hasPain ? painScope : null,
      pain_areas: hasPain ? painAreas : [],
      period_today: chips.includes("period"),
      free_text: freeText,
      motivation: m.motivation,
      time_budget: timeBudget,
      pregnancy_signals: pregnancySignals,
      postnatal_signals: postnatalSignals,
    },
  };
}

// Today's session length: the per-weekday schedule when it is on, else the default.
export function defaultTimeBudget(prefs, date = new Date()) {
  const fallback = prefs?.session_duration_min ?? 45;
  if (prefs?.preferences?.schedule_advanced) {
    const dayKey = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][date.getDay()];
    const scheduled = prefs.preferences?.weekly_schedule?.[dayKey];
    return (scheduled != null && scheduled > 0) ? scheduled : fallback;
  }
  return fallback;
}

export function lastLocation() {
  try { return localStorage.getItem("jf_last_location") || "home"; } catch { return "home"; }
}

// Set on the day onboarding finishes: that day's check-in is the mood row on Today,
// not a sheet in front of a Today that does not exist yet.
export const QUICK_CHECKIN_KEY = "jf_quick_checkin";

// Should the sheet open by itself? "every_time" always; "once_a_day" until today's
// check-in is done — except on the onboarding day; "manual" never.
export function autoOpenCheckin({ mode = "once_a_day", checkedInDate = null, quickDate = null, today }) {
  if (mode === "every_time") return true;
  if (mode !== "once_a_day") return false;
  if (checkedInDate === today) return false;
  return quickDate !== today;
}

// Is the mood row on Today? Whenever today's check-in is still open, the user asked to be
// prompted (not "manual"), and the day's session is not done yet.
export function quickCheckinVisible({ mode = "once_a_day", checkedInDate = null, today, todayCompleted = false, hasPlan = true }) {
  if (mode === "manual" || todayCompleted || !hasPlan) return false;
  return checkedInDate !== today;
}

export const todayISO = () => new Date().toISOString().split("T")[0];
export function readCheckinDate() {
  try { return localStorage.getItem("jf_checkin_date"); } catch { return null; }
}
