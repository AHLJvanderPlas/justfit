// Today tab — the session card, done card, plan-error card and "why this plan".
// Moved out of App.jsx (F4) as a lazy boundary; App passes every input as a
// prop, as it does for CoachView. App starts the import at module scope (like
// WorkoutView) because this is the first screen, so the chunk loads in
// parallel with first render instead of after it.
import { useState, useMemo } from "react";
import { C, display, eyebrow, mono } from "./tokens.js";
import { Glass } from "./uiComponents.jsx";
import { GOALS, EXPERIENCE } from "./appConstants.js";
import { Icons, ExerciseIcon, MilitaryIcon, GoalIcon } from "./icons.jsx";
import { milClL, formatExDuration, estimateMins, fmtDayStrip, weekdayLetters } from "./planUtils.js";
import { milLevelLabel, cooperLevel } from "./keuringNorms.js";
import api from "./apiClient.js";
import { parseRuleTrace, hasBlockingSafety, classifyAdvisories, coachLine, buildVolumeSentence, RULE_LABELS, intensityLabel, sessionTitle, cycleSubGoalLabel } from "./messagePolicy.js";
import { dcpTodayMeta } from "./dcpUi.js";
import DoneCard from "./DoneCard.jsx";
import { t, useLang, exerciseName } from "./i18n.js";
import { generateCyclingTcx, triggerFileDownload, generateZwoFile, generateErgFile, generateRunningTcx } from "./exportUtils.js";
import { OwnSessionAssessmentOffer } from "./MyTrainings.jsx";
import { OwnTrainingLine, ExtraDoneCard } from "./EigenTraining.jsx";
import { ownLine } from "./ownTraining.js";

// ─── MESSAGE COMPONENTS ────────────────────────────────────────────────────────
/**
 * "Why this plan?" — closed until tapped (UAT release 2; it used to open on the
 * first view of each day with 10–15 bullets). Inside: the rules that changed
 * TODAY first, then the standing safety and body-mode ones, then the engine's
 * structure behind "More" (messagePolicy.classifyAdvisories decides which is which).
 */
function WhyPlanPanel({ plan }) {
  useLang();
  const groups = classifyAdvisories(plan?.rule_trace, plan?.steps ?? null);
  const [open, setOpen] = useState(false);
  const [more, setMore] = useState(false);
  if (!groups.today.length && !groups.standing.length && !groups.more.length) return null;

  // R519 carries numbers, so its sentence is composed from the factors the planner
  // actually applied; every other advisory is a fixed label. Both go through t().
  const row = (entry) => (
    <div key={entry.code} className="jf-why__row">
      <span className="jf-why__mark" aria-hidden="true">›</span>
      <span>
        {entry.volume ? buildVolumeSentence(entry, t) : t(entry.text)}
        {entry.cta && <span className="jf-why__cta"> {t(entry.cta)}</span>}
      </span>
    </div>
  );

  return (
    <div className="jf-why">
      <button type="button" className="jf-why__toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <svg className={`jf-why__chev${open ? " jf-why__chev--open" : ""}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <polyline points="6 9 12 15 18 9" />
        </svg>
        {t("Why this plan?")}
      </button>
      {open && (
        <div className="jf-why__panel" role="status" data-testid="why-panel">
          {groups.today.length > 0 && <div className="jf-why__label">{t("Changed today")}</div>}
          {groups.today.map(row)}
          {groups.standing.length > 0 && <div className="jf-why__label">{t("Always on")}</div>}
          {groups.standing.map(row)}
          {groups.more.length > 0 && (
            <>
              <button type="button" className="jf-why__more" aria-expanded={more} onClick={() => setMore((m) => !m)}>
                {t("More ({n})", { n: groups.more.length })}
              </button>
              {more && groups.more.map(row)}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Persistent blocking safety banner — shown when session_notes contain clearance-gate language.
 * Always visible (role="alert"), not dismissible.
 */
function BlockingSafetyBanner({ text, cta }) {
  useLang();
  return (
    <div
      role="alert"
      style={{
        marginBottom: 14,
        padding: "12px 16px",
        borderRadius: 14,
        background: C.amberDim,
        border: "1px solid rgba(245,158,11,0.3)",
        borderLeft: "3px solid #f59e0b",
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase", color: C.amber, marginBottom: 6 }}>
        {t("Health & Safety")}
      </div>
      <p style={{ fontSize: 12, color: C.warningSoft, fontWeight: 600, lineHeight: 1.6, margin: 0 }}>
        {text}
      </p>
      {cta && (
        <p style={{ fontSize: 11, color: C.amber, fontWeight: 700, margin: "8px 0 0" }}>
          → {cta}
        </p>
      )}
    </div>
  );
}

// ─── PLAN ERROR ────────────────────────────────────────────────────────────────
const PLAN_ERROR_MESSAGES = {
  "PLAN-NET":   "Could not reach the plan engine. This is usually a temporary connection issue — check your signal and try again.",
  "PLAN-500":   "The plan engine returned an unexpected error on the server.",
  "PLAN-EMPTY": "No exercises matched your current equipment and injury settings. Try adjusting your profile in Settings.",
  "PLAN-ERR":   "An unknown error occurred during plan generation.",
};

function PlanErrorCard({ planError, onRetry, token, prefs }) {
  useLang();
  const [reportSent, setReportSent] = useState(false);
  const [reportSending, setReportSending] = useState(false);
  const msg = t(PLAN_ERROR_MESSAGES[planError.code] ?? PLAN_ERROR_MESSAGES["PLAN-ERR"]);

  const handleReport = async () => {
    setReportSending(true);
    const lines = [
      "Automatic error report — Plan generation",
      `Code: ${planError.code}`,
      planError.detail ? `Detail: ${planError.detail}` : null,
      planError.ruleTrace?.length ? `Rule trace: ${planError.ruleTrace.slice(-6).join(" | ")}` : null,
      `Date: ${new Date().toISOString()}`,
      prefs ? `Goal: ${prefs.training_goal}, Level: ${prefs.experience_level}, Equipment: ${JSON.stringify(prefs.preferences?.available_equipment ?? [])}` : null,
    ].filter(Boolean).join("\n");
    try { await api.sendFeedback(token, lines); } catch { /* fire-and-forget — feedback failure must not crash the UI */ }
    setReportSent(true);
    setReportSending(false);
  };

  return (
    <div style={{ borderRadius: 28, padding: 24, border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.04)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(239,68,68,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>⚠</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 900, color: C.text }}>{t("No plan generated")}</div>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", color: C.dangerStrong, fontFamily: "'Courier New', monospace", marginTop: 3 }}>{planError.code}</div>
        </div>
      </div>
      <div style={{ fontSize: 13, color: C.subtle, lineHeight: 1.6, marginBottom: planError.detail ? 12 : 20 }}>
        {msg}
      </div>
      {planError.detail && (
        <div style={{ fontFamily: "'Courier New', monospace", fontSize: 11, color: C.muted, background: C.recessed, borderRadius: 10, padding: "8px 12px", marginBottom: 20, lineHeight: 1.5, wordBreak: "break-all" }}>
          {planError.detail}
        </div>
      )}
      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={onRetry}
          style={{ flex: 1, padding: "12px 0", borderRadius: 14, fontWeight: 900, fontSize: 13, border: "1px solid rgba(var(--overlay-rgb),0.1)", background: "rgba(var(--overlay-rgb),0.06)", color: C.text, cursor: "pointer" }}
        >
          {t("Try again")}
        </button>
        <button
          disabled={reportSent || reportSending}
          onClick={handleReport}
          style={{ flex: 1, padding: "12px 0", borderRadius: 14, fontWeight: 900, fontSize: 13, border: `1px solid ${reportSent ? "rgba(74,222,128,0.3)" : "rgba(239,68,68,0.3)"}`, background: reportSent ? "rgba(74,222,128,0.08)" : "rgba(239,68,68,0.08)", color: reportSent ? "#4ade80" : C.dangerStrong, cursor: reportSent ? "default" : "pointer", opacity: reportSending ? 0.6 : 1, transition: "color 0.2s, border-color 0.2s, background 0.2s" }}
        >
          {reportSent ? `${t("Report sent")} ✓` : reportSending ? t("Sending…") : t("Send report")}
        </button>
      </div>
    </div>
  );
}

// Map exercise slug/tags → ExerciseIcon key
function iconKeyFor(ex) {
  const slug = (ex?.exercise_slug || ex?.name || "").toLowerCase().replace(/\s+/g, "-");
  const tags = (() => { try { return JSON.parse(ex?.tags_json || "[]"); } catch { return []; } })();
  // Push
  if (slug.includes("push-up") || slug.includes("pushup")) return "pushup";
  if (slug.includes("bench")) return "bench";
  if (slug.includes("dip")) return "dip";
  if (slug.includes("jerk") || slug.includes("push-press") || slug.includes("clean-and-press")) return "jerk";
  if (slug.includes("lateral-raise") || slug.includes("front-raise") || slug.includes("face-pull") || slug.includes("upright-row")) return "shoulder";
  if (slug.includes("press") || slug.includes("overhead")) return "press";
  // Pull
  if (slug.includes("pull-up") || slug.includes("pullup") || slug.includes("chin-up")) return "pull";
  if (slug.includes("clean") || slug.includes("snatch") || slug.includes("high-pull")) return "clean";
  if (slug.includes("row")) return "row";
  if (slug.includes("curl")) return "curl";
  // Legs
  if (slug.includes("hip-thrust") || slug.includes("glute-bridge") || slug.includes("rdl") || slug.includes("romanian")) return "hip";
  if (slug.includes("leg-press")) return "legpress";
  if (slug.includes("leg-extension") || slug.includes("leg-curl")) return "machine";
  if (slug.includes("deadlift")) return "deadlift";
  if (slug.includes("squat")) return "squat";
  if (slug.includes("lunge") || slug.includes("split-squat")) return "lunge";
  if (slug.includes("good-morning") || slug.includes("hyperextension") || slug.includes("back-extension")) return "hinge";
  if (slug.includes("stair-climb")) return "climb";
  if (slug.includes("step-up") || slug.includes("box-jump") || slug.includes("stair")) return "step";
  // Core
  if (slug.includes("plank")) return "plank";
  if (slug.includes("sit-up") || slug.includes("crunch")) return "sit";
  if (slug.includes("hollow") || slug.includes("dead-bug") || slug.includes("deadbug")) return "hollow";
  if (slug.includes("leg-raise") || slug.includes("knee-raise") || slug.includes("hanging-knee") || slug.includes("hanging-leg")) return "legraise";
  if (slug.includes("twist") || slug.includes("rotation") || slug.includes("woodchop")) return "rotation";
  // Cardio
  if (slug.includes("burpee")) return "burpee";
  if (slug.includes("mountain-climber")) return "mtnclimber";
  if (slug.includes("jumping-jack")) return "jack";
  if (slug.includes("jump-rope") || slug.includes("skipping")) return "jumprope";
  if (slug.includes("swim")) return "swim";
  if (tags.includes("cardio") || slug.includes("run") || slug.includes("jog")) return "run";
  if (slug.includes("sprint") || slug.includes("high-knees") || slug.includes("jump")) return "sprint";
  if ((slug.includes("walk") || slug.includes("march") || slug.includes("carry")) && !slug.includes("run") && !slug.includes("jog")) return "walk";
  if (slug.includes("cycling") || slug.includes("bike") || slug.includes("cycle")) return "bike";
  // Conditioning
  if (slug.includes("kettlebell") || slug.includes("swing")) return "kettle";
  if (slug.includes("band") || slug.includes("resistance-band")) return "band";
  if (slug.includes("turkish") || slug.includes("get-up") || slug.includes("getup")) return "getup";
  if (slug.includes("sled")) return "sled";
  if (slug.includes("battle-rope") || slug.includes("battle_rope")) return "ropes";
  if (slug.includes("sandbag") || slug.includes("sand-bag")) return "sandbag";
  if (tags.includes("military") || slug.includes("cooper") || slug.includes("pack")) return "military";
  // Skill
  if (slug.includes("agility") || slug.includes("ladder") || slug.includes("cone-drill")) return "agility";
  if (slug.includes("boxing") || slug.includes("shadow-box") || slug.includes("heavy-bag")) return "box";
  if (slug.includes("yoga") || slug.includes("downward-dog") || slug.includes("cobra")) return "yoga";
  // Recovery
  if (slug.includes("breath") || slug.includes("box-breathing") || slug.includes("diaphragm")) return "breathe";
  if (slug.includes("foam-roll")) return "foam";
  if (tags.includes("mobility") || tags.includes("recovery") || slug.includes("stretch") || slug.includes("child") || slug.includes("pigeon") || slug.includes("foam")) return "stretch";
  return "default";
}

// Split session name into two display lines
function splitTitle(name) {
  if (!name) return [t("NO SESSION"), ""];
  const upper = name.toUpperCase();
  if (upper.length <= 12) return [upper, ""];
  const i = upper.indexOf(" ", 8);
  if (i < 0) return [upper, ""];
  return [upper.slice(0, i), upper.slice(i + 1)];
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
export default function Dashboard({ plan, score, prevScore, onStartWorkout, isGenerating, todayCompleted, completedSession, onLogActivity, onBonusSession, bonusDone, onWhyNot, onOwnTraining, extraDone, onExtraPlanDone, onExtraDismiss, isGuest, onTemplateSaved, onCheckIn, prefs, planError, onRetryPlan, token, history, onNavigateProgress, cycle, onNavigateCoach, planCapped, onUpgrade, onUseTemplate }) {
  const lang = useLang();
  const intensityColor = {
    low: C.successSoft,
    moderate: C.emerald,
    high: C.amber,
  };
  const ic = plan ? intensityColor[plan.intensity] || C.emerald : C.emerald;

  // ── Estimated session time (workout + overhead) ──────────────────────────
  const estMins = estimateMins(plan);
  const timeOverhead = prefs?.preferences?.time_overhead;
  const overheadPresetKeys = ["change_clothes", "prepare_equipment", "clean_equipment", "shower"];
  const overheadProfileTotal = (profile) =>
    overheadPresetKeys.reduce((s, k) => s + (profile?.presets?.[k] || 0), 0) +
    (profile?.custom ?? []).reduce((s, c) => s + (c.minutes || 0), 0);
  const overheadMins = timeOverhead?.enabled
    ? overheadProfileTotal(plan?.slot_type === "micro" ? timeOverhead.short : timeOverhead.long)
    : 0;
  const totalMins = estMins !== null ? estMins + overheadMins : null;

  // ── Weekly outcome summary ───────────────────────────────────────────────
  const weekSummary = (() => {
    // training_goal is a COLUMN on user_preferences, not a key in preferences_json.
    // Reading it from the blob always missed and silently fell back to 'health',
    // so the weekly summary described a goal the user had not set.
    const goal = prefs?.training_goal ?? 'health';
    const targetMap = { health: 3, strength: 4, muscle: 4, fat_loss: 4, endurance: 5, mobility: 3 };
    const target = targetMap[goal] ?? 3;
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon…
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - daysToMonday);
    const cutoffStr = monday.toISOString().slice(0, 10);
    const done = (history ?? []).filter(h => h.date >= cutoffStr).length;
    const remaining = Math.max(0, target - done);
    let message;
    if (done === 0) message = t("{n} sessions this week — let's get started.", { n: target });
    else if (done >= target) message = t("Goal hit — {done} of {target} sessions done. Bonus available.", { done, target });
    else if (remaining === 1) message = t("One more to hit your weekly goal.");
    else message = t("{done} of {target} done — {remaining} to go.", { done, target, remaining });
    return { done, target, message };
  })();

  // ── Date line ────────────────────────────────────────────────────────────
  const dateLine = fmtDayStrip(new Date(), lang);

  // ── Streak ────────────────────────────────────────────────────────────────
  const historyDates = useMemo(() => new Set((history ?? []).map(h => h.date)), [history]);
  const streak = (() => {
    let count = 0;
    const d = new Date();
    while (true) {
      const s = d.toISOString().slice(0, 10);
      if (!historyDates.has(s)) break;
      count++;
      d.setDate(d.getDate() - 1);
    }
    return count;
  })();

  // ── Weekly grid status ────────────────────────────────────────────────────
  const weekStatusFor = (i) => {
    // i: 0=Mon … 6=Sun
    const now = new Date();
    const todayDow = (now.getDay() + 6) % 7;
    if (i > todayDow) return "future";
    if (i === todayDow) return "today";
    const d = new Date(now);
    d.setDate(now.getDate() - (todayDow - i));
    return historyDates.has(d.toISOString().slice(0, 10)) ? "done" : "rest";
  };

  // ── Derived plan helpers ──────────────────────────────────────────────────
  const [line1, line2] = splitTitle(plan?.session_name ? sessionTitle(plan.session_name, plan) : null);

  return (
    <div>

      {/* ── Top strip: date · streak · score ──────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <span style={{ ...mono(11), color: C.faint, letterSpacing: "0.16em", textTransform: "uppercase" }}>{dateLine}</span>
        <button
          onClick={onNavigateProgress}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0, ...mono(11), color: C.muted, letterSpacing: "0.12em", textTransform: "uppercase" }}
        >
          {streak > 0 ? `${streak}d · ` : ""}{score ?? "—"}
        </button>
      </div>

      {/* ── Goal header ────────────────────────────── */}
      {(() => {
        const pref = prefs?.preferences ?? {};
        const milA = !!(pref.military_coach?.active);
        const rcA  = !!(pref.run_coach?.enrolled && !pref.run_coach?.completed);
        const ccA  = !!(pref.cycling_coach?.active && !pref.cycling_coach?.completed);
        const GOAL_LABELS = {
          fat_loss:    "Lose weight & feel better",
          strength:    "Build strength & muscle",
          health:      "Improve overall fitness",
          mobility:    "Boost energy & manage stress",
          muscle_gain: "Build muscle",
          endurance:   "Build endurance",
        };
        let goalText, coachText;
        if (milA) {
          const track = pref.military_coach?.track ?? "keuring";
          goalText  = t("MILITARY COACH");
          coachText = `${track === "keuring" ? "Keuring" : "Opleiding"} · ${t(...milLevelLabel(pref.military_coach).line)}`;
        } else if (rcA) {
          goalText  = t("RUNNING COACH");
          coachText = t("{km}km programme · Week {w}", { km: pref.run_coach.target_km, w: pref.run_coach.week ?? 1 });
        } else if (ccA) {
          goalText  = t("CYCLING COACH");
          coachText = `${cycleSubGoalLabel(pref.cycling_coach.sub_goal ?? "build_fitness")} · Week ${pref.cycling_coach.week ?? 1}`;
        } else {
          goalText  = t(GOAL_LABELS[prefs?.training_goal ?? "health"] ?? "Improve overall fitness").toUpperCase();
          coachText = null;
        }
        return (
          <div style={{ marginBottom: 14 }}>
            <div style={{ ...mono(10), color: "var(--accent)", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700 }}>{goalText}</div>
            {coachText && <div style={{ ...mono(10), color: C.muted, letterSpacing: "0.1em", marginTop: 2 }}>{coachText}</div>}
          </div>
        );
      })()}

      {/* ── Session area ───────────────────────────── */}
      {todayCompleted ? (
        <DoneCard score={score} prevScore={prevScore} completedSession={completedSession} onLogActivity={onLogActivity} onBonusSession={onBonusSession} bonusDone={bonusDone}
          onOwnTraining={onOwnTraining} canSaveTemplate={!isGuest && !!completedSession?.own_steps?.length} onTemplateSaved={onTemplateSaved} />
      ) : planError && !plan ? (
        <PlanErrorCard planError={planError} onRetry={onRetryPlan} token={token} prefs={prefs} />
      ) : (
        <div style={{ position: "relative", borderRadius: 18, overflow: "hidden", background: `linear-gradient(180deg, ${C.bgCard2} 0%, ${C.bgCard} 100%)`, border: `1px solid ${C.border}`, marginBottom: 16 }}>
          {/* top accent bar */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, var(--accent), ${C.emeraldSoft})` }} />
          {/* emerald glow */}
          <div style={{ position: "absolute", top: -80, right: -80, width: 220, height: 220, borderRadius: "50%", background: C.emeraldGlow, filter: "blur(60px)", pointerEvents: "none" }} />
          <div style={{ padding: 18, position: "relative" }}>
            {isGenerating ? (
              /* ── UX-5: skeleton, not a spinner ──
                 The bars mirror the session card that is about to replace them, so
                 the wait reads as "nearly there" rather than "nothing is happening".
                 Honours prefers-reduced-motion via the shared .jf-skeleton class. ── */
              <div style={{ padding: "4px 0 8px" }} aria-busy="true" aria-live="polite">
                <div className="jf-skeleton" style={{ width: 96, height: 9, borderRadius: 5, marginBottom: 14 }} />
                <div className="jf-skeleton" style={{ width: "62%", height: 24, borderRadius: 7, marginBottom: 18 }} />
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <div className="jf-skeleton" style={{ width: 34, height: 34, borderRadius: 10, flex: "none" }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="jf-skeleton" style={{ width: `${72 - i * 12}%`, height: 11, borderRadius: 5, marginBottom: 6 }} />
                      <div className="jf-skeleton" style={{ width: `${44 - i * 8}%`, height: 9, borderRadius: 5 }} />
                    </div>
                  </div>
                ))}
                <p style={{ fontSize: 13, color: C.emerald, fontWeight: 700, marginTop: 14, textAlign: "center" }}>{t("Designing your session...")}</p>
              </div>
            ) : plan ? (
              <>
                {/* Session eyebrow + coach pill in top-right */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ ...eyebrow, color: C.faint, fontSize: 9.5 }}>{t("TODAY")} · {t("DAY {n}", { n: (history ?? []).length + 1 })}</div>
                  {(() => {
                    const milA = !!(prefs?.preferences?.military_coach?.active);
                    const rcA  = !!(prefs?.preferences?.run_coach?.enrolled && !prefs?.preferences?.run_coach?.completed);
                    const ccA  = !!(prefs?.preferences?.cycling_coach?.active && !prefs?.preferences?.cycling_coach?.completed);
                    if (!milA && !rcA && !ccA) return null;
                    // coach-dcp R2 — one pill: the primary coach. The "ADD-ON" pill is gone (a
                    // military user's primary intent IS military). The level shows only once
                    // measured: "MILITAIR · KEURING" until a Cooper or keuring result exists (fix 8).
                    const tagLabel = milA
                      ? t("MILITARY · {x}", { x: t(...milLevelLabel(prefs.preferences.military_coach).pill) })
                      : rcA ? `${t("Running")} · ${prefs.preferences.run_coach.target_km}km`
                      : `${t("Cycling")} · ${t("Week {w}", { w: prefs.preferences.cycling_coach.week ?? 1 })}`;
                    return (
                      <div className="jf-coach-pill" data-testid="coach-pill">
                        {milA && <MilitaryIcon size={9} />}{tagLabel}
                      </div>
                    );
                  })()}
                </div>
                {/* Session name — hero size; line2 in accent colour */}
                <div style={{ marginBottom: 10 }}>
                  <div style={{ ...display(42, 900), color: C.text, lineHeight: 0.95, textTransform: "uppercase" }}>{line1}</div>
                  {line2 && <div style={{ ...display(42, 900), color: "var(--accent)", lineHeight: 0.95, textTransform: "uppercase" }}>{line2}</div>}
                </div>
                {/* Coach / program badges */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
                  {plan?.authored_by_user && (
                    <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", background: "rgba(var(--accent-rgb),0.15)", color: "var(--accent)", borderRadius: 4, padding: "2px 7px" }}>
                      {t("Own session")}
                    </span>
                  )}
                  {Array.isArray(plan?.pinned) && plan.pinned.length > 0 && (
                    <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", background: "rgba(var(--accent-rgb),0.15)", color: "var(--accent)", borderRadius: 4, padding: "2px 7px" }}>
                      {t("{n} pinned", { n: plan.pinned.length })}
                    </span>
                  )}
                  {prefs?.preferences?.run_coach?.enrolled && plan?.run_program && (
                    <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", background: "rgba(var(--accent-rgb),0.15)", color: "var(--accent)", borderRadius: 4, padding: "2px 7px" }}>
                      {t(plan.run_program.session_type ?? "Run Day")} · Week {plan.run_program.week}
                    </span>
                  )}
                  {prefs?.preferences?.cycling_coach?.active && plan?.cycling_program && (
                    <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", background: "rgba(var(--accent-rgb),0.15)", color: "var(--accent)", borderRadius: 4, padding: "2px 7px" }}>
                      {t(plan.cycling_program.session_type ?? "Cycling")} · Week {plan.cycling_program.week}
                    </span>
                  )}
                  {prefs?.preferences?.cycling_coach?.active && plan?.cross_training_run && (
                    <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", background: "rgba(var(--accent-rgb),0.15)", color: "var(--accent)", borderRadius: 4, padding: "2px 7px" }}>
                      {t("Cross-Training · Level {n}", { n: plan.cross_training_run.level })}
                    </span>
                  )}
                  {prefs?.preferences?.military_coach?.active && plan?.military_program && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 9, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", background: "rgba(var(--accent-rgb),0.15)", color: "var(--accent)", borderRadius: 4, padding: "2px 7px" }}>
                      <MilitaryIcon size={10} />
                      {t(({ cooper_test: 'Cooper Test', kracht: 'Strength', duurloop: 'Endurance Run', interval: 'Intervals', kracht_marsen: 'Strength + March', circuit: 'Circuit', rust: 'Rest' })[plan.military_program.session_type] ?? plan.military_program.session_type ?? 'Military')}
                      {plan.military_program.is_base_build ? ` · ${t("Base build")}` : ` · W${plan.military_program.week}`}
                    </span>
                  )}
                </div>
                {/* Coach sentence — the reason that changed today; the goal line is the fallback (UAT R2) */}
                {(() => {
                  const text = coachLine(plan, cycle?.mode ?? 'standard');
                  return text ? <div className="jf-today__coach" data-testid="coach-sentence">{text}</div> : null;
                })()}
                {/* Session meta: time / moves / intensity */}
                <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 14 }}>
                  {totalMins && plan.slot_type !== "rest" && (
                    <span style={{ ...mono(11), color: C.mutedStrong }}>{totalMins} min</span>
                  )}
                  {totalMins && plan.slot_type !== "rest" && (plan.steps?.length ?? 0) > 0 && (
                    <span style={{ ...mono(11), color: C.faint, margin: "0 8px" }}>|</span>
                  )}
                  {(plan.steps?.length ?? 0) > 0 && (
                    <span style={{ ...mono(11), color: C.mutedStrong }}>{t("{n} moves", { n: plan.steps.length })}</span>
                  )}
                  {plan.intensity && (plan.steps?.length ?? 0) > 0 && (
                    <span style={{ ...mono(11), color: C.faint, margin: "0 8px" }}>|</span>
                  )}
                  {plan.intensity && (
                    <span style={{ ...mono(11), color: ic, textTransform: "uppercase" }}>{intensityLabel(plan.intensity)}</span>
                  )}
                </div>
                {/* Exercise list — first 3 steps with icons */}
                {plan.slot_type !== "rest" && (plan.steps?.length ?? 0) > 0 ? (
                  <div style={{ background: "rgba(var(--overlay-rgb),0.03)", borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
                    {plan.steps.slice(0, 3).map((s, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: i < Math.min(2, plan.steps.length - 1) ? `1px solid ${C.border}` : "none" }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(var(--overlay-rgb),0.05)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <ExerciseIcon type={iconKeyFor(s)} size={22} c={C.faint} />
                        </div>
                        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: C.text, display: "flex", alignItems: "center", gap: 6 }}>
                          {exerciseName(s)}
                          {s.trainer_logo_url && (
                            <span style={{ width: 18, height: 18, borderRadius: 4, background: s.trainer_logo_bg ?? '#0a0a0a', overflow: "hidden", flexShrink: 0, display: "inline-flex", border: "1px solid rgba(var(--overlay-rgb),0.1)" }}>
                              <img src={s.trainer_logo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                            </span>
                          )}
                        </span>
                        <span style={{ ...mono(11), color: C.muted }}>
                          {(() => {
                            if (s.max_effort) return t(...dcpTodayMeta(s));
                            const isRunInterval = JSON.parse(s.tags_json || "[]").includes("run_interval");
                            if (isRunInterval && s.sets > 1 && s.target_duration_sec) return t("{sets} × {dur} run", { sets: s.sets, dur: formatExDuration(s.target_duration_sec) });
                            if (s.target_reps) return `${s.sets} × ${s.target_reps}`;
                            return `${s.sets} × ${formatExDuration(s.target_duration_sec)}`;
                          })()}
                        </span>
                        <Icons.chevronRight size={14} c={C.subtle} />
                      </div>
                    ))}
                    {plan.steps.length > 3 && (
                      <div style={{ padding: "8px 14px", fontSize: 11, color: C.muted }}>
                        {t("+ {n} more", { n: plan.steps.length - 3 })} · {plan.steps.slice(3, 6).map(s => exerciseName(s).toLowerCase()).join(", ")}
                      </div>
                    )}
                  </div>
                ) : plan.slot_type === "rest" ? (
                  <div style={{ marginBottom: 16 }}>
                    <p style={{ fontSize: 13, color: C.muted, fontStyle: "italic" }}>{t("Recovery day. Rest is training.")}</p>
                    {(() => {
                      const advisories = parseRuleTrace(plan.rule_trace ?? []);
                      const REST_CODES = ["R514", "R539", "R540"];
                      const whyEntry =
                        [...advisories.blocking, ...advisories.safety].find(a => REST_CODES.includes(a.code)) ??
                        ((plan.rule_trace ?? []).some(t => t.includes("adapt:pain_rest"))
                          ? { text: "Your check-in reported significant pain — rest is the right call today." }
                          : null);
                      return whyEntry ? (
                        <div style={{ fontSize: 12, color: C.muted, marginTop: 10, padding: "10px 14px", background: "rgba(var(--overlay-rgb),0.03)", borderRadius: 12, lineHeight: 1.5, borderLeft: `2px solid ${C.emeraldBorder}` }}>
                          {t(whyEntry.text)}
                          {whyEntry.cta && <span style={{ color: C.emerald, fontWeight: 700 }}> {t(whyEntry.cta)}</span>}
                        </div>
                      ) : null;
                    })()}
                  </div>
                ) : (plan.steps?.length ?? 0) === 0 ? (
                  <PlanErrorCard
                    planError={{ code: "PLAN-EMPTY", detail: (plan.rule_trace ?? []).slice(-4).join(" | ") || null, ruleTrace: plan.rule_trace ?? [] }}
                    onRetry={onRetryPlan} token={token} prefs={prefs}
                  />
                ) : null}
                {/* W4.1 — advisory notes stay with a user-authored session */}
                {plan.authored_by_user && (plan.safety_notes?.length ?? 0) > 0 && (
                  <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 12, background: C.amberDim, border: `1px solid ${C.amberBorder}` }}>
                    <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase", color: C.amber, marginBottom: 4 }}>{t("Coach advice")}</div>
                    {plan.safety_notes.map((n, i) => {
                      const name = n.step_index != null ? exerciseName(plan.steps?.[n.step_index]) || null : null;
                      const label = RULE_LABELS[n.code];
                      return (
                        <div key={i} style={{ fontSize: 12, color: C.warningSoft, fontWeight: 600, lineHeight: 1.5 }}>
                          {name ? `${name}: ` : ""}{label ? t(label.text) : n.code}
                        </div>
                      );
                    })}
                  </div>
                )}
                {/* START SESSION button */}
                <button
                  onClick={() => plan.slot_type !== "rest" && onStartWorkout()}
                  style={{
                    width: "100%", height: 56,
                    background: plan.slot_type === "rest" ? C.subtle : "var(--accent)",
                    color: plan.slot_type === "rest" ? C.muted : C.onAccent,
                    border: "none", borderRadius: 16,
                    ...display(18, 800), letterSpacing: "0.02em",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                    boxShadow: plan.slot_type !== "rest" ? `0 8px 24px ${C.emeraldGlow}` : "none",
                    cursor: plan.slot_type === "rest" ? "not-allowed" : "pointer",
                  }}
                >
                  {plan.slot_type === "rest" ? t("Recovery Mode Active") : <>{t("START SESSION")} <Icons.arrowRight size={20} c={C.onAccent} /></>}
                </button>
                {/* MANUAL_TRAINING_DESIGN §2 — "Eigen training · Lukt dit niet?". A rest day
                    is advice too: someone who wants to move anyway can, from "Eigen training". */}
                <OwnTrainingLine buttons whyNot={ownLine({ plan, todayCompleted }).whyNot} onOwn={onOwnTraining} onWhyNot={onWhyNot} />
                {/* §9 — a session the user wrote is not the military block's session. */}
                {plan.authored_by_user && prefs?.preferences?.military_coach?.active && (
                  <div className="jf-own-note">{t("Your own session does not count as a session of your military block.")}</div>
                )}
                {/* F8 — on a session the user wrote, the due self-measurement. */}
                {!todayCompleted && <OwnSessionAssessmentOffer plan={plan} onUse={onUseTemplate} />}
                {planCapped && !todayCompleted && (
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 10, textAlign: "center" }}>
                    {t("Your daily plan is ready. {pro} users can regenerate.", { pro: "\u0001" }).split("\u0001").flatMap((part, i) => i === 0 ? [part] : [<span key="pro" onClick={onUpgrade} style={{ color: "var(--accent)", cursor: "pointer", fontWeight: 700 }}>Pro</span>, part])}
                  </div>
                )}
              </>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 12, padding: "32px 0" }}>
                <Icons.target size={40} c={C.muted} />
                <p style={{ fontSize: 14, color: C.muted, fontWeight: 500, lineHeight: 1.5 }}>
                  {t("Complete the daily check-in to generate today's session.")}
                </p>
                <OwnTrainingLine whyNot={false} onOwn={onOwnTraining} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── §6 — today's extra: the done card once, then one line ── */}
      {extraDone && !extraDone.dismissed && (
        <ExtraDoneCard extra={extraDone} askPlanDone={!todayCompleted && !!plan && plan.slot_type !== "rest"}
          onPlanDone={onExtraPlanDone} onDismiss={onExtraDismiss} canSave={!isGuest && !!extraDone.own_steps?.length} onTemplateSaved={onTemplateSaved} />
      )}
      {extraDone?.dismissed && <div className="jf-extra-line">{t("Extra: {name}", { name: extraDone.name })} ✓</div>}

      {/* ── Why panel + Safety banner ── */}
      {plan && !todayCompleted && (
        <>
          <WhyPlanPanel plan={plan} />
          {hasBlockingSafety(plan.rule_trace) && (
            <BlockingSafetyBanner
              text={t("Your session is kept gentle until you confirm exercise clearance with your healthcare provider.")}
              cta={t("Update clearance in Settings when you're cleared.")}
            />
          )}
        </>
      )}

      {/* ── Training intention card ─────────────────── */}
      {(() => {
        // A coach is only "active" for today's card if it is also the primary intent.
        // The planner already gates on primary_intent, so reading enrolment alone made
        // the card announce MILITARY over a general session the planner had built —
        // it looked like the planner was ignoring the user's chosen focus.
        const _intent = prefs.preferences?.primary_intent ?? null;
        const _intentAllows = (coach) => _intent === null || _intent === coach;
        const rcActive = !!(prefs.preferences?.run_coach?.enrolled && !prefs.preferences?.run_coach?.completed) && _intentAllows('running');
        const ccActive = !!(prefs.preferences?.cycling_coach?.active && !prefs.preferences?.cycling_coach?.completed) && _intentAllows('cycling');
        const milActive = !!(prefs.preferences?.military_coach?.active) && _intentAllows('military');
        // coach-dcp R1 — the programme card is the route to the Coach view (its
        // ladder, readiness, PMC): the nav has no Coach tab without a trainer, and
        // the discovery card hides once a coach is active. Inner buttons (TCX …)
        // stop propagation; a key press only counts on the card itself.
        const openCoach = () => onNavigateCoach?.();
        const coachCard = onNavigateCoach ? {
          className: "jf-coach-card", role: "button", tabIndex: 0, "aria-label": t("View your coach"), onClick: openCoach,
          onKeyDown: (e) => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openCoach(); } },
        } : {};
        const chev = onNavigateCoach ? <span className="jf-coach-card__chev" aria-hidden="true">›</span> : null;
        if (milActive) {
          const mil = prefs.preferences.military_coach;
          const track    = mil.track ?? 'keuring';
          const mp       = plan?.military_program;
          const clusterTarget  = mil.cluster_target ?? (track === 'keuring' ? 0 : 1);
          const clusterCurrent = mp?.cluster_current ?? mil.cluster_current ?? clusterTarget;
          const sessionLabel = mp?.session_type ? t(({
            cooper_test: 'Cooper Test', kracht: 'Strength', duurloop: 'Endurance Run',
            interval: 'Interval Run', kracht_marsen: 'Strength + March', circuit: 'Circuit', rust: 'Rest',
          })[mp.session_type] ?? mp.session_type) : null;
          const isCalibration   = mp?.is_calibration_week;
          const isDeload        = mp?.is_deload_week;
          const isTaper         = mp?.is_taper_week;
          const isPostAssess    = mp?.is_post_assessment;
          const isBaseBuild     = mp?.is_base_build;
          const milMode         = mp?.mode ?? mil.mode ?? 'target';
          const trackLabel      = track === 'keuring' ? t('Physical Assessment') : t('Educational Fitness');
          const overperforming  = clusterCurrent > clusterTarget;
          const lastCooper = mp?.last_cooper_distance_m ?? mil.last_cooper_distance_m ?? null;
          const lvl = milLevelLabel({ ...mil, last_cooper_distance_m: lastCooper, cluster_current: clusterCurrent });
          const cLevel = cooperLevel(lastCooper);
          const cooperBenchmark = lastCooper ? (
            cLevel ? t("Cooper {m} m ({level} level)", { m: lastCooper.toLocaleString("nl-NL"), level: milClL(track, cLevel) })
              : `Cooper ${lastCooper.toLocaleString("nl-NL")} m · ${t("Below K1")}`
          ) : null;
          return (
            <Glass {...coachCard} style={{ padding: "14px 20px", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: "rgba(var(--accent-rgb),0.15)", border: "1px solid rgba(var(--accent-rgb),0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "var(--accent)" }}>
                  <MilitaryIcon size={24} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", color: C.muted, textTransform: "uppercase", marginBottom: 2 }}>{t("Military Coach")}</div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: C.text }}>
                    {trackLabel} · {t(...lvl.line)}
                    {lvl.measured && overperforming && <span style={{ fontSize: 10, color: C.emerald, marginLeft: 6 }}>{t("↑ {x} target", { x: milClL(track, clusterTarget) })}</span>}
                  </div>
                  {sessionLabel && (
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{t("Today: {x}", { x: sessionLabel })}{mp?.march_kg ? ` · ${t("{kg} kg march", { kg: mp.march_kg })}` : ""}</div>
                  )}
                  {cooperBenchmark && (
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>{cooperBenchmark}</div>
                  )}
                  {/* Block progress hairline */}
                  {(() => {
                    const bn = mp?.block_number ?? mil.block_number ?? 1;
                    const bi = mp?.block_session_index ?? 0;
                    const SESS = 4;
                    const pct = Math.min(100, ((((bn - 1) % 6) * SESS + bi) / (6 * SESS)) * 100);
                    return (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ height: 3, background: "rgba(var(--overlay-rgb),0.07)", borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: "var(--accent)", borderRadius: 2, transition: "width 0.6s" }} />
                        </div>
                        <div style={{ ...mono(9), color: C.faint, marginTop: 3, letterSpacing: "0.08em" }}>{t("BLOCK {b} OF 6", { b: ((bn - 1) % 6) + 1 })}</div>
                      </div>
                    );
                  })()}
                </div>
                {(isPostAssess || isBaseBuild || milMode === 'fit' || isCalibration || isDeload || isTaper) && (
                  <span style={{ flexShrink: 0, padding: "3px 8px", borderRadius: 6, fontSize: 9, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase",
                    background: (milMode === 'fit' || isBaseBuild) ? "rgba(16,185,129,0.12)" : isPostAssess ? "rgba(16,185,129,0.12)" : isCalibration ? "rgba(245,158,11,0.15)" : isDeload ? "rgba(16,185,129,0.12)" : "rgba(var(--accent-rgb),0.15)",
                    color: (milMode === 'fit' || isBaseBuild) ? C.emerald : isPostAssess ? C.emerald : isCalibration ? C.warning : isDeload ? C.emerald : "var(--accent)",
                  }}>
                    {milMode === 'fit' ? t("Fit target") : isBaseBuild ? t("Base build") : isPostAssess ? t("Open") : isCalibration ? t("On-ramp") : isDeload ? t("Deload") : t("Taper")}
                  </span>
                )}
                {chev}
              </div>
            </Glass>
          );
        }
        if (rcActive) {
          const rc = prefs.preferences.run_coach;
          const PROGRAM_WEEKS = { 5: 8, 10: 12, 15: 14, 20: 16, 30: 20 };
          const totalWeeks = PROGRAM_WEEKS[rc.target_km ?? 5] ?? 8;
          const runSteps = plan?.steps?.filter(s => s.target_duration_sec) ?? [];
          const canExportRunTcx = runSteps.length > 0;
          return (
            <Glass {...coachCard} style={{ padding: "14px 20px", marginBottom: 16, display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: C.emeraldDim, border: `1px solid ${C.emeraldBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: C.emerald }}>
                <Icons.run size={20} c={C.emerald} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", color: C.muted, textTransform: "uppercase", marginBottom: 2 }}>{t("Run Coach")}</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: C.text }}>{t("{km}km Plan · Week {w} of {total}", { km: rc.target_km, w: rc.week ?? 1, total: totalWeeks })}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{t("Session {a} of {b} this week", { a: rc.session_in_week ?? 0, b: 3 })}</div>
                <div style={{ marginTop: 8 }}>
                  <div style={{ height: 3, background: "rgba(var(--overlay-rgb),0.07)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min(100, ((rc.week ?? 1) / totalWeeks) * 100)}%`, background: "var(--accent)", borderRadius: 2, transition: "width 0.6s" }} />
                  </div>
                  <div style={{ ...mono(9), color: C.faint, marginTop: 3, letterSpacing: "0.08em" }}>{t("WEEK {w} OF {total}", { w: rc.week ?? 1, total: totalWeeks })}</div>
                </div>
              </div>
              {canExportRunTcx && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const sessionName = plan?.session_name ?? 'Run Session';
                    const tcx = generateRunningTcx(sessionName, runSteps, rc.max_hr ?? 180);
                    const slug = sessionName.replace(/[^a-z0-9]+/gi, '_').toLowerCase();
                    triggerFileDownload(tcx, `${slug}_${new Date().toISOString().slice(0, 10)}.tcx`, 'application/vnd.garmin.tcx+xml');
                  }}
                  style={{ flexShrink: 0, padding: "6px 10px", borderRadius: 8, fontSize: 10, fontWeight: 800, cursor: "pointer", border: `1px solid ${C.emeraldBorder}`, background: C.emeraldDim, color: C.emerald, whiteSpace: "nowrap" }}
                >
                  ↓ TCX
                </button>
              )}
              {chev}
            </Glass>
          );
        }
        if (ccActive) {
          const cc = prefs.preferences.cycling_coach;

          // Cross-training run day
          if (plan?.cross_training_run) {
            const level = plan.cross_training_run.level;
            const crossRunSteps = plan?.steps?.filter(s => s.target_duration_sec) ?? [];
            const canExportCrossRunTcx = crossRunSteps.length > 0;
            const dateStr = new Date().toISOString().slice(0, 10);
            const btnStyle = { flexShrink: 0, padding: "6px 10px", borderRadius: 8, fontSize: 10, fontWeight: 800, cursor: "pointer", border: `1px solid ${C.emeraldBorder}`, background: C.emeraldDim, color: C.emerald, whiteSpace: "nowrap" };
            return (
              <Glass {...coachCard} style={{ padding: "14px 20px", marginBottom: 16, display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: C.emeraldDim, border: `1px solid ${C.emeraldBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icons.run size={20} c={C.emerald} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", color: C.muted, textTransform: "uppercase", marginBottom: 2 }}>{t("Cycle Coach — Cross-Training")}</div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: C.text }}>{t("Run · Level {n}", { n: level })}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{t("{n} cross-training runs completed", { n: cc.run_sessions_total ?? 0 })}</div>
                </div>
                {canExportCrossRunTcx && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const tcx = generateRunningTcx(plan?.session_name ?? 'Cross-Training Run', crossRunSteps, cc.max_hr ?? 180);
                      triggerFileDownload(tcx, `cross_run_level_${level}_${dateStr}.tcx`, 'application/vnd.garmin.tcx+xml');
                    }}
                    style={btnStyle}
                  >
                    ↓ TCX
                  </button>
                )}
                {chev}
              </Glass>
            );
          }

          const todaySessionType = plan?.cycling_program?.session_type ?? null;
          const sessionTypeLabel = todaySessionType
            ? { 'Zone 2': 'Zone 2 — aerobic base', 'Sweet Spot': 'Sweet Spot — sub-threshold', 'Threshold': 'Threshold — FTP work', 'VO2max': 'VO2max — high intensity', 'Anaerobic': 'Anaerobic — sprint power', 'Intervals': 'Intervals — power development' }[todaySessionType] ?? todaySessionType
            : null;
          const cycStep = plan?.steps?.find(s => typeof s.exercise_id === 'string' && s.exercise_id.startsWith('cycling_coach_'));
          const canExportTcx = !!(cycStep?.intervals_json);
          const ccSessTotal = cc.sessions_total ?? 0;
          const ccWeekInCycle = Math.floor((ccSessTotal % 21) / 3) + 1; // 1–7
          const ccBlockPhase = ccWeekInCycle <= 2 ? 'base' : ccWeekInCycle <= 6 ? 'build' : 'recovery';
          const ccPhaseLabel = ccBlockPhase === 'recovery' ? 'Herstelweek — rust op schema' : ccBlockPhase === 'build' ? 'Opbouwfase' : 'Basisweek';
          const ccPhaseShort = ccBlockPhase === 'recovery' ? 'Herstelweek' : ccBlockPhase === 'build' ? 'Opbouwfase' : 'Basisweek';
          return (
            <Glass {...coachCard} style={{ padding: "14px 20px", marginBottom: 16, display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: C.emeraldDim, border: `1px solid ${C.emeraldBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icons.cycle size={20} c={C.emerald} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", color: C.muted, textTransform: "uppercase", marginBottom: 2 }}>{t("Cycle Coach")}</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: C.text }}>Week {cc.week ?? 1} · {cc.unit === 'hr' ? t('HR-based') : `FTP ${cc.ftp_watts ?? 200}W`}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{t("Session {a} of {b} this week", { a: cc.session_in_week ?? 0, b: cc.cycling_days_per_week ?? 3 })}</div>
                {sessionTypeLabel && (
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{ccPhaseShort} · {t(sessionTypeLabel)}</div>
                )}
                <div style={{ marginTop: 8 }}>
                  <div style={{ height: 3, background: "rgba(var(--overlay-rgb),0.07)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min(100, ccWeekInCycle / 7 * 100)}%`, background: "var(--accent)", borderRadius: 2, transition: "width 0.6s" }} />
                  </div>
                  <div style={{ ...mono(9), color: C.faint, marginTop: 3, letterSpacing: "0.08em" }}>WEEK {ccWeekInCycle} VAN 7 · {ccPhaseLabel.toUpperCase()}</div>
                </div>
              </div>
              {canExportTcx && (() => {
                const intervals = JSON.parse(cycStep.intervals_json);
                const ftpW = cc.unit !== 'hr' ? (cc.ftp_watts ?? 200) : null;
                const hrMax = cc.unit === 'hr' ? (cc.max_hr ?? 180) : null;
                const slug = cycStep.name.replace(/[^a-z0-9]+/gi, '_').toLowerCase();
                const dateStr = new Date().toISOString().slice(0, 10);
                const btnStyle = { flexShrink: 0, padding: "6px 10px", borderRadius: 8, fontSize: 10, fontWeight: 800, cursor: "pointer", border: `1px solid ${C.emeraldBorder}`, background: C.emeraldDim, color: C.emerald, whiteSpace: "nowrap" };
                return (
                  <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", gap: 5, flexShrink: 0 }}>
                    <button onClick={() => triggerFileDownload(generateCyclingTcx(cycStep.name, intervals, ftpW, hrMax), `${slug}_${dateStr}.tcx`, 'application/vnd.garmin.tcx+xml')} style={btnStyle}>↓ TCX</button>
                    <button onClick={() => triggerFileDownload(generateZwoFile(cycStep.name, intervals, ftpW), `${slug}_${dateStr}.zwo`, 'application/xml')} style={btnStyle}>↓ ZWO</button>
                    <button onClick={() => triggerFileDownload(generateErgFile(cycStep.name, intervals, ftpW), `${slug}_${dateStr}.erg`, 'text/plain')} style={btnStyle}>↓ ERG</button>
                  </div>
                );
              })()}
              {chev}
            </Glass>
          );
        }
        const goal = GOALS.find((g) => g.value === (prefs.training_goal ?? "health")) ?? GOALS[0];
        const exp  = EXPERIENCE.find((e) => e.value === (prefs.experience_level ?? "beginner")) ?? EXPERIENCE[0];
        const GOAL_FOCUS = {
          health:       'Balanced movement & consistency',
          fat_loss:     'Calorie burn & metabolic conditioning',
          muscle_gain:  'Progressive strength overload',
          strength:     'Maximum force & compound lifts',
          endurance:    'Aerobic capacity & stamina',
          mobility:     'Flexibility, range of motion & recovery',
          mixed:        'Full-body variety across all domains',
        };
        return (
          <Glass style={{ padding: "14px 20px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: C.emeraldDim, border: `1px solid ${C.emeraldBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: C.emerald }}>
                <GoalIcon value={goal.value} size={22} />
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", color: C.muted, textTransform: "uppercase", marginBottom: 2 }}>{t("Training goal")}</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: C.text }}>{t(goal.label)}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{t(GOAL_FOCUS[goal.value] ?? 'Consistent daily movement')}</div>
              </div>
            </div>
            <span style={{ padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: "rgba(var(--overlay-rgb),0.05)", border: `1px solid ${C.border}`, color: C.muted }}>
              {t(exp.label)}
            </span>
          </Glass>
        );
      })()}

      {/* ── Weekly grid ─────────────────────────────── */}
      <Glass style={{ padding: "16px 20px", marginBottom: 16 }}>
        <div style={{ ...eyebrow, color: C.faint, marginBottom: 12 }}>{t("THIS WEEK")}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
          {weekdayLetters(lang).map((d, i) => {
            const status = weekStatusFor(i);
            return (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ ...eyebrow, fontSize: 9, color: C.faint, marginBottom: 6 }}>{d}</div>
                <div style={{
                  height: 36, borderRadius: 10,
                  background: status === "today" ? "var(--accent)" : C.bgCard,
                  border: `1px solid ${status === "today" ? "var(--accent)" : C.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {status === "done" && <Icons.check size={14} c={C.emerald} />}
                  {status === "today" && <Icons.bolt size={14} c={C.onAccent} filled />}
                </div>
              </div>
            );
          })}
        </div>
      </Glass>

      {/* ── Weekly outcome summary ──────────────────── */}
      <Glass style={{ padding: "14px 20px", marginBottom: 8, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ ...eyebrow, fontSize: 9.5, color: C.muted, marginBottom: 6 }}>{t("This week")}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text, lineHeight: 1.4 }}>{weekSummary.message}</div>
        </div>
        <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
          {Array.from({ length: weekSummary.target }).map((_, i) => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: i < weekSummary.done ? "var(--accent)" : "rgba(var(--accent-rgb),0.15)", border: i < weekSummary.done ? "none" : "1px solid rgba(var(--accent-rgb),0.3)" }} />
          ))}
        </div>
      </Glass>

      {/* ── Coach discovery card (after 3 sessions, no specialist coach) ── */}
      {(() => {
        const pref = prefs?.preferences ?? {};
        const milA = !!(pref.military_coach?.active);
        const rcA  = !!(pref.run_coach?.enrolled && !pref.run_coach?.completed);
        const ccA  = !!(pref.cycling_coach?.active && !pref.cycling_coach?.completed);
        const sessions = (history ?? []).length;
        if (milA || rcA || ccA || sessions < 3) return null;
        const dismissed = localStorage.getItem("jf_coach_discovery_dismissed");
        if (dismissed) return null;
        return (
          <div style={{ background: "rgba(var(--overlay-rgb),0.03)", border: `1px solid ${C.border}`, borderRadius: 16, padding: "16px 18px", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ ...eyebrow, color: "var(--accent)", marginBottom: 6 }}>{t("SPECIALIST COACHING")}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text, lineHeight: 1.4, marginBottom: 4 }}>{t("Want a structured training programme?")}</div>
                <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>{t("Add Running, Cycling, or Military coaching as an add-on alongside your current goal.")}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => onNavigateCoach?.()}
                style={{ flex: 1, padding: "10px 0", borderRadius: 12, fontWeight: 800, fontSize: 12, cursor: "pointer", background: "var(--accent-dim)", border: "1px solid var(--accent-border)", color: "var(--accent)" }}
              >
                {t("Explore coaches →")}
              </button>
              <button
                onClick={() => localStorage.setItem("jf_coach_discovery_dismissed", "1")}
                style={{ padding: "10px 14px", borderRadius: 12, fontWeight: 700, fontSize: 12, cursor: "pointer", background: "transparent", border: `1px solid ${C.border}`, color: C.muted }}
              >
                {t("Not for me")}
              </button>
            </div>
          </div>
        );
      })()}

      {/* ── Block C: Quick check-in link ─────────────── */}
      {!todayCompleted && onCheckIn && (
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <button onClick={onCheckIn} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: C.muted, fontFamily: "inherit" }}>
            {t("Updated how you're feeling?")} <span style={{ color: "var(--accent)", fontWeight: 700 }}>{t("Check in →")}</span>
          </button>
        </div>
      )}

    </div>
  );
}
