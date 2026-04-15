// ─── Lazy-loaded chunk — not on the critical path ─────────────────────────────
// Design tokens and Glass are inlined here so this chunk has zero shared deps.

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

export default function AwardsView({ history, score, isPro, progression }) {
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
  const hardSessions   = history.filter((h) => h.perceived_exertion === 8).length;
  const easySessions   = history.filter((h) => h.perceived_exertion === 3).length;
  const bonusSessions  = history.filter((h) => h.execution_type === "bonus").length;
  const longSessions   = history.filter((h) => (h.total_duration_sec ?? 0) >= 1800).length; // ≥30 min
  const microSessions  = history.filter((h) => (h.total_duration_sec ?? 0) > 0 && (h.total_duration_sec ?? 0) < 900).length; // <15 min
  const hasComeback = (() => {
    for (let i = 1; i < dates.length; i++) {
      const gap = (new Date(dates[i]) - new Date(dates[i - 1])) / 86400000;
      if (gap >= 7) return true;
    }
    return false;
  })();
  const perfectWeeks = (() => {
    const weekSets = {};
    dates.forEach((d) => {
      const dt = new Date(d);
      const mon = new Date(dt);
      mon.setDate(dt.getDate() - ((dt.getDay() + 6) % 7));
      const key = mon.toISOString().slice(0, 10);
      weekSets[key] = (weekSets[key] || new Set());
      weekSets[key].add(d);
    });
    return Object.values(weekSets).filter((s) => s.size >= 5).length;
  })();

  const awards = [
    // ── First steps ──────────────────────────────────────────────────────────
    { id: "genesis",      title: "Genesis",           desc: "You showed up. That's how every journey begins.",                            icon: "⚡",  unlocked: n >= 1,           req: "1 session" },
    { id: "habit",        title: "The Habit",          desc: "Three sessions done. Something is starting to stick.",                       icon: "🔥",  unlocked: n >= 3,           req: "3 sessions" },
    { id: "seven",        title: "Full Rotation",      desc: "Seven sessions. You've been through a full week's worth of effort.",        icon: "🏅",  unlocked: n >= 7,           req: "7 sessions" },
    { id: "steady",       title: "Steady",             desc: "Ten sessions in. You're building something real.",                           icon: "🪨",  unlocked: n >= 10,          req: "10 sessions" },
    { id: "committed",    title: "Committed",          desc: "Twenty-five sessions. This is who you are now.",                            icon: "💪",  unlocked: n >= 25,          req: "25 sessions" },
    { id: "half_century", title: "Half Century",       desc: "Fifty sessions. You've done the work most people only talk about.",         icon: "🎯",  unlocked: n >= 50,          req: "50 sessions" },
    { id: "centurion",    title: "Centurion",          desc: "One hundred sessions. You are the consistency.",                            icon: "🏆",  unlocked: n >= 100,         req: "100 sessions" },
    // ── Consistency score ─────────────────────────────────────────────────────
    { id: "momentum",     title: "Momentum",           desc: "Consistency score above 50. The engine is running.",                        icon: "📈",  unlocked: score >= 50,      req: "Score 50+" },
    { id: "iron_will",    title: "Iron Will",          desc: "Score of 80 or higher. You're in rare company.",                            icon: "🧲",  unlocked: score >= 80,      req: "Score 80+" },
    { id: "top_tier",     title: "Top Tier",           desc: "Score above 90. Elite consistency, full stop.",                             icon: "🌟",  unlocked: score >= 90,      req: "Score 90+" },
    { id: "king",         title: "Consistency King",   desc: "The perfect score of 100. Nothing left to prove.",                          icon: "👑",  unlocked: score >= 100,     req: "Score 100" },
    // ── Streaks ───────────────────────────────────────────────────────────────
    { id: "week_streak",  title: "Seven Days",         desc: "Active 7 days in a row. Habit unlocked.",                                   icon: "📅",  unlocked: maxStreak >= 7,   req: "7-day streak" },
    { id: "fortnight",    title: "Two Week Warrior",   desc: "Fourteen consecutive active days. You don't do 'off days'.",                icon: "⚔️", unlocked: maxStreak >= 14,  req: "14-day streak" },
    { id: "month_strong", title: "Month Strong",       desc: "Thirty days straight. A whole month of showing up.",                       icon: "🗓️", unlocked: maxStreak >= 30,  req: "30-day streak" },
    { id: "perfect_week", title: "Perfect Week",       desc: "Five or more active days in a single week. Textbook consistency.",         icon: "✅",  unlocked: perfectWeeks >= 1, req: "5 days in one week" },
    // ── Effort & attitude ─────────────────────────────────────────────────────
    { id: "pushed_through",   title: "Pushed Through",    desc: "Three hard sessions rated 'too hard' — and you still finished.",       icon: "😤",  unlocked: hardSessions >= 3,  req: "3 tough sessions" },
    { id: "smooth_operator",  title: "Smooth Operator",   desc: "Five sessions where you made it look easy.",                            icon: "😎",  unlocked: easySessions >= 5,  req: "5 easy sessions" },
    { id: "comeback",         title: "The Comeback",      desc: "Came back after a week away. Starting over takes guts.",               icon: "🔄",  unlocked: hasComeback,        req: "Return after 7+ day gap" },
    // ── Session types ─────────────────────────────────────────────────────────
    { id: "micro_first",  title: "Quick Win",          desc: "Knocked out a session in under 15 minutes. Every minute counts.",         icon: "⏱️", unlocked: microSessions >= 1, req: "1 micro session" },
    { id: "micro_master", title: "Micro Master",       desc: "Five micro sessions done. Short and sharp is a superpower.",              icon: "🕐",  unlocked: microSessions >= 5, req: "5 micro sessions" },
    { id: "long_haul",    title: "Long Haul",          desc: "Thirty minutes or more in a single session. You went the distance.",      icon: "⌛",  unlocked: longSessions >= 1,  req: "1 session ≥ 30 min" },
    { id: "bonus_first",  title: "Extra Credit",       desc: "You already completed today's session — and came back for more.",         icon: "➕",  unlocked: bonusSessions >= 1, req: "1 bonus session" },
    { id: "bonus_five",   title: "Overachiever",       desc: "Five bonus sessions. You consistently go beyond what's asked.",           icon: "🚀",  unlocked: bonusSessions >= 5, req: "5 bonus sessions" },
    { id: "long_hauler",  title: "Long Hauler",        desc: "Five sessions over 30 minutes. You love the long game.",                  icon: "🏋️", unlocked: longSessions >= 5,  req: "5 sessions ≥ 30 min" },
    // ── Score tiers ───────────────────────────────────────────────────────────
    { id: "in_the_zone",  title: "In The Zone",        desc: "Consistency score above 70. You've found your rhythm.",                   icon: "🎯",  unlocked: score >= 70,        req: "Score 70+" },
    // ── Progression profile ───────────────────────────────────────────────────
    {
      id: "prog_first",     title: "First Profile",     desc: "Your training profile has been built. The system now knows you.",        icon: "🧬",  unlocked: !!progression,      req: "Build a training profile",
    },
    {
      id: "prog_rising",    title: "Rising",             desc: "At least one axis has climbed above a score of 35. Growth is real.",   icon: "📊",
      unlocked: (() => { const bal = progression?.scores_by_mode?.balanced; return bal ? Object.values(bal).some(v => v >= 35) : false; })(),
      req: "Any axis score ≥ 35",
    },
    {
      id: "prog_milestone", title: "Axis Milestone",     desc: "One of your body axes has crossed 50. You're building real capacity.", icon: "🎖️",
      unlocked: (() => { const bal = progression?.scores_by_mode?.balanced; return bal ? Object.values(bal).some(v => v >= 50) : false; })(),
      req: "Any axis score ≥ 50",
    },
    {
      id: "prog_peak",      title: "Peak Performer",     desc: "A score of 75 on at least one axis. Elite level reached.",             icon: "🏔️",
      unlocked: (() => { const bal = progression?.scores_by_mode?.balanced; return bal ? Object.values(bal).some(v => v >= 75) : false; })(),
      req: "Any axis score ≥ 75",
    },
    { id: "prog_goal_fit", title: "Goal Seeker", desc: "Your profile matches your goal by 50% or more. The plan is working.", icon: "🎯", unlocked: (progression?.goal_fit ?? 0) >= 50, req: "Goal fit ≥ 50%" },
    { id: "prog_aligned",  title: "Aligned",     desc: "80% goal fit achieved. Your training is precisely dialled in.",       icon: "🔮", unlocked: (progression?.goal_fit ?? 0) >= 80, req: "Goal fit ≥ 80%" },
    // ── Special ───────────────────────────────────────────────────────────────
    { id: "pro", title: "Pro Status", desc: "Unlock the full JustFit adaptive engine.", icon: "⭐", unlocked: isPro, req: "Pro active" },
  ];
  const total = awards.filter((a) => a.unlocked).length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 36, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 36, fontWeight: 900, color: C.text, letterSpacing: "-0.03em" }}>Hall of Fame</h1>
          <p style={{ fontSize: 14, color: C.muted, marginTop: 6 }}>Earn your place among the elite consistent.</p>
        </div>
        <Glass style={{ padding: "16px 22px", display: "flex", alignItems: "center", gap: 20, minWidth: 220 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", color: C.emerald, textTransform: "uppercase", marginBottom: 8 }}>
              {total}/{awards.length} collected
            </div>
            <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", background: C.emerald, borderRadius: 3, width: `${(total / awards.length) * 100}%`, transition: "width 1s" }} />
            </div>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: C.emeraldDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🏆</div>
        </Glass>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
        {awards.map((a) => (
          <Glass
            key={a.id}
            style={{ padding: 24, display: "flex", gap: 16, position: "relative", overflow: "hidden",
              opacity: a.unlocked ? 1 : 0.45, filter: a.unlocked ? "none" : "grayscale(0.8)",
              border: a.unlocked ? `1px solid ${C.emeraldBorder}` : `1px solid ${C.border}` }}
          >
            <div style={{ width: 56, height: 56, borderRadius: 16, flexShrink: 0, fontSize: 26,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: a.unlocked ? C.emeraldDim : "rgba(255,255,255,0.04)" }}>
              {a.unlocked ? a.icon : "🔒"}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: a.unlocked ? C.text : C.muted, marginBottom: 4 }}>{a.title}</div>
              <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, marginBottom: 10 }}>{a.desc}</p>
              <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase",
                padding: "4px 10px", borderRadius: 8,
                background: a.unlocked ? C.emeraldDim : "rgba(255,255,255,0.04)",
                color: a.unlocked ? C.emerald : C.muted }}>
                {a.unlocked ? "Unlocked" : a.req}
              </span>
            </div>
          </Glass>
        ))}
      </div>
    </div>
  );
}
