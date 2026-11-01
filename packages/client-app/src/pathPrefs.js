// The training path (General / Running / Cycling / Military) as data (UAT release 6).
//
// Two places ask for it: the goal step of onboarding (Algemeen is the default for the
// five general goals; Hardlopen / Fietsen / Militair are cards in the same step) and
// PathChoiceModal ("Wijzig pad" in Settings, and existing users without a
// primary_intent). Both write the same preferences through the same call, built here,
// so a path chosen in onboarding is stored exactly like one chosen in the modal.

export const SPORT_PATHS = ["running", "cycling", "military"];

export const DEFAULT_PATH_DETAILS = {
  runKm: 5,
  cycleSubgoal: "build_fitness",
  milTrack: "keuring",
  milMode: "target",
  milTargetDate: "",
};

export const RUN_KM_OPTIONS = [5, 10, 15, 20, 30];

// The question each follow-up asks (English key; t() at render).
export const PATH_INTRO = {
  running: "What distance are you training for?",
  cycling: "What's your primary cycling goal?",
  military: "Choose your track and mode.",
};

// Onboarding's steps: the follow-up only after a sport path was tapped on the goal step.
export function onboardingSteps(pathKey, touched) {
  return ["waiver", "goal", ...(touched && SPORT_PATHS.includes(pathKey) ? ["path"] : []), "about", "setup"];
}

// The preferences a path writes — byte for byte what PathChoiceModal has always saved.
export function pathPreferences(intent, details = {}, nowMs = Date.now()) {
  const d = { ...DEFAULT_PATH_DETAILS, ...details };
  if (intent === "running") {
    return { primary_intent: "running", run_coach: { enrolled: true, target_km: d.runKm, week: 1, session_in_week: 0 }, sport_prefs: { sports: ["running"], primary: "running" } };
  }
  if (intent === "cycling") {
    return { primary_intent: "cycling", cycling_coach: { active: true, sub_goal: d.cycleSubgoal, week: 1 }, sport_prefs: { sports: ["cycling"], primary: "cycling" } };
  }
  if (intent === "military") {
    return { primary_intent: "military", military_coach: { active: true, track: d.milTrack, mode: d.milMode,
      cluster_current: d.milTrack === "keuring" ? 0 : 1, cluster_target: 3,
      target_date: d.milTargetDate || null, block_session_index: 0, block_number: 1, enrolled_at_ms: nowMs } };
  }
  return { primary_intent: "general" };
}

export async function savePath(api, token, intent, details) {
  await api.saveProfile(token, { preferences: pathPreferences(intent, details) });
  return intent;
}

// Lock only on a KNOWN "not Pro": a day-1 trial user must never meet the paywall (UAT D5).
export function pathLocked(key, { isPro = false, entitlementKnown = false } = {}) {
  return key === "cycling" && !!entitlementKnown && !isPro;
}

// What onboarding writes when it finishes: the path when the user chose one on the goal
// step, or the default (general) when the account has none yet. A re-done onboarding
// that never touched the goal step leaves the stored path — and its coach progress — alone.
export function onboardingPathToSave({ existingIntent = null, pathKey = "general", touched = false }) {
  if (!touched && existingIntent) return null;
  return SPORT_PATHS.includes(pathKey) ? pathKey : "general";
}

// After onboarding: the first run builds today's plan through the normal start-up (the
// profile already holds the path); a re-done onboarding that changed the path must
// replan today like the path modal does (applyPathChoice, UAT D3).
export function onboardingReplan({ firstRun, savedIntent }) {
  return !firstRun && !!savedIntent;
}
