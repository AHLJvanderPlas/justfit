import { useState } from "react";
import { C, display, eyebrow, mono } from "./tokens.js";
import { Icons, ExerciseIcon, GoalIcon, MilitaryIcon } from "./icons.jsx";
import { milClL, getUserId } from "./planUtils.js";
import { GOALS, EXPERIENCE } from "./appConstants.js";
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

// ─── PROGRESSION VIEW ──────────────────────────────────────────────────────────
const GOAL_LABELS_MAP = {
  health: "General Health", strength: "Build Strength", fat_loss: "Lose Weight",
  muscle_gain: "Build Muscle", endurance: "Endurance", mobility: "Mobility & Flex",
};

export default function HistoryView({ progression, cyclingPmc, isLoading, token, prefs, onProgressionUpdate, history = [], plan, setView, ftpSnoozedUntil, setFtpSnoozedUntil }) {
  const [now] = useState(Date.now);
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
      </Glass>

      {!progression ? (
        <Glass style={{ padding: 48, textAlign: "center" }}>
          <div style={{ fontSize: 22, marginBottom: 10 }}>🏋️</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 8 }}>No progression data yet</div>
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>Complete your first workout and your training profile will appear here.</div>
        </Glass>
      ) : (
        <>
          {/* ── Military Coach header card ── */}
          {sportMode === "military" && (() => {
            const mil = prefs?.preferences?.military_coach ?? {};
            const track = mil.track ?? 'keuring';
            const clusterCurrent = mil.cluster_current ?? (track === 'keuring' ? 0 : 1);
            const clusterTarget = mil.cluster_target ?? clusterCurrent;
            const trackLabel = track === 'keuring' ? 'Physical Assessment' : 'Educational Fitness';
            const mode = mil.mode ?? 'target';
            const maxLevel = 6;
            const CLUSTER_DESC = track === 'keuring'
              ? { 0: "Basis", 1: "Entry", 2: "Standard", 3: "Infantry", 4: "Above average", 5: "High performance", 6: "Special forces" }
              : { 1: "Entry", 2: "Standard", 3: "Infantry", 4: "Above average", 5: "High performance", 6: "Advanced" };
            const daysToAssessment = mode === 'target' && mil.target_date
              ? Math.ceil((new Date(mil.target_date + 'T12:00:00').getTime() - nowMs) / 86_400_000)
              : null;
            return (
              <Glass style={{ padding: 20, marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--accent-dim)", border: "1px solid var(--accent-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "var(--accent)" }}>
                    <MilitaryIcon size={20} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", color: C.muted, textTransform: "uppercase", marginBottom: 2 }}>Military Coach · {trackLabel}</div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: C.text, lineHeight: 1.2 }}>
                      Current: {milClL(track, clusterCurrent)}
                      {mode !== 'open' && clusterTarget > clusterCurrent && <span style={{ fontSize: 11, color: C.muted, marginLeft: 8 }}>→ Target {milClL(track, clusterTarget)}</span>}
                      {mode === 'open' && clusterCurrent < maxLevel && <span style={{ fontSize: 11, color: C.muted, marginLeft: 8 }}>→ Next: {milClL(track, clusterCurrent + 1)}</span>}
                    </div>
                    {daysToAssessment !== null && (
                      <div style={{ fontSize: 11, color: daysToAssessment <= 14 ? "#f59e0b" : C.muted, marginTop: 2, fontWeight: 700 }}>
                        {daysToAssessment > 0 ? `${daysToAssessment} days to assessment` : daysToAssessment === 0 ? "Assessment today" : "Assessment date passed"}
                      </div>
                    )}
                    {mode === 'fit' && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Fit target — no fixed date</div>}
                    {mode === 'open' && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Continuous progression</div>}
                  </div>
                </div>
                {/* Level ladder */}
                <div style={{ display: "flex", gap: 4 }}>
                  {Array.from({ length: track === 'keuring' ? 7 : 6 }, (_, i) => track === 'keuring' ? i : i + 1).map(lvl => {
                    const isPast = lvl < clusterCurrent;
                    const isCurrent = lvl === clusterCurrent;
                    const isTarget = mode !== 'open' && lvl === clusterTarget;
                    const isGap = mode !== 'open' && lvl > clusterCurrent && lvl < clusterTarget;
                    return (
                      <div key={lvl} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                        <div style={{
                          width: "100%", height: 6, borderRadius: 3,
                          background: isCurrent ? accentHex : isPast ? `${accentHex}60` : isGap ? `${accentHex}20` : isTarget ? `${accentHex}40` : C.border,
                          border: isTarget ? `1px solid ${accentHex}` : "none",
                          transition: "background 0.3s ease",
                        }} />
                        <span style={{ fontSize: 9, fontWeight: 900, color: isCurrent ? accentHex : isTarget ? `${accentHex}80` : C.subtle, letterSpacing: "0.04em" }}>
                          {milClL(track, lvl)}
                        </span>
                        {isCurrent && <span style={{ fontSize: 8, color: accentHex, fontWeight: 900 }}>NOW</span>}
                        {isTarget && !isCurrent && <span style={{ fontSize: 8, color: C.muted, fontWeight: 700 }}>GOAL</span>}
                      </div>
                    );
                  })}
                </div>
                {CLUSTER_DESC[clusterCurrent] !== undefined && (
                  <div style={{ marginTop: 10, fontSize: 11, color: C.muted }}>{milClL(track, clusterCurrent)} — {CLUSTER_DESC[clusterCurrent]}</div>
                )}
              </Glass>
            );
          })()}

          {/* ── Running Coach header card ── */}
          {sportMode === "running" && prefs?.preferences?.run_coach?.enrolled && (() => {
            const rc = prefs.preferences.run_coach;
            const PROGRAM_WEEKS = { 5: 8, 10: 12, 15: 14, 20: 16, 30: 20 };
            const totalWeeks = PROGRAM_WEEKS[rc.target_km ?? 5] ?? 8;
            const week = rc.week ?? 1;
            const sessionInWeek = rc.session_in_week ?? 0;
            const pct = Math.min(100, Math.round(((week - 1) * 3 + sessionInWeek) / (totalWeeks * 3) * 100));
            return (
              <Glass style={{ padding: 20, marginBottom: 20, display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--accent-dim)", border: "1px solid var(--accent-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "var(--accent)" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", color: C.muted, textTransform: "uppercase", marginBottom: 2 }}>Running Coach</div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: C.text, marginBottom: 8 }}>Week {week} of {totalWeeks} · {rc.target_km}km Program</div>
                  <div style={{ background: C.subtle, borderRadius: 999, height: 5, marginBottom: 5 }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: accentHex, borderRadius: 999, transition: "width 0.5s ease" }} />
                  </div>
                  <div style={{ fontSize: 11, color: C.muted }}>Session {sessionInWeek} of 3 this week · {pct}% complete</div>
                </div>
              </Glass>
            );
          })()}

          {/* ── Training Goal card (general mode only) — above diagram ── */}
          {sportMode === "general" && (() => {
            const currentGoal = GOALS.find((g) => g.value === goal) ?? GOALS[0];
            const exp = EXPERIENCE.find((e) => e.value === (prefs?.experience_level ?? "beginner")) ?? EXPERIENCE[0];
            return (
              <Glass style={{ padding: 20, marginBottom: 20, display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--accent-dim)", border: "1px solid var(--accent-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "var(--accent)" }}>
                  <GoalIcon value={currentGoal.value} size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", color: C.muted, textTransform: "uppercase", marginBottom: 2 }}>Training goal</div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: C.text, lineHeight: 1.2 }}>{currentGoal.label}</div>
                  <span style={{ display: "inline-block", marginTop: 3, padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, color: C.muted }}>
                    {exp.label}
                  </span>
                </div>
                <div style={{ marginLeft: "auto", fontSize: 11, color: C.subtle, fontStyle: "italic" }}>Change in Settings →</div>
              </Glass>
            );
          })()}

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

          {/* ── Running Coach card (Progress tab) ── */}
          {prefs?.preferences?.run_coach?.enrolled && !prefs?.preferences?.run_coach?.completed && (() => {
            const rc = prefs.preferences.run_coach;
            const PROGRAM_WEEKS = { 5: 8, 10: 12, 15: 14, 20: 16, 30: 20 };
            const totalWeeks = PROGRAM_WEEKS[rc.target_km ?? 5] ?? 8;
            const week = rc.week ?? 1;
            const sessionInWeek = rc.session_in_week ?? 0;
            const pct = Math.min(100, Math.round(((week - 1) * 3 + sessionInWeek) / (totalWeeks * 3) * 100));
            const unlockedTargets = rc.unlocked_targets ?? [];
            return (
              <Glass style={{ padding: 20, marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: C.emeraldDim, border: `1px solid ${C.emeraldBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: C.emerald }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", color: C.muted, textTransform: "uppercase", marginBottom: 1 }}>Running Coach</div>
                      <div style={{ fontSize: 14, fontWeight: 900, color: C.text }}>{rc.target_km}km Program</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: C.text, lineHeight: 1, letterSpacing: "-0.02em" }}>Week {week}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>of {totalWeeks}</div>
                  </div>
                </div>
                <div style={{ background: C.subtle, borderRadius: 999, height: 5, marginBottom: 8 }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: C.emerald, borderRadius: 999, transition: "width 0.5s ease" }} />
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>Session {sessionInWeek} of 3 this week — any 3 days you train</div>
                <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                  {[{n:1,day:"Run 1",type:"Intervals"},{n:2,day:"Run 2",type:"Zone 2"},{n:3,day:"Run 3",type:"Intervals"}].map(s => {
                    const done = sessionInWeek >= s.n;
                    const next = sessionInWeek === s.n - 1;
                    return (
                      <div key={s.n} style={{ flex: 1, padding: "5px 4px", borderRadius: 8, textAlign: "center", background: done ? C.emeraldDim : next ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)", border: `1px solid ${done ? C.emeraldBorder : next ? C.border : "rgba(255,255,255,0.04)"}` }}>
                        <div style={{ fontSize: 9, fontWeight: 900, color: done ? C.emerald : next ? C.text : C.subtle, letterSpacing: "0.06em" }}>{s.day}</div>
                        <div style={{ fontSize: 9, color: done ? C.emerald : next ? C.muted : C.subtle, marginTop: 1 }}>{s.type}</div>
                        {done && <div style={{ fontSize: 9, color: C.emerald }}>✓</div>}
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {[5, 10, 15, 20, 30].map(t => {
                    const done = unlockedTargets.includes(String(t));
                    const isCurrent = t === (rc.target_km ?? 5);
                    return (
                      <div key={t} style={{ padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 800, border: `1px solid ${isCurrent ? C.emeraldBorder : done ? "rgba(var(--accent-rgb),0.2)" : C.border}`, background: isCurrent ? "rgba(var(--accent-rgb),0.12)" : done ? "rgba(var(--accent-rgb),0.06)" : "rgba(255,255,255,0.02)", color: isCurrent ? C.emerald : done ? C.muted : C.subtle }}>
                        {done ? "✓ " : ""}{t}km
                      </div>
                    );
                  })}
                </div>
              </Glass>
            );
          })()}

          {/* ── Run plan timeline (when Run Coach active) ── */}
          {runCoachActive && (() => {
            const rc = prefs.preferences.run_coach;
            const PROGRAM_WEEKS = { 5: 8, 10: 12, 15: 14, 20: 16, 30: 20 };
            const totalWeeks = PROGRAM_WEEKS[rc.target_km ?? 5] ?? 8;
            const currentWeek = rc.week ?? 1;
            // Generate week bars: planned volume increases roughly linearly
            const weeks = Array.from({ length: totalWeeks }, (_, i) => i + 1);
            return (
              <Glass style={{ padding: 20, marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 14 }}>
                  {rc.target_km}km Plan — {totalWeeks}-Week Progression
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 48, marginBottom: 8 }}>
                  {weeks.map(w => {
                    const volFrac = w / totalWeeks;
                    const barH = Math.max(6, Math.round(volFrac * 44));
                    const isPast = w < currentWeek;
                    const isCurrent = w === currentWeek;
                    return (
                      <div key={w} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                        <div style={{ width: "100%", height: barH, borderRadius: 3, background: isPast ? C.emerald : isCurrent ? `rgba(var(--accent-rgb),0.6)` : C.border, transition: "height 0.3s ease" }} />
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 10, color: C.subtle }}>Week 1</span>
                  <span style={{ fontSize: 10, color: C.subtle }}>Week {totalWeeks}</span>
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: C.emerald }} />
                    <span style={{ fontSize: 11, color: C.muted }}>Completed</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: "rgba(var(--accent-rgb),0.6)" }} />
                    <span style={{ fontSize: 11, color: C.muted }}>Current (Week {currentWeek})</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: C.border }} />
                    <span style={{ fontSize: 11, color: C.muted }}>Upcoming</span>
                  </div>
                </div>
              </Glass>
            );
          })()}

          {/* ── Military coaching insights ── */}
          {sportMode === "military" && (() => {
            const mil = prefs?.preferences?.military_coach ?? {};
            const track = mil.track ?? 'keuring';
            const clusterCurrent = mil.cluster_current ?? (track === 'keuring' ? 0 : 1);
            const clusterTarget = mil.cluster_target ?? clusterCurrent;
            const mode = mil.mode ?? 'target';
            const maxLevel = 6;
            const nextLevel = Math.min(clusterCurrent + 1, maxLevel);
            const CLUSTER_DESC_I = track === 'keuring'
              ? { 0: "Basis", 1: "Entry", 2: "Standard", 3: "Infantry", 4: "Above average", 5: "High performance", 6: "Special forces" }
              : { 1: "Entry", 2: "Standard", 3: "Infantry", 4: "Above average", 5: "High performance", 6: "Advanced" };
            // Cooper test metrics
            const lastCooper = mil.last_cooper_distance_m ?? null;
            const COOPER_THRESHOLDS = [0, 1800, 2000, 2200, 2400, 2600, 2800];
            const cooperLevel = lastCooper
              ? COOPER_THRESHOLDS.reduce((lvl, t, i) => lastCooper >= t ? i : lvl, 0)
              : null;
            const cooperBenchmark = lastCooper
              ? `${lastCooper}m — ${cooperLevel === 0 ? 'Below KB' : milClL(track, cooperLevel)}`
              : null;
            const nextCooperTarget = track === 'keuring' ? (COOPER_THRESHOLDS[nextLevel] ?? null) : null;
            const cooperGap = lastCooper && nextCooperTarget && nextLevel <= maxLevel && clusterCurrent < maxLevel
              ? Math.max(0, nextCooperTarget - lastCooper) : null;
            // March weight metrics
            const ownedWeights = Array.isArray(mil.pack_weights_available_kg) ? mil.pack_weights_available_kg : [];
            const maxOwnedKg = ownedWeights.length > 0 ? Math.max(...ownedWeights) : null;
            const MIL_MARCH_TARGET = { 1: 5, 2: 10, 3: 15, 4: 20, 5: 25, 6: 30 };
            const nextMarchTarget = track === 'keuring' ? (MIL_MARCH_TARGET[nextLevel] ?? null) : null;
            const tips = track === 'keuring' ? [
              mode === 'open'
                ? `Next milestone: ${milClL(track, nextLevel)} — ${CLUSTER_DESC_I[nextLevel] ?? ''}. Cooper target: ≥${nextCooperTarget ?? '?'}m${cooperGap ? `, ${cooperGap}m to go` : ''}.`
                : clusterCurrent < clusterTarget
                  ? `Your Cooper test result determines your ${milClL(track, clusterCurrent)} level. Run 3×12-min efforts per week to build baseline endurance.`
                  : `You're at your target level — keep training consistently to maintain it.`,
              "Strength sessions focus on military compound lifts: push-up, pull-up, dips, and loaded march.",
              clusterCurrent <= 2 ? "At KB–K2: priority is aerobic base — keep heart rate in Zone 2 on duurloop days." :
              clusterCurrent <= 4 ? "At K3–K4: mix interval runs with longer easy runs to build capacity." :
              "At K5–K6: peak performance — taper carefully before your assessment.",
            ] : [
              `Opleiding programme trains all-round fitness. Build strength and running endurance in parallel.`,
              "March sessions develop load-bearing endurance — the pack weight increases progressively.",
              clusterCurrent <= 3 ? "Foundation phase: focus on completing all sessions rather than intensity." : "Progression phase: small weekly volume increases, watch for signs of overload.",
            ];
            const axisScores = progression?.scores_by_mode?.balanced ?? progression?.scores ?? {};
            const sortedAxes = RADAR_AXES.map(a => ({ axis: a, score: Math.round(axisScores[a] ?? 0) })).sort((a, b) => a.score - b.score);
            const weakest = sortedAxes[0];
            return (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", color: C.emerald, textTransform: "uppercase", marginBottom: 12 }}>
                  Coach Insights
                </div>
                <Glass style={{ padding: 20 }}>
                  {(cooperBenchmark || maxOwnedKg !== null) && (
                    <>
                      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                        {/* Cooper test card */}
                        <div style={{ flex: 1, minWidth: 120, padding: "12px 14px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}` }}>
                          <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 6 }}>Cooper test</div>
                          {cooperBenchmark
                            ? <div style={{ fontSize: 15, fontWeight: 900, color: C.text }}>{lastCooper}m <span style={{ fontSize: 11, color: C.muted, fontWeight: 700 }}>{milClL(track, cooperLevel)}</span></div>
                            : <div style={{ fontSize: 13, fontWeight: 700, color: C.subtle }}>No test recorded</div>}
                          {nextCooperTarget && clusterCurrent < maxLevel && (
                            <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                              {milClL(track, nextLevel)} requires ≥{nextCooperTarget}m
                              {cooperGap != null && cooperGap > 0 && <span style={{ color: "#f59e0b", fontWeight: 700 }}> · {cooperGap}m to go</span>}
                              {cooperGap === 0 && <span style={{ color: C.emerald, fontWeight: 700 }}> · achieved</span>}
                            </div>
                          )}
                        </div>
                        {/* March weight card */}
                        <div style={{ flex: 1, minWidth: 120, padding: "12px 14px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}` }}>
                          <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 6 }}>March weight</div>
                          {maxOwnedKg !== null
                            ? <div style={{ fontSize: 15, fontWeight: 900, color: C.text }}>{maxOwnedKg} kg <span style={{ fontSize: 11, color: C.muted, fontWeight: 700 }}>max</span></div>
                            : <div style={{ fontSize: 13, fontWeight: 700, color: C.subtle }}>Not set</div>}
                          {nextMarchTarget && clusterCurrent < maxLevel && (
                            <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                              {milClL(track, nextLevel)} target: {nextMarchTarget} kg
                              {maxOwnedKg !== null && maxOwnedKg >= nextMarchTarget && <span style={{ color: C.emerald, fontWeight: 700 }}> · ready</span>}
                              {maxOwnedKg !== null && maxOwnedKg < nextMarchTarget && <span style={{ color: "#f59e0b", fontWeight: 700 }}> · {nextMarchTarget - maxOwnedKg} kg short</span>}
                            </div>
                          )}
                          {maxOwnedKg === null && <div style={{ fontSize: 11, color: C.subtle, marginTop: 4 }}>Set weights in Settings →</div>}
                        </div>
                      </div>
                      <div style={{ height: 1, background: C.border, marginBottom: 16 }} />
                    </>
                  )}
                  {weakest && (
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: C.emeraldDim, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 15 }}>🎯</div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 900, color: C.text, marginBottom: 1 }}>Priority axis: {RADAR_LABELS[weakest.axis]}</div>
                          <div style={{ fontSize: 11, color: C.muted }}>Score {weakest.score} — the planner is already biasing sessions here.</div>
                        </div>
                      </div>
                      <div style={{ height: 1, background: C.border, marginBottom: 16 }} />
                    </>
                  )}
                  {tips.map((tip, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, marginBottom: i < tips.length - 1 ? 12 : 0 }}>
                      <div style={{ width: 6, height: 6, borderRadius: 3, background: C.emerald, flexShrink: 0, marginTop: 6 }} />
                      <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6, fontWeight: 500 }}>{tip}</div>
                    </div>
                  ))}
                </Glass>
              </div>
            );
          })()}

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

          {/* ── Key insights + planner explanation (general/running/cycling only) ── */}
          {sportMode !== "military" && (progression.insights || (progression.planner_explanation ?? []).length > 0 || (prefs?.preferences?.run_coach?.enrolled && !prefs?.preferences?.run_coach?.completed)) && (
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

                {/* Running Coach insight */}
                {prefs?.preferences?.run_coach?.enrolled && !prefs?.preferences?.run_coach?.completed && (() => {
                  const rc = prefs.preferences.run_coach;
                  const PROGRAM_WEEKS = { 5: 8, 10: 12, 15: 14, 20: 16, 30: 20 };
                  const totalWeeks = PROGRAM_WEEKS[rc.target_km ?? 5] ?? 8;
                  const sessionInWeek = rc.session_in_week ?? 0;
                  const sessionsLeft = 3 - sessionInWeek;
                  const lastRunDate = rc.last_run_at_ms
                    ? new Date(rc.last_run_at_ms).toISOString().slice(0, 10) : null;
                  const todayStr = new Date().toISOString().slice(0, 10);
                  const runReadyToday = (!lastRunDate || lastRunDate < todayStr) && sessionInWeek < 3;
                  return (
                    <>
                      <div style={{ height: 1, background: C.border, margin: "16px 0" }} />
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: C.emeraldDim, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: C.emerald }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 900, color: C.text, marginBottom: 2 }}>
                            Running Coach — {rc.target_km}km, Week {rc.week ?? 1} of {totalWeeks}
                          </div>
                          <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.5 }}>
                            {runReadyToday
                              ? `Run ${sessionInWeek + 1} of 3 this week — warm-up and your ${sessionInWeek === 1 ? "Zone 2 easy run" : "interval run"} are included in today's plan.`
                              : sessionsLeft > 0
                                ? `${sessionsLeft} run${sessionsLeft > 1 ? "s" : ""} left this week — train any day that suits you.`
                                : "Week complete — great work. Your next running week starts when you're ready."}
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}

                {/* Cycling Coach insight */}
                {prefs?.preferences?.cycling_coach?.active && !prefs?.preferences?.cycling_coach?.completed && (() => {
                  const cc = prefs.preferences.cycling_coach;
                  const sessionInWeek = cc.session_in_week ?? 0;
                  const sessionsLeft = 3 - sessionInWeek;
                  // Fixed week structure: session 1=Intervals, 2=Zone 2, 3=Intervals (matches planner R557)
                  const WEEK_PATTERN = ['Intervals', 'Zone 2', 'Intervals'];
                  const nextLabel = WEEK_PATTERN[sessionInWeek] ?? 'Intervals';
                  const unitLabel = cc.unit === 'hr' ? 'heart rate zones' : `FTP ${cc.ftp_watts ?? 200}W`;
                  const insightText = sessionsLeft === 3
                    ? `3 sessions this week — ${WEEK_PATTERN.join(' · ')}.`
                    : sessionsLeft > 0
                    ? `${sessionsLeft} session${sessionsLeft > 1 ? 's' : ''} remaining. Up next: ${nextLabel}.`
                    : 'Week complete — good work. Your next cycling week begins on your next session.';

                  // FTP stale check — recommend retest when ftp_tested_at_ms is null or overdue.
                  // Use today (stable date string, not Date.now()) to keep render pure.
                  const intervalWeeks = cc.ftp_test_interval_weeks ?? 6;
                  const testedAtMs = cc.ftp_tested_at_ms ?? null;
                  const todayMs = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z').getTime();
                  const ftpStale = !testedAtMs || (todayMs - testedAtMs) > intervalWeeks * 7 * 86400000;
                  const weeksAgo = testedAtMs ? Math.floor((todayMs - testedAtMs) / (7 * 86400000)) : null;

                  // PMC data from cyclingPmc state
                  const pmcSeries = cyclingPmc?.series ?? [];
                  const pmcLatest = cyclingPmc?.latest ?? null;
                  const pmcHasData = pmcSeries.length > 0 && pmcLatest;

                  // PMC chart SVG helpers
                  const pmcChartW = 300, pmcChartH = 52;
                  const pmcN = pmcSeries.length;
                  const pmcMaxY = pmcN > 0
                    ? pmcSeries.reduce((m, d) => Math.max(m, d.ctl, d.atl), 10)
                    : 100;
                  const pmcToX = (i) => pmcN > 1 ? (i / (pmcN - 1)) * pmcChartW : pmcChartW / 2;
                  const pmcToY = (v) => pmcChartH - (v / pmcMaxY) * (pmcChartH - 6) - 2;
                  const ctlPts = pmcSeries.map((d, i) => `${pmcToX(i).toFixed(1)},${pmcToY(d.ctl).toFixed(1)}`).join(' ');
                  const atlPts = pmcSeries.map((d, i) => `${pmcToX(i).toFixed(1)},${pmcToY(d.atl).toFixed(1)}`).join(' ');

                  // TSB zone message
                  const tsb = pmcLatest?.tsb ?? null;
                  const tsbMsg = tsb === null ? null
                    : tsb < -25 ? 'Fatigue is high — keep it easy or take a recovery day'
                    : tsb < -10 ? 'Good training load — keep building'
                    : tsb <= 5  ? 'Fresh enough for quality work'
                    : 'Very fresh — good day for a hard session, test, or longer ride';
                  const tsbColor = tsb === null ? C.muted
                    : tsb < -25 ? '#f43f5e'
                    : tsb < -10 ? '#f59e0b'
                    : C.emerald;

                  // FTP sparkline
                  const ftpHistory = cc.ftp_history ?? [];
                  const ftpSparkN = ftpHistory.length;
                  const ftpSparkH = 32, ftpSparkW = 300;
                  const ftpMin = ftpSparkN >= 2 ? ftpHistory.reduce((m, h) => Math.min(m, h.ftp_watts), ftpHistory[0].ftp_watts) : 0;
                  const ftpMax = ftpSparkN >= 2 ? ftpHistory.reduce((m, h) => Math.max(m, h.ftp_watts), ftpHistory[0].ftp_watts) : 1;
                  const ftpRange = ftpMax - ftpMin || 1;
                  const ftpPts = ftpSparkN >= 2
                    ? ftpHistory.map((h, i) => {
                        const x = (i / (ftpSparkN - 1)) * ftpSparkW;
                        const y = ftpSparkH - ((h.ftp_watts - ftpMin) / ftpRange) * (ftpSparkH - 8) - 4;
                        return `${x.toFixed(1)},${y.toFixed(1)}`;
                      }).join(' ')
                    : '';

                  return (
                    <>
                      <div style={{ height: 1, background: C.border, margin: "16px 0" }} />
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: C.emeraldDim, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: C.emerald, fontSize: 18 }}>🚴</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 900, color: C.text, marginBottom: 2 }}>
                            Cycling Coach — Week {cc.week ?? 1} · {unitLabel}
                          </div>
                          <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.5 }}>
                            {insightText}
                          </div>
                          {ftpStale && cc.unit === 'watts' && ftpSnoozedUntil < now && plan?.slot_type !== 'rest' && (
                            <div style={{ marginTop: 8, padding: "10px 12px", borderRadius: 10, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.25)" }}>
                              <div style={{ fontSize: 11, color: "#f59e0b", lineHeight: 1.5, marginBottom: 7 }}>
                                FTP refresh recommended
                                {weeksAgo !== null ? ` — tested ${weeksAgo} week${weeksAgo !== 1 ? 's' : ''} ago` : ' — no test on record'}.
                              </div>
                              <div style={{ display: "flex", gap: 6 }}>
                                <button
                                  onClick={() => setView("settings")}
                                  style={{ padding: "5px 10px", borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: "pointer", background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.35)", color: "#f59e0b" }}
                                >
                                  Go to FTP test
                                </button>
                                <button
                                  onClick={() => { const until = now + 7 * 86400000; const _u = getUserId(); localStorage.setItem(_u ? `jf_ftp_snooze_until_${_u}` : 'jf_ftp_snooze_until', String(until)); setFtpSnoozedUntil(until); }}
                                  style={{ padding: "5px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, color: C.muted }}
                                >
                                  Remind me next week
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* PMC chart — only when cycling TSS data exists */}
                      {pmcHasData && (
                        <div style={{ marginTop: 14 }}>
                          {/* CTL / ATL line chart */}
                          <svg
                            viewBox={`0 0 ${pmcChartW} ${pmcChartH}`}
                            width="100%"
                            height={pmcChartH}
                            style={{ display: "block", overflow: "visible" }}
                          >
                            {/* ATL — amber dashed */}
                            <polyline
                              points={atlPts}
                              fill="none"
                              stroke="#f59e0b"
                              strokeWidth="1.5"
                              strokeDasharray="4 3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            {/* CTL — emerald solid */}
                            <polyline
                              points={ctlPts}
                              fill="none"
                              stroke={C.emerald}
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>

                          {/* Legend */}
                          <div style={{ display: "flex", gap: 12, marginTop: 4, marginBottom: 10 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: C.emerald }}>
                              <svg width="16" height="4"><line x1="0" y1="2" x2="16" y2="2" stroke={C.emerald} strokeWidth="2" strokeLinecap="round" /></svg>
                              CTL fitness
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#f59e0b" }}>
                              <svg width="16" height="4"><line x1="0" y1="2" x2="16" y2="2" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 3" strokeLinecap="round" /></svg>
                              ATL fatigue
                            </div>
                          </div>

                          {/* CTL / ATL / TSB metric pills */}
                          <div style={{ display: "flex", gap: 8 }}>
                            {[
                              { label: 'CTL', value: pmcLatest.ctl, color: C.emerald },
                              { label: 'ATL', value: pmcLatest.atl, color: "#f59e0b" },
                              { label: 'TSB', value: pmcLatest.tsb, color: tsbColor },
                            ].map(({ label, value, color }) => (
                              <div key={label} style={{ flex: 1, background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10, padding: "6px 8px", textAlign: "center" }}>
                                <div style={{ ...eyebrow, fontSize: 9, color: C.muted, marginBottom: 2 }}>{label}</div>
                                <div style={{ ...mono(13), color, fontWeight: 700 }}>{value > 0 ? value.toFixed(0) : value.toFixed(0)}</div>
                              </div>
                            ))}
                          </div>

                          {/* TSB zone message */}
                          {tsbMsg && (
                            <div style={{ marginTop: 8, fontSize: 11, color: tsbColor, lineHeight: 1.5 }}>
                              {tsbMsg}
                              {cyclingPmc?.hasEstimated && (
                                <span style={{ color: C.muted }}> · ~est.</span>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* FTP history sparkline — only when >= 2 tests recorded */}
                      {ftpSparkN >= 2 && (
                        <div style={{ marginTop: 14 }}>
                          <div style={{ ...eyebrow, fontSize: 9, color: C.muted, marginBottom: 6 }}>FTP PROGRESS</div>
                          <svg
                            viewBox={`0 0 ${ftpSparkW} ${ftpSparkH}`}
                            width="100%"
                            height={ftpSparkH}
                            style={{ display: "block", overflow: "visible" }}
                          >
                            <polyline
                              points={ftpPts}
                              fill="none"
                              stroke={C.emerald}
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            {/* Dots at each test */}
                            {ftpHistory.map((h, i) => {
                              const x = (i / (ftpSparkN - 1)) * ftpSparkW;
                              const y = ftpSparkH - ((h.ftp_watts - ftpMin) / ftpRange) * (ftpSparkH - 8) - 4;
                              return <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r="3" fill={C.emerald} />;
                            })}
                          </svg>
                          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
                            <div style={{ fontSize: 10, color: C.muted }}>{ftpHistory[0].ftp_watts}W</div>
                            <div style={{ ...mono(11), color: C.emerald, fontWeight: 700 }}>{ftpHistory[ftpSparkN - 1].ftp_watts}W current</div>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
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

          {/* ── Recent sessions ── */}
          {history.filter(e => e.status === "completed").slice(0, 3).length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ ...eyebrow, color: C.faint, fontSize: 9.5, marginBottom: 12 }}>RECENT SESSIONS</div>
              <Glass style={{ padding: "4px 0" }}>
                {history.filter(e => e.status === "completed").slice(0, 3).map((ex, i, arr) => {
                  const mins = ex.total_duration_sec ? Math.round(ex.total_duration_sec / 60) : null;
                  const pe = ex.perceived_exertion;
                  const peIcon = pe === 3 ? "💪" : pe === 8 ? "😰" : "😌";
                  const dateStr = new Date(ex.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                  return (
                    <div key={ex.id} style={{ padding: "12px 0", margin: "0 16px", display: "flex", alignItems: "center", gap: 12, borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: C.bgCard2, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16 }}>
                        {pe ? peIcon : "🏋️"}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ ...eyebrow, color: C.mutedStrong, fontSize: 10 }}>{dateStr}</div>
                        {mins && <div style={{ ...mono(12), color: C.text, marginTop: 2 }}>{mins} min</div>}
                      </div>
                      <div style={{ ...eyebrow, fontSize: 9, color: ex.execution_type === "bonus" ? C.emerald : C.faint }}>
                        {ex.execution_type === "bonus" ? "BONUS" : "MAIN"}
                      </div>
                    </div>
                  );
                })}
              </Glass>
            </div>
          )}

          {/* ── Awards entry point ── */}
          <button
            onClick={() => setView("awards")}
            style={{ width: "100%", marginBottom: 20, padding: "14px 20px", borderRadius: 14, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.03)", color: C.muted, fontWeight: 700, fontSize: 14, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between" }}
          >
            <span>Awards & milestones</span>
            <span style={{ color: C.muted, fontSize: 18 }}>›</span>
          </button>

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