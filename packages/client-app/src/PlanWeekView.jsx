import { useState, useRef, useEffect, useMemo } from "react";
import { C } from "./tokens.js";
import { Icons } from "./icons.jsx";
import { estimateMins } from "./planUtils.js";
import api from "./apiClient.js";
import { deriveChipLabel } from "./messagePolicy.js";
import { Glass, AdaptationChip } from "./uiComponents.jsx";


export default function PlanWeekView({ history, plan, userId, onDeleteExecution, prefs }) {
  const today = new Date().toISOString().split("T")[0];
  const [upcomingPlans, setUpcomingPlans] = useState([]);
  const [loadingUpcoming, setLoadingUpcoming] = useState(!!userId);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteToast, setDeleteToast] = useState("");

  const handleDeleteConfirm = async () => {
    if (deleteInput !== "DELETE") return;
    setDeleting(true);
    try {
      await onDeleteExecution(deleteTarget.id);
      setDeleteToast("Session removed");
      setTimeout(() => setDeleteToast(""), 3000);
    } catch {
      setDeleteToast("Delete failed — try again");
      setTimeout(() => setDeleteToast(""), 3000);
    }
    setDeleting(false);
    setDeleteTarget(null);
    setDeleteInput("");
  };

  // Primitive deps derived from prefs/plan — avoids object identity churn in effect deps
  const runEnrolled = prefs?.preferences?.run_coach?.enrolled ? 1 : 0;
  const cycleActive = prefs?.preferences?.cycling_coach?.active ? 1 : 0;
  const milActive   = prefs?.preferences?.military_coach?.active ? 1 : 0;
  const isPro = prefs?.isPro ?? false;
  const planSessionName = plan?.session_name ?? null;

  // Stable refs for the full coach objects used inside the upcoming-plans effect.
  // The scalars above (runEnrolled, cycleActive) control re-triggering;
  // these refs always provide the latest values without causing reference-churn re-runs.
  const runCoachRef = useRef(prefs?.preferences?.run_coach);
  const cycleCoachRef = useRef(prefs?.preferences?.cycling_coach);
  useEffect(() => {
    runCoachRef.current = prefs?.preferences?.run_coach;
    cycleCoachRef.current = prefs?.preferences?.cycling_coach;
  });

  // Memoized so the array reference is stable between renders (recomputes when today changes)
  const upcomingDates = useMemo(() =>
    Array.from({ length: 5 }, (_, i) => {
      const d = new Date(today + 'T12:00:00'); // anchor to today so dep is valid
      d.setDate(d.getDate() + i + 1);
      return d.toISOString().split("T")[0];
    }),
  [today]);

  useEffect(() => {
    if (!userId) return;
    const cacheKey = `jf_upcoming_v4_${today}_rc${runEnrolled}_cc${cycleActive}_mc${milActive}_pro${isPro ? 1 : 0}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      // Synchronous early-return cache hit: setState before async work to avoid flash of loading state.
      // No cascading render risk — effect is only re-triggered by its own dep changes.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      try { setUpcomingPlans(JSON.parse(cached)); setLoadingUpcoming(false); return; } catch { /* ignore */ }
    }

    // Generate sequentially so each future day uses a simulated coach state
    // (parallel generation would use the same DB state for every day)
    const runCoach = runCoachRef.current;
    const cycleCoach = cycleCoachRef.current;

    // Seed simulation: if today is already a running/cycling session, count it as done
    let simRc = runCoach ? { ...runCoach } : null;
    if (simRc && planSessionName?.startsWith('Running Day')) {
      const siw = (simRc.session_in_week ?? 0) + 1;
      simRc = siw >= 3
        ? { ...simRc, session_in_week: 0, week: (simRc.week ?? 1) + 1, last_run_at_ms: Date.now() }
        : { ...simRc, session_in_week: siw, last_run_at_ms: Date.now() };
    }

    let simCc = cycleCoach ? { ...cycleCoach } : null;
    if (simCc && planSessionName?.startsWith('Cycling')) {
      const siw = (simCc.session_in_week ?? 0) + 1;
      simCc = siw >= 3
        ? { ...simCc, session_in_week: 0, week: (simCc.week ?? 1) + 1, last_ride_at_ms: Date.now() }
        : { ...simCc, session_in_week: siw, last_ride_at_ms: Date.now() };
    }

    (async () => {
      const result = [];
      for (const date of upcomingDates) {
        const coachSim = {};
        if (simRc) coachSim.run_coach = simRc;
        if (simCc) coachSim.cycling_coach = simCc;
        const p = await api.generatePlan(userId, date, null, Object.keys(coachSim).length > 0 ? coachSim : undefined, isPro).catch(() => null);
        result.push({ date, plan: p });

        if (simRc && p?.session_name?.startsWith('Running Day')) {
          const siw = (simRc.session_in_week ?? 0) + 1;
          simRc = siw >= 3
            ? { ...simRc, session_in_week: 0, week: (simRc.week ?? 1) + 1, last_run_at_ms: new Date(date + 'T12:00:00').getTime() }
            : { ...simRc, session_in_week: siw, last_run_at_ms: new Date(date + 'T12:00:00').getTime() };
        }
        if (simCc && p?.session_name?.startsWith('Cycling')) {
          const siw = (simCc.session_in_week ?? 0) + 1;
          simCc = siw >= 3
            ? { ...simCc, session_in_week: 0, week: (simCc.week ?? 1) + 1, last_ride_at_ms: new Date(date + 'T12:00:00').getTime() }
            : { ...simCc, session_in_week: siw, last_ride_at_ms: new Date(date + 'T12:00:00').getTime() };
        }
      }
      sessionStorage.setItem(cacheKey, JSON.stringify(result));
      setUpcomingPlans(result);
      setLoadingUpcoming(false);
    })();
  }, [userId, today, runEnrolled, cycleActive, milActive, isPro, planSessionName, upcomingDates]);

  // Build last 7 days
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  // Map history by date for quick lookup
  const doneByDate = {};
  (history || []).forEach((ex) => {
    if (ex.date) doneByDate[ex.date] = ex;
  });

  return (
    <div style={{ padding: "0 0 32px" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.02em", color: C.text, marginBottom: 4 }}>
          This Week
        </div>
        <div style={{ fontSize: 13, color: C.muted }}>Your last 7 days at a glance</div>
      </div>

      {/* 7-day strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 8, marginBottom: 32 }}>
        {days.map((date) => {
          const d = new Date(date + "T12:00:00");
          const done = !!doneByDate[date];
          const isToday = date === today;
          const isFuture = date > today;

          return (
            <div
              key={date}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                padding: "12px 4px",
                borderRadius: 16,
                background: isToday
                  ? C.emeraldDim
                  : done
                    ? "rgba(var(--accent-rgb),0.06)"
                    : "rgba(255,255,255,0.02)",
                border: `1px solid ${isToday ? C.emeraldBorder : done ? "rgba(var(--accent-rgb),0.2)" : C.border}`,
              }}
            >
              <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.08em", color: isToday ? C.emerald : C.muted, textTransform: "uppercase" }}>
                {dayNames[d.getDay()]}
              </span>
              <span style={{ fontSize: 15, fontWeight: 900, color: isToday ? C.emerald : isFuture ? C.subtle : C.text }}>
                {d.getDate()}
              </span>
              {/* Status dot */}
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: done
                    ? C.emerald
                    : isFuture
                      ? "transparent"
                      : "rgba(255,255,255,0.1)",
                  border: done ? "none" : isFuture ? `1px dashed ${C.subtle}` : `1px solid ${C.subtle}`,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Today's plan */}
      {plan && plan.slot_type !== "rest" && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", color: C.emerald, textTransform: "uppercase", marginBottom: 16 }}>
            Today's Plan
          </div>
          <Glass style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: plan.steps?.length ? 10 : 0 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 3 }}>
                  {plan.session_name || "Today's session"}
                </div>
                <div style={{ fontSize: 12, color: C.muted }}>
                  {(() => { const d = new Date(today + "T12:00:00"); return `${dayNames[d.getDay()]}, ${monthNames[d.getMonth()]} ${d.getDate()}`; })()}
                </div>
                {(() => { const chip = deriveChipLabel(plan.rule_trace, plan.session_notes); return chip ? <div style={{ marginTop: 4 }}><AdaptationChip label={chip} /></div> : null; })()}
              </div>
              {estimateMins(plan) && (
                <div style={{ padding: "4px 12px", borderRadius: 999, background: C.emeraldDim, border: `1px solid ${C.emeraldBorder}`, fontSize: 12, fontWeight: 800, color: C.emerald, flexShrink: 0 }}>
                  ~{estimateMins(plan)} min
                </div>
              )}
            </div>
            {plan.steps?.length > 0 && (
              <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.7 }}>
                {plan.steps.slice(0, 5).map((s) => s.name).join(" · ")}
                {plan.steps.length > 5 && ` · +${plan.steps.length - 5} more`}
              </div>
            )}
          </Glass>
        </div>
      )}

      {/* Coming up */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", color: C.emerald, textTransform: "uppercase", marginBottom: 16 }}>
          Coming Up
        </div>
        {loadingUpcoming ? (
          <Glass style={{ padding: 20, textAlign: "center" }}>
            <div style={{ fontSize: 13, color: C.muted }}>Predicting upcoming sessions…</div>
          </Glass>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {upcomingPlans.map(({ date, plan: p }) => {
              const d = new Date(date + "T12:00:00");
              const mins = estimateMins(p);
              const isRest = !p || p.slot_type === "rest";
              const exercises = p?.steps?.slice(0, 4).map((s) => s.name) ?? [];
              const extra = Math.max(0, (p?.steps?.length ?? 0) - 4);
              return (
                <Glass key={date} style={{ padding: "14px 18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: exercises.length && !isRest ? 8 : 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase" }}>
                        {dayNames[d.getDay()]}
                      </span>
                      <span style={{ fontSize: 12, color: C.muted }}>
                        {monthNames[d.getMonth()]} {d.getDate()}
                      </span>
                    </div>
                    {isRest ? (
                      <div style={{ padding: "3px 10px", borderRadius: 999, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, fontSize: 11, fontWeight: 700, color: C.muted }}>
                        Rest day
                      </div>
                    ) : mins ? (
                      <div style={{ padding: "3px 10px", borderRadius: 999, background: C.emeraldDim, border: `1px solid ${C.emeraldBorder}`, fontSize: 11, fontWeight: 800, color: C.emerald }}>
                        ~{mins} min
                      </div>
                    ) : null}
                  </div>
                  {!isRest && exercises.length > 0 && (
                    <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
                      {exercises.join(" · ")}{extra > 0 ? ` · +${extra} more` : ""}
                    </div>
                  )}
                </Glass>
              );
            })}
          </div>
        )}
      </div>

      {/* All history */}
      <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", color: C.emerald, textTransform: "uppercase", marginBottom: 16 }}>
        Completed Sessions
      </div>

      {deleteToast && (
        <div style={{ marginBottom: 12, padding: "10px 16px", borderRadius: 14, background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, fontSize: 13, fontWeight: 700, color: C.muted, textAlign: "center" }}>
          {deleteToast}
        </div>
      )}

      {!history || history.length === 0 ? (
        <Glass style={{ padding: 28, textAlign: "center" }}>
          <div style={{ fontSize: 13, color: C.muted, fontStyle: "italic" }}>Your workout history will appear here.</div>
        </Glass>
      ) : (() => {
        const STRAVA_ICON  = { strava_ride: 'cycle', strava_run: 'run', strava_walk: 'run', strava_hike: 'mountain', strava_swim: 'bolt', strava_row: 'lift', strava_workout: 'bolt' };
        const STRAVA_LABEL = { strava_ride: 'Ride', strava_run: 'Run', strava_walk: 'Walk', strava_hike: 'Hike', strava_swim: 'Swim', strava_row: 'Row', strava_workout: 'Workout' };
        const isStravaFn = e => typeof e.execution_type === 'string' && e.execution_type.startsWith('strava_');
        const parseMeta = e => { if (!e.strava_metadata_json) return null; try { return JSON.parse(e.strava_metadata_json); } catch { return null; } };

        // Sort new→old, group by date
        const sorted = [...history].sort((a, b) => b.date.localeCompare(a.date));
        const byDate = {};
        sorted.forEach(h => {
          if (!byDate[h.date]) byDate[h.date] = { app: [], strava: [] };
          if (isStravaFn(h)) byDate[h.date].strava.push(h);
          else byDate[h.date].app.push(h);
        });

        // Build render list: one card per app entry (with optional merged strava); standalone strava only when no app entry that day
        const renderItems = [];
        const seenDates = new Set();
        sorted.forEach(h => {
          const d = h.date;
          if (seenDates.has(d)) return;
          seenDates.add(d);
          const { app, strava } = byDate[d];
          if (app.length > 0) {
            app.forEach((entry, i) => {
              const reconciledMeta = parseMeta(entry);
              // Attach a separate strava entry to the first app card only, if not already reconciled
              const mergedStravaEntry = (!reconciledMeta && i === 0 && strava.length > 0) ? strava[0] : null;
              renderItems.push({ entry, isStravaCard: false, reconciledMeta, mergedStravaEntry });
            });
          } else {
            strava.forEach(entry => renderItems.push({ entry, isStravaCard: true, reconciledMeta: parseMeta(entry), mergedStravaEntry: null }));
          }
        });

        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {renderItems.map(({ entry: h, isStravaCard, reconciledMeta, mergedStravaEntry }) => {
              const stravaMeta = reconciledMeta ?? (mergedStravaEntry ? parseMeta(mergedStravaEntry) : null);
              const stravaSource = reconciledMeta ? h : mergedStravaEntry; // which entry holds the strava type
              const hasStrava = !!stravaMeta;

              const sportType  = stravaSource?.execution_type ?? '';
              const sportIconKey = STRAVA_ICON[sportType] ?? 'bolt';
              const SportIcon = Icons[sportIconKey] || Icons.bolt;
              const sportLabel = STRAVA_LABEL[sportType] ?? sportType;
              const distKm = stravaMeta?.distance_m ? (stravaMeta.distance_m / 1000).toFixed(1) : null;
              const elevM  = stravaMeta?.elevation_m ? Math.round(stravaMeta.elevation_m) : null;

              return (
                <Glass key={h.id} style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: isStravaCard ? "rgba(252,76,2,0.12)" : C.emeraldDim, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {isStravaCard ? <SportIcon size={20} c="rgba(252,76,2,0.8)" /> : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.emerald} strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                        {isStravaCard && stravaMeta?.name
                          ? stravaMeta.name
                          : new Date(h.date + "T12:00:00").toLocaleDateString("en", { weekday: "long", month: "short", day: "numeric" })}
                      </div>
                      <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginTop: 2 }}>
                        {isStravaCard
                          ? [new Date(h.date + "T12:00:00").toLocaleDateString("en", { month: "short", day: "numeric" }), sportLabel, h.total_duration_sec ? `${Math.round(h.total_duration_sec / 60)} min` : null, distKm ? `${distKm} km` : null, elevM ? `↑${elevM}m` : null].filter(Boolean).join(' · ')
                          : `${h.execution_type || "workout"} · ${h.total_duration_sec ? `${Math.round(h.total_duration_sec / 60)} min` : "completed"}`}
                      </div>
                      {!isStravaCard && (() => { const chip = deriveChipLabel(h.rule_trace, null); return chip ? <div style={{ marginTop: 4 }}><AdaptationChip label={chip} /></div> : null; })()}
                      {/* Strava activity name when merged from a separate entry */}
                      {mergedStravaEntry && stravaMeta?.name && (
                        <div style={{ fontSize: 11, color: "#FC4C02", fontWeight: 600, marginTop: 3 }}>
                          <SportIcon size={11} c="#FC4C02" /> {stravaMeta.name}{distKm ? ` · ${distKm} km` : ""}{elevM ? ` · ↑${elevM}m` : ""}
                        </div>
                      )}
                      {/* Strava metrics: speed, watts, HR, calories */}
                      {stravaMeta && (() => {
                        const isRun  = ['strava_run','strava_walk','strava_hike'].includes(sportType);
                        const isCycl = sportType === 'strava_ride';
                        const spd = stravaMeta.average_speed_ms;
                        const paceStr  = (isRun && spd > 0) ? (() => { const sk = 1000/spd; const m = Math.floor(sk/60); const s = Math.round(sk%60); return `${m}:${String(s).padStart(2,'0')} /km`; })() : null;
                        const kmhStr   = (isCycl && spd > 0) ? `${(spd * 3.6).toFixed(1)} km/h` : null;
                        const hrStr    = stravaMeta.average_heartrate ? `${Math.round(stravaMeta.average_heartrate)} bpm` : null;
                        const wattsStr = stravaMeta.average_watts ? `${Math.round(stravaMeta.average_watts)}W` : null;
                        const kcal     = stravaMeta.calories ?? (stravaMeta.kilojoules ? Math.round(stravaMeta.kilojoules) : null);
                        const kcalStr  = kcal ? `${kcal} kcal` : null;
                        const pills = [paceStr || kmhStr, wattsStr, hrStr, kcalStr].filter(Boolean);
                        if (!pills.length) return null;
                        return (
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 5 }}>
                            {pills.map((p, pi) => (
                              <span key={pi} style={{ fontSize: 10, fontWeight: 700, color: "#FC4C02", background: "rgba(252,76,2,0.08)", border: "1px solid rgba(252,76,2,0.2)", padding: "2px 7px", borderRadius: 6 }}>{p}</span>
                            ))}
                          </div>
                        );
                      })()}
                      {/* Exercise steps for app workouts */}
                      {!isStravaCard && h.steps?.length > 0 && (() => {
                        const completedSteps = h.steps.map(s => {
                          const actual = s.actual_json ? (() => { try { return JSON.parse(s.actual_json); } catch { return null; } })() : null;
                          const pres   = s.prescribed_json ? (() => { try { return JSON.parse(s.prescribed_json); } catch { return null; } })() : null;
                          if (!actual || actual.skipped || (actual.sets_completed ?? 0) === 0) return null;
                          const sets = actual.sets_completed;
                          const isTime = pres?.duration_sec && !pres?.reps;
                          const reps = actual.reps_per_set ?? [];
                          const avgVal = reps.length ? Math.round(reps.reduce((a,b) => a+b, 0) / reps.length) : null;
                          const detail = avgVal != null ? (isTime ? `${avgVal}s` : `${avgVal} reps`) : null;
                          return { name: s.name, sets, detail };
                        }).filter(Boolean);
                        if (!completedSteps.length) return null;
                        return (
                          <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 2 }}>
                            {completedSteps.slice(0, 6).map((s, i) => (
                              <div key={i} style={{ fontSize: 11, color: C.muted }}>
                                {s.name} · {s.sets} set{s.sets !== 1 ? 's' : ''}{s.detail ? ` × ${s.detail}` : ''}
                              </div>
                            ))}
                            {completedSteps.length > 6 && <div style={{ fontSize: 11, color: C.subtle }}>+{completedSteps.length - 6} more</div>}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {hasStrava && (
                      <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.1em", color: "#FC4C02", background: "rgba(252,76,2,0.12)", border: "1px solid rgba(252,76,2,0.3)", padding: "4px 10px", borderRadius: 8 }}>
                        STRAVA
                      </span>
                    )}
                    {!isStravaCard && (
                      <button
                        onClick={() => { setDeleteTarget(h); setDeleteInput(""); }}
                        style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                        aria-label="Delete session"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                        </svg>
                      </button>
                    )}
                  </div>
                </Glass>
              );
            })}
          </div>
        );
      })()}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(2,6,23,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Glass style={{ padding: 28, maxWidth: 360, width: "100%" }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: C.text, marginBottom: 8 }}>Delete session?</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 20, lineHeight: 1.5 }}>
              This will permanently remove your {new Date(deleteTarget.date + "T12:00:00").toLocaleDateString("en", { weekday: "long", month: "short", day: "numeric" })} session. Type <strong style={{ color: "#f87171" }}>DELETE</strong> to confirm.
            </div>
            <input
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder="Type DELETE"
              autoFocus
              style={{ width: "100%", padding: "10px 14px", borderRadius: 14, background: "rgba(255,255,255,0.06)", border: `1px solid ${deleteInput === "DELETE" ? "rgba(248,113,113,0.5)" : C.border}`, color: C.text, fontSize: 15, fontWeight: 700, boxSizing: "border-box", outline: "none", marginBottom: 16 }}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => { setDeleteTarget(null); setDeleteInput(""); }}
                style={{ flex: 1, padding: "12px 16px", borderRadius: 14, fontWeight: 900, fontSize: 14, background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, color: C.muted, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteInput !== "DELETE" || deleting}
                style={{ flex: 1, padding: "12px 16px", borderRadius: 14, fontWeight: 900, fontSize: 14, background: deleteInput === "DELETE" ? "rgba(248,113,113,0.15)" : "rgba(255,255,255,0.04)", border: `1px solid ${deleteInput === "DELETE" ? "rgba(248,113,113,0.4)" : C.border}`, color: deleteInput === "DELETE" ? "#f87171" : C.muted, cursor: deleteInput === "DELETE" && !deleting ? "pointer" : "default" }}
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </Glass>
        </div>
      )}
    </div>
  );
}

// ─── NAV ──────────────────────────────────────────────────────────────────────