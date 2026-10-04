// "Can't do this today?" sheet. Moved out of App.jsx (F4); lazy.
import { useState } from "react";
import { C } from "./tokens.js";
import { t, useLang } from "./i18n.js";

// ─── WHY NOT MODAL ────────────────────────────────────────────────────────────
const WHY_NOT_OPTIONS = [
  { label: "No time",       checkin: { no_time: true, time_budget: 10 } },
  { label: "Feeling sick",  checkin: { pain_level: 2 } },
  { label: "Injured",       checkin: { pain_level: 3 } },
  { label: "Too tired",     checkin: { energy: 2 } },
  { label: "No gear",       checkin: { no_gear: true } },
  { label: "Just need rest",checkin: null },
];

// W4.2 — three ways out, not two: adapt the coach's plan, rest, or do
// something else entirely. When today's plan is the user's OWN session, the
// adapt chips would replace it, so they first ask (the override is durable —
// only a confirmed action replaces it, W4.1).
export default function WhyNotModal({ onRegen, onRestDay, onBuildOwn, onClose, userAuthored }) {
  useLang();
  const [pending, setPending] = useState(null);
  const pick = (opt) => {
    if (opt.checkin === null) return onRestDay();
    if (userAuthored) return setPending(opt);
    onRegen(opt.checkin, false);
  };
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 420, background: C.sheet, border: `1px solid ${C.border}`, borderRadius: 24, padding: 28 }}>
        <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.02em", marginBottom: 8 }}>{t("What's getting in the way?")}</div>
        <p style={{ fontSize: 13, color: C.muted, marginBottom: 20, lineHeight: 1.5 }}>{t("We'll adjust today's plan to fit your situation.")}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
          {WHY_NOT_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              onClick={() => pick(opt)}
              style={{ padding: "11px 18px", borderRadius: 14, fontSize: 13, fontWeight: 800, cursor: "pointer", border: `1px solid ${pending === opt ? "var(--accent-border)" : C.border}`, background: pending === opt ? "var(--accent-dim)" : "rgba(var(--overlay-rgb),0.04)", color: C.text }}
            >
              {t(opt.label)}
            </button>
          ))}
        </div>
        {pending && (
          <div style={{ padding: 12, borderRadius: 14, background: C.amberDim, border: `1px solid ${C.amberBorder}`, marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: C.warningSoft, fontWeight: 600, lineHeight: 1.5, marginBottom: 10 }}>
              {t("This replaces the session you built yourself with a new plan from the coach.")}
            </div>
            <button
              onClick={() => onRegen(pending.checkin, true)}
              style={{ width: "100%", padding: 12, borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: "pointer", border: "none", background: "var(--accent)", color: C.onAccent, fontFamily: "inherit" }}
            >
              {t("Replace my session")}
            </button>
          </div>
        )}
        <button
          onClick={onBuildOwn}
          style={{ width: "100%", minHeight: 52, padding: "12px 16px", borderRadius: 16, marginBottom: 10, cursor: "pointer", fontFamily: "inherit", border: "1px solid var(--accent-border)", background: "var(--accent-dim)", color: "var(--accent)", textAlign: "left" }}
        >
          <span style={{ display: "block", fontSize: 14, fontWeight: 900 }}>{t("I'm doing something else")} →</span>
          <span style={{ display: "block", fontSize: 12, color: C.muted, marginTop: 2 }}>{t("Build your own session, or pin a few exercises and let the coach fill the rest.")}</span>
        </button>
        <button onClick={onClose} style={{ width: "100%", padding: 13, borderRadius: 14, fontSize: 13, fontWeight: 700, background: "transparent", border: `1px solid ${C.border}`, color: C.muted, cursor: "pointer" }}>{t("Cancel")}</button>
      </div>
    </div>
  );
}
