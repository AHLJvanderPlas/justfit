// ─── Need C — "Training loggen": record a session done OUTSIDE the app ─────────
//
// Records what was DONE on `date` (today … today−6) — not a target; that is
// SessionBuilder. Saved through POST /api/execution as session_type 'logged' in
// stepsActualRef's shape (logSession.js), so it counts exactly like an in-app session.
//
// Two phases, because the first version (one row per exercise, sets typed as a
// list) led the product owner to add Push-up five times with one set each:
//   1. WAT — the exercises, in the order performed. Search sits at the BOTTOM of
//      the list, where new items appear; nothing numeric yet.
//   2. HOEVEEL — one card per exercise with SET-GROUP rows (`3 × 3 @ 60 s`). The
//      card's + duplicates the last row, because the common case is "same again"
//      or "one more with one number changed".
// Principle 7: one thumb, glanceable — every value is one tap to a numeric keypad.
import { useState, useEffect, useRef } from "react";
import { getDefaultRest } from "../../../functions/api/_shared/session.js";
import { t, useLang } from "./i18n.js";
import api from "./apiClient.js";
import { rowGroups, expandGroups, buildLogSteps, summarizeLogged, logDayLabel, LOG_MAX_SETS } from "./logSession.js";
import { Sheet, ExercisePicker } from "./sessionSheet.jsx";

const MAX_ITEMS = 20;
const REST_CHIPS = [60, 90, 120];
const parse = (s, d) => { try { return JSON.parse(s || d) ?? JSON.parse(d); } catch { return JSON.parse(d); } };

function itemFor(ex, key, rowKey) {
  const m = parse(ex.metrics_json, "{}");
  const supports = m.supports ?? [];
  const supportsReps = supports.includes("reps");
  const sets = Math.min(LOG_MAX_SETS, Math.max(1, Number(m.fixed_sets) || 3));
  return {
    key, ex,
    canToggle: supportsReps && (supports.includes("time") || !!m.base_duration_sec),
    unit: supportsReps ? "reps" : "sec",
    hint: { reps: "10", sec: String(m.base_duration_sec ?? 30) },
    // Sets and rest pre-filled; the value is left for the user — a record holds
    // what was done, so the one number that differs most is never invented.
    rows: [{ key: rowKey, sets: String(sets), value: "", rest: String(getDefaultRest(ex, "main")) }],
    skipped: false,
  };
}

// A row as the record will read it, or why it cannot be saved yet.
const rowState = (row, unit) => (String(row.value).trim() === "" ? { todo: true } : rowGroups(row, unit));
const unitSuffix = (unit) => (unit === "sec" ? " s" : "");

export default function LogSessionSheet({ prefs, date, onClose, onLogged }) {
  const lang = useLang();
  const [library, setLibrary] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [phase, setPhase] = useState("what");          // 'what' | 'how'
  const [items, setItems] = useState([]);
  const [lastAdded, setLastAdded] = useState(null);
  const [note, setNote] = useState("");
  const [rpe, setRpe] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const keyRef = useRef(0);
  const sheetRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    let alive = true;
    api.getLibrary()
      .then((rows) => { if (alive) setLibrary(rows); })
      .catch(() => { if (alive) setLoadError(true); });
    return () => { alive = false; };
  }, []);

  // A new item appears at the bottom of the list, just above the search it came
  // from; keep it in view.
  useEffect(() => {
    if (lastAdded == null) return;
    document.querySelector(`[data-log-key="${lastAdded}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [lastAdded]);

  const nextKey = () => { keyRef.current += 1; return keyRef.current; };
  const goTo = (p) => { setPhase(p); setError(null); if (sheetRef.current) sheetRef.current.scrollTop = 0; };

  // ── Phase 1 — what ──────────────────────────────────────────────────────
  const add = (ex) => {
    if (items.length >= MAX_ITEMS) return;
    const item = itemFor(ex, nextKey(), nextKey());
    setItems((xs) => [...xs, item]);
    setLastAdded(item.key);
    setError(null);
  };
  const move = (i, d) => setItems((xs) => {
    const j = i + d;
    if (j < 0 || j >= xs.length) return xs;
    const out = xs.slice();
    [out[i], out[j]] = [out[j], out[i]];
    return out;
  });
  const removeItem = (key) => setItems((xs) => xs.filter((x) => x.key !== key));
  const focusSearch = () => {
    searchRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    searchRef.current?.focus({ preventScroll: true });
  };

  // ── Phase 2 — how much ──────────────────────────────────────────────────
  const patchItem = (key, fn) => { setItems((xs) => xs.map((x) => (x.key === key ? { ...x, ...fn(x) } : x))); setError(null); };
  const patchRow = (itemKey, rowKey, p) => patchItem(itemKey, (x) => ({ rows: x.rows.map((r) => (r.key === rowKey ? { ...r, ...p } : r)) }));
  const duplicateLast = (itemKey) => {
    const k = nextKey();
    patchItem(itemKey, (x) => ({ rows: [...x.rows, { ...x.rows[x.rows.length - 1], key: k }] }));
  };
  const removeRow = (itemKey, rowKey) => patchItem(itemKey, (x) => ({ rows: x.rows.length > 1 ? x.rows.filter((r) => r.key !== rowKey) : x.rows }));
  const setAllRest = (itemKey, sec) => patchItem(itemKey, (x) => ({ rows: x.rows.map((r) => ({ ...r, rest: String(sec) })) }));
  // Typed shorthand ("3x3, 2x4" or "10, 10, 8") in a value field becomes rows on
  // blur, so what is on screen is what will be saved.
  const expandShorthand = (item, row) => {
    const v = String(row.value).trim();
    if (v === "" || /^\d+$/.test(v)) return;
    const r = rowGroups(row, item.unit);
    if (!r.groups) return;
    const rows = r.groups.map((g) => ({ key: nextKey(), sets: String(g.sets), value: String(g.value), rest: String(g.rest) }));
    patchItem(item.key, (x) => ({ rows: x.rows.flatMap((rr) => (rr.key === row.key ? rows : [rr])) }));
  };

  const cards = items.map((x) => {
    const x2 = x.skipped ? null : expandGroups(x.rows, x.unit);
    return { item: x, expanded: x2, ok: x.skipped || !!x2?.values };
  });
  const canSave = !busy && items.some((x) => !x.skipped) && cards.every((c) => c.ok);

  const save = async () => {
    setBusy(true); setError(null);
    const steps = buildLogSteps(items.map((x) => ({ exerciseId: x.ex.id, unit: x.unit, groups: x.rows, skipped: x.skipped })));
    let res;
    try { res = await api.logSession(date, { steps, perceivedExertion: rpe, notes: note.trim() || null }); }
    catch { res = { status: 0, data: {} }; }
    setBusy(false);
    if (res.status === 200 && res.data?.ok) { onLogged?.(date); onClose(); return; }
    setError(res.data?.error === "date_out_of_range"
      ? t("You can log a training for today and the 6 days before it.")
      : t("Could not save your training — check your connection and try again."));
  };

  const dayLabel = date ? logDayLabel(date, lang) : "";
  const countFor = (ex) => items.filter((x) => x.ex.id === ex.id).length;
  const phaseBtn = (p, n, label, disabled = false) => (
    <button type="button" aria-current={phase === p ? "step" : undefined} disabled={disabled}
      className={`jf-log-phase${phase === p ? " jf-log-phase--on" : ""}`} onClick={() => goTo(p)}>
      <span className="jf-log-phase__n">{n}</span>{label}
    </button>
  );
  const summary = (c) => {
    if (c.item.skipped) return t("Skipped");
    if (!c.expanded?.values) return null;
    const s = summarizeLogged({ sets_completed: c.expanded.values.length, reps_per_set: c.expanded.values, rest_taken_seconds: c.expanded.rests });
    return `${t(s.sets === 1 ? "{n} set" : "{n} sets", { n: s.sets })} · ${s.values}${unitSuffix(c.item.unit)}${s.rest ? ` @ ${s.rest} s` : ""}`;
  };

  let body;
  let footer;
  if (phase === "what") {
    body = (
      <>
        <p className="jf-sheet__intro">{t("First what you did, in order. Sets and rest come next.")}</p>
        <div className="jf-sheet__eyebrow">{t("What you did")} · {items.length}</div>
        <div className="jf-log-list">
          {items.length === 0 && <div className="jf-sheet__empty">{t("Search below and tap an exercise to add it.")}</div>}
          {items.map((x, i) => (
            <div key={x.key} data-log-key={x.key} className={`jf-log-item${x.key === lastAdded ? " jf-log-item--new" : ""}`}>
              <span className="jf-log-num">{i + 1}</span>
              <span className="jf-log-item__text">
                <span className="jf-log-name">{x.ex.name}</span>
                {summary(cards[i]) && <span className="jf-log-item__sum">{summary(cards[i])}</span>}
              </span>
              <button type="button" className="jf-icon-btn" aria-label={t("Move up")} disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
              <button type="button" className="jf-icon-btn" aria-label={t("Move down")} disabled={i === items.length - 1} onClick={() => move(i, 1)}>↓</button>
              <button type="button" className="jf-icon-btn" aria-label={t("Remove")} onClick={() => removeItem(x.key)}>×</button>
            </div>
          ))}
        </div>
        <ExercisePicker library={library} loadError={loadError} prefs={prefs} inputRef={searchRef} onPick={add}
          mark={(ex) => { const n = countFor(ex); return { label: n ? `+${n + 1}` : "+", on: n > 0, active: false }; }} />
      </>
    );
    footer = (
      <div className="jf-sheet__footer">
        <div className="jf-log-footer-row">
          <button type="button" className="jf-secondary" onClick={focusSearch} disabled={items.length >= MAX_ITEMS}>{t("+ Add exercise")}</button>
          <button type="button" className="jf-primary" disabled={!items.length} onClick={() => goTo("how")}>
            {t("Next")} →
          </button>
        </div>
      </div>
    );
  } else {
    body = (
      <>
        {cards.map((c, i) => {
          const x = c.item;
          return (
            <div key={x.key} className={`jf-log-card${x.skipped ? " jf-log-card--skipped" : ""}`}>
              <div className="jf-log-card__head">
                <span className="jf-log-num">{i + 1}</span>
                <span className="jf-log-name">{x.ex.name}</span>
                <button type="button" aria-pressed={x.skipped} className={`jf-chip jf-log-skip${x.skipped ? " jf-chip--on" : ""}`}
                  onClick={() => patchItem(x.key, (it) => ({ skipped: !it.skipped }))}>
                  {t("Skipped")}
                </button>
              </div>
              {x.skipped ? (
                <div className="jf-log-card__hint">{t("Stays in your record as skipped. Why? Put it in the note below.")}</div>
              ) : (
                <>
                  {x.canToggle && (
                    <div className="jf-log-unit" role="group" aria-label={t("Count in")}>
                      {[["reps", t("Reps")], ["sec", t("Time")]].map(([u, label]) => (
                        <button key={u} type="button" aria-pressed={x.unit === u} className={`jf-chip${x.unit === u ? " jf-chip--on" : ""}`}
                          onClick={() => patchItem(x.key, () => ({ unit: u }))}>{label}</button>
                      ))}
                    </div>
                  )}
                  <div className="jf-log-rows">
                    {x.rows.map((r, ri) => {
                      const st = rowState(r, x.unit);
                      const bad = !!st.error;
                      return (
                        <div key={r.key} className="jf-log-row">
                          <input className={`jf-log-val${st.error === "sets" ? " jf-log-val--bad" : ""}`} type="text" inputMode="numeric" pattern="[0-9]*"
                            aria-label={`${t("Sets")} ${ri + 1}`} value={r.sets} onChange={(e) => patchRow(x.key, r.key, { sets: e.target.value })} />
                          <span className="jf-log-sym">×</span>
                          <input className={`jf-log-val jf-log-val--value${bad && st.error !== "sets" && st.error !== "rest" ? " jf-log-val--bad" : ""}`}
                            type="text" inputMode="decimal" aria-label={`${x.unit === "sec" ? t("Seconds") : t("Reps")} ${ri + 1}`}
                            placeholder={x.hint[x.unit]} value={r.value}
                            onChange={(e) => patchRow(x.key, r.key, { value: e.target.value })}
                            onBlur={() => expandShorthand(x, r)} />
                          {x.unit === "sec" && <span className="jf-log-sym">s</span>}
                          <span className="jf-log-sym">@</span>
                          <input className={`jf-log-val${st.error === "rest" ? " jf-log-val--bad" : ""}`} type="text" inputMode="numeric" pattern="[0-9]*"
                            aria-label={`${t("Rest")} ${ri + 1}`} value={r.rest} onChange={(e) => patchRow(x.key, r.key, { rest: e.target.value })} />
                          <span className="jf-log-sym">s</span>
                          <button type="button" className="jf-icon-btn" aria-label={t("Remove row")} disabled={x.rows.length === 1}
                            onClick={() => removeRow(x.key, r.key)}>×</button>
                        </div>
                      );
                    })}
                  </div>
                  <div className="jf-log-card__tools">
                    <span className="jf-log-card__label">{t("Rest")}</span>
                    {REST_CHIPS.map((sec) => {
                      const on = x.rows.every((r) => String(r.rest).trim() === String(sec));
                      return (
                        <button key={sec} type="button" aria-pressed={on} className={`jf-chip${on ? " jf-chip--on" : ""}`} onClick={() => setAllRest(x.key, sec)}>
                          {sec} s
                        </button>
                      );
                    })}
                    <button type="button" className="jf-log-add" aria-label={t("Add a row like the last one")} onClick={() => duplicateLast(x.key)}>
                      {t("+ Row")}
                    </button>
                  </div>
                  {x.rows.some((r) => { const s = rowState(r, x.unit); return s.error; })
                    ? <div className="jf-log-card__error">{t("Use whole numbers: sets 1–20, rest up to 600 s. Shorthand like 3x3, 2x4 works too.")}</div>
                    : c.expanded?.values
                      ? <div className="jf-log-card__sum">{summary(c)}</div>
                      : c.expanded?.error === "too_many"
                        ? <div className="jf-log-card__error">{t("At most 20 sets per exercise.")}</div>
                        : <div className="jf-log-card__sum jf-log-card__sum--todo">{x.unit === "sec" ? t("Fill in the seconds per set.") : t("Fill in the reps per set.")}</div>}
                </>
              )}
            </div>
          );
        })}

        <label className="jf-log-block">
          <span className="jf-log-field__label">{t("Note")}</span>
          <textarea className="jf-log-textarea" rows={3} maxLength={1000} value={note}
            placeholder={t("How did it go? Anything you skipped, and why?")} onChange={(e) => setNote(e.target.value)} />
        </label>
        <div className="jf-log-field__label">{t("How did it feel? (optional)")}</div>
        <div className="jf-log-rpe" role="group" aria-label={t("How did it feel? (optional)")}>
          {[[3, t("Easy")], [5, t("Just right")], [8, t("Hard")]].map(([v, label]) => (
            <button key={v} type="button" aria-pressed={rpe === v} className={`jf-chip${rpe === v ? " jf-chip--on" : ""}`}
              onClick={() => setRpe((cur) => (cur === v ? null : v))}>{label}</button>
          ))}
        </div>
        {error && <div className="jf-sheet__error">{error}</div>}
      </>
    );
    footer = (
      <div className="jf-sheet__footer">
        <button type="button" className="jf-primary" disabled={!canSave} onClick={save}>
          {busy ? t("Saving…") : t("Save for {date}", { date: dayLabel })}
        </button>
      </div>
    );
  }

  return (
    <Sheet title={t("Log a training")} sub={dayLabel} onClose={onClose} sheetRef={sheetRef}>
      <div className="jf-log-phases">
        {phaseBtn("what", "1", t("Exercises"))}
        {phaseBtn("how", "2", t("Sets & rest"), !items.length)}
      </div>
      {body}
      {footer}
    </Sheet>
  );
}
