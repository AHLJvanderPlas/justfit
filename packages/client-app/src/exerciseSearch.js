// ─── Exercise search — what the picker lists, and why it may be empty ──────────
//
// Pure: ExercisePicker (sessionSheet.jsx) renders; the decisions live here so
// tests/exerciseSearch.test.js can pin them. v1.1 only fixes the MISS message;
// the ordering (alphabetical, 40 rows) is unchanged on purpose.

import { t } from "./i18n.js";

export const ALWAYS_OWNED = ["none", "chair"];
const parse = (s, d) => { try { return JSON.parse(s || d) ?? JSON.parse(d); } catch { return JSON.parse(d); } };
export const equipOf = (ex) => parse(ex?.equipment_required_json, '["none"]');

// `owned` is a Set (or array) of the equipment the profile has; none and chair
// are always owned. Returns what to list and what the query found anywhere:
//   matchedAny   — some exercise in the whole library fits the query
//   matchedOwned — some exercise that fits the query is also inside the kit
export function filterLibrary(library, { query = "", owned = [], showAll = false } = {}) {
  const kit = new Set([...owned, ...ALWAYS_OWNED]);
  const q = String(query ?? "").trim().toLowerCase();
  const matches = (library ?? []).filter((ex) => !q || ex.name?.toLowerCase().includes(q) || ex.slug?.includes(q));
  const inKit = (ex) => equipOf(ex).every((e) => kit.has(e));
  const results = matches
    .filter((ex) => showAll || inKit(ex))
    .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""))
    .slice(0, 40);
  return { results, matchedAny: matches.length > 0, matchedOwned: matches.some(inKit) };
}

// The (translated) text for an empty list.
// A kit message is only true when something DID match outside the kit.
export function emptyMessage({ query = "", showAll = false, matchedAny = false, matchedOwned = false } = {}) {
  const q = String(query ?? "").trim();
  if (q && !matchedAny) return t("No exercise found for '{q}'", { q });
  if (!showAll && matchedAny && !matchedOwned) return t("Nothing matches your equipment — try Show all.");
  return t("Nothing found.");
}
