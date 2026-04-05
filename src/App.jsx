import { useState, useEffect, useCallback, useRef } from "react";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  bg: "#020617",
  bgCard: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",
  borderHover: "rgba(255,255,255,0.14)",
  emerald: "var(--accent)",
  emeraldDim: "var(--accent-dim)",
  emeraldBorder: "var(--accent-border)",
  text: "#f8fafc",
  muted: "#64748b",
  subtle: "#334155",
};

// ─── ACCENT COLOUR SYSTEM ─────────────────────────────────────────────────────
const ACCENT_COLORS = [
  { id: "emerald", hex: "#10b981", name: "Emerald"  },
  { id: "violet",  hex: "#8b5cf6", name: "Violet"   },
  { id: "sky",     hex: "#0ea5e9", name: "Sky"       },
  { id: "rose",    hex: "#f43f5e", name: "Rose"      },
  { id: "amber",   hex: "#f59e0b", name: "Amber"     },
  { id: "indigo",  hex: "#6366f1", name: "Indigo"    },
  { id: "lime",    hex: "#84cc16", name: "Lime"      },
  { id: "cyan",    hex: "#06b6d4", name: "Cyan"      },
  { id: "orange",  hex: "#f97316", name: "Orange"    },
  { id: "fuchsia", hex: "#d946ef", name: "Fuchsia"   },
  { id: "coral",   hex: "#fb7185", name: "Coral"     },
];
function hexToRgbParts(hex) {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(",");
}
function applyAccent(hex) {
  const rgb = hexToRgbParts(hex);
  const root = document.documentElement;
  root.style.setProperty("--accent",        hex);
  root.style.setProperty("--accent-rgb",    rgb);
  root.style.setProperty("--accent-dim",    `rgba(${rgb},0.15)`);
  root.style.setProperty("--accent-border", `rgba(${rgb},0.3)`);
}
// Apply saved accent before first render (avoids flash of default colour)
applyAccent(localStorage.getItem("jf_accent") ?? "#10b981");

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

  async saveExecution(userId, planId, date, steps, durationSec, perceivedExertion, sessionType = "workout") {
    const res = await fetch("/api/execution", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        date,
        day_plan_id: planId ?? null,
        session_type: sessionType,
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

  async getExercisesBySlugs(slugs) {
    const res = await fetch("/api/exercises");
    const data = await res.json();
    const all = data.exercises ?? [];
    return all.filter((ex) => slugs.includes(ex.slug));
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
        bonus_session: true,
      }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error);
    return data.plan;
  },

  async getTodayPlan(userId, date) {
    const res = await fetch(`/api/plan?user_id=${userId}&date=${date}`);
    const data = await res.json();
    if (!data.plan) return null;
    const planObj = typeof data.plan.plan_json === "string" ? JSON.parse(data.plan.plan_json) : data.plan.plan_json;
    return { id: data.plan.id, ...planObj };
  },

  async getLastCheckin(userId) {
    const res = await fetch(`/api/checkin?user_id=${userId}`);
    const data = await res.json();
    return (data.checkins ?? [])[0] ?? null;
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

  async deleteExecution(executionId, userId) {
    const res = await fetch(`/api/execution?execution_id=${executionId}&user_id=${userId}`, {
      method: "DELETE",
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
        background: "rgba(var(--accent-rgb),0.08)",
        border: "1px solid rgba(var(--accent-rgb),0.2)",
        borderRadius: 999,
        padding: "6px 14px",
        fontSize: 12,
        fontWeight: 700,
        color: "var(--accent)",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "var(--accent)",
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
      background: active ? "rgba(var(--accent-rgb),0.08)" : "rgba(255,255,255,0.03)",
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
              value === v ? "0 4px 20px rgba(var(--accent-rgb),0.25)" : "none",
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
            boxShadow: "0 8px 32px rgba(var(--accent-rgb),0.35)",
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
  { value: "none",           label: "No equipment",     sub: "Bodyweight only" },
  { value: "dumbbell",       label: "Dumbbells",         sub: "Adjustable or fixed" },
  { value: "resistance_bands", label: "Resistance bands", sub: "Light to heavy bands" },
  { value: "pull_up_bar",    label: "Pull-up bar",       sub: "Door-mounted or free-standing" },
  { value: "treadmill",      label: "Treadmill",         sub: "Home or gym treadmill" },
  { value: "exercise_bike",  label: "Stationary bike",   sub: "Upright or spin bike" },
  { value: "indoor_bike",    label: "Indoor bike trainer", sub: "Road bike on trainer" },
  { value: "rowing_machine", label: "Rowing machine",    sub: "Ergometer or water rower" },
];

const ALL_EQUIPMENT = [
  { value: "running_shoes",      label: "Running shoes" },
  { value: "yoga_mat",           label: "Yoga mat" },
  { value: "dumbbell",           label: "Dumbbells" },
  { value: "resistance_bands",   label: "Resistance bands" },
  { value: "jump_rope",          label: "Jump rope" },
  { value: "exercise_mat",       label: "Exercise mat" },
  { value: "foam_roller",        label: "Foam roller" },
  { value: "kettlebell",         label: "Kettlebell" },
  { value: "pull_up_bar",        label: "Pull-up bar" },
  { value: "adjustable_bench",   label: "Adjustable bench" },
  { value: "stability_ball",     label: "Stability ball" },
  { value: "ankle_weights",      label: "Ankle weights" },
  { value: "barbell",            label: "Barbell" },
  { value: "weight_plates",      label: "Weight plates" },
  { value: "push_up_handles",    label: "Push-up handles" },
  { value: "medicine_ball",      label: "Medicine ball" },
  { value: "fitness_tracker",    label: "Fitness tracker" },
  { value: "indoor_bike",        label: "Indoor bike trainer" },
  { value: "exercise_bike",      label: "Stationary bike" },
  { value: "rowing_machine",     label: "Rowing machine" },
  { value: "treadmill",          label: "Treadmill" },
  { value: "suspension_trainer", label: "Suspension trainer" },
  { value: "step_platform",      label: "Step platform" },
  { value: "power_tower",        label: "Power tower" },
  { value: "punching_bag",       label: "Punching bag" },
  { value: "smith_machine",      label: "Smith machine" },
  { value: "elliptical",         label: "Elliptical trainer" },
  { value: "squat_rack",         label: "Home squat rack" },
  { value: "bench_press_rack",   label: "Bench press rack" },
  { value: "multi_gym",          label: "Multi-gym machine" },
];

const SEX_OPTIONS = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Non-binary", value: "non_binary" },
  { label: "Prefer not to say", value: "prefer_not_to_say" },
];

const CYCLE_LENGTHS = [21, 24, 26, 28, 30, 32, 35];

// Bump this when a major update requires existing users to re-confirm their goal.
// Checked against localStorage "jf_version" on every login.
const APP_VERSION = "2";

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
  const DURATION_OPTIONS = [15, 20, 30, 45, 60, 90, 120];

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
                <button
                  onClick={() => setWeightUnit(u => u === "kg" ? "lbs" : "kg")}
                  style={{ padding: "8px 16px", borderRadius: 10, border: `1px solid ${C.emeraldBorder}`, background: C.emeraldDim, color: C.emerald, fontWeight: 900, fontSize: 12, cursor: "pointer", minWidth: 48, flexShrink: 0 }}
                >
                  {weightUnit}
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
              boxShadow: canAdvance ? "0 8px 32px rgba(var(--accent-rgb),0.35)" : "none",
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

// ─── GOAL RECHECK MODAL ───────────────────────────────────────────────────────
// Shown to existing users after a major app update.
// Preserves all current settings — only re-confirms training_goal.
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
        session_duration_min: profileData?.session_duration_min ?? 30,
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
                    <div style={{ fontSize: 13, color: "#f43f5e", fontWeight: 800, marginBottom: 8 }}>Birth date <span style={{ fontWeight: 500, color: C.muted }}>(optional)</span></div>
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
                      padding: "14px 12px", borderRadius: 14,
                      border: `1px solid ${goal === g.value ? C.emeraldBorder : C.border}`,
                      background: goal === g.value ? C.emeraldDim : "rgba(255,255,255,0.03)",
                      color: goal === g.value ? C.emerald : C.muted,
                      fontWeight: 700, fontSize: 13, cursor: "pointer", textAlign: "left",
                    }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{g.icon}</div>
                    <div>{g.label}</div>
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
const TIME_OPTIONS = [5, 10, 15, 20, 30, 45, 60, 90, 120];

function CheckInModal({ onSave, onClose, isPro, sex, cycle, defaultTimeBudget, lastCheckin }) {
  const bodyMode = cycle?.mode ?? "standard";
  const showPeriodToggle = sex === "female" && bodyMode === "standard";
  const [d, setD] = useState(() => {
    // First-check-in defaults (from design spec)
    const defaults = {
      energy: 4, sleep_hours: 8, motivation: 4, stress: 1,
      time_budget: defaultTimeBudget ?? 30,
      no_clothing: false, no_gear: false, no_time: false,
      gym_today: false, traveling: false, pain_level: 0,
      period_today: false, free_text: "",
      pregnancy_signals: { nausea: false, breathless: false, pelvic_discomfort: false },
      postnatal_signals: { running_today: false, heaviness: false },
    };
    if (!lastCheckin) return defaults;
    // Pre-fill vitals from last check-in; reset situational toggles
    const cj = typeof lastCheckin.checkin_json === "string"
      ? JSON.parse(lastCheckin.checkin_json)
      : (lastCheckin.checkin_json ?? {});
    return {
      ...defaults,
      energy:      lastCheckin.energy      ? Math.round(lastCheckin.energy / 2)   : defaults.energy,
      sleep_hours: lastCheckin.sleep_hours ?? defaults.sleep_hours,
      motivation:  cj.motivation           ? Math.round(cj.motivation / 2)        : defaults.motivation,
      stress:      lastCheckin.stress      ? Math.round(lastCheckin.stress / 2)   : defaults.stress,
      pain_level:  cj.pain_level ?? 0,
      // time_budget comes from schedule (defaultTimeBudget), not last check-in
    };
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
              boxShadow: "0 8px 30px rgba(var(--accent-rgb),0.3)",
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
  const [dismissed, setDismissed] = useState(() => {
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
function useNarrow(bp = 600) {
  const [narrow, setNarrow] = useState(() => window.innerWidth < bp);
  useEffect(() => {
    const fn = () => setNarrow(window.innerWidth < bp);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, [bp]);
  return narrow;
}

function Dashboard({ plan, score, prevScore, onStartWorkout, isGenerating, todayCompleted, completedSession, onLogActivity, onBonusSession, bonusDone, onWhyNot, prefs }) {
  const isMobile = useNarrow();
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
          gridTemplateColumns: isMobile ? "1fr" : "5fr 7fr",
          gap: 16,
          marginBottom: 16,
        }}
      >
        {/* Score card */}
        <Glass
          style={{
            order: isMobile ? 2 : 0,
            padding: isMobile ? "16px 20px" : 28,
            minHeight: isMobile ? 0 : 220,
            display: "flex",
            flexDirection: isMobile ? "row" : "column",
            alignItems: isMobile ? "center" : undefined,
            justifyContent: isMobile ? "space-between" : "space-between",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {isMobile ? (
            /* ── Compact horizontal strip (mobile) ── */
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 32, height: 32, borderRadius: 10,
                    background: C.emeraldDim,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.emerald} strokeWidth="2.5">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </div>
                <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", color: "rgba(var(--accent-rgb),0.7)", textTransform: "uppercase" }}>
                  Consistency
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontSize: 44, fontWeight: 900, color: C.text, lineHeight: 1, letterSpacing: "-0.03em" }}>{score}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.muted }}>/100</span>
              </div>
            </>
          ) : (
            /* ── Full vertical card (desktop) ── */
            <>
              <div style={{ position: "absolute", top: -20, right: -20, opacity: 0.06 }}>
                <svg width="160" height="160" viewBox="0 0 24 24" fill="none" stroke={C.emerald} strokeWidth="1">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
                <div style={{ width: 36, height: 36, borderRadius: 12, background: C.emeraldDim, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.emerald} strokeWidth="2.5">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </div>
                <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", color: "rgba(var(--accent-rgb),0.7)", textTransform: "uppercase" }}>
                  Consistency
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 12 }}>
                <span style={{ fontSize: 68, fontWeight: 900, color: C.text, lineHeight: 1, letterSpacing: "-0.04em" }}>{score}</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: C.muted }}>/100</span>
              </div>
              <p style={{ fontSize: 12, color: C.muted, fontWeight: 500, lineHeight: 1.5, maxWidth: 180 }}>
                {score >= 80
                  ? "Elite tier. The chain is unbroken."
                  : score >= 50
                    ? "Building momentum. Keep showing up."
                    : "Every rep counts. Start today."}
              </p>
            </>
          )}
        </Glass>

        {/* Session card — replaced by DoneCard after workout */}
        <div style={{ order: isMobile ? 1 : 0 }}>
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
              "linear-gradient(135deg, rgba(var(--accent-rgb),0.08) 0%, rgba(2,6,23,0.6) 60%)",
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
                        : `${s.target_duration_sec}s`}
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
                      : "0 8px 30px rgba(var(--accent-rgb),0.3)",
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
      </div>

      {/* Training intention card */}
      {(() => {
        const goal = GOALS.find((g) => g.value === (prefs.training_goal ?? "health")) ?? GOALS[0];
        const exp  = EXPERIENCE.find((e) => e.value === (prefs.experience_level ?? "beginner")) ?? EXPERIENCE[0];
        return (
          <Glass style={{ padding: "14px 20px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: C.emeraldDim, border: `1px solid ${C.emeraldBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                {goal.icon}
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", color: C.muted, textTransform: "uppercase", marginBottom: 2 }}>Training goal</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: C.text }}>{goal.label}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, color: C.muted }}>
                {exp.label}
              </span>
            </div>
          </Glass>
        );
      })()}

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
  // Alternatives
  const isPregnancyMode = bodyMode === "pregnant" || bodyMode === "postnatal";
  const [showBreathingReminder, setShowBreathingReminder] = useState(false);
  const breathingTimerRef = useRef(null);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [altExercises, setAltExercises] = useState([]);
  const [altLoading, setAltLoading] = useState(false);
  const [exerciseOverrides, setExerciseOverrides] = useState({}); // { [idx]: exercise }
  // Instruction card swipe state
  const [instrStep, setInstrStep] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartXRef = useRef(0);
  const restStartedAtRef = useRef(0);   // ms timestamp when rest phase began
  const timerTotalRef = useRef(0);      // total duration (sec) when exercise timer starts
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
    const activePhases = ["instruction", "working", "resting", "exerciseComplete"];
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerRunning, timerRemaining]);

  // Auto-advance removed — user reads instructions at their own pace

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
    } catch { setAltExercises([]); }
    finally { setAltLoading(false); }
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

      {/* Wake lock fallback — non-intrusive hint if screen lock can't be prevented */}
      {wakeLockDenied && ["instruction","working","resting"].includes(phase) && (
        <div style={{ flexShrink: 0, background: "rgba(245,158,11,0.12)", borderBottom: "1px solid rgba(245,158,11,0.25)", padding: "8px 20px", textAlign: "center" }}>
          <span style={{ fontSize: 12, color: "#f59e0b" }}>Keep your screen on to avoid interruptions during your workout.</span>
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
          const tags = JSON.parse(cur.tags_json || "[]");

          // Build card slides: prepend pregnancy/postnatal notes as accented first card
          const pregnancyNote = isPregnancyMode && bodyMode === "pregnant" ? instr?.pregnancy_note : null;
          const postnatalNote = isPregnancyMode && bodyMode === "postnatal" ? instr?.postnatal_note : null;
          const isPelvicFloor = bodyMode === "postnatal" && tags.includes("pelvic_floor");

          // Card objects: { text, accent } — accent null means standard style
          const rawCards = rawSteps.length > 0 ? rawSteps.map((s) => ({ text: s, accent: null })) : [{ text: "Focus on form. Quality over speed. You've got this.", accent: null }];
          if (pregnancyNote) rawCards.unshift({ text: pregnancyNote, accent: "amber" });
          if (postnatalNote) rawCards.unshift({ text: postnatalNote, accent: "rose" });
          if (isPelvicFloor) rawCards.push({ text: "Remember: the release is just as important as the squeeze. Full relaxation between each rep.", accent: "rose" });
          const cards = rawCards;
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
                    {cards[clampedStep]?.accent ? "Important note" : rawSteps.length > 0 ? `Step ${clampedStep + 1} of ${totalCards}` : "Coaching cue"}
                  </span>
                  {totalCards > 1 && (
                    <div style={{ display: "flex", gap: 6 }}>
                      {cards.map((card, i) => {
                        const dotColor = i === clampedStep
                          ? (card.accent === "amber" ? "#f59e0b" : card.accent === "rose" ? "#f43f5e" : C.emerald)
                          : "rgba(255,255,255,0.15)";
                        return <div key={i} onClick={() => setInstrStep(i)} style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, transition: "background 0.25s", cursor: "pointer" }} />;
                      })}
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
                    {cards.map((card, i) => {
                      const isAmber = card.accent === "amber";
                      const isRose = card.accent === "rose";
                      const cardBg = isAmber ? "rgba(245,158,11,0.08)" : isRose ? "rgba(244,63,94,0.08)" : "rgba(255,255,255,0.06)";
                      const cardBorder = isAmber ? "rgba(245,158,11,0.3)" : isRose ? "rgba(244,63,94,0.3)" : "rgba(255,255,255,0.1)";
                      const cardColor = isAmber ? "#f59e0b" : isRose ? "#f43f5e" : C.text;
                      return (
                        <div key={i} style={{ minWidth: "100%", flexShrink: 0 }}>
                          <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 20, padding: "28px 24px", minHeight: 140, display: "flex", alignItems: "center" }}>
                            <p style={{ fontSize: 18, fontWeight: 700, color: cardColor, lineHeight: 1.6, margin: 0, wordBreak: "break-word", overflowWrap: "break-word", whiteSpace: "pre-wrap" }}>{card.text}</p>
                          </div>
                        </div>
                      );
                    })}
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
                style={{ width: "100%", padding: "18px 0", borderRadius: 20, fontSize: 16, fontWeight: 900, background: C.emerald, border: "none", color: "#fff", cursor: "pointer", boxShadow: "0 8px 32px rgba(var(--accent-rgb),0.3)", letterSpacing: "-0.01em", flexShrink: 0 }}
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
            <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: C.bg, borderTop: `1px solid ${C.border}`, padding: "12px 16px 24px" }}>
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

              {/* Breathing reminder (pregnancy/postnatal only, auto-dismisses in 3s) */}
              {showBreathingReminder && (
                <div style={{ width: "100%", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 14, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <p style={{ margin: 0, fontSize: 14, color: "#f59e0b", lineHeight: 1.5, fontWeight: 600 }}>
                    Take a breath — inhale through nose, sigh out through mouth.
                  </p>
                  <button onClick={() => { clearTimeout(breathingTimerRef.current); setShowBreathingReminder(false); }} style={{ background: "none", border: "none", color: "#f59e0b", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 4, flexShrink: 0 }}>×</button>
                </div>
              )}

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

// ─── HISTORY VIEW ─────────────────────────────────────────────────────────────
function HistoryView({ history, isLoading, onDeleteExecution }) {
  const [deleteTarget, setDeleteTarget] = useState(null); // execution object
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteToast, setDeleteToast] = useState("");

  const handleDeleteConfirm = async () => {
    if (deleteInput !== "DELETE") return;
    setDeleting(true);
    try {
      await onDeleteExecution(deleteTarget.id);
      setDeleteToast("Session removed");
      setTimeout(() => setDeleteToast(""), 3000);
    } catch {
      setDeleteToast("Delete failed — try again");
      setTimeout(() => setDeleteToast(""), 3000);
    }
    setDeleting(false);
    setDeleteTarget(null);
    setDeleteInput("");
  };

  return (
    <div>
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: 36, fontWeight: 900, color: C.text, letterSpacing: "-0.03em" }}>
          History
        </h1>
        <p style={{ fontSize: 14, color: C.muted, marginTop: 6 }}>
          {history.length} sessions completed
        </p>
      </div>

      {deleteToast && (
        <div style={{ marginBottom: 16, padding: "10px 16px", borderRadius: 14, background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, fontSize: 13, fontWeight: 700, color: C.muted, textAlign: "center" }}>
          {deleteToast}
        </div>
      )}

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
          [...history].reverse().map((h) => (
            <Glass
              key={h.id}
              style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: C.emeraldDim, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.emerald} strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                    {new Date(h.date + "T12:00:00").toLocaleDateString("en", { weekday: "long", month: "short", day: "numeric" })}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginTop: 2 }}>
                    {h.execution_type || "workout"} · {h.total_duration_sec ? `${Math.round(h.total_duration_sec / 60)} min` : "completed"}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", color: C.emerald, background: C.emeraldDim, padding: "4px 10px", borderRadius: 8 }}>
                  Done
                </span>
                <button
                  onClick={() => { setDeleteTarget(h); setDeleteInput(""); }}
                  style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                  aria-label="Delete session"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                  </svg>
                </button>
              </div>
            </Glass>
          ))
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(2,6,23,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Glass style={{ padding: 28, maxWidth: 360, width: "100%" }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: C.text, marginBottom: 8 }}>Delete session?</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 20, lineHeight: 1.5 }}>
              This will permanently remove your {new Date(deleteTarget.date + "T12:00:00").toLocaleDateString("en", { weekday: "long", month: "short", day: "numeric" })} session. Type <strong style={{ color: "#f87171" }}>DELETE</strong> to confirm.
            </div>
            <input
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder="Type DELETE"
              autoFocus
              style={{ width: "100%", padding: "10px 14px", borderRadius: 14, background: "rgba(255,255,255,0.06)", border: `1px solid ${deleteInput === "DELETE" ? "rgba(248,113,113,0.5)" : C.border}`, color: C.text, fontSize: 15, fontWeight: 700, boxSizing: "border-box", outline: "none", marginBottom: 16 }}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => { setDeleteTarget(null); setDeleteInput(""); }}
                style={{ flex: 1, padding: "12px 16px", borderRadius: 14, fontWeight: 900, fontSize: 14, background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, color: C.muted, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteInput !== "DELETE" || deleting}
                style={{ flex: 1, padding: "12px 16px", borderRadius: 14, fontWeight: 900, fontSize: 14, background: deleteInput === "DELETE" ? "rgba(248,113,113,0.15)" : "rgba(255,255,255,0.04)", border: `1px solid ${deleteInput === "DELETE" ? "rgba(248,113,113,0.4)" : C.border}`, color: deleteInput === "DELETE" ? "#f87171" : C.muted, cursor: deleteInput === "DELETE" && !deleting ? "pointer" : "default" }}
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </Glass>
        </div>
      )}
    </div>
  );
}

// ─── AWARDS VIEW ──────────────────────────────────────────────────────────────
function AwardsView({ history, score, isPro }) {
  const n = history.length;

  // Derived metrics used across multiple awards
  const dates = [...new Set(history.map((h) => h.date))].sort();
  const maxStreak = (() => {
    if (!dates.length) return 0;
    let best = 1, cur = 1;
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]), curr = new Date(dates[i]);
      const diff = (curr - prev) / 86400000;
      cur = diff === 1 ? cur + 1 : 1;
      if (cur > best) best = cur;
    }
    return best;
  })();
  const hardSessions   = history.filter((h) => h.perceived_exertion === 8).length;
  const easySessions   = history.filter((h) => h.perceived_exertion === 3).length;
  const bonusSessions  = history.filter((h) => h.execution_type === "bonus").length;
  const longSessions   = history.filter((h) => (h.total_duration_sec ?? 0) >= 1800).length; // ≥30 min
  const microSessions  = history.filter((h) => (h.total_duration_sec ?? 0) > 0 && (h.total_duration_sec ?? 0) < 900).length; // <15 min
  const hasComeback = (() => {
    for (let i = 1; i < dates.length; i++) {
      const gap = (new Date(dates[i]) - new Date(dates[i - 1])) / 86400000;
      if (gap >= 7) return true;
    }
    return false;
  })();
  const perfectWeeks = (() => {
    const weekSets = {};
    dates.forEach((d) => {
      const dt = new Date(d);
      const mon = new Date(dt);
      mon.setDate(dt.getDate() - ((dt.getDay() + 6) % 7));
      const key = mon.toISOString().slice(0, 10);
      weekSets[key] = (weekSets[key] || new Set());
      weekSets[key].add(d);
    });
    return Object.values(weekSets).filter((s) => s.size >= 5).length;
  })();

  const awards = [
    // ── First steps ──────────────────────────────────────────────────────────
    {
      id: "genesis",
      title: "Genesis",
      desc: "You showed up. That's how every journey begins.",
      icon: "⚡",
      unlocked: n >= 1,
      req: "1 session",
    },
    {
      id: "habit",
      title: "The Habit",
      desc: "Three sessions done. Something is starting to stick.",
      icon: "🔥",
      unlocked: n >= 3,
      req: "3 sessions",
    },
    {
      id: "seven",
      title: "Full Rotation",
      desc: "Seven sessions. You've been through a full week's worth of effort.",
      icon: "🏅",
      unlocked: n >= 7,
      req: "7 sessions",
    },
    {
      id: "steady",
      title: "Steady",
      desc: "Ten sessions in. You're building something real.",
      icon: "🪨",
      unlocked: n >= 10,
      req: "10 sessions",
    },
    {
      id: "committed",
      title: "Committed",
      desc: "Twenty-five sessions. This is who you are now.",
      icon: "💪",
      unlocked: n >= 25,
      req: "25 sessions",
    },
    {
      id: "half_century",
      title: "Half Century",
      desc: "Fifty sessions. You've done the work most people only talk about.",
      icon: "🎯",
      unlocked: n >= 50,
      req: "50 sessions",
    },
    {
      id: "centurion",
      title: "Centurion",
      desc: "One hundred sessions. You are the consistency.",
      icon: "🏆",
      unlocked: n >= 100,
      req: "100 sessions",
    },
    // ── Consistency score ─────────────────────────────────────────────────────
    {
      id: "momentum",
      title: "Momentum",
      desc: "Consistency score above 50. The engine is running.",
      icon: "📈",
      unlocked: score >= 50,
      req: "Score 50+",
    },
    {
      id: "iron_will",
      title: "Iron Will",
      desc: "Score of 80 or higher. You're in rare company.",
      icon: "🧲",
      unlocked: score >= 80,
      req: "Score 80+",
    },
    {
      id: "top_tier",
      title: "Top Tier",
      desc: "Score above 90. Elite consistency, full stop.",
      icon: "🌟",
      unlocked: score >= 90,
      req: "Score 90+",
    },
    {
      id: "king",
      title: "Consistency King",
      desc: "The perfect score of 100. Nothing left to prove.",
      icon: "👑",
      unlocked: score >= 100,
      req: "Score 100",
    },
    // ── Streaks ───────────────────────────────────────────────────────────────
    {
      id: "week_streak",
      title: "Seven Days",
      desc: "Active 7 days in a row. Habit unlocked.",
      icon: "📅",
      unlocked: maxStreak >= 7,
      req: "7-day streak",
    },
    {
      id: "fortnight",
      title: "Two Week Warrior",
      desc: "Fourteen consecutive active days. You don't do 'off days'.",
      icon: "⚔️",
      unlocked: maxStreak >= 14,
      req: "14-day streak",
    },
    {
      id: "month_strong",
      title: "Month Strong",
      desc: "Thirty days straight. A whole month of showing up.",
      icon: "🗓️",
      unlocked: maxStreak >= 30,
      req: "30-day streak",
    },
    {
      id: "perfect_week",
      title: "Perfect Week",
      desc: "Five or more active days in a single week. Textbook consistency.",
      icon: "✅",
      unlocked: perfectWeeks >= 1,
      req: "5 days in one week",
    },
    // ── Effort & attitude ─────────────────────────────────────────────────────
    {
      id: "pushed_through",
      title: "Pushed Through",
      desc: "Three hard sessions rated 'too hard' — and you still finished.",
      icon: "😤",
      unlocked: hardSessions >= 3,
      req: "3 tough sessions",
    },
    {
      id: "smooth_operator",
      title: "Smooth Operator",
      desc: "Five sessions where you made it look easy.",
      icon: "😎",
      unlocked: easySessions >= 5,
      req: "5 easy sessions",
    },
    {
      id: "comeback",
      title: "The Comeback",
      desc: "Came back after a week away. Starting over takes guts.",
      icon: "🔄",
      unlocked: hasComeback,
      req: "Return after 7+ day gap",
    },
    // ── Session types ─────────────────────────────────────────────────────────
    {
      id: "micro_first",
      title: "Quick Win",
      desc: "Knocked out a session in under 15 minutes. Every minute counts.",
      icon: "⏱️",
      unlocked: microSessions >= 1,
      req: "1 micro session",
    },
    {
      id: "micro_master",
      title: "Micro Master",
      desc: "Five micro sessions done. Short and sharp is a superpower.",
      icon: "🕐",
      unlocked: microSessions >= 5,
      req: "5 micro sessions",
    },
    {
      id: "long_haul",
      title: "Long Haul",
      desc: "Thirty minutes or more in a single session. You went the distance.",
      icon: "⌛",
      unlocked: longSessions >= 1,
      req: "1 session ≥ 30 min",
    },
    {
      id: "bonus_first",
      title: "Extra Credit",
      desc: "You already completed today's session — and came back for more.",
      icon: "➕",
      unlocked: bonusSessions >= 1,
      req: "1 bonus session",
    },
    {
      id: "bonus_five",
      title: "Overachiever",
      desc: "Five bonus sessions. You consistently go beyond what's asked.",
      icon: "🚀",
      unlocked: bonusSessions >= 5,
      req: "5 bonus sessions",
    },
    {
      id: "long_hauler",
      title: "Long Hauler",
      desc: "Five sessions over 30 minutes. You love the long game.",
      icon: "🏋️",
      unlocked: longSessions >= 5,
      req: "5 sessions ≥ 30 min",
    },
    // ── Score tiers ───────────────────────────────────────────────────────────
    {
      id: "in_the_zone",
      title: "In The Zone",
      desc: "Consistency score above 70. You've found your rhythm.",
      icon: "🎯",
      unlocked: score >= 70,
      req: "Score 70+",
    },
    // ── Special ───────────────────────────────────────────────────────────────
    {
      id: "pro",
      title: "Pro Status",
      desc: "Unlock the full JustFit adaptive engine.",
      icon: "⭐",
      unlocked: isPro,
      req: "Pro active",
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

function SettingsView({ prefs, onUpdate, userId, token, onChangeGoal }) {
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
  // Profile editing state
  const [displayName, setDisplayName] = useState(prefs.preferences?.display_name ?? "");
  const [profileSex, setProfileSex] = useState(prefs.sex ?? null);
  const [profileWeight, setProfileWeight] = useState(prefs.weight_kg ? String(prefs.weight_kg) : "");
  const [profileWeightUnit, setProfileWeightUnit] = useState("kg");
  const [profileHeight, setProfileHeight] = useState(prefs.height_cm ? String(prefs.height_cm) : "");
  const [profileHeightUnit, setProfileHeightUnit] = useState("cm");
  const [saveStatus, setSaveStatus] = useState(""); // "" | "saving" | "saved" | "error"
  const planAutoSaveRef = useRef(false);
  const profileAutoSaveRef = useRef(false);
  const accentAutoSaveRef = useRef(false);
  const [showSexWarning, setShowSexWarning] = useState(false);
  const [pendingSex, setPendingSex] = useState(null);
  const [bodyModeDeactivating, setBodyModeDeactivating] = useState(false);
  // Info pages overlay
  const [showInfoPage, setShowInfoPage] = useState(null); // null | "vision" | "how_it_works" | "terms" | "disclaimer"
  // Accent colour
  const [accentHex, setAccentHex] = useState(prefs.preferences?.accent ?? localStorage.getItem("jf_accent") ?? "#10b981");
  // Daily planning preferences
  const [checkinMode, setCheckinMode] = useState(prefs.preferences?.checkin_mode ?? "once_a_day");
  const [planDuration, setPlanDuration] = useState(prefs.session_duration_min ?? 30);
  const [planEquipment, setPlanEquipment] = useState(prefs.preferences?.available_equipment ?? ["none"]);
  const [timeOverhead, setTimeOverhead] = useState(() => {
    const saved = prefs.preferences?.time_overhead;
    const emptyProfile = { presets: { change_clothes: 0, prepare_equipment: 0, clean_equipment: 0, shower: 0 }, custom: [] };
    // Migrate old single-profile format (had top-level presets/custom)
    if (saved && saved.presets) return { enabled: saved.enabled ?? false, short: emptyProfile, long: { presets: saved.presets, custom: saved.custom ?? [] } };
    return saved ?? { enabled: false, short: emptyProfile, long: { ...emptyProfile, custom: [] } };
  });
  const [overheadEditMode, setOverheadEditMode] = useState(false);
  const [showAdvancedSchedule, setShowAdvancedSchedule] = useState(false);
  const [weeklySchedule, setWeeklySchedule] = useState(() => {
    const saved = prefs.preferences?.weekly_schedule;
    const d = prefs.session_duration_min ?? 30;
    return saved ?? { mon: d, tue: d, wed: d, thu: d, fri: d, sat: 0, sun: 0 };
  });

  const [equipEditMode, setEquipEditMode] = useState(false);
  const [equipDragItem, setEquipDragItem] = useState(null);
  const [equipDropZone, setEquipDropZone] = useState(null);

  const moveEquip = (value, toActive) => {
    if (toActive) {
      setPlanEquipment((prev) => {
        const without = prev.filter((v) => v !== "none");
        return without.includes(value) ? without : [...without, value];
      });
    } else {
      setPlanEquipment((prev) => {
        const next = prev.filter((v) => v !== value && v !== "none");
        return next.length === 0 ? ["none"] : next;
      });
    }
  };

  // ── Auto-save: plan preferences ──
  useEffect(() => {
    if (!planAutoSaveRef.current) { planAutoSaveRef.current = true; return; }
    setSaveStatus("saving");
    const equip = planEquipment.join(",");
    const sched = JSON.stringify(weeklySchedule);
    const over  = JSON.stringify(timeOverhead);
    const t = setTimeout(async () => {
      try {
        await api.saveProfile(token, {
          training_goal: prefs.training_goal ?? "health",
          experience_level: prefs.experience_level ?? "beginner",
          session_duration_min: planDuration,
          days_per_week_target: prefs.days_per_week_target ?? 3,
          preferences: { ...(prefs.preferences ?? {}), available_equipment: planEquipment, weekly_schedule: weeklySchedule, checkin_mode: checkinMode, time_overhead: timeOverhead },
        });
        onUpdate((p) => ({ ...p, session_duration_min: planDuration, preferences: { ...(p.preferences ?? {}), available_equipment: planEquipment, weekly_schedule: weeklySchedule, checkin_mode: checkinMode, time_overhead: timeOverhead } }));
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus(""), 2000);
      } catch { setSaveStatus("error"); }
    }, 600);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planDuration, planEquipment.join(","), JSON.stringify(weeklySchedule), checkinMode, JSON.stringify(timeOverhead)]);

  // ── Auto-save: profile ──
  useEffect(() => {
    if (!profileAutoSaveRef.current) { profileAutoSaveRef.current = true; return; }
    setSaveStatus("saving");
    const t = setTimeout(async () => {
      try {
        let weight_kg = null;
        if (profileWeight) { const w = parseFloat(profileWeight); if (!isNaN(w)) weight_kg = profileWeightUnit === "lbs" ? Math.round(w * 0.453592 * 10) / 10 : w; }
        let height_cm = null;
        if (profileHeight) { const h = parseFloat(profileHeight); if (!isNaN(h)) height_cm = profileHeightUnit === "in" ? Math.round(h * 2.54 * 10) / 10 : h; }
        const payload = { sex: profileSex, weight_kg, height_cm, preferences: { ...(prefs.preferences ?? {}), display_name: displayName } };
        if (profileSex === "female") {
          payload.cycle = cycleTrackingMode === "smart"
            ? { tracking_mode: "smart", cycle_length_days: cycleLength, last_period_start: lastPeriodStart || undefined, mode: bodyMode }
            : { tracking_mode: "off", mode: bodyMode };
        }
        await api.saveProfile(token, payload);
        onUpdate((p) => ({ ...p, sex: profileSex, weight_kg, height_cm, preferences: { ...(p.preferences ?? {}), display_name: displayName } }));
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus(""), 2000);
      } catch { setSaveStatus("error"); }
    }, 800);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayName, profileSex, profileWeight, profileWeightUnit, profileHeight, profileHeightUnit, cycleTrackingMode, cycleLength, lastPeriodStart, bodyMode]);

  // ── Auto-save: accent colour ──
  useEffect(() => {
    if (!accentAutoSaveRef.current) { accentAutoSaveRef.current = true; return; }
    localStorage.setItem("jf_accent", accentHex);
    api.saveProfile(token, { preferences: { ...(prefs.preferences ?? {}), accent: accentHex } })
      .then(() => onUpdate((p) => ({ ...p, preferences: { ...(p.preferences ?? {}), accent: accentHex } })))
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accentHex]);

  const handleDeactivateBodyMode = async () => {
    setBodyModeDeactivating(true);
    try {
      await api.saveProfile(token, { cycle: { mode: "standard", tracking_mode: "off" } });
      setBodyMode("standard");
      setCycleTrackingMode("off");
      onUpdate((p) => ({ ...p, cycle: { ...(p.cycle ?? {}), mode: "standard", tracking_mode: "off" } }));
    } catch {}
    setBodyModeDeactivating(false);
  };

  const handleConfirmSexChange = async () => {
    const newSex = pendingSex;
    setProfileSex(newSex);
    setBodyMode("standard");
    setCycleTrackingMode("off");
    setShowSexWarning(false);
    setPendingSex(null);
    try {
      await api.saveProfile(token, { sex: newSex, cycle: { mode: "standard", tracking_mode: "off" } });
      onUpdate((p) => ({ ...p, sex: newSex, cycle: { ...(p.cycle ?? {}), mode: "standard", tracking_mode: "off" } }));
    } catch {}
  };


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

  const INFO_PAGES = {
    vision: {
      title: "Vision, Mission & Philosophy",
      sections: [
        {
          heading: "Our Vision",
          body: "A world where fitness is built into everyday life — not reserved for the motivated, the athletic, or the disciplined. JustFit exists to make consistent movement the default, not the exception.",
        },
        {
          heading: "Our Mission",
          body: "To give every person a personal training intelligence that adapts to their real life — not an ideal version of it. Sleep bad? Stressed? Travelling? JustFit adjusts so you still move. Every single day.",
        },
        {
          heading: "Philosophy: Consistency > Intensity",
          body: "The science is clear: showing up consistently at moderate effort produces better long-term results than sporadic bursts of maximum intensity. JustFit is built around this truth.\n\nWe do not reward pain. We reward presence. A ten-minute session on a hard day is worth more than a skipped session after a hard week. The app never tells you to push through — it meets you where you are.",
        },
        {
          heading: "Why We Don't Use AI for Plans",
          body: "Your plan is generated by a transparent, rule-based engine — not a black box. Every decision (intensity, exercise selection, rest) is traceable to a specific rule. You can trust it, audit it, and understand it. No hallucinated workouts, no random variation for its own sake.",
        },
        {
          heading: "Privacy First",
          body: "Your fitness data is yours. We separate your identity from your health data at the database level. We do not sell data, we do not profile you for ads, and we do not share your information with third parties.",
        },
      ],
    },
    how_it_works: {
      title: "How JustFit Works",
      sections: [
        {
          heading: "Daily Check-In",
          body: "Each day, you tell JustFit how you're doing: sleep, energy, mood, stress, and any practical constraints (no gym, travelling, short on time, pain). This takes under 30 seconds and drives your entire session plan.",
        },
        {
          heading: "The Planner Engine",
          body: "A rule-based engine (not AI) analyses your check-in alongside your goal, experience level, body profile, and cycle context to generate a personalised session. Rules include:\n\n• Low sleep → intensity reduced\n• High stress → session shifts to mobility\n• Pain reported → rest day assigned\n• Travelling → bodyweight-only exercises\n• BMI ≥ 30 → low-impact alternatives replace running\n• Pregnancy / postnatal → safe exercise selection and volume limits",
        },
        {
          heading: "Goals & Experience",
          body: "Set your training goal (fat loss, muscle gain, endurance, strength, health, mobility, or mixed) and experience level (beginner, intermediate, advanced). These drive exercise count, sets, rest periods, intensity, and session naming.",
        },
        {
          heading: "Cycle & Body Awareness",
          body: "Female users can enable Smart Cycle Tracking. The planner adjusts intensity and volume across the four cycle phases (menstrual, follicular, ovulation, luteal). Pregnancy and postnatal modes activate a full set of safety rules — filtering high-impact exercises, adding pelvic floor work, and respecting medical clearance stages.",
        },
        {
          heading: "Workout Coaching",
          body: "During a session, JustFit coaches you step by step: instruction cards, a rep tap zone, automatic rest timer, difficulty controls (+/− reps or seconds), and exercise alternatives. The screen stays on via Wake Lock so you never need to touch your phone mid-set.",
        },
        {
          heading: "Consistency Score",
          body: "Your score (0–100) is calculated server-side from the last 7 days:\n• Active days × 10 (max 70)\n• Resilience bonus for easy-day sessions × 5 (max 20)\n• Continuity streak bonus (max 10)\n\nIt rewards showing up — especially on hard days.",
        },
        {
          heading: "History & Awards",
          body: "Every completed session is logged. The History tab shows your recent workouts with duration and effort rating. The Awards tab tracks 26 milestone achievements — from your first session to 100-day streaks.",
        },
      ],
    },
    terms: {
      title: "Terms & Conditions",
      sections: [
        {
          heading: "1. Acceptance",
          body: "By using JustFit.cc you agree to these Terms. If you do not agree, do not use the app.",
        },
        {
          heading: "2. Service Description",
          body: "JustFit provides a fitness planning tool for general wellness purposes only. It is not a medical service, personal training service, or healthcare provider.",
        },
        {
          heading: "3. Eligibility",
          body: "You must be at least 16 years old to use JustFit. By using the service you confirm you meet this requirement.",
        },
        {
          heading: "4. Account",
          body: "You are responsible for maintaining the confidentiality of your account credentials. You are responsible for all activity under your account.",
        },
        {
          heading: "5. Acceptable Use",
          body: "You agree not to misuse the service, attempt to access other users' data, reverse-engineer the platform, or use it for any unlawful purpose.",
        },
        {
          heading: "6. Intellectual Property",
          body: "All content, code, and design in JustFit is the property of JustFit.cc. You may not reproduce or distribute it without written permission.",
        },
        {
          heading: "7. Changes to Service",
          body: "We reserve the right to modify, suspend, or discontinue any part of the service at any time with reasonable notice.",
        },
        {
          heading: "8. Governing Law",
          body: "These Terms are governed by the laws of the Netherlands. Any disputes shall be subject to the exclusive jurisdiction of the Dutch courts.",
        },
        {
          heading: "9. Contact",
          body: "For questions about these Terms, contact us at support@justfit.cc.",
        },
      ],
    },
    disclaimer: {
      title: "Disclaimer & Liability Waiver",
      sections: [
        {
          heading: "Not a Medical App",
          body: "JustFit is a general-purpose fitness tool for healthy adults. It is NOT a medical application, medical device, or healthcare service. Nothing in JustFit constitutes medical advice, diagnosis, or treatment.",
        },
        {
          heading: "Consult a Professional",
          body: "Always seek the advice of a qualified physician, physiotherapist, or other licensed health professional before beginning any new exercise programme, particularly if you:\n\n• Have or suspect any medical condition\n• Are pregnant or postnatal\n• Have recently had surgery or injury\n• Are on medication that may affect your exercise capacity",
        },
        {
          heading: "Exercise Risk",
          body: "Physical exercise carries inherent risks including, but not limited to, musculoskeletal injury, cardiovascular events, and falls. By using JustFit, you acknowledge and accept these risks.",
        },
        {
          heading: "Liability Waiver",
          body: "To the fullest extent permitted by applicable law, JustFit.cc, its founders, employees, and agents are not liable for any injury, illness, loss, or damage — direct or indirect — arising from your use of the app or participation in any exercise programme generated by it.\n\nYou use JustFit entirely at your own risk.",
        },
        {
          heading: "BMI & Body Metrics",
          body: "BMI is a population-level screening tool and has well-documented limitations. JustFit uses BMI solely to apply conservative exercise selection rules as a precautionary measure. It does not constitute a health assessment or diagnosis.",
        },
        {
          heading: "Pregnancy & Postnatal",
          body: "The pregnancy and postnatal modes in JustFit apply general safety guidelines from established exercise science. They do not replace individualised advice from your midwife, obstetrician, or physiotherapist. Always obtain medical clearance before exercising during or after pregnancy.",
        },
        {
          heading: "Data Accuracy",
          body: "Plan recommendations are based on the information you provide. The accuracy of your plan depends on the accuracy of your input. JustFit cannot verify user-submitted data.",
        },
      ],
    },
  };

  const infoPage = showInfoPage ? INFO_PAGES[showInfoPage] : null;

  return (
    <div>
      {/* ── Info page overlay ────────────────────────────────── */}
      {infoPage && (
        <div style={{ position: "fixed", inset: 0, background: C.bg, zIndex: 60, overflowY: "auto", padding: "80px 20px 48px" }}>
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 61, background: C.bg, borderBottom: `1px solid ${C.border}`, padding: "16px 20px" }}>
            <button
              onClick={() => setShowInfoPage(null)}
              style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: C.muted, fontSize: 14, fontWeight: 700, cursor: "pointer", padding: 0 }}
            >
              ← Back
            </button>
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 900, color: C.text, letterSpacing: "-0.02em", marginBottom: 28, lineHeight: 1.2 }}>
            {infoPage.title}
          </h2>
          {infoPage.sections.map((s, i) => (
            <div key={i} style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: C.emerald, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                {s.heading}
              </div>
              {s.body.split("\n\n").map((para, j) => (
                <p key={j} style={{ fontSize: 14, color: para.startsWith("•") ? C.muted : C.text, lineHeight: 1.75, margin: 0, marginBottom: 8, whiteSpace: "pre-line", fontWeight: para.startsWith("•") ? 500 : 600 }}>
                  {para}
                </p>
              ))}
            </div>
          ))}
        </div>
      )}

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

      {/* ── Daily Planning ──────────────────────────────────── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", color: C.emerald, textTransform: "uppercase", marginBottom: 16 }}>
          Daily Planning
        </div>
        <Glass style={{ padding: 24 }}>

          {/* Training goal row */}
          {(() => {
            const goal = GOALS.find((g) => g.value === (prefs.training_goal ?? "health")) ?? GOALS[0];
            const exp  = EXPERIENCE.find((e) => e.value === (prefs.experience_level ?? "beginner")) ?? EXPERIENCE[0];
            return (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, paddingBottom: 20, borderBottom: `1px solid ${C.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 12, background: "var(--accent-dim)", border: "1px solid var(--accent-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                    {goal.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", color: C.muted, textTransform: "uppercase", marginBottom: 2 }}>Training goal</div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: C.text }}>{goal.label}</div>
                    <span style={{ marginTop: 4, display: "inline-block", padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, color: C.muted }}>
                      {exp.label}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onChangeGoal?.()}
                  style={{ padding: "8px 14px", borderRadius: 10, background: "var(--accent-dim)", border: "1px solid var(--accent-border)", color: "var(--accent)", fontWeight: 700, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}
                >
                  Change goal
                </button>
              </div>
            );
          })()}

          {/* Check-in mode */}
          <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 4 }}>
            Daily check-in
          </div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 12, lineHeight: 1.5 }}>
            Controls when the Daily Intelligence Prompt appears.
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
            {[
              { id: "every_time", label: "Every time",  sub: "On every open" },
              { id: "once_a_day", label: "Once a day",  sub: "First open only" },
              { id: "manual",     label: "Manual",       sub: "You decide" },
            ].map(({ id, label, sub }) => {
              const sel = checkinMode === id;
              return (
                <button
                  key={id}
                  onClick={() => setCheckinMode(id)}
                  style={{
                    flex: 1, padding: "10px 6px", borderRadius: 14, cursor: "pointer",
                    border: `1px solid ${sel ? C.emeraldBorder : C.border}`,
                    background: sel ? C.emeraldDim : "rgba(255,255,255,0.03)",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 900, color: sel ? C.emerald : C.text }}>{label}</span>
                  <span style={{ fontSize: 10, color: sel ? C.emerald : C.muted, opacity: 0.8 }}>{sub}</span>
                </button>
              );
            })}
          </div>

          {/* Session duration — Standard / Advanced selector */}
          <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 4, borderTop: `1px solid ${C.border}`, marginTop: 4, paddingTop: 20 }}>
            Available time per session
          </div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 12, lineHeight: 1.5 }}>
            Sets the default length of your daily plan. You can always adjust on the day.
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
            {[
              { id: false, label: "Standard", sub: "One duration for all days" },
              { id: true,  label: "Advanced", sub: "Set time per day of week" },
            ].map(({ id, label, sub }) => {
              const sel = showAdvancedSchedule === id;
              return (
                <button
                  key={String(id)}
                  onClick={() => setShowAdvancedSchedule(id)}
                  style={{
                    flex: 1, padding: "10px 6px", borderRadius: 14, cursor: "pointer",
                    border: `1px solid ${sel ? C.emeraldBorder : C.border}`,
                    background: sel ? C.emeraldDim : "rgba(255,255,255,0.03)",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 900, color: sel ? C.emerald : C.text }}>{label}</span>
                  <span style={{ fontSize: 10, color: sel ? C.emerald : C.muted, opacity: 0.8 }}>{sub}</span>
                </button>
              );
            })}
          </div>

          {!showAdvancedSchedule ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
              {[15, 20, 30, 45, 60, 90, 120].map((d) => (
                <button
                  key={d}
                  onClick={() => setPlanDuration(d)}
                  style={{
                    padding: "8px 18px", borderRadius: 999, fontWeight: 700, fontSize: 13,
                    border: `1px solid ${planDuration === d ? C.emeraldBorder : C.border}`,
                    background: planDuration === d ? C.emeraldDim : "rgba(255,255,255,0.03)",
                    color: planDuration === d ? C.emerald : C.muted,
                    cursor: "pointer",
                  }}
                >
                  {d} min
                </button>
              ))}
            </div>
          ) : (
            <div style={{ marginBottom: 24, display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { key: "mon", label: "Mon" },
                { key: "tue", label: "Tue" },
                { key: "wed", label: "Wed" },
                { key: "thu", label: "Thu" },
                { key: "fri", label: "Fri" },
                { key: "sat", label: "Sat" },
                { key: "sun", label: "Sun" },
              ].map(({ key, label }) => (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 32, fontSize: 11, fontWeight: 900, color: weeklySchedule[key] === 0 ? C.subtle : C.muted, textTransform: "uppercase", letterSpacing: "0.08em", flexShrink: 0 }}>
                    {label}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, flex: 1 }}>
                    {[{ v: 0, l: "Rest" }, { v: 15, l: "15m" }, { v: 20, l: "20m" }, { v: 30, l: "30m" }, { v: 45, l: "45m" }, { v: 60, l: "60m" }, { v: 90, l: "90m" }, { v: 120, l: "120m" }].map(({ v, l }) => {
                      const sel = weeklySchedule[key] === v;
                      const isRest = v === 0;
                      return (
                        <button
                          key={v}
                          onClick={() => setWeeklySchedule((s) => ({ ...s, [key]: v }))}
                          style={{
                            padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: "pointer",
                            border: `1px solid ${sel ? (isRest ? "rgba(255,255,255,0.15)" : C.emeraldBorder) : C.border}`,
                            background: sel ? (isRest ? "rgba(255,255,255,0.07)" : C.emeraldDim) : "rgba(255,255,255,0.02)",
                            color: sel ? (isRest ? C.muted : C.emerald) : C.subtle,
                          }}
                        >
                          {l}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ height: 1, background: C.border, marginBottom: 24 }} />

          {/* ── Time overhead ── */}
          {(() => {
            const presetDefs = [
              { key: "change_clothes",    label: "Change clothes" },
              { key: "prepare_equipment", label: "Prepare equipment" },
              { key: "clean_equipment",   label: "Clean equipment" },
              { key: "shower",            label: "Shower" },
            ];
            const profileTotal = (profile) =>
              presetDefs.reduce((s, { key }) => s + (profile?.presets?.[key] || 0), 0) +
              (profile?.custom ?? []).reduce((s, c) => s + (c.minutes || 0), 0);
            const shortTotal = profileTotal(timeOverhead.short);
            const longTotal  = profileTotal(timeOverhead.long);

            const stepMin = (profile, key, delta) =>
              setTimeOverhead((o) => ({
                ...o,
                [profile]: { ...o[profile], presets: { ...o[profile].presets, [key]: Math.max(0, Math.min(60, (o[profile].presets?.[key] || 0) + delta)) } },
              }));
            const stepCustom = (profile, idx, delta) =>
              setTimeOverhead((o) => {
                const c = [...(o[profile].custom ?? [])];
                c[idx] = { ...c[idx], minutes: Math.max(0, Math.min(60, (c[idx].minutes || 0) + delta)) };
                return { ...o, [profile]: { ...o[profile], custom: c } };
              });
            const renameCustom = (profile, idx, lbl) =>
              setTimeOverhead((o) => {
                const c = [...(o[profile].custom ?? [])];
                c[idx] = { ...c[idx], label: lbl };
                return { ...o, [profile]: { ...o[profile], custom: c } };
              });
            const removeCustom = (profile, idx) =>
              setTimeOverhead((o) => ({ ...o, [profile]: { ...o[profile], custom: (o[profile].custom ?? []).filter((_, i) => i !== idx) } }));
            const addCustom = (profile) =>
              setTimeOverhead((o) => ({ ...o, [profile]: { ...o[profile], custom: [...(o[profile].custom ?? []), { label: "", minutes: 0 }] } }));

            const StepRow = ({ label, value, onMinus, onPlus }) => (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: value > 0 ? C.text : C.muted }}>{label}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button onClick={onMinus} style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.04)", color: C.text, cursor: "pointer", fontSize: 16, lineHeight: 1 }}>−</button>
                  <span style={{ width: 32, textAlign: "center", fontSize: 13, fontWeight: 900, color: value > 0 ? C.emerald : C.muted }}>{value}m</span>
                  <button onClick={onPlus} style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.04)", color: C.text, cursor: "pointer", fontSize: 16, lineHeight: 1 }}>+</button>
                </div>
              </div>
            );

            const ProfileSection = ({ profileKey, title }) => {
              const profile = timeOverhead[profileKey] ?? { presets: {}, custom: [] };
              return (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, marginTop: 16 }}>
                    <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", color: C.emerald, textTransform: "uppercase", whiteSpace: "nowrap" }}>{title}</div>
                    <div style={{ flex: 1, height: 1, background: C.border }} />
                  </div>
                  {presetDefs.map(({ key, label }) => (
                    <StepRow key={key} label={label} value={profile.presets?.[key] || 0}
                      onMinus={() => stepMin(profileKey, key, -5)} onPlus={() => stepMin(profileKey, key, 5)} />
                  ))}
                  {(profile.custom ?? []).map((c, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: `1px solid ${C.border}` }}>
                      <input
                        value={c.label}
                        onChange={(e) => renameCustom(profileKey, idx, e.target.value)}
                        placeholder="e.g. Drive to gym"
                        style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, borderRadius: 8, padding: "4px 10px", color: C.text, fontSize: 13, fontWeight: 700, outline: "none" }}
                      />
                      <button onClick={() => stepCustom(profileKey, idx, -5)} style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.04)", color: C.text, cursor: "pointer", fontSize: 16, lineHeight: 1 }}>−</button>
                      <span style={{ width: 32, textAlign: "center", fontSize: 13, fontWeight: 900, color: c.minutes > 0 ? C.emerald : C.muted }}>{c.minutes}m</span>
                      <button onClick={() => stepCustom(profileKey, idx, 5)} style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.04)", color: C.text, cursor: "pointer", fontSize: 16, lineHeight: 1 }}>+</button>
                      <button onClick={() => removeCustom(profileKey, idx)} style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid rgba(226,76,74,0.3)`, background: "rgba(226,76,74,0.08)", color: "#f87171", cursor: "pointer", fontSize: 15, lineHeight: 1 }}>×</button>
                    </div>
                  ))}
                  {(profile.custom ?? []).length < 3 && (
                    <button onClick={() => addCustom(profileKey)} style={{ marginTop: 8, padding: "5px 12px", borderRadius: 999, fontSize: 11, fontWeight: 800, cursor: "pointer", border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.03)", color: C.muted }}>
                      + Add custom block
                    </button>
                  )}
                </div>
              );
            };

            return (
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase" }}>Time overhead</div>
                  <button
                    onClick={() => setOverheadEditMode((v) => !v)}
                    style={{ padding: "4px 12px", borderRadius: 999, fontSize: 11, fontWeight: 800, cursor: "pointer", border: `1px solid ${overheadEditMode ? C.emeraldBorder : C.border}`, background: overheadEditMode ? C.emeraldDim : "rgba(255,255,255,0.04)", color: overheadEditMode ? C.emerald : C.muted }}
                  >
                    {overheadEditMode ? "Done" : "Edit"}
                  </button>
                </div>

                {!overheadEditMode ? (
                  <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.8 }}>
                    {timeOverhead.enabled && (shortTotal > 0 || longTotal > 0) ? (
                      <span>
                        {shortTotal > 0 && <span>Quick session: <span style={{ color: C.emerald, fontWeight: 800 }}>{shortTotal} min</span> overhead</span>}
                        {shortTotal > 0 && longTotal > 0 && <span style={{ color: C.subtle }}> · </span>}
                        {longTotal > 0 && <span>Full session: <span style={{ color: C.emerald, fontWeight: 800 }}>{longTotal} min</span> overhead</span>}
                      </span>
                    ) : (
                      <span style={{ color: C.subtle, fontStyle: "italic" }}>Not set — full window used for training</span>
                    )}
                  </div>
                ) : (
                  <div>
                    {/* Enable toggle */}
                    <div
                      onClick={() => setTimeOverhead((o) => ({ ...o, enabled: !o.enabled }))}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 12, marginBottom: 4, cursor: "pointer", background: timeOverhead.enabled ? C.emeraldDim : "rgba(255,255,255,0.03)", border: `1px solid ${timeOverhead.enabled ? C.emeraldBorder : C.border}` }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: timeOverhead.enabled ? C.emerald : C.text }}>Include overhead in planning</div>
                        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Subtracts overhead from your available training window</div>
                      </div>
                      <div style={{ width: 36, height: 20, borderRadius: 999, background: timeOverhead.enabled ? C.emerald : C.subtle, position: "relative", flexShrink: 0, transition: "background 0.2s" }}>
                        <div style={{ position: "absolute", top: 2, left: timeOverhead.enabled ? 18 : 2, width: 16, height: 16, borderRadius: 999, background: "#fff", transition: "left 0.2s" }} />
                      </div>
                    </div>

                    <ProfileSection profileKey="short" title="Quick session  ≤ 30 min" />
                    <ProfileSection profileKey="long"  title="Full session  > 30 min" />
                  </div>
                )}
              </div>
            );
          })()}

          <div style={{ height: 1, background: C.border, marginBottom: 24 }} />

          {/* Equipment */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase" }}>
              Available equipment
            </div>
            <button
              onClick={() => setEquipEditMode((v) => !v)}
              style={{ padding: "4px 12px", borderRadius: 999, fontSize: 11, fontWeight: 800, cursor: "pointer", border: `1px solid ${equipEditMode ? C.emeraldBorder : C.border}`, background: equipEditMode ? C.emeraldDim : "rgba(255,255,255,0.04)", color: equipEditMode ? C.emerald : C.muted }}
            >
              {equipEditMode ? "Done" : "Edit"}
            </button>
          </div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 14, lineHeight: 1.5 }}>
            The planner only suggests exercises you can actually do. Tap Edit to change your kit.
          </div>

          {!equipEditMode ? (
            /* ── Collapsed: show active chips only ── */
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20, minHeight: 32 }}>
              {planEquipment.filter((v) => v !== "none").length === 0 ? (
                <span style={{ fontSize: 12, color: C.subtle, fontStyle: "italic" }}>No equipment — bodyweight only</span>
              ) : (
                planEquipment.filter((v) => v !== "none").map((val) => {
                  const eq = ALL_EQUIPMENT.find((e) => e.value === val);
                  return eq ? (
                    <span key={val} style={{ padding: "5px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700, background: C.emeraldDim, border: `1px solid ${C.emeraldBorder}`, color: C.emerald }}>
                      {eq.label}
                    </span>
                  ) : null;
                })
              )}
            </div>
          ) : (
            /* ── Expanded: two-panel drag UI ── */
            <div style={{ marginBottom: 20 }}>
              {/* Your equipment panel */}
              <div
                onDragOver={(e) => { e.preventDefault(); setEquipDropZone("active"); }}
                onDragLeave={() => setEquipDropZone(null)}
                onDrop={(e) => { e.preventDefault(); if (equipDragItem) moveEquip(equipDragItem, true); setEquipDragItem(null); setEquipDropZone(null); }}
                style={{ borderRadius: 14, padding: "12px 14px", marginBottom: 10, border: `1.5px dashed ${equipDropZone === "active" ? C.emerald : C.emeraldBorder}`, background: equipDropZone === "active" ? C.emeraldDim : "rgba(var(--accent-rgb),0.04)", minHeight: 72, transition: "border-color 0.15s, background 0.15s" }}
              >
                <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", color: C.emerald, textTransform: "uppercase", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                  Your equipment
                  <span style={{ background: C.emeraldDim, color: C.emerald, borderRadius: 999, padding: "1px 7px", fontSize: 10, fontWeight: 800 }}>
                    {planEquipment.filter((v) => v !== "none").length}
                  </span>
                </div>
                {planEquipment.filter((v) => v !== "none").length === 0 ? (
                  <div style={{ fontSize: 12, color: C.subtle, fontStyle: "italic", padding: "4px 0" }}>Drag items here or tap ✓ below</div>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {planEquipment.filter((v) => v !== "none").map((val) => {
                      const eq = ALL_EQUIPMENT.find((e) => e.value === val);
                      return eq ? (
                        <div
                          key={val}
                          draggable
                          onDragStart={(e) => { setEquipDragItem(val); e.dataTransfer.effectAllowed = "move"; }}
                          onDragEnd={() => { setEquipDragItem(null); setEquipDropZone(null); }}
                          style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 8px 5px 12px", borderRadius: 999, background: C.emeraldDim, border: `1px solid ${C.emeraldBorder}`, color: C.emerald, fontSize: 12, fontWeight: 700, cursor: "grab", userSelect: "none", opacity: equipDragItem === val ? 0.4 : 1 }}
                        >
                          {eq.label}
                          <button
                            onClick={() => moveEquip(val, false)}
                            style={{ background: "none", border: "none", color: C.emerald, cursor: "pointer", fontSize: 15, lineHeight: 1, padding: "0 2px", opacity: 0.7, fontWeight: 400 }}
                            title="Remove"
                          >×</button>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              {/* Not in use panel */}
              <div
                onDragOver={(e) => { e.preventDefault(); setEquipDropZone("inactive"); }}
                onDragLeave={() => setEquipDropZone(null)}
                onDrop={(e) => { e.preventDefault(); if (equipDragItem) moveEquip(equipDragItem, false); setEquipDragItem(null); setEquipDropZone(null); }}
                style={{ borderRadius: 14, padding: "12px 14px", border: `1.5px dashed ${equipDropZone === "inactive" ? "rgba(255,255,255,0.3)" : C.border}`, background: equipDropZone === "inactive" ? "rgba(255,255,255,0.04)" : "transparent", transition: "border-color 0.15s, background 0.15s" }}
              >
                <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", color: C.muted, textTransform: "uppercase", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                  Not in use
                  <span style={{ background: "rgba(255,255,255,0.06)", color: C.muted, borderRadius: 999, padding: "1px 7px", fontSize: 10, fontWeight: 800 }}>
                    {ALL_EQUIPMENT.filter((e) => !planEquipment.includes(e.value)).length}
                  </span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {ALL_EQUIPMENT.filter((e) => !planEquipment.includes(e.value)).map((eq) => (
                    <div
                      key={eq.value}
                      draggable
                      onDragStart={(e) => { setEquipDragItem(eq.value); e.dataTransfer.effectAllowed = "move"; }}
                      onDragEnd={() => { setEquipDragItem(null); setEquipDropZone(null); }}
                      style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 8px 5px 12px", borderRadius: 999, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, color: C.muted, fontSize: 12, fontWeight: 600, cursor: "grab", userSelect: "none", opacity: equipDragItem === eq.value ? 0.4 : 1 }}
                    >
                      {eq.label}
                      <button
                        onClick={() => moveEquip(eq.value, true)}
                        style={{ background: "none", border: "none", color: C.emerald, cursor: "pointer", fontSize: 13, lineHeight: 1, padding: "0 2px", fontWeight: 900 }}
                        title="Add"
                      >✓</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Daily Adaptive Replan */}
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${C.border}`, marginBottom: 20 }}>
            <div
              onClick={() => {
                if (!prefs.isPro) return;
                const newVal = !prefs.daily_replan;
                onUpdate((p) => ({ ...p, daily_replan: newVal, preferences: { ...(p.preferences ?? {}), daily_replan: newVal } }));
                api.saveProfile(token, { preferences: { ...(prefs.preferences ?? {}), daily_replan: newVal } }).catch(() => {});
              }}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 12px", borderRadius: 12, cursor: prefs.isPro ? "pointer" : "default",
                background: prefs.isPro && prefs.daily_replan ? C.emeraldDim : "rgba(255,255,255,0.03)",
                border: `1px solid ${prefs.isPro && prefs.daily_replan ? C.emeraldBorder : C.border}`,
                opacity: prefs.isPro ? 1 : 0.45,
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: prefs.isPro && prefs.daily_replan ? C.emerald : C.text }}>Daily Adaptive Replan</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                  {prefs.isPro ? "Regenerates plan each morning" : "Upgrade to Pro to unlock"}
                </div>
              </div>
              {prefs.isPro ? (
                <div style={{ width: 36, height: 20, borderRadius: 999, background: prefs.daily_replan ? C.emerald : C.subtle, position: "relative", flexShrink: 0, transition: "background 0.2s" }}>
                  <div style={{ position: "absolute", top: 2, left: prefs.daily_replan ? 18 : 2, width: 16, height: 16, borderRadius: 999, background: "#fff", transition: "left 0.2s" }} />
                </div>
              ) : (
                <div style={{ padding: "4px 10px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, fontSize: 11, fontWeight: 700, color: C.muted }}>
                  Pro only
                </div>
              )}
            </div>
          </div>

          {saveStatus === "saving" && <div style={{ fontSize: 12, color: C.muted, textAlign: "center" }}>Saving…</div>}
          {saveStatus === "saved"  && <div style={{ fontSize: 12, color: "var(--accent)", textAlign: "center", fontWeight: 700 }}>All changes saved ✓</div>}
          {saveStatus === "error"  && <div style={{ fontSize: 12, color: "#f87171", textAlign: "center" }}>Save failed — check connection</div>}
        </Glass>
      </div>

      {/* ── Your Profile ────────────────────────────────────── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", color: C.emerald, textTransform: "uppercase", marginBottom: 16 }}>
          Your Profile
        </div>
        <Glass style={{ padding: 24 }}>
          {/* Subscription row */}
          <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 10 }}>Subscription</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, paddingBottom: 20, borderBottom: `1px solid ${C.border}` }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: C.text, letterSpacing: "-0.02em" }}>{prefs.isPro ? "PRO" : "BASE"} PASS</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{prefs.isPro ? "Adaptive AI planning enabled" : "Core features active"}</div>
            </div>
            <button
              onClick={() => {
                const newVal = !prefs.isPro;
                onUpdate((p) => ({ ...p, isPro: newVal, preferences: { ...(p.preferences ?? {}), isPro: newVal } }));
                api.saveProfile(token, { preferences: { ...(prefs.preferences ?? {}), isPro: newVal } }).catch(() => {});
              }}
              style={{ padding: "8px 16px", borderRadius: 12, fontWeight: 900, fontSize: 12, background: prefs.isPro ? "rgba(255,255,255,0.06)" : "#fff", border: prefs.isPro ? `1px solid ${C.border}` : "none", color: prefs.isPro ? C.muted : "#000", cursor: "pointer", textTransform: "uppercase" }}
            >
              {prefs.isPro ? "Downgrade" : "Upgrade"}
            </button>
          </div>

          {/* Display name */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 8 }}>Display name</div>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              style={{ width: "100%", padding: "10px 14px", borderRadius: 14, background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, color: C.text, fontSize: 15, fontWeight: 700, boxSizing: "border-box", outline: "none" }}
            />
          </div>

          {/* Guest ID */}
          <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: `1px solid ${C.border}`, borderTop: `1px solid ${C.border}`, paddingTop: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 8 }}>Account ID</div>
            <div style={{ width: "100%", padding: "10px 14px", borderRadius: 14, background: "rgba(255,255,255,0.02)", border: `1px solid ${C.border}`, color: C.muted, fontSize: 13, fontWeight: 700, fontFamily: "monospace", boxSizing: "border-box", opacity: 0.6, marginBottom: 8 }}>
              {userId}
            </div>
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
              Your unique identifier — links your workouts, plan, and score to your account privately and securely.
            </div>
          </div>

          {/* Sex */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 8 }}>Sex</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {SEX_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    const leavingFemale = profileSex === "female" && opt.value !== "female";
                    const hasFemaleSettings = bodyMode !== "standard" || cycleTrackingMode === "smart";
                    if (leavingFemale && hasFemaleSettings) {
                      setPendingSex(opt.value);
                      setShowSexWarning(true);
                    } else {
                      setProfileSex(opt.value);
                    }
                  }}
                  style={{ padding: "10px 16px", borderRadius: 14, fontWeight: 900, fontSize: 14, border: `1px solid ${profileSex === opt.value ? C.emeraldBorder : C.border}`, background: profileSex === opt.value ? C.emeraldDim : "rgba(255,255,255,0.04)", color: profileSex === opt.value ? C.emerald : C.muted, cursor: "pointer" }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Weight */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 8 }}>Weight</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="number"
                value={profileWeight}
                onChange={(e) => setProfileWeight(e.target.value)}
                placeholder={profileWeightUnit === "kg" ? "e.g. 70" : "e.g. 154"}
                style={{ flex: 1, padding: "10px 14px", borderRadius: 14, background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, color: C.text, fontSize: 15, fontWeight: 700, outline: "none" }}
              />
              <button
                onClick={() => setProfileWeightUnit(u => u === "kg" ? "lbs" : "kg")}
                style={{ padding: "10px 16px", borderRadius: 14, fontWeight: 900, fontSize: 13, border: `1px solid ${C.emeraldBorder}`, background: C.emeraldDim, color: C.emerald, cursor: "pointer", minWidth: 52, flexShrink: 0 }}
              >
                {profileWeightUnit}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 8 }}>Height</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="number"
                value={profileHeight}
                onChange={(e) => setProfileHeight(e.target.value)}
                placeholder={profileHeightUnit === "cm" ? "e.g. 175" : "e.g. 69"}
                style={{ flex: 1, padding: "10px 14px", borderRadius: 14, background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, color: C.text, fontSize: 15, fontWeight: 700, outline: "none" }}
              />
              <button
                onClick={() => {
                  if (profileHeightUnit === "cm") {
                    setProfileHeightUnit("in");
                    if (profileHeight) setProfileHeight(String(Math.round(parseFloat(profileHeight) / 2.54)));
                  } else {
                    setProfileHeightUnit("cm");
                    if (profileHeight) setProfileHeight(String(Math.round(parseFloat(profileHeight) * 2.54)));
                  }
                }}
                style={{ padding: "10px 16px", borderRadius: 14, fontWeight: 900, fontSize: 13, border: `1px solid ${C.emeraldBorder}`, background: C.emeraldDim, color: C.emerald, cursor: "pointer", minWidth: 52, flexShrink: 0 }}
              >
                {profileHeightUnit}
              </button>
            </div>
            {/* BMI display — shown when both weight and height are filled */}
            {(() => {
              const wkg = (() => { const w = parseFloat(profileWeight); if (isNaN(w)) return null; return profileWeightUnit === "lbs" ? w * 0.453592 : w; })();
              const hcm = (() => { const h = parseFloat(profileHeight); if (isNaN(h)) return null; return profileHeightUnit === "in" ? h * 2.54 : h; })();
              if (!wkg || !hcm || hcm === 0) return null;
              const bmi = wkg / ((hcm / 100) ** 2);
              const { label, color } = bmi < 18.5 ? { label: "Underweight", color: "#60a5fa" }
                : bmi < 25 ? { label: "Normal", color: C.emerald }
                : bmi < 30 ? { label: "Overweight", color: "#f59e0b" }
                : bmi < 35 ? { label: "Obese I", color: "#f97316" }
                : { label: "Obese II", color: "#f87171" };
              const isObese = bmi >= 30;
              return (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 8 }}>BMI</div>
                  <div style={{ width: "100%", padding: "10px 14px", borderRadius: 14, background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, color, fontSize: 15, fontWeight: 900, boxSizing: "border-box" }}>
                    {bmi.toFixed(1)} <span style={{ fontWeight: 600, fontSize: 13 }}>— {label}</span>
                  </div>
                  {isObese && (
                    <div style={{ marginTop: 10, padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: `1px solid ${C.border}` }}>
                      <div style={{ fontSize: 12, color: C.emerald, lineHeight: 1.7, fontWeight: 700, marginBottom: 8 }}>
                        Consistency and will always produce results — every session counts.
                      </div>
                      <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.7 }}>
                        JustFit uses your BMI to protect your joints — at this range, the planner will substitute low-impact alternatives for running and high-impact cardio to reduce injury risk as you build fitness.
                      </div>
                      <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.7, marginTop: 8, fontStyle: "italic" }}>
                        We are not a medical app. Always seek advice from a qualified health professional before starting or changing your exercise routine.
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Female-only: cycle tracking */}
          {profileSex === "female" && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 8 }}>Cycle tracking</div>
              <div style={{ display: "flex", gap: 8, marginBottom: cycleTrackingMode === "smart" ? 14 : 0 }}>
                {[{ label: "Smart", value: "smart" }, { label: "Off", value: "off" }].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setCycleTrackingMode(opt.value)}
                    style={{ flex: 1, padding: "10px 16px", borderRadius: 14, fontWeight: 900, fontSize: 14, border: `1px solid ${cycleTrackingMode === opt.value ? C.emeraldBorder : C.border}`, background: cycleTrackingMode === opt.value ? C.emeraldDim : "rgba(255,255,255,0.04)", color: cycleTrackingMode === opt.value ? C.emerald : C.muted, cursor: "pointer" }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {cycleTrackingMode === "smart" && (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>Last period start</div>
                    <input
                      type="date"
                      value={lastPeriodStart}
                      onChange={(e) => setLastPeriodStart(e.target.value)}
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 14, background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, color: C.text, fontSize: 14, fontWeight: 700, boxSizing: "border-box", outline: "none" }}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>Cycle length (days)</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {CYCLE_LENGTHS_SETTINGS.map((d) => (
                        <button
                          key={d}
                          onClick={() => setCycleLength(d)}
                          style={{ padding: "6px 12px", borderRadius: 10, fontWeight: 900, fontSize: 13, border: `1px solid ${cycleLength === d ? C.emeraldBorder : C.border}`, background: cycleLength === d ? C.emeraldDim : "rgba(255,255,255,0.04)", color: cycleLength === d ? C.emerald : C.muted, cursor: "pointer" }}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Female-only: pregnancy/postnatal status */}
          {profileSex === "female" && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 8 }}>Body mode</div>

              {/* Standard — show activate button, or inline setup steps */}
              {bodyMode === "standard" && pregnancySetupStep === 0 && (
                <>
                  <button
                    onClick={() => setPregnancySetupStep(1)}
                    style={{ width: "100%", padding: "10px 16px", borderRadius: 14, fontWeight: 700, fontSize: 14, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.04)", color: C.muted, cursor: "pointer", textAlign: "left" }}
                  >
                    Standard · Enable pregnancy mode →
                  </button>
                  <div style={{ fontSize: 11, color: C.subtle, marginTop: 6, lineHeight: 1.5 }}>
                    Pregnancy mode covers the full journey — from conception through to 3 months after birth.
                  </div>
                </>
              )}

              {/* Step 1 — Medical advisory (inline, shown right after clicking) */}
              {bodyMode === "standard" && pregnancySetupStep === 1 && (
                <div style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 14, padding: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#fbbf24", marginBottom: 10 }}>Step 1 of 2 — Medical guidance</div>
                  <div style={{ fontSize: 12, color: C.text, lineHeight: 1.7, marginBottom: 6 }}>
                    JustFit is a fitness app, not a medical service. Pregnancy mode is designed for use during the 9 months of pregnancy and up to 3 months after birth.
                  </div>
                  <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6, marginBottom: 16 }}>
                    Please confirm that you have discussed or will discuss exercise with your midwife, GP, or OB-GYN.
                  </div>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", marginBottom: 16 }}>
                    <input
                      type="checkbox"
                      checked={medicalClearance}
                      onChange={(e) => setMedicalClearance(e.target.checked)}
                      style={{ marginTop: 2, accentColor: "#fbbf24", width: 16, height: 16, flexShrink: 0 }}
                    />
                    <span style={{ fontSize: 12, color: C.text, lineHeight: 1.6 }}>
                      I will seek medical guidance regarding exercise during this period.
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
                </div>
              )}

              {/* Step 2 — Due date (inline) */}
              {bodyMode === "standard" && pregnancySetupStep === 2 && (
                <div style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 14, padding: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#fbbf24", marginBottom: 10 }}>Step 2 of 2 — Your due date</div>
                  <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>When is your estimated due date?</div>
                  <input
                    type="date"
                    value={pregnancyDueDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setPregnancyDueDate(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, color: C.text, fontSize: 14, outline: "none", fontFamily: "inherit", marginBottom: 12, boxSizing: "border-box" }}
                  />
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 14, lineHeight: 1.6 }}>
                    Your due date helps us calculate your trimester and adapt sessions accordingly. You can update it anytime.
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
                </div>
              )}

              {bodyMode === "pregnant" && (
                <div style={{ borderRadius: 14, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)", overflow: "hidden" }}>
                  <div style={{ padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: 14 }}>
                      Pregnancy mode active
                      {pregnancyDueDate && <span style={{ color: C.muted, fontWeight: 500 }}> · Due {pregnancyDueDate}</span>}
                    </span>
                    <button
                      onClick={handleDeactivateBodyMode}
                      disabled={bodyModeDeactivating}
                      style={{ padding: "5px 12px", borderRadius: 10, fontSize: 12, fontWeight: 800, border: "1px solid rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.1)", color: "#f59e0b", cursor: "pointer", flexShrink: 0, opacity: bodyModeDeactivating ? 0.5 : 1 }}
                    >
                      {bodyModeDeactivating ? "…" : "Deactivate"}
                    </button>
                  </div>
                </div>
              )}
              {bodyMode === "postnatal" && (
                <div style={{ borderRadius: 14, background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.3)", overflow: "hidden" }}>
                  <div style={{ padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ color: "#f43f5e", fontWeight: 700, fontSize: 14 }}>Postnatal mode active</span>
                    <button
                      onClick={handleDeactivateBodyMode}
                      disabled={bodyModeDeactivating}
                      style={{ padding: "5px 12px", borderRadius: 10, fontSize: 12, fontWeight: 800, border: "1px solid rgba(244,63,94,0.3)", background: "rgba(244,63,94,0.1)", color: "#f43f5e", cursor: "pointer", flexShrink: 0, opacity: bodyModeDeactivating ? 0.5 : 1 }}
                    >
                      {bodyModeDeactivating ? "…" : "Deactivate"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {saveStatus === "saving" && <div style={{ fontSize: 12, color: C.muted, textAlign: "center" }}>Saving…</div>}
          {saveStatus === "saved"  && <div style={{ fontSize: 12, color: "var(--accent)", textAlign: "center", fontWeight: 700 }}>All changes saved ✓</div>}
          {saveStatus === "error"  && <div style={{ fontSize: 12, color: "#f87171", textAlign: "center" }}>Save failed — check connection</div>}
        </Glass>

        {/* Sex-change warning modal */}
        {showSexWarning && (
          <div
            onClick={() => setShowSexWarning(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ width: "100%", maxWidth: 380, background: "#0a1628", border: `1px solid ${C.border}`, borderRadius: 24, padding: 28 }}
            >
              <div style={{ fontSize: 20, fontWeight: 900, color: C.text, letterSpacing: "-0.02em", marginBottom: 10 }}>
                Deactivate female settings?
              </div>
              <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, marginBottom: 20 }}>
                Switching to <strong style={{ color: C.text }}>{pendingSex === "male" ? "Male" : "Non-binary"}</strong> will deactivate:
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
                {bodyMode !== "standard" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
                    <span style={{ fontSize: 16 }}>🤰</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#f59e0b" }}>
                      {bodyMode === "pregnant" ? "Pregnancy mode" : "Postnatal mode"}
                    </span>
                  </div>
                )}
                {cycleTrackingMode === "smart" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, background: "rgba(var(--accent-rgb),0.06)", border: `1px solid ${C.emeraldBorder}` }}>
                    <span style={{ fontSize: 16 }}>🔄</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.emerald }}>Smart cycle tracking</span>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => { setShowSexWarning(false); setPendingSex(null); }}
                  style={{ flex: 1, padding: "13px 0", borderRadius: 14, fontWeight: 800, fontSize: 14, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.04)", color: C.muted, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSexChange}
                  style={{ flex: 2, padding: "13px 0", borderRadius: 14, fontWeight: 900, fontSize: 14, background: "#ef4444", border: "none", color: "#fff", cursor: "pointer" }}
                >
                  Yes, deactivate
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginBottom: 32 }}>
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
                  background: passkeyMsg.startsWith("✓") ? "rgba(var(--accent-rgb),0.1)" : "rgba(226,76,74,0.1)",
                  border: `1px solid ${passkeyMsg.startsWith("✓") ? "rgba(var(--accent-rgb),0.3)" : "rgba(226,76,74,0.3)"}`,
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
      </div>

      {/* ── Appearance ─────────────────────────────────────── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", color: C.emerald, textTransform: "uppercase", marginBottom: 16 }}>
          Appearance
        </div>
        <Glass style={{ padding: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 16 }}>
            Accent colour
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {ACCENT_COLORS.map((ac) => {
              const selected = accentHex === ac.hex;
              return (
                <button
                  key={ac.id}
                  title={ac.name}
                  onClick={() => {
                    setAccentHex(ac.hex);
                    applyAccent(ac.hex);
                  }}
                  style={{
                    width: 36, height: 36,
                    borderRadius: "50%",
                    background: ac.hex,
                    border: selected ? `3px solid ${C.text}` : "3px solid transparent",
                    outline: selected ? `2px solid ${ac.hex}` : "none",
                    outlineOffset: 2,
                    cursor: "pointer",
                    padding: 0,
                    boxShadow: selected ? `0 0 0 1px ${ac.hex}` : "none",
                    transition: "transform 0.12s, box-shadow 0.12s",
                    transform: selected ? "scale(1.15)" : "scale(1)",
                    flexShrink: 0,
                  }}
                />
              );
            })}
          </div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 14, lineHeight: 1.5 }}>
            {ACCENT_COLORS.find((a) => a.hex === accentHex)?.name ?? "Custom"} — saved locally on this device.
          </div>
        </Glass>
      </div>

      {/* ── Information ─────────────────────────────────────── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", color: C.emerald, textTransform: "uppercase", marginBottom: 16 }}>
          Information
        </div>
        <Glass style={{ padding: 20 }}>
          {[
            { key: "vision", label: "Vision, Mission & Philosophy", sub: "What JustFit stands for and why consistency wins" },
            { key: "how_it_works", label: "How It Works", sub: "Features, the planner engine, scoring, and coaching" },
            { key: "terms", label: "Terms & Conditions", sub: "Usage rules and governing law" },
            { key: "disclaimer", label: "Disclaimer & Liability Waiver", sub: "Health risks, medical advice, and your responsibility" },
          ].map(({ key, label, sub }, i, arr) => (
            <button
              key={key}
              onClick={() => setShowInfoPage(key)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                width: "100%", padding: "12px 0", background: "none", border: "none", cursor: "pointer",
                borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none",
                textAlign: "left",
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{label}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{sub}</div>
              </div>
              <span style={{ color: C.muted, fontSize: 18, marginLeft: 12, flexShrink: 0 }}>›</span>
            </button>
          ))}
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

      <div style={{marginTop:24, display:"flex", flexDirection:"column", gap:10}}>
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
function estimateMins(p) {
  if (!p || p.slot_type === "rest") return null;
  const steps = p.steps ?? [];
  if (!steps.length) return p.slot_type === "micro" ? 12 : 20;
  const totalSec = steps.reduce((s, step) => {
    const sets = step.sets ?? 3;
    const active = step.target_duration_sec
      ? step.target_duration_sec * sets
      : (step.target_reps ?? 10) * sets * 3;
    const rest = (step.rest_sec ?? 45) * Math.max(0, sets - 1);
    return s + active + rest;
  }, 0);
  return Math.max(5, Math.round(totalSec / 60));
}

function PlanWeekView({ history, plan, userId }) {
  const today = new Date().toISOString().split("T")[0];
  const [upcomingPlans, setUpcomingPlans] = useState([]);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);

  const upcomingDates = Array.from({ length: 5 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return d.toISOString().split("T")[0];
  });

  useEffect(() => {
    if (!userId) { setLoadingUpcoming(false); return; }
    const cacheKey = `jf_upcoming_${today}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try { setUpcomingPlans(JSON.parse(cached)); setLoadingUpcoming(false); return; } catch {}
    }
    Promise.all(
      upcomingDates.map((date) => api.generatePlan(userId, date, null).catch(() => null))
    ).then((plans) => {
      const result = upcomingDates.map((date, i) => ({ date, plan: plans[i] }));
      sessionStorage.setItem(cacheKey, JSON.stringify(result));
      setUpcomingPlans(result);
      setLoadingUpcoming(false);
    });
  }, [userId]);

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
                    ? "rgba(var(--accent-rgb),0.06)"
                    : "rgba(255,255,255,0.02)",
                border: `1px solid ${isToday ? C.emeraldBorder : done ? "rgba(var(--accent-rgb),0.2)" : C.border}`,
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

      {/* Today's plan */}
      {plan && plan.slot_type !== "rest" && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", color: C.emerald, textTransform: "uppercase", marginBottom: 16 }}>
            Today's Plan
          </div>
          <Glass style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: plan.steps?.length ? 10 : 0 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 3 }}>
                  {plan.session_name || "Today's session"}
                </div>
                <div style={{ fontSize: 12, color: C.muted }}>
                  {(() => { const d = new Date(today + "T12:00:00"); return `${dayNames[d.getDay()]}, ${monthNames[d.getMonth()]} ${d.getDate()}`; })()}
                </div>
              </div>
              {estimateMins(plan) && (
                <div style={{ padding: "4px 12px", borderRadius: 999, background: C.emeraldDim, border: `1px solid ${C.emeraldBorder}`, fontSize: 12, fontWeight: 800, color: C.emerald, flexShrink: 0 }}>
                  ~{estimateMins(plan)} min
                </div>
              )}
            </div>
            {plan.steps?.length > 0 && (
              <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.7 }}>
                {plan.steps.slice(0, 5).map((s) => s.name).join(" · ")}
                {plan.steps.length > 5 && ` · +${plan.steps.length - 5} more`}
              </div>
            )}
          </Glass>
        </div>
      )}

      {/* Coming up */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", color: C.emerald, textTransform: "uppercase", marginBottom: 16 }}>
          Coming Up
        </div>
        {loadingUpcoming ? (
          <Glass style={{ padding: 20, textAlign: "center" }}>
            <div style={{ fontSize: 13, color: C.muted }}>Predicting upcoming sessions…</div>
          </Glass>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {upcomingPlans.map(({ date, plan: p }) => {
              const d = new Date(date + "T12:00:00");
              const mins = estimateMins(p);
              const isRest = !p || p.slot_type === "rest";
              const exercises = p?.steps?.slice(0, 4).map((s) => s.name) ?? [];
              const extra = Math.max(0, (p?.steps?.length ?? 0) - 4);
              return (
                <Glass key={date} style={{ padding: "14px 18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: exercises.length && !isRest ? 8 : 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase" }}>
                        {dayNames[d.getDay()]}
                      </span>
                      <span style={{ fontSize: 12, color: C.muted }}>
                        {monthNames[d.getMonth()]} {d.getDate()}
                      </span>
                    </div>
                    {isRest ? (
                      <div style={{ padding: "3px 10px", borderRadius: 999, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, fontSize: 11, fontWeight: 700, color: C.muted }}>
                        Rest day
                      </div>
                    ) : mins ? (
                      <div style={{ padding: "3px 10px", borderRadius: 999, background: C.emeraldDim, border: `1px solid ${C.emeraldBorder}`, fontSize: 11, fontWeight: 800, color: C.emerald }}>
                        ~{mins} min
                      </div>
                    ) : null}
                  </div>
                  {!isRest && exercises.length > 0 && (
                    <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
                      {exercises.join(" · ")}{extra > 0 ? ` · +${extra} more` : ""}
                    </div>
                  )}
                </Glass>
              );
            })}
          </div>
        )}
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
    label: "History",
    icon: (a) => (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke={a ? "var(--accent)" : "#64748b"}
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

  // Onboarding / waiver / goal-recheck flow
  const [showWaiver, setShowWaiver] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showGoalRecheck, setShowGoalRecheck] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [onboardingReady, setOnboardingReady] = useState(false);
  const [lastCheckin, setLastCheckin] = useState(null);

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

  // After profile load: advance to ready, or show goal recheck for existing users on new version
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
    // Fetch last check-in to pre-fill next check-in modal
    api.getLastCheckin(userId).then(setLastCheckin).catch(() => {});
    if (localStorage.getItem("jf_version") !== APP_VERSION) {
      setProfileData(data);
      setShowGoalRecheck(true);
    } else {
      setOnboardingReady(true);
    }
  }

  // On mount: check waiver → check profile
  useEffect(() => {
    if (!userId || !token) return;
    const waiverAccepted = localStorage.getItem("jf_waiver") === "1";
    if (!waiverAccepted) {
      setShowWaiver(true);
      return;
    }
    api.getProfile(token).then((data) => {
      if (!data.exists) {
        setShowOnboarding(true);
      } else {
        handleProfileLoaded(data);
      }
    }).catch(() => setOnboardingReady(true));
  }, []);


  const handleWaiverAccept = () => {
    localStorage.setItem("jf_waiver", "1");
    setShowWaiver(false);
    api.getProfile(token).then((data) => {
      if (!data.exists) {
        setShowOnboarding(true);
      } else {
        handleProfileLoaded(data);
      }
    }).catch(() => setOnboardingReady(true));
  };

  const handleGoalRecheckComplete = (newGoal) => {
    localStorage.setItem("jf_version", APP_VERSION);
    setShowGoalRecheck(false);
    setPrefs((p) => ({ ...p, training_goal: newGoal }));
    setOnboardingReady(true);
    const mode = prefs.preferences?.checkin_mode ?? "once_a_day";
    if (mode !== "manual") setShowCheckIn(true);
  };

  const handleOnboardingComplete = (completedProfileData) => {
    localStorage.setItem("jf_version", APP_VERSION);
    setShowOnboarding(false);
    setOnboardingReady(true);
    if (completedProfileData) {
      setPrefs((p) => ({ ...p, ...completedProfileData }));
    }
    const mode = (completedProfileData?.preferences?.checkin_mode) ?? prefs.preferences?.checkin_mode ?? "once_a_day";
    if (mode !== "manual") setShowCheckIn(true);
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
      .catch(() => setIsLoadingHistory(false));
  }, [userId, onboardingReady]);

  // Show check-in based on mode; if check-in won't be shown, load or generate today's plan
  useEffect(() => {
    if (!onboardingReady) return;
    const mode = prefs.preferences?.checkin_mode ?? "once_a_day";
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
            return api.generatePlan(userId, today, null)
              .then(setPlan)
              .catch(() => {})
              .finally(() => setIsGenerating(false));
          }
        })
        .catch(() => setIsGenerating(false));
    }
  }, [onboardingReady]);

  const handleCheckIn = useCallback(
    async (data) => {
      setShowCheckIn(false);
      setView("today");
      localStorage.setItem("jf_checkin_date", today);
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

  const handleSkipCheckIn = useCallback(async () => {
    setShowCheckIn(false);
    setView("today");
    localStorage.setItem("jf_checkin_date", today);
    setIsGenerating(true);
    try {
      const newPlan = await api.generatePlan(userId, today, null);
      setPlan(newPlan);
    } catch (e) {
      console.error("Plan generation failed:", e);
    } finally {
      setIsGenerating(false);
    }
  }, [userId, today]);

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
        await api.saveExecution(userId, bonusPlan?.id, today, mergedSteps, durationSec, perceivedExertion, "bonus");
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

  const handleDeleteExecution = useCallback(
    async (executionId) => {
      const targetExec = history.find((h) => h.id === executionId);
      const isToday = targetExec?.date === today;
      setHistory((prev) => prev.filter((h) => h.id !== executionId));
      await api.deleteExecution(executionId, userId);
      const newScore = await api.getScore(userId);
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
    [userId, history, today],
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
        button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
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
              <svg width="38" height="38" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" style={{ filter: "drop-shadow(0 4px 20px rgba(var(--accent-rgb),0.3))", flexShrink: 0 }}>
                <rect x="2" y="2" width="60" height="60" rx="14" fill="var(--accent)"/>
                <g transform="translate(8 4) scale(2.2)">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
                </g>
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
                  prefs={prefs}
                />
              </>
            )}
            {view === "plan" && (
              <PlanWeekView history={history} plan={plan} userId={userId} />
            )}
            {view === "history" && (
              <HistoryView history={history} isLoading={isLoadingHistory} onDeleteExecution={handleDeleteExecution} />
            )}
            {view === "awards" && (
              <AwardsView
                history={history}
                score={score}
                isPro={!!prefs.isPro}
              />
            )}
            {view === "settings" && (
              <SettingsView prefs={prefs} onUpdate={setPrefs} userId={userId} token={token} onChangeGoal={() => setShowGoalRecheck(true)} />
            )}
          </>
        )}
      </div>

      {!inWorkout && <Nav view={view} setView={setView} />}

      {showCheckIn && (
        <CheckInModal
          onSave={handleCheckIn}
          onClose={handleSkipCheckIn}
          isPro={!!prefs.isPro}
          sex={prefs.sex}
          cycle={prefs.cycle}
          defaultTimeBudget={(() => {
            const dayKey = ['sun','mon','tue','wed','thu','fri','sat'][new Date().getDay()];
            const scheduled = prefs.preferences?.weekly_schedule?.[dayKey];
            return (scheduled && scheduled > 0) ? scheduled : (prefs.session_duration_min ?? 30);
          })()}
          lastCheckin={lastCheckin}
        />
      )}

      {showWaiver && <EUWaiverModal onAccept={handleWaiverAccept} />}

      {showOnboarding && !showWaiver && (
        <OnboardingModal token={token} onComplete={handleOnboardingComplete} />
      )}

      {showGoalRecheck && !showWaiver && !showOnboarding && (
        <GoalRecheckModal token={token} profileData={profileData} onComplete={handleGoalRecheckComplete} />
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
