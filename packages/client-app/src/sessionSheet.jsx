// Shared parts of the two exercise sheets: SessionBuilder (plan TARGETS for today)
// and LogSessionSheet (record what was DONE on a date). Classes only — styles.css.
import { useState, useEffect, useRef } from "react";
import { t, exerciseName } from "./i18n.js";
import { ALWAYS_OWNED, CATEGORY_CHIPS, equipOf, isTest, filterLibrary, emptyMessage, chipsOnFor, sheetKit } from "./exerciseSearch.js";
import { EQUIPMENT_OPTIONS } from "./appConstants.js";

// v1.4 — Escape closes the sheet, and focus moves to its title on open so a
// screen reader starts at the top. Focus is not trapped: the sheet is a bottom
// sheet over a page that stays usable behind the scrim.
export function Sheet({ title, sub = null, label, onClose, padded = false, sheetRef = null, children }) {
  const titleRef = useRef(null);
  useEffect(() => {
    const el = titleRef.current;
    // A field that asked for focus itself (autoFocus) keeps it.
    if (el && !el.closest(".jf-sheet")?.contains(document.activeElement)) el.focus({ preventScroll: true });
  }, []);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
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
          <div className="jf-sheet__title" ref={titleRef} tabIndex={-1}>
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

// ── v1.4 — one row for numbers, in both sheets ──────────────────────────────
// `[sets] × [value] @ [rest] s`: three 44 px fields, numeric keypad. The log sheet
// renders one per set group (and "+ Rij"); the builder exactly one per exercise.
// Parsing is the caller's (logSession.js rowGroups / targetRow) — this only shows.
// onChange(field, text) and onBlur(field) with field "sets" | "value" | "rest";
// errors = { sets, value, rest } booleans; labels = the three fields' aria-labels.
export function SetRow({ sets, value, rest, unit, onChange, onBlur = null, errors = {}, showRemove = false, removeDisabled = false, onRemove = null, labels }) {
  const cls = (f, extra = "") => `jf-log-val${extra}${errors[f] ? " jf-log-val--bad" : ""}`;
  const field = (f) => ({
    value: f === "sets" ? sets : f === "rest" ? rest : value,
    onChange: (e) => onChange(f, e.target.value),
    onBlur: onBlur ? () => onBlur(f) : undefined,
    // One tap selects the number, so 10 → 20 is that tap and two digits.
    onFocus: (e) => e.target.select(),
    "aria-label": labels[f],
    "aria-invalid": errors[f] ? true : undefined,
  });
  return (
    <div className="jf-log-row">
      <input className={cls("sets")} type="text" inputMode="numeric" pattern="[0-9]*" {...field("sets")} />
      <span className="jf-log-sym" aria-hidden="true">×</span>
      {/* decimal, not numeric: the iOS numeric pad has no comma, and "10, 10, 8" is the shorthand */}
      <input className={cls("value", " jf-log-val--value")} type="text" inputMode="decimal"
        placeholder={unit === "sec" ? t("sec (unit)") : t("reps (unit)")} {...field("value")} />
      {unit === "sec" && <span className="jf-log-sym" aria-hidden="true">s</span>}
      <span className="jf-log-sym" aria-hidden="true">@</span>
      <input className={cls("rest")} type="text" inputMode="numeric" pattern="[0-9]*" {...field("rest")} />
      <span className="jf-log-sym" aria-hidden="true">s</span>
      {showRemove && (
        <button type="button" className="jf-icon-btn" aria-label={labels.remove} disabled={removeDisabled} onClick={onRemove}>×</button>
      )}
    </div>
  );
}

// Reps / Tijd — shown only where an exercise supports both. Switching converts
// nothing: the number in the value field stays, only its unit changes.
export function UnitChips({ unit, onChange }) {
  return (
    <div className="jf-log-unit" role="group" aria-label={t("Count in")}>
      {[["reps", t("Reps")], ["sec", t("Time")]].map(([u, label]) => (
        <button key={u} type="button" aria-pressed={unit === u} className={`jf-chip${unit === u ? " jf-chip--on" : ""}`}
          onClick={() => onChange(u)}>{label}</button>
      ))}
    </div>
  );
}

// Card chrome: "⋯" (reorder lives behind it) and "×" — both 44 px to the thumb.
export function ItemActions({ name, open, onMore, onRemove }) {
  return (
    <>
      <button type="button" className="jf-icon-btn" aria-label={t("More {name}", { name })} aria-expanded={open} onClick={onMore}>⋯</button>
      <button type="button" className="jf-icon-btn" aria-label={t("Remove {name}", { name })} onClick={onRemove}>×</button>
    </>
  );
}

export function MoveActions({ first, last, onUp, onDown }) {
  return (
    <div className="jf-move-row">
      <button type="button" className="jf-move-btn" disabled={first} onClick={onUp}><span aria-hidden="true">↑ </span>{t("Up")}</button>
      <button type="button" className="jf-move-btn" disabled={last} onClick={onDown}><span aria-hidden="true">↓ </span>{t("Down")}</button>
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
                    <span className="jf-pick__name">{exerciseName(ex)}</span>
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
