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
// mode="log" (need C): the same sheet records a session done OUTSIDE the app, for
// `date` (today … today−6). Per exercise: what was done per set, rest between sets,
// or "Overgeslagen". Saved through POST /api/execution as session_type 'logged' in
// stepsActualRef's shape (logSession.js), so it counts exactly like an in-app session.
import { useState, useEffect, useRef } from "react";
import { C, display, eyebrow, mono } from "./tokens.js";
import { estimateMins } from "./planUtils.js";
import { getDefaultRest } from "../../../functions/api/_shared/session.js";
import { RULE_LABELS } from "./messagePolicy.js";
import { t, useLang } from "./i18n.js";
import api from "./apiClient.js";
import { parseSetList, loggedStep, logDayLabel } from "./logSession.js";

// Mirrors the server's CUSTOM_STEP_LIMITS; the server clamps again regardless.
const LIM = { sets: [1, 10], reps: [1, 100], duration: [5, 7200], rest: [0, 600] };
const MAX_STEPS = 20;
const MAX_PINS = 3;
const ALWAYS_OWNED = ["none", "chair"];

const parse = (s, d) => { try { return JSON.parse(s || d) ?? JSON.parse(d); } catch { return JSON.parse(d); } };
const clamp = (v, [lo, hi]) => Math.min(hi, Math.max(lo, Math.round(v)));
const equipOf = (ex) => parse(ex?.equipment_required_json, '["none"]');

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
  const btn = {
    width: 32, height: 40, borderRadius: 12, border: `1px solid ${C.border}`,
    background: C.bgCard2, color: C.text, fontSize: 18, fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center",
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 0 }}>
      <span style={{ ...mono(9), color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
        <button type="button" aria-label={`${label} −`} onClick={onDec} style={btn}>−</button>
        <span style={{ ...mono(13), color: C.text, minWidth: 30, textAlign: "center", fontWeight: 700 }}>{shown ?? value}</span>
        <button type="button" aria-label={`${label} +`} onClick={onInc} style={btn}>+</button>
      </div>
    </div>
  );
}

function NoteCard({ note }) {
  return (
    <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: 10, background: C.amberDim, border: `1px solid ${C.amberBorder}` }}>
      <div style={{ ...mono(9), color: C.amber, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, marginBottom: 2 }}>
        {note.blocking ? t("Needs your confirmation") : t("Coach advice")}
      </div>
      <div style={{ fontSize: 12, color: C.warningSoft, lineHeight: 1.5, fontWeight: 600 }}>
        {t("The coach would normally leave this out:")} {noteText(note)}
      </div>
    </div>
  );
}

// `template` (W4.3): open preloaded from a saved training, offering "Sjabloon
// bijwerken". `initialNotes`: the safety notes of a 409 from a one-tap use, so
// the acknowledgement is asked here, where the notes have context.
export default function SessionBuilder({ prefs, today, onClose, onInstalled, template = null, initialNotes = null, onTemplateSaved, mode: sheetMode = "plan", date = null, onLogged }) {
  const lang = useLang();
  const isLog = sheetMode === "log";
  const [library, setLibrary] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [mode, setMode] = useState(isLog ? "log" : "build");  // 'build' | 'pin' | 'log'
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
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
  // Log mode — what was done, not a target.
  const [logRows, setLogRows] = useState([]);
  const [logNote, setLogNote] = useState("");
  const [logRpe, setLogRpe] = useState(null);

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

  // ── Library search ──────────────────────────────────────────────────────
  // Filtered by the profile's kit by default; "Toon alles" lifts it, because the
  // user's circumstances today may differ from their profile — the whole point.
  const owned = new Set([...(prefs?.preferences?.available_equipment ?? ["none"]), ...ALWAYS_OWNED]);
  const q = query.trim().toLowerCase();
  const results = (library ?? [])
    .filter((ex) => showAll || equipOf(ex).every((e) => owned.has(e)))
    .filter((ex) => !q || ex.name?.toLowerCase().includes(q) || ex.slug?.includes(q))
    .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""))
    .slice(0, 40);

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

  // ── Log mode rows ───────────────────────────────────────────────────────
  const addLogRow = (ex) => {
    if (logRows.length >= MAX_STEPS) return;
    keyRef.current += 1;
    const r = rowFor(ex, keyRef.current);
    setLogRows((rs) => [...rs, { key: r.key, ex, canToggle: r.canToggle, useTime: r.useTime, text: "", rest: r.rest, skipped: false }]);
    setError(null);
  };
  const patchLog = (key, p) => { setLogRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...p } : r))); setError(null); };
  const moveLog = (i, d) => setLogRows((rs) => {
    const j = i + d;
    if (j < 0 || j >= rs.length) return rs;
    const out = rs.slice();
    [out[i], out[j]] = [out[j], out[i]];
    return out;
  });
  const logParsed = logRows.map((r) => (r.skipped ? { values: [] } : parseSetList(r.text, r.useTime ? "sec" : "reps")));
  // Something must have been done: a session of only skipped exercises is not a record.
  const canLog = isLog && !busy && logRows.some((r) => !r.skipped) && logParsed.every((p) => p.values);
  const saveLog = async () => {
    setBusy(true); setError(null);
    const logSteps = logRows.map((r) => loggedStep({ exerciseId: r.ex.id, setsText: r.text, unit: r.useTime ? "sec" : "reps", restSec: r.rest, skipped: r.skipped }));
    let res;
    try { res = await api.logSession(date, { steps: logSteps, perceivedExertion: logRpe, notes: logNote.trim() || null }); }
    catch { res = { status: 0, data: {} }; }
    setBusy(false);
    if (res.status === 200 && res.data?.ok) { onLogged?.(date); onClose(); return; }
    setError(res.data?.error === "date_out_of_range"
      ? t("You can log a training for today and the 6 days before it.")
      : t("Could not save your training — check your connection and try again."));
  };
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

  // ── Styles ──────────────────────────────────────────────────────────────
  const chip = (on) => ({
    padding: "8px 14px", borderRadius: 99, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
    border: `1px solid ${on ? "var(--accent-border)" : C.border}`,
    background: on ? "var(--accent-dim)" : "transparent",
    color: on ? "var(--accent)" : C.muted,
  });
  const primary = (enabled) => ({
    width: "100%", height: 52, borderRadius: 16, border: "none", fontFamily: "inherit",
    ...display(17, 800), letterSpacing: "0.02em",
    background: enabled ? "var(--accent)" : C.subtle, color: enabled ? C.onAccent : C.muted,
    cursor: enabled ? "pointer" : "not-allowed",
  });
  const iconBtn = {
    width: 36, height: 36, borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent",
    color: C.muted, cursor: "pointer", fontSize: 15, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center",
  };
  const libById = new Map((library ?? []).map((ex) => [ex.id, ex]));
  const sessionNotes = notes.filter((n) => n.step_index == null);

  // ── Saved state: notes and the R598 offer, then done ────────────────────
  let body;
  if (saved) {
    body = (
      <div style={{ padding: "8px 0 4px" }}>
        <div style={{ ...display(26, 900), color: C.text, textTransform: "uppercase", marginBottom: 6 }}>{t("Ready for today")}</div>
        {saved.pinsRemoved ? (
          <>
            <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.5, marginBottom: 8 }}>
              {t("The coach filled in your session. Some pins were left out for your safety:")}
            </p>
            {saved.pinsRemoved.map((r) => (
              <div key={r.exercise_id} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{libById.get(r.exercise_id)?.name ?? r.exercise_slug}</div>
                {r.code
                  ? <NoteCard note={{ code: r.code, blocking: false }} />
                  : <div style={{ fontSize: 12, color: C.muted }}>{r.guard === "rest_day" ? t("Today is a rest day.") : t("Your coach programme sets today's session.")}</div>}
              </div>
            ))}
          </>
        ) : (
          <>
            {notes.length > 0 && (
              <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.5, marginBottom: 4 }}>
                {t("Your session is saved as you built it. Keep these in mind:")}
              </p>
            )}
            {notes.map((n, i) => (
              <div key={i}>
                {n.step_index != null && <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginTop: 8 }}>{steps[n.step_index]?.ex.name ?? n.exercise_slug}</div>}
                <NoteCard note={n} />
              </div>
            ))}
            {saved.assessmentOffer && (
              <div style={{ marginTop: 16, padding: 14, borderRadius: 14, background: C.bgCard, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4 }}>{t("Your self-measurement is due")}</div>
                <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, marginBottom: 10 }}>
                  {t("Add two max-effort sets (push-ups and sit-ups, 2 minutes each) to the end of this session?")}
                </div>
                <button type="button" disabled={busy} onClick={() => save(true)} style={{ ...chip(true), width: "100%", padding: "12px 14px" }}>
                  {busy ? t("Adding…") : t("Add self-measurement")}
                </button>
              </div>
            )}
          </>
        )}
        {error && <div style={{ fontSize: 12, color: C.danger, marginTop: 10 }}>{error}</div>}
        <button type="button" onClick={onClose} style={{ ...primary(true), marginTop: 18 }}>{t("Done")}</button>
      </div>
    );
  } else {
    body = (
      <>
        {/* Mode switch — not in log mode, which has one job */}
        {isLog ? (
          <p className="jf-log-intro">{t("Fill in what you did. It counts for your progress on that day.")}</p>
        ) : (<>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button type="button" onClick={() => { setMode("build"); setError(null); }} style={{ ...chip(mode === "build"), flex: 1 }}>{t("Build it myself")}</button>
          <button type="button" onClick={() => { setMode("pin"); setError(null); }} style={{ ...chip(mode === "pin"), flex: 1 }}>{t("Pin + coach fills")}</button>
        </div>
        <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, margin: "0 0 10px" }}>
          {mode === "build"
            ? t("Pick exercises from the library. They count for your progress like any session.")
            : t("Pin up to 3 exercises you want today. The coach completes the session around them.")}
        </p>
        </>)}

        {/* Search */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("Search exercises…")}
            aria-label={t("Search exercises…")}
            style={{ flex: 1, minWidth: 0, padding: "11px 14px", borderRadius: 14, border: `1px solid ${C.border}`, background: C.bgCard, color: C.text, fontSize: 14, fontFamily: "inherit", outline: "none" }}
          />
          <button type="button" aria-pressed={showAll} onClick={() => setShowAll((v) => !v)} style={chip(showAll)}>{t("Show all")}</button>
        </div>
        <div style={{ ...mono(10), color: C.faint, marginBottom: 6 }}>
          {showAll ? t("All equipment") : t("Filtered on your equipment")}
        </div>
        <div style={{ maxHeight: 210, overflowY: "auto", borderRadius: 12, border: `1px solid ${C.border}`, marginBottom: 14 }}>
          {loadError && <div style={{ padding: 14, fontSize: 12, color: C.danger }}>{t("Could not load the exercise library.")}</div>}
          {!library && !loadError && <div style={{ padding: 14, fontSize: 12, color: C.muted }}>{t("Loading…")}</div>}
          {library && results.length === 0 && (
            <div style={{ padding: 14, fontSize: 12, color: C.muted }}>
              {showAll ? t("Nothing matches.") : t("Nothing matches your equipment — try Show all.")}
            </div>
          )}
          {results.map((ex, i) => {
            const kit = equipOf(ex).filter((e) => !ALWAYS_OWNED.includes(e));
            const pinned = pins.includes(ex.id);
            const added = steps.some((s) => s.ex.id === ex.id);
            return (
              <button
                key={ex.id}
                type="button"
                onClick={() => (mode === "log" ? addLogRow(ex) : mode === "build" ? addStep(ex) : togglePin(ex.id))}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", textAlign: "left",
                  border: "none", borderTop: i ? `1px solid ${C.border}` : "none", background: pinned ? "var(--accent-dim)" : "transparent",
                  color: C.text, cursor: "pointer", fontFamily: "inherit", minHeight: 48,
                }}
              >
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ex.name}</span>
                  <span style={{ display: "block", ...mono(10), color: C.muted }}>
                    {t(ex.category ?? "")}{kit.length ? ` · ${kit.join(", ").replace(/_/g, " ")}` : ""}
                  </span>
                </span>
                <span style={{ ...mono(12), color: pinned || added ? "var(--accent)" : C.muted, fontWeight: 700 }}>
                  {mode === "log" ? (logRows.some((r) => r.ex.id === ex.id) ? "+1" : "+") : mode === "build" ? (added ? "+1" : "+") : (pinned ? t("Pinned") : t("Pin"))}
                </span>
              </button>
            );
          })}
        </div>

        {/* Build mode: the session */}
        {mode === "build" && (
          <>
            <div style={{ ...eyebrow, color: C.faint, fontSize: 9.5, marginBottom: 8 }}>{t("Your session")}</div>
            {dropped > 0 && (
              <div style={{ fontSize: 12, color: C.warningSoft, lineHeight: 1.5, marginBottom: 8 }}>
                {t("{n} exercise(s) from this training are no longer in the library and were left out.", { n: dropped })}
              </div>
            )}
            {sessionNotes.map((n, i) => <NoteCard key={`s${i}`} note={n} />)}
            {steps.length === 0 && (
              <div style={{ fontSize: 12, color: C.muted, padding: "6px 0 12px" }}>{t("Tap an exercise above to add it.")}</div>
            )}
            {steps.map((s, i) => (
              <div key={s.key} style={{ padding: 12, borderRadius: 14, background: C.bgCard, border: `1px solid ${C.border}`, marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                  <span style={{ ...mono(11), color: C.faint, width: 18 }}>{i + 1}</span>
                  <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.ex.name}</span>
                  <button type="button" aria-label={t("Move up")} disabled={i === 0} onClick={() => move(i, -1)} style={{ ...iconBtn, opacity: i === 0 ? 0.35 : 1 }}>↑</button>
                  <button type="button" aria-label={t("Move down")} disabled={i === steps.length - 1} onClick={() => move(i, 1)} style={{ ...iconBtn, opacity: i === steps.length - 1 ? 0.35 : 1 }}>↓</button>
                  <button type="button" aria-label={t("Remove")} onClick={() => remove(s.key)} style={iconBtn}>×</button>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 4 }}>
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
                  <button type="button" onClick={() => patch(s.key, (st) => ({ useTime: !st.useTime }))}
                    style={{ marginTop: 8, background: "none", border: "none", padding: 0, ...mono(10), color: "var(--accent)", cursor: "pointer" }}>
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
          <div style={{ marginBottom: 10 }}>
            <div style={{ ...eyebrow, color: C.faint, fontSize: 9.5, marginBottom: 8 }}>{t("Pinned")} · {pins.length}/{MAX_PINS}</div>
            {pins.length === 0
              ? <div style={{ fontSize: 12, color: C.muted }}>{t("Tap up to 3 exercises above to pin them.")}</div>
              : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {pins.map((id) => (
                    <button key={id} type="button" onClick={() => togglePin(id)} style={chip(true)}>
                      {libById.get(id)?.name ?? id} ×
                    </button>
                  ))}
                </div>
              )}
          </div>
        )}

        {/* Log mode: what was done */}
        {mode === "log" && (
          <div className="jf-log">
            <div className="jf-log__eyebrow">{t("What you did")}</div>
            {logRows.length === 0 && <div className="jf-log__empty">{t("Tap an exercise above to add it.")}</div>}
            {logRows.map((r, i) => {
              const p = logParsed[i];
              const bad = !r.skipped && r.text.trim() !== "" && !p.values;
              return (
                <div key={r.key} className={`jf-log-row${r.skipped ? " jf-log-row--skipped" : ""}`}>
                  <div className="jf-log-row__head">
                    <span className="jf-log-row__num">{i + 1}</span>
                    <span className="jf-log-row__name">{r.ex.name}</span>
                    <button type="button" className="jf-log-icon" aria-label={t("Move up")} disabled={i === 0} onClick={() => moveLog(i, -1)}>↑</button>
                    <button type="button" className="jf-log-icon" aria-label={t("Move down")} disabled={i === logRows.length - 1} onClick={() => moveLog(i, 1)}>↓</button>
                    <button type="button" className="jf-log-icon" aria-label={t("Remove")} onClick={() => setLogRows((rs) => rs.filter((x) => x.key !== r.key))}>×</button>
                  </div>
                  {!r.skipped && (
                    <div className="jf-log-row__fields">
                      <label className="jf-log-field jf-log-field--wide">
                        <span className="jf-log-field__label">{r.useTime ? t("Seconds per set") : t("Reps per set")}</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          className={`jf-log-input${bad ? " jf-log-input--bad" : ""}`}
                          value={r.text}
                          placeholder={r.useTime ? t("e.g. 60, 60, 45") : t("e.g. 10, 10, 8")}
                          onChange={(e) => patchLog(r.key, { text: e.target.value })}
                        />
                      </label>
                      <label className="jf-log-field">
                        <span className="jf-log-field__label">{t("Rest (s)")}</span>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          max={600}
                          className="jf-log-input"
                          value={r.rest}
                          onChange={(e) => patchLog(r.key, { rest: clamp(Number(e.target.value) || 0, LIM.rest) })}
                        />
                      </label>
                    </div>
                  )}
                  {bad && <div className="jf-log-row__error">{t("Use numbers separated by commas, e.g. 10, 10, 8 or 3x10.")}</div>}
                  {!r.skipped && p.values && (
                    <div className="jf-log-row__sum">
                      {t("{n} sets", { n: p.values.length })} · {p.values.join(" · ")}{r.useTime ? " s" : ""}
                    </div>
                  )}
                  <div className="jf-log-row__actions">
                    {r.canToggle && !r.skipped && (
                      <button type="button" className="jf-log-link" onClick={() => patchLog(r.key, { useTime: !r.useTime })}>
                        {r.useTime ? t("Count reps instead") : t("Use time instead")}
                      </button>
                    )}
                    <button type="button" aria-pressed={r.skipped} className={`jf-log-chip${r.skipped ? " jf-log-chip--on" : ""}`}
                      onClick={() => patchLog(r.key, { skipped: !r.skipped })}>
                      {t("Skipped")}
                    </button>
                  </div>
                </div>
              );
            })}

            <label className="jf-log-field jf-log-field--block">
              <span className="jf-log-field__label">{t("Note")}</span>
              <textarea
                className="jf-log-input jf-log-textarea"
                rows={3}
                maxLength={1000}
                value={logNote}
                placeholder={t("How did it go? Anything you skipped, and why?")}
                onChange={(e) => setLogNote(e.target.value)}
              />
            </label>

            <div className="jf-log-field__label">{t("How did it feel? (optional)")}</div>
            <div className="jf-log-rpe" role="group" aria-label={t("How did it feel? (optional)")}>
              {[[3, t("Easy")], [5, t("Just right")], [8, t("Hard")]].map(([v, label]) => (
                <button key={v} type="button" aria-pressed={logRpe === v} className={`jf-log-chip${logRpe === v ? " jf-log-chip--on" : ""}`}
                  onClick={() => setLogRpe((cur) => (cur === v ? null : v))}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {needsAck && mode === "build" && (
          <label style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: 12, borderRadius: 14, background: C.amberDim, border: `1px solid ${C.amberBorder}`, margin: "4px 0 12px", cursor: "pointer" }}>
            <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} style={{ width: 22, height: 22, marginTop: 1, flexShrink: 0, accentColor: "var(--amber)" }} />
            <span style={{ fontSize: 12, color: C.warningSoft, fontWeight: 600, lineHeight: 1.5 }}>
              {t("I have read the advice above and choose this session myself.")}
            </span>
          </label>
        )}
        {error && <div style={{ fontSize: 12, color: C.danger, margin: "4px 0 10px" }}>{error}</div>}
      </>
    );
  }

  // ── W4.3: the second, quieter action — save as / update a template ─────
  const quiet = {
    width: "100%", minHeight: 44, marginTop: 6, background: "none", border: "none", fontFamily: "inherit",
    fontSize: 13, fontWeight: 700, color: steps.length ? C.mutedStrong : C.faint, cursor: steps.length ? "pointer" : "not-allowed",
  };
  const templatePanel = tplOpen ? (
    <div style={{ marginTop: 10, padding: 12, borderRadius: 14, background: C.bgCard, border: `1px solid ${C.border}` }}>
      <input
        type="text"
        value={tplName}
        maxLength={60}
        autoFocus
        onChange={(e) => { setTplName(e.target.value); setTplMsg(null); }}
        placeholder={t("Name of your training")}
        aria-label={t("Name of your training")}
        style={{ width: "100%", boxSizing: "border-box", padding: "11px 14px", borderRadius: 14, border: `1px solid ${C.border}`, background: C.bgCard2, color: C.text, fontSize: 14, fontFamily: "inherit", outline: "none", marginBottom: 8 }}
      />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" disabled={tplBusy || !steps.length} onClick={() => saveTemplate(false)} style={{ ...chip(true), flex: 1, padding: "11px 14px" }}>
          {tplBusy ? t("Saving…") : tpl ? t("Update template") : t("Save")}
        </button>
        {tpl && (
          <button type="button" disabled={tplBusy || !steps.length} onClick={() => saveTemplate(true)} style={{ ...chip(false), padding: "11px 14px" }}>
            {t("Save as new")}
          </button>
        )}
        <button type="button" onClick={() => { setTplOpen(false); setTplMsg(null); }} style={{ ...chip(false), padding: "11px 14px" }}>{t("Cancel")}</button>
      </div>
      {tplMsg && <div style={{ fontSize: 12, color: tplMsg.err ? C.danger : "var(--accent)", marginTop: 8 }}>{tplMsg.text}</div>}
    </div>
  ) : (
    <>
      <button type="button" disabled={!steps.length} onClick={() => { setTplOpen(true); setTplMsg(null); }} style={quiet}>
        {tpl ? t("Update template") : t("Save as template")}
      </button>
      {tplMsg && <div style={{ fontSize: 12, color: tplMsg.err ? C.danger : "var(--accent)", textAlign: "center", marginBottom: 4 }}>{tplMsg.text}</div>}
    </>
  );

  // ── Footer (sticky): estimate + the one primary action ──────────────────
  const canSave = mode === "build" && steps.length > 0 && !busy && (!needsAck || ack);
  const canFill = mode === "pin" && pins.length > 0 && !busy;
  const logFooter = (
    <div className="jf-log-footer">
      <button type="button" className="jf-log-primary" disabled={!canLog} onClick={saveLog}>
        {busy ? t("Saving…") : t("Save for {date}", { date: date ? logDayLabel(date, lang) : "" })}
      </button>
    </div>
  );
  const footer = isLog ? logFooter : saved ? null : (
    <div style={{ position: "sticky", bottom: 0, paddingTop: 12, paddingBottom: "calc(12px + env(safe-area-inset-bottom))", background: C.sheet }}>
      {mode === "build" && (
        <div style={{ display: "flex", justifyContent: "space-between", ...mono(11), marginBottom: 8 }}>
          <span style={{ color: overBudget ? C.amber : C.mutedStrong }}>
            {estimate != null ? `≈ ${estimate} min` : "—"}
          </span>
          <span style={{ color: C.muted }}>{t("your time")} {budget} min</span>
        </div>
      )}
      {mode === "build" ? (
        <button type="button" disabled={!canSave} onClick={() => save(false)} style={primary(canSave)}>
          {busy ? t("Saving…") : needsAck ? t("Confirm and use today") : t("Use today")}
        </button>
      ) : (
        <button type="button" disabled={!canFill} onClick={fill} style={primary(canFill)}>
          {busy ? t("Building…") : t("Let the coach fill in the rest")}
        </button>
      )}
      {mode === "build" && templatePanel}
    </div>
  );

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 110, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isLog ? t("Log a training") : t("Your own training")}
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 520, maxHeight: "92dvh", overflowY: "auto", background: C.sheet, border: `1px solid ${C.border}`, borderRadius: "24px 24px 0 0", padding: saved ? "16px 16px calc(12px + env(safe-area-inset-bottom))" : "16px 16px 0", boxSizing: "border-box" }}
      >
        <div style={{ width: 40, height: 4, borderRadius: 2, background: C.border, margin: "0 auto 12px" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ ...display(24, 900), color: C.text, textTransform: "uppercase" }}>{isLog ? t("Log a training") : t("Your own training")}</div>
          <button type="button" aria-label={t("Close")} onClick={onClose} style={iconBtn}>×</button>
        </div>
        {body}
        {footer}
      </div>
    </div>
  );
}
