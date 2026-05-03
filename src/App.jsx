import { useState, useEffect, useCallback, useRef, useMemo, lazy, Suspense } from "react";

// ─── SHARED MODULES ───────────────────────────────────────────────────────────
import { C, display, eyebrow, mono, ACCENT_COLORS, applyAccent } from "./tokens.js";
import { Glass } from "./uiComponents.jsx";
import { GOALS, EXPERIENCE, EQUIPMENT_OPTIONS, ALL_EQUIPMENT, ALL_SPORTS, SEX_OPTIONS, CYCLE_LENGTHS, LEGAL_VERSIONS } from "./appConstants.js";
import { Icons, ExerciseIcon, GOAL_ICONS, MilitaryIcon, GoalIcon } from "./icons.jsx";
import { milClL, formatExDuration, estimateMins, getUserId, getToken, getJwtPayload } from "./planUtils.js";
import api from "./apiClient.js";
import { parseRuleTrace, hasBlockingSafety, deriveCoachSentence } from "./messagePolicy.js";
import { reportError } from "./errorReporter.js";
import { logout } from "./authHelpers.js";
import {
  generateCyclingTcx,
  triggerFileDownload,
  generateZwoFile,
  generateErgFile,
  generateRunningTcx,
} from "./exportUtils.js";

// ─── VIEW COMPONENTS ──────────────────────────────────────────────────────────
// WorkoutView: active workout path — eager loaded (no async boundary on critical path)
import WorkoutView from "./WorkoutView.jsx";
// HistoryView and PlanWeekView: secondary tabs — lazy loaded for bundle reduction
const HistoryView   = lazy(() => import("./HistoryView.jsx"));
const PlanWeekView  = lazy(() => import("./PlanWeekView.jsx"));
// AwardsView and SettingsView: rarely visited — lazy loaded
const AwardsView    = lazy(() => import("./AwardsView.jsx"));
const SettingsView  = lazy(() => import("./SettingsView.jsx"));

// ─── APPLY SAVED ACCENT BEFORE FIRST RENDER ─────────────────────────────────
applyAccent(localStorage.getItem("jf_accent") ?? "#10b981");

const APP_VERSION = "2";

// Default last period ≈ 4 weeks ago
function defaultPeriodDate() {
  const d = new Date();
  d.setDate(d.getDate() - 28);
  return d.toISOString().split("T")[0];
}

// ─── PATH CHOICE ──────────────────────────────────────────────────────────────
function PathChoiceModal({ token, onComplete }) {
  const [step, setStep] = useState("pick"); // "pick" | "running" | "cycling" | "military"
  const [saving, setSaving] = useState(false);
  const [runKm, setRunKm] = useState(5);
  const [cycleSubgoal, setCycleSubgoal] = useState("build_fitness");
  const [milTrack, setMilTrack] = useState("keuring");
  const [milMode, setMilMode] = useState("target");
  const [milTargetDate, setMilTargetDate] = useState("");

  async function saveAndComplete(intent, extraPrefs = {}) {
    setSaving(true);
    try { await api.saveProfile(token, { preferences: { primary_intent: intent, ...extraPrefs } }); } catch { /* ignore */ }
    setSaving(false);
    onComplete(intent);
  }

  const overlay = { position: "fixed", inset: 0, background: C.bg, zIndex: 80, overflowY: "auto",
    display: "flex", flexDirection: "column", padding: "max(40px, calc(env(safe-area-inset-top) + 16px)) 20px 48px" };
  const inner = { maxWidth: 520, margin: "0 auto", width: "100%" };
  const backBtn = { background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 14, fontWeight: 700, marginBottom: 24, padding: 0 };
  const saveBtn = (disabled) => ({
    width: "100%", padding: "14px 0", borderRadius: 14, fontWeight: 900, fontSize: 15,
    border: `1px solid ${C.emeraldBorder}`, background: C.emeraldDim, color: C.emerald,
    cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1,
  });

  if (step === "pick") {
    const PATHS = [
      { key: "general",  icon: "●", name: "GENERAL\nFITNESS", line: "A coach picks one safe, useful session a day." },
      { key: "running",  icon: "▲", name: "RUNNING",          line: "Build a runner, not a workout app." },
      { key: "cycling",  icon: "◆", name: "CYCLING",          line: "Structured sessions, week by week." },
      { key: "military", icon: "◼", name: "MILITARY",         line: "Keuring or Opleiding. We taper for you." },
    ];
    return (
      <div style={overlay}>
        <div style={inner}>
          <div style={{ ...eyebrow, color: C.emerald, marginBottom: 16 }}>Welcome to JustFit.</div>
          <h1 style={{ ...display(52), color: C.text, margin: "0 0 16px 0", lineHeight: 1.05 }}>PICK YOUR<br />TRAINING PATH.</h1>
          <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.5, marginBottom: 32 }}>
            We coach four kinds of athletes.<br />Choose one. You can change later.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}>
            {PATHS.map(p => (
              <button key={p.key}
                onClick={() => p.key === "general" ? saveAndComplete("general") : setStep(p.key)}
                style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", padding: "18px 16px", borderRadius: 20,
                  background: C.bgCard, border: `1px solid ${C.border}`, cursor: "pointer", textAlign: "left", gap: 8, minHeight: 140 }}
              >
                <span style={{ fontSize: 22, color: "var(--accent)" }}>{p.icon}</span>
                <div style={{ ...display(16), color: C.text, lineHeight: 1.2, whiteSpace: "pre-line" }}>{p.name}</div>
                <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.4 }}>{p.line}</div>
              </button>
            ))}
          </div>
          <div style={{ fontSize: 12, color: C.subtle, lineHeight: 1.6 }}>
            Privacy-first. We store only what your coach needs. Export or delete any time in Settings → Privacy.
          </div>
        </div>
      </div>
    );
  }

  if (step === "running") {
    return (
      <div style={overlay}>
        <div style={inner}>
          <button onClick={() => setStep("pick")} style={backBtn}>← Back</button>
          <h2 style={{ ...display(32), color: C.text, marginBottom: 8 }}>RUNNING</h2>
          <p style={{ fontSize: 15, color: C.muted, marginBottom: 24, lineHeight: 1.5 }}>What distance are you training for?</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 32 }}>
            {[5, 10, 15, 20, 30].map(km => (
              <button key={km} onClick={() => setRunKm(km)}
                style={{ padding: "10px 18px", borderRadius: 12, fontWeight: 800, fontSize: 14, cursor: "pointer",
                  border: `1px solid ${runKm === km ? C.emeraldBorder : C.border}`,
                  background: runKm === km ? C.emeraldDim : "rgba(255,255,255,0.04)",
                  color: runKm === km ? C.emerald : C.muted }}
              >{km}km</button>
            ))}
          </div>
          <button disabled={saving} style={saveBtn(saving)}
            onClick={() => saveAndComplete("running", { run_coach: { enrolled: true, target_km: runKm, week: 1, session_in_week: 0 } })}
          >{saving ? "Saving…" : "Start Running Coach →"}</button>
        </div>
      </div>
    );
  }

  if (step === "cycling") {
    const SUBGOALS = [
      { id: "build_fitness", label: "Build fitness",  desc: "General aerobic base" },
      { id: "climbing",      label: "Climbing",       desc: "Strength + sustained power" },
      { id: "sprint",        label: "Sprint",         desc: "Short explosive efforts" },
      { id: "aerobic_base",  label: "Aerobic base",   desc: "Zone 2 foundation" },
      { id: "race_fitness",  label: "Race fitness",   desc: "Event-ready conditioning" },
    ];
    return (
      <div style={overlay}>
        <div style={inner}>
          <button onClick={() => setStep("pick")} style={backBtn}>← Back</button>
          <h2 style={{ ...display(32), color: C.text, marginBottom: 8 }}>CYCLING</h2>
          <p style={{ fontSize: 15, color: C.muted, marginBottom: 24, lineHeight: 1.5 }}>What's your primary cycling goal?</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 32 }}>
            {SUBGOALS.map(sg => (
              <button key={sg.id} onClick={() => setCycleSubgoal(sg.id)}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px",
                  borderRadius: 14, cursor: "pointer", textAlign: "left",
                  border: `1px solid ${cycleSubgoal === sg.id ? C.emeraldBorder : C.border}`,
                  background: cycleSubgoal === sg.id ? C.emeraldDim : "rgba(255,255,255,0.04)" }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: cycleSubgoal === sg.id ? C.emerald : C.text }}>{sg.label}</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{sg.desc}</div>
                </div>
                {cycleSubgoal === sg.id && <span style={{ color: C.emerald, fontSize: 16 }}>✓</span>}
              </button>
            ))}
          </div>
          <button disabled={saving} style={saveBtn(saving)}
            onClick={() => saveAndComplete("cycling", { cycling_coach: { active: true, sub_goal: cycleSubgoal, week: 1 } })}
          >{saving ? "Saving…" : "Start Cycling Coach →"}</button>
        </div>
      </div>
    );
  }

  if (step === "military") {
    return (
      <div style={overlay}>
        <div style={inner}>
          <button onClick={() => setStep("pick")} style={backBtn}>← Back</button>
          <h2 style={{ ...display(32), color: C.text, marginBottom: 8 }}>MILITARY</h2>
          <p style={{ fontSize: 15, color: C.muted, marginBottom: 24, lineHeight: 1.5 }}>Choose your track and mode.</p>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 8 }}>Track</div>
            <div style={{ display: "flex", gap: 8 }}>
              {[["keuring","Keuring","Physical assessment KB–K6"],["opleiding","Opleiding","Training programme O1–O7"]].map(([val,label,sub]) => (
                <button key={val} onClick={() => setMilTrack(val)}
                  style={{ flex: 1, padding: "12px 14px", borderRadius: 14, cursor: "pointer", textAlign: "left",
                    border: `1px solid ${milTrack === val ? C.emeraldBorder : C.border}`,
                    background: milTrack === val ? C.emeraldDim : "rgba(255,255,255,0.04)" }}
                >
                  <div style={{ fontSize: 13, fontWeight: 800, color: milTrack === val ? C.emerald : C.text }}>{label}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{sub}</div>
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 8 }}>Mode</div>
            <div style={{ display: "flex", gap: 6 }}>
              {[["target","Target date"],["fit","Get fit"],["open","Open"]].map(([val,label]) => (
                <button key={val} onClick={() => setMilMode(val)}
                  style={{ flex: 1, padding: "10px 12px", borderRadius: 12, cursor: "pointer", fontSize: 12, fontWeight: 800,
                    border: `1px solid ${milMode === val ? C.emeraldBorder : C.border}`,
                    background: milMode === val ? C.emeraldDim : "rgba(255,255,255,0.04)",
                    color: milMode === val ? C.emerald : C.muted }}
                >{label}</button>
              ))}
            </div>
          </div>
          {milMode === "target" && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 8 }}>Assessment date (optional)</div>
              <input type="date" value={milTargetDate} onChange={e => setMilTargetDate(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, color: C.text, fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
              />
            </div>
          )}
          <button disabled={saving} style={saveBtn(saving)}
            onClick={() => saveAndComplete("military", { military_coach: { active: true, track: milTrack, mode: milMode,
              cluster_current: milTrack === "keuring" ? 0 : 1, cluster_target: 3,
              target_date: milTargetDate || null, block_session_index: 0, block_number: 1, enrolled_at_ms: Date.now() } })}
          >{saving ? "Saving…" : "Start Military Coach →"}</button>
        </div>
      </div>
    );
  }

  return null;
}

function OnboardingModal({ token, onComplete, onBack }) {
  const [step, setStep] = useState(0);
  // Step 0 — About you
  const [displayName, setDisplayName] = useState("");
  const [sex, setSex] = useState(null);
  const [weightInput, setWeightInput] = useState("");
  const [weightUnit, setWeightUnit] = useState("kg");
  const [heightInput, setHeightInput] = useState("");
  const [heightUnit, setHeightUnit] = useState("cm");
  const [showCycleSetup, setShowCycleSetup] = useState(false);
  const [lastPeriodStart, setLastPeriodStart] = useState(defaultPeriodDate());
  const [cycleLength, setCycleLength] = useState(28);
  const [cycleTrackingMode, setCycleTrackingMode] = useState(null);
  const [cycleSetupDone, setCycleSetupDone] = useState(false);
  // Steps 1-3 (existing)
  const [goal, setGoal] = useState("health");
  const [experience, setExperience] = useState("beginner");
  const [equipment, setEquipment] = useState(["none"]);
  const [duration, setDuration] = useState(45);
  const [saving, setSaving] = useState(false);

  const TOTAL_STEPS = 5;

  const handleSkip = () => {
    if (step < TOTAL_STEPS - 1) setStep(step + 1); else handleFinish();
  };

  const toggleEquip = (val) => {
    if (val === "none") {
      setEquipment(["none"]);
    } else {
      setEquipment((prev) => {
        const without = prev.filter((e) => e !== "none");
        return without.includes(val) ? without.filter((e) => e !== val) : [...without, val];
      });
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      let weight_kg = null;
      if (weightInput) {
        const w = parseFloat(weightInput);
        if (!isNaN(w)) weight_kg = weightUnit === "lbs" ? Math.round(w * 0.453592 * 10) / 10 : w;
      }
      let height_cm = null;
      if (heightInput) {
        const h = parseFloat(heightInput);
        if (!isNaN(h)) height_cm = heightUnit === "in" ? Math.round(h * 2.54 * 10) / 10 : h;
      }
      const cycle = (sex === "female" && cycleTrackingMode === "smart")
        ? { tracking_mode: "smart", cycle_length_days: cycleLength, last_period_start: lastPeriodStart }
        : { tracking_mode: "off" };

      const prefPayload = { available_equipment: equipment };
      if (displayName.trim()) prefPayload.display_name = displayName.trim();
      await api.saveProfile(token, {
        training_goal: goal,
        experience_level: experience,
        session_duration_min: duration,
        days_per_week_target: 3,
        preferences: prefPayload,
        sex,
        weight_kg,
        height_cm,
        cycle,
      });
      onComplete({ training_goal: goal, experience_level: experience, session_duration_min: duration, sex, weight_kg, height_cm, preferences: prefPayload });
    } catch (e) {
      console.error("Failed to save profile:", e);
      onComplete({});
    }
    setSaving(false);
  };

  const DURATION_OPTIONS = [15, 20, 30, 45, 60, 90, 120, 999];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 190,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "rgba(2,6,23,0.92)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          background: "#0a1628",
          border: `1px solid ${C.border}`,
          borderRadius: 28,
          overflow: "hidden",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 40px 100px rgba(0,0,0,0.7)",
        }}
      >
        {/* Progress bar */}
        <div style={{ height: 3, background: C.subtle }}>
          <div
            style={{
              height: "100%",
              background: C.emerald,
              width: step === 0 ? "0%" : `${(step / (TOTAL_STEPS - 1)) * 100}%`,
              transition: "width 0.3s",
            }}
          />
        </div>

        <div style={{ padding: "28px 28px 24px", overflowY: "auto" }}>
          {step > 0 && (
            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.12em", color: C.emerald, textTransform: "uppercase", marginBottom: 8 }}>
              Step {step} of {TOTAL_STEPS - 1}
            </div>
          )}

          {/* ── Step 0: Waiver ── */}
          {step === 0 && (
            <>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: C.emeraldDim, border: `1px solid ${C.emeraldBorder}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.emerald} strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: C.text, letterSpacing: "-0.02em", marginBottom: 6 }}>Health &amp; Safety</div>
              <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, marginBottom: 20 }}>
                JustFit.cc provides general fitness guidance for healthy adults. By continuing you confirm:
              </div>
              <ul style={{ listStyle: "none", marginBottom: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  "You are 16 years or older",
                  "You have no medical conditions that prevent exercise",
                  "JustFit.cc is not a medical app and does not provide medical advice",
                  "You accept responsibility for your own physical safety",
                  "You will consult a doctor before starting if in doubt",
                ].map((item, i) => (
                  <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ color: C.emerald, fontWeight: 900, flexShrink: 0, marginTop: 1 }}>✓</span>
                    <span style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>{item}</span>
                  </li>
                ))}
              </ul>
              <p style={{ fontSize: 11, color: C.muted, lineHeight: 1.6 }}>
                Your fitness data is not sold or shared. EU/GDPR compliant.
              </p>
            </>
          )}

          {/* ── Step 1: About you ── */}
          {step === 1 && (
            <>
              <div style={{ fontSize: 22, fontWeight: 900, color: C.text, letterSpacing: "-0.02em", marginBottom: 6 }}>About you</div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>This helps us personalise your training baseline.</div>

              <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 6 }}>
                Your name <span style={{ fontWeight: 500, textTransform: "none" }}>(optional)</span>
              </div>
              <input
                type="text"
                placeholder="What should we call you?"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={50}
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: 12,
                  background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`,
                  color: C.text, fontSize: 15, fontWeight: 700, outline: "none", fontFamily: "inherit",
                  boxSizing: "border-box", marginBottom: 24,
                }}
              />

              <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 10 }}>
                How do you identify?
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 24 }}>
                {SEX_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setSex(opt.value); if (opt.value !== "female") { setCycleSetupDone(false); setShowCycleSetup(false); } }}
                    style={{
                      padding: "12px 10px",
                      borderRadius: 14,
                      border: `1px solid ${sex === opt.value ? C.emeraldBorder : C.border}`,
                      background: sex === opt.value ? C.emeraldDim : "rgba(255,255,255,0.03)",
                      color: sex === opt.value ? C.emerald : C.muted,
                      fontWeight: 700, fontSize: 13, cursor: "pointer",
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 6 }}>
                Your weight <span style={{ fontWeight: 500, textTransform: "none" }}>(optional)</span>
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>Helps us scale exercise volume to your body.</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 20 }}>
                <input
                  type="number"
                  placeholder="—"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  style={{
                    width: 80, padding: "10px 14px", borderRadius: 12,
                    background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`,
                    color: C.text, fontSize: 15, fontWeight: 700, outline: "none", fontFamily: "inherit",
                  }}
                />
                <button
                  onClick={() => setWeightUnit(u => u === "kg" ? "lbs" : "kg")}
                  style={{ padding: "8px 16px", borderRadius: 10, border: `1px solid ${C.emeraldBorder}`, background: C.emeraldDim, color: C.emerald, fontWeight: 900, fontSize: 12, cursor: "pointer", minWidth: 48, flexShrink: 0 }}
                >
                  {weightUnit}
                </button>
              </div>

              <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 6 }}>
                Your height <span style={{ fontWeight: 500, textTransform: "none" }}>(optional)</span>
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>Used to calculate BMI and adapt intensity guidance.</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 24 }}>
                <input
                  type="number"
                  placeholder="—"
                  value={heightInput}
                  onChange={(e) => setHeightInput(e.target.value)}
                  style={{
                    width: 80, padding: "10px 14px", borderRadius: 12,
                    background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`,
                    color: C.text, fontSize: 15, fontWeight: 700, outline: "none", fontFamily: "inherit",
                  }}
                />
                <button
                  onClick={() => setHeightUnit(u => u === "cm" ? "in" : "cm")}
                  style={{ padding: "8px 16px", borderRadius: 10, border: `1px solid ${C.emeraldBorder}`, background: C.emeraldDim, color: C.emerald, fontWeight: 900, fontSize: 12, cursor: "pointer", minWidth: 48, flexShrink: 0 }}
                >
                  {heightUnit}
                </button>
              </div>

              {/* Cycle tracking card — female only */}
              {sex === "female" && !cycleSetupDone && (
                <div style={{ borderRadius: 20, border: `1px solid ${C.emeraldBorder}`, background: "rgba(var(--accent-rgb),0.04)", padding: 20, marginBottom: 8 }}>
                  {!showCycleSetup ? (
                    <>
                      <div style={{ fontSize: 15, fontWeight: 900, color: C.text, marginBottom: 8 }}>🌙 Train with your natural rhythm</div>
                      <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 16 }}>
                        Your body has incredible wisdom. JustFit can adapt your sessions across your cycle — lighter when you need rest, and ready to push when you're at your strongest.
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => setShowCycleSetup(true)}
                          style={{ flex: 2, padding: "10px 16px", borderRadius: 12, background: C.emeraldDim, border: `1px solid ${C.emeraldBorder}`, color: C.emerald, fontWeight: 800, fontSize: 13, cursor: "pointer" }}
                        >
                          Set up cycle tracking
                        </button>
                        <button
                          onClick={() => { setCycleTrackingMode("off"); setCycleSetupDone(true); }}
                          style={{ flex: 1, padding: "10px 16px", borderRadius: 12, background: "transparent", border: `1px solid ${C.border}`, color: C.muted, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                        >
                          Maybe later
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 14, fontWeight: 900, color: C.text, marginBottom: 16 }}>🌙 Set up cycle tracking</div>
                      <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>When did your last period start?</div>
                      <input
                        type="date"
                        value={lastPeriodStart}
                        max={new Date().toISOString().split("T")[0]}
                        onChange={(e) => setLastPeriodStart(e.target.value)}
                        style={{ width: "100%", padding: "10px 14px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, color: C.text, fontSize: 14, outline: "none", fontFamily: "inherit", marginBottom: 16, boxSizing: "border-box" }}
                      />
                      <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>How long is your typical cycle?</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                        {CYCLE_LENGTHS.map((d) => (
                          <button
                            key={d}
                            onClick={() => setCycleLength(d)}
                            style={{ padding: "7px 12px", borderRadius: 999, fontSize: 13, fontWeight: 700, border: `1px solid ${cycleLength === d ? C.emeraldBorder : C.border}`, background: cycleLength === d ? C.emeraldDim : "rgba(255,255,255,0.03)", color: cycleLength === d ? C.emerald : C.muted, cursor: "pointer" }}
                          >
                            {d}d
                          </button>
                        ))}
                      </div>
                      <div style={{ fontSize: 11, color: C.muted, marginBottom: 14, fontStyle: "italic" }}>
                        Every body is different — these can be updated anytime in Settings.
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => { if (lastPeriodStart) { setCycleTrackingMode("smart"); setCycleSetupDone(true); } }}
                          style={{ flex: 2, padding: "10px 16px", borderRadius: 12, background: C.emerald, border: "none", color: "#fff", fontWeight: 900, fontSize: 13, cursor: "pointer" }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => { setCycleTrackingMode("off"); setCycleSetupDone(true); }}
                          style={{ flex: 1, padding: "10px 16px", borderRadius: 12, background: "transparent", border: `1px solid ${C.border}`, color: C.muted, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                        >
                          Skip
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
              {sex === "female" && cycleSetupDone && (
                <div style={{ fontSize: 12, color: C.emerald, padding: "8px 12px", borderRadius: 10, background: "rgba(var(--accent-rgb),0.08)" }}>
                  {cycleTrackingMode === "smart" ? "✓ Cycle tracking enabled" : "Cycle tracking skipped — enable anytime in Settings."}
                </div>
              )}
            </>
          )}

          {/* ── Step 2: Goal ── */}
          {step === 2 && (
            <>
              <div style={{ fontSize: 22, fontWeight: 900, color: C.text, letterSpacing: "-0.02em", marginBottom: 6 }}>What's your goal?</div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>Your plan adapts to this every day.</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {GOALS.map((g) => (
                  <button
                    key={g.value}
                    onClick={() => setGoal(g.value)}
                    style={{
                      position: "relative", overflow: "hidden",
                      padding: "14px 12px", minHeight: 92,
                      borderRadius: 16, display: "flex", flexDirection: "column", justifyContent: "flex-end",
                      border: `1px solid ${goal === g.value ? C.emeraldBorder : C.border}`,
                      background: goal === g.value ? C.emeraldDim : "rgba(255,255,255,0.03)",
                      color: goal === g.value ? C.emerald : C.muted,
                      fontWeight: 700, fontSize: 13, cursor: "pointer", textAlign: "left",
                    }}
                  >
                    <div style={{ position: "absolute", left: "66%", top: "33%", transform: "translate(-50%,-50%)", opacity: goal === g.value ? 0.7 : 0.22, pointerEvents: "none" }}>
                      {GOAL_ICONS[g.value]}
                    </div>
                    <div style={{ position: "relative", zIndex: 1 }}>{g.label}</div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── Step 3: Experience ── */}
          {step === 3 && (
            <>
              <div style={{ fontSize: 22, fontWeight: 900, color: C.text, letterSpacing: "-0.02em", marginBottom: 6 }}>Experience level?</div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>We calibrate volume and intensity to match you.</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {EXPERIENCE.map((e) => (
                  <button
                    key={e.value}
                    onClick={() => setExperience(e.value)}
                    style={{
                      padding: "16px 18px", borderRadius: 16,
                      border: `1px solid ${experience === e.value ? C.emeraldBorder : C.border}`,
                      background: experience === e.value ? C.emeraldDim : "rgba(255,255,255,0.03)",
                      color: C.text, fontWeight: 700, fontSize: 14, cursor: "pointer", textAlign: "left",
                    }}
                  >
                    <div style={{ color: experience === e.value ? C.emerald : C.text, marginBottom: 3 }}>{e.label}</div>
                    <div style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>{e.sub}</div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── Step 4: Equipment + time ── */}
          {step === 4 && (
            <>
              <div style={{ fontSize: 22, fontWeight: 900, color: C.text, letterSpacing: "-0.02em", marginBottom: 6 }}>Equipment &amp; time?</div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>Your default session setup.</div>

              <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 10 }}>
                Available equipment
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
                {EQUIPMENT_OPTIONS.map((eq) => (
                  <button
                    key={eq.value}
                    onClick={() => toggleEquip(eq.value)}
                    style={{
                      padding: "12px 16px", borderRadius: 14,
                      border: `1px solid ${equipment.includes(eq.value) ? C.emeraldBorder : C.border}`,
                      background: equipment.includes(eq.value) ? C.emeraldDim : "rgba(255,255,255,0.03)",
                      color: C.text, fontWeight: 700, fontSize: 13, cursor: "pointer", textAlign: "left",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}
                  >
                    <span>{eq.label}</span>
                    <span style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>{eq.sub}</span>
                  </button>
                ))}
              </div>

              <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 10 }}>
                Default session length
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {DURATION_OPTIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    style={{
                      flex: 1, padding: "10px 0", borderRadius: 12,
                      border: `1px solid ${duration === d ? C.emeraldBorder : C.border}`,
                      background: duration === d ? C.emeraldDim : "rgba(255,255,255,0.03)",
                      color: duration === d ? C.emerald : C.muted,
                      fontWeight: 800, fontSize: 13, cursor: "pointer",
                    }}
                  >
                    {d === 999 ? '∞' : d === 60 ? '1h' : d === 90 ? '1.5h' : d === 120 ? '2h' : `${d}m`}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div style={{ padding: "0 28px 28px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 10 }}>
            {/* Back: on waiver step triggers logout; on other steps goes back */}
            <button
              onClick={step === 0 ? onBack : () => setStep(step - 1)}
              style={{ flex: 1, padding: 14, borderRadius: 16, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.03)", color: C.muted, fontWeight: 700, fontSize: 14, cursor: "pointer" }}
            >
              {step === 0 ? "← Log out" : "Back"}
            </button>
            {/* Main action */}
            <button
              onClick={step === 0 ? () => setStep(1) : step < TOTAL_STEPS - 1 ? () => setStep(step + 1) : handleFinish}
              disabled={saving}
              style={{ flex: 2, padding: 14, borderRadius: 16, border: "none", background: C.emerald, color: "#fff", fontWeight: 900, fontSize: 15, cursor: "pointer", boxShadow: "0 8px 32px rgba(var(--accent-rgb),0.35)", opacity: saving ? 0.7 : 1 }}
            >
              {step === 0 ? "I Agree — Continue" : saving ? "Saving..." : step < TOTAL_STEPS - 1 ? "Continue" : "Start Training"}
            </button>
          </div>
          {/* Skip button — not shown on waiver step */}
          {step > 0 && (
            <button
              onClick={handleSkip}
              style={{ padding: "10px 0", background: "none", border: "none", color: C.muted, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              Skip this step
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// GoalRecheckModal removed — onboarding re-triggered from Settings instead.
function GoalRecheckModal({ token, profileData, onComplete }) {
  const [step, setStep] = useState(0);

  // Step 0 — About you
  const [sex, setSex] = useState(profileData?.sex ?? null);
  const [weightInput, setWeightInput] = useState(profileData?.weight_kg ? String(profileData.weight_kg) : "");
  const [weightUnit, setWeightUnit] = useState("kg");
  const [heightInput, setHeightInput] = useState(profileData?.height_cm ? String(profileData.height_cm) : "");
  const [heightUnit, setHeightUnit] = useState("cm");
  // Fitness level 1–5: beginner→2, intermediate→3, advanced→4
  const expToLevel = { beginner: 2, intermediate: 3, advanced: 4 };
  const levelToExp = (l) => l <= 2 ? "beginner" : l === 3 ? "intermediate" : "advanced";
  const [fitnessLevel, setFitnessLevel] = useState(expToLevel[profileData?.experience_level] ?? 2);
  const [bodyModeSelection, setBodyModeSelection] = useState(profileData?.cycle?.mode ?? "standard");
  const [pregnancyDueDate, setPregnancyDueDate] = useState(profileData?.cycle?.pregnancy_due_date ?? "");
  const [postnatalBirthDate, setPostnatalBirthDate] = useState(profileData?.cycle?.postnatal_birth_date ?? "");
  const [showCycleSetup, setShowCycleSetup] = useState(false);
  const [lastPeriodStart, setLastPeriodStart] = useState(profileData?.cycle?.last_period_start ?? defaultPeriodDate());
  const [cycleLength, setCycleLength] = useState(profileData?.cycle?.cycle_length_days ?? 28);
  const [cycleTrackingMode, setCycleTrackingMode] = useState(profileData?.cycle?.tracking_mode ?? null);
  // If they already had a sex set, cycle section is considered acknowledged
  const [cycleSetupDone, setCycleSetupDone] = useState(!!profileData?.sex);

  // Step 1 — Goal
  const [goal, setGoal] = useState(profileData?.training_goal ?? "health");
  const [saving, setSaving] = useState(false);

  const canAdvance = !!sex;

  const handleConfirm = async () => {
    setSaving(true);
    try {
      let weight_kg = null;
      if (weightInput) {
        const w = parseFloat(weightInput);
        if (!isNaN(w)) weight_kg = weightUnit === "lbs" ? Math.round(w * 0.453592 * 10) / 10 : w;
      }
      let height_cm = null;
      if (heightInput) {
        const h = parseFloat(heightInput);
        if (!isNaN(h)) height_cm = heightUnit === "in" ? Math.round(h * 2.54 * 10) / 10 : h;
      }

      let cycle;
      if (sex === "female") {
        if (bodyModeSelection === "pregnant") {
          cycle = { tracking_mode: "off", mode: "pregnant", pregnancy_due_date: pregnancyDueDate || null };
        } else if (bodyModeSelection === "postnatal") {
          cycle = { tracking_mode: "off", mode: "postnatal", postnatal_birth_date: postnatalBirthDate || null };
        } else if (cycleTrackingMode === "smart") {
          cycle = { tracking_mode: "smart", cycle_length_days: cycleLength, last_period_start: lastPeriodStart, mode: "standard" };
        } else {
          cycle = { tracking_mode: profileData?.cycle?.tracking_mode ?? "off", mode: "standard" };
        }
      }

      await api.saveProfile(token, {
        training_goal: goal,
        experience_level: levelToExp(fitnessLevel),
        session_duration_min: profileData?.session_duration_min ?? 45,
        days_per_week_target: profileData?.days_per_week_target ?? 3,
        preferences: profileData?.preferences ?? {},
        sex,
        weight_kg,
        height_cm,
        ...(cycle !== undefined ? { cycle } : {}),
      });
    } catch (e) {
      console.error("Goal recheck save failed:", e);
    }
    setSaving(false);
    onComplete(goal);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(2,6,23,0.95)", backdropFilter: "blur(12px)" }}>
      <div style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto", padding: 32, display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Progress bar */}
        <div>
          <div style={{ height: 3, background: C.subtle, borderRadius: 99, marginBottom: 20 }}>
            <div style={{ height: "100%", background: C.emerald, borderRadius: 99, width: step === 0 ? "50%" : "100%", transition: "width 0.3s" }} />
          </div>
          <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase", color: C.emerald }}>
            Step {step + 1} of 2
          </div>
        </div>

        {/* ── Step 0: About you ── */}
        {step === 0 && (
          <>
            <div>
              <div style={{ fontSize: 24, fontWeight: 900, color: C.text, letterSpacing: "-0.03em", lineHeight: 1.2, marginBottom: 8 }}>
                Let's make sure we have you right.
              </div>
              <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, margin: 0 }}>
                JustFit now adapts to your body. Please confirm a few details — they personalise your coaching every day.
              </p>
            </div>

            {/* Sex */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 10 }}>How do you identify?</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {SEX_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      const wasNotFemale = sex !== "female";
                      setSex(opt.value);
                      if (opt.value !== "female") {
                        setCycleSetupDone(true);
                        setShowCycleSetup(false);
                        setBodyModeSelection("standard");
                      } else if (wasNotFemale) {
                        setCycleSetupDone(false);
                      }
                    }}
                    style={{
                      padding: "12px 10px", borderRadius: 14,
                      border: `1px solid ${sex === opt.value ? C.emeraldBorder : C.border}`,
                      background: sex === opt.value ? C.emeraldDim : "rgba(255,255,255,0.03)",
                      color: sex === opt.value ? C.emerald : C.muted,
                      fontWeight: 700, fontSize: 13, cursor: "pointer",
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Weight */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 6 }}>
                Your weight <span style={{ fontWeight: 500, textTransform: "none" }}>(optional)</span>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="number" placeholder="—" value={weightInput} onChange={(e) => setWeightInput(e.target.value)}
                  style={{ width: 80, padding: "10px 14px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, color: C.text, fontSize: 15, fontWeight: 700, outline: "none", fontFamily: "inherit" }} />
                <button onClick={() => setWeightUnit(u => u === "kg" ? "lbs" : "kg")}
                  style={{ padding: "8px 16px", borderRadius: 10, border: `1px solid ${C.emeraldBorder}`, background: C.emeraldDim, color: C.emerald, fontWeight: 900, fontSize: 12, cursor: "pointer", minWidth: 48, flexShrink: 0 }}>
                  {weightUnit}
                </button>
              </div>
            </div>

            {/* Height */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 6 }}>
                Your height <span style={{ fontWeight: 500, textTransform: "none" }}>(optional)</span>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="number" placeholder="—" value={heightInput} onChange={(e) => setHeightInput(e.target.value)}
                  style={{ width: 80, padding: "10px 14px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, color: C.text, fontSize: 15, fontWeight: 700, outline: "none", fontFamily: "inherit" }} />
                <button onClick={() => {
                  if (heightUnit === "cm") {
                    setHeightUnit("in");
                    if (heightInput) setHeightInput(String(Math.round(parseFloat(heightInput) / 2.54)));
                  } else {
                    setHeightUnit("cm");
                    if (heightInput) setHeightInput(String(Math.round(parseFloat(heightInput) * 2.54)));
                  }
                }} style={{ padding: "8px 16px", borderRadius: 10, border: `1px solid ${C.emeraldBorder}`, background: C.emeraldDim, color: C.emerald, fontWeight: 900, fontSize: 12, cursor: "pointer", minWidth: 48, flexShrink: 0 }}>
                  {heightUnit}
                </button>
              </div>
            </div>

            {/* Fitness level */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 6 }}>
                How sporty are you?
              </div>
              <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                {[1,2,3,4,5].map((n) => (
                  <button key={n} onClick={() => setFitnessLevel(n)} style={{
                    flex: 1, padding: "10px 0", borderRadius: 12, fontWeight: 900, fontSize: 14,
                    border: `1px solid ${fitnessLevel === n ? C.emeraldBorder : C.border}`,
                    background: fitnessLevel === n ? C.emeraldDim : "rgba(255,255,255,0.03)",
                    color: fitnessLevel === n ? C.emerald : C.muted, cursor: "pointer",
                  }}>{n}</button>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.muted, fontWeight: 600 }}>
                <span>Beginner</span>
                <span>Moderate</span>
                <span>Sporter</span>
              </div>
            </div>

            {/* Female-only: body mode + cycle */}
            {sex === "female" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 10 }}>Current body situation</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    {[{ value: "standard", label: "Standard" }, { value: "pregnant", label: "Pregnant" }, { value: "postnatal", label: "Postnatal" }].map((m) => (
                      <button key={m.value} onClick={() => setBodyModeSelection(m.value)}
                        style={{ padding: "12px 8px", borderRadius: 14, border: `1px solid ${bodyModeSelection === m.value ? C.emeraldBorder : C.border}`, background: bodyModeSelection === m.value ? C.emeraldDim : "rgba(255,255,255,0.03)", color: bodyModeSelection === m.value ? C.emerald : C.muted, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pregnant — due date */}
                {bodyModeSelection === "pregnant" && (
                  <div style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 16, padding: 16 }}>
                    <div style={{ fontSize: 13, color: "#fbbf24", fontWeight: 800, marginBottom: 8 }}>Due date <span style={{ fontWeight: 500, color: C.muted }}>(optional)</span></div>
                    <input type="date" value={pregnancyDueDate} onChange={(e) => setPregnancyDueDate(e.target.value)}
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, color: C.text, fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>Helps us track your trimester and adapt exercises safely.</div>
                  </div>
                )}

                {/* Postnatal — birth date */}
                {bodyModeSelection === "postnatal" && (
                  <div style={{ background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.2)", borderRadius: 16, padding: 16 }}>
                    <div style={{ fontSize: 13, color: C.rose, fontWeight: 800, marginBottom: 8 }}>Birth date <span style={{ fontWeight: 500, color: C.muted }}>(optional)</span></div>
                    <input type="date" value={postnatalBirthDate} onChange={(e) => setPostnatalBirthDate(e.target.value)}
                      max={new Date().toISOString().split("T")[0]}
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, color: C.text, fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>Helps us phase your recovery and postnatal exercises correctly.</div>
                  </div>
                )}

                {/* Standard — cycle tracking */}
                {bodyModeSelection === "standard" && !cycleSetupDone && (
                  <div style={{ borderRadius: 20, border: `1px solid ${C.emeraldBorder}`, background: "rgba(var(--accent-rgb),0.04)", padding: 20 }}>
                    {!showCycleSetup ? (
                      <>
                        <div style={{ fontSize: 15, fontWeight: 900, color: C.text, marginBottom: 8 }}>🌙 Train with your natural rhythm</div>
                        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 16 }}>
                          JustFit can adapt your sessions across your cycle — lighter when you need rest, ready to push when you're at your strongest.
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => setShowCycleSetup(true)}
                            style={{ flex: 2, padding: "10px 16px", borderRadius: 12, background: C.emeraldDim, border: `1px solid ${C.emeraldBorder}`, color: C.emerald, fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
                            Set up cycle tracking
                          </button>
                          <button onClick={() => { setCycleTrackingMode("off"); setCycleSetupDone(true); }}
                            style={{ flex: 1, padding: "10px 16px", borderRadius: 12, background: "transparent", border: `1px solid ${C.border}`, color: C.muted, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                            Maybe later
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: 14, fontWeight: 900, color: C.text, marginBottom: 16 }}>🌙 Set up cycle tracking</div>
                        <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>When did your last period start?</div>
                        <input type="date" value={lastPeriodStart} max={new Date().toISOString().split("T")[0]} onChange={(e) => setLastPeriodStart(e.target.value)}
                          style={{ width: "100%", padding: "10px 14px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, color: C.text, fontSize: 14, outline: "none", fontFamily: "inherit", marginBottom: 16, boxSizing: "border-box" }} />
                        <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>How long is your typical cycle?</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                          {CYCLE_LENGTHS.map((d) => (
                            <button key={d} onClick={() => setCycleLength(d)}
                              style={{ padding: "7px 12px", borderRadius: 999, fontSize: 13, fontWeight: 700, border: `1px solid ${cycleLength === d ? C.emeraldBorder : C.border}`, background: cycleLength === d ? C.emeraldDim : "rgba(255,255,255,0.03)", color: cycleLength === d ? C.emerald : C.muted, cursor: "pointer" }}>
                              {d}d
                            </button>
                          ))}
                        </div>
                        <div style={{ fontSize: 11, color: C.muted, marginBottom: 14, fontStyle: "italic" }}>Can be updated anytime in Settings.</div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => { if (lastPeriodStart) { setCycleTrackingMode("smart"); setCycleSetupDone(true); } }}
                            style={{ flex: 2, padding: "10px 16px", borderRadius: 12, background: C.emerald, border: "none", color: "#fff", fontWeight: 900, fontSize: 13, cursor: "pointer" }}>
                            Save
                          </button>
                          <button onClick={() => { setCycleTrackingMode("off"); setCycleSetupDone(true); }}
                            style={{ flex: 1, padding: "10px 16px", borderRadius: 12, background: "transparent", border: `1px solid ${C.border}`, color: C.muted, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                            Skip
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
                {bodyModeSelection === "standard" && cycleSetupDone && (
                  <div style={{ fontSize: 12, color: C.emerald, padding: "8px 12px", borderRadius: 10, background: "rgba(var(--accent-rgb),0.08)" }}>
                    {(cycleTrackingMode ?? profileData?.cycle?.tracking_mode) === "smart"
                      ? "✓ Cycle tracking enabled"
                      : "Cycle tracking off — enable anytime in Settings."}
                  </div>
                )}
              </div>
            )}

            <button onClick={() => setStep(1)} disabled={!canAdvance}
              style={{ width: "100%", padding: "17px 0", borderRadius: 18, fontSize: 16, fontWeight: 900, background: canAdvance ? C.emerald : "rgba(var(--accent-rgb),0.2)", border: "none", color: canAdvance ? "#fff" : C.muted, cursor: canAdvance ? "pointer" : "default", letterSpacing: "-0.01em" }}>
              Next →
            </button>
          </>
        )}

        {/* ── Step 1: Goal ── */}
        {step === 1 && (
          <>
            <div>
              <div style={{ fontSize: 24, fontWeight: 900, color: C.text, letterSpacing: "-0.03em", lineHeight: 1.2, marginBottom: 8 }}>
                What's your training goal?
              </div>
              <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, margin: 0 }}>
                Your plan adapts to this every day. Pick the one that fits best right now — you can change it anytime in Settings.
              </p>
            </div>

            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {GOALS.map((g) => (
                  <button key={g.value} onClick={() => setGoal(g.value)}
                    style={{
                      position: "relative", overflow: "hidden",
                      padding: "14px 12px", minHeight: 92,
                      borderRadius: 14, display: "flex", flexDirection: "column", justifyContent: "flex-end",
                      border: `1px solid ${goal === g.value ? C.emeraldBorder : C.border}`,
                      background: goal === g.value ? C.emeraldDim : "rgba(255,255,255,0.03)",
                      color: goal === g.value ? C.emerald : C.muted,
                      fontWeight: 700, fontSize: 13, cursor: "pointer", textAlign: "left",
                    }}>
                    <div style={{ position: "absolute", left: "66%", top: "33%", transform: "translate(-50%,-50%)", opacity: goal === g.value ? 0.7 : 0.22, pointerEvents: "none" }}>
                      {GOAL_ICONS[g.value]}
                    </div>
                    <div style={{ position: "relative", zIndex: 1 }}>{g.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleConfirm} disabled={saving}
              style={{ width: "100%", padding: "17px 0", borderRadius: 18, fontSize: 16, fontWeight: 900, background: saving ? "rgba(var(--accent-rgb),0.4)" : C.emerald, border: "none", color: "#fff", cursor: saving ? "default" : "pointer", letterSpacing: "-0.01em" }}>
              {saving ? "Saving…" : "Confirmed — let's go →"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── CHECK-IN MODAL ───────────────────────────────────────────────────────────

function SadFace({ size = 44 }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="20" cy="20" r="17" />
      <circle cx="13" cy="16" r="2" fill="currentColor" stroke="none" />
      <circle cx="27" cy="16" r="2" fill="currentColor" stroke="none" />
      <path d="M 11 28 Q 20 21 29 28" />
    </svg>
  );
}
function NeutralFace({ size = 44 }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="20" cy="20" r="17" />
      <circle cx="13" cy="16" r="2" fill="currentColor" stroke="none" />
      <circle cx="27" cy="16" r="2" fill="currentColor" stroke="none" />
      <line x1="13" y1="26" x2="27" y2="26" />
    </svg>
  );
}
function HappyFace({ size = 44 }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="20" cy="20" r="17" />
      <circle cx="13" cy="16" r="2" fill="currentColor" stroke="none" />
      <circle cx="27" cy="16" r="2" fill="currentColor" stroke="none" />
      <path d="M 11 24 Q 20 33 29 24" />
    </svg>
  );
}

function CheckInModal({ onSave, onClose, sex, cycle, defaultTimeBudget, lastCheckin, onMarkChronic }) {
  const bodyMode = cycle?.mode ?? "standard";
  const showPeriodChip = sex === "female" && bodyMode === "standard";

  const [step, setStep] = useState(1);
  const [feeling, setFeeling] = useState(() => {
    if (!lastCheckin) return 2;
    const cj = typeof lastCheckin.checkin_json === "string"
      ? JSON.parse(lastCheckin.checkin_json)
      : (lastCheckin.checkin_json ?? {});
    const s = lastCheckin.stress ? Math.round(lastCheckin.stress / 2) : 2;
    const m = cj.motivation ? Math.round(cj.motivation / 2) : 3;
    return s >= 4 ? 1 : (m >= 4 && s <= 2) ? 3 : 2;
  });
  const [chips, setChips] = useState([]);
  const [freeText, setFreeText] = useState("");
  const [painScope, setPainScope] = useState(null);
  const [painAreas, setPainAreas] = useState([]);
  const [pregnancySignals, setPregnancySignals] = useState({ nausea: false, breathless: false, pelvic_discomfort: false });
  const [postnatalSignals, setPostnatalSignals] = useState({ running_today: false, heaviness: false });

  const toggleChip = (val) => setChips(cs => cs.includes(val) ? cs.filter(c => c !== val) : [...cs, val]);
  const toggleArea = (k) => setPainAreas(as => as.includes(k) ? as.filter(a => a !== k) : [...as, k]);

  const hasPain = chips.includes("pain");
  const needsStep3 = hasPain || bodyMode === "pregnant" || bodyMode === "postnatal";

  const buildAndSave = () => {
    const moodMap = {
      1: { mood: 2, stress: 8, motivation: 2 },
      2: { mood: 6, stress: 5, motivation: 5 },
      3: { mood: 9, stress: 2, motivation: 9 },
    };
    const m = moodMap[feeling] ?? moodMap[2];
    onSave({
      mood: m.mood,
      stress: m.stress,
      energy: 5,
      sleep_hours: null,
      checkin_json: {
        no_clothing: false,
        no_gear: false,
        no_time: chips.includes("zero_time"),
        gym_today: chips.includes("gym"),
        traveling: false,
        recovery_mode: chips.includes("taking_easy"),
        pain_level: hasPain ? 3 : 0,
        pain_scope: hasPain ? painScope : null,
        pain_areas: hasPain ? painAreas : [],
        period_today: chips.includes("period"),
        free_text: freeText,
        motivation: m.motivation,
        time_budget: defaultTimeBudget,
        pregnancy_signals: pregnancySignals,
        postnatal_signals: postnatalSignals,
      },
    });
  };

  const handleStep2Apply = () => {
    if (needsStep3) setStep(3);
    else buildAndSave();
  };

  const CHIP_DEFS = [
    { val: "pain",        label: "😣 Pain or soreness" },
    { val: "zero_time",   label: "⏱ Zero time today"  },
    { val: "gym",         label: "🏋️ Gym access today"  },
    { val: "taking_easy", label: "🌿 Taking it easy"   },
    ...(showPeriodChip ? [{ val: "period", label: "🌙 Period today" }] : []),
  ];

  const PAIN_AREAS = [
    { k: "knee",       l: "Knee"       },
    { k: "shoulder",   l: "Shoulder"   },
    { k: "lower_back", l: "Lower back" },
    { k: "ankle",      l: "Ankle"      },
  ];

  const smileys = [
    { val: 1, label: "Not great", color: "#f87171", Face: SadFace     },
    { val: 2, label: "Okay",      color: C.muted,   Face: NeutralFace },
    { val: 3, label: "Good",      color: C.emerald, Face: HappyFace   },
  ];

  const dotCount = needsStep3 ? 3 : 2;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", flexDirection: "column", justifyContent: "flex-end", background: "rgba(2,6,23,0.7)", backdropFilter: "blur(8px)" }}>
      <div style={{ background: "#0a1628", borderTop: `1px solid ${C.border}`, borderRadius: "24px 24px 0 0", maxHeight: "92vh", display: "flex", flexDirection: "column", boxShadow: "0 -20px 60px rgba(0,0,0,0.6)" }}>

        {/* Drag handle + close */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px 4px" }}>
          <div style={{ width: 32 }} />
          <div style={{ width: 36, height: 4, borderRadius: 2, background: C.subtle }} />
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, color: C.muted, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}
          >×</button>
        </div>

        {/* Step dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 6, padding: "8px 0 0" }}>
          {Array.from({ length: dotCount }, (_, i) => i + 1).map(n => (
            <div key={n} style={{ width: n === step ? 20 : 6, height: 6, borderRadius: 3, background: n === step ? "var(--accent)" : C.subtle, transition: "all 0.2s" }} />
          ))}
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px 0" }}>

          {/* ── Step 1 — How are you? ── */}
          {step === 1 && (
            <div>
              <div style={{ textAlign: "center", paddingTop: 8, paddingBottom: 4 }}>
                <div style={{ ...display(26, 900), color: C.text, textTransform: "uppercase", marginBottom: 4 }}>How are you today?</div>
                <div style={{ fontSize: 14, color: C.muted }}>Tap to tell your coach</div>
              </div>
              <div style={{ display: "flex", gap: 12, paddingTop: 24, paddingBottom: 32 }}>
                {smileys.map((sm) => {
                  const { val, label, color, Face } = sm;
                  const sel = feeling === val;
                  return (
                    <button
                      key={val}
                      onClick={() => { setFeeling(val); setStep(2); }}
                      style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "20px 8px", borderRadius: 20, border: `1px solid ${sel ? color : C.border}`, background: sel ? `${color}22` : "rgba(255,255,255,0.03)", cursor: "pointer", color: sel ? color : C.muted, fontFamily: "inherit", transition: "all 0.15s" }}
                    >
                      <Face size={56} />
                      <span style={{ fontSize: 12, fontWeight: 800 }}>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Step 2 — Anything else? ── */}
          {step === 2 && (
            <div>
              <div style={{ paddingTop: 8, paddingBottom: 4 }}>
                <div style={{ ...display(24, 900), color: C.text, textTransform: "uppercase", marginBottom: 4 }}>Anything else?</div>
                <div style={{ fontSize: 14, color: C.muted }}>Select all that apply — or just tap Apply</div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, paddingTop: 16, paddingBottom: 14 }}>
                {CHIP_DEFS.map(({ val, label }) => {
                  const sel = chips.includes(val);
                  return (
                    <button
                      key={val}
                      onClick={() => toggleChip(val)}
                      style={{ padding: "10px 16px", borderRadius: 99, background: sel ? "var(--accent-dim)" : "rgba(255,255,255,0.04)", border: `1px solid ${sel ? "var(--accent-border)" : C.border}`, color: sel ? "var(--accent)" : C.muted, fontSize: 14, fontWeight: sel ? 700 : 500, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <textarea
                placeholder="Anything I should consider today?"
                value={freeText}
                onChange={e => setFreeText(e.target.value)}
                style={{ width: "100%", minHeight: 72, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, fontSize: 14, color: C.text, resize: "none", outline: "none", fontFamily: "inherit", boxSizing: "border-box", marginBottom: 4 }}
              />
            </div>
          )}

          {/* ── Step 3 — Conditional detail ── */}
          {step === 3 && (
            <div>
              <div style={{ paddingTop: 8, paddingBottom: 4 }}>
                <div style={{ ...display(24, 900), color: C.text, textTransform: "uppercase", marginBottom: 4 }}>A bit more...</div>
                <div style={{ fontSize: 14, color: C.muted }}>Helps us tune today's session</div>
              </div>

              {hasPain && (
                <div style={{ marginTop: 16, marginBottom: 20 }}>
                  <div style={{ ...mono(10), color: C.emerald, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>Pain detail</div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    {[{ v: "general", l: "General soreness" }, { v: "specific", l: "Specific area" }].map(({ v, l }) => (
                      <button
                        key={v}
                        onClick={() => { setPainScope(v); if (v === "general") setPainAreas([]); }}
                        style={{ flex: 1, padding: "10px 8px", borderRadius: 14, background: painScope === v ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${painScope === v ? "rgba(239,68,68,0.4)" : C.border}`, color: painScope === v ? "#f87171" : C.muted, fontSize: 13, fontWeight: painScope === v ? 700 : 500, cursor: "pointer", fontFamily: "inherit" }}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                  {painScope === "specific" && (
                    <>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                        {PAIN_AREAS.map(({ k, l }) => {
                          const active = painAreas.includes(k);
                          return (
                            <button
                              key={k}
                              onClick={() => toggleArea(k)}
                              style={{ padding: "8px 14px", borderRadius: 14, background: active ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.05)", color: active ? "#f87171" : C.muted, border: active ? "1px solid rgba(239,68,68,0.4)" : `1px solid ${C.border}`, fontWeight: active ? 700 : 500, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
                            >
                              {l}
                            </button>
                          );
                        })}
                      </div>
                      {painAreas.length > 0 && (
                        <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)", fontSize: 12, color: C.muted, lineHeight: 1.5 }}>
                          <button
                            onClick={() => onMarkChronic && onMarkChronic(painAreas)}
                            style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", color: "#f87171", fontSize: 12, fontWeight: 700, cursor: "pointer", marginBottom: 2, padding: 0 }}
                          >
                            Save as ongoing issue →
                          </button>
                          Adds to your profile so we always avoid these areas.
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {bodyMode === "pregnant" && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ ...mono(10), color: "#fbbf24", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>How is your body today?</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[
                      { key: "nausea",            label: "Feeling nauseous",  sub: "We'll keep it very gentle" },
                      { key: "breathless",        label: "Feeling breathless", sub: "We'll shorten intervals"  },
                      { key: "pelvic_discomfort", label: "Pelvic discomfort",  sub: "Low-load focus today"     },
                    ].map(({ key, label, sub }) => {
                      const active = pregnancySignals[key];
                      return (
                        <button
                          key={key}
                          onClick={() => setPregnancySignals(s => ({ ...s, [key]: !active }))}
                          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderRadius: 14, width: "100%", textAlign: "left", background: active ? "rgba(251,191,36,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${active ? "rgba(251,191,36,0.35)" : C.border}`, cursor: "pointer", fontFamily: "inherit" }}
                        >
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: active ? "#fbbf24" : C.text }}>{label}</div>
                            {active && <div style={{ fontSize: 11, color: "rgba(251,191,36,0.7)", marginTop: 2 }}>{sub}</div>}
                          </div>
                          <div style={{ width: 38, height: 20, borderRadius: 999, background: active ? "#fbbf24" : C.subtle, position: "relative", flexShrink: 0 }}>
                            <div style={{ position: "absolute", top: 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", left: active ? 19 : 2, transition: "left 0.2s" }} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {bodyMode === "postnatal" && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ ...mono(10), color: "rgba(251,191,36,0.8)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>How is your recovery today?</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[
                      { key: "heaviness",     label: "Feeling pelvic heaviness", sub: "We'll reduce load and impact"  },
                      { key: "running_today", label: "Returned to running",       sub: "Clearance note will be added" },
                    ].map(({ key, label, sub }) => {
                      const active = postnatalSignals[key];
                      return (
                        <button
                          key={key}
                          onClick={() => setPostnatalSignals(s => ({ ...s, [key]: !active }))}
                          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderRadius: 14, width: "100%", textAlign: "left", background: active ? "rgba(251,191,36,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${active ? "rgba(251,191,36,0.35)" : C.border}`, cursor: "pointer", fontFamily: "inherit" }}
                        >
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: active ? "#fbbf24" : C.text }}>{label}</div>
                            {active && <div style={{ fontSize: 11, color: "rgba(251,191,36,0.7)", marginTop: 2 }}>{sub}</div>}
                          </div>
                          <div style={{ width: 38, height: 20, borderRadius: 999, background: active ? "#fbbf24" : C.subtle, position: "relative", flexShrink: 0 }}>
                            <div style={{ position: "absolute", top: 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", left: active ? 19 : 2, transition: "left 0.2s" }} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 24px 32px", borderTop: step > 1 ? `1px solid ${C.border}` : "none", background: "rgba(255,255,255,0.01)" }}>
          {step === 2 && (
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={onClose}
                style={{ flex: 1, padding: 14, borderRadius: 14, fontWeight: 700, fontSize: 13, background: "transparent", border: `1px solid ${C.border}`, color: C.muted, cursor: "pointer", fontFamily: "inherit" }}
              >
                Skip
              </button>
              <button
                onClick={handleStep2Apply}
                style={{ flex: 1, padding: 14, borderRadius: 14, fontWeight: 900, fontSize: 15, background: "var(--accent)", border: "none", color: "#fff", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 8px 24px rgba(var(--accent-rgb),0.3)" }}
              >
                Apply →
              </button>
            </div>
          )}
          {step === 3 && (
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={onClose}
                style={{ flex: "0 0 auto", padding: "14px 20px", borderRadius: 14, fontWeight: 700, fontSize: 13, background: "transparent", border: `1px solid ${C.border}`, color: C.muted, cursor: "pointer", fontFamily: "inherit" }}
              >
                Skip
              </button>
              <button
                onClick={buildAndSave}
                style={{ flex: 1, padding: 14, borderRadius: 14, fontWeight: 900, fontSize: 15, background: "var(--accent)", border: "none", color: "#fff", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 8px 24px rgba(var(--accent-rgb),0.3)" }}
              >
                Apply →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── LOG ACTIVITY MODAL ───────────────────────────────────────────────────────
const ACTIVITY_TYPES = [
  { label: "Run",   value: "run"   },
  { label: "Walk",  value: "walk"  },
  { label: "Cycle", value: "bike"  },
  { label: "Swim",  value: "mixed" },
  { label: "Sport", value: "mixed" },
  { label: "Other", value: "mixed" },
];
const ACTIVITY_DURATIONS = [15, 20, 30, 45, 60, 90];

function LogActivityModal({ onSave, onClose }) {
  const [type, setType] = useState(null);
  const [duration, setDuration] = useState(null);

  const pill = (active) => ({
    padding: "9px 18px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
    border: active ? `1px solid ${C.emerald}` : `1px solid ${C.border}`,
    background: active ? C.emeraldDim : "rgba(255,255,255,0.03)",
    color: active ? C.emerald : C.muted,
  });

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 520, background: "#0d1626", border: `1px solid ${C.border}`, borderRadius: "24px 24px 0 0", padding: "32px 24px 40px" }}>
        <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.02em", marginBottom: 24 }}>Log Activity</div>

        <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", color: C.muted, marginBottom: 12 }}>Type</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
          {ACTIVITY_TYPES.map((t) => (
            <button key={t.label} onClick={() => setType(t)} style={pill(type?.label === t.label)}>{t.label}</button>
          ))}
        </div>

        <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", color: C.muted, marginBottom: 12 }}>Duration</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 32 }}>
          {ACTIVITY_DURATIONS.map((d) => (
            <button key={d} onClick={() => setDuration(d)} style={pill(duration === d)}>{d}m</button>
          ))}
        </div>

        <button
          disabled={!type || !duration}
          onClick={() => onSave(type.value, duration)}
          style={{ width: "100%", padding: 16, borderRadius: 16, fontSize: 15, fontWeight: 900, background: (!type || !duration) ? C.subtle : C.emerald, border: "none", color: (!type || !duration) ? C.muted : "#fff", cursor: (!type || !duration) ? "not-allowed" : "pointer", boxShadow: (!type || !duration) ? "none" : "0 8px 30px rgba(var(--accent-rgb),0.3)" }}
        >
          Save Activity
        </button>
      </div>
    </div>
  );
}

// ─── WHY NOT MODAL ────────────────────────────────────────────────────────────
const WHY_NOT_OPTIONS = [
  { label: "No time",       checkin: { no_time: true, time_budget: 10 } },
  { label: "Feeling sick",  checkin: { pain_level: 2 } },
  { label: "Injured",       checkin: { pain_level: 3 } },
  { label: "Too tired",     checkin: { energy: 2 } },
  { label: "No gear",       checkin: { no_gear: true } },
  { label: "Just need rest",checkin: null },
];

function WhyNotModal({ onRegen, onRestDay, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 420, background: "#0d1626", border: `1px solid ${C.border}`, borderRadius: 24, padding: 32 }}>
        <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.02em", marginBottom: 8 }}>What's getting in the way?</div>
        <p style={{ fontSize: 13, color: C.muted, marginBottom: 24, lineHeight: 1.5 }}>We'll adjust today's plan to fit your situation.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 24 }}>
          {WHY_NOT_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              onClick={() => opt.checkin === null ? onRestDay() : onRegen(opt.checkin)}
              style={{ padding: "11px 18px", borderRadius: 14, fontSize: 13, fontWeight: 800, cursor: "pointer", border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.04)", color: C.text }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <button onClick={onClose} style={{ width: "100%", padding: 13, borderRadius: 14, fontSize: 13, fontWeight: 700, background: "transparent", border: `1px solid ${C.border}`, color: C.muted, cursor: "pointer" }}>Cancel</button>
      </div>
    </div>
  );
}

// ─── DONE CARD ────────────────────────────────────────────────────────────────
function DoneCard({ score, prevScore, completedSession, onLogActivity, onBonusSession, bonusDone }) {
  const sessionLabel = completedSession?.name ?? "Session";
  const mins = completedSession?.duration_sec ? Math.round(completedSession.duration_sec / 60) : null;
  const scoreBump = score > prevScore;
  const beforeNight = new Date().getHours() < 23;

  return (
    <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 0, background: "linear-gradient(135deg, rgba(var(--accent-rgb),0.12) 0%, rgba(2,6,23,0.8) 60%)", border: "1px solid rgba(var(--accent-rgb),0.4)", borderRadius: 20 }}>
      {/* Checkmark */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: C.emeraldDim, border: `1px solid ${C.emeraldBorder}`, boxShadow: "0 0 20px rgba(var(--accent-rgb),0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.emerald} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 900, color: C.text, letterSpacing: "-0.02em" }}>Session Complete</div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>
            {sessionLabel}{mins ? ` · ${mins} min` : ""}
          </div>
        </div>
      </div>

      <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 6 }}>Great work. You showed up today.</div>

      {scoreBump && (
        <div style={{ fontSize: 13, color: C.emerald, fontWeight: 700, marginBottom: 16 }}>
          Consistency score: {prevScore} → {score} ⚡
        </div>
      )}
      {!scoreBump && <div style={{ marginBottom: 16 }} />}

      <div style={{ height: 1, background: C.border, marginBottom: 20 }} />

      <div style={{ fontSize: 12, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>Want more?</div>

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onLogActivity} style={{ flex: 1, padding: "13px 12px", borderRadius: 14, fontSize: 13, fontWeight: 800, cursor: "pointer", border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.04)", color: C.text }}>
          + Log activity
        </button>
        {!bonusDone && beforeNight && (
          <button onClick={onBonusSession} style={{ flex: 1, padding: "13px 12px", borderRadius: 14, fontSize: 13, fontWeight: 800, cursor: "pointer", border: `1px solid ${C.emeraldBorder}`, background: C.emeraldDim, color: C.emerald }}>
            ⚡ Bonus session
          </button>
        )}
      </div>
    </div>
  );
}

// ─── BONUS MINUTE PICKER ──────────────────────────────────────────────────────
function BonusMinutePicker({ onSelect, onClose }) {
  const opts = [10, 15, 20, 30];
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 360, background: "#0d1626", border: `1px solid ${C.border}`, borderRadius: 24, padding: 28 }}>
        <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 8, letterSpacing: "-0.02em" }}>Bonus Session</div>
        <p style={{ fontSize: 13, color: C.muted, marginBottom: 24, lineHeight: 1.5 }}>How many extra minutes do you have?</p>
        <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
          {opts.map(m => (
            <button key={m} onClick={() => onSelect(m)} style={{ flex: 1, padding: "14px 0", borderRadius: 14, fontSize: 15, fontWeight: 900, cursor: "pointer", border: `1px solid ${C.emeraldBorder}`, background: C.emeraldDim, color: C.emerald }}>{m}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── PREGNANCY PROGRESS BANNER ───────────────────────────────────────────────
const PREGNANCY_MILESTONES = [
  { week: 4,  msg: "Week 4 · Your baby is the size of a poppy seed. Movement is good — keep it gentle." },
  { week: 8,  msg: "Week 8 · First trimester well underway. Listen to your body — rest counts too." },
  { week: 13, msg: "Week 13 · Welcome to the second trimester. Energy often improves from here." },
  { week: 16, msg: "Week 16 · Time to move away from exercises lying flat on your back." },
  { week: 20, msg: "Week 20 · Halfway there. Your sessions are adapting with you." },
  { week: 24, msg: "Week 24 · Pelvic floor work pays dividends now and after birth." },
  { week: 28, msg: "Week 28 · Third trimester begins. Slower and steadier — you're doing brilliantly." },
  { week: 32, msg: "Week 32 · Breathlessness is normal. Short breaks are part of the session." },
  { week: 36, msg: "Week 36 · Practise your labour breathing — it's the most useful thing now." },
  { week: 40, msg: "Week 40 · Due any day. Movement can help — rest when you need to." },
];

const POSTNATAL_MILESTONES = [
  { day: 3,   msg: "Day 3 · Rest and pelvic floor breathing. That's everything right now." },
  { day: 7,   msg: "Week 1 · Gentle heel slides and pelvic tilts are a great start." },
  { day: 14,  msg: "Week 2 · Your body is healing quietly. Every breath counts." },
  { day: 42,  msg: "Week 6 · Time to check in with your midwife or GP about exercise clearance." },
  { day: 84,  msg: "Week 12 · Core rebuilding is underway. Take it one week at a time." },
  { day: 140, msg: "Week 20 · Great progress. Strength is returning." },
  { day: 182, msg: "Week 26 · You're in the returning phase. Full programme available when you're ready." },
];

function PregnancyProgressBanner({ cycle }) {
  const _uid = getUserId();
  const _msKey = _uid ? `jf_milestone_dismissed_${_uid}` : 'jf_milestone_dismissed';
  const [dismissed, setDismissed] = useState(() => {
    try {
      // best-effort migration: read namespaced key, fall back to legacy global key
      return JSON.parse(localStorage.getItem(_msKey) || localStorage.getItem('jf_milestone_dismissed') || "{}");
    } catch { return {}; }
  });

  if (!cycle) return null;
  const mode = cycle.mode ?? "standard";

  if (mode === "pregnant") {
    const week = cycle.pregnancy_week;
    const trimester = cycle.trimester;
    if (!week) return null;

    // Find current milestone
    const milestone = [...PREGNANCY_MILESTONES].reverse().find(m => week >= m.week);
    const milestoneKey = milestone ? `p_w${milestone.week}` : null;
    const showMilestone = milestone && !dismissed[milestoneKey];

    const pct = Math.min(100, Math.round((week / 40) * 100));
    const T_COLORS = { 1: "var(--accent)", 2: "#fbbf24", 3: "#f97316" };
    const barColor = T_COLORS[trimester] ?? "#fbbf24";

    return (
      <div style={{ marginBottom: 20 }}>
        <div style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.18)", borderRadius: 16, padding: "14px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#fbbf24" }}>Week {week} of your pregnancy</div>
            <div style={{ fontSize: 11, color: "rgba(251,191,36,0.6)", fontWeight: 700 }}>Trimester {trimester}</div>
          </div>
          <div style={{ height: 5, background: "rgba(255,255,255,0.07)", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: 999, transition: "width 0.5s" }} />
          </div>
          {showMilestone && (
            <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
              <div style={{ fontSize: 12, color: "rgba(251,191,36,0.85)", lineHeight: 1.6, flex: 1 }}>{milestone.msg}</div>
              <button
                onClick={() => {
                  const updated = { ...dismissed, [milestoneKey]: true };
                  setDismissed(updated);
                  localStorage.setItem(_msKey, JSON.stringify(updated));
                }}
                style={{ fontSize: 11, color: C.muted, background: "none", border: "none", cursor: "pointer", padding: "2px 0", flexShrink: 0 }}
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (mode === "postnatal") {
    const birthDate = cycle.postnatal_birth_date;
    if (!birthDate) return null;
    const daysSince = Math.floor((new Date() - new Date(birthDate)) / (1000 * 60 * 60 * 24));
    const postnatalPhase = cycle.postnatal_phase;

    const milestone = [...POSTNATAL_MILESTONES].reverse().find(m => daysSince >= m.day);
    const milestoneKey = milestone ? `pn_d${milestone.day}` : null;
    const showMilestone = milestone && !dismissed[milestoneKey];

    const PHASE_LABELS_PN = {
      immediate: "Immediate recovery",
      early: "Early recovery",
      rebuilding: "Rebuilding",
      strengthening: "Strengthening",
      returning: "Returning to fitness",
    };

    return (
      <div style={{ marginBottom: 20 }}>
        <div style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.15)", borderRadius: 16, padding: "14px 16px" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#fbbf24", marginBottom: 3 }}>
            {PHASE_LABELS_PN[postnatalPhase] ?? "Postnatal recovery"}
          </div>
          <div style={{ fontSize: 11, color: "rgba(251,191,36,0.6)" }}>Day {daysSince} after birth</div>
          {showMilestone && (
            <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
              <div style={{ fontSize: 12, color: "rgba(251,191,36,0.85)", lineHeight: 1.6, flex: 1 }}>{milestone.msg}</div>
              <button
                onClick={() => {
                  const updated = { ...dismissed, [milestoneKey]: true };
                  setDismissed(updated);
                  localStorage.setItem(_msKey, JSON.stringify(updated));
                }}
                style={{ fontSize: 11, color: C.muted, background: "none", border: "none", cursor: "pointer", padding: "2px 0", flexShrink: 0 }}
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
// ─── MESSAGE COMPONENTS ────────────────────────────────────────────────────────


/**
 * Collapsible "Why this plan?" panel — shows below session header, above exercise list.
 * Auto-expands the first time it's seen (tracked in localStorage).
 * Renders groups: Safety adaptations | Training adaptations | Suggested actions.
 */
function WhyPlanPanel({ plan }) {
  const advisories = parseRuleTrace(plan?.rule_trace);

  const hasContent =
    advisories.safety.length > 0 ||
    advisories.training.length > 0 ||
    advisories.suggested.length > 0;

  // date is more stable than id: plan IDs change on regeneration, date stays the same day
  const panelKey = `jf_whypanel_${plan?.date ?? plan?.id ?? "default"}`;
  // Auto-expand on first view per day; collapsed by default after that
  const [open, setOpen] = useState(() => !localStorage.getItem(panelKey));

  useEffect(() => {
    if (!localStorage.getItem(panelKey)) localStorage.setItem(panelKey, "1");
  }, [panelKey]);

  if (!hasContent) return null;

  const sectionLabel = (text) => (
    <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", color: C.muted, marginTop: 10, marginBottom: 4 }}>
      {text}
    </div>
  );

  const advisoryRow = (entry) => (
    <div key={entry.code} style={{ display: "flex", alignItems: "flex-start", gap: 8, paddingBottom: 5 }}>
      <span style={{ color: C.emerald, flexShrink: 0, marginTop: 1 }}>›</span>
      <span style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>
        {entry.text}
        {entry.cta && <span style={{ color: C.emerald, fontWeight: 700 }}> {entry.cta}</span>}
      </span>
    </div>
  );

  return (
    <div style={{ marginBottom: 14 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          fontSize: 11,
          fontWeight: 700,
          color: C.muted,
          marginBottom: open ? 8 : 0,
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
        Why this plan?
      </button>

      {open && (
        <div
          role="status"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            padding: "12px 14px",
          }}
        >
          {advisories.safety.length > 0 && (
            <>
              {sectionLabel("Safety adaptation")}
              {advisories.safety.map(advisoryRow)}
            </>
          )}

          {advisories.training.length > 0 && (
            <>
              {sectionLabel("Training adaptation")}
              {advisories.training.map(advisoryRow)}
            </>
          )}

          {advisories.suggested.length > 0 && (
            <>
              {sectionLabel("Suggested action")}
              {advisories.suggested.map(advisoryRow)}
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
        Health &amp; Safety
      </div>
      <p style={{ fontSize: 12, color: "#fcd34d", fontWeight: 600, lineHeight: 1.6, margin: 0 }}>
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
  const [reportSent, setReportSent] = useState(false);
  const [reportSending, setReportSending] = useState(false);
  const msg = PLAN_ERROR_MESSAGES[planError.code] ?? PLAN_ERROR_MESSAGES["PLAN-ERR"];

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
          <div style={{ fontSize: 15, fontWeight: 900, color: C.text }}>No plan generated</div>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", color: "#ef4444", fontFamily: "'Courier New', monospace", marginTop: 3 }}>{planError.code}</div>
        </div>
      </div>
      <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, marginBottom: planError.detail ? 12 : 20 }}>
        {msg}
      </div>
      {planError.detail && (
        <div style={{ fontFamily: "'Courier New', monospace", fontSize: 11, color: "#64748b", background: "rgba(0,0,0,0.3)", borderRadius: 10, padding: "8px 12px", marginBottom: 20, lineHeight: 1.5, wordBreak: "break-all" }}>
          {planError.detail}
        </div>
      )}
      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={onRetry}
          style={{ flex: 1, padding: "12px 0", borderRadius: 14, fontWeight: 900, fontSize: 13, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: C.text, cursor: "pointer" }}
        >
          Try again
        </button>
        <button
          disabled={reportSent || reportSending}
          onClick={handleReport}
          style={{ flex: 1, padding: "12px 0", borderRadius: 14, fontWeight: 900, fontSize: 13, border: `1px solid ${reportSent ? "rgba(74,222,128,0.3)" : "rgba(239,68,68,0.3)"}`, background: reportSent ? "rgba(74,222,128,0.08)" : "rgba(239,68,68,0.08)", color: reportSent ? "#4ade80" : "#ef4444", cursor: reportSent ? "default" : "pointer", opacity: reportSending ? 0.6 : 1, transition: "color 0.2s, border-color 0.2s, background 0.2s" }}
        >
          {reportSent ? "Report sent ✓" : reportSending ? "Sending…" : "Send report"}
        </button>
      </div>
    </div>
  );
}

// Map exercise slug/tags → ExerciseIcon key
function iconKeyFor(ex) {
  const slug = (ex?.exercise_slug || ex?.name || "").toLowerCase().replace(/\s+/g, "-");
  const tags = (() => { try { return JSON.parse(ex?.tags_json || "[]"); } catch { return []; } })();
  // Existing matches
  if (slug.includes("push-up") || slug.includes("pushup")) return "pushup";
  if (slug.includes("squat")) return "squat";
  if (slug.includes("deadlift")) return "deadlift";
  if (slug.includes("bench")) return "bench";
  if (slug.includes("row")) return "row";
  if (slug.includes("pull-up") || slug.includes("pullup") || slug.includes("chin")) return "pull";
  if (slug.includes("plank")) return "plank";
  if (slug.includes("lunge") || slug.includes("split-squat")) return "lunge";
  if (slug.includes("curl")) return "curl";
  if (slug.includes("sit-up") || slug.includes("crunch")) return "sit";
  if (slug.includes("kettlebell") || slug.includes("swing")) return "kettle";
  if (tags.includes("cardio") || slug.includes("run") || slug.includes("jog")) return "run";
  // New matches
  if (slug.includes("lateral-raise") || slug.includes("front-raise") || slug.includes("face-pull") || slug.includes("upright-row")) return "shoulder";
  if (slug.includes("press") || slug.includes("overhead") || slug.includes("shoulder-press")) return "press";
  if (slug.includes("dip")) return "dip";
  if (slug.includes("hip-thrust") || slug.includes("glute-bridge") || slug.includes("rdl") || slug.includes("romanian")) return "hip";
  if (slug.includes("band") || slug.includes("resistance-band")) return "band";
  if (slug.includes("step-up") || slug.includes("box-jump") || slug.includes("stair")) return "step";
  if (slug.includes("stair-climb")) return "climb";
  if (slug.includes("sprint") || slug.includes("high-knees") || slug.includes("mountain-climber") || slug.includes("jumping-jack") || slug.includes("burpee") || slug.includes("jump")) return "sprint";
  if ((slug.includes("walk") || slug.includes("march") || slug.includes("carry")) && !slug.includes("run") && !slug.includes("jog")) return "walk";
  if (slug.includes("twist") || slug.includes("rotation") || slug.includes("woodchop")) return "rotation";
  if (slug.includes("breath") || slug.includes("box-breathing") || slug.includes("diaphragm")) return "breathe";
  if (slug.includes("foam-roll")) return "foam";
  if (tags.includes("military") || slug.includes("cooper") || slug.includes("pack")) return "military";
  if (slug.includes("cycling") || slug.includes("bike") || slug.includes("cycle")) return "bike";
  if (tags.includes("mobility") || tags.includes("recovery") || slug.includes("stretch") || slug.includes("child") || slug.includes("pigeon") || slug.includes("foam")) return "stretch";
  return "default";
}

// Split session name into two display lines
function splitTitle(name) {
  if (!name) return ["NO SESSION", ""];
  const upper = name.toUpperCase();
  if (upper.length <= 12) return [upper, ""];
  const i = upper.indexOf(" ", 8);
  if (i < 0) return [upper, ""];
  return [upper.slice(0, i), upper.slice(i + 1)];
}

function Dashboard({ plan, score, prevScore, onStartWorkout, isGenerating, todayCompleted, completedSession, onLogActivity, onBonusSession, bonusDone, onWhyNot, prefs, planError, onRetryPlan, token, history, onNavigateProgress, cycle }) {
  const intensityColor = {
    low: "#6ee7b7",
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
    const goal = prefs?.preferences?.training_goal ?? 'health';
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
    if (done === 0) message = `${target} sessions this week — let's get started.`;
    else if (done >= target) message = `Goal hit — ${done} of ${target} sessions done. Bonus available.`;
    else if (remaining === 1) message = `One more to hit your weekly goal.`;
    else message = `${done} of ${target} done — ${remaining} to go.`;
    return { done, target, message };
  })();

  // ── Date line ────────────────────────────────────────────────────────────
  const dateLine = new Date()
    .toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
    .toUpperCase().replace(",", " ·");

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
  const [line1, line2] = splitTitle(plan?.session_name);

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

      {/* ── Session area ───────────────────────────── */}
      {todayCompleted ? (
        <DoneCard score={score} prevScore={prevScore} completedSession={completedSession} onLogActivity={onLogActivity} onBonusSession={onBonusSession} bonusDone={bonusDone} />
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
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: "32px 0" }}>
                <div style={{ width: 40, height: 40, border: `3px solid ${C.emeraldBorder}`, borderTopColor: C.emerald, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                <p style={{ fontSize: 14, color: C.emerald, fontWeight: 700 }}>Designing your session...</p>
              </div>
            ) : plan ? (
              <>
                {/* Session eyebrow + ID */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ ...eyebrow, color: C.faint, fontSize: 9.5 }}>TODAY · DAY {(history ?? []).length + 1}</div>
                  <div style={{ ...mono(9), color: C.faint }}>SESSION_{String(plan.steps?.length ?? 0).padStart(2, "0")}</div>
                </div>
                {/* Coach tag — eyebrow pill just above session name */}
                {(() => {
                  const milA = !!(prefs?.preferences?.military_coach?.active);
                  const rcA  = !!(prefs?.preferences?.run_coach?.enrolled && !prefs?.preferences?.run_coach?.completed);
                  const ccA  = !!(prefs?.preferences?.cycling_coach?.active && !prefs?.preferences?.cycling_coach?.completed);
                  if (!milA && !rcA && !ccA) return null;
                  const tagLabel = milA
                    ? `Military · ${milClL(prefs.preferences.military_coach.track ?? 'keuring', prefs.preferences.military_coach.cluster_current ?? prefs.preferences.military_coach.cluster_target ?? 0)}`
                    : rcA ? `Running · ${prefs.preferences.run_coach.target_km}km`
                    : `Cycling · Week ${prefs.preferences.cycling_coach.week ?? 1}`;
                  return (
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 4, ...mono(), fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--accent)", background: "var(--accent-dim)", border: "1px solid var(--accent-border)", padding: "3px 9px", borderRadius: 99, marginBottom: 10 }}>
                      {milA && <MilitaryIcon size={9} />}{tagLabel}
                    </div>
                  );
                })()}
                {/* Session name — hero size */}
                <div style={{ marginBottom: 10 }}>
                  <div style={{ ...display(52, 900), color: C.text, lineHeight: 0.95, textTransform: "uppercase" }}>{line1}</div>
                  {line2 && <div style={{ ...display(52, 900), color: "var(--accent)", lineHeight: 0.95, textTransform: "uppercase" }}>{line2}</div>}
                </div>
                {/* Coach / program badges */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
                  {prefs?.preferences?.run_coach?.enrolled && plan?.run_program && (
                    <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", background: "rgba(var(--accent-rgb),0.15)", color: "var(--accent)", borderRadius: 4, padding: "2px 7px" }}>
                      {plan.run_program.session_type ?? "Run Day"} · Week {plan.run_program.week}
                    </span>
                  )}
                  {prefs?.preferences?.cycling_coach?.active && plan?.cycling_program && (
                    <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", background: "rgba(var(--accent-rgb),0.15)", color: "var(--accent)", borderRadius: 4, padding: "2px 7px" }}>
                      🚴 {plan.cycling_program.session_type ?? "Cycling"} · Week {plan.cycling_program.week}
                    </span>
                  )}
                  {prefs?.preferences?.cycling_coach?.active && plan?.cross_training_run && (
                    <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", background: "rgba(var(--accent-rgb),0.15)", color: "var(--accent)", borderRadius: 4, padding: "2px 7px" }}>
                      🏃 Cross-Training · Level {plan.cross_training_run.level}
                    </span>
                  )}
                  {prefs?.preferences?.military_coach?.active && plan?.military_program && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 9, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", background: "rgba(var(--accent-rgb),0.15)", color: "var(--accent)", borderRadius: 4, padding: "2px 7px" }}>
                      <MilitaryIcon size={10} />
                      {({ cooper_test: 'Cooper Test', kracht: 'Strength', duurloop: 'Endurance Run', interval: 'Intervals', kracht_marsen: 'Strength + March', circuit: 'Circuit', rust: 'Rest' })[plan.military_program.session_type] ?? plan.military_program.session_type ?? 'Military'}
                      {plan.military_program.is_base_build ? ' · Base build' : ` · W${plan.military_program.week}`}
                    </span>
                  )}
                </div>
                {/* Coach sentence — rationale below the hero title */}
                {(() => {
                  const sentence = deriveCoachSentence(plan.rule_trace, plan.session_notes, cycle?.mode ?? 'standard');
                  const fallback = plan.slot_type !== 'rest' && plan.session_name
                    ? `Today's session: ${plan.session_name.toLowerCase()}.`
                    : null;
                  const text = sentence ?? fallback;
                  return text ? (
                    <div style={{ fontSize: 15, lineHeight: 1.5, color: '#cbd5e1', maxWidth: '34ch', marginBottom: 14 }}>{text}</div>
                  ) : null;
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
                    <span style={{ ...mono(11), color: C.mutedStrong }}>{plan.steps.length} moves</span>
                  )}
                  {plan.intensity && (plan.steps?.length ?? 0) > 0 && (
                    <span style={{ ...mono(11), color: C.faint, margin: "0 8px" }}>|</span>
                  )}
                  {plan.intensity && (
                    <span style={{ ...mono(11), color: ic, textTransform: "uppercase" }}>{plan.intensity}</span>
                  )}
                </div>
                {/* Exercise list — first 3 steps with icons */}
                {plan.slot_type !== "rest" && (plan.steps?.length ?? 0) > 0 ? (
                  <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
                    {plan.steps.slice(0, 3).map((s, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: i < Math.min(2, plan.steps.length - 1) ? `1px solid ${C.border}` : "none" }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <ExerciseIcon type={iconKeyFor(s)} size={22} c={C.faint} />
                        </div>
                        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: C.text }}>{s.name}</span>
                        <span style={{ ...mono(11), color: C.muted }}>
                          {(() => {
                            const isRunInterval = JSON.parse(s.tags_json || "[]").includes("run_interval");
                            if (isRunInterval && s.sets > 1 && s.target_duration_sec) return `${s.sets} × ${formatExDuration(s.target_duration_sec)} run`;
                            if (s.target_reps) return `${s.sets} × ${s.target_reps}`;
                            return `${s.sets} × ${formatExDuration(s.target_duration_sec)}`;
                          })()}
                        </span>
                        <Icons.chevronRight size={14} c={C.subtle} />
                      </div>
                    ))}
                    {plan.steps.length > 3 && (
                      <div style={{ padding: "8px 14px", fontSize: 11, color: C.muted }}>
                        + {plan.steps.length - 3} more · {plan.steps.slice(3, 6).map(s => s.name.toLowerCase()).join(", ")}
                      </div>
                    )}
                  </div>
                ) : plan.slot_type === "rest" ? (
                  <div style={{ marginBottom: 16 }}>
                    <p style={{ fontSize: 13, color: C.muted, fontStyle: "italic" }}>Recovery day. Rest is training.</p>
                    {(() => {
                      const advisories = parseRuleTrace(plan.rule_trace ?? []);
                      const REST_CODES = ["R514", "R539", "R540"];
                      const whyEntry =
                        [...advisories.blocking, ...advisories.safety].find(a => REST_CODES.includes(a.code)) ??
                        ((plan.rule_trace ?? []).some(t => t.includes("adapt:pain_rest"))
                          ? { text: "Your check-in reported significant pain — rest is the right call today." }
                          : null);
                      return whyEntry ? (
                        <div style={{ fontSize: 12, color: C.muted, marginTop: 10, padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 12, lineHeight: 1.5, borderLeft: `2px solid ${C.emeraldBorder}` }}>
                          {whyEntry.text}
                          {whyEntry.cta && <span style={{ color: C.emerald, fontWeight: 700 }}> {whyEntry.cta}</span>}
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
                {/* START SESSION button */}
                <button
                  onClick={() => plan.slot_type !== "rest" && onStartWorkout()}
                  style={{
                    width: "100%", height: 56,
                    background: plan.slot_type === "rest" ? C.subtle : "var(--accent)",
                    color: plan.slot_type === "rest" ? C.muted : "#000",
                    border: "none", borderRadius: 16,
                    ...display(18, 800), letterSpacing: "0.02em",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                    boxShadow: plan.slot_type !== "rest" ? `0 8px 24px ${C.emeraldGlow}` : "none",
                    cursor: plan.slot_type === "rest" ? "not-allowed" : "pointer",
                  }}
                >
                  {plan.slot_type === "rest" ? "Recovery Mode Active" : <>START SESSION <Icons.arrowRight size={20} c="#000" /></>}
                </button>
                {plan.slot_type !== "rest" && (
                  <button onClick={onWhyNot} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: C.muted, marginTop: 12, textAlign: "center", width: "100%" }}>
                    Can't do this today?
                  </button>
                )}
              </>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 12, padding: "32px 0" }}>
                <div style={{ fontSize: 40 }}>🎯</div>
                <p style={{ fontSize: 14, color: C.muted, fontWeight: 500, lineHeight: 1.5 }}>
                  Complete the daily check-in to<br />generate today's session.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Why panel + Safety banner ── */}
      {plan && !todayCompleted && (
        <>
          <WhyPlanPanel plan={plan} />
          {hasBlockingSafety(plan.rule_trace) && (
            <BlockingSafetyBanner
              text="Your session is kept gentle until you confirm exercise clearance with your healthcare provider."
              cta="Update clearance in Settings when you're cleared."
            />
          )}
        </>
      )}

      {/* ── Training intention card ─────────────────── */}
      {(() => {
        const rcActive = !!(prefs.preferences?.run_coach?.enrolled && !prefs.preferences?.run_coach?.completed);
        const ccActive = !!(prefs.preferences?.cycling_coach?.active && !prefs.preferences?.cycling_coach?.completed);
        const milActive = !!(prefs.preferences?.military_coach?.active);
        if (milActive) {
          const mil = prefs.preferences.military_coach;
          const track    = mil.track ?? 'keuring';
          const mp       = plan?.military_program;
          const clusterTarget  = mil.cluster_target ?? (track === 'keuring' ? 0 : 1);
          const clusterCurrent = mp?.cluster_current ?? mil.cluster_current ?? clusterTarget;
          const sessionLabel = mp?.session_type ? ({
            cooper_test: 'Cooper Test', kracht: 'Strength', duurloop: 'Endurance Run',
            interval: 'Interval Run', kracht_marsen: 'Strength + March', circuit: 'Circuit', rust: 'Rest',
          })[mp.session_type] ?? mp.session_type : null;
          const isCalibration   = mp?.is_calibration_week;
          const isDeload        = mp?.is_deload_week;
          const isTaper         = mp?.is_taper_week;
          const isPostAssess    = mp?.is_post_assessment;
          const isBaseBuild     = mp?.is_base_build;
          const milMode         = mp?.mode ?? mil.mode ?? 'target';
          const trackLabel      = track === 'keuring' ? 'Physical Assessment' : 'Educational Fitness';
          const overperforming  = clusterCurrent > clusterTarget;
          const lastCooper = mp?.last_cooper_distance_m ?? mil.last_cooper_distance_m ?? null;
          const cooperBenchmark = lastCooper ? (
            lastCooper < 1800 ? `${lastCooper}m · Below K1` :
            lastCooper < 2000 ? `${lastCooper}m · K1` :
            lastCooper < 2200 ? `${lastCooper}m · K2` :
            lastCooper < 2400 ? `${lastCooper}m · K3` :
            lastCooper < 2600 ? `${lastCooper}m · K4` :
            lastCooper < 2800 ? `${lastCooper}m · K5` : `${lastCooper}m · K6`
          ) : null;
          return (
            <Glass style={{ padding: "14px 20px", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: "rgba(var(--accent-rgb),0.15)", border: "1px solid rgba(var(--accent-rgb),0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "var(--accent)" }}>
                  <MilitaryIcon size={24} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", color: C.muted, textTransform: "uppercase", marginBottom: 2 }}>Military Coach</div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: C.text }}>
                    {trackLabel} · {milClL(track, clusterCurrent)}
                    {overperforming && <span style={{ fontSize: 10, color: C.emerald, marginLeft: 6 }}>↑ {milClL(track, clusterTarget)} target</span>}
                  </div>
                  {sessionLabel && (
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>Today: {sessionLabel}{mp?.march_kg ? ` · ${mp.march_kg} kg march` : ""}</div>
                  )}
                  {cooperBenchmark && (
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>Cooper: {cooperBenchmark}</div>
                  )}
                </div>
                {(isPostAssess || isBaseBuild || milMode === 'fit' || isCalibration || isDeload || isTaper) && (
                  <span style={{ flexShrink: 0, padding: "3px 8px", borderRadius: 6, fontSize: 9, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase",
                    background: (milMode === 'fit' || isBaseBuild) ? "rgba(16,185,129,0.12)" : isPostAssess ? "rgba(16,185,129,0.12)" : isCalibration ? "rgba(245,158,11,0.15)" : isDeload ? "rgba(16,185,129,0.12)" : "rgba(var(--accent-rgb),0.15)",
                    color: (milMode === 'fit' || isBaseBuild) ? C.emerald : isPostAssess ? C.emerald : isCalibration ? "#f59e0b" : isDeload ? C.emerald : "var(--accent)",
                  }}>
                    {milMode === 'fit' ? "Fit target" : isBaseBuild ? "Base build" : isPostAssess ? "Open" : isCalibration ? "On-ramp" : isDeload ? "Deload" : "Taper"}
                  </span>
                )}
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
            <Glass style={{ padding: "14px 20px", marginBottom: 16, display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: C.emeraldDim, border: `1px solid ${C.emeraldBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: C.emerald, fontSize: 20 }}>🏃</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", color: C.muted, textTransform: "uppercase", marginBottom: 2 }}>Run Coach</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: C.text }}>{rc.target_km}km Plan · Week {rc.week ?? 1} of {totalWeeks}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>Session {rc.session_in_week ?? 0} of 3 this week</div>
              </div>
              {canExportRunTcx && (
                <button
                  onClick={() => {
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
              <Glass style={{ padding: "14px 20px", marginBottom: 16, display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: C.emeraldDim, border: `1px solid ${C.emeraldBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: C.emerald, fontSize: 20 }}>🏃</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", color: C.muted, textTransform: "uppercase", marginBottom: 2 }}>Cycle Coach — Cross-Training</div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: C.text }}>Run · Level {level}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{cc.run_sessions_total ?? 0} cross-training runs completed</div>
                </div>
                {canExportCrossRunTcx && (
                  <button
                    onClick={() => {
                      const tcx = generateRunningTcx(plan?.session_name ?? 'Cross-Training Run', crossRunSteps, cc.max_hr ?? 180);
                      triggerFileDownload(tcx, `cross_run_level_${level}_${dateStr}.tcx`, 'application/vnd.garmin.tcx+xml');
                    }}
                    style={btnStyle}
                  >
                    ↓ TCX
                  </button>
                )}
              </Glass>
            );
          }

          const todaySessionType = plan?.cycling_program?.session_type ?? null;
          const sessionTypeLabel = todaySessionType
            ? { 'Zone 2': 'Zone 2 — aerobic base', 'Sweet Spot': 'Sweet Spot — sub-threshold', 'Threshold': 'Threshold — FTP work', 'VO2max': 'VO2max — high intensity', 'Anaerobic': 'Anaerobic — sprint power', 'Intervals': 'Intervals — power development' }[todaySessionType] ?? todaySessionType
            : null;
          const cycStep = plan?.steps?.find(s => typeof s.exercise_id === 'string' && s.exercise_id.startsWith('cycling_coach_'));
          const canExportTcx = !!(cycStep?.intervals_json);
          return (
            <Glass style={{ padding: "14px 20px", marginBottom: 16, display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: C.emeraldDim, border: `1px solid ${C.emeraldBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: C.emerald, fontSize: 20 }}>🚴</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", color: C.muted, textTransform: "uppercase", marginBottom: 2 }}>Cycle Coach</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: C.text }}>Week {cc.week ?? 1} · {cc.unit === 'hr' ? 'HR-based' : `FTP ${cc.ftp_watts ?? 200}W`}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>Session {cc.session_in_week ?? 0} of {cc.cycling_days_per_week ?? 3} this week</div>
                {sessionTypeLabel && (
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>Today: {sessionTypeLabel}</div>
                )}
              </div>
              {canExportTcx && (() => {
                const intervals = JSON.parse(cycStep.intervals_json);
                const ftpW = cc.unit !== 'hr' ? (cc.ftp_watts ?? 200) : null;
                const hrMax = cc.unit === 'hr' ? (cc.max_hr ?? 180) : null;
                const slug = cycStep.name.replace(/[^a-z0-9]+/gi, '_').toLowerCase();
                const dateStr = new Date().toISOString().slice(0, 10);
                const btnStyle = { flexShrink: 0, padding: "6px 10px", borderRadius: 8, fontSize: 10, fontWeight: 800, cursor: "pointer", border: `1px solid ${C.emeraldBorder}`, background: C.emeraldDim, color: C.emerald, whiteSpace: "nowrap" };
                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: 5, flexShrink: 0 }}>
                    <button onClick={() => triggerFileDownload(generateCyclingTcx(cycStep.name, intervals, ftpW, hrMax), `${slug}_${dateStr}.tcx`, 'application/vnd.garmin.tcx+xml')} style={btnStyle}>↓ TCX</button>
                    <button onClick={() => triggerFileDownload(generateZwoFile(cycStep.name, intervals, ftpW), `${slug}_${dateStr}.zwo`, 'application/xml')} style={btnStyle}>↓ ZWO</button>
                    <button onClick={() => triggerFileDownload(generateErgFile(cycStep.name, intervals, ftpW), `${slug}_${dateStr}.erg`, 'text/plain')} style={btnStyle}>↓ ERG</button>
                  </div>
                );
              })()}
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
                <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", color: C.muted, textTransform: "uppercase", marginBottom: 2 }}>Training goal</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: C.text }}>{goal.label}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{GOAL_FOCUS[goal.value] ?? 'Consistent daily movement'}</div>
              </div>
            </div>
            <span style={{ padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, color: C.muted }}>
              {exp.label}
            </span>
          </Glass>
        );
      })()}

      {/* ── Weekly grid ─────────────────────────────── */}
      <Glass style={{ padding: "16px 20px", marginBottom: 16 }}>
        <div style={{ ...eyebrow, color: C.faint, marginBottom: 12 }}>THIS WEEK</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => {
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
                  {status === "today" && <Icons.bolt size={14} c="#000" filled />}
                </div>
              </div>
            );
          })}
        </div>
      </Glass>

      {/* ── Weekly outcome summary ──────────────────── */}
      <Glass style={{ padding: "14px 20px", marginBottom: 16, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ ...eyebrow, fontSize: 9.5, color: C.muted, marginBottom: 6 }}>This week</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text, lineHeight: 1.4 }}>{weekSummary.message}</div>
        </div>
        <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
          {Array.from({ length: weekSummary.target }).map((_, i) => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: i < weekSummary.done ? "var(--accent)" : "rgba(var(--accent-rgb),0.15)", border: i < weekSummary.done ? "none" : "1px solid rgba(var(--accent-rgb),0.3)" }} />
          ))}
        </div>
      </Glass>

    </div>
  );
}

// ─── WORKOUT VIEW ─────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  {
    id: "today",
    label: "Today",
    icon: (a) => (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke={a ? "var(--accent)" : "#64748b"}
        strokeWidth="2"
      >
        <rect width="18" height="18" x="3" y="4" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <path d="m9 16 2 2 4-4" />
      </svg>
    ),
  },
  {
    id: "plan",
    label: "Plan",
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? "var(--accent)" : "#64748b"} strokeWidth="2">
        <rect width="18" height="18" x="3" y="4" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <line x1="7" y1="15" x2="17" y2="15" />
      </svg>
    ),
  },
  {
    id: "history",
    label: "Progress",
    icon: (a) => <Icons.chart size={22} c={a ? "var(--accent)" : "#64748b"} />,
  },
  {
    id: "awards",
    label: "Awards",
    icon: (a) => (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke={a ? "var(--accent)" : "#64748b"}
        strokeWidth="2"
      >
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
      </svg>
    ),
  },
  {
    id: "settings",
    label: "Settings",
    icon: (a) => (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke={a ? "var(--accent)" : "#64748b"}
        strokeWidth="2"
      >
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
];

function Nav({ view, setView }) {
  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "rgba(2,6,23,0.92)",
        borderTop: `1px solid ${C.border}`,
        backdropFilter: "blur(20px)",
        zIndex: 50,
        paddingBottom: "max(16px, env(safe-area-inset-bottom))",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          padding: "10px 8px 0",
          maxWidth: 600,
          margin: "0 auto",
        }}
      >
        {NAV_ITEMS.map((item) => {
          const active = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 5,
                padding: "8px 16px",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              {item.icon(active)}
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 900,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: active ? C.emerald : C.muted,
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const userId = getUserId();
  const token = getToken();
  // Namespace user-scoped localStorage keys so multiple accounts on one device don't share state
  const uKey = (k) => userId ? `${k}_${userId}` : k;

  useEffect(() => {
    if (!userId || !token) {
      reportError('auth_failure', 'missing session on app load');
      window.location.href = "/login.html";
    }
    // userId and token are read from localStorage at render time (not React state).
    // They are session-stable; the page reloads on logout so this is safe as mount-only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (document.getElementById("jf-fonts")) return;
    const l = document.createElement("link");
    l.id = "jf-fonts";
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700;800;900&family=Inter+Tight:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap";
    document.head.appendChild(l);
  }, []);

  const today = new Date().toISOString().split("T")[0];

  const [view, setView] = useState("today");
  const [inWorkout, setInWorkout] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [plan, setPlan] = useState(null);
  const [planError, setPlanError] = useState(null);
  const [score, setScore] = useState(0);
  const [prevScore, setPrevScore] = useState(0);
  const [history, setHistory] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progression, setProgression] = useState(null);
  const [isLoadingProgression, setIsLoadingProgression] = useState(false);
  const [cyclingPmc, setCyclingPmc] = useState(null);
  const [ftpSnoozedUntil, setFtpSnoozedUntil] = useState(() =>
    parseInt(localStorage.getItem(uKey('jf_ftp_snooze_until')) || localStorage.getItem('jf_ftp_snooze_until') || '0')
  );

  // No-email banner: shown when user has no email set (guest or registered without email)
  const hasEmail = !!(getJwtPayload(token)?.email);
  const [emailBannerDismissed, setEmailBannerDismissed] = useState(() => {
    const ts = parseInt(localStorage.getItem(uKey('jf_email_banner_dismissed')) || localStorage.getItem('jf_email_banner_dismissed') || '0');
    return ts > Date.now() - 24 * 60 * 60 * 1000;
  });

  // Post-workout state
  const [todayCompleted, setTodayCompleted] = useState(
    () => localStorage.getItem(`jf_completed_${today}`) === "1"
  );
  const [completedSession, setCompletedSession] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`jf_completed_session_${today}`) || "null"); }
    catch { return null; }
  });
  const [bonusDone, setBonusDone] = useState(
    () => localStorage.getItem(`jf_bonus_${today}`) === "1"
  );
  const [showBonusPicker, setShowBonusPicker] = useState(false);
  const [showLogActivity, setShowLogActivity] = useState(false);
  const [activityToast, setActivityToast] = useState("");
  const [showWhyNot, setShowWhyNot] = useState(false);
  const [inBonusWorkout, setInBonusWorkout] = useState(false);
  const [bonusPlan, setBonusPlan] = useState(null);

  // Cooper test modal (shown after military cooper_test session completes)
  const [showCooperModal, setShowCooperModal] = useState(false);
  const [cooperPending, setCooperPending] = useState(null); // { durationSec, perceivedExertion, stepsActual }
  const [cooperDistance, setCooperDistance] = useState("");

  // Terms acceptance gate (shown to existing users who haven't accepted current policy version)
  const [needsTermsGate, setNeedsTermsGate] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsAccepting, setTermsAccepting] = useState(false);
  const [termsAcceptError, setTermsAcceptError] = useState(null);

  // Path choice (shown after first onboarding OR for existing users without primary_intent)
  const [showPathChoice, setShowPathChoice] = useState(false);

  // Onboarding flow
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingReady, setOnboardingReady] = useState(false);
  const [prefs, setPrefs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("jf_prefs") || "{}");
    } catch {
      return {};
    }
  });

  // Captures checkin_mode and isPro from server before setting onboardingReady —
  // avoids stale prefs closure in the check-in effect without making it re-trigger on prefs changes.
  const checkinModeRef = useRef(null);
  const isProRef = useRef(prefs.isPro ?? false);
  useEffect(() => { isProRef.current = prefs.isPro ?? false; }, [prefs.isPro]);
  const [lastCheckin, setLastCheckin] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem("jf_prefs", JSON.stringify(prefs));
    } catch { /* ignore */ }
  }, [prefs]);

  // After profile load: apply prefs and advance to ready state
  function handleProfileLoaded(data) {
    // Apply accent from server if present
    if (data.preferences?.accent) {
      localStorage.setItem("jf_accent", data.preferences.accent);
      applyAccent(data.preferences.accent);
    }
    setPrefs((p) => ({
      ...p, ...data, exists: undefined,
      isPro: data.preferences?.isPro ?? p.isPro ?? false,
      daily_replan: data.preferences?.daily_replan ?? p.daily_replan ?? false,
    }));
    // Pin mode and isPro before setting onboardingReady so the check-in effect reads fresh data
    checkinModeRef.current = data.preferences?.checkin_mode ?? "once_a_day";
    isProRef.current = data.preferences?.isPro ?? false;
    // Fetch last check-in to pre-fill next check-in modal
    api.getLastCheckin(userId).then(setLastCheckin).catch(() => {});
    // Show terms gate if this user hasn't accepted the current policy version yet
    if (data.needsTermsAcceptance) {
      setNeedsTermsGate(true);
    }
    // Show path choice for users who haven't set a primary_intent yet
    if (!data.preferences?.primary_intent) {
      setShowPathChoice(true);
    }
    setOnboardingReady(true);
  }

  // Cross-tab session sync: if another tab clears jf_token (logout), follow immediately
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'jf_token' && !e.newValue) logout();
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // On mount: handle email_verified / email_changed / Strava OAuth callback redirect params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("email_verified")) {
      setActivityToast("Email verified ✓");
      setTimeout(() => setActivityToast(""), 4000);
      window.history.replaceState({}, "", "/");
    } else if (params.get("email_changed")) {
      setActivityToast("Email address updated ✓");
      setTimeout(() => setActivityToast(""), 4000);
      setPrefs((p) => ({ ...p, email_verified: true }));
      window.history.replaceState({}, "", "/");
    } else if (params.get("verify_error")) {
      setActivityToast("Verification link invalid or expired");
      setTimeout(() => setActivityToast(""), 5000);
      window.history.replaceState({}, "", "/");
    } else if (params.get("code") && params.get("scope")?.includes("activity")) {
      // Strava OAuth callback: exchange code for tokens
      const code  = params.get("code");
      const state = params.get("state");
      window.history.replaceState({}, "", "/");
      const t = getToken();
      if (t) {
        fetch("/api/strava-auth", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
          body: JSON.stringify({ code, state }),
        })
          .then(r => r.json())
          .then(d => {
            if (d.ok) {
              const name = d.athlete_name ? ` · ${d.athlete_name}` : "";
              setActivityToast(`Strava connected${name} ✓`);
            } else {
              setActivityToast("Strava connection failed — try again");
            }
            setTimeout(() => setActivityToast(""), 5000);
          })
          .catch(() => {
            setActivityToast("Strava connection failed — try again");
            setTimeout(() => setActivityToast(""), 5000);
          });
      }
    }
  }, []);

  // On mount: load profile → decide full onboarding vs daily flow
  useEffect(() => {
    if (!userId || !token) return;
    api.getProfile(token).then((data) => {
      if (!data.exists) {
        // First-time user
        setShowOnboarding(true);
        return;
      }
      // Inactivity >= 90 days → full re-onboarding
      // Null last_activity_at_ms means the account exists but has no recorded activity yet
      // (e.g. just signed up, or the timestamp wasn't stamped). Do NOT treat null as inactive.
      const lastMs = data.last_activity_at_ms;
      const daysSince = lastMs ? Math.floor((Date.now() - lastMs) / 86_400_000) : 0;
      if (lastMs && daysSince >= 90) {
        setShowOnboarding(true);
        return;
      }
      handleProfileLoaded(data);
    }).catch(() => setOnboardingReady(true));
    // handleProfileLoaded, token, and userId are session-stable: not React state,
    // designed to run once on mount (page reloads on auth changes).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    // Fetch fresh profile before advancing — ensures checkin_mode and all prefs are server-accurate
    api.getProfile(token).then((data) => {
      if (data?.exists) {
        setPrefs({ ...data, exists: undefined });
        checkinModeRef.current = data.preferences?.checkin_mode ?? "once_a_day";
        isProRef.current = data.preferences?.isPro ?? false;
      } else {
        checkinModeRef.current = "once_a_day";
      }
      if (data?.exists && !data.preferences?.primary_intent) {
        setShowPathChoice(true);
      }
      api.getLastCheckin(userId).then(setLastCheckin).catch(() => {});
    }).catch(() => {
      checkinModeRef.current = "once_a_day";
    }).finally(() => {
      setOnboardingReady(true); // triggers score/history/check-in effects after prefs are loaded
    });
  };

  const handlePathChoiceComplete = (intent) => {
    setShowPathChoice(false);
    setPrefs(p => ({ ...p, preferences: { ...(p.preferences ?? {}), primary_intent: intent } }));
  };

  // Load score, history, and progression from API on mount (only after onboarding done)
  useEffect(() => {
    if (!onboardingReady) return;
    api
      .getScore(userId)
      .then(setScore)
      .catch(() => {});
    setIsLoadingProgression(true);
    api
      .getProgression(token)
      .then((data) => { if (data?.ok) setProgression(data); })
      .catch(() => {})
      .finally(() => setIsLoadingProgression(false));
    api
      .getCyclingPmc(token)
      .then((data) => { if (data?.ok) setCyclingPmc(data); })
      .catch(() => {});
    api
      .getHistory(userId)
      .then((h) => {
        setHistory(h);
        // Reconcile completed state against server history (handles cross-device sync)
        const todayExecutions = h.filter((ex) => ex.date === today);
        const hasToday = todayExecutions.length > 0;
        if (!hasToday) {
          // Completed on no device — clear local state
          setTodayCompleted(false);
          setCompletedSession(null);
          localStorage.removeItem(`jf_completed_${today}`);
          localStorage.removeItem(`jf_completed_session_${today}`);
          setBonusDone(false);
          localStorage.removeItem(`jf_bonus_${today}`);
        } else {
          // Completed on some device — mark done on this device too
          const mainSession = todayExecutions.find((ex) => ex.execution_type !== "bonus") ?? todayExecutions[0];
          const bonusSession = todayExecutions.find((ex) => ex.execution_type === "bonus");
          setTodayCompleted(true);
          localStorage.setItem(`jf_completed_${today}`, "1");
          if (mainSession && !localStorage.getItem(`jf_completed_session_${today}`)) {
            const reconstructed = {
              name: mainSession.execution_type ?? "Session",
              duration_sec: mainSession.total_duration_sec ?? 0,
            };
            setCompletedSession(reconstructed);
            localStorage.setItem(`jf_completed_session_${today}`, JSON.stringify(reconstructed));
          }
          if (bonusSession) {
            setBonusDone(true);
            localStorage.setItem(`jf_bonus_${today}`, "1");
          }
        }
      })
      .catch(() => {});
  }, [userId, onboardingReady, today, token]);

  // Auto-sync Strava on app open (30-min cooldown via localStorage)
  useEffect(() => {
    if (!onboardingReady) return;
    const COOLDOWN_MS = 30 * 60 * 1000;
    const lastSync = parseInt(localStorage.getItem(uKey('jf_strava_auto_sync')) || localStorage.getItem('jf_strava_auto_sync') || '0');
    if (Date.now() - lastSync < COOLDOWN_MS) return;
    // Fire-and-forget — check if connected first, then sync
    fetch('/api/strava-auth', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d?.connection) return;
        localStorage.setItem(uKey('jf_strava_auto_sync'), String(Date.now()));
        return fetch('/api/strava-sync', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      })
      .catch(() => {});
  // token and uKey are session-stable (derived from localStorage, not React state);
  // re-running on token change is unnecessary and would break the 30-min cooldown logic.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onboardingReady]);

  // Show check-in based on mode; if check-in won't be shown, load or generate today's plan
  useEffect(() => {
    if (!onboardingReady) return;
    // checkinModeRef and isProRef are set in handleProfileLoaded before onboardingReady is set —
    // avoids stale closure without making this effect re-trigger on every prefs change.
    const mode = checkinModeRef.current ?? "once_a_day";
    const alreadyCheckedInToday = localStorage.getItem("jf_checkin_date") === today;
    const willShowCheckIn =
      mode === "every_time" ||
      (mode === "once_a_day" && !alreadyCheckedInToday);

    if (mode === "every_time") {
      setShowCheckIn(true);
    } else if (mode === "once_a_day" && !alreadyCheckedInToday) {
      setShowCheckIn(true);
    }
    // "manual" — never auto-show

    if (!willShowCheckIn) {
      // No check-in modal — load existing plan or generate from settings only
      setIsGenerating(true);
      api.getTodayPlan(userId, today)
        .then((existing) => {
          if (existing) {
            setPlan(existing);
            setIsGenerating(false);
          } else {
            return api.generatePlan(userId, today, null, undefined, isProRef.current)
              .then((p) => { setPlan(p); setPlanError(null); })
              .catch((e) => {
                setPlanError({ code: e.planErrorCode ?? "PLAN-ERR", detail: e.message });
              })
              .finally(() => setIsGenerating(false));
          }
        })
        .catch(() => setIsGenerating(false));
    }
    // today and userId are session-stable (not React state — derived from localStorage/Date at render time)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onboardingReady]);

  const handleCheckIn = useCallback(
    async (data) => {
      setShowCheckIn(false);
      setView("today");
      localStorage.setItem("jf_checkin_date", today);
      setIsGenerating(true);
      try {
        if (data.checkin_json?.period_today && userId) {
          api.logPeriod(userId, today).catch(() => {});
        }
        if (prefs.isPro) {
          // Pro: full daily replanning with check-in data
          const newPlan = await api.generatePlan(userId, today, data, undefined, true);
          setPlan(newPlan); setPlanError(null);
        } else {
          // Free: adapt the existing weekly plan for today's check-in
          // (same exercises, adjusted reps/rest/volume — no full regen)
          api.saveCheckin(userId, today, data).catch(() => {});
          const existing = await api.getTodayPlan(userId, today);
          if (existing) {
            const adapted = await api.adaptPlan(userId, today, data, existing);
            setPlan(adapted); setPlanError(null);
          } else {
            // No plan yet — generate a baseline, then adapt it
            const base = await api.generatePlan(userId, today, null, undefined, false);
            const adapted = await api.adaptPlan(userId, today, data, base);
            setPlan(adapted); setPlanError(null);
          }
        }
      } catch (e) {
        console.error("Plan generation failed:", e);
        reportError('plan_generation', e.planErrorCode ?? e.message ?? 'unknown', token);
        setPlanError({ code: e.planErrorCode ?? "PLAN-ERR", detail: e.message });
      } finally {
        setIsGenerating(false);
      }
    },
    [userId, today, prefs.isPro, token],
  );

  const handleSkipCheckIn = useCallback(async () => {
    setShowCheckIn(false);
    setView("today");
    localStorage.setItem("jf_checkin_date", today);
    setIsGenerating(true);
    try {
      const newPlan = await api.generatePlan(userId, today, null, undefined, prefs.isPro);
      setPlan(newPlan); setPlanError(null);
    } catch (e) {
      console.error("Plan generation failed:", e);
      reportError('plan_generation', e.planErrorCode ?? e.message ?? 'unknown', token);
      setPlanError({ code: e.planErrorCode ?? "PLAN-ERR", detail: e.message });
    } finally {
      setIsGenerating(false);
    }
  }, [userId, today, prefs.isPro, token]);

  const handleRetryPlan = useCallback(async () => {
    setPlanError(null);
    setIsGenerating(true);
    try {
      const newPlan = await api.generatePlan(userId, today, null, undefined, prefs.isPro);
      setPlan(newPlan);
    } catch (e) {
      console.error("Plan retry failed:", e);
      setPlanError({ code: e.planErrorCode ?? "PLAN-ERR", detail: e.message });
    } finally {
      setIsGenerating(false);
    }
  }, [userId, today, prefs.isPro]);

  // Save areas from check-in "Ongoing issue" button → profile chronic_injury_areas
  const handleMarkChronic = useCallback((areas) => {
    const current = prefs.preferences?.chronic_injury_areas ?? [];
    const merged  = [...new Set([...current, ...areas])];
    const newPrefs = { ...(prefs.preferences ?? {}), chronic_injury_areas: merged };
    api.saveProfile(token, { preferences: newPrefs })
      .then(() => {
        setPrefs(p => ({ ...p, preferences: newPrefs }));
        Object.keys(sessionStorage).filter(k => k.startsWith('jf_upcoming')).forEach(k => sessionStorage.removeItem(k));
      })
      .catch(() => {});
  }, [prefs.preferences, token]);

  const handleComplete = useCallback(
    async (durationSec, perceivedExertion, stepsActual) => {
      // Cooper test: pause and ask for distance before saving
      if (plan?.military_program?.session_type === 'cooper_test') {
        setCooperPending({ durationSec, perceivedExertion, stepsActual });
        setCooperDistance("");
        setShowCooperModal(true);
        setInWorkout(false);
        setView("today");
        return;
      }
      try {
        const mergedSteps = (stepsActual ?? plan?.steps ?? []);
        const isMilSession = !!(plan?.military_program);
        const sessionType = plan?.cross_training_run ? "cycling_cross_run"
          : plan?.cycling_program ? "cycling_coach"
          : plan?.run_program ? "run_coach"
          : "workout";
        await api.saveExecution(
          userId,
          plan?.id,
          today,
          mergedSteps,
          durationSec,
          perceivedExertion,
          sessionType,
          isMilSession ? "military" : null,
        );
        const [newScore, newHistory] = await Promise.all([
          api.getScore(),
          api.getHistory(),
        ]);
        setPrevScore(score);
        setScore(newScore);
        setHistory(newHistory);
        // Mark today as completed
        setTodayCompleted(true);
        localStorage.setItem(`jf_completed_${today}`, "1");
        const sessionInfo = { name: plan?.session_name, duration_sec: durationSec };
        setCompletedSession(sessionInfo);
        localStorage.setItem(`jf_completed_session_${today}`, JSON.stringify(sessionInfo));
      } catch (e) {
        console.error("Failed to save execution:", e);
      }
      setInWorkout(false);
      setView("today");
    },
    [userId, plan, today, score],
  );

  const handleCooperSubmit = useCallback(
    async (distanceM) => {
      setShowCooperModal(false);
      setCooperPending(null);
      if (!cooperPending) {
        // Standalone entry from Settings — just persist the benchmark distance
        if (!distanceM || distanceM <= 0) return;
        const mil = prefs?.preferences?.military_coach ?? {};
        const updated = { ...mil, last_cooper_distance_m: distanceM, last_cooper_at_ms: Date.now() };
        try {
          const result = await api.saveProfile(token, { preferences: { ...prefs?.preferences, military_coach: updated } });
          if (result?.ok !== false) setPrefs(p => ({ ...p, preferences: { ...(p?.preferences ?? {}), military_coach: updated } }));
        } catch (e) {
          console.error("Failed to save Cooper benchmark:", e);
        }
        return;
      }
      const { durationSec, perceivedExertion, stepsActual } = cooperPending;
      // Inject cooper_distance_m into the first step's actual_json
      const enriched = (stepsActual ?? plan?.steps ?? []).map((s, i) =>
        i === 0 ? { ...s, actual: { ...(s.actual ?? {}), cooper_distance_m: distanceM } } : s
      );
      try {
        await api.saveExecution(userId, plan?.id, today, enriched, durationSec, perceivedExertion, "workout", "military");
        const [newScore, newHistory] = await Promise.all([api.getScore(), api.getHistory()]);
        setPrevScore(score);
        setScore(newScore);
        setHistory(newHistory);
        setTodayCompleted(true);
        localStorage.setItem(`jf_completed_${today}`, "1");
        const sessionInfo = { name: plan?.session_name, duration_sec: durationSec };
        setCompletedSession(sessionInfo);
        localStorage.setItem(`jf_completed_session_${today}`, JSON.stringify(sessionInfo));
      } catch (e) {
        console.error("Failed to save Cooper execution:", e);
      }
    },
    [cooperPending, userId, plan, today, score, token, prefs],
  );

  const handleBonusComplete = useCallback(
    async (durationSec, perceivedExertion, stepsActual) => {
      try {
        const mergedSteps = stepsActual ?? bonusPlan?.steps ?? [];
        await api.saveExecution(userId, bonusPlan?.id, today, mergedSteps, durationSec, perceivedExertion, "bonus");
        const [newScore, newHistory] = await Promise.all([
          api.getScore(),
          api.getHistory(),
        ]);
        setScore(newScore);
        setHistory(newHistory);
        setBonusDone(true);
        localStorage.setItem(`jf_bonus_${today}`, "1");
        setActivityToast("Double session! 🔥");
        setTimeout(() => setActivityToast(""), 3000);
      } catch (e) {
        console.error("Failed to save bonus execution:", e);
      }
      setInBonusWorkout(false);
      setBonusPlan(null);
    },
    [userId, bonusPlan, today],
  );

  const handleDeleteExecution = useCallback(
    async (executionId) => {
      const targetExec = history.find((h) => h.id === executionId);
      const isToday = targetExec?.date === today;
      setHistory((prev) => prev.filter((h) => h.id !== executionId));
      await api.deleteExecution(executionId);
      const newScore = await api.getScore();
      setScore(newScore);
      if (isToday) {
        const remainingToday = history.filter((h) => h.id !== executionId && h.date === today);
        if (remainingToday.length === 0) {
          setTodayCompleted(false);
          setCompletedSession(null);
          localStorage.removeItem(`jf_completed_${today}`);
          localStorage.removeItem(`jf_completed_session_${today}`);
          setBonusDone(false);
          localStorage.removeItem(`jf_bonus_${today}`);
        }
      }
    },
    [history, today],
  );

  const handleBonusSelect = useCallback(
    async (minutes) => {
      setShowBonusPicker(false);
      setIsGenerating(true);
      try {
        const completedIds = (plan?.steps ?? []).map((s) => s.exercise_id).filter(Boolean);
        const bp = await api.generateBonusPlan(userId, today, minutes, completedIds);
        setBonusPlan(bp);
        setInBonusWorkout(true);
      } catch (e) {
        console.error("Bonus plan failed:", e);
        setActivityToast("Couldn't start bonus session — try again");
        setTimeout(() => setActivityToast(""), 3000);
      } finally {
        setIsGenerating(false);
      }
    },
    [userId, today, plan],
  );

  const handleLogActivity = useCallback(
    async (executionType, durationMin) => {
      setShowLogActivity(false);
      try {
        await api.saveActivity(userId, today, executionType, durationMin * 60);
        const [newScore, newHistory] = await Promise.all([
          api.getScore(),
          api.getHistory(),
        ]);
        setScore(newScore);
        setHistory(newHistory);
        setActivityToast("Activity logged ✓");
        setTimeout(() => setActivityToast(""), 3000);
      } catch (e) {
        console.error("Failed to log activity:", e);
      }
    },
    [userId, today],
  );

  const handleWhyNotRegen = useCallback(
    async (checkinOverride) => {
      setShowWhyNot(false);
      setIsGenerating(true);
      try {
        const newPlan = await api.generatePlan(userId, today, checkinOverride, undefined, prefs.isPro);
        setPlan(newPlan); setPlanError(null);
      } catch (e) {
        console.error("Plan regen failed:", e);
        setPlanError({ code: e.planErrorCode ?? "PLAN-ERR", detail: e.message });
      } finally {
        setIsGenerating(false);
      }
    },
    [userId, today, prefs.isPro],
  );

  const handleRestDay = useCallback(async () => {
    setShowWhyNot(false);
    try {
      await api.saveActivity(userId, today, "recovery", 0);
      const [newScore, newHistory] = await Promise.all([
        api.getScore(),
        api.getHistory(),
      ]);
      setScore(newScore);
      setHistory(newHistory);
      setTodayCompleted(true);
      localStorage.setItem(`jf_completed_${today}`, "1");
      setCompletedSession({ name: "Rest Day", duration_sec: 0 });
      localStorage.setItem(`jf_completed_session_${today}`, JSON.stringify({ name: "Rest Day", duration_sec: 0 }));
    } catch (e) {
      console.error("Failed to log rest day:", e);
    }
  }, [userId, today]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        color: C.text,
        fontFamily: "-apple-system, 'Helvetica Neue', Arial, sans-serif",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes tapScale { 0%{transform:scale(1)} 40%{transform:scale(0.96)} 100%{transform:scale(1)} }
        @keyframes tapRing { 0%{opacity:0.7;transform:scale(1)} 100%{opacity:0;transform:scale(1.18)} }
        ::-webkit-scrollbar { width: 0; }
        textarea { font-family: inherit; color: inherit; }
        button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
      `}</style>

      <div
        style={{ maxWidth: 760, margin: "0 auto", padding: "max(40px, calc(env(safe-area-inset-top) + 16px)) 20px 120px" }}
      >
        {!inWorkout && (
          <header
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 44,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <svg width="38" height="38" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" style={{ filter: "drop-shadow(0 4px 20px rgba(var(--accent-rgb),0.3))", flexShrink: 0 }}>
                <rect x="28" y="28" width="968" height="968" rx="180" fill="var(--accent)"/>
                {/* Outer hexagon */}
                <path d="M 512 132 L 841 322 L 841 702 L 512 892 L 183 702 L 183 322 Z" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="28" strokeLinejoin="round"/>
                {/* Inner web rings — solid */}
                <path d="M 512 277 L 716 395 L 716 630 L 512 747 L 308 630 L 308 395 Z" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="14" strokeLinejoin="round"/>
                <path d="M 512 387 L 620 450 L 620 575 L 512 637 L 404 575 L 404 450 Z" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="12" strokeLinejoin="round"/>
                {/* S-curve route */}
                <path d="M 308 630 C 580 590, 620 470, 480 420 C 360 380, 460 315, 512 294" fill="none" stroke="white" strokeWidth="44" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="512" cy="294" r="32" fill="white"/>
                {/* Pole + filled flag */}
                <path d="M 512 294 L 512 172" stroke="white" strokeWidth="30" strokeLinecap="round"/>
                <path d="M 512 176 L 626 176 C 608 200, 608 226, 626 250 L 512 250 Z" fill="white" stroke="white" strokeWidth="8" strokeLinejoin="round"/>
              </svg>
              <span
                style={{
                  fontWeight: 900,
                  fontSize: 18,
                  letterSpacing: "-0.02em",
                }}
              >
                JustFit<span style={{ color: C.emerald }}>.cc</span>
              </span>
            </div>
            {view === "settings" ? (
              <button
                onClick={() => setShowSignOutConfirm(true)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "9px 16px", borderRadius: 14, fontSize: 12, fontWeight: 900,
                  letterSpacing: "0.06em", textTransform: "uppercase",
                  background: "rgba(226,76,74,0.08)", border: "1px solid rgba(226,76,74,0.25)",
                  color: "#f87171", cursor: "pointer",
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign out
              </button>
            ) : (
              <button
                onClick={() => setShowCheckIn(true)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "9px 18px", borderRadius: 14, fontSize: 12, fontWeight: 900,
                  letterSpacing: "0.06em", textTransform: "uppercase",
                  background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`,
                  color: C.muted, cursor: "pointer",
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.emerald} strokeWidth="2.5">
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                  <path d="M19 3v4" />
                  <path d="M21 5h-4" />
                </svg>
                Recalibrate
              </button>
            )}
          </header>
        )}

        {inBonusWorkout && bonusPlan ? (
          <WorkoutView
            plan={bonusPlan ? { ...bonusPlan, experience_level: prefs.experience_level ?? bonusPlan.experience_level } : bonusPlan}
            onComplete={handleBonusComplete}
            onBack={() => { setInBonusWorkout(false); setBonusPlan(null); }}
            cycle={prefs.cycle}
            prefs={prefs}
          />
        ) : inWorkout ? (
          <WorkoutView
            plan={plan ? { ...plan, experience_level: prefs.experience_level ?? plan.experience_level } : plan}
            onComplete={handleComplete}
            onBack={() => setInWorkout(false)}
            cycle={prefs.cycle}
            prefs={prefs}
          />
        ) : (
          <>
            {view === "today" && (
              <>
                <PregnancyProgressBanner cycle={prefs.cycle} />
                {!hasEmail && !emailBannerDismissed && (
                  <div style={{ margin: "0 0 16px", padding: "12px 16px", borderRadius: 16, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)", display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>⚠</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#f59e0b" }}>Add your email to keep your data</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Without email, you can't log back in when your session expires.</div>
                    </div>
                    <button onClick={() => setView("settings")} style={{ padding: "6px 12px", borderRadius: 10, border: "1px solid rgba(245,158,11,0.4)", background: "rgba(245,158,11,0.1)", color: "#f59e0b", fontWeight: 800, fontSize: 11, cursor: "pointer", flexShrink: 0, fontFamily: "inherit" }}>
                      Add →
                    </button>
                    <button onClick={() => { setEmailBannerDismissed(true); localStorage.setItem(uKey('jf_email_banner_dismissed'), String(Date.now())); }} style={{ padding: "4px 8px", borderRadius: 8, border: "none", background: "transparent", color: C.muted, fontSize: 20, cursor: "pointer", lineHeight: 1, fontFamily: "inherit" }}>
                      ×
                    </button>
                  </div>
                )}
                <Dashboard
                  plan={plan}
                  score={score}
                  prevScore={prevScore}
                  onStartWorkout={() => setInWorkout(true)}
                  isGenerating={isGenerating}
                  todayCompleted={todayCompleted}
                  completedSession={completedSession}
                  bonusDone={bonusDone}
                  onLogActivity={() => setShowLogActivity(true)}
                  onBonusSession={() => setShowBonusPicker(true)}
                  onWhyNot={() => setShowWhyNot(true)}
                  prefs={prefs}
                  planError={planError}
                  onRetryPlan={handleRetryPlan}
                  token={token}
                  history={history}
                  onNavigateProgress={() => setView('history')}
                  cycle={prefs.cycle}
                />
              </>
            )}
            {view === "plan" && (
              <PlanWeekView history={history} plan={plan} userId={userId} onDeleteExecution={handleDeleteExecution} prefs={prefs} />
            )}
            {view === "history" && (
              <HistoryView
                progression={progression}
                cyclingPmc={cyclingPmc}
                isLoading={isLoadingProgression}
                token={token}
                prefs={prefs}
                onProgressionUpdate={(updated) => setProgression(updated)}
                history={history}
                plan={plan}
                setView={setView}
                ftpSnoozedUntil={ftpSnoozedUntil}
                setFtpSnoozedUntil={setFtpSnoozedUntil}
              />
            )}
            {view === "awards" && (
              <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: "var(--accent)", fontSize: 14 }}>Loading…</div>}>
                <AwardsView
                  history={history}
                  score={score}
                  isPro={!!prefs.isPro}
                  progression={progression}
                  runUnlocked={prefs.preferences?.run_coach?.unlocked_targets ?? []}
                />
              </Suspense>
            )}
            {view === "settings" && (
              <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: "var(--accent)", fontSize: 14 }}>Loading…</div>}>
                <SettingsView
                  prefs={prefs}
                  onUpdate={setPrefs}
                  userId={userId}
                  token={token}
                  onRedoOnboarding={() => setShowOnboarding(true)}
                  onChangePath={() => setShowPathChoice(true)}
                  onOpenCooperModal={() => setShowCooperModal(true)}
                  onProgressionRefresh={() =>
                    api.getProgression(token)
                      .then((data) => { if (data?.ok) setProgression(data); })
                      .catch(() => {})
                  }
                />
              </Suspense>
            )}
          </>
        )}
      </div>

      {!inWorkout && <Nav view={view} setView={setView} />}

      {showSignOutConfirm && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "rgba(2,6,23,0.85)" }}
          onClick={() => setShowSignOutConfirm(false)}
        >
          <div
            style={{ width: "100%", maxWidth: 320, background: "#0f172a", border: `1px solid ${C.border}`, borderRadius: 20, padding: 28, display: "flex", flexDirection: "column", gap: 20 }}
            onClick={e => e.stopPropagation()}
          >
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: C.text, marginBottom: 8 }}>Sign out?</div>
              <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.6 }}>Your plan and progress are saved. See you next time.</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                onClick={() => setShowSignOutConfirm(false)}
                style={{ width: "100%", padding: "13px 0", borderRadius: 14, border: `1px solid ${C.emeraldBorder}`, background: C.emeraldDim, color: C.emerald, fontWeight: 900, fontSize: 14, cursor: "pointer" }}
              >
                Return sporting
              </button>
              <button
                onClick={() => { setShowSignOutConfirm(false); logout(); }}
                style={{ width: "100%", padding: "13px 0", borderRadius: 14, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.03)", color: C.muted, fontWeight: 900, fontSize: 14, cursor: "pointer" }}
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {showCheckIn && (
        <CheckInModal
          onSave={handleCheckIn}
          onClose={handleSkipCheckIn}
          isPro={!!prefs.isPro}
          sex={prefs.sex}
          cycle={prefs.cycle}
          defaultTimeBudget={(() => {
            const fallback = prefs.session_duration_min ?? 45;
            if (prefs.preferences?.schedule_advanced) {
              const dayKey = ['sun','mon','tue','wed','thu','fri','sat'][new Date().getDay()];
              const scheduled = prefs.preferences?.weekly_schedule?.[dayKey];
              return (scheduled != null && scheduled > 0) ? scheduled : fallback;
            }
            return fallback;
          })()}
          lastCheckin={lastCheckin}
          onMarkChronic={handleMarkChronic}
        />
      )}

      {showOnboarding && (
        <OnboardingModal token={token} onComplete={handleOnboardingComplete} onBack={logout} />
      )}

      {showPathChoice && (
        <PathChoiceModal token={token} onComplete={handlePathChoiceComplete} />
      )}

      {/* ── Terms acceptance gate ─────────────────────────────── */}
      {needsTermsGate && (
        <div style={{ position: "fixed", inset: 0, background: C.bg, zIndex: 80, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ width: "100%", maxWidth: 420, background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 28, padding: 32, boxShadow: "0 40px 100px rgba(0,0,0,0.5)" }}>
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
              <div style={{ width: 36, height: 36, background: C.emerald, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 13, color: "#fff" }}>JF</div>
              <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.02em", color: C.text }}>Just<span style={{ color: C.emerald }}>Fit</span>.cc</div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.12em", color: C.emerald, textTransform: "uppercase", marginBottom: 10 }}>Updated Policies</div>
            <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.02em", color: C.text, marginBottom: 10, lineHeight: 1.2 }}>
              Review &amp; accept our terms
            </h2>
            <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.65, marginBottom: 24 }}>
              We've updated our legal documents. Please review and accept them to continue using JustFit.
            </p>
            {/* Policy links */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
              {[
                { label: "Terms & Conditions", href: "/terms.html" },
                { label: "Disclaimer & Liability Waiver", href: "/disclaimer.html" },
                { label: "Privacy Policy", href: "/privacy.html" },
              ].map(({ label, href }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", borderRadius: 12, background: "rgba(var(--accent-rgb),0.06)", border: `1px solid ${C.emeraldBorder}`, color: C.emerald, fontSize: 13, fontWeight: 800, textDecoration: "none" }}
                >
                  {label}
                  <span style={{ fontSize: 16, opacity: 0.7 }}>↗</span>
                </a>
              ))}
            </div>
            {/* Acceptance checkbox */}
            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 20, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                style={{ width: 18, height: 18, marginTop: 1, flexShrink: 0, accentColor: "#10b981", cursor: "pointer" }}
              />
              <span style={{ fontSize: 13, color: C.muted, lineHeight: 1.55, fontWeight: 500 }}>
                I have read and agree to the Terms &amp; Conditions, Disclaimer &amp; Liability Waiver, and Privacy Policy of JustFit.cc.
              </span>
            </label>
            {/* Accept button */}
            {termsAcceptError && (
              <div style={{ fontSize: 12, color: "#f87171", marginBottom: 10, textAlign: "center" }}>
                {termsAcceptError}{" "}
                <button
                  onClick={() => setTermsAcceptError(null)}
                  style={{ background: "none", border: "none", color: "#f87171", fontWeight: 700, fontSize: 12, cursor: "pointer", textDecoration: "underline", padding: 0 }}
                >
                  Retry
                </button>
              </div>
            )}
            <button
              disabled={!termsAccepted || termsAccepting}
              onClick={async () => {
                setTermsAccepting(true);
                setTermsAcceptError(null);
                try {
                  const result = await api.acceptTerms(token, LEGAL_VERSIONS.terms, LEGAL_VERSIONS.privacy);
                  if (!result?.ok) throw new Error("not ok");
                  setNeedsTermsGate(false);
                } catch {
                  setTermsAcceptError("Could not save — please try again.");
                } finally {
                  setTermsAccepting(false);
                }
              }}
              style={{ width: "100%", padding: 16, background: termsAccepted ? C.emerald : C.subtle, border: "none", borderRadius: 16, color: "#fff", fontSize: 15, fontWeight: 900, cursor: termsAccepted ? "pointer" : "not-allowed", opacity: termsAccepting ? 0.6 : 1, transition: "all 0.15s" }}
            >
              {termsAccepting ? "Saving…" : "I agree — Continue"}
            </button>
            <button
              onClick={logout}
              style={{ width: "100%", marginTop: 10, padding: "10px 0", background: "none", border: "none", color: C.muted, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
            >
              Sign out instead
            </button>
          </div>
        </div>
      )}

      {showLogActivity && (
        <LogActivityModal
          onSave={handleLogActivity}
          onClose={() => setShowLogActivity(false)}
        />
      )}

      {showBonusPicker && (
        <BonusMinutePicker
          onSelect={handleBonusSelect}
          onClose={() => setShowBonusPicker(false)}
        />
      )}

      {showWhyNot && (
        <WhyNotModal
          onRegen={handleWhyNotRegen}
          onRestDay={handleRestDay}
          onClose={() => setShowWhyNot(false)}
        />
      )}

      {showCooperModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(2,6,23,0.92)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "#0d1626", border: `1px solid ${C.emeraldBorder}`, borderRadius: 24, padding: 28, width: "100%", maxWidth: 400 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🏃</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: C.text, marginBottom: 6 }}>Cooper Test Complete</div>
            <div style={{ fontSize: 14, color: C.muted, marginBottom: 20 }}>How far did you run in 12 minutes? Enter your distance in meters.</div>
            <input
              type="number"
              inputMode="numeric"
              placeholder="e.g. 2400"
              value={cooperDistance}
              onChange={e => setCooperDistance(e.target.value)}
              style={{ width: "100%", padding: "14px 16px", borderRadius: 14, border: `1px solid ${C.emeraldBorder}`, background: "rgba(255,255,255,0.04)", color: C.text, fontSize: 22, fontWeight: 900, textAlign: "center", outline: "none", boxSizing: "border-box", marginBottom: 8 }}
            />
            <div style={{ fontSize: 11, color: C.muted, textAlign: "center", marginBottom: 20 }}>
              {(() => {
                const d = parseInt(cooperDistance, 10);
                if (!d || d < 500) return "Enter your distance to see your benchmark";
                if (d < 1800) return "Below K1 benchmark — great starting point";
                if (d < 2000) return "K1 level (< 2000 m)";
                if (d < 2200) return "K2 level (2000–2199 m)";
                if (d < 2400) return "K3 level (2200–2399 m)";
                if (d < 2600) return "K4 level (2400–2599 m)";
                if (d < 2800) return "K5 level (2600–2799 m)";
                return "K6 level (≥ 2800 m) — excellent!";
              })()}
            </div>
            <button
              onClick={() => handleCooperSubmit(parseInt(cooperDistance, 10) || 0)}
              style={{ width: "100%", padding: "16px", borderRadius: 16, background: C.emerald, border: "none", color: "#020617", fontSize: 15, fontWeight: 900, cursor: "pointer", marginBottom: 10 }}
            >
              Save Result
            </button>
            <button
              onClick={() => handleCooperSubmit(0)}
              style={{ width: "100%", padding: "12px", borderRadius: 16, background: "transparent", border: `1px solid ${C.border}`, color: C.muted, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              Skip — record without distance
            </button>
          </div>
        </div>
      )}

      {activityToast && (
        <div style={{ position: "fixed", bottom: 100, left: "50%", transform: "translateX(-50%)", background: "#0d1626", border: `1px solid ${C.emeraldBorder}`, borderRadius: 14, padding: "12px 24px", fontSize: 14, fontWeight: 800, color: C.emerald, zIndex: 200, boxShadow: "0 8px 30px rgba(0,0,0,0.4)" }}>
          {activityToast}
        </div>
      )}
    </div>
  );
}
