// ─── Lazy-loaded chunk — not on the critical path ─────────────────────────────
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

export default function AwardsView({ history, score, isPro, progression, runUnlocked = [] }) {
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
    // ── Sessions ─────────────────────────────────────────────────────────────
    { cat: "Sessions", id: "genesis",      title: "Genesis",           desc: "You showed up. That's how every journey begins.",                            icon: "bolt",     unlocked: n >= 1,           req: "1 session" },
    { cat: "Sessions", id: "habit",        title: "The Habit",          desc: "Three sessions done. Something is starting to stick.",                       icon: "flame",    unlocked: n >= 3,           req: "3 sessions" },
    { cat: "Sessions", id: "seven",        title: "Full Rotation",      desc: "Seven sessions. You've been through a full week's worth of effort.",        icon: "trophy",   unlocked: n >= 7,           req: "7 sessions" },
    { cat: "Sessions", id: "steady",       title: "Steady",             desc: "Ten sessions in. You're building something real.",                           icon: "mountain", unlocked: n >= 10,          req: "10 sessions" },
    { cat: "Sessions", id: "committed",    title: "Committed",          desc: "Twenty-five sessions. This is who you are now.",                            icon: "lift",     unlocked: n >= 25,          req: "25 sessions" },
    { cat: "Sessions", id: "half_century", title: "Half Century",       desc: "Fifty sessions. You've done the work most people only talk about.",         icon: "compass",  unlocked: n >= 50,          req: "50 sessions" },
    { cat: "Sessions", id: "centurion",    title: "Centurion",          desc: "One hundred sessions. You are the consistency.",                            icon: "trophy",   unlocked: n >= 100,         req: "100 sessions" },
    // ── Consistency ───────────────────────────────────────────────────────────
    { cat: "Consistency", id: "momentum",     title: "Momentum",           desc: "Consistency score above 50. The engine is running.",                        icon: "chart",    unlocked: score >= 50,      req: "Score 50+" },
    { cat: "Consistency", id: "in_the_zone",  title: "In The Zone",        desc: "Consistency score above 70. You've found your rhythm.",                   icon: "compass",  unlocked: score >= 70,      req: "Score 70+" },
    { cat: "Consistency", id: "iron_will",    title: "Iron Will",          desc: "Score of 80 or higher. You're in rare company.",                            icon: "shield",   unlocked: score >= 80,      req: "Score 80+" },
    { cat: "Consistency", id: "top_tier",     title: "Top Tier",           desc: "Score above 90. Elite consistency, full stop.",                             icon: "spark",    unlocked: score >= 90,      req: "Score 90+" },
    { cat: "Consistency", id: "king",         title: "Consistency King",   desc: "The perfect score of 100. Nothing left to prove.",                          icon: "crown",    unlocked: score >= 100,     req: "Score 100" },
    // ── Effort ───────────────────────────────────────────────────────────────
    { cat: "Effort", id: "comeback",         title: "The Comeback",      desc: "Came back after a week away. Starting over takes guts.",               icon: "refresh",  unlocked: hasComeback,        req: "Return after 7+ day gap" },
    { cat: "Effort", id: "pushed_through",   title: "Pushed Through",    desc: "Three hard sessions rated 'too hard' — and you still finished.",       icon: "mountain", unlocked: hardSessions >= 3,  req: "3 tough sessions" },
    { cat: "Effort", id: "smooth_operator",  title: "Smooth Operator",   desc: "Five sessions where you made it look easy.",                            icon: "check",    unlocked: easySessions >= 5,  req: "5 easy sessions" },
    // ── Progression ──────────────────────────────────────────────────────────
    { cat: "Progression", id: "prog_first",     title: "First Profile",     desc: "Your training profile has been built. The system now knows you.",        icon: "compass",  unlocked: !!progression,      req: "Build a training profile" },
    { cat: "Progression", id: "prog_goal_fit", title: "Goal Seeker", desc: "Your profile matches your goal by 50% or more. The plan is working.", icon: "target", unlocked: (progression?.goal_fit ?? 0) >= 50, req: "Goal fit ≥ 50%" },
    { cat: "Progression", id: "prog_aligned",  title: "Aligned",     desc: "80% goal fit achieved. Your training is precisely dialled in.",       icon: "spark",  unlocked: (progression?.goal_fit ?? 0) >= 80, req: "Goal fit ≥ 80%" },
    {
      cat: "Progression", id: "prog_rising",    title: "Rising",             desc: "At least one axis has climbed above a score of 35. Growth is real.",   icon: "chart",
      unlocked: (() => { const bal = progression?.scores_by_mode?.balanced; return bal ? Object.values(bal).some(v => v >= 35) : false; })(),
      req: "Any axis score ≥ 35",
    },
    {
      cat: "Progression", id: "prog_milestone", title: "Axis Milestone",     desc: "One of your body axes has crossed 50. You're building real capacity.", icon: "shield",
      unlocked: (() => { const bal = progression?.scores_by_mode?.balanced; return bal ? Object.values(bal).some(v => v >= 50) : false; })(),
      req: "Any axis score ≥ 50",
    },
    {
      cat: "Progression", id: "prog_peak",      title: "Peak Performer",     desc: "A score of 75 on at least one axis. Elite level reached.",             icon: "mountain",
      unlocked: (() => { const bal = progression?.scores_by_mode?.balanced; return bal ? Object.values(bal).some(v => v >= 75) : false; })(),
      req: "Any axis score ≥ 75",
    },
    // ── Running ───────────────────────────────────────────────────────────────
    { cat: "Running", id: "run_5k",    title: "First 5K",       desc: "You ran your first 5 kilometres. A real milestone — most people never start.",         icon: "run", unlocked: runUnlocked.includes(5),  req: "Complete 5K run program" },
    { cat: "Running", id: "run_10k",   title: "10K Runner",     desc: "Double digits. Ten kilometres under your belt and a whole new aerobic level.",         icon: "run", unlocked: runUnlocked.includes(10), req: "Complete 10K run program" },
    { cat: "Running", id: "run_15k",   title: "Beyond 10K",     desc: "Fifteen kilometres. You've left the beginner category behind for good.",               icon: "run", unlocked: runUnlocked.includes(15), req: "Complete 15K run program" },
    { cat: "Running", id: "run_hm",    title: "Half the Way",   desc: "Twenty kilometres. Half-marathon territory — you can call yourself a distance runner.", icon: "run", unlocked: runUnlocked.includes(20), req: "Complete 20K run program" },
    { cat: "Running", id: "run_30k",   title: "Distance Runner", desc: "Thirty kilometres. You've entered the long-distance category. Respect.",              icon: "run", unlocked: runUnlocked.includes(30), req: "Complete 30K run program" },
    // ── Session type ──────────────────────────────────────────────────────────
    { cat: "Session type", id: "bonus_first",  title: "Extra Credit",       desc: "You already completed today's session — and came back for more.",         icon: "plus",     unlocked: bonusSessions >= 1, req: "1 bonus session" },
    { cat: "Session type", id: "bonus_five",   title: "Overachiever",       desc: "Five bonus sessions. You consistently go beyond what's asked.",           icon: "bolt",     unlocked: bonusSessions >= 5, req: "5 bonus sessions" },
    { cat: "Session type", id: "long_haul",    title: "Long Haul",          desc: "Thirty minutes or more in a single session. You went the distance.",      icon: "clock",    unlocked: longSessions >= 1,  req: "1 session ≥ 30 min" },
    { cat: "Session type", id: "long_hauler",  title: "Long Hauler",        desc: "Five sessions over 30 minutes. You love the long game.",                  icon: "lift",     unlocked: longSessions >= 5,  req: "5 sessions ≥ 30 min" },
    { cat: "Session type", id: "micro_first",  title: "Quick Win",          desc: "Knocked out a session in under 15 minutes. Every minute counts.",         icon: "clock",    unlocked: microSessions >= 1, req: "1 micro session" },
    { cat: "Session type", id: "micro_master", title: "Micro Master",       desc: "Five micro sessions done. Short and sharp is a superpower.",              icon: "clock",    unlocked: microSessions >= 5, req: "5 micro sessions" },
    // ── Streak ───────────────────────────────────────────────────────────────
    { cat: "Streak", id: "week_streak",  title: "Seven Days",         desc: "Active 7 days in a row. Habit unlocked.",                                   icon: "calendar", unlocked: maxStreak >= 7,   req: "7-day streak" },
    { cat: "Streak", id: "fortnight",    title: "Two Week Warrior",   desc: "Fourteen consecutive active days. You don't do 'off days'.",                icon: "shield",   unlocked: maxStreak >= 14,  req: "14-day streak" },
    { cat: "Streak", id: "month_strong", title: "Month Strong",       desc: "Thirty days straight. A whole month of showing up.",                       icon: "calendar", unlocked: maxStreak >= 30,  req: "30-day streak" },
    { cat: "Streak", id: "perfect_week", title: "Perfect Week",       desc: "Five or more active days in a single week. Textbook consistency.",         icon: "check",    unlocked: perfectWeeks >= 1, req: "5 days in one week" },
    // ── Special ───────────────────────────────────────────────────────────────
    { cat: "Special", id: "pro", title: "Pro Status", desc: "Unlock the full JustFit adaptive engine.", icon: "spark", unlocked: isPro, req: "Pro active" },
  ];
  // Sort: unlocked first, then by category A-Z, then by title A-Z
  awards.sort((a, b) => {
    if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
    if (a.cat !== b.cat) return a.cat.localeCompare(b.cat);
    return a.title.localeCompare(b.title);
  });
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
            <div style={{ width: 56, height: 56, borderRadius: 16, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: a.unlocked ? C.emeraldDim : "rgba(255,255,255,0.04)" }}>
              {(() => { const Ic = Icons[a.icon] || Icons.spark; return a.unlocked ? <Ic size={26} c={C.emerald} /> : <Icons.lock size={22} c={C.muted} />; })()}
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
