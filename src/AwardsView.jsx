// ─── Lazy-loaded chunk — not on the critical path ─────────────────────────────
import { useState } from "react";
import { Icons } from "./icons.jsx";

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

// ── Award row component ───────────────────────────────────────────────────────
function AwardRow({ award, state, first }) {
  const Ic = Icons[award.icon] || Icons.spark;
  const iconWrap = {
    earned: { width: 40, height: 40, display: "grid", placeItems: "center", borderRadius: 12, background: "var(--accent-dim)", border: "1px solid var(--accent-border)", flexShrink: 0 },
    next:   { width: 40, height: 40, display: "grid", placeItems: "center", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 },
    locked: { width: 40, height: 40, display: "grid", placeItems: "center", borderRadius: 12, background: "transparent", border: "1px dashed #334155", flexShrink: 0 },
  };
  return (
    <div style={{ display: "grid", gridTemplateColumns: "40px 1fr", gap: 14, padding: "14px 16px", borderTop: first ? "none" : "1px solid rgba(255,255,255,0.08)", alignItems: "center" }}>
      <div style={iconWrap[state]}>
        {state === "earned" ? <Ic size={20} c="var(--accent)" /> : state === "next" ? <Ic size={20} c="#64748b" /> : <Icons.lock size={16} c="#334155" />}
      </div>
      <div>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 17, fontWeight: 900, lineHeight: 1.1, textTransform: "uppercase", color: state === "locked" ? "#334155" : "#f8fafc" }}>{award.title}</div>
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>
          {state === "earned" && "Earned"}
          {state === "next" && (award.deltaText ? `${award.deltaText} to go` : award.req)}
          {state === "locked" && award.req}
        </div>
      </div>
    </div>
  );
}

export default function AwardsView({ history, score, isPro, progression, runUnlocked = [] }) {
  const [showHorizon, setShowHorizon] = useState(false);
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
  const hardSessions  = history.filter((h) => h.perceived_exertion === 8).length;
  const easySessions  = history.filter((h) => h.perceived_exertion === 3).length;
  const bonusSessions = history.filter((h) => h.execution_type === "bonus").length;
  const longSessions  = history.filter((h) => (h.total_duration_sec ?? 0) >= 1800).length;
  const microSessions = history.filter((h) => (h.total_duration_sec ?? 0) > 0 && (h.total_duration_sec ?? 0) < 900).length;
  const hasComeback = (() => {
    for (let i = 1; i < dates.length; i++) {
      if ((new Date(dates[i]) - new Date(dates[i - 1])) / 86400000 >= 7) return true;
    }
    return false;
  })();
  const perfectWeeks = (() => {
    const weekSets = {};
    dates.forEach((d) => {
      const dt = new Date(d), mon = new Date(dt);
      mon.setDate(dt.getDate() - ((dt.getDay() + 6) % 7));
      const key = mon.toISOString().slice(0, 10);
      weekSets[key] = weekSets[key] || new Set();
      weekSets[key].add(d);
    });
    return Object.values(weekSets).filter((s) => s.size >= 5).length;
  })();
  const maxAxis = (() => {
    const bal = progression?.scores_by_mode?.balanced;
    return bal ? Math.max(...Object.values(bal)) : 0;
  })();

  const d = (v, t, unit) => ({ delta: Math.max(0, t - v), deltaText: `${Math.max(0, t - v)} ${unit}` });

  const awards = [
    // ── Sessions ──
    { cat: "Sessions", id: "genesis",      title: "Genesis",          icon: "bolt",     unlocked: n >= 1,           req: "1 session",          ...d(n, 1, "session") },
    { cat: "Sessions", id: "habit",        title: "The Habit",        icon: "flame",    unlocked: n >= 3,           req: "3 sessions",         ...d(n, 3, "sessions") },
    { cat: "Sessions", id: "seven",        title: "Full Rotation",    icon: "trophy",   unlocked: n >= 7,           req: "7 sessions",         ...d(n, 7, "sessions") },
    { cat: "Sessions", id: "steady",       title: "Steady",           icon: "mountain", unlocked: n >= 10,          req: "10 sessions",        ...d(n, 10, "sessions") },
    { cat: "Sessions", id: "committed",    title: "Committed",        icon: "lift",     unlocked: n >= 25,          req: "25 sessions",        ...d(n, 25, "sessions") },
    { cat: "Sessions", id: "half_century", title: "Half Century",     icon: "compass",  unlocked: n >= 50,          req: "50 sessions",        ...d(n, 50, "sessions") },
    { cat: "Sessions", id: "centurion",    title: "Centurion",        icon: "trophy",   unlocked: n >= 100,         req: "100 sessions",       ...d(n, 100, "sessions") },
    // ── Consistency ──
    { cat: "Consistency", id: "momentum",    title: "Momentum",         icon: "chart",   unlocked: score >= 50,  req: "Score 50+",  ...d(score, 50,  "pts") },
    { cat: "Consistency", id: "in_the_zone", title: "In The Zone",      icon: "compass", unlocked: score >= 70,  req: "Score 70+",  ...d(score, 70,  "pts") },
    { cat: "Consistency", id: "iron_will",   title: "Iron Will",        icon: "shield",  unlocked: score >= 80,  req: "Score 80+",  ...d(score, 80,  "pts") },
    { cat: "Consistency", id: "top_tier",    title: "Top Tier",         icon: "spark",   unlocked: score >= 90,  req: "Score 90+",  ...d(score, 90,  "pts") },
    { cat: "Consistency", id: "king",        title: "Consistency King", icon: "crown",   unlocked: score >= 100, req: "Score 100",  ...d(score, 100, "pts") },
    // ── Effort ──
    { cat: "Effort", id: "comeback",        title: "The Comeback",   icon: "refresh",  unlocked: hasComeback,       req: "Return after 7+ day gap",   delta: null, deltaText: null },
    { cat: "Effort", id: "pushed_through",  title: "Pushed Through", icon: "mountain", unlocked: hardSessions >= 3, req: "3 tough sessions",          ...d(hardSessions, 3, "tough sessions") },
    { cat: "Effort", id: "smooth_operator", title: "Smooth Operator",icon: "check",    unlocked: easySessions >= 5, req: "5 easy sessions",           ...d(easySessions, 5, "easy sessions") },
    // ── Progression ──
    { cat: "Progression", id: "prog_first",     title: "First Profile",  icon: "compass",  unlocked: !!progression,                        req: "Build a training profile",  delta: null, deltaText: null },
    { cat: "Progression", id: "prog_goal_fit",  title: "Goal Seeker",    icon: "target",   unlocked: (progression?.goal_fit ?? 0) >= 50,   req: "Goal fit ≥ 50%",            ...d(progression?.goal_fit ?? 0, 50,  "pts goal fit") },
    { cat: "Progression", id: "prog_aligned",   title: "Aligned",        icon: "spark",    unlocked: (progression?.goal_fit ?? 0) >= 80,   req: "Goal fit ≥ 80%",            ...d(progression?.goal_fit ?? 0, 80,  "pts goal fit") },
    { cat: "Progression", id: "prog_rising",    title: "Rising",         icon: "chart",    unlocked: maxAxis >= 35,                         req: "Any axis score ≥ 35",       ...d(maxAxis, 35, "pts on best axis") },
    { cat: "Progression", id: "prog_milestone", title: "Axis Milestone", icon: "shield",   unlocked: maxAxis >= 50,                         req: "Any axis score ≥ 50",       ...d(maxAxis, 50, "pts on best axis") },
    { cat: "Progression", id: "prog_peak",      title: "Peak Performer", icon: "mountain", unlocked: maxAxis >= 75,                         req: "Any axis score ≥ 75",       ...d(maxAxis, 75, "pts on best axis") },
    // ── Running ──
    { cat: "Running", id: "run_5k",    title: "First 5K",        icon: "run", unlocked: runUnlocked.includes(5),  req: "Complete 5K run program",    delta: null, deltaText: null },
    { cat: "Running", id: "run_10k",   title: "10K Runner",      icon: "run", unlocked: runUnlocked.includes(10), req: "Complete 10K run program",   delta: null, deltaText: null },
    { cat: "Running", id: "run_15k",   title: "Beyond 10K",      icon: "run", unlocked: runUnlocked.includes(15), req: "Complete 15K run program",   delta: null, deltaText: null },
    { cat: "Running", id: "run_hm",    title: "Half the Way",    icon: "run", unlocked: runUnlocked.includes(20), req: "Complete 20K run program",   delta: null, deltaText: null },
    { cat: "Running", id: "run_30k",   title: "Distance Runner", icon: "run", unlocked: runUnlocked.includes(30), req: "Complete 30K run program",   delta: null, deltaText: null },
    // ── Session type ──
    { cat: "Session type", id: "bonus_first",  title: "Extra Credit",  icon: "plus",  unlocked: bonusSessions >= 1, req: "1 bonus session",    ...d(bonusSessions, 1, "bonus session") },
    { cat: "Session type", id: "bonus_five",   title: "Overachiever",  icon: "bolt",  unlocked: bonusSessions >= 5, req: "5 bonus sessions",   ...d(bonusSessions, 5, "bonus sessions") },
    { cat: "Session type", id: "long_haul",    title: "Long Haul",     icon: "clock", unlocked: longSessions >= 1,  req: "1 session ≥ 30 min", ...d(longSessions, 1, "long session") },
    { cat: "Session type", id: "long_hauler",  title: "Long Hauler",   icon: "lift",  unlocked: longSessions >= 5,  req: "5 sessions ≥ 30 min",...d(longSessions, 5, "long sessions") },
    { cat: "Session type", id: "micro_first",  title: "Quick Win",     icon: "clock", unlocked: microSessions >= 1, req: "1 micro session",    ...d(microSessions, 1, "micro session") },
    { cat: "Session type", id: "micro_master", title: "Micro Master",  icon: "clock", unlocked: microSessions >= 5, req: "5 micro sessions",   ...d(microSessions, 5, "micro sessions") },
    // ── Streak ──
    { cat: "Streak", id: "week_streak",  title: "Seven Days",       icon: "calendar", unlocked: maxStreak >= 7,   req: "7-day streak",          ...d(maxStreak, 7,  "days in a row") },
    { cat: "Streak", id: "fortnight",    title: "Two Week Warrior", icon: "shield",   unlocked: maxStreak >= 14,  req: "14-day streak",         ...d(maxStreak, 14, "days in a row") },
    { cat: "Streak", id: "month_strong", title: "Month Strong",     icon: "calendar", unlocked: maxStreak >= 30,  req: "30-day streak",         ...d(maxStreak, 30, "days in a row") },
    { cat: "Streak", id: "perfect_week", title: "Perfect Week",     icon: "check",    unlocked: perfectWeeks >= 1,req: "5 days in one week",    ...d(perfectWeeks, 1, "perfect week") },
    // ── Special ──
    { cat: "Special", id: "pro", title: "Pro Status", icon: "spark", unlocked: isPro, req: "Pro active", delta: null, deltaText: null },
  ];

  const earned  = awards.filter(a => a.unlocked);
  const locked  = awards.filter(a => !a.unlocked);
  const nextUp  = [...locked].filter(a => a.delta !== null).sort((a, b) => a.delta - b.delta).slice(0, 3);
  const nextIds = new Set(nextUp.map(a => a.id));
  const horizon = locked.filter(a => !nextIds.has(a.id));

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.14em", color: C.muted, textTransform: "uppercase", marginBottom: 8 }}>Trophy Room</div>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 900, color: C.text, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
          Showing up,<br />quietly.
        </div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 8 }}>{earned.length} of {awards.length} earned</div>
      </div>

      {/* ── Earned ── */}
      {earned.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: "0.06em", marginBottom: 6 }}>Earned · {earned.length}</div>
          <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
            {earned.map((a, i) => <AwardRow key={a.id} award={a} state="earned" first={i === 0} />)}
          </div>
        </div>
      )}

      {/* ── Next up ── */}
      {nextUp.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: "0.06em", marginBottom: 6 }}>Next up · {nextUp.length}</div>
          <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
            {nextUp.map((a, i) => <AwardRow key={a.id} award={a} state="next" first={i === 0} />)}
          </div>
        </div>
      )}

      {/* ── Far horizon ── */}
      {horizon.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: "0.06em" }}>Far horizon · {horizon.length} hidden</div>
            <button onClick={() => setShowHorizon(s => !s)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, color: C.emerald, fontFamily: "inherit", padding: 0 }}>
              {showHorizon ? "Hide" : "Reveal all"}
            </button>
          </div>
          {showHorizon && (
            <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", opacity: 0.45 }}>
              {horizon.map((a, i) => <AwardRow key={a.id} award={a} state="locked" first={i === 0} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
