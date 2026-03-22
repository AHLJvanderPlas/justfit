import { useState, useEffect, useCallback } from "react";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  bg: "#020617",
  bgCard: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",
  borderHover: "rgba(255,255,255,0.14)",
  emerald: "#10b981",
  emeraldDim: "rgba(16,185,129,0.15)",
  emeraldBorder: "rgba(16,185,129,0.3)",
  text: "#f8fafc",
  muted: "#64748b",
  subtle: "#334155",
};

// ─── GUEST USER ID ────────────────────────────────────────────────────────────
// Persisted in localStorage until real auth is built
function getUserId() {
  return localStorage.getItem("jf_user_id");
}

function getToken() {
  return localStorage.getItem("jf_token");
}

function logout() {
  localStorage.removeItem("jf_token");
  localStorage.removeItem("jf_user_id");
  window.location.href = "/login.html";
}

// ─── API HELPERS ──────────────────────────────────────────────────────────────
const api = {
  async generatePlan(userId, date, checkin) {
    const res = await fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, date, checkin }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error);
    return data.plan;
  },

  async getScore(userId) {
    const res = await fetch(`/api/score?user_id=${userId}`);
    const data = await res.json();
    return data.score ?? 0;
  },

  async saveExecution(userId, planId, date, steps, durationSec, perceivedExertion) {
    const res = await fetch("/api/execution", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        date,
        day_plan_id: planId ?? null,
        session_type: "workout",
        duration_sec: durationSec,
        perceived_exertion: perceivedExertion ?? null,
        steps: steps.map((s) => ({
          exercise_id: s.exercise_id,
          prescribed: {
            sets: s.sets,
            reps: s.target_reps,
            duration_sec: s.target_duration_sec,
            rest_sec: s.rest_sec,
          },
          actual: s.actual ?? { completed: true },
        })),
      }),
    });
    return res.json();
  },

  async getHistory(userId) {
    const res = await fetch(`/api/execution?user_id=${userId}&limit=30`);
    const data = await res.json();
    return data.executions ?? [];
  },

  async saveActivity(userId, date, executionType, durationSec) {
    const res = await fetch("/api/execution", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        date,
        execution_type: executionType,
        duration_sec: durationSec,
      }),
    });
    return res.json();
  },

  async logPeriod(userId, startedOn) {
    const res = await fetch("/api/cycle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, started_on: startedOn }),
    });
    return res.json();
  },

  async generateBonusPlan(userId, date, minutes, completedIds) {
    const res = await fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        date,
        checkin: { time_budget: minutes },
        completed_exercise_ids: completedIds,
      }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error);
    return data.plan;
  },

  async getProfile(token) {
    const res = await fetch("/api/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async saveProfile(token, profile) {
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profile),
    });
    return res.json();
  },
};

// ─── GHOST COUNTER ────────────────────────────────────────────────────────────
function GhostCounter() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const tick = () => {
      const T = new Date().getHours() + new Date().getMinutes() / 60;
      const morning = 40 * Math.sin((Math.PI * (T - 2)) / 12);
      const evening = 35 * Math.sin((Math.PI * (T - 14)) / 12);
      const isWE = [0, 6].includes(new Date().getDay());
      let raw = morning + evening + 25;
      if (isWE) raw *= 0.8;
      setCount(
        Math.max(8, Math.min(92, Math.floor(raw + Math.random() * 6 - 3))),
      );
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, []);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        background: "rgba(16,185,129,0.08)",
        border: "1px solid rgba(16,185,129,0.2)",
        borderRadius: 999,
        padding: "6px 14px",
        fontSize: 12,
        fontWeight: 700,
        color: "#6ee7b7",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: C.emerald,
          display: "inline-block",
          animation: "pulse 2s ease-in-out infinite",
        }}
      />
      {count} sporters actief
    </div>
  );
}

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
const Glass = ({ children, style = {}, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: C.bgCard,
      border: `1px solid ${C.border}`,
      borderRadius: 28,
      ...style,
    }}
  >
    {children}
  </div>
);

const Pill = ({ children, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      padding: "8px 0",
      borderRadius: 12,
      fontSize: 13,
      fontWeight: 700,
      border: active ? `1px solid ${C.emeraldBorder}` : `1px solid ${C.border}`,
      background: active ? C.emeraldDim : "rgba(255,255,255,0.03)",
      color: active ? C.emerald : C.muted,
      cursor: "pointer",
      transition: "all 0.15s",
    }}
  >
    {children}
  </button>
);

const Toggle = ({ label, sub, active, onToggle }) => (
  <button
    onClick={onToggle}
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "14px 16px",
      borderRadius: 16,
      width: "100%",
      textAlign: "left",
      background: active ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.03)",
      border: `1px solid ${active ? C.emeraldBorder : C.border}`,
      cursor: "pointer",
      transition: "all 0.15s",
      marginBottom: 8,
    }}
  >
    <div>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
        {label}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{sub}</div>
      )}
    </div>
    <div
      style={{
        width: 40,
        height: 22,
        borderRadius: 999,
        background: active ? C.emerald : C.subtle,
        position: "relative",
        flexShrink: 0,
        transition: "background 0.2s",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 3,
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "#fff",
          left: active ? 21 : 3,
          transition: "left 0.2s",
        }}
      />
    </div>
  </button>
);

const ScaleInput = ({ label, value, onChange }) => (
  <div style={{ marginBottom: 20 }}>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
      }}
    >
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: C.muted,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: 13, fontWeight: 800, color: C.emerald }}>
        {value}
      </span>
    </div>
    <div style={{ display: "flex", gap: 6 }}>
      {[1, 2, 3, 4, 5].map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          style={{
            flex: 1,
            padding: "10px 0",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 800,
            background: value === v ? C.emerald : "rgba(255,255,255,0.04)",
            border: `1px solid ${value === v ? C.emerald : C.border}`,
            color: value === v ? "#fff" : C.muted,
            cursor: "pointer",
            transition: "all 0.15s",
            boxShadow:
              value === v ? "0 4px 20px rgba(16,185,129,0.25)" : "none",
          }}
        >
          {v}
        </button>
      ))}
    </div>
  </div>
);

// ─── EU WAIVER MODAL ──────────────────────────────────────────────────────────
function EUWaiverModal({ onAccept }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "rgba(2,6,23,0.95)",
        backdropFilter: "blur(16px)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          background: "#0a1628",
          border: `1px solid ${C.border}`,
          borderRadius: 28,
          padding: 32,
          boxShadow: "0 40px 100px rgba(0,0,0,0.7)",
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            background: C.emeraldDim,
            border: `1px solid ${C.emeraldBorder}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.emerald} strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, color: C.text, letterSpacing: "-0.02em", marginBottom: 8 }}>
          Health &amp; Safety Notice
        </div>
        <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.7, marginBottom: 24 }}>
          JustFit.cc provides general fitness guidance for healthy adults. By using this app you confirm that:
        </div>
        <ul style={{ listStyle: "none", marginBottom: 24, display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            "You are 18 years or older",
            "You have no medical conditions that prevent exercise",
            "JustFit.cc is not a medical app and does not provide medical advice",
            "You accept full responsibility for your own physical safety",
            "You will consult a doctor before starting any new exercise program if in doubt",
          ].map((item, i) => (
            <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ color: C.emerald, fontWeight: 900, flexShrink: 0, marginTop: 1 }}>✓</span>
              <span style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>{item}</span>
            </li>
          ))}
        </ul>
        <p style={{ fontSize: 11, color: C.muted, marginBottom: 24, lineHeight: 1.6 }}>
          This app stores only the data you provide. Your fitness data is not sold or shared. By continuing, you agree to these terms (EU/GDPR compliant).
        </p>
        <button
          onClick={onAccept}
          style={{
            width: "100%",
            padding: 16,
            borderRadius: 16,
            background: C.emerald,
            border: "none",
            color: "#fff",
            fontWeight: 900,
            fontSize: 15,
            letterSpacing: "0.04em",
            cursor: "pointer",
            boxShadow: "0 8px 32px rgba(16,185,129,0.35)",
          }}
        >
          I Understand — Continue
        </button>
      </div>
    </div>
  );
}

// ─── ONBOARDING MODAL ─────────────────────────────────────────────────────────
const GOALS = [
  { value: "health", label: "General Health", icon: "❤️" },
  { value: "strength", label: "Build Strength", icon: "💪" },
  { value: "fat_loss", label: "Lose Weight", icon: "🔥" },
  { value: "muscle_gain", label: "Build Muscle", icon: "🏋️" },
  { value: "endurance", label: "Endurance", icon: "🏃" },
  { value: "mobility", label: "Mobility & Flex", icon: "🧘" },
];

const EXPERIENCE = [
  { value: "beginner", label: "Beginner", sub: "New to fitness or returning after a long break" },
  { value: "intermediate", label: "Intermediate", sub: "Training consistently for 6+ months" },
  { value: "advanced", label: "Advanced", sub: "Training for 2+ years, know your way around" },
];

const EQUIPMENT_OPTIONS = [
  { value: "none", label: "No equipment", sub: "Bodyweight only" },
  { value: "dumbbell", label: "Dumbbells", sub: "Adjustable or fixed" },
  { value: "resistance_bands", label: "Resistance bands", sub: "Light to heavy bands" },
  { value: "pull_up_bar", label: "Pull-up bar", sub: "Door-mounted or free-standing" },
];

const SEX_OPTIONS = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Non-binary", value: "non_binary" },
  { label: "Prefer not to say", value: "prefer_not_to_say" },
];

const CYCLE_LENGTHS = [21, 24, 26, 28, 30, 32, 35];

// Default last period ≈ 4 weeks ago
function defaultPeriodDate() {
  const d = new Date();
  d.setDate(d.getDate() - 28);
  return d.toISOString().split("T")[0];
}

function OnboardingModal({ token, onComplete }) {
  const [step, setStep] = useState(0);
  // Step 0 — About you
  const [sex, setSex] = useState(null);
  const [weightInput, setWeightInput] = useState("");
  const [weightUnit, setWeightUnit] = useState("kg");
  const [showCycleSetup, setShowCycleSetup] = useState(false);
  const [lastPeriodStart, setLastPeriodStart] = useState(defaultPeriodDate());
  const [cycleLength, setCycleLength] = useState(28);
  const [cycleTrackingMode, setCycleTrackingMode] = useState(null);
  const [cycleSetupDone, setCycleSetupDone] = useState(false);
  // Steps 1-3 (existing)
  const [goal, setGoal] = useState("health");
  const [experience, setExperience] = useState("beginner");
  const [equipment, setEquipment] = useState(["none"]);
  const [duration, setDuration] = useState(30);
  const [saving, setSaving] = useState(false);

  const TOTAL_STEPS = 4;

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
      const cycle = (sex === "female" && cycleTrackingMode === "smart")
        ? { tracking_mode: "smart", cycle_length_days: cycleLength, last_period_start: lastPeriodStart }
        : { tracking_mode: "off" };

      await api.saveProfile(token, {
        training_goal: goal,
        experience_level: experience,
        session_duration_min: duration,
        days_per_week_target: 3,
        preferences: { available_equipment: equipment },
        sex,
        weight_kg,
        cycle,
      });
      onComplete({ training_goal: goal, experience_level: experience, session_duration_min: duration, sex, weight_kg });
    } catch (e) {
      console.error("Failed to save profile:", e);
      onComplete({});
    }
    setSaving(false);
  };

  const canAdvance = step === 0 ? !!sex : true;
  const DURATION_OPTIONS = [15, 20, 30, 45, 60];

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
              width: `${((step + 1) / TOTAL_STEPS) * 100}%`,
              transition: "width 0.3s",
            }}
          />
        </div>

        <div style={{ padding: "28px 28px 24px", overflowY: "auto" }}>
          <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.12em", color: C.emerald, textTransform: "uppercase", marginBottom: 8 }}>
            Step {step + 1} of {TOTAL_STEPS}
          </div>

          {/* ── Step 0: About you ── */}
          {step === 0 && (
            <>
              <div style={{ fontSize: 22, fontWeight: 900, color: C.text, letterSpacing: "-0.02em", marginBottom: 6 }}>About you</div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>This helps us personalise your training baseline.</div>

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
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 24 }}>
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
                <div style={{ display: "flex", gap: 6 }}>
                  {["kg", "lbs"].map((u) => (
                    <button
                      key={u}
                      onClick={() => setWeightUnit(u)}
                      style={{
                        padding: "8px 16px", borderRadius: 10,
                        border: `1px solid ${weightUnit === u ? C.emeraldBorder : C.border}`,
                        background: weightUnit === u ? C.emeraldDim : "rgba(255,255,255,0.03)",
                        color: weightUnit === u ? C.emerald : C.muted,
                        fontWeight: 700, fontSize: 12, cursor: "pointer",
                      }}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cycle tracking card — female only */}
              {sex === "female" && !cycleSetupDone && (
                <div style={{ borderRadius: 20, border: `1px solid ${C.emeraldBorder}`, background: "rgba(16,185,129,0.04)", padding: 20, marginBottom: 8 }}>
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
                <div style={{ fontSize: 12, color: C.emerald, padding: "8px 12px", borderRadius: 10, background: "rgba(16,185,129,0.08)" }}>
                  {cycleTrackingMode === "smart" ? "✓ Cycle tracking enabled" : "Cycle tracking skipped — enable anytime in Settings."}
                </div>
              )}
            </>
          )}

          {/* ── Step 1: Goal ── */}
          {step === 1 && (
            <>
              <div style={{ fontSize: 22, fontWeight: 900, color: C.text, letterSpacing: "-0.02em", marginBottom: 6 }}>What's your goal?</div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>Your plan adapts to this every day.</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {GOALS.map((g) => (
                  <button
                    key={g.value}
                    onClick={() => setGoal(g.value)}
                    style={{
                      padding: "16px 12px",
                      borderRadius: 16,
                      border: `1px solid ${goal === g.value ? C.emeraldBorder : C.border}`,
                      background: goal === g.value ? C.emeraldDim : "rgba(255,255,255,0.03)",
                      color: goal === g.value ? C.emerald : C.muted,
                      fontWeight: 700, fontSize: 13, cursor: "pointer", textAlign: "left",
                    }}
                  >
                    <div style={{ fontSize: 22, marginBottom: 6 }}>{g.icon}</div>
                    <div>{g.label}</div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── Step 2: Experience ── */}
          {step === 2 && (
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

          {/* ── Step 3: Equipment + time ── */}
          {step === 3 && (
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
                    {d}m
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div style={{ padding: "0 28px 28px", display: "flex", gap: 10 }}>
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              style={{
                flex: 1, padding: 14, borderRadius: 16,
                border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.03)",
                color: C.muted, fontWeight: 700, fontSize: 14, cursor: "pointer",
              }}
            >
              Back
            </button>
          )}
          <button
            onClick={step < TOTAL_STEPS - 1 ? () => setStep(step + 1) : handleFinish}
            disabled={saving || !canAdvance}
            style={{
              flex: 2, padding: 14, borderRadius: 16, border: "none",
              background: canAdvance ? C.emerald : C.subtle,
              color: "#fff", fontWeight: 900, fontSize: 15, cursor: canAdvance ? "pointer" : "not-allowed",
              boxShadow: canAdvance ? "0 8px 32px rgba(16,185,129,0.35)" : "none",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Saving..." : step < TOTAL_STEPS - 1 ? "Continue" : "Start Training"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── CHECK-IN MODAL ───────────────────────────────────────────────────────────
const TIME_OPTIONS = [5, 10, 15, 20, 30, 45, 60, 90];

function CheckInModal({ onSave, onClose, isPro, sex, cycle }) {
  const bodyMode = cycle?.mode ?? "standard";
  const showPeriodToggle = sex === "female" && bodyMode === "standard";
  const [d, setD] = useState({
    energy: 3,
    sleep_hours: 7,
    motivation: 3,
    stress: 3,
    time_budget: 30,
    no_clothing: false,
    no_gear: false,
    no_time: false,
    gym_today: false,
    traveling: false,
    pain_level: 0,
    period_today: false,
    free_text: "",
    // Pregnancy signals
    pregnancy_signals: { nausea: false, breathless: false, pelvic_discomfort: false },
    // Postnatal signals
    postnatal_signals: { running_today: false, heaviness: false },
  });
  const upd = (patch) => setD((prev) => ({ ...prev, ...patch }));
  const updPregnancySignal = (key, val) => setD((prev) => ({ ...prev, pregnancy_signals: { ...prev.pregnancy_signals, [key]: val } }));
  const updPostnatalSignal = (key, val) => setD((prev) => ({ ...prev, postnatal_signals: { ...prev.postnatal_signals, [key]: val } }));

  const handleSubmit = () => {
    // Map 1-5 stress scale to 1-10 for DB (spec uses 1-5 UI, DB stores 1-10)
    onSave({
      ...d,
      stress: d.stress * 2, // 1-5 → 2-10
      energy: d.energy * 2, // 1-5 → 2-10
      motivation: d.motivation * 2,
      checkin_json: {
        no_clothing: d.no_clothing,
        no_gear: d.no_gear,
        no_time: d.no_time,
        gym_today: d.gym_today,
        traveling: d.traveling,
        pain_level: d.pain_level,
        period_today: d.period_today,
        free_text: d.free_text,
        motivation: d.motivation,
        time_budget: d.time_budget,
        pregnancy_signals: d.pregnancy_signals,
        postnatal_signals: d.postnatal_signals,
      },
    });
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        background: "rgba(2,6,23,0.85)",
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
          boxShadow: "0 40px 100px rgba(0,0,0,0.6)",
        }}
      >
        <div
          style={{
            padding: "20px 24px",
            borderBottom: `1px solid ${C.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: C.text,
                letterSpacing: "-0.02em",
              }}
            >
              Daily Check-in
            </div>
            <div
              style={{
                fontSize: 11,
                color: C.muted,
                marginTop: 2,
                fontWeight: 600,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              {new Date().toLocaleDateString("en", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              background: "rgba(255,255,255,0.05)",
              border: `1px solid ${C.border}`,
              color: C.muted,
              fontSize: 18,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "24px 24px 0" }}>
          <div style={{ marginBottom: 28 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: "0.15em",
                color: C.emerald,
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              Vitals
            </div>
            <ScaleInput
              label="Energy"
              value={d.energy}
              onChange={(v) => upd({ energy: v })}
            />
            <ScaleInput
              label="Sleep Quality"
              value={Math.round(d.sleep_hours / 2)}
              onChange={(v) => upd({ sleep_hours: v * 2 })}
            />
            <ScaleInput
              label="Motivation"
              value={d.motivation}
              onChange={(v) => upd({ motivation: v })}
            />
            <ScaleInput
              label="Stress"
              value={d.stress}
              onChange={(v) => upd({ stress: v })}
            />
          </div>

          <div style={{ marginBottom: 28 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: "0.15em",
                color: C.emerald,
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              Time Available
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4,1fr)",
                gap: 8,
              }}
            >
              {TIME_OPTIONS.map((m) => (
                <Pill
                  key={m}
                  active={d.time_budget === m}
                  onClick={() => upd({ time_budget: m })}
                >
                  {m}m
                </Pill>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: "0.15em",
                color: C.emerald,
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              Pain Level
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4,1fr)",
                gap: 8,
              }}
            >
              {["None", "Mild", "Moderate", "Severe"].map((l, i) => (
                <Pill
                  key={i}
                  active={d.pain_level === i}
                  onClick={() => upd({ pain_level: i })}
                >
                  {l}
                </Pill>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: "0.15em",
                color: C.emerald,
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              Context
            </div>
            <Toggle
              label="No sports clothing"
              sub="Low-sweat session only"
              active={d.no_clothing}
              onToggle={() => upd({ no_clothing: !d.no_clothing })}
            />
            <Toggle
              label="No gear available"
              sub="Bodyweight exercises only"
              active={d.no_gear}
              onToggle={() => upd({ no_gear: !d.no_gear })}
            />
            <Toggle
              label="Zero time today"
              sub="Micro session or rest"
              active={d.no_time}
              onToggle={() => upd({ no_time: !d.no_time })}
            />
            <Toggle
              label="Gym access today"
              sub="Equipment unlocked"
              active={d.gym_today}
              onToggle={() => upd({ gym_today: !d.gym_today })}
            />
            <Toggle
              label="Traveling"
              sub="Away from home setup"
              active={d.traveling}
              onToggle={() => upd({ traveling: !d.traveling })}
            />
            {showPeriodToggle && (
              <button
                onClick={() => upd({ period_today: !d.period_today })}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "14px 16px", borderRadius: 16, width: "100%", textAlign: "left",
                  background: d.period_today ? "rgba(167,139,250,0.1)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${d.period_today ? "rgba(167,139,250,0.4)" : C.border}`,
                  cursor: "pointer", transition: "all 0.15s", marginBottom: 8,
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>🌙 Period today</div>
                  <div style={{ fontSize: 11, color: d.period_today ? "rgba(167,139,250,0.8)" : C.muted, marginTop: 2 }}>
                    {d.period_today ? "Taking care of you today 🌙" : "We'll plan something that feels good"}
                  </div>
                </div>
                <div style={{ width: 40, height: 22, borderRadius: 999, background: d.period_today ? "#a78bfa" : C.subtle, position: "relative", flexShrink: 0, transition: "background 0.2s" }}>
                  <div style={{ position: "absolute", top: 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", left: d.period_today ? 21 : 3, transition: "left 0.2s" }} />
                </div>
              </button>
            )}
          </div>

          {/* ── Pregnancy signals section ── */}
          {bodyMode === "pregnant" && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", color: "#fbbf24", textTransform: "uppercase", marginBottom: 16 }}>
                How is your body today?
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { key: "nausea", label: "Feeling nauseous", sub: "We'll keep it very gentle" },
                  { key: "breathless", label: "Feeling breathless", sub: "We'll shorten intervals" },
                  { key: "pelvic_discomfort", label: "Pelvic discomfort", sub: "Low-load focus today" },
                ].map(({ key, label, sub }) => {
                  const active = d.pregnancy_signals[key];
                  return (
                    <button
                      key={key}
                      onClick={() => updPregnancySignal(key, !active)}
                      style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "12px 16px", borderRadius: 14, width: "100%", textAlign: "left",
                        background: active ? "rgba(251,191,36,0.08)" : "rgba(255,255,255,0.03)",
                        border: `1px solid ${active ? "rgba(251,191,36,0.35)" : C.border}`,
                        cursor: "pointer",
                      }}
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

          {/* ── Postnatal signals section ── */}
          {bodyMode === "postnatal" && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", color: "rgba(251,191,36,0.8)", textTransform: "uppercase", marginBottom: 16 }}>
                How is your recovery today?
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { key: "heaviness", label: "Feeling pelvic heaviness", sub: "We'll reduce load and impact" },
                  { key: "running_today", label: "Returned to running", sub: "Clearance note will be added" },
                ].map(({ key, label, sub }) => {
                  const active = d.postnatal_signals[key];
                  return (
                    <button
                      key={key}
                      onClick={() => updPostnatalSignal(key, !active)}
                      style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "12px 16px", borderRadius: 14, width: "100%", textAlign: "left",
                        background: active ? "rgba(251,191,36,0.08)" : "rgba(255,255,255,0.03)",
                        border: `1px solid ${active ? "rgba(251,191,36,0.35)" : C.border}`,
                        cursor: "pointer",
                      }}
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

          {isPro && (
            <div style={{ marginBottom: 28 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 900,
                  letterSpacing: "0.15em",
                  color: C.emerald,
                  textTransform: "uppercase",
                  marginBottom: 16,
                }}
              >
                Pro Advisory
              </div>
              <textarea
                placeholder="Anything I should consider today?"
                value={d.free_text}
                onChange={(e) => upd({ free_text: e.target.value })}
                style={{
                  width: "100%",
                  minHeight: 90,
                  background: "rgba(255,255,255,0.03)",
                  border: `1px solid ${C.border}`,
                  borderRadius: 14,
                  padding: 14,
                  fontSize: 14,
                  color: C.text,
                  resize: "none",
                  outline: "none",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
              />
            </div>
          )}
        </div>

        <div
          style={{
            padding: 20,
            borderTop: `1px solid ${C.border}`,
            display: "flex",
            gap: 10,
            background: "rgba(255,255,255,0.01)",
          }}
        >
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: 14,
              borderRadius: 14,
              fontWeight: 700,
              fontSize: 14,
              background: "transparent",
              border: `1px solid ${C.border}`,
              color: C.muted,
              cursor: "pointer",
            }}
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            style={{
              flex: 2,
              padding: 14,
              borderRadius: 14,
              fontWeight: 900,
              fontSize: 15,
              background: C.emerald,
              border: "none",
              color: "#fff",
              cursor: "pointer",
              boxShadow: "0 8px 30px rgba(16,185,129,0.3)",
            }}
          >
            Apply Today's Plan
          </button>
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
          style={{ width: "100%", padding: 16, borderRadius: 16, fontSize: 15, fontWeight: 900, background: (!type || !duration) ? C.subtle : C.emerald, border: "none", color: (!type || !duration) ? C.muted : "#fff", cursor: (!type || !duration) ? "not-allowed" : "pointer", boxShadow: (!type || !duration) ? "none" : "0 8px 30px rgba(16,185,129,0.3)" }}
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
  const beforeNight = new Date().getHours() < 20;

  return (
    <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 0, background: "linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(2,6,23,0.8) 60%)", border: "1px solid rgba(16,185,129,0.4)", borderRadius: 20 }}>
      {/* Checkmark */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: C.emeraldDim, border: `1px solid ${C.emeraldBorder}`, boxShadow: "0 0 20px rgba(16,185,129,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
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
  const [dismissed, setDismissed] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem("jf_milestone_dismissed") || "{}"); } catch { return {}; }
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
    const T_COLORS = { 1: "#10b981", 2: "#fbbf24", 3: "#f97316" };
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
                  localStorage.setItem("jf_milestone_dismissed", JSON.stringify(updated));
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
                  localStorage.setItem("jf_milestone_dismissed", JSON.stringify(updated));
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
function Dashboard({ plan, score, prevScore, onStartWorkout, isGenerating, todayCompleted, completedSession, onLogActivity, onBonusSession, bonusDone, onWhyNot }) {
  const intensityColor = {
    low: "#6ee7b7",
    moderate: C.emerald,
    high: "#f59e0b",
  };
  const ic = plan ? intensityColor[plan.intensity] || C.emerald : C.emerald;

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 36,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 36,
              fontWeight: 900,
              color: C.text,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
            }}
          >
            Welcome back.
          </div>
          <div
            style={{
              fontSize: 14,
              color: C.muted,
              marginTop: 6,
              fontWeight: 500,
            }}
          >
            Your consistency is your superpower.
          </div>
        </div>
        <GhostCounter />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "5fr 7fr",
          gap: 16,
          marginBottom: 16,
        }}
      >
        {/* Score card */}
        <Glass
          style={{
            padding: 28,
            minHeight: 220,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -20,
              right: -20,
              opacity: 0.06,
            }}
          >
            <svg
              width="160"
              height="160"
              viewBox="0 0 24 24"
              fill="none"
              stroke={C.emerald}
              strokeWidth="1"
            >
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                background: C.emeraldDim,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke={C.emerald}
                strokeWidth="2.5"
              >
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <span
              style={{
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: "0.15em",
                color: "rgba(16,185,129,0.7)",
                textTransform: "uppercase",
              }}
            >
              Consistency
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 6,
              marginBottom: 12,
            }}
          >
            <span
              style={{
                fontSize: 68,
                fontWeight: 900,
                color: C.text,
                lineHeight: 1,
                letterSpacing: "-0.04em",
              }}
            >
              {score}
            </span>
            <span style={{ fontSize: 18, fontWeight: 700, color: C.muted }}>
              /100
            </span>
          </div>
          <p
            style={{
              fontSize: 12,
              color: C.muted,
              fontWeight: 500,
              lineHeight: 1.5,
              maxWidth: 180,
            }}
          >
            {score >= 80
              ? "Elite tier. The chain is unbroken."
              : score >= 50
                ? "Building momentum. Keep showing up."
                : "Every rep counts. Start today."}
          </p>
        </Glass>

        {/* Session card — replaced by DoneCard after workout */}
        {todayCompleted ? (
          <DoneCard
            score={score}
            prevScore={prevScore}
            completedSession={completedSession}
            onLogActivity={onLogActivity}
            onBonusSession={onBonusSession}
            bonusDone={bonusDone}
          />
        ) : (
        <Glass
          style={{
            padding: 28,
            display: "flex",
            flexDirection: "column",
            background:
              "linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(2,6,23,0.6) 60%)",
            border: `1px solid ${C.emeraldBorder}`,
          }}
        >
          {isGenerating ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  border: `3px solid ${C.emeraldBorder}`,
                  borderTopColor: C.emerald,
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              <p style={{ fontSize: 14, color: C.emerald, fontWeight: 700 }}>
                Designing your session...
              </p>
            </div>
          ) : plan ? (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 20,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 900,
                      color: C.text,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {plan.session_name}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginTop: 6,
                    }}
                  >
                    <span
                      style={{ fontSize: 12, fontWeight: 700, color: C.muted }}
                    >
                      {plan.steps?.length ?? 0} exercises
                    </span>
                    <span
                      style={{
                        width: 3,
                        height: 3,
                        borderRadius: "50%",
                        background: C.subtle,
                        display: "inline-block",
                      }}
                    />
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: ic,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      {plan.intensity}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ flex: 1, marginBottom: 20 }}>
                {(plan.steps ?? []).slice(0, 3).map((s, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 14px",
                      borderRadius: 14,
                      marginBottom: 6,
                      background: "rgba(255,255,255,0.04)",
                      border: `1px solid ${C.border}`,
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      {s.gif_url ? (
                        <img
                          src={s.gif_url}
                          alt=""
                          style={{ width: 32, height: 32, borderRadius: 8, objectFit: "cover", flexShrink: 0, background: "rgba(255,255,255,0.04)" }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: C.emerald,
                            flexShrink: 0,
                          }}
                        />
                      )}
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#cbd5e1",
                        }}
                      >
                        {s.name}
                      </span>
                    </div>
                    <span
                      style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}
                    >
                      {s.target_reps
                        ? `${s.target_reps} reps`
                        : `${s.target_duration}s`}
                    </span>
                  </div>
                ))}
                {(!plan.steps || plan.steps.length === 0) && (
                  <p
                    style={{
                      fontSize: 13,
                      color: C.muted,
                      fontStyle: "italic",
                    }}
                  >
                    Recovery day. Rest is training.
                  </p>
                )}
              </div>

              <button
                onClick={() => plan.slot_type !== "rest" && onStartWorkout()}
                style={{
                  width: "100%",
                  padding: "16px 0",
                  borderRadius: 18,
                  fontSize: 15,
                  fontWeight: 900,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  background: plan.slot_type === "rest" ? C.subtle : C.emerald,
                  border: "none",
                  color: plan.slot_type === "rest" ? C.muted : "#fff",
                  cursor: plan.slot_type === "rest" ? "not-allowed" : "pointer",
                  boxShadow:
                    plan.slot_type === "rest"
                      ? "none"
                      : "0 8px 30px rgba(16,185,129,0.3)",
                }}
              >
                {plan.slot_type === "rest" ? (
                  "Recovery Mode Active"
                ) : (
                  <>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>{" "}
                    Start Session
                  </>
                )}
              </button>
              {plan.slot_type !== "rest" && (
                <button
                  onClick={onWhyNot}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: C.muted, marginTop: 12, textAlign: "center", width: "100%" }}
                >
                  Can't do this today?
                </button>
              )}
            </>
          ) : (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                gap: 12,
              }}
            >
              <div style={{ fontSize: 40 }}>🎯</div>
              <p
                style={{
                  fontSize: 14,
                  color: C.muted,
                  fontWeight: 500,
                  lineHeight: 1.5,
                }}
              >
                Complete the daily check-in to
                <br />
                generate today's session.
              </p>
            </div>
          )}
        </Glass>
        )}
      </div>

      {/* Rule trace */}
      {plan?.rule_trace?.length > 0 && (
        <Glass style={{ padding: 20 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: "0.15em",
              color: C.emerald,
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Why this session
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {plan.rule_trace.map((r, i) => (
              <span
                key={i}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: C.muted,
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  padding: "4px 10px",
                }}
              >
                {r}
              </span>
            ))}
          </div>
        </Glass>
      )}
    </div>
  );
}

// ─── WORKOUT VIEW ─────────────────────────────────────────────────────────────
// ─── EXERCISE GIF ─────────────────────────────────────────────────────────────
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
function WorkoutView({ plan, onComplete, onBack, cycle }) {
  const exercises = plan?.steps ?? [];
  const totalExercises = exercises.length;
  const startTimeRef = useRef(Date.now());
  const bodyMode = cycle?.mode ?? "standard";

  // ── Core state ──────────────────────────────────────────────────────────────
  const [exIdx, setExIdx] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [repCount, setRepCount] = useState(0);
  const [phase, setPhase] = useState(
    !plan || plan.slot_type === "rest" ? "restDay" : totalExercises > 0 ? "instruction" : "sessionFeedback"
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
  // Instruction card swipe state
  const [instrStep, setInstrStep] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartXRef = useRef(0);
  // Track actual data per exercise for saving
  const stepsActualRef = useRef(
    exercises.map((ex) => ({
      exercise_id: ex.exercise_id,
      prescribed: { sets: ex.sets, reps: ex.target_reps, duration_sec: ex.target_duration_sec, rest_sec: ex.rest_sec },
      actual: { sets_completed: 0, reps_per_set: [], skipped: false },
    }))
  );

  const cur = exercises[exIdx];
  const totalSets = cur?.sets ?? 3;
  const isTimeBased = !cur?.target_reps && !!cur?.target_duration_sec;
  const targetReps = adjustedReps ?? cur?.target_reps ?? 10;

  // ── Rest countdown ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "resting" || restRemaining <= 0) return;
    const id = setTimeout(() => setRestRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearTimeout(id);
  }, [phase, restRemaining]);

  useEffect(() => {
    if (phase !== "resting" || restRemaining > 0) return;
    setCurrentSet((s) => s + 1);
    setRepCount(0);
    setPhase("working");
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
    handleSetDone();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerRunning, timerRemaining]);

  // ── Instruction auto-advance (5s) ────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "instruction") return;
    const id = setTimeout(() => setPhase("working"), 5000);
    return () => clearTimeout(id);
  }, [phase, exIdx]);

  // ── Reset instruction card when exercise changes ──────────────────────────────
  useEffect(() => {
    setInstrStep(0);
    setDragOffset(0);
  }, [exIdx]);

  // ── Rest haptics at 10s and 5s ───────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "resting") return;
    if (restRemaining === 10 || restRemaining === 5) {
      if (navigator.vibrate) navigator.vibrate(60);
    }
  }, [phase, restRemaining]);

  // ── Exercise complete auto-advance (2s) ──────────────────────────────────────
  useEffect(() => {
    if (phase !== "exerciseComplete") return;
    const id = setTimeout(() => {
      setExIdx((i) => i + 1);
      setCurrentSet(1);
      setRepCount(0);
      setAdjustedReps(null);
      setAdjustedDuration(null);
      setPhase("instruction");
    }, 2000);
    return () => clearTimeout(id);
  }, [phase]);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function getRestDuration(ex) {
    const tags = JSON.parse(ex?.tags_json || "[]");
    if (plan?.slot_type === "micro") return 20;
    if (tags.includes("pelvic_floor")) return 30;
    if (tags.includes("mobility")) return 20;
    if (tags.includes("cardio")) return 30;
    if (tags.includes("bodyweight")) return 45;
    return ex?.rest_sec ?? 60;
  }

  function handleSetDone(repsThisSet) {
    const reps = repsThisSet ?? repCount;
    // Record actual reps
    stepsActualRef.current[exIdx].actual.reps_per_set.push(reps);
    stepsActualRef.current[exIdx].actual.sets_completed += 1;

    if (currentSet < totalSets) {
      const rest = getRestDuration(cur);
      setRestRemaining(rest);
      setRestTotal(rest);
      setPhase("resting");
    } else {
      if (exIdx < totalExercises - 1) {
        setPhase("exerciseComplete");
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
    clearTimeout();
    setRestRemaining(0);
    setCurrentSet((s) => s + 1);
    setRepCount(0);
    setPhase("working");
  }

  function handleSkipExercise() {
    stepsActualRef.current[exIdx].actual.skipped = true;
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
    <div style={{ position: "fixed", inset: 0, background: C.bg, zIndex: 50, display: "flex", flexDirection: "column", overflow: "hidden" }}>
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

      {/* Session header */}
      {phase !== "sessionFeedback" && (
        <div style={{ flexShrink: 0, borderBottom: `1px solid ${C.border}`, background: C.bg }}>
          <div style={{ maxWidth: 560, margin: "0 auto", padding: "14px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button onClick={() => setShowCancel(true)} style={{ fontSize: 13, fontWeight: 700, color: C.muted, background: "none", border: "none", cursor: "pointer", padding: "4px 0", minHeight: 44, display: "flex", alignItems: "center" }}>
                ← Cancel
              </button>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: C.text, letterSpacing: "-0.02em" }}>
                  {phase === "resting" || phase === "exerciseComplete" ? exercises[exIdx]?.name : cur?.name}
                </div>
                <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginTop: 2 }}>
                  {phase === "exerciseComplete" ? `Exercise ${exIdx + 1} of ${totalExercises}` : `${exIdx + 1} of ${totalExercises} exercises`}
                </div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 900, color: C.emerald, letterSpacing: "0.06em", textTransform: "uppercase", minWidth: 56, textAlign: "right" }}>
                {phase === "resting" || phase === "working"
                  ? `Set ${currentSet}/${totalSets}`
                  : phase === "exerciseComplete"
                  ? "Done ✓"
                  : ""}
              </div>
            </div>
            {/* Progress bar */}
            <div style={{ marginTop: 10, height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progressPct}%`, background: C.emerald, borderRadius: 2, transition: "width 0.4s ease" }} />
            </div>
          </div>
        </div>
      )}

      {/* Phase content */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {/* ── INSTRUCTION PHASE ── */}
        {phase === "instruction" && cur && (() => {
          const instr = cur.instructions_json ? JSON.parse(cur.instructions_json) : null;
          const rawSteps = instr?.steps ?? [];
          const cues = instr?.cues ?? [];
          // Build card slides: one per step, or one fallback card
          const cards = rawSteps.length > 0 ? rawSteps : ["Focus on form. Quality over speed. You've got this."];
          const totalCards = cards.length;
          const clampedStep = Math.min(instrStep, totalCards - 1);

          function onTouchStart(e) {
            touchStartXRef.current = e.touches[0].clientX;
            setIsDragging(true);
          }
          function onTouchMove(e) {
            const delta = e.touches[0].clientX - touchStartXRef.current;
            setDragOffset(delta * 0.55);
          }
          function onTouchEnd(e) {
            const delta = e.changedTouches[0].clientX - touchStartXRef.current;
            setIsDragging(false);
            setDragOffset(0);
            if (delta < -60 && clampedStep < totalCards - 1) setInstrStep((s) => s + 1);
            else if (delta > 60 && clampedStep > 0) setInstrStep((s) => s - 1);
          }
          // Mouse drag for desktop
          function onMouseDown(e) {
            touchStartXRef.current = e.clientX;
            setIsDragging(true);
          }
          function onMouseMove(e) {
            if (!isDragging) return;
            setDragOffset((e.clientX - touchStartXRef.current) * 0.55);
          }
          function onMouseUp(e) {
            if (!isDragging) return;
            const delta = e.clientX - touchStartXRef.current;
            setIsDragging(false);
            setDragOffset(0);
            if (delta < -60 && clampedStep < totalCards - 1) setInstrStep((s) => s + 1);
            else if (delta > 60 && clampedStep > 0) setInstrStep((s) => s - 1);
          }

          return (
            <div style={{ maxWidth: 560, margin: "0 auto", padding: "28px 20px 32px", display: "flex", flexDirection: "column", minHeight: "calc(100vh - 80px)", gap: 20 }}>
              {/* Exercise name + target */}
              <div style={{ textAlign: "center" }}>
                {cur.gif_url && <ExerciseGif gifUrl={cur.gif_url} name={cur.name} />}
                <h1 style={{ fontSize: 32, fontWeight: 900, color: C.text, letterSpacing: "-0.03em", marginBottom: 8, lineHeight: 1.1 }}>
                  {cur.name}
                </h1>
                <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.emerald }}>
                    {totalSets} {totalSets === 1 ? "set" : "sets"}
                  </span>
                  <span style={{ fontSize: 13, color: C.muted }}>·</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.emerald }}>
                    {isTimeBased ? `${cur.target_duration_sec}s` : `${targetReps} reps`}
                  </span>
                </div>
              </div>

              {/* Swipeable instruction card */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Step label + dots */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 4px" }}>
                  <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", color: C.muted }}>
                    {rawSteps.length > 0 ? `Step ${clampedStep + 1} of ${totalCards}` : "Coaching cue"}
                  </span>
                  {totalCards > 1 && (
                    <div style={{ display: "flex", gap: 6 }}>
                      {cards.map((_, i) => (
                        <div key={i} onClick={() => setInstrStep(i)} style={{ width: 8, height: 8, borderRadius: "50%", background: i === clampedStep ? C.emerald : "rgba(255,255,255,0.15)", transition: "background 0.25s", cursor: "pointer" }} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Card carousel */}
                <div
                  style={{ overflow: "hidden", borderRadius: 20, cursor: totalCards > 1 ? "grab" : "default", userSelect: "none" }}
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                  onMouseDown={onMouseDown}
                  onMouseMove={onMouseMove}
                  onMouseUp={onMouseUp}
                  onMouseLeave={onMouseUp}
                >
                  <div style={{ display: "flex", transform: `translateX(calc(-${clampedStep * 100}% + ${dragOffset}px))`, transition: isDragging ? "none" : "transform 0.28s cubic-bezier(0.34, 1.4, 0.64, 1)" }}>
                    {cards.map((card, i) => (
                      <div key={i} style={{ minWidth: "100%", flexShrink: 0 }}>
                        <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "28px 24px", minHeight: 140, display: "flex", alignItems: "center" }}>
                          <p style={{ fontSize: 18, fontWeight: 700, color: C.text, lineHeight: 1.6, margin: 0 }}>{card}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Prev / Next nav (supplemental to swipe) */}
                {totalCards > 1 && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <button onClick={() => setInstrStep((s) => Math.max(0, s - 1))} disabled={clampedStep === 0} style={{ fontSize: 13, fontWeight: 700, color: clampedStep === 0 ? "rgba(255,255,255,0.15)" : C.muted, background: "none", border: "none", cursor: clampedStep === 0 ? "default" : "pointer", padding: "8px 4px" }}>
                      ← Prev
                    </button>
                    <button onClick={() => setInstrStep((s) => Math.min(totalCards - 1, s + 1))} disabled={clampedStep === totalCards - 1} style={{ fontSize: 13, fontWeight: 700, color: clampedStep === totalCards - 1 ? "rgba(255,255,255,0.15)" : C.muted, background: "none", border: "none", cursor: clampedStep === totalCards - 1 ? "default" : "pointer", padding: "8px 4px" }}>
                      Next →
                    </button>
                  </div>
                )}

                {/* Cues — always visible below */}
                {cues.length > 0 && (
                  <div style={{ padding: "12px 4px" }}>
                    {cues.map((c, i) => (
                      <div key={i} style={{ fontSize: 13, color: C.muted, fontStyle: "italic", lineHeight: 1.6, marginBottom: i < cues.length - 1 ? 6 : 0 }}>
                        💡 {c}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => setPhase("working")}
                style={{ width: "100%", padding: "18px 0", borderRadius: 20, fontSize: 16, fontWeight: 900, background: C.emerald, border: "none", color: "#fff", cursor: "pointer", boxShadow: "0 8px 32px rgba(16,185,129,0.3)", letterSpacing: "-0.01em", flexShrink: 0 }}
              >
                Ready — let's go →
              </button>
            </div>
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
                const timerColor = timerRemaining <= 5 ? "#ef4444" : timerRemaining <= 10 ? "#f59e0b" : C.emerald;
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
                        onClick={() => { setTimerRemaining(totalDur); setTimerRunning(true); }}
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
                  ? "rgba(16,185,129,0.25)"
                  : isComplete
                  ? "rgba(16,185,129,0.15)"
                  : "rgba(16,185,129,0.08)";
                const tapBorder = tapFlash
                  ? "rgba(16,185,129,0.55)"
                  : isComplete
                  ? "rgba(16,185,129,0.4)"
                  : "rgba(16,185,129,0.2)";
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
                        style={{ width: "100%", minHeight: 280, borderRadius: 20, background: tapBg, border: `2px solid ${tapBorder}`, color: C.emerald, cursor: isComplete ? "default" : "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, transition: "background 0.15s, border-color 0.15s", WebkitTapHighlightColor: "transparent", animation: tapFlash ? "tapScale 0.15s ease-out" : "none", outline: "none" }}
                      >
                        <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase" }}>
                          {tapLabel}
                        </span>
                        {!isComplete && (
                          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(16,185,129,0.15)", border: "1.5px solid rgba(16,185,129,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.emerald} strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                          </div>
                        )}
                        {isComplete && (
                          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={C.emerald} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })()
            )}

            {/* Bottom actions */}
            <div style={{ display: "flex", gap: 12, position: "fixed", bottom: 24, left: 16, right: 16, maxWidth: 528, margin: "0 auto" }}>
              <button
                onClick={handleSkipExercise}
                style={{ flex: 1, padding: "14px 0", borderRadius: 16, fontWeight: 700, fontSize: 13, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, color: C.muted, cursor: "pointer" }}
              >
                Skip exercise
              </button>
              <button
                onClick={() => handleSetDone(repCount)}
                style={{ flex: 2, padding: "14px 0", borderRadius: 16, fontWeight: 700, fontSize: 14, background: "rgba(255,255,255,0.08)", border: `1px solid ${C.border}`, color: C.text, cursor: "pointer" }}
              >
                Finish set →
              </button>
            </div>
          </div>
        )}

        {/* ── RESTING PHASE ── */}
        {phase === "resting" && (() => {
          const restColor = restRemaining <= 5 ? "#ef4444" : restRemaining <= 10 ? "#f59e0b" : C.emerald;
          const progressPct = restTotal > 0 ? Math.min(100, ((restTotal - restRemaining) / restTotal) * 100) : 100;
          const nextExName = currentSet <= totalSets ? cur?.name : exercises[exIdx + 1]?.name;
          const isLastSet = currentSet > totalSets;

          function adjustRest(delta) {
            setRestRemaining((r) => Math.max(10, Math.min(180, r + delta)));
            setRestTotal((t) => Math.max(10, Math.min(180, t + delta)));
          }

          return (
            <div style={{ maxWidth: 560, margin: "0 auto", padding: "40px 20px 40px", display: "flex", flexDirection: "column", alignItems: "center", gap: 20, textAlign: "center", minHeight: "calc(100vh - 80px)", justifyContent: "center" }}>
              {/* Set complete label */}
              <div style={{ fontSize: 13, fontWeight: 900, color: C.emerald, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Set {currentSet - 1} of {totalSets} complete ✓
              </div>

              <div style={{ fontSize: 11, fontWeight: 900, color: C.muted, letterSpacing: "0.12em", textTransform: "uppercase" }}>REST</div>

              {/* Big countdown */}
              <div style={{ fontSize: 84, fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums", color: restColor, transition: "color 0.4s", animation: restRemaining <= 5 ? "pulse 0.8s infinite" : "none", minWidth: 160 }}>
                {String(Math.floor(restRemaining / 60)).padStart(1, "0")}:{String(restRemaining % 60).padStart(2, "0")}
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

              {/* Progress bar */}
              <div style={{ width: "100%", maxWidth: 320, height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${progressPct}%`, background: restColor, borderRadius: 3, transition: "width 1s linear, background 0.4s" }} />
              </div>

              {/* Next up */}
              {nextExName && (
                <div style={{ fontSize: 14, color: C.muted, fontWeight: 600 }}>
                  {isLastSet ? `Next: ${nextExName}` : `Next set: ${isTimeBased ? `${adjustedDuration ?? cur?.target_duration_sec}s` : `${targetReps} ×`} ${nextExName}`}
                </div>
              )}
            </div>
          );
        })()}

        {/* ── EXERCISE COMPLETE PHASE ── */}
        {phase === "exerciseComplete" && (
          <div style={{ maxWidth: 560, margin: "0 auto", padding: "80px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center" }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: C.emeraldDim, border: `2px solid ${C.emeraldBorder}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={C.emerald} strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: C.text, letterSpacing: "-0.02em" }}>
              {exercises[exIdx]?.name} done ✓
            </div>
            <div style={{ fontSize: 14, color: C.muted, fontWeight: 600 }}>
              {exercises[exIdx]?.sets ?? 3} sets complete · Next up: {exercises[exIdx + 1]?.name}
            </div>
          </div>
        )}

        {/* ── SESSION FEEDBACK PHASE ── */}
        {phase === "sessionFeedback" && (
          <div style={{ maxWidth: 560, margin: "0 auto", padding: "64px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 32, textAlign: "center" }}>
            <div>
              <div style={{ fontSize: 32, fontWeight: 900, color: C.text, letterSpacing: "-0.03em", marginBottom: 8 }}>Session done!</div>
              <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.5 }}>How did that feel?</p>
            </div>

            <div style={{ display: "flex", gap: 12, width: "100%" }}>
              {[
                { label: "Too hard", emoji: "😰", value: 8 },
                { label: "Just right", emoji: "😌", value: 5 },
                { label: "Too easy", emoji: "💪", value: 3 },
              ].map(({ label, emoji, value }) => (
                <button
                  key={value}
                  onClick={() => handleFinishSession(value)}
                  style={{ flex: 1, padding: "20px 8px", borderRadius: 18, fontWeight: 700, fontSize: 13, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, color: C.text, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, transition: "background 0.15s, border-color 0.15s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.09)"; e.currentTarget.style.borderColor = C.emeraldBorder; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = C.border; }}
                >
                  <span style={{ fontSize: 32 }}>{emoji}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => handleFinishSession(null)}
              style={{ fontSize: 13, color: C.muted, background: "none", border: "none", cursor: "pointer", textDecoration: "underline", textDecorationStyle: "dotted" }}
            >
              Skip rating
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── HISTORY VIEW ─────────────────────────────────────────────────────────────
function HistoryView({ history, isLoading }) {
  return (
    <div>
      <div style={{ marginBottom: 36 }}>
        <h1
          style={{
            fontSize: 36,
            fontWeight: 900,
            color: C.text,
            letterSpacing: "-0.03em",
          }}
        >
          History
        </h1>
        <p style={{ fontSize: 14, color: C.muted, marginTop: 6 }}>
          {history.length} sessions completed
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {isLoading ? (
          <Glass style={{ padding: 60, textAlign: "center" }}>
            <p style={{ fontSize: 14, color: C.muted }}>Loading history...</p>
          </Glass>
        ) : history.length === 0 ? (
          <Glass style={{ padding: 60, textAlign: "center" }}>
            <p style={{ fontSize: 14, color: C.muted, fontStyle: "italic" }}>
              Your workout history will appear here.
            </p>
          </Glass>
        ) : (
          [...history].reverse().map((h, i) => (
            <Glass
              key={i}
              style={{
                padding: "16px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: C.emeraldDim,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={C.emerald}
                    strokeWidth="2.5"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                    {new Date(h.date + "T12:00:00").toLocaleDateString("en", {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: C.muted,
                      fontWeight: 600,
                      marginTop: 2,
                    }}
                  >
                    {h.execution_type || "workout"} ·{" "}
                    {h.total_duration_sec
                      ? `${Math.round(h.total_duration_sec / 60)} min`
                      : "completed"}
                  </div>
                </div>
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 900,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: C.emerald,
                  background: C.emeraldDim,
                  padding: "4px 10px",
                  borderRadius: 8,
                }}
              >
                Done
              </span>
            </Glass>
          ))
        )}
      </div>
    </div>
  );
}

// ─── AWARDS VIEW ──────────────────────────────────────────────────────────────
function AwardsView({ history, score, isPro }) {
  const n = history.length;
  const awards = [
    {
      id: "genesis",
      title: "Genesis",
      desc: "Complete your very first session.",
      icon: "⚡",
      unlocked: n >= 1,
      req: "1 workout",
    },
    {
      id: "habit",
      title: "The Habit",
      desc: "Three workouts. The rhythm is forming.",
      icon: "🔥",
      unlocked: n >= 3,
      req: "3 workouts",
    },
    {
      id: "iron_will",
      title: "Iron Will",
      desc: "Consistency score of 80 or higher.",
      icon: "🧲",
      unlocked: score >= 80,
      req: "Score 80+",
    },
    {
      id: "seven",
      title: "Full Rotation",
      desc: "Seven sessions across your history.",
      icon: "🏅",
      unlocked: n >= 7,
      req: "7 workouts",
    },
    {
      id: "pro",
      title: "Pro Status",
      desc: "Unlock the full JustFit adaptive engine.",
      icon: "⭐",
      unlocked: isPro,
      req: "Pro active",
    },
    {
      id: "king",
      title: "Consistency King",
      desc: "Hit the perfect score of 100.",
      icon: "👑",
      unlocked: score >= 100,
      req: "Score 100",
    },
  ];
  const total = awards.filter((a) => a.unlocked).length;

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 36,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 36,
              fontWeight: 900,
              color: C.text,
              letterSpacing: "-0.03em",
            }}
          >
            Hall of Fame
          </h1>
          <p style={{ fontSize: 14, color: C.muted, marginTop: 6 }}>
            Earn your place among the elite consistent.
          </p>
        </div>
        <Glass
          style={{
            padding: "16px 22px",
            display: "flex",
            alignItems: "center",
            gap: 20,
            minWidth: 220,
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: "0.12em",
                color: C.emerald,
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              {total}/{awards.length} collected
            </div>
            <div
              style={{
                height: 6,
                background: "rgba(255,255,255,0.08)",
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  background: C.emerald,
                  borderRadius: 3,
                  width: `${(total / awards.length) * 100}%`,
                  transition: "width 1s",
                }}
              />
            </div>
          </div>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: C.emeraldDim,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
            }}
          >
            🏆
          </div>
        </Glass>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))",
          gap: 14,
        }}
      >
        {awards.map((a) => (
          <Glass
            key={a.id}
            style={{
              padding: 24,
              display: "flex",
              gap: 16,
              position: "relative",
              overflow: "hidden",
              opacity: a.unlocked ? 1 : 0.45,
              filter: a.unlocked ? "none" : "grayscale(0.8)",
              border: a.unlocked
                ? `1px solid ${C.emeraldBorder}`
                : `1px solid ${C.border}`,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                flexShrink: 0,
                fontSize: 26,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: a.unlocked
                  ? C.emeraldDim
                  : "rgba(255,255,255,0.04)",
              }}
            >
              {a.unlocked ? a.icon : "🔒"}
            </div>
            <div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 900,
                  color: a.unlocked ? C.text : C.muted,
                  marginBottom: 4,
                }}
              >
                {a.title}
              </div>
              <p
                style={{
                  fontSize: 12,
                  color: C.muted,
                  lineHeight: 1.5,
                  marginBottom: 10,
                }}
              >
                {a.desc}
              </p>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 900,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  padding: "4px 10px",
                  borderRadius: 8,
                  background: a.unlocked
                    ? C.emeraldDim
                    : "rgba(255,255,255,0.04)",
                  color: a.unlocked ? C.emerald : C.muted,
                }}
              >
                {a.unlocked ? "Unlocked" : a.req}
              </span>
            </div>
          </Glass>
        ))}
      </div>
    </div>
  );
}

// ─── SETTINGS VIEW ────────────────────────────────────────────────────────────
// ─── WEBAUTHN HELPERS (client-side) ───────────────────────────────────────────
const b64url = (buf) =>
  btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

const fromB64url = (str) => {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
};

const PHASE_LABELS = {
  menstrual:  "Rest & restore phase",
  follicular: "Building strength phase",
  ovulation:  "Peak energy phase",
  luteal:     "Wind-down phase",
};

const CYCLE_LENGTHS_SETTINGS = [21, 24, 26, 28, 30, 32, 35];

function SettingsView({ prefs, onUpdate, userId, token }) {
  const [passkeySupported, setPasskeySupported] = useState(false);
  const [addingPasskey, setAddingPasskey]       = useState(false);
  const [passkeyMsg, setPasskeyMsg]             = useState("");
  // Cycle settings state
  const [cycleTrackingMode, setCycleTrackingMode] = useState(prefs.cycle?.tracking_mode ?? "off");
  const [cycleLength, setCycleLength] = useState(prefs.cycle?.cycle_length_days ?? 28);
  const [lastPeriodStart, setLastPeriodStart] = useState(prefs.cycle?.last_period_start ?? "");
  const [cycleSaving, setCycleSaving] = useState(false);
  // Pregnancy mode state
  const [bodyMode, setBodyMode] = useState(prefs.cycle?.mode ?? "standard");
  const [pregnancySetupStep, setPregnancySetupStep] = useState(0); // 0=hidden,1=clearance,2=duedate
  const [medicalClearance, setMedicalClearance] = useState(false);
  const [pregnancyDueDate, setPregnancyDueDate] = useState(prefs.cycle?.pregnancy_due_date ?? "");
  const [pregnancySaving, setPregnancySaving] = useState(false);
  // Postnatal mode state
  const [postnatalSetupStep, setPostnatalSetupStep] = useState(0); // 0=hidden,1=birthdate,2=birthtype
  const [postnatalBirthDate, setPostnatalBirthDate] = useState(prefs.cycle?.postnatal_birth_date ?? "");
  const [postnatalBirthType, setPostnatalBirthType] = useState(prefs.cycle?.postnatal_birth_type ?? "");
  const [postnatalSaving, setPostnatalSaving] = useState(false);

  useEffect(() => {
    if (window.PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable) {
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(setPasskeySupported);
    }
  }, []);

  const handleAddPasskey = async () => {
    setAddingPasskey(true);
    setPasskeyMsg("");
    try {
      const beginRes = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "passkey_begin_register" }),
      }).then((r) => r.json());

      if (!beginRes.challengeToken) throw new Error(beginRes.error || "Failed to begin");

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: fromB64url(beginRes.challenge),
          rp: { name: "JustFit.cc", id: "justfit.cc" },
          user: {
            id: fromB64url(beginRes.userId),
            name: prefs.email || userId,
            displayName: "JustFit User",
          },
          pubKeyCredParams: [{ type: "public-key", alg: -7 }],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            requireResidentKey: true,
            residentKey: "required",
            userVerification: "preferred",
          },
          timeout: 60000,
          attestation: "none",
        },
      });

      const pubKey   = credential.response.getPublicKey();
      const pubKeyB64 = btoa(String.fromCharCode(...new Uint8Array(pubKey)));

      const completeRes = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: "passkey_complete_register",
          challengeToken: beginRes.challengeToken,
          credentialId: b64url(credential.rawId),
          publicKey: pubKeyB64,
          algorithm: credential.response.getPublicKeyAlgorithm(),
        }),
      }).then((r) => r.json());

      if (!completeRes.ok) throw new Error(completeRes.error || "Registration failed");
      setPasskeyMsg("✓ Passkey registered — you can now use Face ID / Touch ID to log in.");
    } catch (e) {
      if (e.name === "NotAllowedError") {
        setPasskeyMsg("Cancelled — try again when ready.");
      } else {
        setPasskeyMsg(`Failed: ${e.message}`);
      }
    }
    setAddingPasskey(false);
  };

  return (
    <div style={{ maxWidth: 480 }}>
      <div style={{ marginBottom: 36 }}>
        <h1
          style={{
            fontSize: 36,
            fontWeight: 900,
            color: C.text,
            letterSpacing: "-0.03em",
          }}
        >
          Settings
        </h1>
      </div>

      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: "0.15em",
            color: C.emerald,
            textTransform: "uppercase",
            marginBottom: 16,
          }}
        >
          Subscription
        </div>
        <Glass
          style={{
            padding: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: prefs.isPro ? "rgba(16,185,129,0.06)" : C.bgCard,
            border: `1px solid ${prefs.isPro ? C.emeraldBorder : C.border}`,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 900,
                color: C.text,
                letterSpacing: "-0.03em",
              }}
            >
              {prefs.isPro ? "PRO" : "BASE"} PASS
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
              {prefs.isPro
                ? "Adaptive AI planning enabled"
                : "Core features active"}
            </div>
          </div>
          <button
            onClick={() => onUpdate({ ...prefs, isPro: !prefs.isPro })}
            style={{
              padding: "10px 20px",
              borderRadius: 14,
              fontWeight: 900,
              fontSize: 12,
              background: "#fff",
              border: "none",
              color: "#000",
              cursor: "pointer",
              textTransform: "uppercase",
            }}
          >
            {prefs.isPro ? "Downgrade" : "Upgrade"}
          </button>
        </Glass>
      </div>

      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: "0.15em",
            color: C.emerald,
            textTransform: "uppercase",
            marginBottom: 16,
          }}
        >
          Application
        </div>
        <Toggle
          label="Daily Intelligence Prompt"
          sub="Show check-in on first open"
          active={prefs.auto_prompt}
          onToggle={() =>
            onUpdate({ ...prefs, auto_prompt: !prefs.auto_prompt })
          }
        />
        <Toggle
          label="Daily Adaptive Replan"
          sub="Pro only — regenerates plan each morning"
          active={prefs.daily_replan && prefs.isPro}
          onToggle={() =>
            prefs.isPro &&
            onUpdate({ ...prefs, daily_replan: !prefs.daily_replan })
          }
        />
      </div>

      <div>
        {/* Security — Passkey */}
        {passkeySupported && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", color: C.emerald, textTransform: "uppercase", marginBottom: 16 }}>
              Security
            </div>
            <Glass style={{ padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 4 }}>Face ID / Touch ID</div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 16, lineHeight: 1.6 }}>
                Register a passkey so you can log in with biometrics — no password needed.
              </div>
              {passkeyMsg && (
                <div style={{
                  fontSize: 12, padding: "10px 14px", borderRadius: 10, marginBottom: 14,
                  background: passkeyMsg.startsWith("✓") ? "rgba(16,185,129,0.1)" : "rgba(226,76,74,0.1)",
                  border: `1px solid ${passkeyMsg.startsWith("✓") ? "rgba(16,185,129,0.3)" : "rgba(226,76,74,0.3)"}`,
                  color: passkeyMsg.startsWith("✓") ? C.emerald : "#f87171",
                }}>
                  {passkeyMsg}
                </div>
              )}
              <button
                onClick={handleAddPasskey}
                disabled={addingPasskey}
                style={{
                  width: "100%", padding: "11px 16px", borderRadius: 12,
                  background: addingPasskey ? "rgba(255,255,255,0.03)" : C.emeraldDim,
                  border: `1px solid ${C.emeraldBorder}`,
                  color: C.emerald, fontWeight: 800, fontSize: 13,
                  cursor: addingPasskey ? "not-allowed" : "pointer",
                  opacity: addingPasskey ? 0.6 : 1,
                }}
              >
                {addingPasskey ? "Follow your device prompt…" : "Add Face ID / Touch ID"}
              </button>
            </Glass>
          </div>
        )}

        <div
          style={{
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: "0.15em",
            color: C.emerald,
            textTransform: "uppercase",
            marginBottom: 16,
          }}
        >
          Account
        </div>
        <Glass
          style={{
            padding: 20,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
            Guest ID
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: C.muted,
              fontFamily: "monospace",
            }}
          >
            {userId?.slice(0, 16)}...
          </span>
        </Glass>
      </div>

      {/* ── Your body — only shown to female users ── */}
      {prefs.sex === "female" && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", color: C.emerald, textTransform: "uppercase", marginBottom: 16 }}>
            Your body
          </div>

          <Glass style={{ padding: 20, marginBottom: 12 }}>
            {/* Cycle tracking mode */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>Cycle tracking</div>
                {cycleTrackingMode === "smart" && prefs.cycle?.current_phase && (
                  <div style={{ fontSize: 12, color: "rgba(167,139,250,0.8)", marginTop: 3 }}>
                    Currently in your {PHASE_LABELS[prefs.cycle.current_phase]} · Day {prefs.cycle.cycle_day}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {["smart", "off"].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setCycleTrackingMode(mode)}
                    style={{
                      padding: "6px 12px", borderRadius: 10, fontSize: 12, fontWeight: 700,
                      border: `1px solid ${cycleTrackingMode === mode ? C.emeraldBorder : C.border}`,
                      background: cycleTrackingMode === mode ? C.emeraldDim : "rgba(255,255,255,0.03)",
                      color: cycleTrackingMode === mode ? C.emerald : C.muted, cursor: "pointer",
                    }}
                  >
                    {mode === "smart" ? "Smart" : "Off"}
                  </button>
                ))}
              </div>
            </div>

            {cycleTrackingMode === "smart" && (
              <>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>Last period started</div>
                <input
                  type="date"
                  value={lastPeriodStart}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setLastPeriodStart(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, color: C.text, fontSize: 14, outline: "none", fontFamily: "inherit", marginBottom: 14, boxSizing: "border-box" }}
                />

                <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>Cycle length</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                  {CYCLE_LENGTHS_SETTINGS.map((d) => (
                    <button
                      key={d}
                      onClick={() => setCycleLength(d)}
                      style={{ padding: "6px 11px", borderRadius: 999, fontSize: 12, fontWeight: 700, border: `1px solid ${cycleLength === d ? C.emeraldBorder : C.border}`, background: cycleLength === d ? C.emeraldDim : "rgba(255,255,255,0.03)", color: cycleLength === d ? C.emerald : C.muted, cursor: "pointer" }}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
              </>
            )}

            <button
              disabled={cycleSaving}
              onClick={async () => {
                setCycleSaving(true);
                try {
                  await api.saveProfile(token, {
                    cycle: { tracking_mode: cycleTrackingMode, cycle_length_days: cycleLength, last_period_start: lastPeriodStart || undefined },
                  });
                  onUpdate((p) => ({ ...p, cycle: { ...(p.cycle ?? {}), tracking_mode: cycleTrackingMode, cycle_length_days: cycleLength, last_period_start: lastPeriodStart } }));
                } catch {}
                setCycleSaving(false);
              }}
              style={{ width: "100%", padding: "10px 16px", borderRadius: 12, background: cycleSaving ? "rgba(255,255,255,0.03)" : C.emeraldDim, border: `1px solid ${C.emeraldBorder}`, color: C.emerald, fontWeight: 800, fontSize: 13, cursor: cycleSaving ? "not-allowed" : "pointer" }}
            >
              {cycleSaving ? "Saving…" : "Save"}
            </button>
          </Glass>

          {/* ── Pregnancy mode card ── */}
          {bodyMode === "standard" && pregnancySetupStep === 0 && (
            <Glass style={{ padding: 20, marginBottom: 12, border: "1px solid rgba(251,191,36,0.15)" }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 6 }}>Expecting?</div>
              <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6, marginBottom: 14 }}>
                JustFit can switch to a pregnancy-safe programme — adapted to your trimester, pelvic floor, and energy levels.
              </div>
              <button
                onClick={() => setPregnancySetupStep(1)}
                style={{ padding: "9px 16px", borderRadius: 10, fontSize: 13, fontWeight: 700, border: "1px solid rgba(251,191,36,0.3)", background: "rgba(251,191,36,0.08)", color: "#fbbf24", cursor: "pointer" }}
              >
                I'm pregnant
              </button>
            </Glass>
          )}

          {bodyMode === "standard" && pregnancySetupStep === 1 && (
            <Glass style={{ padding: 20, marginBottom: 12, border: "1px solid rgba(251,191,36,0.25)" }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#fbbf24", marginBottom: 12 }}>Step 1 of 2 — Medical guidance</div>
              <div style={{ fontSize: 12, color: C.text, lineHeight: 1.7, marginBottom: 16 }}>
                JustFit is a fitness app, not a medical service. Please confirm that you have discussed or will discuss exercise during pregnancy with your midwife, GP, or OB-GYN.
              </div>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", marginBottom: 20 }}>
                <input
                  type="checkbox"
                  checked={medicalClearance}
                  onChange={(e) => setMedicalClearance(e.target.checked)}
                  style={{ marginTop: 2, accentColor: "#fbbf24", width: 16, height: 16, flexShrink: 0 }}
                />
                <span style={{ fontSize: 12, color: C.text, lineHeight: 1.6 }}>
                  I confirm I will seek medical guidance regarding exercise during my pregnancy.
                </span>
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => { setPregnancySetupStep(0); setMedicalClearance(false); }}
                  style={{ flex: 1, padding: "9px 12px", borderRadius: 10, fontSize: 13, fontWeight: 700, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.03)", color: C.muted, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  disabled={!medicalClearance}
                  onClick={() => setPregnancySetupStep(2)}
                  style={{ flex: 2, padding: "9px 12px", borderRadius: 10, fontSize: 13, fontWeight: 700, border: "1px solid rgba(251,191,36,0.3)", background: medicalClearance ? "rgba(251,191,36,0.12)" : "rgba(255,255,255,0.03)", color: medicalClearance ? "#fbbf24" : C.muted, cursor: medicalClearance ? "pointer" : "not-allowed" }}
                >
                  Continue
                </button>
              </div>
            </Glass>
          )}

          {bodyMode === "standard" && pregnancySetupStep === 2 && (
            <Glass style={{ padding: 20, marginBottom: 12, border: "1px solid rgba(251,191,36,0.25)" }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#fbbf24", marginBottom: 12 }}>Step 2 of 2 — Your due date</div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>When is your estimated due date?</div>
              <input
                type="date"
                value={pregnancyDueDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setPregnancyDueDate(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, color: C.text, fontSize: 14, outline: "none", fontFamily: "inherit", marginBottom: 16, boxSizing: "border-box" }}
              />
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 16, lineHeight: 1.6 }}>
                Your due date helps us calculate your pregnancy week and adapt sessions to your trimester. You can update it anytime.
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setPregnancySetupStep(1)}
                  style={{ flex: 1, padding: "9px 12px", borderRadius: 10, fontSize: 13, fontWeight: 700, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.03)", color: C.muted, cursor: "pointer" }}
                >
                  Back
                </button>
                <button
                  disabled={!pregnancyDueDate || pregnancySaving}
                  onClick={async () => {
                    setPregnancySaving(true);
                    try {
                      await api.saveProfile(token, {
                        cycle: {
                          tracking_mode: "off",
                          mode: "pregnant",
                          pregnancy_due_date: pregnancyDueDate,
                          medical_clearance_confirmed: true,
                        },
                      });
                      setBodyMode("pregnant");
                      setPregnancySetupStep(0);
                      onUpdate((p) => ({
                        ...p,
                        cycle: {
                          ...(p.cycle ?? {}),
                          mode: "pregnant",
                          tracking_mode: "off",
                          pregnancy_due_date: pregnancyDueDate,
                          medical_clearance_confirmed: 1,
                        },
                      }));
                    } catch {}
                    setPregnancySaving(false);
                  }}
                  style={{ flex: 2, padding: "9px 12px", borderRadius: 10, fontSize: 13, fontWeight: 700, border: "1px solid rgba(251,191,36,0.3)", background: pregnancyDueDate && !pregnancySaving ? "rgba(251,191,36,0.12)" : "rgba(255,255,255,0.03)", color: pregnancyDueDate && !pregnancySaving ? "#fbbf24" : C.muted, cursor: pregnancyDueDate && !pregnancySaving ? "pointer" : "not-allowed" }}
                >
                  {pregnancySaving ? "Saving…" : "Enable pregnancy mode"}
                </button>
              </div>
            </Glass>
          )}

          {bodyMode === "pregnant" && (
            <Glass style={{ padding: 20, marginBottom: 12, border: "1px solid rgba(251,191,36,0.25)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#fbbf24" }}>Pregnancy mode active</div>
                  {prefs.cycle?.pregnancy_week && (
                    <div style={{ fontSize: 12, color: "rgba(251,191,36,0.7)", marginTop: 3 }}>
                      Week {prefs.cycle.pregnancy_week} · Trimester {prefs.cycle.trimester}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 14, lineHeight: 1.6 }}>
                Your sessions are adapted for pregnancy — pelvic floor included, high-impact excluded, intensity matched to your trimester.
              </div>
              {pregnancyDueDate && (
                <>
                  <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>Due date</div>
                  <input
                    type="date"
                    value={pregnancyDueDate}
                    onChange={(e) => setPregnancyDueDate(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, color: C.text, fontSize: 14, outline: "none", fontFamily: "inherit", marginBottom: 12, boxSizing: "border-box" }}
                  />
                  <button
                    disabled={pregnancySaving}
                    onClick={async () => {
                      setPregnancySaving(true);
                      try {
                        await api.saveProfile(token, {
                          cycle: { mode: "pregnant", pregnancy_due_date: pregnancyDueDate, tracking_mode: "off" },
                        });
                        onUpdate((p) => ({ ...p, cycle: { ...(p.cycle ?? {}), pregnancy_due_date: pregnancyDueDate } }));
                      } catch {}
                      setPregnancySaving(false);
                    }}
                    style={{ width: "100%", padding: "9px 16px", borderRadius: 10, fontSize: 13, fontWeight: 700, border: "1px solid rgba(251,191,36,0.3)", background: pregnancySaving ? "rgba(255,255,255,0.03)" : "rgba(251,191,36,0.1)", color: pregnancySaving ? C.muted : "#fbbf24", cursor: pregnancySaving ? "not-allowed" : "pointer", marginBottom: 12 }}
                  >
                    {pregnancySaving ? "Saving…" : "Update due date"}
                  </button>
                </>
              )}
              {/* Baby arrived prompt — show when due date has passed */}
              {prefs.cycle?.pregnancy_due_date && new Date(prefs.cycle.pregnancy_due_date) <= new Date() && postnatalSetupStep === 0 && (
                <div style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 10, padding: 14, marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#fbbf24", marginBottom: 6 }}>Has your baby arrived?</div>
                  <div style={{ fontSize: 12, color: C.muted, marginBottom: 12, lineHeight: 1.6 }}>
                    When you're ready, switch to postnatal mode for a gentle recovery programme.
                  </div>
                  <button
                    onClick={() => setPostnatalSetupStep(1)}
                    style={{ padding: "8px 14px", borderRadius: 9, fontSize: 12, fontWeight: 700, border: "1px solid rgba(251,191,36,0.3)", background: "rgba(251,191,36,0.1)", color: "#fbbf24", cursor: "pointer" }}
                  >
                    Yes — set up postnatal mode
                  </button>
                </div>
              )}

              {postnatalSetupStep === 1 && (
                <div style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 10, padding: 14, marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#fbbf24", marginBottom: 10 }}>Step 1 of 2 — Birth date</div>
                  <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>When did your baby arrive?</div>
                  <input
                    type="date"
                    value={postnatalBirthDate}
                    max={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setPostnatalBirthDate(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, color: C.text, fontSize: 14, outline: "none", fontFamily: "inherit", marginBottom: 12, boxSizing: "border-box" }}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setPostnatalSetupStep(0)} style={{ flex: 1, padding: "8px 12px", borderRadius: 9, fontSize: 12, fontWeight: 700, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.03)", color: C.muted, cursor: "pointer" }}>Cancel</button>
                    <button
                      disabled={!postnatalBirthDate}
                      onClick={() => setPostnatalSetupStep(2)}
                      style={{ flex: 2, padding: "8px 12px", borderRadius: 9, fontSize: 12, fontWeight: 700, border: "1px solid rgba(251,191,36,0.3)", background: postnatalBirthDate ? "rgba(251,191,36,0.1)" : "rgba(255,255,255,0.03)", color: postnatalBirthDate ? "#fbbf24" : C.muted, cursor: postnatalBirthDate ? "pointer" : "not-allowed" }}
                    >Continue</button>
                  </div>
                </div>
              )}

              {postnatalSetupStep === 2 && (
                <div style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 10, padding: 14, marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#fbbf24", marginBottom: 10 }}>Step 2 of 2 — Birth type</div>
                  <div style={{ fontSize: 12, color: C.muted, marginBottom: 10, lineHeight: 1.6 }}>This helps us adapt your recovery timeline. (Optional)</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                    {[["vaginal", "Vaginal"], ["caesarean", "Caesarean"], ["prefer_not_to_say", "Prefer not to say"]].map(([val, label]) => (
                      <button
                        key={val}
                        onClick={() => setPostnatalBirthType(val)}
                        style={{ padding: "7px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700, border: `1px solid ${postnatalBirthType === val ? "rgba(251,191,36,0.4)" : C.border}`, background: postnatalBirthType === val ? "rgba(251,191,36,0.12)" : "rgba(255,255,255,0.03)", color: postnatalBirthType === val ? "#fbbf24" : C.muted, cursor: "pointer" }}
                      >{label}</button>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setPostnatalSetupStep(1)} style={{ flex: 1, padding: "8px 12px", borderRadius: 9, fontSize: 12, fontWeight: 700, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.03)", color: C.muted, cursor: "pointer" }}>Back</button>
                    <button
                      disabled={postnatalSaving}
                      onClick={async () => {
                        setPostnatalSaving(true);
                        try {
                          await api.saveProfile(token, {
                            cycle: {
                              mode: "postnatal",
                              tracking_mode: "off",
                              postnatal_birth_date: postnatalBirthDate,
                              postnatal_birth_type: postnatalBirthType || "prefer_not_to_say",
                            },
                          });
                          setBodyMode("postnatal");
                          setPostnatalSetupStep(0);
                          onUpdate((p) => ({
                            ...p,
                            cycle: {
                              ...(p.cycle ?? {}),
                              mode: "postnatal",
                              postnatal_birth_date: postnatalBirthDate,
                              postnatal_birth_type: postnatalBirthType || "prefer_not_to_say",
                            },
                          }));
                        } catch {}
                        setPostnatalSaving(false);
                      }}
                      style={{ flex: 2, padding: "8px 12px", borderRadius: 9, fontSize: 12, fontWeight: 700, border: "1px solid rgba(251,191,36,0.3)", background: postnatalSaving ? "rgba(255,255,255,0.03)" : "rgba(251,191,36,0.1)", color: postnatalSaving ? C.muted : "#fbbf24", cursor: postnatalSaving ? "not-allowed" : "pointer" }}
                    >{postnatalSaving ? "Saving…" : "Start postnatal mode"}</button>
                  </div>
                </div>
              )}

              <button
                onClick={async () => {
                  if (!confirm("Switch back to standard mode? Your pregnancy data will be kept.")) return;
                  setPregnancySaving(true);
                  try {
                    await api.saveProfile(token, {
                      cycle: { mode: "standard", tracking_mode: "off" },
                    });
                    setBodyMode("standard");
                    onUpdate((p) => ({ ...p, cycle: { ...(p.cycle ?? {}), mode: "standard" } }));
                  } catch {}
                  setPregnancySaving(false);
                }}
                style={{ width: "100%", padding: "9px 16px", borderRadius: 10, fontSize: 12, fontWeight: 700, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.03)", color: C.muted, cursor: "pointer" }}
              >
                Leave pregnancy mode
              </button>
            </Glass>
          )}

          {/* ── Postnatal mode card ── */}
          {bodyMode === "postnatal" && (
            <Glass style={{ padding: 20, marginBottom: 12, border: "1px solid rgba(251,191,36,0.2)" }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#fbbf24", marginBottom: 4 }}>Postnatal mode active</div>
              {prefs.cycle?.postnatal_phase && (
                <div style={{ fontSize: 12, color: "rgba(251,191,36,0.7)", marginBottom: 12 }}>
                  {{ immediate: "Immediate recovery (0–2 wks)", early: "Early recovery (2–6 wks)", rebuilding: "Rebuilding (6–16 wks)", strengthening: "Strengthening (16–26 wks)", returning: "Returning to fitness (26+ wks)" }[prefs.cycle.postnatal_phase]}
                </div>
              )}
              <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6, marginBottom: 14 }}>
                Your programme is adapted to your postnatal phase — pelvic floor foundation first, progressive rebuilding as you heal.
              </div>
              <button
                onClick={async () => {
                  if (!confirm("Switch back to standard mode?")) return;
                  setPostnatalSaving(true);
                  try {
                    await api.saveProfile(token, { cycle: { mode: "standard", tracking_mode: "off" } });
                    setBodyMode("standard");
                    onUpdate((p) => ({ ...p, cycle: { ...(p.cycle ?? {}), mode: "standard" } }));
                  } catch {}
                  setPostnatalSaving(false);
                }}
                style={{ width: "100%", padding: "9px 16px", borderRadius: 10, fontSize: 12, fontWeight: 700, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.03)", color: C.muted, cursor: "pointer" }}
              >
                Leave postnatal mode
              </button>
            </Glass>
          )}

          <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.6, padding: "0 4px" }}>
            Your body data is stored privately on your device and our secure servers. It is never shared, sold, or used for advertising. Ever.
          </div>
        </div>
      )}

      <div style={{marginTop:24}}>
        <button onClick={logout} style={{
          width:"100%", padding:14, borderRadius:14,
          background:"rgba(226,76,74,0.1)", border:"1px solid rgba(226,76,74,0.3)",
          color:"#f87171", fontWeight:900, fontSize:14, cursor:"pointer"
        }}>
          Sign Out
        </button>
      </div>

      <p
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.1em",
          color: C.subtle,
          textTransform: "uppercase",
          textAlign: "center",
          marginTop: 40,
        }}
      >
        JustFit.cc — System Operational
      </p>
    </div>
  );
}

// ─── WEEKLY PLAN VIEW ─────────────────────────────────────────────────────────
function PlanWeekView({ history }) {
  const today = new Date().toISOString().split("T")[0];

  // Build last 7 days
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  // Map history by date for quick lookup
  const doneByDate = {};
  (history || []).forEach((ex) => {
    if (ex.date) doneByDate[ex.date] = ex;
  });

  return (
    <div style={{ padding: "0 0 32px" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.02em", color: C.text, marginBottom: 4 }}>
          This Week
        </div>
        <div style={{ fontSize: 13, color: C.muted }}>Your last 7 days at a glance</div>
      </div>

      {/* 7-day strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 8, marginBottom: 32 }}>
        {days.map((date) => {
          const d = new Date(date + "T12:00:00");
          const done = !!doneByDate[date];
          const isToday = date === today;
          const isFuture = date > today;

          return (
            <div
              key={date}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                padding: "12px 4px",
                borderRadius: 16,
                background: isToday
                  ? C.emeraldDim
                  : done
                    ? "rgba(16,185,129,0.06)"
                    : "rgba(255,255,255,0.02)",
                border: `1px solid ${isToday ? C.emeraldBorder : done ? "rgba(16,185,129,0.2)" : C.border}`,
              }}
            >
              <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.08em", color: isToday ? C.emerald : C.muted, textTransform: "uppercase" }}>
                {dayNames[d.getDay()]}
              </span>
              <span style={{ fontSize: 15, fontWeight: 900, color: isToday ? C.emerald : isFuture ? C.subtle : C.text }}>
                {d.getDate()}
              </span>
              {/* Status dot */}
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: done
                    ? C.emerald
                    : isFuture
                      ? "transparent"
                      : "rgba(255,255,255,0.1)",
                  border: done ? "none" : isFuture ? `1px dashed ${C.subtle}` : `1px solid ${C.subtle}`,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Sessions this week */}
      <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", color: C.emerald, textTransform: "uppercase", marginBottom: 16 }}>
        Completed Sessions
      </div>

      {days.filter((d) => doneByDate[d]).length === 0 ? (
        <Glass style={{ padding: 28, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🏃</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 6 }}>No sessions yet this week</div>
          <div style={{ fontSize: 13, color: C.muted }}>Complete today's session to start your streak.</div>
        </Glass>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {days
            .filter((d) => doneByDate[d])
            .reverse()
            .map((date) => {
              const ex = doneByDate[date];
              const d = new Date(date + "T12:00:00");
              const mins = ex.total_duration_sec ? Math.round(ex.total_duration_sec / 60) : null;
              return (
                <Glass key={date} style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 3 }}>
                      {ex.execution_type || "Training Session"}
                    </div>
                    <div style={{ fontSize: 12, color: C.muted }}>
                      {dayNames[d.getDay()]}, {monthNames[d.getMonth()]} {d.getDate()}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    {mins && (
                      <div style={{ fontSize: 18, fontWeight: 900, color: C.emerald }}>{mins}<span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}> min</span></div>
                    )}
                    {ex.perceived_exertion && (
                      <div style={{ fontSize: 11, color: C.muted }}>RPE {ex.perceived_exertion}</div>
                    )}
                  </div>
                </Glass>
              );
            })}
        </div>
      )}

      {/* Weekly summary */}
      {days.filter((d) => doneByDate[d]).length > 0 && (
        <Glass style={{ padding: 20, marginTop: 16, display: "flex", justifyContent: "space-around", textAlign: "center" }}>
          {[
            { label: "Sessions", value: days.filter((d) => doneByDate[d]).length },
            { label: "Days left", value: days.filter((d) => d >= today && !doneByDate[d]).length },
            {
              label: "Total min",
              value: days
                .filter((d) => doneByDate[d] && doneByDate[d].total_duration_sec)
                .reduce((s, d) => s + Math.round(doneByDate[d].total_duration_sec / 60), 0) || "—",
            },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontSize: 22, fontWeight: 900, color: C.emerald }}>{value}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 3 }}>{label}</div>
            </div>
          ))}
        </Glass>
      )}
    </div>
  );
}

// ─── NAV ──────────────────────────────────────────────────────────────────────
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
        stroke={a ? "#10b981" : "#64748b"}
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
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? "#10b981" : "#64748b"} strokeWidth="2">
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
    label: "History",
    icon: (a) => (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke={a ? "#10b981" : "#64748b"}
        strokeWidth="2"
      >
        <path d="M3 3v5h5" />
        <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
        <path d="M12 7v5l4 2" />
      </svg>
    ),
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
        stroke={a ? "#10b981" : "#64748b"}
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
        stroke={a ? "#10b981" : "#64748b"}
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
        paddingBottom: 16,
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

  useEffect(() => {
    if (!userId || !token) {
      window.location.href = "/login.html";
    }
  }, []);

  const today = new Date().toISOString().split("T")[0];

  const [view, setView] = useState("today");
  const [inWorkout, setInWorkout] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [plan, setPlan] = useState(null);
  const [score, setScore] = useState(0);
  const [prevScore, setPrevScore] = useState(0);
  const [history, setHistory] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

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

  // Onboarding / waiver flow
  const [showWaiver, setShowWaiver] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingReady, setOnboardingReady] = useState(false);

  const [prefs, setPrefs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("jf_prefs") || "{}");
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("jf_prefs", JSON.stringify(prefs));
    } catch {}
  }, [prefs]);

  // On mount: check waiver → check profile
  useEffect(() => {
    if (!userId || !token) return;
    const waiverAccepted = localStorage.getItem("jf_waiver") === "1";
    if (!waiverAccepted) {
      setShowWaiver(true);
      return;
    }
    // Waiver already done — check if profile exists
    api.getProfile(token).then((data) => {
      if (!data.exists) {
        setShowOnboarding(true);
      } else {
        if (data.sex) setPrefs((p) => ({ ...p, sex: data.sex, weight_kg: data.weight_kg ?? p.weight_kg, cycle: data.cycle ?? p.cycle, mode: data.cycle?.mode ?? p.mode }));
        setOnboardingReady(true);
      }
    }).catch(() => setOnboardingReady(true));
  }, []);

  const handleWaiverAccept = () => {
    localStorage.setItem("jf_waiver", "1");
    setShowWaiver(false);
    // Now check profile
    api.getProfile(token).then((data) => {
      if (!data.exists) {
        setShowOnboarding(true);
      } else {
        if (data.sex) setPrefs((p) => ({ ...p, sex: data.sex, weight_kg: data.weight_kg ?? p.weight_kg, cycle: data.cycle ?? p.cycle, mode: data.cycle?.mode ?? p.mode }));
        setOnboardingReady(true);
      }
    }).catch(() => setOnboardingReady(true));
  };

  const handleOnboardingComplete = (profileData) => {
    setShowOnboarding(false);
    setOnboardingReady(true);
    // Merge profile data into local prefs for immediate use
    if (profileData) {
      setPrefs((p) => ({ ...p, ...profileData }));
    }
    // Trigger check-in / plan generation
    if (prefs.auto_prompt !== false) setShowCheckIn(true);
  };

  // Load score and history from API on mount (only after onboarding done)
  useEffect(() => {
    if (!onboardingReady) return;
    api
      .getScore(userId)
      .then(setScore)
      .catch(() => {});
    setIsLoadingHistory(true);
    api
      .getHistory(userId)
      .then((h) => {
        setHistory(h);
        setIsLoadingHistory(false);
      })
      .catch(() => setIsLoadingHistory(false));
  }, [userId, onboardingReady]);

  // Show check-in on first open if enabled (only after onboarding done)
  useEffect(() => {
    if (!onboardingReady) return;
    if (prefs.auto_prompt !== false) setShowCheckIn(true);
  }, [onboardingReady]);

  const handleCheckIn = useCallback(
    async (data) => {
      setShowCheckIn(false);
      setIsGenerating(true);
      try {
        // Auto-log period if toggled and cycle tracking is active
        if (data.checkin_json?.period_today && userId) {
          api.logPeriod(userId, today).catch(() => {});
        }
        const newPlan = await api.generatePlan(userId, today, data);
        setPlan(newPlan);
      } catch (e) {
        console.error("Plan generation failed:", e);
      } finally {
        setIsGenerating(false);
      }
    },
    [userId, today],
  );

  const handleComplete = useCallback(
    async (durationSec, perceivedExertion, stepsActual) => {
      try {
        const mergedSteps = (stepsActual ?? plan?.steps ?? []);
        await api.saveExecution(
          userId,
          plan?.id,
          today,
          mergedSteps,
          durationSec,
          perceivedExertion,
        );
        const [newScore, newHistory] = await Promise.all([
          api.getScore(userId),
          api.getHistory(userId),
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

  const handleBonusComplete = useCallback(
    async (durationSec, perceivedExertion, stepsActual) => {
      try {
        const mergedSteps = stepsActual ?? bonusPlan?.steps ?? [];
        await api.saveExecution(userId, bonusPlan?.id, today, mergedSteps, durationSec, perceivedExertion);
        const [newScore, newHistory] = await Promise.all([
          api.getScore(userId),
          api.getHistory(userId),
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
          api.getScore(userId),
          api.getHistory(userId),
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
        const newPlan = await api.generatePlan(userId, today, checkinOverride);
        setPlan(newPlan);
      } catch (e) {
        console.error("Plan regen failed:", e);
      } finally {
        setIsGenerating(false);
      }
    },
    [userId, today],
  );

  const handleRestDay = useCallback(async () => {
    setShowWhyNot(false);
    try {
      await api.saveActivity(userId, today, "recovery", 0);
      const [newScore, newHistory] = await Promise.all([
        api.getScore(userId),
        api.getHistory(userId),
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
        button:focus-visible { outline: 2px solid #10b981; outline-offset: 2px; }
      `}</style>

      <div
        style={{ maxWidth: 760, margin: "0 auto", padding: "40px 20px 120px" }}
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
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  background: C.emerald,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: 14,
                  color: "#fff",
                  boxShadow: "0 4px 20px rgba(16,185,129,0.3)",
                }}
              >
                JF
              </div>
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
            <button
              onClick={() => setShowCheckIn(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "9px 18px",
                borderRadius: 14,
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                background: "rgba(255,255,255,0.05)",
                border: `1px solid ${C.border}`,
                color: C.muted,
                cursor: "pointer",
              }}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke={C.emerald}
                strokeWidth="2.5"
              >
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                <path d="M19 3v4" />
                <path d="M21 5h-4" />
              </svg>
              Recalibrate
            </button>
          </header>
        )}

        {inBonusWorkout && bonusPlan ? (
          <WorkoutView
            plan={bonusPlan}
            onComplete={handleBonusComplete}
            onBack={() => { setInBonusWorkout(false); setBonusPlan(null); }}
            cycle={prefs.cycle}
          />
        ) : inWorkout ? (
          <WorkoutView
            plan={plan}
            onComplete={handleComplete}
            onBack={() => setInWorkout(false)}
            cycle={prefs.cycle}
          />
        ) : (
          <>
            {view === "today" && (
              <>
                <PregnancyProgressBanner cycle={prefs.cycle} />
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
                />
              </>
            )}
            {view === "plan" && (
              <PlanWeekView history={history} />
            )}
            {view === "history" && (
              <HistoryView history={history} isLoading={isLoadingHistory} />
            )}
            {view === "awards" && (
              <AwardsView
                history={history}
                score={score}
                isPro={!!prefs.isPro}
              />
            )}
            {view === "settings" && (
              <SettingsView prefs={prefs} onUpdate={setPrefs} userId={userId} token={token} />
            )}
          </>
        )}
      </div>

      {!inWorkout && <Nav view={view} setView={setView} />}

      {showCheckIn && (
        <CheckInModal
          onSave={handleCheckIn}
          onClose={() => setShowCheckIn(false)}
          isPro={!!prefs.isPro}
          sex={prefs.sex}
          cycle={prefs.cycle}
        />
      )}

      {showWaiver && <EUWaiverModal onAccept={handleWaiverAccept} />}

      {showOnboarding && !showWaiver && (
        <OnboardingModal token={token} onComplete={handleOnboardingComplete} />
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

      {activityToast && (
        <div style={{ position: "fixed", bottom: 100, left: "50%", transform: "translateX(-50%)", background: "#0d1626", border: `1px solid ${C.emeraldBorder}`, borderRadius: 14, padding: "12px 24px", fontSize: 14, fontWeight: 800, color: C.emerald, zIndex: 200, boxShadow: "0 8px 30px rgba(0,0,0,0.4)" }}>
          {activityToast}
        </div>
      )}
    </div>
  );
}
