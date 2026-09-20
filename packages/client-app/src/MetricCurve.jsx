/* eslint-disable react-refresh/only-export-components */
// MetricCurve — C-F11: one value plotted over time.
//
// NOT TrajectoryChart. That name is already taken in HistoryView.jsx by a
// session-count bar chart (how *often* you trained, 12 weeks). This plots
// magnitude, not frequency. Same word, different animal.
//
// Two callers, one shape:
//   • exercise strength curve — estimated 1RM per exercise, from /api/records
//   • radar axis trajectory   — progression score per axis, from /api/progression
//
// The axis case needs care the exercise case does not. An estimated 1RM is a
// physical quantity: if it falls, you lift less. An axis score decays on its own,
// so a plain line would report "you got weaker" to someone who merely rested. The
// design answers that three ways — dotted segments for decay, the baseline drawn
// as a floor decay cannot cross, and the tooltip saying so in words.

import { useMemo, useState } from "react";
import { C } from "./tokens.js";
import { t, getLang } from "./i18n.js";

const DAY = 86_400_000;

export const PERIODS = [
  { days: 28,    key: "4 wk" },
  { days: 90,    key: "3 mnd" },
  { days: 180,   key: "6 mnd" },
  { days: 36500, key: "All" },
];

/** Dutch-style decimals for kg; scores are whole numbers. */
export function fmtValue(v, unit) {
  if (v == null || !Number.isFinite(v)) return "—";
  if (unit !== "kg") return String(Math.round(v));
  const s = (Math.round(v * 10) / 10).toFixed(1);
  const trimmed = s.endsWith(".0") ? s.slice(0, -2) : s;
  return getLang() === "en" ? trimmed : trimmed.replace(".", ",");
}

function fmtDate(ms) {
  const nl = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
  const en = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const m = getLang() === "en" ? en : nl;
  const d = new Date(ms);
  return `${d.getDate()} ${m[d.getMonth()]}`;
}

/**
 * Above ~60 points a 5px dot every 3px is a smear, not data. Bucket by week and
 * keep the highest value in each — for a strength curve the best set of the week
 * is the meaningful one, and for a score the peak is what the athlete reached.
 */
function downsample(points, limit = 60) {
  if (points.length <= limit) return points;
  const buckets = new Map();
  for (const p of points) {
    const k = Math.floor(p.at_ms / (7 * DAY));
    const cur = buckets.get(k);
    if (!cur || p.value > cur.value) buckets.set(k, p);
  }
  return [...buckets.values()].sort((a, b) => a.at_ms - b.at_ms);
}

export function MetricCurve({ data, initialPeriod = 90, height = 168 }) {
  const [periodDays, setPeriodDays] = useState(initialPeriod);
  // Captured once at mount rather than read during render. Date.now() is impure —
  // the React Compiler rejects it — and a window that silently slides on every
  // re-render would also be wrong: the period must not move under the reader.
  const [nowMs] = useState(() => Date.now());
  const [active, setActive] = useState(null);
  const [showTable, setShowTable] = useState(false);

  const unit = data?.unit ?? "score";

  const pts = useMemo(() => {
    const all = (data?.points ?? []).filter(p => Number.isFinite(p?.value)).sort((a, b) => a.at_ms - b.at_ms);
    const cutoff = nowMs - periodDays * DAY;
    const within = all.filter(p => p.at_ms >= cutoff);
    // Never render a single point as a "curve" — fall back to the last two so the
    // chart says something rather than collapsing to a dot.
    return downsample(within.length >= 2 ? within : all.slice(-2));
  }, [data, periodDays, nowMs]);

  if (!data || pts.length < 2) {
    return (
      <div style={{ padding: "20px 0", fontSize: 13, color: C.muted, lineHeight: 1.55 }}>
        {t("Two sessions are needed before a trend means anything.")}
      </div>
    );
  }

  const vals  = pts.map(p => p.value);
  const first = vals[0];
  const last  = vals[vals.length - 1];
  const diff  = last - first;
  const avg   = vals.reduce((a, b) => a + b, 0) / vals.length;
  const peak  = Math.max(...vals);
  const hasDecay = pts.some(p => p.decayed);

  // Scale. The baseline is included so the floor is always on screen when present —
  // it is the reassuring part of the picture and must never be cropped out.
  let lo = Math.min(...vals), hi = Math.max(...vals);
  if (data.baseline != null) lo = Math.min(lo, data.baseline);
  const pad = Math.max((hi - lo) * 0.18, unit === "kg" ? 2 : 4);
  lo = Math.max(0, lo - pad);
  hi = hi + pad;

  const W = 320, H = height, L = 34, R = 8, T = 10, B = 24;
  const iw = W - L - R, ih = H - T - B;
  const x = (i) => L + (i / (pts.length - 1)) * iw;
  const y = (v) => T + ih - ((v - lo) / (hi - lo || 1)) * ih;

  const deltaColor = Math.abs(diff) < 0.05 ? C.muted : diff > 0 ? C.emerald : C.rose;
  const deltaSign  = diff > 0 ? "+" : diff < 0 ? "−" : "±";

  const summary = `${data.label}, ${fmtValue(last, unit)} ${unit === "kg" ? "kg" : t("points")}, ` +
    `${diff >= 0 ? t("up from") : t("down from")} ${fmtValue(first, unit)}`;

  const seg = (i) => {
    const decayed = !!pts[i].decayed;
    return {
      stroke: decayed ? "rgba(var(--overlay-rgb),0.32)" : C.emerald,
      strokeWidth: decayed ? 1.5 : 2.5,
      strokeDasharray: decayed ? "3 3" : undefined,
    };
  };

  return (
    <div>
      {/* ── Period toggle ── */}
      <div role="group" aria-label={t("Period")} style={{
        display: "flex", gap: 4, background: "rgba(var(--overlay-rgb),0.06)",
        border: `1px solid ${C.border}`, borderRadius: 12, padding: 3, marginBottom: 14,
      }}>
        {PERIODS.map(p => {
          const sel = periodDays === p.days;
          return (
            <button key={p.days} type="button" aria-pressed={sel}
              onClick={() => { setPeriodDays(p.days); setActive(null); }}
              style={{
                flex: 1, minHeight: 38, border: "none", borderRadius: 9, cursor: "pointer",
                fontSize: 12, fontWeight: 700, touchAction: "manipulation",
                background: sel ? C.emeraldDim : "transparent",
                color: sel ? C.emerald : C.muted,
              }}>
              {t(p.key)}
            </button>
          );
        })}
      </div>

      {/* ── Headline ── */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 9, flexWrap: "wrap", marginBottom: 10 }}>
        <span style={{
          fontFamily: C.font.display, fontWeight: 900, fontSize: 44, lineHeight: 0.9,
          letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums", color: C.text,
        }}>{fmtValue(last, unit)}</span>
        <span style={{ fontSize: 12.5, color: C.muted, fontWeight: 600 }}>
          {unit === "kg" ? "kg" : t("points")}
        </span>
        <span style={{
          fontFamily: C.font.mono, fontSize: 11.5, fontWeight: 600, padding: "3px 8px",
          borderRadius: 999, color: deltaColor,
          background: diff > 0 ? C.emeraldDim : diff < 0 ? C.roseDim : "rgba(var(--overlay-rgb),0.06)",
          border: `1px solid ${diff > 0 ? C.emeraldBorder : diff < 0 ? C.roseBorder : C.border}`,
        }}>
          {deltaSign}{fmtValue(Math.abs(diff), unit)}{unit === "kg" ? " kg" : ""}
        </span>
      </div>

      {/* ── Chart ── */}
      <div style={{ position: "relative" }}>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={summary}
          style={{ display: "block", width: "100%", height: "auto", overflow: "visible" }}>
          {/* y ticks — every label names a value the line actually reaches */}
          {[lo, (lo + hi) / 2, hi].map((v, i) => (
            <g key={i}>
              <line x1={L} y1={y(v)} x2={W - R} y2={y(v)}
                stroke="rgba(var(--overlay-rgb),0.07)" strokeWidth="1" />
              <text x={L - 6} y={y(v) + 3.5} textAnchor="end" fontSize="9"
                fontFamily="JetBrains Mono, monospace" fill={C.muted}>{fmtValue(v, unit)}</text>
            </g>
          ))}

          {/* Baseline floor — decay cannot cross it. The most reassuring line here. */}
          {data.baseline != null && data.baseline >= lo && (
            <g>
              <line x1={L} y1={y(data.baseline)} x2={W - R} y2={y(data.baseline)}
                stroke={C.emerald} strokeWidth="1.5" strokeDasharray="2 3" opacity="0.55" />
              <text x={W - R} y={y(data.baseline) - 5} textAnchor="end" fontSize="8.5"
                fontWeight="700" fill={C.emerald}>
                {t("base")} {fmtValue(data.baseline, unit)}
              </text>
            </g>
          )}

          {/* Personal record */}
          {data.pr?.value != null && data.pr.value <= hi && data.pr.value >= lo && (
            <line x1={L} y1={y(data.pr.value)} x2={W - R} y2={y(data.pr.value)}
              stroke={C.emerald} strokeWidth="1" strokeDasharray="4 3" opacity="0.4" />
          )}

          {/* Segments: solid where earned, dotted where the value merely decayed */}
          {pts.slice(1).map((_, k) => {
            const i = k + 1;
            const s = seg(i);
            return <line key={i} x1={x(i - 1)} y1={y(pts[i - 1].value)} x2={x(i)} y2={y(pts[i].value)}
              stroke={s.stroke} strokeWidth={s.strokeWidth} strokeDasharray={s.strokeDasharray}
              strokeLinecap="round" />;
          })}

          {/* Points, each with a 16px invisible hit target */}
          {pts.map((p, i) => (
            <g key={p.at_ms}>
              <circle cx={x(i)} cy={y(p.value)} r={i === pts.length - 1 ? 4.5 : 3}
                fill={p.decayed ? C.bg : C.emerald}
                stroke={p.decayed ? "rgba(var(--overlay-rgb),0.45)" : C.emerald} strokeWidth="1.5" />
              <circle cx={x(i)} cy={y(p.value)} r="16" fill="transparent" style={{ cursor: "pointer" }}
                onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)}
                onClick={() => setActive(a => (a === i ? null : i))} />
            </g>
          ))}

          {/* x labels — first and last only; a dense axis on a phone is noise */}
          <text x={x(0)} y={H - 6} textAnchor="start" fontSize="9"
            fontFamily="JetBrains Mono, monospace" fill={C.muted}>{fmtDate(pts[0].at_ms)}</text>
          <text x={x(pts.length - 1)} y={H - 6} textAnchor="end" fontSize="9"
            fontFamily="JetBrains Mono, monospace" fill={C.muted}>{fmtDate(pts[pts.length - 1].at_ms)}</text>
        </svg>

        {active != null && pts[active] && (
          <div style={{
            position: "absolute", pointerEvents: "none", background: C.sheet,
            border: `1px solid ${C.borderStrong}`, borderRadius: 9, padding: "7px 10px",
            fontSize: 11.5, lineHeight: 1.35, color: C.text, whiteSpace: "nowrap", zIndex: 3,
            left: `${Math.min(Math.max((x(active) / W) * 100 - 14, 0), 62)}%`,
            top: `${(y(pts[active].value) / H) * 100 - 30}%`,
            boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
          }}>
            <b style={{ fontFamily: C.font.mono, fontVariantNumeric: "tabular-nums" }}>
              {fmtValue(pts[active].value, unit)}{unit === "kg" ? " kg" : ""}
            </b>
            <span style={{ color: C.muted, display: "block", fontSize: 10.5 }}>
              {fmtDate(pts[active].at_ms)}
              {pts[active].decayed ? ` · ${t("no training — score fades on its own")}` : ""}
            </span>
          </div>
        )}
      </div>

      {/* ── Legend ── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, fontSize: 11, color: C.muted,
        alignItems: "center", marginTop: 8 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
          <i style={{ width: 16, height: 2, borderRadius: 2, background: C.emerald, display: "inline-block" }} />
          {t("trained")}
        </span>
        {hasDecay && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <i style={{ width: 16, height: 2, borderRadius: 2, background: "rgba(var(--overlay-rgb),0.32)", display: "inline-block" }} />
            {t("fading — no training")}
          </span>
        )}
      </div>

      {/* ── Reference rows ── */}
      <div style={{ display: "flex", flexDirection: "column", borderTop: `1px solid ${C.border}`, marginTop: 12 }}>
        {[
          [C.emerald, data.pr?.value != null ? t("Personal record") : t("Highest this period"),
            fmtValue(data.pr?.value ?? peak, unit) + (unit === "kg" ? " kg" : "")],
          ["rgba(var(--overlay-rgb),0.3)", t("Your average"), fmtValue(avg, unit) + (unit === "kg" ? " kg" : "")],
          ["transparent", t("Last session"), fmtDate(pts[pts.length - 1].at_ms)],
        ].map(([sw, label, value]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: 12, padding: "11px 0", borderBottom: `1px solid ${C.border}` }}>
            <span style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, color: C.textSoft }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: sw, flex: "none" }} />
              {label}
            </span>
            <span style={{ fontFamily: C.font.mono, fontSize: 13, fontWeight: 700,
              fontVariantNumeric: "tabular-nums", color: C.text }}>{value}</span>
          </div>
        ))}
      </div>

      {/* ── Table fallback: a screen reader cannot read a polyline ── */}
      <button type="button" onClick={() => setShowTable(s => !s)}
        style={{ background: "none", border: "none", cursor: "pointer", color: C.emerald,
          fontSize: 12, fontWeight: 600, padding: "10px 0 0", minHeight: 40, touchAction: "manipulation" }}>
        {showTable ? t("Hide table") : t("Show as table")}
      </button>
      {showTable && (
        <div style={{ overflowX: "auto", marginTop: 6 }}>
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12 }}>
            <caption style={{ textAlign: "left", color: C.muted, fontSize: 11, paddingBottom: 6 }}>{summary}</caption>
            <thead>
              <tr>
                <th scope="col" style={{ textAlign: "left", color: C.muted, fontWeight: 600, padding: "4px 8px 4px 0" }}>{t("Date")}</th>
                <th scope="col" style={{ textAlign: "right", color: C.muted, fontWeight: 600, padding: "4px 0" }}>{unit === "kg" ? "kg" : t("points")}</th>
              </tr>
            </thead>
            <tbody>
              {pts.map(p => (
                <tr key={p.at_ms} style={{ borderTop: `1px solid ${C.border}` }}>
                  <td style={{ padding: "5px 8px 5px 0", color: C.textSoft }}>
                    {fmtDate(p.at_ms)}{p.decayed ? ` (${t("fading")})` : ""}
                  </td>
                  <td style={{ padding: "5px 0", textAlign: "right", fontFamily: C.font.mono,
                    fontVariantNumeric: "tabular-nums", color: C.text }}>{fmtValue(p.value, unit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default MetricCurve;
