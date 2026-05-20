import { useState } from "react";
import { C, display, eyebrow, mono } from "./tokens.js";
import { Icons, ExerciseIcon } from "./icons.jsx";
import { Glass } from "./uiComponents.jsx";
import api from "./apiClient.js";

// ─── TRAJECTORY HELPERS ────────────────────────────────────────────────────────
function getIsoWeek(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  const day = d.getDay() || 7;
  d.setDate(d.getDate() + 4 - day);
  const ys = new Date(d.getFullYear(), 0, 1);
  const wn = Math.ceil(((d - ys) / 86400000 + 1) / 7);
  return `${d.getFullYear()}-W${String(wn).padStart(2, "0")}`;
}

function computeStreak(history) {
  const dates = new Set(history.filter(h => h.status === "completed").map(h => h.date));
  if (!dates.size) return 0;
  let streak = 0;
  const d = new Date();
  const today = d.toISOString().slice(0, 10);
  if (!dates.has(today)) d.setDate(d.getDate() - 1);
  while (true) {
    const ds = d.toISOString().slice(0, 10);
    if (!dates.has(ds)) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function trajectorySentence(history) {
  const completed = history.filter(h => h.status === "completed");
  const now = new Date();
  const weekKeys = [];
  for (let i = 4; i >= 1; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i * 7);
    const wk = getIsoWeek(d.toISOString().slice(0, 10));
    if (!weekKeys.includes(wk)) weekKeys.push(wk);
  }
  const weekCounts = {};
  completed.forEach(h => { const wk = getIsoWeek(h.date); weekCounts[wk] = (weekCounts[wk] || 0) + 1; });
  const counts = weekKeys.map(wk => weekCounts[wk] ?? 0);
  const avg = counts.reduce((s, c) => s + c, 0) / Math.max(1, counts.length);
  const last = counts[counts.length - 1] ?? 0;
  if (avg >= 4 && last >= avg) return "You're moving forward — three of the last four weeks were ≥4 sessions.";
  if (last < avg * 0.5 && avg > 0) return "Slower week than usual. Worth a check-in?";
  if (avg < 2) return "We're rebuilding. Aim for one extra session this week.";
  return "Steady. Keep showing up.";
}

function TrajectoryChart({ history, accentHex }) {
  const completed = history.filter(h => h.status === "completed");
  const weekCounts = {};
  completed.forEach(h => { const wk = getIsoWeek(h.date); weekCounts[wk] = (weekCounts[wk] || 0) + 1; });
  const now = new Date();
  const weeks = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i * 7);
    const wk = getIsoWeek(d.toISOString().slice(0, 10));
    if (!weeks.includes(wk)) weeks.push(wk);
  }
  const counts = weeks.map(wk => weekCounts[wk] ?? 0);
  const currentWeek = getIsoWeek(now.toISOString().slice(0, 10));
  const maxCount = Math.max(...counts, 1);
  const sorted = [...counts].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const W = 300, barArea = 88, labelH = 16, H = barArea + labelH;
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: "block" }}>
      {median > 0 && (
        <line x1={0} y1={barArea - (median / maxCount) * barArea} x2={W} y2={barArea - (median / maxCount) * barArea}
          stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="3 2" />
      )}
      {weeks.map((wk, i) => {
        const count = counts[i];
        const isCurrent = wk === currentWeek;
        const gap = W / weeks.length;
        const bw = gap * 0.6;
        const x = i * gap + (gap - bw) / 2;
        const bh = count > 0 ? Math.max(4, (count / maxCount) * barArea) : 2;
        const y = barArea - bh;
        return (
          <g key={wk}>
            <rect x={x} y={y} width={bw} height={bh} rx={2}
              fill={isCurrent ? accentHex : "rgba(255,255,255,0.18)"} />
            <text x={x + bw / 2} y={H - 1} textAnchor="middle"
              fontSize={7} fontWeight="800" fontFamily="monospace"
              fill={isCurrent ? accentHex : "rgba(100,116,139,0.45)"}>
              {wk.split("-W")[1]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── RADAR CHART ──────────────────────────────────────────────────────────────
const RADAR_AXES = ["push", "pull", "legs", "core", "conditioning", "mobility"];
const RADAR_LABELS = { push: "Push", pull: "Pull", legs: "Legs", core: "Core", conditioning: "Cardio", mobility: "Mobility" };

function radarPoint(cx, cy, r, index, total) {
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

function radarPolygon(cx, cy, maxR, scores) {
  return RADAR_AXES.map((axis, i) => {
    const fraction = Math.max(0, Math.min(100, scores[axis] ?? 0)) / 100;
    const pt = radarPoint(cx, cy, maxR * fraction, i, RADAR_AXES.length);
    return `${pt.x},${pt.y}`;
  }).join(" ");
}

function RadarChart({ scores, goalScores, accentHex, size = 220 }) {
  const cx = size / 2, cy = size / 2, maxR = size * 0.37;
  const gridLevels = [0.25, 0.5, 0.75, 1.0];
  const labelOffset = 22;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: "visible" }}>
      {/* Grid rings */}
      {gridLevels.map((lvl, gi) => (
        <polygon
          key={gi}
          points={RADAR_AXES.map((_, i) => {
            const pt = radarPoint(cx, cy, maxR * lvl, i, RADAR_AXES.length);
            return `${pt.x},${pt.y}`;
          }).join(" ")}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1"
        />
      ))}
      {/* Spokes */}
      {RADAR_AXES.map((_, i) => {
        const pt = radarPoint(cx, cy, maxR, i, RADAR_AXES.length);
        return <line key={i} x1={cx} y1={cy} x2={pt.x} y2={pt.y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />;
      })}
      {/* Goal target polygon */}
      {goalScores && (
        <polygon
          points={radarPolygon(cx, cy, maxR, goalScores)}
          fill={`${accentHex}18`}
          stroke={`${accentHex}55`}
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
      )}
      {/* Current score polygon */}
      <polygon
        points={radarPolygon(cx, cy, maxR, scores)}
        fill={`${accentHex}28`}
        stroke={accentHex}
        strokeWidth="2"
      />
      {/* Score dots */}
      {RADAR_AXES.map((axis, i) => {
        const fraction = Math.max(0, Math.min(100, scores[axis] ?? 0)) / 100;
        const pt = radarPoint(cx, cy, maxR * fraction, i, RADAR_AXES.length);
        return <circle key={axis} cx={pt.x} cy={pt.y} r="4" fill={accentHex} stroke={C.bg} strokeWidth="2" />;
      })}
      {/* Axis labels */}
      {RADAR_AXES.map((axis, i) => {
        const pt = radarPoint(cx, cy, maxR + labelOffset, i, RADAR_AXES.length);
        const score = Math.round(scores[axis] ?? 0);
        return (
          <text
            key={axis}
            x={pt.x}
            y={pt.y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="10"
            fontWeight="800"
            fontFamily={C.font.body}
            fill={C.faint}
          >
            {RADAR_LABELS[axis]}
            {"\n"}
            <tspan x={pt.x} dy="13" fontSize="11" fontWeight="900" fill={C.text}>{score}</tspan>
          </text>
        );
      })}
    </svg>
  );
}

// ─── AWARDS NEXT-UNLOCK HINT ───────────────────────────────────────────────────
const SESSION_AWARD_NAMES = { 1: "Genesis", 3: "The Habit", 7: "Full Rotation", 10: "Steady", 25: "Committed", 50: "Half Century", 100: "Centurion" };
function nextSessionUnlock(n) {
  const milestones = [1, 3, 7, 10, 25, 50, 100];
  const next = milestones.find(m => n < m);
  if (!next) return null;
  return { remaining: next - n, name: SESSION_AWARD_NAMES[next] ?? `${next} sessions` };
}

// ─── PROGRESSION VIEW ──────────────────────────────────────────────────────────
const GOAL_LABELS_MAP = {
  health: "General Health", strength: "Build Strength", fat_loss: "Lose Weight",
  muscle_gain: "Build Muscle", endurance: "Endurance", mobility: "Mobility & Flex",
};

export default function HistoryView({ progression, isLoading, token, prefs, onProgressionUpdate, history = [], setView }) {
  const accentHex = prefs?.preferences?.accent ?? localStorage.getItem("jf_accent") ?? "#10b981";
  const [showCompare, setShowCompare] = useState(true);
  const [chartMode, setChartMode] = useState(null); // null = use API default
  const [recomputing, setRecomputing] = useState(false);
  const [recomputeMsg, setRecomputeMsg] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const effectiveChartMode = chartMode ?? progression?.chart_mode ?? "balanced";
  const goal = prefs?.training_goal ?? progression?.goal ?? "health";

  // Get display scores for the selected chart mode
  const displayScores = progression?.scores_by_mode?.[effectiveChartMode] ?? progression?.scores ?? {};
  const goalScores    = progression?.goal_profile?.targets ?? null;

  const runCoachActive = !!(prefs?.preferences?.run_coach?.enrolled && !prefs?.preferences?.run_coach?.completed);
  const cycleCoachActive = !!(prefs?.preferences?.cycling_coach?.active && !prefs?.preferences?.cycling_coach?.completed);
  const militaryCoachActive = !!(prefs?.preferences?.military_coach?.active);
  const sportMode = militaryCoachActive ? "military" : runCoachActive ? "running" : cycleCoachActive ? "cycling" : "general";

  const CHART_MODES = [
    { id: "power",     label: "Power",     desc: "Maximum strength output per muscle group" },
    { id: "endurance", label: "Endurance", desc: "Capacity for sustained effort per muscle group" },
    { id: "balanced",  label: "Balanced",  desc: "Average of Power and Endurance scores" },
    { id: "mobility",  label: "Mobility",  desc: "Flexibility and movement quality scores" },
  ];

  const handleChartModeChange = (mode) => {
    setChartMode(mode);
    api.saveProgressionPrefs(token, { progression_chart_mode: mode }).catch(() => {});
  };

  const handleRecompute = async () => {
    setRecomputing(true);
    try {
      await api.recomputeProgression(token);
      const updated = await api.getProgression(token);
      if (updated?.ok) {
        onProgressionUpdate(updated);
        setRecomputeMsg("Scores recomputed from your full history.");
      }
    } catch { setRecomputeMsg("Recompute failed."); }
    setRecomputing(false);
    setTimeout(() => setRecomputeMsg(""), 4000);
  };

  // Stable reference for component mount time — avoids Date.now() inside render
  const [nowMs] = useState(() => Date.now());

  if (isLoading) {
    return (
      <div>
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ ...display(36), color: C.text }}>PROGRESS</h1>
        </div>
        <Glass style={{ padding: 48, textAlign: "center" }}>
          <div style={{ fontSize: 13, color: C.muted, fontStyle: "italic" }}>Loading your progression…</div>
        </Glass>
      </div>
    );
  }

  // ── Weekly outcome ──────────────────────────────────────────────────────
  const weeklyOutcome = (() => {
    const cutoff = new Date(nowMs); cutoff.setDate(cutoff.getDate() - 6);
    const lastEnd = new Date(nowMs); lastEnd.setDate(lastEnd.getDate() - 7);
    const lastStart = new Date(nowMs); lastStart.setDate(lastStart.getDate() - 13);
    const cutoffStr   = cutoff.toISOString().slice(0, 10);
    const lastEndStr  = lastEnd.toISOString().slice(0, 10);
    const lastStartStr = lastStart.toISOString().slice(0, 10);
    const thisWeek = history.filter(h => h.date >= cutoffStr);
    const lastWeek = history.filter(h => h.date >= lastStartStr && h.date <= lastEndStr);
    const targetMap = { health: 3, strength: 4, muscle_gain: 4, fat_loss: 4, endurance: 5, mobility: 3 };
    const target = targetMap[goal] ?? 3;
    const done = thisWeek.length;
    const trend = done - lastWeek.length;
    const rated = thisWeek.filter(h => h.perceived_exertion != null);
    const avgPE = rated.length ? rated.reduce((s, h) => s + h.perceived_exertion, 0) / rated.length : null;
    const exertionLabel = avgPE == null ? null : avgPE >= 7 ? "Tough week" : avgPE <= 4 ? "Light week" : "Well-paced";
    const verdict = done >= target ? "on-track" : done >= Math.ceil(target * 0.6) ? "building" : "behind";
    const verdictLabel = { "on-track": "On track", "building": "Building", "behind": "Behind" }[verdict];
    const verdictColor = { "on-track": C.emerald, "building": "#f59e0b", "behind": "#f43f5e" }[verdict];
    const insightMap = {
      health:      "Variety is the plan — strength, cardio and mobility in rotation.",
      strength:    "Progressive overload accumulates. 4 sessions per week is the minimum.",
      muscle_gain: "Volume drives hypertrophy. 4 sessions per week builds the stimulus.",
      fat_loss:    "Consistent sessions + varied intensity keeps metabolism active.",
      endurance:   "Zone 2 is the engine. 5 sessions per week expands your aerobic base.",
      mobility:    "Regularity beats intensity. 3 sessions per week is your foundation.",
    };
    const insight = insightMap[goal] ?? "Consistency is your most powerful tool.";
    return { done, target, trend, exertionLabel, verdict, verdictLabel, verdictColor, insight };
  })();

  const streak = computeStreak(history);
  const completedCount = history.filter(h => h.status === "completed").length;

  return (
    <div>
      {/* ── Trajectory hero ── */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ ...display(36), color: C.text, margin: "0 0 20px 0" }}>PROGRESS</h1>
        <Glass style={{ padding: 20, marginBottom: 20 }}>
          {completedCount === 0 ? (
            <div style={{ textAlign: "center", padding: "16px 0", fontSize: 13, color: C.muted, fontStyle: "italic" }}>
              Start your first session to begin the chart.
            </div>
          ) : (
            <TrajectoryChart history={history} accentHex={accentHex} />
          )}
        </Glass>
        <div style={{ marginBottom: 8 }}>
          <span style={{ ...display(28), color: C.text }}>STREAK · </span>
          <span style={{ ...display(28), color: "var(--accent)" }}>{streak} {streak === 1 ? "DAY" : "DAYS"}</span>
        </div>
        <div style={{ fontSize: 16, color: C.muted, lineHeight: 1.5 }}>{trajectorySentence(history)}</div>
      </div>

      {/* ── Weekly outcome card ── */}
      <Glass style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ ...eyebrow, color: C.faint, fontSize: 9.5 }}>THIS WEEK</div>
          <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", color: weeklyOutcome.verdictColor, background: `${weeklyOutcome.verdictColor}18`, border: `1px solid ${weeklyOutcome.verdictColor}40`, padding: "3px 10px", borderRadius: 999 }}>
            {weeklyOutcome.verdictLabel}
          </span>
        </div>
        {/* Session dots + count */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 5 }}>
            {Array.from({ length: weeklyOutcome.target }).map((_, i) => (
              <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: i < weeklyOutcome.done ? "var(--accent)" : "rgba(var(--accent-rgb),0.15)", border: i < weeklyOutcome.done ? "none" : "1px solid rgba(var(--accent-rgb),0.3)" }} />
            ))}
          </div>
          <span style={{ ...mono(12), color: C.text }}>
            {weeklyOutcome.done} / {weeklyOutcome.target} sessions
          </span>
          {weeklyOutcome.trend !== 0 && (
            <span style={{ ...mono(11), color: weeklyOutcome.trend > 0 ? C.emerald : C.muted }}>
              {weeklyOutcome.trend > 0 ? `↑ +${weeklyOutcome.trend}` : `↓ ${weeklyOutcome.trend}`} vs last week
            </span>
          )}
          {weeklyOutcome.exertionLabel && (
            <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, marginLeft: "auto" }}>
              {weeklyOutcome.exertionLabel}
            </span>
          )}
        </div>
        {/* Goal insight */}
        <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
          <span style={{ fontWeight: 700, color: C.text }}>Goal: {goal.replace(/_/g, " ")} — </span>
          {weeklyOutcome.insight}
        </div>
        {/* Goal-fit progress row — shown when progression data available */}
        {progression?.goal_fit != null && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
            {/* Goal-fit ring */}
            <svg width={36} height={36} viewBox="0 0 36 36" style={{ flexShrink: 0 }}>
              <circle cx={18} cy={18} r={14} fill="none" stroke="rgba(var(--accent-rgb),0.12)" strokeWidth={3} />
              <circle cx={18} cy={18} r={14} fill="none" stroke="var(--accent)" strokeWidth={3}
                strokeDasharray={`${(progression.goal_fit / 100) * 87.96} 87.96`}
                strokeLinecap="round" transform="rotate(-90 18 18)" />
              <text x={18} y={22} textAnchor="middle" fontSize={9} fontWeight="900"
                fontFamily="monospace" fill="var(--accent)">{progression.goal_fit}%</text>
            </svg>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.text }}>
                {progression.goal_fit >= 80 ? "Profile aligned with your goal" :
                 progression.goal_fit >= 50 ? "Building toward your goal" :
                 "Room to grow toward your goal"}
              </div>
              {progression.insights?.biggest_gap && (
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                  Focus: {progression.insights.biggest_gap.label} — already on the planner's radar
                </div>
              )}
            </div>
          </div>
        )}
      </Glass>

      {!progression ? (
        <Glass style={{ padding: 48, textAlign: "center" }}>
          <div style={{ marginBottom: 10 }}><Icons.lift size={22} c={C.muted} /></div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 8 }}>No progression data yet</div>
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>Complete your first workout and your training profile will appear here.</div>
        </Glass>
      ) : (
        <>
          {((sportMode === "general" && completedCount >= 14) || sportMode === "military") && (
            <>
              {/* ── Chart mode tabs — general only ── */}
              {sportMode === "general" && (
                <div style={{ display: "flex", gap: 6, marginBottom: 20, overflowX: "auto", paddingBottom: 2 }}>
                  {CHART_MODES.map((m) => {
                    const active = effectiveChartMode === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => handleChartModeChange(m.id)}
                        style={{
                          padding: "7px 14px", borderRadius: 999, fontSize: 12, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap",
                          border: `1px solid ${active ? C.emeraldBorder : C.border}`,
                          background: active ? C.emeraldDim : "rgba(255,255,255,0.04)",
                          color: active ? C.emerald : C.muted,
                        }}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setShowCompare((v) => !v)}
                    style={{
                      marginLeft: "auto", padding: "7px 14px", borderRadius: 999, fontSize: 12, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap",
                      border: `1px solid ${showCompare ? C.emeraldBorder : C.border}`,
                      background: showCompare ? C.emeraldDim : "rgba(255,255,255,0.04)",
                      color: showCompare ? C.emerald : C.muted,
                    }}
                  >
                    {showCompare ? "Goal on" : "Goal off"}
                  </button>
                </div>
              )}

              {/* ── Mode description — general only ── */}
              {sportMode === "general" && (
                <div style={{ marginBottom: 14, paddingLeft: 2 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.emerald }}>{CHART_MODES.find(m => m.id === effectiveChartMode)?.label}</span>
                  <span style={{ fontSize: 11, color: C.muted }}> — {CHART_MODES.find(m => m.id === effectiveChartMode)?.desc}</span>
                </div>
              )}

              {/* ── Military fitness profile label ── */}
              {sportMode === "military" && (
                <div style={{ marginBottom: 14, paddingLeft: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.emerald }}>Fitness Profile</span>
                    <span style={{ fontSize: 11, color: C.muted }}> — your current scores vs. military target vector</span>
                  </div>
                  <button
                    onClick={() => setShowCompare((v) => !v)}
                    style={{
                      padding: "5px 12px", borderRadius: 999, fontSize: 11, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap",
                      border: `1px solid ${showCompare ? C.emeraldBorder : C.border}`,
                      background: showCompare ? C.emeraldDim : "rgba(255,255,255,0.04)",
                      color: showCompare ? C.emerald : C.muted,
                    }}
                  >
                    {showCompare ? "Target on" : "Target off"}
                  </button>
                </div>
              )}

              {/* ── Radar chart ── */}
              <Glass style={{ padding: 20, marginBottom: 20, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ ...eyebrow, color: C.faint, fontSize: 9.5, marginBottom: 16, alignSelf: "flex-start" }}>
                  TRAINING BALANCE
                </div>
                <RadarChart
                  scores={displayScores}
                  goalScores={showCompare ? goalScores : null}
                  accentHex={accentHex}
                  size={220}
                />
                <div style={{ marginTop: 16, display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 12, height: 3, borderRadius: 2, background: accentHex }} />
                    <span style={{ ...eyebrow, fontSize: 9, color: C.mutedStrong }}>Current</span>
                  </div>
                  {showCompare && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 12, height: 2, borderRadius: 1, background: `${accentHex}55`, borderTop: "1px dashed", borderColor: `${accentHex}55` }} />
                      <span style={{ ...eyebrow, fontSize: 9, color: C.mutedStrong }}>{sportMode === "military" ? "Military target" : "Goal target"}</span>
                    </div>
                  )}
                </div>
              </Glass>
            </>
          )}

          {/* ── Goal Fit card ── */}
          <Glass style={{ padding: 20, marginBottom: 12, display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ position: "relative", width: 60, height: 60, flexShrink: 0 }}>
              <svg width="60" height="60" viewBox="0 0 60 60">
                <circle cx="30" cy="30" r="24" fill="none" stroke={C.border} strokeWidth="5" />
                <circle
                  cx="30" cy="30" r="24" fill="none"
                  stroke={accentHex} strokeWidth="5"
                  strokeDasharray={`${(progression.goal_fit / 100) * 150.8} 150.8`}
                  strokeLinecap="round"
                  transform="rotate(-90 30 30)"
                />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 15, fontWeight: 900, color: C.text }}>{progression.goal_fit}%</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, color: C.text, marginBottom: 3 }}>
                {sportMode === "running" || sportMode === "cycling" ? "Program Fit" : sportMode === "military" ? "Military Fit" : "Goal Fit"}
              </div>
              <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>
                {sportMode === "running"
                  ? "How your conditioning aligns with your running target."
                  : sportMode === "cycling"
                  ? "How your conditioning aligns with your cycling programme."
                  : sportMode === "military"
                  ? "How close your current profile is to your military fitness target."
                  : (progression.goal_profile?.description ?? "How close your current profile matches your goal.")}
              </div>
            </div>
          </Glass>



          {/* ── Axis breakdown for military ── */}
          {sportMode === "military" && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ ...eyebrow, color: C.faint, fontSize: 9.5, marginBottom: 12 }}>AXIS BREAKDOWN</div>
              <Glass style={{ padding: "4px 0" }}>
                {RADAR_AXES.map((axis, i) => {
                  const current = Math.round(displayScores[axis] ?? 0);
                  const target  = Math.round(goalScores?.[axis] ?? 50);
                  const delta   = current - target;
                  return (
                    <div key={axis} style={{ padding: "12px 0", margin: "0 16px", borderBottom: i < RADAR_AXES.length - 1 ? `1px solid ${C.border}` : "none" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <span style={{ ...eyebrow, color: C.text, fontSize: 11 }}>{RADAR_LABELS[axis]}</span>
                        <span style={{ ...mono(12), color: C.text }}>
                          {current}
                          {delta !== 0 && (
                            <span style={{ color: delta > 0 ? C.emerald : "#f59e0b", marginLeft: 8, fontSize: 11 }}>
                              {delta > 0 ? "↑" : "↓"} {Math.abs(delta)}
                            </span>
                          )}
                        </span>
                      </div>
                      <div style={{ height: 6, marginTop: 8, background: C.bgCard, borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ width: `${current}%`, height: "100%", background: accentHex, borderRadius: 3, transition: "width 0.5s ease" }} />
                      </div>
                    </div>
                  );
                })}
              </Glass>
            </div>
          )}

          {/* ── Key insights + planner explanation (general mode only) ── */}
          {sportMode === "general" && (progression.insights || (progression.planner_explanation ?? []).length > 0) && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", color: C.emerald, textTransform: "uppercase", marginBottom: 12 }}>
                Key Insights
              </div>
              <Glass style={{ padding: 20 }}>

                {/* Strongest / Weakest — general mode only */}
                {sportMode === "general" && progression.insights && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    {[
                      { key: "strongest", label: "Strongest", val: progression.insights.strongest?.label, sub: progression.insights.strongest?.score },
                      { key: "weakest",   label: "Weakest",   val: progression.insights.weakest?.label,   sub: progression.insights.weakest?.score },
                    ].map(({ key, label, val, sub }) => val ? (
                      <div key={key}>
                        <div style={{ fontSize: 10, fontWeight: 900, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>{label}</div>
                        <div style={{ fontSize: 15, fontWeight: 900, color: C.text }}>{val}</div>
                        <div style={{ fontSize: 11, color: C.emerald, fontWeight: 700, marginTop: 2 }}>Score: {sub}</div>
                      </div>
                    ) : null)}
                  </div>
                )}

                {/* Focus this week — general mode only */}
                {sportMode === "general" && progression.insights?.biggest_gap && (
                  <>
                    <div style={{ height: 1, background: C.border, margin: "16px 0" }} />
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: C.emeraldDim, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 15 }}>🎯</div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 900, color: C.text, marginBottom: 2 }}>Focus this week: {progression.insights.biggest_gap.label}</div>
                        <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.5 }}>{progression.insights.biggest_gap.gap} points behind your goal target — the planner is already on it.</div>
                      </div>
                    </div>
                  </>
                )}

                {/* Insight text rows — general mode only */}
                {sportMode === "general" && (progression.insights?.insight_text ?? []).map((txt, i) => (
                  <div key={i}>
                    <div style={{ height: 1, background: C.border, margin: "16px 0" }} />
                    <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>{txt}</div>
                  </div>
                ))}

                {/* How the Planner Adapts — general mode only */}
                {sportMode === "general" && (progression.planner_explanation ?? []).length > 0 && (
                  <>
                    <div style={{ height: 1, background: C.border, margin: "16px 0" }} />
                    <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 12 }}>
                      How the Planner Adapts
                    </div>
                    {progression.planner_explanation.map((line, i) => (
                      <div key={i} style={{ display: "flex", gap: 10, marginBottom: i < progression.planner_explanation.length - 1 ? 12 : 0 }}>
                        <div style={{ width: 6, height: 6, borderRadius: 3, background: C.emerald, flexShrink: 0, marginTop: 6 }} />
                        <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6, fontWeight: 500 }}>{line}</div>
                      </div>
                    ))}
                  </>
                )}

              </Glass>
            </div>
          )}

          {sportMode === "general" && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ ...eyebrow, color: C.faint, fontSize: 9.5, marginBottom: 12 }}>AXIS BREAKDOWN</div>
              <Glass style={{ padding: "4px 0" }}>
                {RADAR_AXES.map((axis, i) => {
                  const current = Math.round(displayScores[axis] ?? 0);
                  const target  = Math.round(goalScores?.[axis] ?? 50);
                  const delta   = current - target;
                  return (
                    <div key={axis} style={{ padding: "12px 0", margin: "0 16px", borderBottom: i < RADAR_AXES.length - 1 ? `1px solid ${C.border}` : "none" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <span style={{ ...eyebrow, color: C.text, fontSize: 11 }}>{RADAR_LABELS[axis]}</span>
                        <span style={{ ...mono(12), color: C.text }}>
                          {current}
                          {delta !== 0 && (
                            <span style={{ color: delta > 0 ? C.emerald : "#f59e0b", marginLeft: 8, fontSize: 11 }}>
                              {delta > 0 ? "↑" : "↓"} {Math.abs(delta)}
                            </span>
                          )}
                        </span>
                      </div>
                      <div style={{ height: 6, marginTop: 8, background: C.bgCard, borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ width: `${current}%`, height: "100%", background: C.emerald, borderRadius: 3, transition: "width 0.5s ease" }} />
                      </div>
                    </div>
                  );
                })}
              </Glass>
            </div>
          )}

          {/* ── Awards entry point ── */}
          {(() => {
            const nextAward = nextSessionUnlock(completedCount);
            return (
              <div style={{ marginBottom: 20, paddingTop: 4 }}>
                {nextAward && (
                  <div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>
                    Next: {nextAward.name} — {nextAward.remaining} {nextAward.remaining === 1 ? "session" : "sessions"} to go
                  </div>
                )}
                <button onClick={() => setView("awards")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 13, fontWeight: 700, color: "var(--accent)", fontFamily: "inherit" }}>
                  Trophy room →
                </button>
              </div>
            );
          })()}

          {/* ── Recent sessions ── */}
          {(() => {
            const recent = history.filter(h => h.status === "completed").slice(0, 5);
            if (!recent.length) return null;
            return (
              <div style={{ marginBottom: 20 }}>
                <div style={{ ...eyebrow, color: C.faint, fontSize: 9.5, marginBottom: 12 }}>RECENT SESSIONS</div>
                {recent.map((session) => {
                  const steps = session.steps ?? [];
                  const mins = session.total_duration_sec ? Math.round(session.total_duration_sec / 60) : null;
                  const d = new Date(session.date + "T12:00:00");
                  const dateLabel = d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
                  return (
                    <Glass key={session.id} style={{ padding: "14px 16px", marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: steps.length ? 10 : 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{dateLabel}</div>
                        {mins && <div style={{ ...mono(11), color: C.muted }}>{mins} min</div>}
                      </div>
                      {steps.map((step, i) => {
                        const prescribed = step.prescribed_json ? JSON.parse(step.prescribed_json) : {};
                        const actual = step.actual_json ? JSON.parse(step.actual_json) : {};
                        const sets = actual.sets_completed ?? prescribed.sets ?? null;
                        const repArr = actual.reps_per_set;
                        const reps = repArr?.length ? Math.round(repArr.reduce((a, b) => a + b, 0) / repArr.length) : prescribed.reps ?? null;
                        const durSec = prescribed.duration_sec ?? null;
                        const stat = durSec
                          ? `${sets ?? 1} × ${Math.round(durSec / 60)}min`
                          : sets && reps ? `${sets} × ${reps}` : sets ? `${sets} sets` : null;
                        return (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: i < steps.length - 1 ? `1px solid ${C.border}` : "none" }}>
                            <div style={{ fontSize: 12, color: C.text, fontWeight: 500 }}>{step.name}</div>
                            {stat && <div style={{ ...mono(11), color: C.muted }}>{stat}</div>}
                          </div>
                        );
                      })}
                      {!steps.length && (
                        <div style={{ fontSize: 12, color: C.muted, fontStyle: "italic" }}>No exercises recorded</div>
                      )}
                    </Glass>
                  );
                })}
              </div>
            );
          })()}

          {/* ── Advanced (hidden by default) ── */}
          <div style={{ marginTop: 32, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
            <button
              onClick={() => setShowAdvanced(s => !s)}
              style={{ background: "none", border: "none", padding: 0, fontSize: 11, fontWeight: 700, color: C.muted, cursor: "pointer", letterSpacing: "0.05em" }}
            >
              {showAdvanced ? "▾ Advanced" : "▸ Advanced"}
            </button>
            {showAdvanced && (
              <div style={{ marginTop: 12 }}>
                <button
                  onClick={handleRecompute}
                  disabled={recomputing}
                  style={{ padding: "10px 18px", borderRadius: 12, fontSize: 12, fontWeight: 800, cursor: recomputing ? "default" : "pointer", border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.04)", color: C.muted, opacity: recomputing ? 0.6 : 1 }}
                >
                  {recomputing ? "Recomputing…" : "Rebuild scores from history"}
                </button>
                {recomputeMsg && <div style={{ marginTop: 8, fontSize: 12, color: C.emerald, fontWeight: 700 }}>{recomputeMsg}</div>}
                <div style={{ marginTop: 8, fontSize: 11, color: C.muted, lineHeight: 1.5 }}>
                  Recalculates progression scores from your full workout history. Use if you migrate accounts or need a fresh score.
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── TIME FORMATTING ──────────────────────────────────────────────────────────
// For individual exercise durations in lists/cards