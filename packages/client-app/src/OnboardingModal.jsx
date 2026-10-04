// First-run / re-do onboarding. Moved out of App.jsx (F4); lazy — shown once.
import { useState } from "react";
import { C } from "./tokens.js";
import { EXPERIENCE, EQUIPMENT_OPTIONS, ONBOARDING_SPORTS, SEX_OPTIONS, CYCLE_LENGTHS } from "./appConstants.js";
import api from "./apiClient.js";

// Default last period ≈ 4 weeks ago
function defaultPeriodDate() {
  const d = new Date();
  d.setDate(d.getDate() - 28);
  return d.toISOString().split("T")[0];
}

export default function OnboardingModal({ token, prefs, onComplete, onBack }) {
  const p = prefs ?? {};
  const pp = p.preferences ?? {};
  const [step, setStep] = useState(0);
  // Step 0 — About you (pre-filled from existing prefs)
  const [displayName, setDisplayName] = useState(pp.display_name ?? "");
  const [sex, setSex] = useState(p.sex ?? null);
  const [weightInput, setWeightInput] = useState(p.weight_kg ? String(p.weight_kg) : "");
  const [weightUnit, setWeightUnit] = useState("kg");
  const [heightInput, setHeightInput] = useState(p.height_cm ? String(p.height_cm) : "");
  const [heightUnit, setHeightUnit] = useState("cm");
  const [showCycleSetup, setShowCycleSetup] = useState(false);
  const [lastPeriodStart, setLastPeriodStart] = useState(defaultPeriodDate());
  const [cycleLength, setCycleLength] = useState(28);
  const [cycleTrackingMode, setCycleTrackingMode] = useState(null);
  const [cycleSetupDone, setCycleSetupDone] = useState(false);
  // Steps 1-3 (pre-filled from existing prefs)
  const [goal, setGoal] = useState(p.training_goal ?? "health");
  const [experience, setExperience] = useState(p.experience_level ?? "beginner");
  const [equipment, setEquipment] = useState(pp.available_equipment ?? ["none"]);
  const [duration, setDuration] = useState(p.session_duration_min ?? 45);
  const [sports, setSports] = useState((pp.sport_prefs?.sports) ?? []);
  const [saving, setSaving] = useState(false);
  const [isPregnancyGoal, setIsPregnancyGoal] = useState(false);

  const TOTAL_STEPS = 6;

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
      let weight_kg;
      if (weightInput) {
        const w = parseFloat(weightInput);
        if (!isNaN(w)) weight_kg = weightUnit === "lbs" ? Math.round(w * 0.453592 * 10) / 10 : w;
      }
      let height_cm;
      if (heightInput) {
        const h = parseFloat(heightInput);
        if (!isNaN(h)) height_cm = heightUnit === "in" ? Math.round(h * 2.54 * 10) / 10 : h;
      }
      const cycle = (sex === "female" && cycleTrackingMode === "smart")
        ? { tracking_mode: "smart", cycle_length_days: cycleLength, last_period_start: lastPeriodStart }
        : { tracking_mode: "off" };

      const prefPayload = { available_equipment: equipment };
      if (displayName.trim()) prefPayload.display_name = displayName.trim();
      if (sports.length > 0) prefPayload.sport_prefs = { sports, primary: sports[0] };
      const profilePayload = {
        training_goal: goal,
        experience_level: experience,
        session_duration_min: duration,
        days_per_week_target: 3,
        preferences: prefPayload,
        sex,
        cycle,
      };
      // Only include body metrics if the user provided values (avoids overwriting with null)
      if (weight_kg !== undefined) profilePayload.weight_kg = weight_kg;
      if (height_cm !== undefined) profilePayload.height_cm = height_cm;
      await api.saveProfile(token, profilePayload);
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
        background: "rgba(var(--bg-rgb),0.92)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          background: C.sheet,
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

          {/* ── Step 2: About you ── */}
          {step === 2 && (
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
                  background: "rgba(var(--overlay-rgb),0.05)", border: `1px solid ${C.border}`,
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
                      background: sex === opt.value ? C.emeraldDim : "rgba(var(--overlay-rgb),0.03)",
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
                    background: "rgba(var(--overlay-rgb),0.05)", border: `1px solid ${C.border}`,
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
                    background: "rgba(var(--overlay-rgb),0.05)", border: `1px solid ${C.border}`,
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
                      <div style={{ fontSize: 15, fontWeight: 900, color: C.text, marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>Train with your natural rhythm</div>
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
                      <div style={{ fontSize: 14, fontWeight: 900, color: C.text, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>Set up cycle tracking</div>
                      <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>When did your last period start?</div>
                      <input
                        type="date"
                        value={lastPeriodStart}
                        max={new Date().toISOString().split("T")[0]}
                        onChange={(e) => setLastPeriodStart(e.target.value)}
                        style={{ width: "100%", padding: "10px 14px", borderRadius: 12, background: "rgba(var(--overlay-rgb),0.05)", border: `1px solid ${C.border}`, color: C.text, fontSize: 14, outline: "none", fontFamily: "inherit", marginBottom: 16, boxSizing: "border-box" }}
                      />
                      <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>How long is your typical cycle?</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                        {CYCLE_LENGTHS.map((d) => (
                          <button
                            key={d}
                            onClick={() => setCycleLength(d)}
                            style={{ padding: "7px 12px", borderRadius: 999, fontSize: 13, fontWeight: 700, border: `1px solid ${cycleLength === d ? C.emeraldBorder : C.border}`, background: cycleLength === d ? C.emeraldDim : "rgba(var(--overlay-rgb),0.03)", color: cycleLength === d ? C.emerald : C.muted, cursor: "pointer" }}
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
                          style={{ flex: 2, padding: "10px 16px", borderRadius: 12, background: C.emerald, border: "none", color: C.onAccent, fontWeight: 900, fontSize: 13, cursor: "pointer" }}
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
              <div style={{ fontSize: 22, fontWeight: 900, color: C.text, letterSpacing: "-0.02em", marginBottom: 6 }}>What's your primary goal?</div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>Your plan adapts around this every day.</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { value: "fat_loss", label: "Lose weight & feel better", sub: "Burn fat, build energy", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg> },
                  { value: "strength", label: "Build strength & muscle", sub: "Get stronger week by week", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4v6a6 6 0 0 0 12 0V4"/><line x1="4" y1="4" x2="20" y2="4"/></svg> },
                  { value: "health", label: "Improve overall fitness", sub: "More stamina, more capacity", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg> },
                  { value: "mobility", label: "Boost energy & manage stress", sub: "Consistent movement, calmer mind", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg> },
                  { value: "pregnancy", label: "Stay active during/after pregnancy", sub: "Safe movement for every phase", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="6" r="3"/><path d="M9 13c-2 .5-4 2-4 4v1h14v-1c0-2-2-3.5-4-4"/><path d="M12 13v5"/></svg> },
                ].map((g) => {
                  const isSelected = g.value === "pregnancy" ? isPregnancyGoal : (!isPregnancyGoal && goal === g.value);
                  return (
                    <button
                      key={g.value}
                      onClick={() => {
                        if (g.value === "pregnancy") {
                          setIsPregnancyGoal(true);
                          setGoal("health");
                        } else {
                          setIsPregnancyGoal(false);
                          setGoal(g.value);
                        }
                      }}
                      style={{
                        padding: "14px 16px", borderRadius: 16, textAlign: "left",
                        border: `1px solid ${isSelected ? C.emeraldBorder : C.border}`,
                        background: isSelected ? C.emeraldDim : "rgba(var(--overlay-rgb),0.03)",
                        cursor: "pointer", display: "flex", alignItems: "center", gap: 14,
                      }}
                    >
                      <div style={{ flexShrink: 0, width: 36, height: 36, borderRadius: 10, background: isSelected ? "rgba(var(--accent-rgb),0.2)" : "rgba(var(--overlay-rgb),0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: isSelected ? "var(--accent)" : C.muted }}>
                        {g.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: isSelected ? C.emerald : C.text, marginBottom: 2 }}>{g.label}</div>
                        <div style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>{g.sub}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
              {isPregnancyGoal && (
                <div style={{ marginTop: 12, fontSize: 12, color: C.warning, lineHeight: 1.5, padding: "10px 14px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 12 }}>
                  You'll complete pregnancy setup in Settings after onboarding.
                </div>
              )}
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
                      background: experience === e.value ? C.emeraldDim : "rgba(var(--overlay-rgb),0.03)",
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
                      background: equipment.includes(eq.value) ? C.emeraldDim : "rgba(var(--overlay-rgb),0.03)",
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
              <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                {DURATION_OPTIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    style={{
                      flex: 1, padding: "10px 0", borderRadius: 12,
                      border: `1px solid ${duration === d ? C.emeraldBorder : C.border}`,
                      background: duration === d ? C.emeraldDim : "rgba(var(--overlay-rgb),0.03)",
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

          {/* ── Step 5: Sports (optional) ── */}
          {step === 5 && (
            <>
              <div style={{ fontSize: 22, fontWeight: 900, color: C.text, letterSpacing: "-0.02em", marginBottom: 6 }}>Any sports you play?</div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 20, lineHeight: 1.5 }}>
                Optional — we'll complement your training and fill the gaps your sport doesn't cover.
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {ONBOARDING_SPORTS.map((s) => {
                  const active = sports.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSports(prev =>
                        prev.includes(s.id) ? prev.filter(x => x !== s.id) : [...prev, s.id]
                      )}
                      style={{
                        padding: "8px 14px", borderRadius: 999, fontWeight: 700, fontSize: 13,
                        border: `1px solid ${active ? C.emeraldBorder : C.border}`,
                        background: active ? C.emeraldDim : "rgba(var(--overlay-rgb),0.03)",
                        color: active ? C.emerald : C.muted, cursor: "pointer",
                      }}
                    >
                      {s.label}
                      {active && sports[0] === s.id && (
                        <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", marginLeft: 6, opacity: 0.7 }}>
                          Primary
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {sports.length > 0 && (
                <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>
                  First tap = primary sport. The planner fills the gaps it doesn't cover.
                </div>
              )}
              {sports.length === 0 && (
                <div style={{ fontSize: 12, color: C.muted, marginTop: 12, lineHeight: 1.5 }}>
                  No sport? That's fine — tap "Start Training" to begin with a balanced plan.
                </div>
              )}
            </>
          )}
        </div>

        <div style={{ padding: "0 28px 28px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 10 }}>
            {/* Back: on waiver step triggers logout; on other steps goes back */}
            <button
              onClick={step === 0 ? onBack : () => setStep(step - 1)}
              style={{ flex: 1, padding: 14, borderRadius: 16, border: `1px solid ${C.border}`, background: "rgba(var(--overlay-rgb),0.03)", color: C.muted, fontWeight: 700, fontSize: 14, cursor: "pointer" }}
            >
              {step === 0 ? "← Log out" : "Back"}
            </button>
            {/* Main action */}
            <button
              onClick={step === 0 ? () => setStep(1) : step < TOTAL_STEPS - 1 ? () => setStep(step + 1) : handleFinish}
              disabled={saving}
              style={{ flex: 2, padding: 14, borderRadius: 16, border: "none", background: C.emerald, color: C.onAccent, fontWeight: 900, fontSize: 15, cursor: "pointer", boxShadow: "0 8px 32px rgba(var(--accent-rgb),0.35)", opacity: saving ? 0.7 : 1 }}
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
