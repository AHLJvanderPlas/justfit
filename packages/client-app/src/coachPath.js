// coach-dcp R2 review — the PATH, decided and worded once. Settings → Doel & coach's
// JE PAD card and Voortgang's weekly card ("Doel: …") both read it, so they cannot
// disagree. `t` is injected (the caller passes i18n's t) to keep this module pure.
import { milClL } from "./planUtils.js";
import { CYCLE_SUBGOAL_LABELS } from "./messagePolicy.js";
import { GOALS } from "./appConstants.js";

/** The path: the primary intent when its coach is active, else the first active coach, else general. */
export function activeCoachOf(prefs) {
  const p = prefs?.preferences ?? {};
  const on = {
    running: !!(p.run_coach?.enrolled && !p.run_coach?.completed),
    cycling: !!(p.cycling_coach?.active && !p.cycling_coach?.completed),
    military: !!p.military_coach?.active,
  };
  if (on[p.primary_intent]) return p.primary_intent;
  return on.running ? "running" : on.cycling ? "cycling" : on.military ? "military" : "general";
}

/**
 * What the path aims at: "Keuring K3" / "10 km" / "Fietsen · Conditie opbouwen" /
 * "Algemene gezondheid". This is the "Doel: …" on Voortgang.
 */
export function pathGoal(prefs, t = (k) => k) {
  const p = prefs?.preferences ?? {};
  const coach = activeCoachOf(prefs);
  if (coach === "military") {
    const mil = p.military_coach ?? {};
    const track = mil.track ?? "keuring";
    const trackName = track === "opleiding" ? t("Educational Fitness") : t("Physical Assessment");
    return mil.mode === "open" ? `${trackName} · ${t("Open")}` : `${trackName} ${milClL(track, mil.cluster_target ?? (track === "keuring" ? 3 : 1))}`;
  }
  if (coach === "running") return `${p.run_coach?.target_km ?? 5} km`;
  if (coach === "cycling") return `${t("Cycling")} · ${t(CYCLE_SUBGOAL_LABELS[p.cycling_coach?.sub_goal ?? "build_fitness"] ?? "Build fitness")}`;
  return t(GOALS.find((g) => g.value === (prefs?.training_goal ?? "health"))?.label ?? "General Health");
}

/** The JE PAD title: the coach plus its goal ("Militair · Keuring K3", "Hardlopen · 10 km"). */
export function pathTitle(prefs, t = (k) => k) {
  const coach = activeCoachOf(prefs);
  const goal = pathGoal(prefs, t);
  if (coach === "military") return `${t("Military")} · ${goal}`;
  if (coach === "running") return `${t("Running")} · ${goal}`;
  return goal;
}
