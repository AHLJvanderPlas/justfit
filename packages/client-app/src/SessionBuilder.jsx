// ─── W4.2 — "Ik doe iets anders": the session builder ──────────────────────────
//
// The planner is a default, not a gate. When the check-in vocabulary does not fit
// the day — a hotel gym with one bench, a training partner's programme, a
// physio's prescription — the user builds today's session from the library, or
// pins 1–3 exercises and lets the coach fill the rest (W4.4).
//
// Library exercises only (v1): progression resolves axes through exercise_id, so
// a library-backed session counts for progression, streak and awards exactly like
// a generated one. Safety ADVISES here, it does not edit: the server returns
// notes, which render amber on the exercise they concern; a blocking note (R539,
// pregnancy hard contraindication) asks for an explicit acknowledgement.
//
// Principle 7: one thumb, glanceable. Add, nudge, go — not a settings screen.
//
// This sheet plans TARGETS for today. Recording what was DONE on a date is
// LogSessionSheet.jsx (need C) — a different job with a different shape.
import { useState, useEffect, useRef } from "react";
import { estimateMins } from "./planUtils.js";
import { getDefaultRest } from "../../../functions/api/_shared/session.js";
import { RULE_LABELS } from "./messagePolicy.js";
import { t } from "./i18n.js";
import api from "./apiClient.js";
import { Sheet, ExercisePicker } from "./sessionSheet.jsx";

// Mirrors the server's CUSTOM_STEP_LIMITS; the server clamps again regardless.
const LIM = { sets: [1, 10], reps: [1, 100], duration: [5, 7200], rest: [0, 600] };
const MAX_STEPS = 20;
const MAX_PINS = 3;

const parse = (s, d) => { try { return JSON.parse(s || d) ?? JSON.parse(d); } catch { return JSON.parse(d); } };
const clamp = (v, [lo, hi]) => Math.min(hi, Math.max(lo, Math.round(v)));

// Pre-fill only — the planner's own rest for a main session, so the live
// estimate is honest before the server has seen the session.
const defaultRest = (ex) => getDefaultRest(ex, "main");

// One builder row. `st` is a saved template step (W4.3) when the sheet was
// opened from "Mijn trainingen"; without it the row is pre-filled from the library.
function rowFor(ex, key, st = null) {
  const m = parse(ex.metrics_json, "{}");
  const supports = m.supports ?? [];
  const supportsReps = supports.includes("reps");
  const useTime = st?.target_duration_sec != null ? true : st?.target_reps != null ? false : !supportsReps;
  return {
    key, ex,
    canToggle: supportsReps && (supports.includes("time") || !!m.base_duration_sec),
    useTime,
    sets: clamp(st?.sets ?? m.fixed_sets ?? 3, LIM.sets),
    reps: clamp(st?.target_reps ?? 10, LIM.reps),
    duration: clamp(st?.target_duration_sec ?? m.base_duration_sec ?? 30, LIM.duration),
    rest: clamp(st?.rest_sec ?? defaultRest(ex), LIM.rest),
  };
}

function fmtSec(sec) {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60), s = sec % 60;
  return s ? `${m}:${String(s).padStart(2, "0")}` : `${m} min`;
}

function noteText(n) {
  const label = RULE_LABELS[n.code];
  return label ? t(label.text) : n.code;
}

function Stepper({ label, value, display: shown, onDec, onInc }) {
  return (
    <div className="jf-stepper">
      <span className="jf-stepper__label">{label}</span>
      <div className="jf-stepper__row">
        <button type="button" aria-label={`${label} −`} onClick={onDec} className="jf-stepper__btn">−</button>
        <span className="jf-stepper__value">{shown ?? value}</span>
        <button type="button" aria-label={`${label} +`} onClick={onInc} className="jf-stepper__btn">+</button>
      </div>
    </div>
  );
}

function NoteCard({ note }) {
  return (
    <div className="jf-note">
      <div className="jf-note__head">{note.blocking ? t("Needs your confirmation") : t("Coach advice")}</div>
      <div className="jf-note__text">{t("The coach would normally leave this out:")} {noteText(note)}</div>
    </div>
  );
}

// `template` (W4.3): open preloaded from a saved training, offering "Sjabloon
// bijwerken". `initialNotes`: the safety notes of a 409 from a one-tap use, so
// the acknowledgement is asked here, where the notes have context.
// `onStart` ("Eigen training → Samenstellen", MANUAL_TRAINING_DESIGN §3): the
// primary action is "Starten" and installs nothing — it hands the session to
// the run-mode choice, which asks the server (and any acknowledgement) itself.
// Pinning is an engine re-plan of today, so it is not offered there.
export default function SessionBuilder({ prefs, today, onClose, onInstalled, template = null, initialNotes = null, onTemplateSaved, onStart = null }) {
  const startMode = typeof onStart === "function";
  const [library, setLibrary] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [mode, setMode] = useState("build");  // 'build' | 'pin'
  const [steps, setSteps] = useState([]);
  const [pins, setPins] = useState([]);
  const [notes, setNotes] = useState(initialNotes ?? []);
  const [needsAck, setNeedsAck] = useState(!!initialNotes?.some((n) => n.blocking));
  const [ack, setAck] = useState(false);
  const [saved, setSaved] = useState(null);           // { assessmentOffer, pinsRemoved }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const keyRef = useRef(0);
  // W4.3 — the saved training this sheet edits (null: a new one).
  const [tpl, setTpl] = useState(template);
  const [tplOpen, setTplOpen] = useState(false);
  const [tplName, setTplName] = useState(template?.name ?? "");
  const [tplBusy, setTplBusy] = useState(false);
  const [tplMsg, setTplMsg] = useState(null);          // { err, text }
  const [dropped, setDropped] = useState(0);

  useEffect(() => {
    let alive = true;
    api.getLibrary()
      .then((rows) => {
        if (!alive) return;
        setLibrary(rows);
        if (template?.steps?.length) {
          // A saved step whose exercise left the library is dropped, and said so —
          // the server would reject the whole session otherwise.
          const byId = new Map(rows.map((ex) => [String(ex.id), ex]));
          const pre = [];
          for (const st of template.steps) {
            const ex = byId.get(String(st.exercise_id));
            if (!ex) continue;
            keyRef.current += 1;
            pre.push(rowFor(ex, keyRef.current, st));
          }
          setSteps(pre);
          if (pre.length !== template.steps.length) {
            // Notes are indexed by position; they no longer line up.
            setDropped(template.steps.length - pre.length);
            setNotes([]); setNeedsAck(false);
          }
        }
      })
      .catch(() => { if (alive) setLoadError(true); });
    return () => { alive = false; };
  }, [template]);

  // Any change to the session invalidates notes from the last save attempt —
  // they are indexed by step position.
  const resetSafety = () => { setNotes([]); setNeedsAck(false); setAck(false); setError(null); };

  const addStep = (ex) => {
    if (steps.length >= MAX_STEPS) return;
    keyRef.current += 1;
    const row = rowFor(ex, keyRef.current);
    setSteps((s) => [...s, row]);
    resetSafety();
  };
  const patch = (key, fn) => { setSteps((s) => s.map((st) => (st.key === key ? { ...st, ...fn(st) } : st))); resetSafety(); };
  const move = (i, d) => {
    setSteps((s) => {
      const j = i + d;
      if (j < 0 || j >= s.length) return s;
      const out = s.slice();
      [out[i], out[j]] = [out[j], out[i]];
      return out;
    });
    resetSafety();
  };
  const remove = (key) => { setSteps((s) => s.filter((st) => st.key !== key)); resetSafety(); };
  const togglePin = (id) => {
    setPins((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= MAX_PINS ? p : [...p, id]));
    setError(null);
  };

  const customSteps = steps.map((s) => ({
    exercise_id: s.ex.id, sets: s.sets, rest_sec: s.rest,
    ...(s.useTime ? { target_duration_sec: s.duration } : { target_reps: s.reps }),
  }));
  // The same estimator the Today card uses, so the number here is the number there.
  const estimate = steps.length ? estimateMins({ slot_type: "main", steps: customSteps }) : null;
  const budget = prefs?.session_duration_min ?? 30;
  const overBudget = estimate != null && estimate > budget;

  // ── Actions ─────────────────────────────────────────────────────────────
  const save = async (includeAssessment = false) => {
    setBusy(true); setError(null);
    let res;
    try {
      res = await api.installCustomSession(today, { steps: customSteps, sessionName: tpl?.name ?? t("My training"), safetyAck: ack, includeAssessment });
    } catch {
      setBusy(false); setError(t("Could not save your session — check your connection and try again.")); return;
    }
    setBusy(false);
    const { status, data } = res;
    if (status === 409) { setNotes(data.safety_notes ?? []); setNeedsAck(true); return; }
    if (status !== 200 || !data.ok) {
      setError(data.error === "unknown_exercise"
        ? t("One of these exercises is no longer in the library — remove it and try again.")
        : t("Could not save your session — check your connection and try again."));
      return;
    }
    onInstalled(data.plan);
    const n = data.safety_notes ?? [];
    setNotes(n);
    if (!includeAssessment && (n.length || data.assessment_offer)) setSaved({ assessmentOffer: !!data.assessment_offer });
    else onClose();
  };

  // W4.3 — store what the user built. Nothing is installed; using a saved
  // training later goes through the same POST /api/plan as "Use today".
  const saveTemplate = async (asNew) => {
    const name = tplName.trim();
    if (!name) { setTplMsg({ err: true, text: t("Give your training a name.") }); return; }
    setTplBusy(true); setTplMsg(null);
    let res;
    try { res = await api.saveMySession({ id: asNew ? undefined : tpl?.id, name, steps: customSteps }); } catch { res = { status: 0, data: {} }; }
    setTplBusy(false);
    const { status, data } = res;
    if (status === 200 && data.ok) {
      setTpl(data.template); setTplName(data.template.name); setTplOpen(false);
      setTplMsg({ err: false, text: t("Saved in My trainings.") });
      onTemplateSaved?.(data.template);
      return;
    }
    const text = data.error === "template_limit" ? t("You have {n} saved trainings — delete one first.", { n: data.limit ?? 30 })
      : data.error === "invalid_name" ? t("Give your training a name (max 60 characters).")
      : data.error === "unknown_exercise" ? t("One of these exercises is no longer in the library — remove it and try again.")
      : data.error === "not_found" ? t("This training no longer exists — save it as a new one.")
      : t("Could not save your training — check your connection and try again.");
    if (data.error === "not_found") setTpl(null);
    setTplMsg({ err: true, text });
  };

  const fill = async () => {
    setBusy(true); setError(null);
    let res;
    try { res = await api.pinAndFill(today, pins); } catch { res = { status: 0, data: {} }; }
    setBusy(false);
    const { status, data } = res;
    if (status !== 200 || !data.ok) { setError(t("Could not build the session — check your connection and try again.")); return; }
    if (data.plan?.capped) {
      setError(t("Letting the coach fill in is a Pro feature. You can still build the whole session yourself."));
      return;
    }
    onInstalled(data.plan);
    if (data.plan?.pins_removed?.length) setSaved({ pinsRemoved: data.plan.pins_removed });
    else onClose();
  };

  const libById = new Map((library ?? []).map((ex) => [ex.id, ex]));
  const sessionNotes = notes.filter((n) => n.step_index == null);
  const chip = (on, extra = "") => `jf-chip${on ? " jf-chip--on" : ""}${extra ? ` ${extra}` : ""}`;
  const mark = (ex) => {
    if (mode === "pin") { const p = pins.includes(ex.id); return { label: p ? t("Pinned") : t("Pin"), on: p, active: p }; }
    const added = steps.some((s) => s.ex.id === ex.id);
    return { label: added ? "+1" : "+", on: added, active: false };
  };

  // ── Saved state: notes and the R598 offer, then done ────────────────────
  let body;
  if (saved) {
    body = (
      <div className="jf-sb-saved">
        <div className="jf-sb-saved__title">{t("Ready for today")}</div>
        {saved.pinsRemoved ? (
          <>
            <p className="jf-sb-saved__text">{t("The coach filled in your session. Some pins were left out for your safety:")}</p>
            {saved.pinsRemoved.map((r) => (
              <div key={r.exercise_id} className="jf-sb-saved__item">
                <div className="jf-sb-saved__name">{libById.get(r.exercise_id)?.name ?? r.exercise_slug}</div>
                {r.code
                  ? <NoteCard note={{ code: r.code, blocking: false }} />
                  : <div className="jf-sb-saved__guard">{r.guard === "rest_day" ? t("Today is a rest day.") : t("Your coach programme sets today's session.")}</div>}
              </div>
            ))}
          </>
        ) : (
          <>
            {notes.length > 0 && <p className="jf-sb-saved__text">{t("Your session is saved as you built it. Keep these in mind:")}</p>}
            {notes.map((n, i) => (
              <div key={i}>
                {n.step_index != null && <div className="jf-sb-saved__name jf-sb-saved__name--spaced">{steps[n.step_index]?.ex.name ?? n.exercise_slug}</div>}
                <NoteCard note={n} />
              </div>
            ))}
            {saved.assessmentOffer && (
              <div className="jf-sb-offer">
                <div className="jf-sb-offer__title">{t("Your self-measurement is due")}</div>
                <div className="jf-sb-offer__text">{t("Add two max-effort sets (push-ups and sit-ups, 2 minutes each) to the end of this session?")}</div>
                <button type="button" disabled={busy} onClick={() => save(true)} className={chip(true, "jf-chip--wide")}>
                  {busy ? t("Adding…") : t("Add self-measurement")}
                </button>
              </div>
            )}
          </>
        )}
        {error && <div className="jf-sheet__error">{error}</div>}
        <button type="button" onClick={onClose} className="jf-primary">{t("Done")}</button>
      </div>
    );
  } else {
    body = (
      <>
        {!startMode && <div className="jf-sb-modes">
          <button type="button" onClick={() => { setMode("build"); setError(null); }} className={chip(mode === "build", "jf-chip--grow")}>{t("Build it myself")}</button>
          <button type="button" onClick={() => { setMode("pin"); setError(null); }} className={chip(mode === "pin", "jf-chip--grow")}>{t("Pin + coach fills")}</button>
        </div>}
        <p className="jf-sheet__intro">
          {mode === "build"
            ? t("Pick exercises from the library. They count for your progress like any session.")
            : t("Pin up to 3 exercises you want today. The coach completes the session around them.")}
        </p>

        <ExercisePicker library={library} loadError={loadError} prefs={prefs}
          onPick={(ex) => (mode === "build" ? addStep(ex) : togglePin(ex.id))} mark={mark} />

        {/* Build mode: the session */}
        {mode === "build" && (
          <>
            <div className="jf-sheet__eyebrow">{t("Your session")}</div>
            {dropped > 0 && (
              <div className="jf-sb-warn">{t("{n} exercise(s) from this training are no longer in the library and were left out.", { n: dropped })}</div>
            )}
            {sessionNotes.map((n, i) => <NoteCard key={`s${i}`} note={n} />)}
            {steps.length === 0 && <div className="jf-sheet__empty">{t("Tap an exercise above to add it.")}</div>}
            {steps.map((s, i) => (
              <div key={s.key} className="jf-sb-step">
                <div className="jf-sb-step__head">
                  <span className="jf-sb-step__num">{i + 1}</span>
                  <span className="jf-sb-step__name">{s.ex.name}</span>
                  <button type="button" className="jf-icon-btn" aria-label={t("Move up")} disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
                  <button type="button" className="jf-icon-btn" aria-label={t("Move down")} disabled={i === steps.length - 1} onClick={() => move(i, 1)}>↓</button>
                  <button type="button" className="jf-icon-btn" aria-label={t("Remove")} onClick={() => remove(s.key)}>×</button>
                </div>
                <div className="jf-sb-steppers">
                  <Stepper label={t("Sets")} value={s.sets}
                    onDec={() => patch(s.key, (st) => ({ sets: clamp(st.sets - 1, LIM.sets) }))}
                    onInc={() => patch(s.key, (st) => ({ sets: clamp(st.sets + 1, LIM.sets) }))} />
                  {s.useTime ? (
                    <Stepper label={t("Time")} value={s.duration} display={fmtSec(s.duration)}
                      onDec={() => patch(s.key, (st) => ({ duration: clamp(st.duration - (st.duration > 120 ? 30 : 5), LIM.duration) }))}
                      onInc={() => patch(s.key, (st) => ({ duration: clamp(st.duration + (st.duration >= 120 ? 30 : 5), LIM.duration) }))} />
                  ) : (
                    <Stepper label={t("Reps")} value={s.reps}
                      onDec={() => patch(s.key, (st) => ({ reps: clamp(st.reps - 1, LIM.reps) }))}
                      onInc={() => patch(s.key, (st) => ({ reps: clamp(st.reps + 1, LIM.reps) }))} />
                  )}
                  <Stepper label={t("Rest")} value={s.rest} display={fmtSec(s.rest)}
                    onDec={() => patch(s.key, (st) => ({ rest: clamp(st.rest - 15, LIM.rest) }))}
                    onInc={() => patch(s.key, (st) => ({ rest: clamp(st.rest + 15, LIM.rest) }))} />
                </div>
                {s.canToggle && (
                  <button type="button" className="jf-link" onClick={() => patch(s.key, (st) => ({ useTime: !st.useTime }))}>
                    {s.useTime ? t("Count reps instead") : t("Use time instead")}
                  </button>
                )}
                {notes.filter((n) => n.step_index === i).map((n, k) => <NoteCard key={k} note={n} />)}
              </div>
            ))}
          </>
        )}

        {/* Pin mode: what is pinned */}
        {mode === "pin" && (
          <div className="jf-sb-pins">
            <div className="jf-sheet__eyebrow">{t("Pinned")} · {pins.length}/{MAX_PINS}</div>
            {pins.length === 0
              ? <div className="jf-sheet__empty">{t("Tap up to 3 exercises above to pin them.")}</div>
              : (
                <div className="jf-sb-pins__chips">
                  {pins.map((id) => (
                    <button key={id} type="button" onClick={() => togglePin(id)} className={chip(true)}>
                      {libById.get(id)?.name ?? id} ×
                    </button>
                  ))}
                </div>
              )}
          </div>
        )}

        {needsAck && mode === "build" && (
          <label className="jf-sb-ack">
            <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="jf-sb-ack__box" />
            <span className="jf-sb-ack__text">{t("I have read the advice above and choose this session myself.")}</span>
          </label>
        )}
        {error && <div className="jf-sheet__error">{error}</div>}
      </>
    );
  }

  // ── W4.3: the second, quieter action — save as / update a template ─────
  const templatePanel = tplOpen ? (
    <div className="jf-sb-tpl">
      <input
        type="text"
        value={tplName}
        maxLength={60}
        autoFocus
        onChange={(e) => { setTplName(e.target.value); setTplMsg(null); }}
        placeholder={t("Name of your training")}
        aria-label={t("Name of your training")}
        className="jf-sb-tpl__input"
      />
      <div className="jf-sb-tpl__actions">
        <button type="button" disabled={tplBusy || !steps.length} onClick={() => saveTemplate(false)} className={chip(true, "jf-chip--tall jf-chip--grow")}>
          {tplBusy ? t("Saving…") : tpl ? t("Update template") : t("Save")}
        </button>
        {tpl && (
          <button type="button" disabled={tplBusy || !steps.length} onClick={() => saveTemplate(true)} className={chip(false, "jf-chip--tall")}>
            {t("Save as new")}
          </button>
        )}
        <button type="button" onClick={() => { setTplOpen(false); setTplMsg(null); }} className={chip(false, "jf-chip--tall")}>{t("Cancel")}</button>
      </div>
      {tplMsg && <div className={`jf-sb-tpl__msg${tplMsg.err ? " jf-sb-tpl__msg--err" : ""}`}>{tplMsg.text}</div>}
    </div>
  ) : (
    <>
      <button type="button" disabled={!steps.length} onClick={() => { setTplOpen(true); setTplMsg(null); }} className="jf-sb-quiet">
        {tpl ? t("Update template") : t("Save as template")}
      </button>
      {tplMsg && <div className={`jf-sb-tpl__msg jf-sb-tpl__msg--center${tplMsg.err ? " jf-sb-tpl__msg--err" : ""}`}>{tplMsg.text}</div>}
    </>
  );

  // ── Footer (sticky): estimate + the one primary action ──────────────────
  const canSave = mode === "build" && steps.length > 0 && !busy && (!needsAck || ack);
  const canFill = mode === "pin" && pins.length > 0 && !busy;
  const footer = saved ? null : (
    <div className="jf-sheet__footer">
      {mode === "build" && (
        <div className="jf-sb-estimate">
          <span className={`jf-sb-estimate__value${overBudget ? " jf-sb-estimate__value--over" : ""}`}>
            {estimate != null ? `≈ ${estimate} min` : "—"}
          </span>
          <span className="jf-sb-estimate__budget">{t("your time")} {budget} min</span>
        </div>
      )}
      {startMode ? (
        <button type="button" disabled={!steps.length} onClick={() => onStart({ steps: customSteps, name: tpl?.name ?? t("My training"), template: tpl })} className="jf-primary">
          {t("Start now")}
        </button>
      ) : mode === "build" ? (
        <button type="button" disabled={!canSave} onClick={() => save(false)} className="jf-primary">
          {busy ? t("Saving…") : needsAck ? t("Confirm and use today") : t("Use today")}
        </button>
      ) : (
        <button type="button" disabled={!canFill} onClick={fill} className="jf-primary">
          {busy ? t("Building…") : t("Let the coach fill in the rest")}
        </button>
      )}
      {mode === "build" && templatePanel}
    </div>
  );

  return (
    <Sheet title={t("Your own training")} onClose={onClose} padded={!!saved}>
      {body}
      {footer}
    </Sheet>
  );
}
