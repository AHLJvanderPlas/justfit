// src/AssessmentView.jsx — "Where you are" fitness assessment runner.
//
// A full-screen overlay, the same pattern as WorkoutView, so a max-effort set is
// never competing with navigation. Deliberately its own component rather than a
// WorkoutView mode: a test counts *up* to exhaustion with no prescribed target,
// while WorkoutView is built around prescribed sets/reps. Folding one into the
// other would complicate the most safety-critical screen in the app.
//
// Flow: focus picker → (per test) brief → run → confirm → results.
// See docs/FITNESS_ASSESSMENT_DESIGN.md.

import React, { useState, useRef, useEffect } from "react";
import { C, display } from "./tokens.js";
import api from "./apiClient.js";

const AXIS_LABELS = {
  push: "Push", pull: "Pull", legs: "Legs",
  core: "Core", conditioning: "Conditioning", mobility: "Mobility",
};

function fmtClock(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ── Countdown ring, matching the WorkoutView rest timer ──────────────────────
function Ring({ fraction, label, sub, color }) {
  const r = 88, circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: 200, height: 200 }}>
      <svg width="200" height="200" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r={r} fill="none" style={{ stroke: "rgba(var(--overlay-rgb),0.07)" }} strokeWidth="10" />
        <circle
          cx="100" cy="100" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeLinecap="round" strokeDasharray={circ}
          strokeDashoffset={circ * (1 - Math.max(0, Math.min(1, fraction)))}
          transform="rotate(-90 100 100)"
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 44, fontWeight: 900, color: C.text, fontVariantNumeric: "tabular-nums" }}>{label}</div>
        {sub && <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function AssessmentView({ config, onDone, onBack, accentHex = "#10b981" }) {
  const presets = config?.presets ?? [];
  const battery = config?.battery ?? {};

  const [phase, setPhase]       = useState("pick");   // pick | brief | run | confirm | results
  const [focus, setFocus]       = useState(null);
  const [testIdx, setTestIdx]   = useState(0);
  const [variant, setVariant]   = useState(config?.push_variant_default ?? "push-up");
  const [count, setCount]       = useState(0);
  const [elapsed, setElapsed]   = useState(0);
  const [running, setRunning]   = useState(false);
  const [results, setResults]   = useState([]);
  const [draft, setDraft]       = useState("");
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [outcome, setOutcome]   = useState(null);

  const startedAtRef = useRef(0);
  // The clock tick reads the live count from a ref: it fires inside a timeout, so
  // a captured `count` would be stale by the time a fixed-duration test ends.
  const countRef = useRef(0);

  const preset   = presets.find((p) => p.id === focus) ?? null;
  const testIds  = preset?.tests?.map((t) => t.id) ?? [];
  const testId   = testIds[testIdx] ?? null;
  const test     = testId ? battery[testId] : null;
  const isLast   = testIdx >= testIds.length - 1;

  // ── Clock ───────────────────────────────────────────────────────────────────
  // setTimeout rather than setInterval, with the changing value in deps, to avoid
  // stale closures — the pattern used throughout WorkoutView. When the cap is
  // reached the test ends itself, so a fixed-duration test needs no user action.
  useEffect(() => {
    if (!running || !test) return;
    const id = setTimeout(() => {
      const next = (Date.now() - startedAtRef.current) / 1000;
      if (next >= test.timeCapSec) {
        setElapsed(test.timeCapSec);
        setRunning(false);
        setDraft(String(test.metric === "seconds" ? test.timeCapSec : countRef.current));
        setPhase("confirm");
      } else {
        setElapsed(next);
      }
    }, 200);
    return () => clearTimeout(id);
  }, [running, elapsed, test]);

  function startTest() {
    startedAtRef.current = Date.now();
    countRef.current = 0;
    setElapsed(0);
    setCount(0);
    setRunning(true);
    setPhase("run");
  }

  function stopTest() {
    setRunning(false);
    setDraft(String(test?.metric === "seconds" ? Math.round(elapsed) : count));
    setPhase("confirm");
  }

  function tap() {
    if (!running) return;
    countRef.current += 1;
    setCount(countRef.current);
    if (navigator.vibrate) navigator.vibrate(25);
  }

  const acceptResult = () => {
    const raw = Math.max(0, parseInt(draft, 10) || 0);
    const entry = { test_id: testId, raw, ...(test?.hasVariant ? { variant } : {}) };
    const next = [...results.filter((r) => r.test_id !== testId), entry];
    setResults(next);
    if (isLast) submit(next);
    else { setTestIdx((i) => i + 1); setPhase("brief"); }
  };

  const submit = async (finalResults) => {
    setSaving(true);
    setError("");
    try {
      const res = await api.submitAssessment(focus, finalResults);
      if (res.ok) { setOutcome(res); setPhase("results"); }
      else setError(res.error ?? "Could not save the assessment.");
    } catch {
      setError("Could not reach the server.");
    }
    setSaving(false);
  };

  // ── Shell ───────────────────────────────────────────────────────────────────
  const shell = (children, title, right) => (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: C.bg, overflowY: "auto", display: "flex", flexDirection: "column" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: C.muted, fontSize: 13, fontWeight: 700, cursor: "pointer", padding: 0 }}>← Close</button>
        <div style={{ fontSize: 12, fontWeight: 800, color: C.text, letterSpacing: "0.04em" }}>{title}</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, minWidth: 48, textAlign: "right" }}>{right ?? ""}</div>
      </header>
      <div style={{ flex: 1, padding: "24px 20px 40px", maxWidth: 560, width: "100%", margin: "0 auto" }}>{children}</div>
    </div>
  );

  // ── Phase: pick a focus ─────────────────────────────────────────────────────
  if (phase === "pick") {
    return shell(
      <>
        <h1 style={{ ...display(32), color: C.text, margin: "0 0 6px" }}>Where you are</h1>
        <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.55, margin: "0 0 22px" }}>
          A few short max-effort tests. The result sets your personal baseline, so your
          progress chart measures you instead of estimating you.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {presets.map((p) => (
            <button
              key={p.id}
              onClick={() => { setFocus(p.id); setTestIdx(0); setResults([]); setPhase("brief"); }}
              style={{ textAlign: "left", padding: "16px 18px", borderRadius: 18, cursor: "pointer",
                       border: `1px solid ${C.border}`, background: "rgba(var(--overlay-rgb),0.04)", color: C.text }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                <span style={{ fontSize: 16, fontWeight: 800 }}>{p.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.muted }}>~{p.minutes} min</span>
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
                {p.tests.map((t) => AXIS_LABELS[t.axis] ?? t.axis).join(" · ")}
              </div>
              {p.unmeasured?.length > 0 && (
                <div style={{ fontSize: 11, color: C.subtle, marginTop: 5 }}>
                  {p.unmeasured.map((a) => AXIS_LABELS[a] ?? a).join(", ")} stays estimated — no equipment-free test exists for it
                </div>
              )}
            </button>
          ))}
        </div>

        <p style={{ fontSize: 11, color: C.subtle, lineHeight: 1.6, marginTop: 20 }}>
          Stop any test when your form breaks, not when it hurts. These scores are a coarse
          reference, not a clinical measurement — the number that matters is how it changes.
        </p>
      </>,
      "ASSESSMENT"
    );
  }

  // ── Phase: brief ────────────────────────────────────────────────────────────
  if (phase === "brief" && test) {
    return shell(
      <>
        <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.12em", color: accentHex, textTransform: "uppercase", marginBottom: 8 }}>
          {AXIS_LABELS[test.axis] ?? test.axis}
        </div>
        <h1 style={{ ...display(30), color: C.text, margin: "0 0 10px" }}>{test.name}</h1>
        <p style={{ fontSize: 15, color: C.text, lineHeight: 1.6, margin: "0 0 18px" }}>{test.instruction}</p>

        {test.hasVariant && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: C.muted, marginBottom: 8 }}>Which version can you do?</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(config?.push_variants ?? []).map((v) => (
                <button key={v.slug} onClick={() => setVariant(v.slug)}
                  style={{ padding: "9px 14px", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer",
                           border: `1px solid ${variant === v.slug ? accentHex : C.border}`,
                           background: variant === v.slug ? `${accentHex}1f` : "rgba(var(--overlay-rgb),0.04)",
                           color: variant === v.slug ? accentHex : C.muted }}>
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ fontSize: 12, color: C.muted, marginBottom: 24 }}>
          {test.fixedDuration
            ? `The clock runs for ${fmtClock(test.timeCapSec)}. Count as you go.`
            : test.metric === "seconds"
              ? `Hold as long as you can, up to ${fmtClock(test.timeCapSec)}.`
              : `Tap for each rep. Up to ${fmtClock(test.timeCapSec)}.`}
        </div>

        <button onClick={startTest}
          style={{ width: "100%", padding: "16px", borderRadius: 16, fontSize: 15, fontWeight: 900, cursor: "pointer",
                   border: "none", background: accentHex, color: C.onAccent }}>
          Start · test {testIdx + 1} of {testIds.length}
        </button>
      </>,
      "ASSESSMENT", `${testIdx + 1}/${testIds.length}`
    );
  }

  // ── Phase: run ──────────────────────────────────────────────────────────────
  if (phase === "run" && test) {
    const remaining = Math.max(0, test.timeCapSec - elapsed);
    const isHold = test.metric === "seconds";
    return shell(
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: C.muted }}>{test.name}</div>

        <Ring
          fraction={isHold ? elapsed / test.timeCapSec : remaining / test.timeCapSec}
          label={isHold ? fmtClock(elapsed) : String(count)}
          sub={isHold ? "held" : `${fmtClock(remaining)} left`}
          color={accentHex}
        />

        {!isHold && (
          <button onClick={tap} aria-label="Count one rep"
            style={{ width: "100%", minHeight: 200, borderRadius: 24, cursor: "pointer",
                     border: `1px solid ${C.border}`, background: "rgba(var(--overlay-rgb),0.04)",
                     color: C.muted, fontSize: 15, fontWeight: 800 }}>
            Tap for each rep
          </button>
        )}

        <button onClick={stopTest}
          style={{ width: "100%", padding: "15px", borderRadius: 16, fontSize: 15, fontWeight: 800, cursor: "pointer",
                   border: `1px solid ${C.border}`, background: "rgba(var(--overlay-rgb),0.04)", color: C.text }}>
          {isHold ? "I dropped — stop" : "Done"}
        </button>
      </div>,
      "ASSESSMENT", `${testIdx + 1}/${testIds.length}`
    );
  }

  // ── Phase: confirm ──────────────────────────────────────────────────────────
  if (phase === "confirm" && test) {
    return shell(
      <>
        <h1 style={{ ...display(28), color: C.text, margin: "0 0 6px" }}>{test.name}</h1>
        <p style={{ fontSize: 13, color: C.muted, margin: "0 0 20px" }}>
          Adjust if the count drifted — an honest number is worth more than a flattering one.
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <input
            type="number" inputMode="numeric" value={draft}
            onChange={(e) => setDraft(e.target.value)}
            style={{ flex: 1, padding: "16px 18px", borderRadius: 14, fontSize: 28, fontWeight: 900,
                     border: `1px solid ${C.border}`, background: "rgba(var(--overlay-rgb),0.04)", color: C.text,
                     fontVariantNumeric: "tabular-nums" }}
          />
          <span style={{ fontSize: 15, fontWeight: 700, color: C.muted, minWidth: 62 }}>
            {test.metric === "seconds" ? "seconds" : "reps"}
          </span>
        </div>

        {error && <div style={{ fontSize: 12, color: C.danger, marginBottom: 14 }}>{error}</div>}

        <button onClick={acceptResult} disabled={saving}
          style={{ width: "100%", padding: "16px", borderRadius: 16, fontSize: 15, fontWeight: 900,
                   cursor: saving ? "default" : "pointer", border: "none",
                   background: accentHex, color: C.onAccent, opacity: saving ? 0.6 : 1 }}>
          {saving ? "Saving…" : isLast ? "Finish assessment" : "Next test →"}
        </button>

        <button onClick={startTest} disabled={saving}
          style={{ width: "100%", padding: "13px", borderRadius: 14, marginTop: 10, fontSize: 13, fontWeight: 700,
                   cursor: "pointer", border: `1px solid ${C.border}`, background: "transparent", color: C.muted }}>
          Redo this test
        </button>
      </>,
      "ASSESSMENT", `${testIdx + 1}/${testIds.length}`
    );
  }

  // ── Phase: results ──────────────────────────────────────────────────────────
  if (phase === "results" && outcome) {
    const ins = outcome.insights ?? {};
    return shell(
      <>
        <h1 style={{ ...display(32), color: C.text, margin: "0 0 6px" }}>Measured</h1>
        <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.55, margin: "0 0 22px" }}>{ins.sentence}</p>

        <div style={{ borderRadius: 18, border: `1px solid ${C.border}`, overflow: "hidden", marginBottom: 18 }}>
          {(outcome.results ?? []).map((r, i) => {
            const d = ins.deltas?.[r.axis];
            return (
              <div key={r.test_id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px",
                     borderTop: i === 0 ? "none" : `1px solid ${C.border}`,
                     background: i % 2 === 0 ? "rgba(var(--overlay-rgb),0.02)" : "transparent" }}>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 800, color: C.text }}>{AXIS_LABELS[r.axis] ?? r.axis}</span>
                <span style={{ fontSize: 13, color: C.muted, fontVariantNumeric: "tabular-nums" }}>
                  {r.raw}{r.test_id === "core_hold" ? "s" : ""}
                </span>
                <span style={{ fontSize: 15, fontWeight: 900, color: C.text, minWidth: 34, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{r.score}</span>
                <span style={{ fontSize: 12, fontWeight: 700, minWidth: 44, textAlign: "right",
                               color: d == null ? C.subtle : d > 0 ? accentHex : d < 0 ? C.danger : C.muted }}>
                  {d == null ? "—" : d > 0 ? `▲ ${d}` : d < 0 ? `▼ ${Math.abs(d)}` : "="}
                </span>
              </div>
            );
          })}
        </div>

        {ins.unmeasured?.length > 0 && (
          <p style={{ fontSize: 11, color: C.subtle, lineHeight: 1.6, marginBottom: 18 }}>
            {ins.unmeasured.map((u) => u.label).join(" and ")} were not measured — no equipment-free
            test gives an honest reading. They stay estimated from your sessions.
          </p>
        )}

        <button onClick={() => onDone?.(outcome)}
          style={{ width: "100%", padding: "16px", borderRadius: 16, fontSize: 15, fontWeight: 900,
                   cursor: "pointer", border: "none", background: accentHex, color: C.onAccent }}>
          See it on your chart →
        </button>
      </>,
      "ASSESSMENT"
    );
  }

  return shell(<div style={{ color: C.muted, fontSize: 14 }}>Loading…</div>, "ASSESSMENT");
}
