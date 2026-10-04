// Daily check-in sheet. Moved out of App.jsx (F4); App starts the import at
// module scope so the sheet is ready before anyone can open it.
import { useState } from "react";
import { C, display, mono } from "./tokens.js";
import { t } from "./i18n.js";

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

export default function CheckInModal({ onSave, onClose, sex, cycle, defaultTimeBudget, lastCheckin, onMarkChronic }) {
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
  // C-F9 — where you are training today. Defaults to wherever you trained last, so
  // the usual case costs no taps at all; the old chip asked the same question daily.
  const [location, setLocation] = useState(() => {
    try { return localStorage.getItem("jf_last_location") || "home"; } catch { return "home"; }
  });
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
    try { localStorage.setItem("jf_last_location", location); } catch { /* private mode */ }
    onSave({
      mood: m.mood,
      stress: m.stress,
      energy: chips.includes("low_energy") ? 3 : 5,
      sleep_hours: chips.includes("poor_sleep") ? 4 : null,
      checkin_json: {
        no_clothing: false,
        no_gear: false,
        no_time: chips.includes("zero_time"),
        equipment_profile_id: location,
        // Kept in sync for older cached clients and any consumer still reading it.
        gym_today: location === "gym",
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

  // Compact SVG icon factory for chips
  const ci = (inner) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">{inner}</svg>
  );
  const CHIP_DEFS = [
    { val: "pain",       label: t("Pain or soreness"), icon: ci(<><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>) },
    { val: "poor_sleep", label: t("Rough night"),      icon: ci(<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>) },
    { val: "low_energy", label: t("Low energy"),       icon: ci(<><rect x="2" y="7" width="16" height="10" rx="2" ry="2"/><line x1="22" y1="11" x2="22" y2="13"/></>) },
    { val: "zero_time",  label: t("Zero time today"),  icon: ci(<><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/></>) },
    { val: "taking_easy",label: t("Taking it easy"),  icon: ci(<path d="M17 8C8 10 5.9 16.17 3.82 19.25c3.82 1.24 7.47-.93 8.74-2.97C13.42 14.77 14 11 14 11c1.72 2.4 2 7 2 7 2-2.4 2-5 2-5 2.4 1 3 3 3 3C22 10 17 8 17 8z"/>) },
    ...(showPeriodChip ? [{ val: "period", label: t("Period today"), icon: ci(<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>) }] : []),
  ];

  const PAIN_AREAS = [
    { k: "knee",       l: t("Knee")       },
    { k: "shoulder",   l: t("Shoulder")   },
    { k: "lower_back", l: t("Lower back") },
    { k: "ankle",      l: t("Ankle")      },
  ];

  const smileys = [
    { val: 1, label: t("Not great"), color: C.danger, Face: SadFace     },
    { val: 2, label: t("Okay"),      color: C.muted,   Face: NeutralFace },
    { val: 3, label: t("Good"),      color: C.emerald, Face: HappyFace   },
  ];

  const dotCount = needsStep3 ? 3 : 2;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", flexDirection: "column", justifyContent: "flex-end", background: "rgba(var(--bg-rgb),0.7)", backdropFilter: "blur(8px)" }}>
      {/* Width-constrained row so the sheet matches app card width on desktop */}
      <div style={{ display: "flex", justifyContent: "center" }}>
      <div style={{ background: C.sheet, borderTop: `1px solid ${C.border}`, borderRadius: "24px 24px 0 0", maxHeight: "92vh", display: "flex", flexDirection: "column", boxShadow: "0 -20px 60px rgba(0,0,0,0.6)", width: "100%", maxWidth: 520 }}>

        {/* Drag handle + close */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px 4px" }}>
          <div style={{ width: 32 }} />
          <div style={{ width: 36, height: 4, borderRadius: 2, background: C.subtle }} />
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(var(--overlay-rgb),0.05)", border: `1px solid ${C.border}`, color: C.muted, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}
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
                <div style={{ ...display(26, 900), color: C.text, textTransform: "uppercase", marginBottom: 4 }}>{t("How are you feeling?")}</div>
                <div style={{ fontSize: 14, color: C.muted }}>{t("Tap to tell your coach")}</div>
              </div>
              <div style={{ display: "flex", gap: 12, paddingTop: 24, paddingBottom: 32 }}>
                {smileys.map((sm) => {
                  const { val, label, color, Face } = sm;
                  const sel = feeling === val;
                  return (
                    <button
                      key={val}
                      onClick={() => { setFeeling(val); setStep(2); }}
                      style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "20px 8px", borderRadius: 20, border: `1px solid ${sel ? color : C.border}`, background: sel ? `${color}22` : "rgba(var(--overlay-rgb),0.03)", cursor: "pointer", color: sel ? color : C.muted, fontFamily: "inherit", transition: "all 0.15s" }}
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
                <div style={{ ...display(24, 900), color: C.text, textTransform: "uppercase", marginBottom: 4 }}>{t("What's going on?")}</div>
                <div style={{ fontSize: 14, color: C.muted }}>{t("Tap anything that fits \u2014 or just hit Apply")}</div>
              </div>
              {/* ── C-F9: where are you training today ── */}
              <div style={{ paddingTop: 16 }}>
                <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: C.subtle, marginBottom: 8 }}>
                  {t("Where are you training?")}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {[
                    { id: "home",   label: t("Home") },
                    { id: "gym",    label: t("Gym") },
                    { id: "travel", label: t("Away") },
                  ].map(({ id, label }) => {
                    const sel = location === id;
                    return (
                      <button
                        key={id}
                        onClick={() => setLocation(id)}
                        aria-pressed={sel}
                        style={{
                          flex: 1, minHeight: 48, borderRadius: 14, cursor: "pointer",
                          fontSize: 13, fontWeight: 800, touchAction: "manipulation",
                          border: `1px solid ${sel ? C.emeraldBorder : C.border}`,
                          background: sel ? C.emeraldDim : "rgba(var(--overlay-rgb),0.04)",
                          color: sel ? C.emerald : C.muted,
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, paddingTop: 16, paddingBottom: 14 }}>
                {CHIP_DEFS.map(({ val, label, icon }) => {
                  const sel = chips.includes(val);
                  return (
                    <button
                      key={val}
                      onClick={() => toggleChip(val)}
                      style={{ padding: "10px 16px", borderRadius: 99, background: sel ? "var(--accent-dim)" : "rgba(var(--overlay-rgb),0.04)", border: `1px solid ${sel ? "var(--accent-border)" : C.border}`, color: sel ? "var(--accent)" : C.muted, fontSize: 14, fontWeight: sel ? 700 : 500, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s", display: "flex", alignItems: "center", gap: 7 }}
                    >
                      {icon}
                      {label}
                    </button>
                  );
                })}
              </div>
              <textarea
                placeholder={t("Rough night? Big day? Tell me anything\u2026")}
                value={freeText}
                onChange={e => setFreeText(e.target.value)}
                style={{ width: "100%", minHeight: 72, background: "rgba(var(--overlay-rgb),0.03)", border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, fontSize: 14, color: C.text, resize: "none", outline: "none", fontFamily: "inherit", boxSizing: "border-box", marginBottom: 4 }}
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
                        style={{ flex: 1, padding: "10px 8px", borderRadius: 14, background: painScope === v ? "rgba(239,68,68,0.12)" : "rgba(var(--overlay-rgb),0.04)", border: `1px solid ${painScope === v ? "rgba(239,68,68,0.4)" : C.border}`, color: painScope === v ? C.danger : C.muted, fontSize: 13, fontWeight: painScope === v ? 700 : 500, cursor: "pointer", fontFamily: "inherit" }}
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
                              style={{ padding: "8px 14px", borderRadius: 14, background: active ? "rgba(239,68,68,0.15)" : "rgba(var(--overlay-rgb),0.05)", color: active ? C.danger : C.muted, border: active ? "1px solid rgba(239,68,68,0.4)" : `1px solid ${C.border}`, fontWeight: active ? 700 : 500, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
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
                            style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", color: C.danger, fontSize: 12, fontWeight: 700, cursor: "pointer", marginBottom: 2, padding: 0 }}
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
                  <div style={{ ...mono(10), color: C.warningBright, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>How is your body today?</div>
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
                          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderRadius: 14, width: "100%", textAlign: "left", background: active ? "rgba(251,191,36,0.08)" : "rgba(var(--overlay-rgb),0.03)", border: `1px solid ${active ? "rgba(251,191,36,0.35)" : C.border}`, cursor: "pointer", fontFamily: "inherit" }}
                        >
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: active ? C.warningBright : C.text }}>{label}</div>
                            {active && <div style={{ fontSize: 11, color: "rgba(251,191,36,0.7)", marginTop: 2 }}>{sub}</div>}
                          </div>
                          <div style={{ width: 38, height: 20, borderRadius: 999, background: active ? C.warningBright : C.subtle, position: "relative", flexShrink: 0 }}>
                            <div style={{ position: "absolute", top: 2, width: 16, height: 16, borderRadius: "50%", background: C.knob, left: active ? 19 : 2, transition: "left 0.2s" }} />
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
                          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderRadius: 14, width: "100%", textAlign: "left", background: active ? "rgba(251,191,36,0.08)" : "rgba(var(--overlay-rgb),0.03)", border: `1px solid ${active ? "rgba(251,191,36,0.35)" : C.border}`, cursor: "pointer", fontFamily: "inherit" }}
                        >
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: active ? C.warningBright : C.text }}>{label}</div>
                            {active && <div style={{ fontSize: 11, color: "rgba(251,191,36,0.7)", marginTop: 2 }}>{sub}</div>}
                          </div>
                          <div style={{ width: 38, height: 20, borderRadius: 999, background: active ? C.warningBright : C.subtle, position: "relative", flexShrink: 0 }}>
                            <div style={{ position: "absolute", top: 2, width: 16, height: 16, borderRadius: "50%", background: C.knob, left: active ? 19 : 2, transition: "left 0.2s" }} />
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
        <div style={{ padding: "12px 24px 32px", borderTop: step > 1 ? `1px solid ${C.border}` : "none", background: "rgba(var(--overlay-rgb),0.01)" }}>
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
                style={{ flex: 1, padding: 14, borderRadius: 14, fontWeight: 900, fontSize: 15, background: "var(--accent)", border: "none", color: C.onAccent, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 8px 24px rgba(var(--accent-rgb),0.3)" }}
              >
                {t("Apply")} →
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
                style={{ flex: 1, padding: 14, borderRadius: 14, fontWeight: 900, fontSize: 15, background: "var(--accent)", border: "none", color: C.onAccent, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 8px 24px rgba(var(--accent-rgb),0.3)" }}
              >
                {t("Apply")} →
              </button>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
