import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { C } from "./tokens.js";
import { Icons, ExerciseIcon } from "./icons.jsx";
import { musclesFor, formatExDuration, estimateMins } from "./planUtils.js";
import { ALL_EQUIPMENT } from "./appConstants.js";
import api from "./apiClient.js";
import { cacheExercises, getCachedExercises } from "./offlineCache.js";
const MuscleMap = lazy(() => import("./MuscleMap.jsx").then(m => ({ default: m.MuscleMap })));

function ExerciseGif({ gifUrl, name }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 300, margin: "0 auto 24px", borderRadius: 20, overflow: "hidden", background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}` }}>
      {/* Loading skeleton */}
      {!loaded && (
        <div style={{ width: "100%", height: 200, background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 32, height: 32, border: `2px solid ${C.emeraldBorder}`, borderTopColor: C.emerald, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      )}
      <img
        src={gifUrl}
        alt={name}
        onLoad={() => setLoaded(true)}
        style={{ display: loaded ? "block" : "none", width: "100%", maxHeight: 200, objectFit: "cover" }}
      />
    </div>
  );
}

// ─── WORKOUT VIEW — coaching state machine ─────────────────────────────────────
export default function WorkoutView({ plan, onComplete, onBack, cycle, prefs }) {
  const exercises = plan?.steps ?? [];
  const totalExercises = exercises.length;
  const startTimeRef = useRef(Date.now());
  const bodyMode = cycle?.mode ?? "standard";
  const accentHex = prefs?.preferences?.accent ?? localStorage.getItem("jf_accent") ?? "#10b981";

  // ── Core state ──────────────────────────────────────────────────────────────
  const [exIdx, setExIdx] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [repCount, setRepCount] = useState(0);
  const [phase, setPhase] = useState(
    !plan || plan.slot_type === "rest" ? "restDay" : totalExercises > 0 ? "overview" : "sessionFeedback"
  );
  const [restRemaining, setRestRemaining] = useState(60);
  const [restTotal, setRestTotal] = useState(60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerRemaining, setTimerRemaining] = useState(0);
  const [adjustedReps, setAdjustedReps] = useState(null);
  const [adjustedDuration, setAdjustedDuration] = useState(null);
  const [showCancel, setShowCancel] = useState(false);
  const [tapFlash, setTapFlash] = useState(false); // visual flash on rep tap
  const [adjustLabel, setAdjustLabel] = useState(""); // "Adjusted to N reps" toast
  const adjustLabelTimerRef = useRef(null);
  // Alternatives
  const isPregnancyMode = bodyMode === "pregnant" || bodyMode === "postnatal";
  const [showBreathingReminder, setShowBreathingReminder] = useState(false);
  const [rpeValue, setRpeValue] = useState(5);
  const breathingTimerRef = useRef(null);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [altExercises, setAltExercises] = useState([]);
  const [altLoading, setAltLoading] = useState(false);
  const [exerciseOverrides, setExerciseOverrides] = useState({}); // { [idx]: exercise }
  const restStartedAtRef = useRef(0);   // ms timestamp when rest phase began
  const timerTotalRef = useRef(0);      // total duration (sec) when exercise timer starts
  const backgroundedAtRef = useRef(0); // ms timestamp when page was hidden during rest
  // Track actual data per exercise for saving
  const stepsActualRef = useRef(
    exercises.map((ex) => ({
      exercise_id: ex.exercise_id,
      prescribed: { sets: ex.sets, reps: ex.target_reps, duration_sec: ex.target_duration_sec, rest_sec: ex.rest_sec },
      actual: {
        sets_completed: 0,
        reps_per_set: [],          // actual reps per set (or seconds for time-based)
        rest_taken_seconds: [],    // actual rest duration between sets
        target_adjusted: false,
        target_original: null,
        target_final: null,
        adjustment_direction: null,
        exercise_substituted: false,
        original_exercise_id: null,
        substitute_exercise_id: null,
        skipped: false,
        completed_at_ms: null,
      },
    }))
  );

  const cur = exerciseOverrides[exIdx] ?? exercises[exIdx];
  const totalSets = cur?.sets ?? 3;
  const isTimeBased = !cur?.target_reps && !!cur?.target_duration_sec;
  const targetReps = adjustedReps ?? cur?.target_reps ?? 10;

  // ── Wake Lock — keep screen on during active workout ─────────────────────────
  const wakeLockRef = useRef(null);
  const [wakeLockDenied, setWakeLockDenied] = useState(false);
  useEffect(() => {
    const activePhases = ["instruction", "working", "resting"];
    if (!activePhases.includes(phase)) {
      if (wakeLockRef.current) { wakeLockRef.current.release(); wakeLockRef.current = null; }
      return;
    }
    if (!("wakeLock" in navigator)) { setWakeLockDenied(true); return; }
    if (wakeLockRef.current) return; // already held
    const acquire = () => {
      if (wakeLockRef.current) return;
      navigator.wakeLock.request("screen").then((lock) => {
        wakeLockRef.current = lock;
        lock.addEventListener("release", () => { wakeLockRef.current = null; });
      }).catch(() => setWakeLockDenied(true));
    };
    acquire();
    // Re-acquire after user returns to tab (browser releases wake lock on visibility change)
    const onVisible = () => { if (document.visibilityState === "visible") acquire(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      if (wakeLockRef.current) { wakeLockRef.current.release(); wakeLockRef.current = null; }
    };
  }, [phase]);

  // ── Rest countdown ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "resting" || restRemaining <= 0) return;
    const id = setTimeout(() => setRestRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearTimeout(id);
  }, [phase, restRemaining]);

  // ── Rest timer: pause on visibility change, correct drift on resume ──────────
  useEffect(() => {
    if (phase !== "resting") return;
    const handleVisibility = () => {
      if (document.hidden) {
        backgroundedAtRef.current = Date.now();
      } else if (backgroundedAtRef.current > 0) {
        const elapsedSec = Math.round((Date.now() - backgroundedAtRef.current) / 1000);
        backgroundedAtRef.current = 0;
        setRestRemaining((r) => Math.max(0, r - elapsedSec));
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [phase]);

  useEffect(() => {
    if (phase !== "resting" || restRemaining > 0) return;
    // Record actual rest taken (natural completion — full rest elapsed)
    const actualRest = restStartedAtRef.current > 0
      ? Math.round((Date.now() - restStartedAtRef.current) / 1000)
      : 0;
    stepsActualRef.current[exIdx]?.actual?.rest_taken_seconds?.push(actualRest);
    setCurrentSet((s) => s + 1);
    setRepCount(0);
    setPhase("working");
  // exIdx is stable during resting; restStartedAtRef is a ref (always current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, restRemaining]);

  // ── Exercise timer ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!timerRunning || timerRemaining <= 0) return;
    const id = setTimeout(() => setTimerRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearTimeout(id);
  }, [timerRunning, timerRemaining]);

  useEffect(() => {
    if (!timerRunning || timerRemaining > 0) return;
    setTimerRunning(false);
    // Pass full timer duration so actual_json records correct seconds completed
    handleSetDone(timerTotalRef.current);
  // handleSetDone is a stable function reference that changes with exIdx/currentSet;
  // adding it would cause this effect to re-fire on every set transition, not just timer expiry.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerRunning, timerRemaining]);

  // Auto-advance removed — user reads instructions at their own pace

  // ── Rest haptics at 10s and 5s ───────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "resting") return;
    if (restRemaining === 10 || restRemaining === 5) {
      if (navigator.vibrate) navigator.vibrate(60);
    }
  }, [phase, restRemaining]);

  function handlePrevExercise() {
    if (exIdx <= 0) return;
    setExIdx((i) => i - 1);
    setCurrentSet(1);
    setRepCount(0);
    setAdjustedReps(null);
    setAdjustedDuration(null);
    setPhase("instruction");
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function getRestDuration(ex) {
    const tags = JSON.parse(ex?.tags_json || "[]");
    if (plan?.slot_type === "micro") return 20;
    if (tags.includes("pelvic_floor")) return 30;
    if (tags.includes("mobility")) return 20;
    if (tags.includes("cardio")) return 30;
    if (tags.includes("bodyweight")) return 45;
    const base = ex?.rest_sec ?? 60;
    return isPregnancyMode ? base + 15 : base;
  }

  function handleSetDone(repsThisSet) {
    const reps = repsThisSet ?? repCount;
    const actualEntry = stepsActualRef.current[exIdx]?.actual;
    if (actualEntry) {
      actualEntry.reps_per_set.push(reps);
      actualEntry.sets_completed += 1;
      // Record target adjustment info (on first set that differs from prescribed)
      if (!actualEntry.target_adjusted) {
        const prescribedTarget = isTimeBased ? (cur?.target_duration_sec ?? 30) : (cur?.target_reps ?? 10);
        const finalTarget = isTimeBased ? (adjustedDuration ?? prescribedTarget) : (adjustedReps ?? prescribedTarget);
        if (finalTarget !== prescribedTarget) {
          actualEntry.target_adjusted = true;
          actualEntry.target_original = prescribedTarget;
          actualEntry.target_final = finalTarget;
          actualEntry.adjustment_direction = finalTarget < prescribedTarget ? "down" : "up";
        }
      }
      // Mark completed timestamp on last set
      if (currentSet >= totalSets) {
        actualEntry.completed_at_ms = Date.now();
      }
    }

    if (currentSet < totalSets) {
      const rest = getRestDuration(cur);
      restStartedAtRef.current = Date.now();
      setRestRemaining(rest);
      setRestTotal(rest);
      if (isPregnancyMode) {
        setShowBreathingReminder(true);
        clearTimeout(breathingTimerRef.current);
        breathingTimerRef.current = setTimeout(() => setShowBreathingReminder(false), 3000);
      }
      setPhase("resting");
    } else {
      if (exIdx < totalExercises - 1) {
        setExIdx((i) => i + 1);
        setCurrentSet(1);
        setRepCount(0);
        setAdjustedReps(null);
        setAdjustedDuration(null);
        setPhase("instruction");
      } else {
        setPhase("sessionFeedback");
      }
    }
  }

  function handleRepTapped() {
    if (navigator.vibrate) navigator.vibrate(30);
    setTapFlash(true);
    setTimeout(() => setTapFlash(false), 180);
    const next = repCount + 1;
    setRepCount(next);
    if (next >= targetReps) {
      setTimeout(() => handleSetDone(next), 220);
    }
  }

  function handleSkipRest() {
    // Record actual rest taken before skipping
    const actualRest = restStartedAtRef.current > 0
      ? Math.round((Date.now() - restStartedAtRef.current) / 1000)
      : 0;
    stepsActualRef.current[exIdx]?.actual?.rest_taken_seconds?.push(actualRest);
    restStartedAtRef.current = 0;
    setRestRemaining(0);
    setCurrentSet((s) => s + 1);
    setRepCount(0);
    setPhase("working");
  }

  function handleSkipExercise() {
    const actualEntry = stepsActualRef.current[exIdx]?.actual;
    if (actualEntry) { actualEntry.skipped = true; actualEntry.completed_at_ms = Date.now(); }
    if (exIdx < totalExercises - 1) {
      setExIdx((i) => i + 1);
      setCurrentSet(1);
      setRepCount(0);
      setAdjustedReps(null);
      setAdjustedDuration(null);
      setPhase("instruction");
    } else {
      setPhase("sessionFeedback");
    }
  }

  function handleFinishSession(perceivedExertion) {
    const durationSec = Math.floor((Date.now() - startTimeRef.current) / 1000);
    onComplete(durationSec, perceivedExertion, stepsActualRef.current);
  }

  function handleAdjust(delta) {
    if (isTimeBased) {
      setAdjustedDuration((prev) => {
        const current = prev ?? cur?.target_duration_sec ?? 30;
        const next = Math.max(10, Math.min(300, current + delta));
        showAdjustLabel(`Adjusted to ${next}s`);
        return next;
      });
    } else {
      setAdjustedReps((prev) => {
        const current = prev ?? cur?.target_reps ?? 10;
        const next = Math.max(1, Math.min(30, current + delta));
        showAdjustLabel(`Adjusted to ${next} reps`);
        return next;
      });
    }
  }

  function showAdjustLabel(text) {
    setAdjustLabel(text);
    clearTimeout(adjustLabelTimerRef.current);
    adjustLabelTimerRef.current = setTimeout(() => setAdjustLabel(""), 2000);
  }

  async function handleOpenAlternatives() {
    setShowAlternatives(true);
    const altJson = cur?.alternatives_json;
    const slugs = altJson ? (JSON.parse(altJson)?.substitutions ?? []) : [];
    if (!slugs.length) { setAltExercises([]); return; }
    setAltLoading(true);
    try {
      const found = await api.getExercisesBySlugs(slugs);
      setAltExercises(found);
      cacheExercises(found);   // write-through: available offline next time
    } catch {
      const cached = await getCachedExercises(slugs);
      setAltExercises(cached); // serve from IDB when network unavailable
    } finally {
      setAltLoading(false);
    }
  }

  function handleChooseAlternative(altEx) {
    // Build a replacement step keeping the current sets/reps/rest
    const replacement = {
      ...altEx,
      exercise_id: altEx.id,
      exercise_slug: altEx.slug,
      tags_json: altEx.tags_json ?? "[]",
      instructions_json: altEx.instructions_json ?? null,
      alternatives_json: altEx.alternatives_json ?? null,
      sets: cur?.sets ?? 3,
      target_reps: cur?.target_reps,
      target_duration_sec: cur?.target_duration_sec,
      rest_sec: cur?.rest_sec,
      substituted: true,
      original_exercise_id: cur?.exercise_id,
    };
    setExerciseOverrides((prev) => ({ ...prev, [exIdx]: replacement }));
    // Update actual tracking
    stepsActualRef.current[exIdx] = {
      exercise_id: altEx.id,
      prescribed: stepsActualRef.current[exIdx]?.prescribed ?? {},
      actual: {
        sets_completed: 0, reps_per_set: [], rest_taken_seconds: [],
        target_adjusted: false, target_original: null, target_final: null, adjustment_direction: null,
        exercise_substituted: true, original_exercise_id: cur?.exercise_id, substitute_exercise_id: altEx.id,
        skipped: false, completed_at_ms: null,
      },
    };
    setShowAlternatives(false);
    setRepCount(0);
    setCurrentSet(1);
    setAdjustedReps(null);
    setAdjustedDuration(null);
    setPhase("instruction");
  }

  // ── Session progress ─────────────────────────────────────────────────────────
  const totalUnits = exercises.reduce((sum, ex) => sum + (ex.sets ?? 3), 0);
  const doneUnits = exercises
    .slice(0, exIdx)
    .reduce((sum, ex) => sum + (ex.sets ?? 3), 0) + (currentSet - 1);
  const progressPct = totalUnits > 0 ? Math.min(100, (doneUnits / totalUnits) * 100) : 0;

  // ── Rest day / no exercises ──────────────────────────────────────────────────
  if (phase === "restDay") {
    return (
      <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 20 }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: C.emeraldDim, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={C.emerald} strokeWidth="1.5">
            <rect width="18" height="18" x="3" y="4" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 28, fontWeight: 900, color: C.text }}>Time to Recover.</div>
          <p style={{ fontSize: 14, color: C.muted, marginTop: 8, lineHeight: 1.5 }}>Your plan calls for active recovery today.</p>
        </div>
        <button onClick={onBack} style={{ padding: "12px 28px", borderRadius: 16, fontWeight: 700, fontSize: 14, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, color: C.emerald, cursor: "pointer" }}>
          Return Home
        </button>
      </div>
    );
  }

  // ── Full-screen workout overlay ──────────────────────────────────────────────
  return (
    <div style={{ position: "fixed", inset: 0, background: C.bg, zIndex: 50, display: "flex", flexDirection: "column", overflow: "hidden", paddingTop: "env(safe-area-inset-top)" }}>
      {/* Cancel confirmation overlay */}
      {showCancel && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(2,6,23,0.9)", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Glass style={{ padding: 32, maxWidth: 320, width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: C.text, marginBottom: 8 }}>Quit workout?</div>
            <p style={{ fontSize: 14, color: C.muted, marginBottom: 28, lineHeight: 1.5 }}>Your progress won't be saved.</p>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setShowCancel(false)} style={{ flex: 1, padding: "14px 0", borderRadius: 14, fontWeight: 700, fontSize: 14, background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, color: C.text, cursor: "pointer" }}>
                Resume
              </button>
              <button onClick={onBack} style={{ flex: 1, padding: "14px 0", borderRadius: 14, fontWeight: 700, fontSize: 14, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", cursor: "pointer" }}>
                Quit
              </button>
            </div>
          </Glass>
        </div>
      )}

      {/* Wake lock fallback — non-intrusive hint if screen lock can't be prevented */}
      {wakeLockDenied && ["instruction","working","resting"].includes(phase) && (
        <div style={{ flexShrink: 0, background: "rgba(245,158,11,0.12)", borderBottom: "1px solid rgba(245,158,11,0.25)", padding: "8px 20px", textAlign: "center" }}>
          <span style={{ fontSize: 12, color: C.amber }}>Tip: disable auto-lock in Phone Settings to keep your screen on.</span>
        </div>
      )}

      {/* Session header */}
      {phase !== "sessionFeedback" && phase !== "overview" && (
        <div style={{ flexShrink: 0, borderBottom: `1px solid ${C.border}`, background: C.bg }}>
          <div style={{ maxWidth: 560, margin: "0 auto", padding: "14px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button onClick={() => setShowCancel(true)} style={{ fontSize: 13, fontWeight: 700, color: C.muted, background: "none", border: "none", cursor: "pointer", padding: "4px 0", minHeight: 44, display: "flex", alignItems: "center" }}>
                ← Cancel
              </button>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: C.text, letterSpacing: "-0.02em" }}>
                  {phase === "resting" ? exercises[exIdx]?.name : cur?.name}
                </div>
                <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginTop: 2 }}>
                  {exIdx + 1} of {totalExercises} exercises
                </div>
              </div>
              <div style={{ minWidth: 56, textAlign: "right" }}>
                {phase === "resting" || phase === "working"
                  ? <span style={{ fontSize: 12, fontWeight: 900, color: C.emerald, letterSpacing: "0.06em", textTransform: "uppercase" }}>Set {currentSet}/{totalSets}</span>
                  : phase === "instruction" && exIdx > 0
                  ? <button onClick={handlePrevExercise} style={{ fontSize: 13, fontWeight: 700, color: C.muted, background: "none", border: "none", cursor: "pointer", padding: "4px 0", minHeight: 44, display: "flex", alignItems: "center", marginLeft: "auto" }}>← Prev</button>
                  : null}
              </div>
            </div>
            {/* Progress bar */}
            <div style={{ marginTop: 10, height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progressPct}%`, background: C.emerald, borderRadius: 2, transition: "width 0.4s ease" }} />
            </div>
          </div>
        </div>
      )}

      {/* ── OVERVIEW PHASE ── */}
      {phase === "overview" && (() => {
        const allEquipment = [...new Set(
          exercises.flatMap(s => JSON.parse(s.equipment_required_json || '["none"]'))
        )].filter(e => e !== "none" && e !== "chair");
        const estMins = estimateMins(plan);
        const ovPrefs = prefs?.preferences?.time_overhead;
        const ovKeys = ["change_clothes", "prepare_equipment", "clean_equipment", "shower"];
        const ovTotal = (profile) => ovKeys.reduce((s, k) => s + (profile?.presets?.[k] || 0), 0) + (profile?.custom_minutes || 0);
        const ovMins = ovPrefs?.enabled ? ovTotal(plan?.slot_type === "micro" ? ovPrefs.short : ovPrefs.long) : 0;
        const totalMinsOv = estMins !== null ? estMins + ovMins : null;
        return (
          <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
            {/* Overview header */}
            <div style={{ flexShrink: 0, borderBottom: `1px solid ${C.border}`, background: C.bg }}>
              <div style={{ maxWidth: 560, margin: "0 auto", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <button onClick={onBack} style={{ fontSize: 13, fontWeight: 700, color: C.muted, background: "none", border: "none", cursor: "pointer", padding: "4px 0", minHeight: 44, display: "flex", alignItems: "center" }}>
                  ← Back
                </button>
                <div style={{ fontSize: 13, fontWeight: 800, color: C.text }}>{plan.session_name}</div>
                <div style={{ minWidth: 56 }} />
              </div>
            </div>

            {/* Scrollable body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px 120px" }}>
              <div style={{ maxWidth: 560, margin: "0 auto" }}>

                {/* Session headline */}
                <div style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: 26, fontWeight: 900, color: C.text, letterSpacing: "-0.03em", marginBottom: 6 }}>{plan.session_name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 13, color: C.muted, fontWeight: 600 }}>{exercises.length} exercises</span>
                    <span style={{ width: 3, height: 3, borderRadius: "50%", background: C.subtle, display: "inline-block" }} />
                    {totalMinsOv && <span style={{ fontSize: 13, color: C.muted, fontWeight: 600 }}>~{totalMinsOv} min{ovMins > 0 ? ` incl. ${ovMins}m overhead` : ""}</span>}
                    <span style={{ width: 3, height: 3, borderRadius: "50%", background: C.subtle, display: "inline-block" }} />
                    <span style={{ fontSize: 12, fontWeight: 800, color: { low: "#6ee7b7", moderate: C.emerald, high: C.amber }[plan.intensity] ?? C.emerald, textTransform: "uppercase", letterSpacing: "0.08em" }}>{plan.intensity}</span>
                  </div>
                </div>

                {/* Equipment */}
                {allEquipment.length > 0 && (() => {
                  const stationaryIds = new Set(["treadmill","exercise_bike","indoor_bike","rowing_machine","elliptical","squat_rack","bench_press_rack","smith_machine","power_tower","punching_bag"]);
                  const portable   = allEquipment.filter(e => !stationaryIds.has(e));
                  const stationary = allEquipment.filter(e => stationaryIds.has(e));
                  const Chip = ({ eq }) => (
                    <span style={{ padding: "6px 14px", borderRadius: 999, fontSize: 12, fontWeight: 700, background: C.emeraldDim, border: `1px solid ${C.emeraldBorder}`, color: C.emerald }}>
                      {ALL_EQUIPMENT.find(e => e.value === eq)?.label ?? eq.replace(/_/g, " ")}
                    </span>
                  );
                  return (
                    <div style={{ marginBottom: 28 }}>
                      {portable.length > 0 && (
                        <div style={{ marginBottom: stationary.length > 0 ? 14 : 0 }}>
                          <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", color: C.emerald, textTransform: "uppercase", marginBottom: 8 }}>Grab these</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            {portable.map(eq => <Chip key={eq} eq={eq} />)}
                          </div>
                        </div>
                      )}
                      {stationary.length > 0 && (
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", color: C.emerald, textTransform: "uppercase", marginBottom: 8 }}>Make sure this is set up</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            {stationary.map(eq => <Chip key={eq} eq={eq} />)}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Exercise list */}
                <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", color: C.emerald, textTransform: "uppercase", marginBottom: 12 }}>Your session</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {exercises.map((s, i) => {
                    const instr = s.instructions_json ? JSON.parse(s.instructions_json) : null;
                    const firstStep = instr?.steps?.[0] ?? null;
                    const isRunInterval = JSON.parse(s.tags_json || "[]").includes("run_interval");
                    const metricsRestSec = s.rest_sec;
                    return (
                      <div key={i} style={{ padding: "14px 16px", borderRadius: 16, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}` }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: firstStep ? 8 : 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 22, height: 22, borderRadius: "50%", background: C.emeraldDim, border: `1px solid ${C.emeraldBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <span style={{ fontSize: 10, fontWeight: 900, color: C.emerald }}>{i + 1}</span>
                            </div>
                            <span style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{s.name}</span>
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: C.muted, flexShrink: 0, whiteSpace: "nowrap" }}>
                            {isRunInterval
                              ? `${s.sets} × ${s.target_duration_sec}/${metricsRestSec}`
                              : s.target_reps
                                ? `${s.sets} × ${s.target_reps} reps`
                                : `${s.sets} × ${formatExDuration(s.target_duration_sec)}`}
                          </span>
                        </div>
                        {firstStep && (
                          <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6, paddingLeft: 32 }}>{firstStep}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Fixed Start Workout button */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: `16px 20px max(24px, env(safe-area-inset-bottom))`, background: `linear-gradient(to top, ${C.bg} 70%, transparent)` }}>
              <div style={{ maxWidth: 560, margin: "0 auto" }}>
                <button
                  onClick={() => setPhase("instruction")}
                  style={{ width: "100%", padding: "18px 0", borderRadius: 18, fontSize: 16, fontWeight: 900, background: C.emerald, border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "0 8px 30px rgba(var(--accent-rgb),0.35)" }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                  Start Workout
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Phase content */}
      <div style={{ flex: 1, overflow: "auto", display: phase === "overview" ? "none" : undefined }}>
        {/* ── INSTRUCTION PHASE ── */}
        {phase === "instruction" && cur && (() => {
          const instr = cur.instructions_json ? JSON.parse(cur.instructions_json) : null;
          const rawSteps = instr?.steps ?? [];
          const cues = instr?.cues ?? [];
          const tags = JSON.parse(cur.tags_json || "[]");

          // Pad to minimum 3 steps so the instruction phase never feels empty
          const GENERIC_STEPS = [
            "Set up in the correct starting position.",
            "Focus on controlled movement — quality over speed.",
            "Finish strong. You've got this.",
          ];
          const paddedSteps = rawSteps.length >= 3
            ? rawSteps
            : [...rawSteps, ...GENERIC_STEPS.slice(rawSteps.length)];

          // Build card slides: prepend pregnancy/postnatal notes as accented first card
          const pregnancyNote = isPregnancyMode && bodyMode === "pregnant" ? instr?.pregnancy_note : null;
          const postnatalNote = isPregnancyMode && bodyMode === "postnatal" ? instr?.postnatal_note : null;
          const isPelvicFloor = bodyMode === "postnatal" && tags.includes("pelvic_floor");

          // Card objects: { text, accent } — accent null means standard style
          const rawCards = paddedSteps.map((s) => ({ text: s, accent: null }));
          if (pregnancyNote) rawCards.unshift({ text: pregnancyNote, accent: "amber" });
          if (postnatalNote) rawCards.unshift({ text: postnatalNote, accent: "rose" });
          if (isPelvicFloor) rawCards.push({ text: "Remember: the release is just as important as the squeeze. Full relaxation between each rep.", accent: "rose" });
          // Equipment for this exercise (filter trivial items)
          const exEquip = JSON.parse(cur.equipment_required_json || '["none"]')
            .filter(e => e !== "none" && e !== "chair");
          const isFloorEx = tags.some(t => ["floor","supine","prone","mobility","pelvic_floor"].includes(t)) || cur.category === "mobility";
          const showMatHint = isFloorEx && exEquip.length === 0; // suggest mat only when no other equipment

          // Split cues into level-specific (prefixed "Beginner:" etc.) and general.
          // Handles two DB patterns:
          //   Pattern B: separate "💡 Beginner: ..." / "💡 Intermediate: ..." / "💡 Advanced: ..." cues
          //   Pattern A: combined "💡 💡 Beginner: ... Advanced: ..." (space between emojis — treated as general)
          const expLevel = plan?.experience_level ?? 'intermediate';
          const LEVEL_PREFIXES = ['Beginner', 'Intermediate', 'Advanced'];
          const stripEmoji = s => s.replace(/^(💡\s*)+/, "").trim();
          // A cue is single-level-specific when it starts with exactly one level keyword
          const isSingleLevel = c => {
            const clean = stripEmoji(c);
            const starts = LEVEL_PREFIXES.filter(p => clean.toLowerCase().startsWith(p.toLowerCase() + ':'));
            return starts.length === 1;
          };
          const levelTarget = cues.find(c => {
            if (!isSingleLevel(c)) return false;
            const clean = stripEmoji(c);
            return clean.toLowerCase().startsWith(expLevel.toLowerCase() + ':');
          });
          const levelTargetText = levelTarget
            ? stripEmoji(levelTarget).replace(/^(Beginner|Intermediate|Advanced):\s*/i, "").trim()
            : null;

          // Derive muscle/body target from category + tags + name (no DB change needed)
          const deriveTarget = () => {
            const n = (cur.name ?? "").toLowerCase();
            if (tags.includes("pelvic_floor")) return "Pelvic Floor";
            if (tags.includes("crunch") || n.includes("crunch") || n.includes("sit-up") || n.includes("sit up")) return "Core & Abs";
            if (cur.category === "recovery") return "Active Recovery";
            if (cur.category === "mobility") return "Flexibility & Joint Health";
            if (cur.category === "cardio") return "Cardiovascular System";
            if (n.includes("push") || n.includes("press") || n.includes("chest") || n.includes("dip") || n.includes("tricep")) return "Chest & Triceps";
            if (n.includes("pull") || n.includes("row") || n.includes("back") || n.includes("bicep") || n.includes("curl") || n.includes("lat")) return "Back & Biceps";
            if (n.includes("squat") || n.includes("lunge") || n.includes("leg") || n.includes("glute") || n.includes("hip") || n.includes("deadlift") || n.includes("rdl")) return "Legs & Glutes";
            if (n.includes("shoulder") || n.includes("lateral") || n.includes("overhead") || n.includes("ohp")) return "Shoulders";
            if (n.includes("plank") || n.includes("core") || n.includes("bridge") || n.includes("hollow") || n.includes("rotation") || n.includes("twist")) return "Core & Stability";
            if (tags.includes("strength")) return "Full Body Strength";
            return null;
          };
          const muscleTarget = deriveTarget();
          const muscles = musclesFor(cur);
          const hasMuscles = muscles.primary.length > 0 || muscles.secondary.length > 0;
          const gender = prefs?.sex === "female" ? "female" : "male";

          // BMI-aware pace note for cardio exercises when BMI ≥ 30
          const bmiNote = (() => {
            const w = prefs?.weight_kg, h = prefs?.height_cm;
            if (!w || !h) return null;
            const bmi = w / ((h / 100) ** 2);
            if (bmi < 30) return null;
            const isCardio = cur.category === 'cardio' || tags.includes('cardio');
            if (!isCardio) return null;
            if (bmi >= 35) return "Start at a pace where you can hold a full conversation. If breathing becomes laboured, slow down or pause — that's not a setback, it's the right call.";
            return "Keep your pace conversational — you should be able to speak short sentences throughout. Progress comes from consistency, not from pushing to breathless today.";
          })();

          // Interval structure: detected by slug for run/walk intervals
          // Shows "Run Xmin · Walk Ymin · × N rounds" as a concrete beginner-friendly target
          const isRunInterval = (cur.exercise_slug ?? '').startsWith('run-interval-level-');
          const formatIntervalTime = (sec) => {
            if (!sec) return '?';
            if (sec < 60) return `${sec}s`;
            const m = Math.floor(sec / 60), s = sec % 60;
            return s > 0 ? `${m}:${String(s).padStart(2,'0')}` : `${m} min`;
          };
          const intervalStructureText = isRunInterval && cur.sets > 1 && cur.target_duration_sec
            ? `Run ${formatIntervalTime(cur.target_duration_sec)} · Walk ${formatIntervalTime(cur.rest_sec)} · × ${cur.sets} rounds`
            : null;

          // Final "Your target" content — prefer level-specific cue, fall back to interval structure
          const targetCardText = levelTargetText ?? intervalStructureText;

          // General cues = non-level-specific cues shown in "Why this helps".
          // Single-level cues (Pattern B) are filtered out; multi-level combined cues (Pattern A) kept for all.
          const cleanCues = cues
            .filter(c => !isSingleLevel(c))
            .map(c => {
              const emojiCount = (c.match(/^(💡\s*)+/)?.[0]?.match(/💡/g) ?? []).length;
              return { text: stripEmoji(c), level: emojiCount >= 2 ? 2 : 1 };
            });

          // Fallback "why" derived from category when no general cues exist in DB
          const derivedWhy = (() => {
            if (cleanCues.length > 0) return null;
            if (cur.category === 'recovery') return "Supports muscle recovery and keeps you ready for your next session.";
            if (cur.category === 'mobility') return "Maintains joint range of motion and helps prevent injury over time.";
            if (cur.category === 'cardio') return "Trains your heart and lungs — the base that makes every other exercise feel easier.";
            if (tags.includes('core') || tags.includes('pelvic_floor')) return "A strong core and stable pelvis protect your spine and improve every other movement.";
            if (tags.includes('bodyweight')) return "Bodyweight strength builds movement quality and control before adding load.";
            if (cur.category === 'strength') return "Progressive strength training increases muscle, improves bone density, and raises your resting metabolism.";
            return "Consistent movement in this pattern builds the physical capacity your goal requires.";
          })();

          return (
            <>
            <div style={{ maxWidth: 560, margin: "0 auto", padding: "24px 20px 100px", display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Exercise name + target */}
              <div style={{ textAlign: "center", marginBottom: 4 }}>
                {cur.gif_url && <ExerciseGif gifUrl={cur.gif_url} name={cur.name} />}
                <h1 style={{ fontSize: 32, fontWeight: 900, color: C.text, letterSpacing: "-0.03em", marginBottom: 8, lineHeight: 1.1 }}>
                  {cur.name}
                </h1>
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  {muscleTarget && <>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.muted }}>{muscleTarget}</span>
                    <span style={{ fontSize: 13, color: C.subtle }}>·</span>
                  </>}
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.emerald }}>
                    {totalSets} {totalSets === 1 ? "set" : "sets"}
                  </span>
                  <span style={{ fontSize: 13, color: C.subtle }}>·</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.emerald }}>
                    {isTimeBased ? formatExDuration(cur.target_duration_sec) : `${targetReps} reps`}
                  </span>
                </div>
              </div>

              {/* ── Card 1: Equipment (only when needed) ── */}
              {(exEquip.length > 0 || showMatHint) && (
                <div style={{ borderRadius: 20, padding: "16px 20px", background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", color: C.muted, textTransform: "uppercase", marginBottom: 10 }}>Equipment</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {exEquip.map(eq => (
                      <span key={eq} style={{ padding: "5px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700, background: C.emeraldDim, border: `1px solid ${C.emeraldBorder}`, color: C.emerald }}>
                        {ALL_EQUIPMENT.find(e => e.value === eq)?.label ?? eq.replace(/_/g, " ")}
                      </span>
                    ))}
                    {showMatHint && (
                      <span style={{ padding: "5px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, color: C.muted }}>
                        Yoga / exercise mat (optional)
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* ── Card: Muscles targeted ── */}
              {hasMuscles && (
                <div style={{ borderRadius: 20, padding: "16px 20px", background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", color: C.muted, textTransform: "uppercase", marginBottom: 12 }}>Muscles targeted</div>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <Suspense fallback={null}>
                      <MuscleMap primary={muscles.primary} secondary={muscles.secondary} gender={gender} size={180} showLabels={false} primaryColor={accentHex} secondaryColor={`${accentHex}50`} />
                    </Suspense>
                  </div>
                </div>
              )}

              {/* ── Card 2: Instructions — highlighted like today card ── */}
              <div style={{ borderRadius: 20, padding: "18px 20px", background: "linear-gradient(135deg, rgba(var(--accent-rgb),0.08) 0%, rgba(2,6,23,0.6) 100%)", border: `1px solid ${C.emeraldBorder}` }}>
                <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", color: C.emerald, textTransform: "uppercase", marginBottom: 12 }}>Instructions</div>

                {/* Pregnancy / postnatal alert at top of instructions */}
                {(pregnancyNote || postnatalNote) && (
                  <div style={{ marginBottom: 12, padding: "10px 14px", borderRadius: 12, background: postnatalNote ? C.roseDim : C.amberDim, border: `1px solid ${postnatalNote ? C.roseBorder : C.amberBorder}` }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: postnatalNote ? C.rose : C.amber, margin: 0, lineHeight: 1.6 }}>
                      {postnatalNote ?? pregnancyNote}
                    </p>
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {paddedSteps.map((step, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: C.emeraldDim, border: `1px solid ${C.emeraldBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                        <span style={{ fontSize: 10, fontWeight: 900, color: C.emerald }}>{i + 1}</span>
                      </div>
                      <p style={{ fontSize: 15, fontWeight: 600, color: C.text, lineHeight: 1.6, margin: 0 }}>{step}</p>
                    </div>
                  ))}
                  {isPelvicFloor && (
                    <div style={{ marginTop: 4, padding: "10px 14px", borderRadius: 12, background: C.roseDim, border: "1px solid rgba(244,63,94,0.3)" }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: C.rose, margin: 0, lineHeight: 1.6 }}>Remember: the release is just as important as the squeeze. Full relaxation between each rep.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Card 3: Your target today (level-specific or interval structure) ── */}
              {targetCardText && (
                <div style={{ borderRadius: 20, padding: "16px 20px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.3)" }}>
                  <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", color: C.emerald, textTransform: "uppercase", marginBottom: 8 }}>
                    Your target · {expLevel.charAt(0).toUpperCase() + expLevel.slice(1)}
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: C.emerald, margin: 0, lineHeight: 1.6 }}>{targetCardText}</p>
                  {/* For intervals: also show pace guidance from level-specific cue if we're showing the structure */}
                  {intervalStructureText && levelTargetText && (
                    <p style={{ fontSize: 13, color: C.emerald, margin: "6px 0 0", opacity: 0.75, lineHeight: 1.5 }}>{levelTargetText}</p>
                  )}
                </div>
              )}

              {/* ── Card 4: Why (general cues, or derived fallback) ── */}
              {(cleanCues.length > 0 || derivedWhy) && (
                <div style={{ borderRadius: 20, padding: "16px 20px", background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", color: C.muted, textTransform: "uppercase", marginBottom: 10 }}>Why this helps</div>
                  {cleanCues.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {cleanCues.map((cue, i) => (
                        <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, marginTop: 7, background: cue.level >= 2 ? "var(--accent)" : "rgba(var(--accent-rgb),0.35)" }} />
                          <p style={{ fontSize: 13, color: cue.level >= 2 ? C.text : C.muted, lineHeight: 1.6, margin: 0 }}>{cue.text}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, margin: 0 }}>{derivedWhy}</p>
                  )}
                </div>
              )}

              {/* ── Card: BMI pace guidance (cardio, BMI ≥ 30 only) ── */}
              {bmiNote && (
                <div style={{ borderRadius: 20, padding: "16px 20px", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.25)" }}>
                  <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", color: "#f59e0b", textTransform: "uppercase", marginBottom: 8 }}>Pace guidance</div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#f59e0b", margin: 0, lineHeight: 1.6 }}>{bmiNote}</p>
                </div>
              )}

              {/* ── Card: Weight & rep strategy (weighted exercises only) ── */}
              {cur.coaching_note && (
                <div style={{ borderRadius: 20, padding: "16px 20px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.3)" }}>
                  <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", color: C.emerald, textTransform: "uppercase", marginBottom: 10 }}>Weight &amp; rep strategy</div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: C.emerald, margin: 0, lineHeight: 1.6 }}>{cur.coaching_note}</p>
                </div>
              )}

            </div>
            <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "12px 20px max(20px, env(safe-area-inset-bottom))", background: "linear-gradient(to top, #020617 65%, transparent)" }}>
              <div style={{ maxWidth: 560, margin: "0 auto" }}>
                <button
                  onClick={() => setPhase("working")}
                  style={{ width: "100%", padding: "18px 0", borderRadius: 18, fontSize: 16, fontWeight: 900, background: C.emerald, border: "none", color: "#fff", cursor: "pointer", boxShadow: "0 8px 32px rgba(var(--accent-rgb),0.3)", letterSpacing: "-0.01em" }}
                >
                  Ready — let's go →
                </button>
              </div>
            </div>
          </>
          );
        })()}

        {/* ── WORKING PHASE ── */}
        {phase === "working" && cur && (
          <div style={{ maxWidth: 560, margin: "0 auto", padding: "24px 20px 120px", display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>
                Set {currentSet} of {totalSets}
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: C.text, letterSpacing: "-0.02em" }}>{cur.name}</div>
            </div>

            {/* ── Difficulty override row ── */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <button
                onClick={() => handleAdjust(isTimeBased ? -10 : -2)}
                style={{ width: 48, height: 48, borderRadius: 14, fontWeight: 900, fontSize: 20, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, color: C.text, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                −
              </button>
              <div style={{ minWidth: 120, textAlign: "center" }}>
                <div style={{ fontSize: 15, fontWeight: 900, color: C.text }}>
                  {isTimeBased
                    ? `${adjustedDuration ?? cur.target_duration_sec ?? 30}s`
                    : `${targetReps} reps`}
                </div>
                {adjustLabel && (
                  <div style={{ fontSize: 11, color: C.emerald, fontWeight: 700, marginTop: 2, transition: "opacity 0.3s" }}>
                    {adjustLabel}
                  </div>
                )}
              </div>
              <button
                onClick={() => handleAdjust(isTimeBased ? 10 : 2)}
                style={{ width: 48, height: 48, borderRadius: 14, fontWeight: 900, fontSize: 20, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, color: C.text, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                +
              </button>
            </div>

            {isTimeBased ? (
              /* ── Time-based exercise ── */
              (() => {
                const totalDur = adjustedDuration ?? cur.target_duration_sec ?? 30;
                const timerColor = timerRemaining <= 5 ? "#ef4444" : timerRemaining <= 10 ? C.amber : C.emerald;
                return (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 84, fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1, color: timerColor, fontVariantNumeric: "tabular-nums", marginBottom: 20, transition: "color 0.3s", animation: timerRemaining <= 5 ? "pulse 0.8s infinite" : "none" }}>
                      {String(Math.floor(timerRemaining / 60)).padStart(1, "0")}:{String(timerRemaining % 60).padStart(2, "0")}
                    </div>
                    <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden", maxWidth: 320, margin: "0 auto 24px" }}>
                      <div style={{ height: "100%", width: `${totalDur > 0 ? ((totalDur - timerRemaining) / totalDur) * 100 : 0}%`, background: timerColor, borderRadius: 3, transition: "width 1s linear, background 0.3s" }} />
                    </div>
                    {!timerRunning ? (
                      <button
                        onClick={() => { timerTotalRef.current = totalDur; setTimerRemaining(totalDur); setTimerRunning(true); }}
                        style={{ width: 120, height: 120, borderRadius: "50%", background: C.emeraldDim, border: `2px solid ${C.emeraldBorder}`, color: C.emerald, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, margin: "0 auto" }}
                      >
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                        <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase" }}>Start</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => { setTimerRunning(false); handleSetDone(totalDur - timerRemaining); }}
                        style={{ padding: "14px 32px", borderRadius: 16, fontWeight: 700, fontSize: 15, background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, color: C.text, cursor: "pointer" }}
                      >
                        ■ Done early
                      </button>
                    )}
                  </div>
                );
              })()
            ) : (
              /* ── Rep-based exercise ── */
              (() => {
                const isComplete = repCount >= targetReps;
                const dotCount = Math.min(10, targetReps);
                const tapBg = tapFlash
                  ? "rgba(var(--accent-rgb),0.25)"
                  : isComplete
                  ? "rgba(var(--accent-rgb),0.15)"
                  : "rgba(var(--accent-rgb),0.08)";
                const tapBorder = tapFlash
                  ? "rgba(var(--accent-rgb),0.55)"
                  : isComplete
                  ? "rgba(var(--accent-rgb),0.4)"
                  : "rgba(var(--accent-rgb),0.2)";
                const tapLabel = isComplete ? "SET COMPLETE" : tapFlash ? "COUNTED!" : "TAP TO COUNT REP";

                return (
                  <div>
                    {/* Rep dots */}
                    <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                      {Array.from({ length: dotCount }).map((_, i) => (
                        <div key={i} style={{ width: 12, height: 12, borderRadius: "50%", background: repCount > i ? C.emerald : "rgba(255,255,255,0.15)", transition: "background 0.15s", flexShrink: 0 }} />
                      ))}
                      {targetReps > 10 && repCount > 10 && (
                        <span style={{ fontSize: 12, fontWeight: 700, color: C.emerald, alignSelf: "center", marginLeft: 4 }}>+{repCount - 10}</span>
                      )}
                    </div>

                    {/* Rep count display */}
                    <div style={{ textAlign: "center", marginBottom: 20 }}>
                      <span style={{ fontSize: 64, fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1, color: isComplete ? C.emerald : C.text, fontVariantNumeric: "tabular-nums", transition: "color 0.2s" }}>
                        {repCount}
                      </span>
                      <span style={{ fontSize: 24, fontWeight: 700, color: C.muted, marginLeft: 6 }}>/ {targetReps}</span>
                    </div>

                    {/* Big tap zone */}
                    <div style={{ position: "relative" }}>
                      {/* Ring flash */}
                      {tapFlash && (
                        <div style={{ position: "absolute", inset: 0, borderRadius: 20, border: `2px solid ${C.emerald}`, animation: "tapRing 0.35s ease-out forwards", pointerEvents: "none" }} />
                      )}
                      <button
                        onClick={handleRepTapped}
                        disabled={isComplete}
                        style={{ width: "100%", minHeight: 220, borderRadius: 20, background: tapBg, border: `2px solid ${tapBorder}`, color: C.emerald, cursor: isComplete ? "default" : "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, transition: "background 0.15s, border-color 0.15s", WebkitTapHighlightColor: "transparent", animation: tapFlash ? "tapScale 0.15s ease-out" : "none", outline: "none" }}
                      >
                        <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase" }}>
                          {tapLabel}
                        </span>
                        {!isComplete && (
                          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(var(--accent-rgb),0.15)", border: "1.5px solid rgba(var(--accent-rgb),0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.emerald} strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                          </div>
                        )}
                        {isComplete && (
                          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={C.emerald} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        )}
                      </button>
                    </div>

                    {/* All reps done shortcut */}
                    {!isComplete && (
                      <button
                        onClick={() => handleSetDone(targetReps)}
                        style={{ width: "100%", marginTop: 12, padding: "14px 0", borderRadius: 16, fontWeight: 800, fontSize: 14, background: C.emeraldDim, border: `1px solid ${C.emeraldBorder}`, color: C.emerald, cursor: "pointer" }}
                      >
                        ✓ All {targetReps} reps done
                      </button>
                    )}
                  </div>
                );
              })()
            )}

            {/* Bottom actions */}
            <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: C.bg, borderTop: `1px solid ${C.border}`, padding: "12px 16px max(24px, env(safe-area-inset-bottom))" }}>
              <div style={{ maxWidth: 528, margin: "0 auto", display: "flex", gap: 10 }}>
                <button
                  onClick={handleSkipExercise}
                  style={{ flex: 1, padding: "13px 0", borderRadius: 14, fontWeight: 700, fontSize: 12, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, color: C.muted, cursor: "pointer" }}
                >
                  Skip
                </button>
                <button
                  onClick={handleOpenAlternatives}
                  style={{ flex: 2, padding: "13px 0", borderRadius: 14, fontWeight: 700, fontSize: 13, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, color: C.muted, cursor: "pointer" }}
                >
                  {isPregnancyMode ? "This doesn't feel right" : "Show alternatives"}
                </button>
                <button
                  onClick={() => handleSetDone(repCount)}
                  style={{ flex: 2, padding: "13px 0", borderRadius: 14, fontWeight: 700, fontSize: 14, background: "rgba(255,255,255,0.08)", border: `1px solid ${C.border}`, color: C.text, cursor: "pointer" }}
                >
                  Finish set →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── RESTING PHASE ── */}
        {phase === "resting" && (() => {
          const restColor = restRemaining <= 5 ? "#ef4444" : restRemaining <= 10 ? C.amber : C.emerald;
          const progressPct = restTotal > 0 ? Math.min(100, ((restTotal - restRemaining) / restTotal) * 100) : 100;
          const nextExName = currentSet <= totalSets ? cur?.name : exercises[exIdx + 1]?.name;
          const isLastSet = currentSet > totalSets;

          function adjustRest(delta) {
            setRestRemaining((r) => Math.max(10, Math.min(180, r + delta)));
            setRestTotal((t) => Math.max(10, Math.min(180, t + delta)));
          }

          return (
            <div style={{ maxWidth: 560, margin: "0 auto", padding: "40px 20px max(40px, env(safe-area-inset-bottom))", display: "flex", flexDirection: "column", alignItems: "center", gap: 20, textAlign: "center", minHeight: "calc(100dvh - 80px)", justifyContent: "center" }}>
              {/* Set complete label */}
              <div style={{ fontSize: 13, fontWeight: 900, color: C.emerald, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Set {currentSet - 1} of {totalSets} complete ✓
              </div>

              {/* Breathing reminder (pregnancy/postnatal only, auto-dismisses in 3s) */}
              {showBreathingReminder && (
                <div style={{ width: "100%", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 14, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <p style={{ margin: 0, fontSize: 14, color: C.amber, lineHeight: 1.5, fontWeight: 600 }}>
                    Take a breath — inhale through nose, sigh out through mouth.
                  </p>
                  <button onClick={() => { clearTimeout(breathingTimerRef.current); setShowBreathingReminder(false); }} style={{ background: "none", border: "none", color: C.amber, cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 4, flexShrink: 0 }}>×</button>
                </div>
              )}

              {/* Rest ring + countdown */}
              <div style={{ position: "relative", width: 200, height: 200, flexShrink: 0 }}>
                <svg width="200" height="200" style={{ transform: "rotate(-90deg)", display: "block" }}>
                  <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
                  <circle cx="100" cy="100" r="88" fill="none"
                    stroke={restColor}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray="553"
                    strokeDashoffset={553 * (1 - progressPct / 100)}
                    style={{ transition: "stroke-dashoffset 1s linear, stroke 0.4s" }}
                  />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>
                  <div style={{ fontSize: 10, fontWeight: 900, color: C.muted, letterSpacing: "0.14em", textTransform: "uppercase" }}>REST</div>
                  <div style={{ fontSize: 64, fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums", color: restColor, transition: "color 0.4s", animation: restRemaining <= 5 ? "pulse 0.8s infinite" : "none" }}>
                    {String(Math.floor(restRemaining / 60)).padStart(1, "0")}:{String(restRemaining % 60).padStart(2, "0")}
                  </div>
                </div>
              </div>

              {/* −15s / Skip / +15s */}
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <button
                  onClick={() => adjustRest(-15)}
                  style={{ padding: "12px 18px", borderRadius: 14, fontWeight: 700, fontSize: 13, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, color: C.muted, cursor: "pointer", minHeight: 48 }}
                >
                  −15s
                </button>
                <button
                  onClick={handleSkipRest}
                  style={{ padding: "12px 24px", borderRadius: 14, fontWeight: 700, fontSize: 14, background: "rgba(255,255,255,0.08)", border: `1px solid ${C.border}`, color: C.text, cursor: "pointer", minHeight: 48 }}
                >
                  Skip rest →
                </button>
                <button
                  onClick={() => adjustRest(15)}
                  style={{ padding: "12px 18px", borderRadius: 14, fontWeight: 700, fontSize: 13, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, color: C.muted, cursor: "pointer", minHeight: 48 }}
                >
                  +15s
                </button>
              </div>

              {/* Breath cue (general users only — pregnancy users get the amber banner above) */}
              {!showBreathingReminder && (
                <div style={{ fontSize: 13, color: C.muted, fontStyle: "italic", animation: "pulse 4s ease-in-out infinite" }}>
                  Breathe · let your heart rate settle
                </div>
              )}

              {/* Next up */}
              {nextExName && (
                <div style={{ fontSize: 14, color: C.muted, fontWeight: 600 }}>
                  {isLastSet ? `Next: ${nextExName}` : `Next set: ${isTimeBased ? `${adjustedDuration ?? cur?.target_duration_sec}s` : `${targetReps} ×`} ${nextExName}`}
                </div>
              )}
            </div>
          );
        })()}

        {/* ── SESSION FEEDBACK PHASE ── */}
        {phase === "sessionFeedback" && (() => {
          // Detect session type for contextual RPE labels
          const sessionName = plan?.session_name ?? '';
          const isCyclingSession = sessionName.toLowerCase().includes('cycling') ||
            exercises.some(e => JSON.parse(e.tags_json||'[]').includes('cycling'));
          const isRunSession = sessionName.toLowerCase().includes('run') ||
            exercises.some(e => JSON.parse(e.tags_json||'[]').includes('running'));
          const isStrengthSession = !isCyclingSession && !isRunSession &&
            exercises.length > 0 &&
            exercises.filter(e => e.category === 'strength').length > exercises.length / 2;
          const isCardio = isCyclingSession || isRunSession ||
            exercises.some(e => e.category === 'cardio' || JSON.parse(e.tags_json||'[]').includes('cardio'));

          // RPE label config based on session type
          const getRpeConfig = (v) => {
            if (isStrengthSession) {
              if (v <= 3) return { label: "Too light", sub: "Add weight or reps next session", color: "#3b82f6" };
              if (v <= 6) return { label: "Just right", sub: "Weight and reps were appropriate", color: C.emerald };
              if (v <= 9) return { label: "Hard", sub: "At your limit — hold or progress slowly", color: C.amber };
              return { label: "Too heavy", sub: "Reduce weight or reps next session", color: "#ef4444" };
            }
            // Cardio / general
            if (v <= 2) return { label: "Very easy", sub: isCardio ? "Zone 1 · Recovery pace" : "Barely any effort", color: "#3b82f6" };
            if (v <= 4) return { label: "Easy", sub: isCardio ? "Zone 2 · Comfortable, conversational" : "Low effort — could do much more", color: C.emerald };
            if (v <= 6) return { label: "Moderate", sub: isCardio ? "Zone 3 · Breathing harder" : "Good effort", color: "#84cc16" };
            if (v <= 8) return { label: "Hard", sub: isCardio ? "Zone 4–5 · Pushing your limits" : "Near your limit", color: C.amber };
            return { label: "Maximum", sub: isCardio ? "Zone 5+ · At or near your limit" : "Max effort — could not have done more", color: "#ef4444" };
          };

          const rpeConfig = getRpeConfig(rpeValue);
          return (
            <div style={{ maxWidth: 560, margin: "0 auto", padding: "48px 20px max(48px, env(safe-area-inset-bottom))", display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 32, fontWeight: 900, color: C.text, letterSpacing: "-0.03em", marginBottom: 8 }}>Session done!</div>
                <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.5 }}>
                  {isStrengthSession ? "How was the weight and effort?" : "Rate your effort (RPE)"}
                </p>
              </div>

              {/* RPE number + label */}
              <div style={{ textAlign: "center", width: "100%" }}>
                <div style={{ fontSize: 72, fontWeight: 900, color: rpeConfig.color, lineHeight: 1, letterSpacing: "-0.03em", transition: "color 0.2s" }}>{rpeValue}</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: rpeConfig.color, marginTop: 4, transition: "color 0.2s" }}>{rpeConfig.label}</div>
                <div style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>{rpeConfig.sub}</div>
              </div>

              {/* Slider */}
              <div style={{ width: "100%", padding: "0 4px" }}>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={rpeValue}
                  onChange={e => { setRpeValue(+e.target.value); navigator.vibrate?.(12); }}
                  style={{ width: "100%", height: 8, borderRadius: 999, accentColor: rpeConfig.color, cursor: "pointer", outline: "none" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                  <span style={{ fontSize: 11, color: C.muted }}>{isStrengthSession ? "Too light" : "Very easy"}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>RPE 1–10</span>
                  <span style={{ fontSize: 11, color: C.muted }}>{isStrengthSession ? "Too heavy" : "Maximum"}</span>
                </div>
              </div>

              {/* Zone indicator dots */}
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                {[1,2,3,4,5,6,7,8,9,10].map(n => {
                  const cfg = getRpeConfig(n);
                  return (
                    <div
                      key={n}
                      onClick={() => { setRpeValue(n); navigator.vibrate?.(12); }}
                      style={{ width: n === rpeValue ? 28 : 20, height: n === rpeValue ? 28 : 20, borderRadius: "50%", background: n === rpeValue ? cfg.color : "rgba(255,255,255,0.08)", border: n === rpeValue ? `2px solid ${cfg.color}` : `1px solid ${C.border}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s", flexShrink: 0 }}
                    >
                      {n === rpeValue && <span style={{ fontSize: 9, fontWeight: 900, color: "#fff" }}>{n}</span>}
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => handleFinishSession(rpeValue)}
                style={{ width: "100%", padding: "18px 0", borderRadius: 20, fontSize: 16, fontWeight: 900, background: rpeConfig.color, border: "none", color: "#fff", cursor: "pointer", letterSpacing: "-0.01em", transition: "background 0.2s" }}
              >
                Log session →
              </button>

              <button
                onClick={() => handleFinishSession(null)}
                style={{ fontSize: 13, color: C.muted, background: "none", border: "none", cursor: "pointer", textDecoration: "underline", textDecorationStyle: "dotted" }}
              >
                Skip rating
              </button>
            </div>
          );
        })()}
      </div>

      {/* ── ALTERNATIVES BOTTOM SHEET ── */}
      {showAlternatives && (
        <div
          style={{ position: "absolute", inset: 0, zIndex: 20, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}
          onClick={() => setShowAlternatives(false)}
        >
          {/* Scrim */}
          <div style={{ position: "absolute", inset: 0, background: "rgba(2,6,23,0.7)" }} />
          {/* Sheet */}
          <div
            style={{ position: "relative", background: "#0f172a", borderRadius: "24px 24px 0 0", padding: "20px 0 40px", maxHeight: "70vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)", margin: "0 auto 20px" }} />

            <div style={{ padding: "0 20px 16px", borderBottom: `1px solid ${C.border}`, marginBottom: 8 }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: C.text }}>Alternatives for {cur?.name}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Same sets and reps, different movement</div>
            </div>

            {altLoading ? (
              <div style={{ padding: "32px 20px", textAlign: "center", color: C.muted, fontSize: 14 }}>Loading...</div>
            ) : altExercises.length === 0 ? (
              <div style={{ padding: "32px 20px", textAlign: "center", color: C.muted, fontSize: 14, fontStyle: "italic" }}>No alternatives found for this exercise.</div>
            ) : (
              <div style={{ padding: "8px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
                {altExercises.map((alt) => {
                  const tags = JSON.parse(alt.tags_json || "[]");
                  const isEasier = tags.includes("beginner") || alt.slug.includes("knee") || alt.slug.includes("incline") || alt.slug.includes("assisted");
                  const isHarder = tags.includes("advanced") || alt.slug.includes("diamond") || alt.slug.includes("weighted") || alt.slug.includes("single");
                  const hint = isEasier ? "Easier" : isHarder ? "Harder" : "Similar";
                  return (
                    <div key={alt.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "16px", background: "rgba(255,255,255,0.04)", borderRadius: 16, border: `1px solid ${C.border}` }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{alt.name}</div>
                        <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{hint}</div>
                      </div>
                      <button
                        onClick={() => handleChooseAlternative(alt)}
                        style={{ padding: "10px 16px", borderRadius: 12, fontWeight: 700, fontSize: 13, background: C.emeraldDim, border: `1px solid ${C.emeraldBorder}`, color: C.emerald, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
                      >
                        Try this
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ padding: "12px 20px 0" }}>
              <button
                onClick={() => setShowAlternatives(false)}
                style={{ width: "100%", padding: "14px 0", borderRadius: 16, fontWeight: 700, fontSize: 14, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, color: C.muted, cursor: "pointer" }}
              >
                Keep original
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
