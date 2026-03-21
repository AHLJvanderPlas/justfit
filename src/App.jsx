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

  async saveExecution(userId, planId, date, steps, durationSec) {
    const res = await fetch("/api/execution", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        date,
        day_plan_id: planId ?? null,
        session_type: "workout",
        duration_sec: durationSec,
        steps: steps.map((s) => ({
          exercise_id: s.exercise_id,
          prescribed: {
            reps: s.target_reps,
            duration: s.target_duration,
            sets: s.sets,
          },
          actual: { completed: true },
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

// ─── CHECK-IN MODAL ───────────────────────────────────────────────────────────
const TIME_OPTIONS = [5, 10, 15, 20, 30, 45, 60, 90];

function CheckInModal({ onSave, onClose, isPro }) {
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
    free_text: "",
  });
  const upd = (patch) => setD((prev) => ({ ...prev, ...patch }));

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
        free_text: d.free_text,
        motivation: d.motivation,
        time_budget: d.time_budget,
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
          </div>

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

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ plan, score, onStartWorkout, isGenerating }) {
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

        {/* Session card */}
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
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: C.emerald,
                          flexShrink: 0,
                        }}
                      />
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
function WorkoutView({ plan, onComplete, onBack }) {
  const [step, setStep] = useState(0);
  const [timer, setTimer] = useState(null);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (timer === null || timer <= 0) return;
    const id = setInterval(() => setTimer((t) => (t <= 1 ? 0 : t - 1)), 1000);
    return () => clearInterval(id);
  }, [timer]);

  if (!plan || plan.slot_type === "rest")
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          gap: 20,
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: C.emeraldDim,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke={C.emerald}
            strokeWidth="1.5"
          >
            <rect width="18" height="18" x="3" y="4" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 28, fontWeight: 900, color: C.text }}>
            Time to Recover.
          </div>
          <p
            style={{
              fontSize: 14,
              color: C.muted,
              marginTop: 8,
              lineHeight: 1.5,
            }}
          >
            Your plan calls for active recovery today.
          </p>
        </div>
        <button
          onClick={onBack}
          style={{
            padding: "12px 28px",
            borderRadius: 16,
            fontWeight: 700,
            fontSize: 14,
            background: "rgba(255,255,255,0.05)",
            border: `1px solid ${C.border}`,
            color: C.emerald,
            cursor: "pointer",
          }}
        >
          Return Home
        </button>
      </div>
    );

  const steps = plan.steps ?? [];
  const cur = steps[step];
  const isLast = step === steps.length - 1;

  const next = () => {
    if (!isLast) {
      setStep((s) => s + 1);
      setTimer(null);
    }
  };

  const finish = () => {
    const durationSec = Math.floor((Date.now() - startTime) / 1000);
    onComplete(durationSec);
  };

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", paddingBottom: 120 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 40,
        }}
      >
        <button
          onClick={onBack}
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: C.muted,
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
        <div style={{ display: "flex", gap: 4 }}>
          {steps.map((_, i) => (
            <div
              key={i}
              style={{
                height: 4,
                borderRadius: 2,
                transition: "all 0.3s",
                width: i <= step ? 28 : 14,
                background: i <= step ? C.emerald : "rgba(255,255,255,0.1)",
              }}
            />
          ))}
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 900,
            color: C.emerald,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          {step + 1}/{steps.length}
        </span>
      </div>

      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <h1
          style={{
            fontSize: 42,
            fontWeight: 900,
            color: C.text,
            letterSpacing: "-0.03em",
            marginBottom: 10,
            lineHeight: 1.1,
          }}
        >
          {cur?.name}
        </h1>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 32,
        }}
      >
        <Glass style={{ padding: 24, textAlign: "center" }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: "0.15em",
              color: "rgba(16,185,129,0.6)",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Target
          </div>
          <div style={{ fontSize: 36, fontWeight: 900, color: C.text }}>
            {cur?.target_reps
              ? `${cur.target_reps}`
              : `${cur?.target_duration}s`}
          </div>
          <div
            style={{
              fontSize: 12,
              color: C.muted,
              fontWeight: 600,
              marginTop: 4,
            }}
          >
            {cur?.target_reps ? "reps" : "seconds"}
          </div>
        </Glass>
        <Glass style={{ padding: 24, textAlign: "center" }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: "0.15em",
              color: "rgba(16,185,129,0.6)",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Sets
          </div>
          <div style={{ fontSize: 36, fontWeight: 900, color: C.text }}>
            {cur?.sets ?? 3}
          </div>
          <div
            style={{
              fontSize: 12,
              color: C.muted,
              fontWeight: 600,
              marginTop: 4,
            }}
          >
            rounds
          </div>
        </Glass>
      </div>

      {cur?.target_duration && (
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          {timer !== null ? (
            <div
              style={{
                fontSize: 88,
                fontWeight: 900,
                letterSpacing: "-0.04em",
                lineHeight: 1,
                color: timer < 10 ? "#f59e0b" : C.emerald,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {timer}
            </div>
          ) : (
            <button
              onClick={() => setTimer(cur.target_duration)}
              style={{
                width: 100,
                height: 100,
                borderRadius: "50%",
                background: C.emeraldDim,
                border: `2px solid ${C.emeraldBorder}`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: C.emerald,
                gap: 4,
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 900,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
              >
                Start
              </span>
            </button>
          )}
        </div>
      )}

      <div
        style={{
          position: "fixed",
          bottom: 32,
          left: 16,
          right: 16,
          maxWidth: 488,
          margin: "0 auto",
        }}
      >
        <button
          onClick={isLast ? finish : next}
          style={{
            width: "100%",
            padding: "18px 0",
            borderRadius: 20,
            fontSize: 16,
            fontWeight: 900,
            background: isLast ? C.emerald : "rgba(255,255,255,0.07)",
            border: isLast ? "none" : `1px solid ${C.border}`,
            color: "#fff",
            cursor: "pointer",
            boxShadow: isLast ? "0 10px 40px rgba(16,185,129,0.3)" : "none",
          }}
        >
          {isLast ? "Complete Session ✓" : "Next Exercise →"}
        </button>
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
function SettingsView({ prefs, onUpdate, userId }) {
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
  const [history, setHistory] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

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

  // Load score and history from API on mount
  useEffect(() => {
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
  }, [userId]);

  // Show check-in on first open if enabled
  useEffect(() => {
    if (prefs.auto_prompt !== false) setShowCheckIn(true);
  }, []);

  const handleCheckIn = useCallback(
    async (data) => {
      setShowCheckIn(false);
      setIsGenerating(true);
      try {
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
    async (durationSec) => {
      try {
        await api.saveExecution(
          userId,
          plan?.id,
          today,
          plan?.steps ?? [],
          durationSec,
        );
        // Refresh score and history
        const [newScore, newHistory] = await Promise.all([
          api.getScore(userId),
          api.getHistory(userId),
        ]);
        setScore(newScore);
        setHistory(newHistory);
      } catch (e) {
        console.error("Failed to save execution:", e);
      }
      setInWorkout(false);
      setView("today");
    },
    [userId, plan, today],
  );

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

        {inWorkout ? (
          <WorkoutView
            plan={plan}
            onComplete={handleComplete}
            onBack={() => setInWorkout(false)}
          />
        ) : (
          <>
            {view === "today" && (
              <Dashboard
                plan={plan}
                score={score}
                onStartWorkout={() => setInWorkout(true)}
                isGenerating={isGenerating}
              />
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
              <SettingsView prefs={prefs} onUpdate={setPrefs} userId={userId} />
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
        />
      )}
    </div>
  );
}
