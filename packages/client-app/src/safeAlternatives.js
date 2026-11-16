// Finding 0 (UI/UX review 2026-11-16) — the alternatives sheet never offers a swap that
// loads an area that hurts today, and never dead-ends.
//
// The areas are the plan's own (`injury_areas`: today's check-in pain ∪ chronic, set by the
// planner's R562) plus the profile's chronic areas, in case the plan predates the field.
// Each library row from GET /api/exercises carries `load_areas` (the planner's load model,
// functions/api/_shared/injuryLoad.js); a row without it (an older offline cache) is asked
// of the same model here, so there is still one definition of "loads".
import { loadAreas } from "../../../functions/api/_shared/injuryLoad.js";

export function injuryAreasOf(plan, prefs) {
  const fromPlan = Array.isArray(plan?.injury_areas) ? plan.injury_areas : [];
  const chronic = prefs?.preferences?.chronic_injury_areas;
  return [...new Set([...fromPlan, ...(Array.isArray(chronic) ? chronic : [])])];
}

export function safeAlternatives(alternatives, areas) {
  const list = Array.isArray(alternatives) ? alternatives : [];
  if (!areas?.length) return list;
  return list.filter((alt) => {
    const loads = Array.isArray(alt?.load_areas) ? new Set(alt.load_areas) : loadAreas(alt);
    return !areas.some((a) => loads.has(a));
  });
}
