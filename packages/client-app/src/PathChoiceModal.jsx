// Path choice (General / Running / Cycling / Military). Moved out of App.jsx (F4); lazy.
import { useState } from "react";
import { C, display, eyebrow } from "./tokens.js";
import api from "./apiClient.js";

// ─── PATH CHOICE ──────────────────────────────────────────────────────────────
export default function PathChoiceModal({ token, onComplete, isPro, onUpgrade }) {
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
            {PATHS.map(p => {
              const locked = !isPro && p.key === "cycling";
              return (
                <button key={p.key}
                  onClick={() => {
                    if (locked) { onUpgrade?.(); return; }
                    if (p.key === "general") saveAndComplete("general"); else setStep(p.key);
                  }}
                  style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "flex-start", padding: "18px 16px", borderRadius: 20,
                    background: C.bgCard, border: `1px solid ${locked ? C.border : C.border}`, cursor: "pointer", textAlign: "left", gap: 8, minHeight: 140 }}
                >
                  <span style={{ fontSize: 22, color: locked ? C.muted : "var(--accent)" }}>{locked ? "🔒" : p.icon}</span>
                  <div style={{ ...display(16), color: locked ? C.muted : C.text, lineHeight: 1.2, whiteSpace: "pre-line" }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.4 }}>{locked ? "Pro vereist" : p.line}</div>
                </button>
              );
            })}
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
                  background: runKm === km ? C.emeraldDim : "rgba(var(--overlay-rgb),0.04)",
                  color: runKm === km ? C.emerald : C.muted }}
              >{km}km</button>
            ))}
          </div>
          <button disabled={saving} style={saveBtn(saving)}
            onClick={() => saveAndComplete("running", { run_coach: { enrolled: true, target_km: runKm, week: 1, session_in_week: 0 }, sport_prefs: { sports: ["running"], primary: "running" } })}
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
                  background: cycleSubgoal === sg.id ? C.emeraldDim : "rgba(var(--overlay-rgb),0.04)" }}
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
            onClick={() => saveAndComplete("cycling", { cycling_coach: { active: true, sub_goal: cycleSubgoal, week: 1 }, sport_prefs: { sports: ["cycling"], primary: "cycling" } })}
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
                    background: milTrack === val ? C.emeraldDim : "rgba(var(--overlay-rgb),0.04)" }}
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
                    background: milMode === val ? C.emeraldDim : "rgba(var(--overlay-rgb),0.04)",
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
                style={{ width: "100%", padding: "10px 14px", borderRadius: 12, background: "rgba(var(--overlay-rgb),0.05)", border: `1px solid ${C.border}`, color: C.text, fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
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
