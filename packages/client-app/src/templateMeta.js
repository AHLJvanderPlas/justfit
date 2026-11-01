// v1.2 — what a saved training's row says: which exercises it holds (names line,
// from GET /api/my-sessions `step_names` / `step_names_nl`) and "≈ 12 min · 3 oefeningen · laatst
// gedaan di 28 okt" (`last_done_at` is the date of the latest execution started
// from the template, or null). Shared by the Coach card and Hergebruiken.
import { t, getLang, exerciseName } from "./i18n.js";
import { logDayLabel } from "./logSession.js";

export function templateMeta(tpl) {
  const n = tpl.steps?.length ?? 0;
  const parts = [];
  if (tpl.est_minutes != null) parts.push(`≈ ${tpl.est_minutes} min`);
  parts.push(n === 1 ? t("1 exercise") : t("{n} exercises", { n }));
  if (tpl.last_done_at) parts.push(t("last done {date}", { date: logDayLabel(tpl.last_done_at, getLang()) }));
  return parts.join(" · ");
}

// "Push-up · Plank · Air Squat" ("Opdrukken · Plank · Squat zonder gewicht" in
// Dutch — v1.5 `step_names_nl`, same rows, null where a row has no Dutch name),
// or null when the server sent no names.
export const templateNames = (tpl) => (tpl.step_names?.length
  ? tpl.step_names.map((name, i) => exerciseName({ name, name_nl: tpl.step_names_nl?.[i] })).join(" · ")
  : null);
