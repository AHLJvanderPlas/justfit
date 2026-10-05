// Shared parts of the two exercise sheets: SessionBuilder (plan TARGETS for today)
// and LogSessionSheet (record what was DONE on a date). Classes only — styles.css.
import { useState } from "react";
import { t } from "./i18n.js";

const ALWAYS_OWNED = ["none", "chair"];
const parse = (s, d) => { try { return JSON.parse(s || d) ?? JSON.parse(d); } catch { return JSON.parse(d); } };
const equipOf = (ex) => parse(ex?.equipment_required_json, '["none"]');

export function Sheet({ title, sub = null, label, onClose, padded = false, sheetRef = null, children }) {
  return (
    <div className="jf-sheet-scrim" onClick={onClose}>
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={label ?? title}
        onClick={(e) => e.stopPropagation()}
        className={`jf-sheet${padded ? " jf-sheet--padded" : ""}`}
      >
        <div className="jf-sheet__handle" />
        <div className="jf-sheet__head">
          <div className="jf-sheet__title">
            {title}
            {sub && <span className="jf-sheet__sub">{sub}</span>}
          </div>
          <button type="button" aria-label={t("Close")} onClick={onClose} className="jf-icon-btn">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Library search. Filtered by the profile's kit by default; "Toon alles" lifts it,
// because the user's circumstances today may differ from their profile.
// `mark(ex)` → { label, on } for the right-hand marker of each result.
export function ExercisePicker({ library, loadError, prefs, onPick, mark, inputRef = null }) {
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const owned = new Set([...(prefs?.preferences?.available_equipment ?? ["none"]), ...ALWAYS_OWNED]);
  const q = query.trim().toLowerCase();
  const results = (library ?? [])
    .filter((ex) => showAll || equipOf(ex).every((e) => owned.has(e)))
    .filter((ex) => !q || ex.name?.toLowerCase().includes(q) || ex.slug?.includes(q))
    .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""))
    .slice(0, 40);

  return (
    <>
      <div className="jf-pick__search">
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("Search exercises…")}
          aria-label={t("Search exercises…")}
          className="jf-pick__input"
        />
        <button type="button" aria-pressed={showAll} onClick={() => setShowAll((v) => !v)} className={`jf-chip${showAll ? " jf-chip--on" : ""}`}>
          {t("Show all")}
        </button>
      </div>
      <div className="jf-pick__filter">{showAll ? t("All equipment") : t("Filtered on your equipment")}</div>
      <div className="jf-pick__list">
        {loadError && <div className="jf-pick__msg jf-pick__msg--error">{t("Could not load the exercise library.")}</div>}
        {!library && !loadError && <div className="jf-pick__msg">{t("Loading…")}</div>}
        {library && results.length === 0 && (
          <div className="jf-pick__msg">{showAll ? t("Nothing matches.") : t("Nothing matches your equipment — try Show all.")}</div>
        )}
        {results.map((ex) => {
          const kit = equipOf(ex).filter((e) => !ALWAYS_OWNED.includes(e));
          const m = mark(ex);
          return (
            <button key={ex.id} type="button" onClick={() => onPick(ex)} className={`jf-pick__item${m.active ? " jf-pick__item--on" : ""}`}>
              <span className="jf-pick__text">
                <span className="jf-pick__name">{ex.name}</span>
                <span className="jf-pick__meta">{t(ex.category ?? "")}{kit.length ? ` · ${kit.join(", ").replace(/_/g, " ")}` : ""}</span>
              </span>
              <span className={`jf-pick__mark${m.on ? " jf-pick__mark--on" : ""}`}>{m.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
