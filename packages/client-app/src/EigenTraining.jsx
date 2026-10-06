// ─── "Eigen training" — the user's own session (MANUAL_TRAINING_DESIGN.md, phase 1) ──
//
// One quiet entry on the Today card, three verbs, one decision:
//   OwnTrainingLine   "Eigen training · Lukt dit niet?" under START SESSION (§2)
//   EigenTraining     (default, lazy) the chooser (§3) → Registreren | Hergebruiken |
//                     Samenstellen, and the run-mode sheet (§4): als extra (default)
//                     or in plaats van
//   ExtraDoneCard     after an extra: "Plan done?" and "Bewaar als sjabloon" (§6)
//   SaveAsTemplate    the W4b save, offered on a done card
//
// Starting goes through POST /api/plan custom_steps — "als extra" adds
// bonus_session, which the server answers in memory without touching today's
// plan. The rules (which links, when the sheet is skipped, which body a mode
// sends) are in ownTraining.js. Classes only — styles.css.
import { useState, lazy, Suspense } from "react";
import { t, useLang } from "./i18n.js";
import api from "./apiClient.js";
import { RULE_LABELS } from "./messagePolicy.js";
import { Sheet } from "./sessionSheet.jsx";
import { TemplatePickList } from "./MyTrainings.jsx";
import { runModeChoice, ownSessionBody, checkinForAdvice, sourceRefFor, templateSteps } from "./ownTraining.js";

const SessionBuilder = lazy(() => import("./SessionBuilder.jsx"));
const LogSessionSheet = lazy(() => import("./LogSessionSheet.jsx"));

// ── The Today card line ─────────────────────────────────────────────────────
export function OwnTrainingLine({ whyNot, onOwn, onWhyNot }) {
  useLang();
  return (
    <div className="jf-own-line">
      <button type="button" className="jf-own-line__link" onClick={onOwn}>{t("Own training")}</button>
      {whyNot && (
        <>
          <span className="jf-own-line__dot" aria-hidden="true">·</span>
          <button type="button" className="jf-own-line__link" onClick={onWhyNot}>{t("Can't do this?")}</button>
        </>
      )}
    </div>
  );
}

// ── "Bewaar als sjabloon" on a done card (W4b's save, nothing new server-side) ──
export function SaveAsTemplate({ defaultName, steps, onSaved }) {
  useLang();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(defaultName ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);           // { err, text }
  if (!steps?.length) return null;
  const save = async () => {
    const n = name.trim();
    if (!n) { setMsg({ err: true, text: t("Give your training a name.") }); return; }
    setBusy(true); setMsg(null);
    let res;
    try { res = await api.saveMySession({ name: n, steps }); } catch { res = { status: 0, data: {} }; }
    setBusy(false);
    const { status, data } = res;
    if (status === 200 && data.ok) { setOpen(false); setMsg({ err: false, text: t("Saved in My trainings.") }); onSaved?.(data.template); return; }
    setMsg({ err: true, text: data.error === "template_limit" ? t("You have {n} saved trainings — delete one first.", { n: data.limit ?? 30 })
      : data.error === "invalid_name" ? t("Give your training a name (max 60 characters).")
      : t("Could not save your training — check your connection and try again.") });
  };
  if (msg && !msg.err) return <div className="jf-own-saved">✓ {msg.text}</div>;
  return open ? (
    <div className="jf-sb-tpl">
      <input type="text" value={name} maxLength={60} autoFocus onChange={(e) => { setName(e.target.value); setMsg(null); }}
        placeholder={t("Name of your training")} aria-label={t("Name of your training")} className="jf-sb-tpl__input" />
      <div className="jf-sb-tpl__actions">
        <button type="button" disabled={busy} onClick={save} className="jf-chip jf-chip--on jf-chip--tall jf-chip--grow">{busy ? t("Saving…") : t("Save")}</button>
        <button type="button" onClick={() => { setOpen(false); setMsg(null); }} className="jf-chip jf-chip--tall">{t("Cancel")}</button>
      </div>
      {msg && <div className="jf-sb-tpl__msg jf-sb-tpl__msg--err">{msg.text}</div>}
    </div>
  ) : (
    <button type="button" className="jf-sb-quiet" onClick={() => setOpen(true)}>{t("Save as template")}</button>
  );
}

// ── The done card of an extra session (§6) ──────────────────────────────────
// "Plan done?" defaults to no: answering nothing leaves today's plan open.
export function ExtraDoneCard({ extra, askPlanDone, onPlanDone, onDismiss, canSave, onTemplateSaved }) {
  useLang();
  const [answered, setAnswered] = useState(false);
  const mins = extra?.duration_sec ? Math.round(extra.duration_sec / 60) : null;
  return (
    <div className="jf-extra-done" role="status">
      <div className="jf-extra-done__head">
        <span className="jf-extra-done__check" aria-hidden="true">✓</span>
        <div className="jf-extra-done__text">
          <div className="jf-extra-done__title">{t("Extra session done")}</div>
          <div className="jf-extra-done__sub">{extra?.name}{mins ? ` · ${mins} min` : ""}</div>
        </div>
        <button type="button" className="jf-icon-btn" aria-label={t("Close")} onClick={onDismiss}>×</button>
      </div>
      {askPlanDone && !answered && (
        <div className="jf-extra-done__ask">
          <div className="jf-extra-done__q">{t("Today's plan is still open — mark it as done too?")}</div>
          <div className="jf-extra-done__btns">
            <button type="button" className="jf-chip jf-chip--on jf-chip--tall jf-chip--grow" onClick={() => setAnswered(true)}>{t("No, keep it open")}</button>
            <button type="button" className="jf-chip jf-chip--tall jf-chip--grow" onClick={onPlanDone}>{t("Yes, mark as done")}</button>
          </div>
        </div>
      )}
      {canSave && <SaveAsTemplate defaultName={extra?.name} steps={extra?.own_steps} onSaved={onTemplateSaved} />}
    </div>
  );
}

function noteText(n) {
  const label = RULE_LABELS[n.code];
  return label ? t(label.text) : n.code;
}

// ── The chooser and the run-mode sheet ──────────────────────────────────────
export default function EigenTraining({ prefs, today, plan, todayCompleted, templates, hasGym, isGuest, isOffline, lastCheckin,
  onClose, onStartExtra, onStartReplace, onLogged, onTemplateSaved }) {
  useLang();
  const [step, setStep] = useState("chooser");     // chooser | reuse | build | log | mode | result
  const [pending, setPending] = useState(null);    // { steps, name, sourceRef }
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [result, setResult] = useState(null);      // { mode, notes, needsAck, offer, plan, opts }
  const [ack, setAck] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const choice = runModeChoice({ plan, todayCompleted });

  // The plan WorkoutView runs carries where it came from (§7: source_ref).
  const start = (mode, startedPlan, p) => {
    const run = { ...startedPlan, source_ref: p?.sourceRef ?? undefined };
    if (mode === "replace") onStartReplace(run); else onStartExtra(run);
  };

  const submit = async (mode, { safetyAck = false, includeAssessment = false, replaceConfirmed = false, p = pending } = {}) => {
    if (isOffline) { setError(t("You are offline — starting a session needs a connection.")); return; }
    setBusy(true); setError(null);
    let res;
    try {
      res = await api.startOwnSession(ownSessionBody({
        date: today, steps: p.steps, name: p.name, mode, safetyAck, includeAssessment,
        checkin: checkinForAdvice(lastCheckin, today), userAuthored: !!plan?.authored_by_user, replaceConfirmed,
      }));
    } catch { res = { status: 0, data: {} }; }
    setBusy(false);
    const { status, data } = res;
    const opts = { safetyAck, replaceConfirmed };
    if (status === 409) { setAck(false); setResult({ mode, notes: data.safety_notes ?? [], needsAck: true, opts }); setStep("result"); return; }
    if (status !== 200 || !data.ok) {
      setError(data.error === "unknown_exercise"
        ? t("One of these exercises is no longer in the library — edit the training and try again.")
        : t("Could not start this training — check your connection and try again."));
      return;
    }
    const notes = data.safety_notes ?? [];
    if (!includeAssessment && (data.assessment_offer || (notes.length && !safetyAck))) {
      setResult({ mode, notes, offer: !!data.assessment_offer, plan: data.plan, opts });
      setStep("result");
      return;
    }
    start(mode, data.plan, p);
  };

  // A session to perform now: Hergebruiken pick or Samenstellen → Starten.
  const choose = (p) => {
    setPending(p); setConfirmReplace(false); setStep("mode");
    if (choice.skip) submit("extra", { p });
  };

  if (step === "log") {
    return <Suspense fallback={null}><LogSessionSheet date={today} prefs={prefs} onClose={onClose} onLogged={onLogged} /></Suspense>;
  }
  if (step === "build") {
    return (
      <Suspense fallback={null}>
        <SessionBuilder prefs={prefs} today={today} onClose={onClose} onInstalled={() => {}} onTemplateSaved={onTemplateSaved}
          onStart={({ steps, name, template }) => choose({ steps, name, sourceRef: sourceRefFor(template) })} />
      </Suspense>
    );
  }

  const status = (busy || error) && (
    <>
      {busy && <div className="jf-own-busy">{t("Starting…")}</div>}
      {error && <div className="jf-sheet__error">{error}</div>}
    </>
  );
  const back = (to) => <button type="button" className="jf-own-back" onClick={() => { setError(null); setStep(to); }}>← {t("Back")}</button>;

  if (step === "reuse") {
    const list = templates ?? [];
    return (
      <Sheet title={t("Reuse")} onClose={onClose} padded>
        <div className="jf-sheet__eyebrow">{t("My trainings")}</div>
        {list.length === 0 ? (
          <div className="jf-sheet__empty">
            {t("No saved trainings yet — build one via Build.")}{" "}
            <button type="button" className="jf-link" onClick={() => setStep("build")}>{t("Build")} →</button>
          </div>
        ) : (
          <TemplatePickList templates={list} busy={busy}
            onPick={(tpl) => choose({ steps: templateSteps(tpl), name: tpl.name, sourceRef: sourceRefFor(tpl) })} />
        )}
        {/* Phase 2 (§8): the trainer's sessions. Shown only to a gym member, as a placeholder. */}
        {hasGym && (
          <>
            <div className="jf-sheet__eyebrow jf-own-section">{t("From your trainer")}</div>
            <button type="button" className="jf-tpl-pick jf-tpl-pick--soon" disabled>
              <span className="jf-tpl-pick__name">{t("Sessions from your trainer")}</span>
              <span className="jf-tpl-pick__meta">{t("Coming soon")}</span>
            </button>
          </>
        )}
        {status}
        {back("chooser")}
      </Sheet>
    );
  }

  if (step === "mode") {
    const backTo = pending?.sourceRef ? "reuse" : "build";
    if (choice.skip) {
      return <Sheet title={t("Own training")} onClose={onClose} padded>{status}{error && back(backTo)}</Sheet>;
    }
    const replaceHint = choice.restDay ? t("Replaces today's rest day.")
      : choice.planName ? t("Replaces \"{name}\" for today.", { name: choice.planName }) : t("Replaces today's session.");
    const rowClass = (mode) => `jf-own-row${choice.defaultMode === mode ? " jf-own-row--default" : ""}`;
    return (
      <Sheet title={t("How do you want to do this?")} onClose={onClose} padded>
        <button type="button" className={rowClass("extra")} disabled={busy} onClick={() => submit("extra")}>
          <span className="jf-own-row__verb">{t("As an extra")}</span>
          <span className="jf-own-row__hint">{choice.restDay ? t("Your rest day stays on record.") : t("Today's plan stays as it is.")}</span>
        </button>
        <button type="button" className={rowClass("replace")} disabled={busy}
          onClick={() => (choice.replaceNeedsConfirm ? setConfirmReplace(true) : submit("replace"))}>
          <span className="jf-own-row__verb">{choice.restDay ? t("Instead of rest") : t("Instead of")}</span>
          <span className="jf-own-row__hint">{replaceHint}</span>
        </button>
        {confirmReplace && (
          <div className="jf-own-confirm">
            <div className="jf-own-confirm__text">{t("This replaces the session you built yourself today.")}</div>
            <button type="button" className="jf-primary" disabled={busy} onClick={() => submit("replace", { replaceConfirmed: true })}>
              {t("Replace today's session")}
            </button>
          </div>
        )}
        {status}
        {back(backTo)}
      </Sheet>
    );
  }

  if (step === "result" && result) {
    const nameOf = (n) => (n.step_index != null ? (result.plan?.steps?.[n.step_index]?.name ?? n.exercise_slug?.replace(/-/g, " ")) : null);
    const go = () => (result.needsAck
      ? submit(result.mode, { ...result.opts, safetyAck: true })
      : start(result.mode, result.plan, pending));
    return (
      <Sheet title={t("Ready to start")} onClose={onClose} padded>
        {result.notes.length > 0 && (
          <p className="jf-sheet__intro">{result.needsAck ? t("Read the advice below and confirm to start.") : t("Your session runs as you built it. Keep these in mind:")}</p>
        )}
        {result.notes.map((n, i) => (
          <div key={i}>
            {nameOf(n) && <div className="jf-sb-saved__name jf-sb-saved__name--spaced">{nameOf(n)}</div>}
            <div className="jf-note">
              <div className="jf-note__head">{n.blocking ? t("Needs your confirmation") : t("Coach advice")}</div>
              <div className="jf-note__text">{t("The coach would normally leave this out:")} {noteText(n)}</div>
            </div>
          </div>
        ))}
        {result.offer && (
          <div className="jf-sb-offer">
            <div className="jf-sb-offer__title">{t("Your self-measurement is due")}</div>
            <div className="jf-sb-offer__text">{t("Add two max-effort sets (push-ups and sit-ups, 2 minutes each) to the end of this session?")}</div>
            <button type="button" disabled={busy} className="jf-chip jf-chip--on jf-chip--wide"
              onClick={() => submit(result.mode, { ...result.opts, includeAssessment: true })}>
              {busy ? t("Adding…") : t("Add self-measurement")}
            </button>
          </div>
        )}
        {result.needsAck && (
          <label className="jf-sb-ack">
            <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="jf-sb-ack__box" />
            <span className="jf-sb-ack__text">{t("I have read the advice above and choose this session myself.")}</span>
          </label>
        )}
        {status}
        <button type="button" className="jf-primary" disabled={busy || (result.needsAck && !ack)} onClick={go}>
          {result.needsAck ? t("Confirm and start") : t("Start now")}
        </button>
      </Sheet>
    );
  }

  // ── The chooser (§3) ──
  return (
    <Sheet title={t("Own training")} onClose={onClose} padded>
      <button type="button" className="jf-own-row" onClick={() => setStep("log")}>
        <span className="jf-own-row__verb">{t("Record")}</span>
        <span className="jf-own-row__hint">{t("Did something without the app? Record it.")}</span>
      </button>
      {/* A guest has no account to keep templates on (§9). */}
      {!isGuest && (
        <button type="button" className="jf-own-row" onClick={() => setStep("reuse")}>
          <span className="jf-own-row__verb">{t("Reuse")}</span>
          <span className="jf-own-row__hint">{hasGym ? t("My trainings · From your trainer") : t("My trainings")}</span>
        </button>
      )}
      <button type="button" className="jf-own-row" onClick={() => setStep("build")}>
        <span className="jf-own-row__verb">{t("Build")}</span>
        <span className="jf-own-row__hint">{t("Build a session now and start it.")}</span>
      </button>
    </Sheet>
  );
}
