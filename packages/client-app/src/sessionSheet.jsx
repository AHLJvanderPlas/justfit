// Shared parts of the two exercise sheets: SessionBuilder (plan TARGETS for today)
// and LogSessionSheet (record what was DONE on a date). Classes only — styles.css.
import { useState } from "react";
import { t } from "./i18n.js";
import { ALWAYS_OWNED, CATEGORY_CHIPS, equipOf, isTest, filterLibrary, emptyMessage, chipsOnFor, sheetKit } from "./exerciseSearch.js";
import { EQUIPMENT_OPTIONS } from "./appConstants.js";

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

// Library search (v1.3). With an empty query the list opens on what the user is
// most likely to want — today's plan, recent, saved trainings — then the library
// by category, test protocols last. Category chips narrow it; kit chips say what
// the user has TODAY (pre-selected from the profile, this sheet only — never
// written back). "Toon alles" selects every chip and lifts the kit filter.
// `mark(ex)` → { label, on } for the right-hand marker of each result.
const KIT_CHIPS = EQUIPMENT_OPTIONS.filter((o) => !ALWAYS_OWNED.includes(o.value));
const CHIP_VALUES = KIT_CHIPS.map((o) => o.value);

export function ExercisePicker({ library, loadError, prefs, onPick, mark, inputRef = null, context = null }) {
  const profileKit = prefs?.preferences?.available_equipment ?? ["none"];
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [category, setCategory] = useState("all");
  const [chipsOn, setChipsOn] = useState(() => chipsOnFor(profileKit, CHIP_VALUES));
  const owned = sheetKit(profileKit, CHIP_VALUES, chipsOn);
  const { sections, shown, total, matchedAny, matchedOwned } = filterLibrary(library, { query, owned, showAll, category, context: context ?? {} });
  const toggleChip = (v) => {
    // Under "Toon alles" every chip shows on: switching one off leaves the rest on.
    const base = showAll ? CHIP_VALUES : chipsOn;
    setShowAll(false);
    setChipsOn(base.includes(v) ? base.filter((c) => c !== v) : [...base, v]);
  };

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
      <div className="jf-pick__chips" role="group" aria-label={t("Category")}>
        {CATEGORY_CHIPS.map((c) => (
          <button key={c.key} type="button" aria-pressed={category === c.key} onClick={() => setCategory(c.key)}
            className={`jf-chip${category === c.key ? " jf-chip--on" : ""}`}>{t(c.label)}</button>
        ))}
      </div>
      <div className="jf-pick__chips" role="group" aria-label={t("Equipment today")}>
        {KIT_CHIPS.map((o) => {
          const on = showAll || chipsOn.includes(o.value);
          return (
            <button key={o.value} type="button" aria-pressed={on} onClick={() => toggleChip(o.value)}
              className={`jf-chip${on ? " jf-chip--on" : ""}`}>{t(o.label)}</button>
          );
        })}
      </div>
      <div className="jf-pick__list">
        {loadError && <div className="jf-pick__msg jf-pick__msg--error">{t("Could not load the exercise library.")}</div>}
        {!library && !loadError && <div className="jf-pick__msg">{t("Loading…")}</div>}
        {library && total === 0 && (
          <div className="jf-pick__msg">{emptyMessage({ query, showAll, matchedAny, matchedOwned })}</div>
        )}
        {sections.map((sec) => (
          <div key={sec.key} className="jf-pick__group">
            {sec.label && <div className="jf-pick__sec">{t(sec.label)}</div>}
            {sec.rows.map((ex) => {
              const kit = equipOf(ex).filter((e) => !ALWAYS_OWNED.includes(e));
              const m = mark(ex);
              return (
                <button key={ex.id} type="button" onClick={() => onPick(ex)} className={`jf-pick__item${m.active ? " jf-pick__item--on" : ""}`}>
                  <span className="jf-pick__text">
                    <span className="jf-pick__name">{ex.name}</span>
                    <span className="jf-pick__meta">
                      {t(ex.category ?? "")}{kit.length ? ` · ${kit.join(", ").replace(/_/g, " ")}` : ""}
                      {isTest(ex) && <> · <span className="jf-pick__test">{t("TEST")}</span></>}
                    </span>
                  </span>
                  <span className={`jf-pick__mark${m.on ? " jf-pick__mark--on" : ""}`}>{m.label}</span>
                </button>
              );
            })}
          </div>
        ))}
        {shown < total && <div className="jf-pick__cap">{t("{shown} of {total} — search or pick a category", { shown, total })}</div>}
      </div>
    </>
  );
}
