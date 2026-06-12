import { useState } from "react";
import { C, display, eyebrow, mono } from "./tokens.js";
import { Glass } from "./uiComponents.jsx";
import { GOALS, EXPERIENCE } from "./appConstants.js";
import { Icons, GoalIcon, MilitaryIcon } from "./icons.jsx";
import { milClL, fmtDateNL, getUserId } from "./planUtils.js";
import api from "./apiClient.js";
import { t, useLang } from "./i18n.js";

// ─── KEURING NORMS (Defensie KB–K6, openbaar beschikbaar) ────────────────────
// run_sec = max 1500m time; pushups/pullups = minimum reps; march = max 5km+10kg time
const KEURING_NORMS = {
  0: { run_sec: 420, pushups: 20, pullups: 2, march: '40:00' },
  1: { run_sec: 390, pushups: 23, pullups: 3, march: '37:00' },
  2: { run_sec: 375, pushups: 25, pullups: 4, march: '35:00' },
  3: { run_sec: 365, pushups: 27, pullups: 5, march: '33:00' },
  4: { run_sec: 365, pushups: 28, pullups: 4, march: '35:00' },
  5: { run_sec: 350, pushups: 30, pullups: 6, march: '32:00' },
  6: { run_sec: 330, pushups: 35, pullups: 8, march: '30:00' },
};

// ─── COACH VIEW ───────────────────────────────────────────────────────────────

export default function CoachView({ prefs, plan, token, onUpdate, onNavigateSettings, onWeeklyPlan, progression, cyclingPmc, ftpSnoozedUntil, setFtpSnoozedUntil, accentHex, setView, trainerData, onTrainerDataChange, assignments, clientSessions, availableSessions, onAvailableSessionsChange, onClientSessionsChange, clientPackages }) {
  useLang();
  const [intentSaved, setIntentSaved] = useState(false);
  const [nowMs] = useState(() => Date.now());

  // ── Trainer persona state ──
  const [supportSheet, setSupportSheet] = useState(false); // compose | status
  const [supportMsg, setSupportMsg] = useState("");
  const [supportBroadcast, setSupportBroadcast] = useState(false);
  const [supportSending, setSupportSending] = useState(false);
  const [supportError, setSupportError] = useState(null);

  const [switchSheet, setSwitchSheet] = useState(false);
  const [switchStep, setSwitchStep] = useState("select"); // select | message
  const [switchTarget, setSwitchTarget] = useState(null);
  const [switchMsg, setSwitchMsg] = useState("");
  const [switchSending, setSwitchSending] = useState(false);
  const [switchError, setSwitchError] = useState(null);
  const [cancellingSwitch, setCancellingSwitch] = useState(false);

  const [profileSheet, setProfileSheet] = useState(null); // trainer object or null
  const [consentSigning, setConsentSigning] = useState(false);
  const [consentError, setConsentError] = useState(null);
  const [enrollingId, setEnrollingId] = useState(null);

  // ── Messaging state ──
  const [msgSheet, setMsgSheet] = useState(false);
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState("");
  const [msgSending, setMsgSending] = useState(false);
  const [msgError, setMsgError] = useState(null);
  const [msgLoading, setMsgLoading] = useState(false);

  const td = trainerData; // shorthand
  const trainer = td?.assigned_trainer ?? null;
  const gymTeam = td?.gym_team ?? null;
  const pendingSwitch = td?.pending_switch_request ?? null;
  const activeSupport = td?.active_support_request ?? null;
  const gymModel = td?.gym_model ?? 'staff';
  const consentRequired = !!(trainer && !td?.consent_signed);
  const unreadCount = td?.conv_unread_client ?? 0;

  function availDot(status) {
    const col = status === 'available' ? '#22c55e' : status === 'busy' ? '#f59e0b' : C.subtle;
    return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 4, background: col, marginRight: 5, flexShrink: 0 }} />;
  }

  async function handleSendSupport() {
    if (!supportMsg.trim()) return;
    setSupportSending(true);
    setSupportError(null);
    try {
      const res = await api.submitSupportRequest(token, supportMsg.trim(), supportBroadcast);
      if (res.ok) {
        setSupportMsg(""); setSupportBroadcast(false); setSupportSheet(false);
        const fresh = await api.getTrainerData(token);
        if (fresh && !fresh.error) onTrainerDataChange(fresh);
      } else {
        setSupportError(res.error ?? 'Fout — probeer opnieuw');
      }
    } catch { setSupportError('Netwerk fout'); }
    setSupportSending(false);
  }

  async function handleSendSwitch() {
    if (!switchTarget) return;
    setSwitchSending(true);
    setSwitchError(null);
    try {
      const res = await api.submitSwitchRequest(token, switchTarget.user_id, switchMsg.trim() || undefined);
      if (res.ok) {
        setSwitchSheet(false); setSwitchStep("select"); setSwitchTarget(null); setSwitchMsg("");
        const fresh = await api.getTrainerData(token);
        if (fresh && !fresh.error) onTrainerDataChange(fresh);
      } else {
        setSwitchError(res.error ?? 'Fout — probeer opnieuw');
      }
    } catch { setSwitchError('Netwerk fout'); }
    setSwitchSending(false);
  }

  async function handleCancelSwitch() {
    if (!pendingSwitch) return;
    setCancellingSwitch(true);
    try {
      await api.cancelSwitchRequest(token, pendingSwitch.id);
      const fresh = await api.getTrainerData(token);
      if (fresh && !fresh.error) onTrainerDataChange(fresh);
    } catch { /* ignore */ }
    setCancellingSwitch(false);
  }

  async function handleSignConsent() {
    setConsentSigning(true);
    setConsentError(null);
    try {
      const res = await api.signConsent(token);
      if (res.ok) {
        const fresh = await api.getTrainerData(token);
        if (fresh && !fresh.error) onTrainerDataChange(fresh);
      } else {
        setConsentError(res.error ?? 'Fout — probeer opnieuw');
      }
    } catch { setConsentError('Netwerk fout'); }
    setConsentSigning(false);
  }

  async function handleEnroll(sessionId) {
    setEnrollingId(sessionId);
    try {
      const res = await api.enrollSession(token, sessionId);
      if (res.ok) {
        // Move from available to enrolled — re-fetch both lists
        const [fresh, freshAvail] = await Promise.all([
          api.getSessions(token),
          api.getAvailableSessions(token),
        ]);
        if (Array.isArray(fresh?.sessions)) onClientSessionsChange(fresh.sessions);
        if (Array.isArray(freshAvail?.sessions)) onAvailableSessionsChange(freshAvail.sessions);
      }
    } catch { /* ignore — user can retry */ }
    setEnrollingId(null);
  }

  async function handleOpenMessages() {
    setMsgSheet(true);
    setMsgLoading(true);
    setMsgError(null);
    try {
      const data = await api.getMessages(token);
      if (Array.isArray(data.messages)) setMessages(data.messages);
      // Mark read and refresh unread count
      api.markMessagesRead(token).then(() => {
        api.getTrainerData(token).then(fresh => { if (fresh && !fresh.error) onTrainerDataChange(fresh); }).catch(() => {});
      }).catch(() => {});
    } catch { setMsgError('Kon berichten niet laden'); }
    setMsgLoading(false);
  }

  async function handleSendMessage() {
    const trimmed = msgInput.trim();
    if (!trimmed || msgSending) return;
    setMsgSending(true);
    setMsgError(null);
    try {
      const res = await api.sendMessage(token, trimmed);
      if (res.ok && res.message) {
        setMessages(prev => [...prev, res.message]);
        setMsgInput("");
      } else {
        setMsgError(res.error ?? 'Fout — probeer opnieuw');
      }
    } catch { setMsgError('Netwerk fout'); }
    setMsgSending(false);
  }
  const pref = prefs.preferences ?? {};
  const milA = !!(pref.military_coach?.active);
  const rcA  = !!(pref.run_coach?.enrolled && !pref.run_coach?.completed);
  const ccA  = !!(pref.cycling_coach?.active && !pref.cycling_coach?.completed);
  const primary = pref.primary_intent ?? (milA ? "military" : rcA ? "running" : ccA ? "cycling" : "general");

  const coachLabel = primary === 'military' && milA
    ? `MILITARY · ${milClL(pref.military_coach.track ?? "keuring", pref.military_coach.cluster_current ?? 0)}`
    : primary === 'running' && rcA ? `RUNNING · ${pref.run_coach.target_km}km`
    : primary === 'cycling' && ccA ? `CYCLING · WEEK ${pref.cycling_coach.week ?? 1}`
    : primary === 'general' ? t("GENERAL HEALTH")
    : milA ? `MILITARY · ${milClL(pref.military_coach.track ?? "keuring", pref.military_coach.cluster_current ?? 0)}`
    : rcA ? `RUNNING · ${pref.run_coach.target_km}km`
    : ccA ? `CYCLING · WEEK ${pref.cycling_coach.week ?? 1}`
    : t("GENERAL HEALTH");

  const activeCoaches = [milA && "military", rcA && "running", ccA && "cycling"].filter(Boolean);
  const multiCoach = activeCoaches.length > 1;

  const handleIntent = async (intent) => {
    try {
      const result = await api.saveProfile(token, { preferences: { ...pref, primary_intent: intent } });
      if (result?.ok && result.preferences) onUpdate(p => ({ ...p, preferences: result.preferences }));
      setIntentSaved(true);
      setTimeout(() => setIntentSaved(false), 3000);
    } catch { /* ignore */ }
  };

  const intents = [
    { id: "military", label: "Military", headline: milA ? milClL(pref.military_coach.track ?? "keuring", pref.military_coach.cluster_current ?? 0) : t("Not enrolled"), available: milA },
    { id: "running",  label: "Running",  headline: rcA ? `${pref.run_coach.target_km}km goal` : t("Not enrolled"), available: rcA },
    { id: "cycling",  label: "Cycling",  headline: ccA ? `${pref.cycling_coach.sub_goal?.replace(/_/g, " ") ?? "Active"}` : t("Not enrolled"), available: ccA },
    { id: "general",  label: "General health", headline: "Consistent daily training", available: true },
  ];

  const mp = plan?.military_program;
  const rc  = pref.run_coach ?? {};
  const cc  = pref.cycling_coach ?? {};
  const RADAR_AXES_CC = ["push", "pull", "legs", "core", "conditioning", "mobility"];
  const RADAR_LABELS_CC = { push: "Push", pull: "Pull", legs: "Legs", core: "Core", conditioning: "Cardio", mobility: "Mobility" };

  if (consentRequired) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "32px 20px" }}>
        <button
          onClick={() => setView("today")}
          style={{ background: "none", border: "none", color: C.muted, fontSize: 13, cursor: "pointer", padding: "0 0 24px", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4, alignSelf: "flex-start" }}
        >
          ← Terug
        </button>
        <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 24, padding: "28px 24px" }}>
          <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: "var(--accent)", textTransform: "uppercase", marginBottom: 14 }}>Gegevensdeling</div>
          <div style={{ ...display(26, 900), color: C.text, lineHeight: 1.1, marginBottom: 16 }}>
            Je trainer wil je begeleiden
          </div>
          <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.7, marginBottom: 8 }}>
            <strong style={{ color: C.text }}>{trainer?.display_name ?? "Je trainer"}</strong>
            {td?.gym_name ? ` van ${td.gym_name}` : ""} krijgt toegang tot je trainingsgeschiedenis, doelen en gezondheidsgegevens om je zo goed mogelijk te begeleiden.
          </div>
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 24 }}>
            Je gegevens worden alleen gedeeld met je trainer. Je kunt je toestemming altijd intrekken via Instellingen → Jouw coach.
          </div>
          {consentError && (
            <div style={{ fontSize: 12, color: "#f43f5e", marginBottom: 14 }}>{consentError}</div>
          )}
          <button
            onClick={handleSignConsent}
            disabled={consentSigning}
            style={{ width: "100%", padding: "14px 20px", borderRadius: 14, border: "none", background: "var(--accent)", color: "#020617", fontFamily: "inherit", fontWeight: 900, fontSize: 15, cursor: consentSigning ? "wait" : "pointer", opacity: consentSigning ? 0.7 : 1 }}
          >
            {consentSigning ? "Bezig…" : "Akkoord en doorgaan →"}
          </button>
          <div style={{ marginTop: 12, textAlign: "center" }}>
            <span
              onClick={() => setView("today")}
              style={{ fontSize: 12, color: C.muted, cursor: "pointer", textDecoration: "underline" }}
            >
              Nog niet
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }}>
        <button
          onClick={() => setView("today")}
          style={{ background: "none", border: "none", color: C.muted, fontSize: 13, cursor: "pointer", padding: "0 0 10px", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}
        >
          {t("← Today")}
        </button>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ ...eyebrow, color: C.muted, marginBottom: 8 }}>{t("COACH")}</div>
            <div style={{ ...display(36, 900), color: C.text, lineHeight: 1.05, letterSpacing: "-0.02em" }}>{coachLabel}</div>
          </div>
          <button
            onClick={() => onNavigateSettings()}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 13px", borderRadius: 99, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.04)", color: C.muted, cursor: "pointer", fontSize: 11, fontWeight: 700, fontFamily: "inherit", flexShrink: 0, marginTop: 2 }}
          >
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            {t("Settings")}
          </button>
        </div>
        {primary === 'military' && milA && mp && (
          <div style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>
            Block {((mp.block_number ?? 1) - 1) % 6 + 1} of 6 · Session {mp.block_session_index ?? 0} of 4
          </div>
        )}
        {primary === 'running' && rcA && (
          <div style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>
            Week {rc.week ?? 1} of {({ 5:8,10:12,15:14,20:16,30:20 })[rc.target_km] ?? 8} · Session {rc.session_in_week ?? 0} of 3
          </div>
        )}
        {primary === 'cycling' && ccA && (
          <div style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>
            Week {cc.week ?? 1} · Session {cc.session_in_week ?? 0} of {cc.cycling_days_per_week ?? 3}
          </div>
        )}
      </div>

      {/* ── Primary intent ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ ...eyebrow, color: C.muted, marginBottom: 12 }}>{t("PRIMARY INTENT")}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {intents.map(({ id, label, headline, available }) => {
            const active = primary === id;
            return (
              <button
                key={id}
                onClick={() => available && handleIntent(id)}
                style={{
                  display: "grid", gridTemplateColumns: "18px 1fr auto",
                  gap: 12, alignItems: "center", width: "100%",
                  padding: "13px 16px", cursor: available ? "pointer" : "default",
                  background: active ? "rgba(var(--accent-rgb),0.08)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${active ? "var(--accent-border)" : C.border}`,
                  borderRadius: 14, fontFamily: "inherit",
                  opacity: available ? 1 : 0.4,
                }}
              >
                <div style={{ width: 16, height: 16, borderRadius: 99, border: `2px solid ${active ? "var(--accent)" : C.subtle}`, background: active ? "var(--accent)" : "transparent", flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: active ? C.text : C.muted, textAlign: "left" }}>{label}</span>
                <span style={{ fontSize: 11, color: C.muted }}>{headline}</span>
              </button>
            );
          })}
        </div>
        {intentSaved && (
          <div style={{ fontSize: 12, color: C.muted, marginTop: 10, textAlign: "center" }}>{t("Active from your next check-in.")}</div>
        )}
      </div>

      {/* ── Conflict resolution ── */}
      {multiCoach && (
        <Glass style={{ padding: "16px 20px", marginBottom: 28 }}>
          <div style={{ ...eyebrow, color: C.muted, marginBottom: 8 }}>{t("CONFLICT RESOLUTION")}</div>
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
            {primary === "military" ? "Military drives Today. Other coaches adapt."
             : primary === "running" ? "Running drives Today. Other coaches fill rest days."
             : primary === "cycling" ? "Cycling drives Today. Other coaches fill gaps."
             : "General training runs when no coach claims today."}
          </div>
          <button onClick={() => onNavigateSettings()} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "var(--accent)", fontFamily: "inherit", padding: 0, marginTop: 8 }}>
            {t("Change primary →")}
          </button>
        </Glass>
      )}

      {/* ── Training Goal (general mode, no specialist coach) ── */}
      {!milA && !rcA && !ccA && (() => {
        const currentGoal = GOALS.find(g => g.value === (prefs.training_goal ?? progression?.goal ?? "health")) ?? GOALS[0];
        const exp = EXPERIENCE.find(e => e.value === (prefs.experience_level ?? "beginner")) ?? EXPERIENCE[0];
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
            <div style={{ marginLeft: "auto", fontSize: 11, color: C.subtle, fontStyle: "italic" }}>{t("Change in Settings →")}</div>
          </Glass>
        );
      })()}

      {/* ── Running programme ── */}
      {rcA && (() => {
        const PROGRAM_WEEKS = { 5: 8, 10: 12, 15: 14, 20: 16, 30: 20 };
        const totalWeeks = PROGRAM_WEEKS[rc.target_km ?? 5] ?? 8;
        const week = rc.week ?? 1;
        const sessionInWeek = rc.session_in_week ?? 0;
        const pct = Math.min(100, Math.round(((week - 1) * 3 + sessionInWeek) / (totalWeeks * 3) * 100));
        const unlockedTargets = rc.unlocked_targets ?? [];
        const sessionsLeft = 3 - sessionInWeek;
        const lastRunDate = rc.last_run_at_ms ? new Date(rc.last_run_at_ms).toISOString().slice(0, 10) : null;
        const todayStr = new Date().toISOString().slice(0, 10);
        const runReadyToday = (!lastRunDate || lastRunDate < todayStr) && sessionInWeek < 3;
        const weeks = Array.from({ length: totalWeeks }, (_, i) => i + 1);
        return (
          <>
            {/* Programme card */}
            <Glass style={{ padding: 20, marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--accent-dim)", border: "1px solid var(--accent-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "var(--accent)" }}>
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
                <div style={{ width: `${pct}%`, height: "100%", background: "var(--accent)", borderRadius: 999, transition: "width 0.5s ease" }} />
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>Session {sessionInWeek} of 3 this week — any 3 days you train</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                {[{n:1,day:"Run 1",type:"Intervals"},{n:2,day:"Run 2",type:"Zone 2"},{n:3,day:"Run 3",type:"Intervals"}].map(s => {
                  const done = sessionInWeek >= s.n;
                  const next = sessionInWeek === s.n - 1;
                  return (
                    <div key={s.n} style={{ flex: 1, padding: "5px 4px", borderRadius: 8, textAlign: "center", background: done ? "var(--accent-dim)" : next ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)", border: `1px solid ${done ? "var(--accent-border)" : next ? C.border : "rgba(255,255,255,0.04)"}` }}>
                      <div style={{ fontSize: 9, fontWeight: 900, color: done ? "var(--accent)" : next ? C.text : C.subtle, letterSpacing: "0.06em" }}>{s.day}</div>
                      <div style={{ fontSize: 9, color: done ? "var(--accent)" : next ? C.muted : C.subtle, marginTop: 1 }}>{s.type}</div>
                      {done && <div style={{ fontSize: 9, color: "var(--accent)" }}>✓</div>}
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[5, 10, 15, 20, 30].map(t => {
                  const done = unlockedTargets.includes(String(t));
                  const isCurrent = t === (rc.target_km ?? 5);
                  return (
                    <div key={t} style={{ padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 800, border: `1px solid ${isCurrent ? "var(--accent-border)" : done ? "rgba(var(--accent-rgb),0.2)" : C.border}`, background: isCurrent ? "rgba(var(--accent-rgb),0.12)" : done ? "rgba(var(--accent-rgb),0.06)" : "rgba(255,255,255,0.02)", color: isCurrent ? "var(--accent)" : done ? C.muted : C.subtle }}>
                      {done ? "✓ " : ""}{t}km
                    </div>
                  );
                })}
              </div>
            </Glass>
            {/* Plan timeline */}
            <Glass style={{ padding: 20, marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 14 }}>
                {rc.target_km}km Plan — {totalWeeks}-Week Progression
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 48, marginBottom: 8 }}>
                {weeks.map(w => {
                  const barH = Math.max(6, Math.round((w / totalWeeks) * 44));
                  const isPast = w < week;
                  const isCurrent = w === week;
                  return (
                    <div key={w} style={{ flex: 1 }}>
                      <div style={{ width: "100%", height: barH, borderRadius: 3, background: isPast ? "var(--accent)" : isCurrent ? "rgba(var(--accent-rgb),0.6)" : C.border, transition: "height 0.3s ease" }} />
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 10, color: C.subtle }}>Week 1</span>
                <span style={{ fontSize: 10, color: C.subtle }}>Week {totalWeeks}</span>
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {[["var(--accent)", "Completed"], ["rgba(var(--accent-rgb),0.6)", `Current (Week ${week})`], [C.border, "Upcoming"]].map(([bg, label]) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: bg }} />
                    <span style={{ fontSize: 11, color: C.muted }}>{label}</span>
                  </div>
                ))}
              </div>
            </Glass>
            {/* Insight */}
            <Glass style={{ padding: "16px 20px", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: "var(--accent-dim)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "var(--accent)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 900, color: C.text, marginBottom: 2 }}>
                    Running Coach — {rc.target_km}km, Week {week} of {totalWeeks}
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
            </Glass>
          </>
        );
      })()}

      {/* ── Cycling programme ── */}
      {ccA && (() => {
        const sessionInWeek = cc.session_in_week ?? 0;
        const daysPerWeek = cc.cycling_days_per_week ?? 3;
        const sessionsLeft = daysPerWeek - sessionInWeek;
        const WEEK_PATTERN = ['Intervals', 'Zone 2', 'Intervals'];
        const nextLabel = WEEK_PATTERN[sessionInWeek] ?? 'Intervals';
        const unitLabel = cc.unit === 'hr' ? 'heart rate zones' : `FTP ${cc.ftp_watts ?? 200}W`;
        const insightText = sessionsLeft === daysPerWeek
          ? `${daysPerWeek} sessions this week — ${WEEK_PATTERN.join(' · ')}.`
          : sessionsLeft > 0
          ? `${sessionsLeft} session${sessionsLeft > 1 ? 's' : ''} remaining. Up next: ${nextLabel}.`
          : 'Week complete — good work. Your next cycling week begins on your next session.';

        const intervalWeeks = cc.ftp_test_interval_weeks ?? 6;
        const testedAtMs = cc.ftp_tested_at_ms ?? null;
        const todayMs = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z').getTime();
        const ftpStale = !testedAtMs || (todayMs - testedAtMs) > intervalWeeks * 7 * 86400000;
        const weeksAgo = testedAtMs ? Math.floor((todayMs - testedAtMs) / (7 * 86400000)) : null;

        const pmcSeries = cyclingPmc?.series ?? [];
        const pmcLatest = cyclingPmc?.latest ?? null;
        const pmcHasData = pmcSeries.length > 0 && pmcLatest;
        const pmcChartW = 300, pmcChartH = 52;
        const pmcN = pmcSeries.length;
        const pmcMaxY = pmcN > 0 ? pmcSeries.reduce((m, d) => Math.max(m, d.ctl, d.atl), 10) : 100;
        const pmcToX = (i) => pmcN > 1 ? (i / (pmcN - 1)) * pmcChartW : pmcChartW / 2;
        const pmcToY = (v) => pmcChartH - (v / pmcMaxY) * (pmcChartH - 6) - 2;
        const ctlPts = pmcSeries.map((d, i) => `${pmcToX(i).toFixed(1)},${pmcToY(d.ctl).toFixed(1)}`).join(' ');
        const atlPts = pmcSeries.map((d, i) => `${pmcToX(i).toFixed(1)},${pmcToY(d.atl).toFixed(1)}`).join(' ');

        const tsb = pmcLatest?.tsb ?? null;
        const tsbMsg = tsb === null ? null
          : tsb < -25 ? 'Fatigue is high — keep it easy or take a recovery day'
          : tsb < -10 ? 'Good training load — keep building'
          : tsb <= 5  ? 'Fresh enough for quality work'
          : 'Very fresh — good day for a hard session, test, or longer ride';
        const tsbColor = tsb === null ? C.muted : tsb < -25 ? '#f43f5e' : tsb < -10 ? '#f59e0b' : "var(--accent)";

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
          <Glass style={{ padding: 20, marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: (pmcHasData || ftpSparkN >= 2) ? 14 : 0 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: "var(--accent-dim)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icons.cycle size={18} c="var(--accent)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: C.text, marginBottom: 2 }}>
                  Cycling Coach — Week {cc.week ?? 1} · {unitLabel}
                </div>
                <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.5 }}>{insightText}</div>
                {cc.enrolled_at_ms && (() => {
                  const weekNumber = Math.floor((Date.now() - cc.enrolled_at_ms) / (7 * 86400000)) + 1;
                  const blockWeek = ((weekNumber - 1) % 7) + 1;
                  const phase = blockWeek <= 2 ? "BASE" : blockWeek <= 5 ? "BUILD" : blockWeek === 6 ? "RECOVERY" : "PEAK";
                  return (
                    <div style={{ display: "inline-block", marginTop: 6, padding: "2px 8px", borderRadius: 6, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: "0.06em" }}>
                      {phase}
                    </div>
                  );
                })()}
                {ftpStale && cc.unit === 'watts' && ftpSnoozedUntil < nowMs && plan?.slot_type !== 'rest' && (
                  <div style={{ marginTop: 8, padding: "10px 12px", borderRadius: 10, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.25)" }}>
                    <div style={{ fontSize: 11, color: "#f59e0b", lineHeight: 1.5, marginBottom: 7 }}>
                      FTP refresh recommended{weeksAgo !== null ? ` — tested ${weeksAgo} week${weeksAgo !== 1 ? 's' : ''} ago` : ' — no test on record'}.
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => setView("settings")} style={{ padding: "5px 10px", borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: "pointer", background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.35)", color: "#f59e0b" }}>
                        Go to FTP test
                      </button>
                      <button
                        onClick={() => { const until = nowMs + 7 * 86400000; const _u = getUserId(); localStorage.setItem(_u ? `jf_ftp_snooze_until_${_u}` : 'jf_ftp_snooze_until', String(until)); setFtpSnoozedUntil(until); }}
                        style={{ padding: "5px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, color: C.muted }}
                      >
                        Remind me next week
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {pmcHasData && (
              <div>
                <svg viewBox={`0 0 ${pmcChartW} ${pmcChartH}`} width="100%" height={pmcChartH} style={{ display: "block", overflow: "visible" }}>
                  <polyline points={atlPts} fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 3" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points={ctlPts} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div style={{ display: "flex", gap: 12, marginTop: 4, marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "var(--accent)" }}>
                    <svg width="16" height="4"><line x1="0" y1="2" x2="16" y2="2" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" /></svg>
                    CTL fitness
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#f59e0b" }}>
                    <svg width="16" height="4"><line x1="0" y1="2" x2="16" y2="2" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 3" strokeLinecap="round" /></svg>
                    ATL fatigue
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[{ label: 'CTL', value: pmcLatest.ctl, color: "var(--accent)" }, { label: 'ATL', value: pmcLatest.atl, color: "#f59e0b" }, { label: 'TSB', value: pmcLatest.tsb, color: tsbColor }].map(({ label, value, color }) => (
                    <div key={label} style={{ flex: 1, background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10, padding: "6px 8px", textAlign: "center" }}>
                      <div style={{ ...eyebrow, fontSize: 9, color: C.muted, marginBottom: 2 }}>{label}</div>
                      <div style={{ ...mono(13), color, fontWeight: 700 }}>{value.toFixed(0)}</div>
                    </div>
                  ))}
                </div>
                {tsbMsg && (
                  <div style={{ marginTop: 8, fontSize: 11, color: tsbColor, lineHeight: 1.5 }}>
                    {tsbMsg}{cyclingPmc?.hasEstimated && <span style={{ color: C.muted }}> · ~est.</span>}
                  </div>
                )}
              </div>
            )}
            {ftpSparkN >= 2 && (
              <div style={{ marginTop: 14 }}>
                <div style={{ ...eyebrow, fontSize: 9, color: C.muted, marginBottom: 6 }}>{t("FTP PROGRESS")}</div>
                <svg viewBox={`0 0 ${ftpSparkW} ${ftpSparkH}`} width="100%" height={ftpSparkH} style={{ display: "block", overflow: "visible" }}>
                  <polyline points={ftpPts} fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  {ftpHistory.map((h, i) => {
                    const x = (i / (ftpSparkN - 1)) * ftpSparkW;
                    const y = ftpSparkH - ((h.ftp_watts - ftpMin) / ftpRange) * (ftpSparkH - 8) - 4;
                    return <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r="3" fill="var(--accent)" />;
                  })}
                </svg>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
                  <div style={{ fontSize: 10, color: C.muted }}>{ftpHistory[0].ftp_watts}W</div>
                  <div style={{ ...mono(11), color: "var(--accent)", fontWeight: 700 }}>{ftpHistory[ftpSparkN - 1].ftp_watts}W current</div>
                </div>
              </div>
            )}
            {cc.unit !== 'hr' && cc.ftp_watts > 0 && (() => {
              const ftp = cc.ftp_watts;
              const ZONES = [
                { n: 1, name: "Active recovery", lo: 0,                        hi: Math.round(ftp * 0.55) },
                { n: 2, name: "Endurance",       lo: Math.round(ftp * 0.55),   hi: Math.round(ftp * 0.75) },
                { n: 3, name: "Tempo",           lo: Math.round(ftp * 0.75),   hi: Math.round(ftp * 0.90) },
                { n: 4, name: "Threshold",       lo: Math.round(ftp * 0.90),   hi: Math.round(ftp * 1.05) },
                { n: 5, name: "VO2 Max",         lo: Math.round(ftp * 1.05),   hi: null },
              ];
              return (
                <div style={{ marginTop: 14 }}>
                  <div style={{ ...eyebrow, fontSize: 9, color: C.muted, marginBottom: 8 }}>{t("POWER ZONES")}</div>
                  {ZONES.map(z => (
                    <div key={z.n} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                      <div style={{ fontSize: 11, color: C.muted }}>Z{z.n} · {z.name}</div>
                      <div style={{ ...mono(11), color: z.n >= 4 ? "var(--accent)" : C.muted, fontWeight: 700 }}>
                        {z.hi ? `${z.lo}–${z.hi} W` : `${z.lo}+ W`}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </Glass>
        );
      })()}

      {/* ── Military programme ── */}
      {milA && (() => {
        const mil = pref.military_coach ?? {};
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
        const nextLevel = Math.min(clusterCurrent + 1, maxLevel);
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
        const ownedWeights = Array.isArray(mil.pack_weights_available_kg) ? mil.pack_weights_available_kg : [];
        const maxOwnedKg = ownedWeights.length > 0 ? Math.max(...ownedWeights) : null;
        const MIL_MARCH_TARGET = { 1: 5, 2: 10, 3: 15, 4: 20, 5: 25, 6: 30 };
        const nextMarchTarget = track === 'keuring' ? (MIL_MARCH_TARGET[nextLevel] ?? null) : null;
        const tips = track === 'keuring' ? [
          mode === 'open'
            ? `Next milestone: ${milClL(track, nextLevel)} — ${CLUSTER_DESC[nextLevel] ?? ''}. Cooper target: ≥${nextCooperTarget ?? '?'}m${cooperGap ? `, ${cooperGap}m to go` : ''}.`
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
        const sortedAxes = RADAR_AXES_CC.map(a => ({ axis: a, score: Math.round(axisScores[a] ?? 0) })).sort((a, b) => a.score - b.score);
        const weakest = sortedAxes[0];
        const fmtSec = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
        const COOPER_THRESHOLDS_CF5 = [0, 1800, 2000, 2200, 2400, 2600, 2800];

        return (
          <>
            {/* KeuringReadinessCard — target mode keuring */}
            {mode === 'target' && track === 'keuring' && mil.target_date && (() => {
              const norms = KEURING_NORMS[clusterTarget] ?? KEURING_NORMS[0];
              const runOk = lastCooper != null && lastCooper >= (COOPER_THRESHOLDS_CF5[clusterTarget] ?? Infinity);
              const strengthOk = clusterCurrent >= clusterTarget;
              const kLabel = milClL(track, clusterTarget);
              const checkItems = [
                { label: '1500m loop',        norm: `≤ ${fmtSec(norms.run_sec)}`,  ok: runOk },
                { label: 'Push-ups',          norm: `≥ ${norms.pushups}`,           ok: strengthOk },
                { label: 'Pull-ups',          norm: `≥ ${norms.pullups}`,           ok: strengthOk },
                { label: 'Mars 5km + 10kg',   norm: `≤ ${norms.march}`,             ok: strengthOk },
              ];
              return (
                <Glass style={{ padding: 20, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.14em', color: 'var(--accent)', textTransform: 'uppercase' }}>
                      KEURING · {kLabel}
                    </div>
                    {daysToAssessment != null && (
                      <div style={{ fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 99, background: daysToAssessment <= 14 ? 'rgba(245,158,11,0.12)' : 'var(--accent-dim)', border: `1px solid ${daysToAssessment <= 14 ? 'rgba(245,158,11,0.3)' : 'var(--accent-border)'}`, color: daysToAssessment <= 14 ? '#f59e0b' : 'var(--accent)' }}>
                        over {daysToAssessment} dag{daysToAssessment !== 1 ? 'en' : ''}
                      </div>
                    )}
                  </div>
                  {checkItems.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < checkItems.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                      <span style={{ fontSize: 14, flexShrink: 0, color: item.ok ? C.emerald : C.muted, fontWeight: 900 }}>{item.ok ? '✓' : '○'}</span>
                      <span style={{ flex: 1, fontSize: 13, color: C.text }}>{item.label}</span>
                      <span style={{ fontSize: 11, color: C.muted, fontWeight: 700, flexShrink: 0 }}>{kLabel}: {item.norm}</span>
                    </div>
                  ))}
                  {weakest && (
                    <div style={{ marginTop: 12, fontSize: 12, color: C.muted, padding: '9px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}` }}>
                      Zwakste as: <span style={{ color: C.text, fontWeight: 700 }}>{weakest.axis.charAt(0).toUpperCase() + weakest.axis.slice(1)}</span> — focus hierop deze week.
                    </div>
                  )}
                </Glass>
              );
            })()}

            {/* KeuringReadinessCard — open/fit mode */}
            {mode !== 'target' && track === 'keuring' && (lastCooper || weakest) && (
              <Glass style={{ padding: 16, marginBottom: 12 }}>
                <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.14em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 10 }}>Cooper Referentie</div>
                {lastCooper ? (
                  <div style={{ fontSize: 13, color: C.text, marginBottom: weakest ? 10 : 0 }}>
                    Laatste Cooper: <strong>{lastCooper}m</strong>
                    {cooperLevel != null && cooperLevel > 0 && <span style={{ color: C.muted, marginLeft: 6 }}>· {milClL(track, cooperLevel)}</span>}
                    {cooperGap != null && clusterCurrent < maxLevel && (
                      <span style={{ fontSize: 11, color: C.muted, display: 'block', marginTop: 3 }}>
                        {cooperGap}m tot {milClL(track, nextLevel)} ({COOPER_THRESHOLDS_CF5[nextLevel]}m)
                      </span>
                    )}
                  </div>
                ) : null}
                {weakest && (
                  <div style={{ fontSize: 12, color: C.muted }}>
                    Zwakste as: <span style={{ color: C.text, fontWeight: 700 }}>{weakest.axis.charAt(0).toUpperCase() + weakest.axis.slice(1)}</span> — focus hierop deze week.
                  </div>
                )}
              </Glass>
            )}

            {/* Level ladder */}
            <Glass style={{ padding: 20, marginBottom: 12 }}>
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
            {/* Coach Insights */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", color: "var(--accent)", textTransform: "uppercase", marginBottom: 12 }}>
                Coach Insights
              </div>
              <Glass style={{ padding: 20 }}>
                {(cooperBenchmark || maxOwnedKg !== null) && (
                  <>
                    <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                      <div style={{ flex: 1, minWidth: 120, padding: "12px 14px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}` }}>
                        <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 6 }}>Cooper test</div>
                        {cooperBenchmark
                          ? <div style={{ fontSize: 15, fontWeight: 900, color: C.text }}>{lastCooper}m <span style={{ fontSize: 11, color: C.muted, fontWeight: 700 }}>{milClL(track, cooperLevel)}</span></div>
                          : <div style={{ fontSize: 13, fontWeight: 700, color: C.subtle }}>No test recorded</div>}
                        {nextCooperTarget && clusterCurrent < maxLevel && (
                          <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                            {milClL(track, nextLevel)} requires ≥{nextCooperTarget}m
                            {cooperGap != null && cooperGap > 0 && <span style={{ color: "#f59e0b", fontWeight: 700 }}> · {cooperGap}m to go</span>}
                            {cooperGap === 0 && <span style={{ color: "var(--accent)", fontWeight: 700 }}> · achieved</span>}
                          </div>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 120, padding: "12px 14px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}` }}>
                        <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 6 }}>March weight</div>
                        {maxOwnedKg !== null
                          ? <div style={{ fontSize: 15, fontWeight: 900, color: C.text }}>{maxOwnedKg} kg <span style={{ fontSize: 11, color: C.muted, fontWeight: 700 }}>max</span></div>
                          : <div style={{ fontSize: 13, fontWeight: 700, color: C.subtle }}>Not set</div>}
                        {nextMarchTarget && clusterCurrent < maxLevel && (
                          <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                            {milClL(track, nextLevel)} target: {nextMarchTarget} kg
                            {maxOwnedKg !== null && maxOwnedKg >= nextMarchTarget && <span style={{ color: "var(--accent)", fontWeight: 700 }}> · ready</span>}
                            {maxOwnedKg !== null && maxOwnedKg < nextMarchTarget && <span style={{ color: "#f59e0b", fontWeight: 700 }}> · {nextMarchTarget - maxOwnedKg} kg short</span>}
                          </div>
                        )}
                        {maxOwnedKg === null && <div style={{ fontSize: 11, color: C.subtle, marginTop: 4 }}>{t("Set weights in Settings →")}</div>}
                      </div>
                    </div>
                    <div style={{ height: 1, background: C.border, marginBottom: 16 }} />
                  </>
                )}
                {weakest && (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: "var(--accent-dim)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icons.compass size={15} c="var(--accent)" /></div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 900, color: C.text, marginBottom: 1 }}>Priority axis: {RADAR_LABELS_CC[weakest.axis]}</div>
                        <div style={{ fontSize: 11, color: C.muted }}>Score {weakest.score} — the planner is already biasing sessions here.</div>
                      </div>
                    </div>
                    <div style={{ height: 1, background: C.border, marginBottom: 16 }} />
                  </>
                )}
                {tips.map((tip, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, marginBottom: i < tips.length - 1 ? 12 : 0 }}>
                    <div style={{ width: 6, height: 6, borderRadius: 3, background: "var(--accent)", flexShrink: 0, marginTop: 6 }} />
                    <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6, fontWeight: 500 }}>{tip}</div>
                  </div>
                ))}
              </Glass>
            </div>
            {/* Defensie disclaimer */}
            <div style={{ fontSize: 11, color: C.subtle, lineHeight: 1.5, marginBottom: 12 }}>
              JustFit is niet gelieerd aan Defensie of het Ministerie van Defensie. De normen zijn gebaseerd op openbaar beschikbare informatie.
            </div>
          </>
        );
      })()}

      {/* ── Jouw trainer card (profile + sessions + groepslessen + credits) ── */}
      {trainer && (
        <Glass style={{ padding: 20, marginBottom: 16 }}>
          <div style={{ ...eyebrow, color: C.muted, marginBottom: 14 }}>JOUW TRAINER</div>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 14 }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: C.subtle, flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {trainer.photo_url
                ? <img src={trainer.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ fontSize: 26, color: C.muted }}>👤</span>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: C.text, marginBottom: 3 }}>{trainer.display_name ?? "Jouw trainer"}</div>
              {trainer.specialties?.length > 0 && (
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 5 }}>{trainer.specialties.slice(0, 3).join(" · ")}</div>
              )}
              <div style={{ display: "flex", alignItems: "center", fontSize: 12, color: C.muted }}>
                {availDot(trainer.availability_status)}
                {trainer.availability_status === 'available' ? "Beschikbaar" : trainer.availability_status === 'busy' ? "Bezig" : "Offline"}
              </div>
            </div>
          </div>
          {trainer.bio && (
            <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5, marginBottom: 14, fontStyle: "italic" }}>"{trainer.bio}"</div>
          )}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {/* Vraag om hulp button */}
            {activeSupport ? (
              <button
                onClick={() => setSupportSheet(true)}
                style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.04)", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700, color: C.muted, textAlign: "left" }}
              >
                {activeSupport.status === 'accepted' && activeSupport.reply_message
                  ? "✓ Trainer heeft gereageerd"
                  : activeSupport.status === 'accepted'
                  ? "◐ Trainer is bereikbaar"
                  : "● Hulpverzoek verstuurd"}
              </button>
            ) : (trainer.availability_status !== 'offline') && (
              <button
                onClick={() => { setSupportSheet(true); setSupportError(null); }}
                style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.04)", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700, color: C.text }}
              >
                Vraag om hulp
              </button>
            )}
            {/* Berichten button */}
            <button
              onClick={handleOpenMessages}
              style={{ position: "relative", flex: 1, padding: "10px 14px", borderRadius: 10, border: `1px solid ${unreadCount > 0 ? 'rgba(var(--accent-rgb),0.4)' : C.border}`, background: unreadCount > 0 ? 'rgba(var(--accent-rgb),0.06)' : "rgba(255,255,255,0.04)", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700, color: unreadCount > 0 ? 'var(--accent)' : C.muted }}
            >
              Berichten
              {unreadCount > 0 && (
                <span style={{ position: "absolute", top: 6, right: 8, minWidth: 16, height: 16, borderRadius: 8, background: 'var(--accent)', color: '#020617', fontSize: 9, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>{unreadCount}</span>
              )}
            </button>
            {/* Wissel van trainer button — hide if only 1 trainer or pending switch */}
            {gymTeam && gymTeam.filter(t => !t.is_assigned).length > 0 && !pendingSwitch && (
              <button
                onClick={() => { setSwitchSheet(true); setSwitchStep("select"); setSwitchTarget(null); setSwitchMsg(""); setSwitchError(null); }}
                style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.04)", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700, color: C.muted }}
              >
                Wissel van trainer
              </button>
            )}
            {pendingSwitch && (
              <div style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.03)" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#f59e0b", marginBottom: 4 }}>◐ Wisselverzoek in behandeling</div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>Naar: {pendingSwitch.to_trainer_name} · {Math.round((nowMs - pendingSwitch.created_at_ms) / 86400000)} dagen geleden</div>
                <button onClick={handleCancelSwitch} disabled={cancellingSwitch} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: 11, fontWeight: 700, color: C.muted, fontFamily: "inherit" }}>
                  {cancellingSwitch ? "..." : "Trek verzoek in"}
                </button>
              </div>
            )}
          </div>

          {/* ── Geplande sessies ── */}
          {clientSessions && clientSessions.length > 0 && (
            <div style={{ marginTop: 18, paddingTop: 18, borderTop: `1px solid ${C.border}` }}>
              <div style={{ ...eyebrow, fontSize: 10, color: C.muted, marginBottom: 12 }}>GEPLANDE SESSIES</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {clientSessions.map(s => {
                  const isPast = s.starts_at_ms < nowMs;
                  const isGroup = s.type === 'group';
                  return (
                    <div key={s.id} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 4, flexShrink: 0, marginTop: 5,
                        background: s.rsvp === 'waitlist' ? '#f59e0b' : isPast ? C.subtle : 'var(--accent)' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: isPast ? C.muted : C.text, marginBottom: 2 }}>{s.title}</div>
                        <div style={{ fontSize: 11, color: C.muted }}>
                          {fmtDateNL(s.starts_at_ms)}
                          {s.location ? ` · ${s.location}` : ''}
                          {isGroup ? ' · Groep' : ''}
                          {s.rsvp === 'waitlist' ? ' · Wachtlijst' : ''}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Open groepslessen ── */}
          {availableSessions && availableSessions.length > 0 && (
            <div style={{ marginTop: 18, paddingTop: 18, borderTop: `1px solid ${C.border}` }}>
              <div style={{ ...eyebrow, fontSize: 10, color: C.muted, marginBottom: 12 }}>OPEN GROEPSLESSEN</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {availableSessions.map(s => {
                  const isFull = s.max_capacity !== null && s.enrolled_count >= s.max_capacity;
                  const pct = s.max_capacity ? Math.min(1, s.enrolled_count / s.max_capacity) : 0;
                  const isEnrolling = enrollingId === s.id;
                  return (
                    <div key={s.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2 }}>{s.title}</div>
                          <div style={{ fontSize: 11, color: C.muted }}>
                            {fmtDateNL(s.starts_at_ms)}
                            {s.location ? ` · ${s.location}` : ''}
                            {s.trainer_name ? ` · ${s.trainer_name}` : ''}
                          </div>
                        </div>
                        <button
                          onClick={() => !isFull && !isEnrolling && handleEnroll(s.id)}
                          disabled={isFull || isEnrolling}
                          style={{ flexShrink: 0, padding: "7px 13px", borderRadius: 10, border: "none", background: isFull ? C.border : 'rgba(var(--accent-rgb),0.12)', color: isFull ? C.muted : 'var(--accent)', fontFamily: "inherit", fontWeight: 900, fontSize: 11, cursor: (isFull || isEnrolling) ? "not-allowed" : "pointer", opacity: isEnrolling ? 0.6 : 1 }}
                        >
                          {isEnrolling ? "…" : isFull ? "Vol" : "Inschrijven"}
                        </button>
                      </div>
                      {s.max_capacity !== null && (
                        <div style={{ height: 3, borderRadius: 2, background: C.border }}>
                          <div style={{ height: 3, borderRadius: 2, background: isFull ? '#f59e0b' : 'var(--accent)', width: `${pct * 100}%`, transition: "width 0.3s" }} />
                        </div>
                      )}
                      {s.max_capacity !== null && (
                        <div style={{ fontSize: 10, color: C.muted }}>{s.enrolled_count} / {s.max_capacity} ingeschreven</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Sessie credits ── */}
          {clientPackages && clientPackages.length > 0 && (() => {
            const totalRemaining = clientPackages.reduce((s, p) => s + p.sessions_remaining, 0);
            return (
              <div style={{ marginTop: 18, paddingTop: 18, borderTop: `1px solid ${C.border}` }}>
                <div style={{ ...eyebrow, fontSize: 10, color: C.muted, marginBottom: 10 }}>SESSIE CREDITS</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {clientPackages.map(p => {
                    const pct = p.sessions_total > 0 ? p.sessions_remaining / p.sessions_total : 0;
                    const barCol = pct > 0.4 ? 'var(--accent)' : pct > 0.15 ? '#f59e0b' : '#f43f5e';
                    return (
                      <div key={p.id}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{p.package_name}</div>
                          <div style={{ fontSize: 12, color: C.muted }}>{p.sessions_remaining} / {p.sessions_total}</div>
                        </div>
                        <div style={{ height: 4, borderRadius: 2, background: C.border }}>
                          <div style={{ height: 4, borderRadius: 2, background: barCol, width: `${Math.max(0, Math.min(100, pct * 100))}%`, transition: "width 0.4s" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                {totalRemaining === 0 && (
                  <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 10 }}>Geen sessies meer over — vraag je trainer om een nieuw pakket</div>
                )}
              </div>
            );
          })()}
        </Glass>
      )}

      {/* ── Your Programme (trainer-assigned) ── */}
      {trainer && assignments.length > 0 && (() => {
        const todayStr = new Date().toISOString().slice(0, 10);
        return (
          <Glass style={{ padding: 20, marginBottom: 16 }}>
            <div style={{ ...eyebrow, color: C.muted, marginBottom: 14 }}>{t("YOUR PROGRAMME")}</div>
            {assignments.map(a => {
              const sessions = a.sessions ?? [];
              const completed = sessions.filter(s => s.status === 'completed').length;
              const total = sessions.length;
              const pct = total > 0 ? Math.round(completed / total * 100) : 0;
              const todayIdx = sessions.findIndex(s => s.scheduled_date === todayStr);
              const firstFutureIdx = sessions.findIndex(s => s.scheduled_date > todayStr);
              const pivotIdx = todayIdx >= 0 ? todayIdx : firstFutureIdx >= 0 ? firstFutureIdx : sessions.length;
              const startIdx = Math.max(0, pivotIdx - 1);
              const visible = sessions.slice(startIdx, startIdx + 5);
              return (
                <div key={a.id} style={{ marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 900, color: C.text }}>{a.program_name}</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                        {a.gym_name} · {a.sessions_per_week}x/week · {a.duration_weeks} weeks
                      </div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', flexShrink: 0, marginLeft: 12 }}>
                      {completed}/{total}
                    </div>
                  </div>
                  <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)', marginBottom: 12 }}>
                    <div style={{ height: '100%', borderRadius: 2, background: 'var(--accent)', width: `${pct}%` }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {visible.map(s => {
                      const isToday = s.scheduled_date === todayStr;
                      const isPast = s.scheduled_date < todayStr;
                      const done = s.status === 'completed';
                      const missed = s.status === 'missed';
                      const statusColor = done ? '#22c55e' : missed ? '#ef4444' : isToday ? 'var(--accent)' : C.muted;
                      const statusIcon = done ? '✓' : missed ? '✕' : isToday ? '→' : '·';
                      const d = new Date(s.scheduled_date + 'T12:00:00');
                      const dateLabel = isToday ? 'Today' : d.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' });
                      return (
                        <div key={s.id} style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: isToday ? '10px 12px' : '7px 12px',
                          borderRadius: 10,
                          background: isToday ? 'rgba(var(--accent-rgb),0.08)' : 'rgba(255,255,255,0.02)',
                          border: `1px solid ${isToday ? 'var(--accent-border)' : C.border}`,
                        }}>
                          <span style={{ fontSize: 13, fontWeight: 900, color: statusColor, width: 14, textAlign: 'center', flexShrink: 0 }}>{statusIcon}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: isToday ? 800 : 600, color: isToday ? C.text : isPast ? C.subtle : C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {s.session_name ?? 'Session'}
                            </div>
                            <div style={{ fontSize: 11, color: C.subtle }}>{dateLabel}</div>
                          </div>
                          {isToday && s.status === 'scheduled' && (
                            <button
                              onClick={() => setView('today')}
                              style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0, flexShrink: 0 }}
                            >
                              Start →
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </Glass>
        );
      })()}

      {/* ── Ons team ── */}
      {gymTeam && gymTeam.length > 1 && (
        <Glass style={{ padding: 20, marginBottom: 16 }}>
          <div style={{ ...eyebrow, color: C.muted, marginBottom: 14 }}>ONS TEAM</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {gymTeam.map(t => (
              <button
                key={t.user_id}
                onClick={() => setProfileSheet(t)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, border: `1px solid ${t.is_assigned ? "var(--accent-border)" : C.border}`, background: t.is_assigned ? "rgba(var(--accent-rgb),0.06)" : "rgba(255,255,255,0.03)", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, background: C.subtle, flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {t.photo_url
                    ? <img src={t.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ fontSize: 16, color: C.muted }}>👤</span>}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2 }}>
                    {t.display_name ?? "Trainer"}
                    {t.is_assigned && <span style={{ marginLeft: 6, fontSize: 10, color: "var(--accent)", fontWeight: 900 }}>JOUW</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", fontSize: 11, color: C.muted }}>
                    {availDot(t.availability_status)}
                    {t.availability_status === 'available' ? "Beschikbaar" : t.availability_status === 'busy' ? "Bezig" : "Offline"}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Glass>
      )}

      {/* ── Active support reply ── */}
      {activeSupport?.status === 'accepted' && activeSupport.reply_message && (
        <Glass style={{ padding: "16px 20px", marginBottom: 16, border: "1px solid rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.05)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#22c55e", marginBottom: 6 }}>✓ {activeSupport.accepted_by?.display_name ?? "Trainer"} heeft gereageerd</div>
          <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5, fontStyle: "italic" }}>"{activeSupport.reply_message}"</div>
        </Glass>
      )}

      {/* ── Support sheet ── */}
      {supportSheet && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} onClick={() => setSupportSheet(false)} />
          <div style={{ position: "relative", background: "#0f172a", borderRadius: "20px 20px 0 0", padding: "24px 20px 40px", maxHeight: "85dvh", overflowY: "auto" }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: C.subtle, margin: "0 auto 20px" }} />
            {activeSupport ? (
              <>
                <div style={{ ...eyebrow, color: C.muted, marginBottom: 16 }}>HULPVERZOEK</div>
                {activeSupport.status === 'accepted' && activeSupport.reply_message ? (
                  <>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#22c55e", marginBottom: 8 }}>✓ {activeSupport.accepted_by?.display_name ?? "Trainer"} heeft gereageerd</div>
                    <div style={{ fontSize: 14, color: C.text, lineHeight: 1.6, fontStyle: "italic", marginBottom: 16 }}>"{activeSupport.reply_message}"</div>
                  </>
                ) : activeSupport.status === 'accepted' ? (
                  <div style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>◐ {activeSupport.accepted_by?.display_name ?? "Trainer"} is bereikbaar en helpt je zo.</div>
                ) : (
                  <div style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>● Wachten op reactie van een trainer…</div>
                )}
                <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, fontSize: 13, color: C.muted, marginBottom: 16 }}>
                  Jouw vraag: "{activeSupport.message}"
                </div>
                <button onClick={() => setSupportSheet(false)} style={{ width: "100%", padding: "13px", borderRadius: 12, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.04)", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 700, color: C.muted }}>
                  Sluiten
                </button>
              </>
            ) : (
              <>
                <div style={{ ...eyebrow, color: C.muted, marginBottom: 16 }}>VRAAG OM HULP</div>
                {trainer && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}` }}>
                    {availDot(trainer.availability_status)}
                    <span style={{ fontSize: 13, color: C.muted }}>{trainer.display_name ?? "Trainer"} — {trainer.availability_status === 'available' ? "Beschikbaar" : "Bezig"}</span>
                  </div>
                )}
                <textarea
                  value={supportMsg}
                  onChange={e => setSupportMsg(e.target.value)}
                  placeholder="Schrijf je vraag…"
                  maxLength={500}
                  rows={4}
                  style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, color: C.text, fontSize: 14, fontFamily: "inherit", resize: "none", boxSizing: "border-box", marginBottom: 6 }}
                />
                <div style={{ fontSize: 11, color: C.muted, textAlign: "right", marginBottom: 12 }}>{supportMsg.length} / 500</div>
                {gymModel === 'zzp' && gymTeam && gymTeam.filter(t => !t.is_assigned && t.availability_status !== 'offline').length > 0 && (
                  <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 16, cursor: "pointer" }}>
                    <input type="checkbox" checked={supportBroadcast} onChange={e => setSupportBroadcast(e.target.checked)} style={{ marginTop: 2 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.muted }}>Stuur naar alle beschikbare trainers</div>
                      <div style={{ fontSize: 11, color: C.subtle, marginTop: 2 }}>Jouw trainingsdata is dan zichtbaar voor de trainer die reageert.</div>
                    </div>
                  </label>
                )}
                {supportError && <div style={{ fontSize: 12, color: "#ef4444", marginBottom: 10 }}>{supportError}</div>}
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setSupportSheet(false)} style={{ flex: 1, padding: "13px", borderRadius: 12, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.04)", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 700, color: C.muted }}>Annuleren</button>
                  <button onClick={handleSendSupport} disabled={supportSending || !supportMsg.trim()} style={{ flex: 2, padding: "13px", borderRadius: 12, border: "none", background: supportMsg.trim() ? "var(--accent)" : C.subtle, cursor: supportMsg.trim() ? "pointer" : "default", fontFamily: "inherit", fontSize: 14, fontWeight: 700, color: supportMsg.trim() ? "#fff" : C.muted }}>
                    {supportSending ? "Versturen…" : "Verstuur →"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Switch sheet ── */}
      {switchSheet && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} onClick={() => setSwitchSheet(false)} />
          <div style={{ position: "relative", background: "#0f172a", borderRadius: "20px 20px 0 0", padding: "24px 20px 40px", maxHeight: "85dvh", overflowY: "auto" }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: C.subtle, margin: "0 auto 20px" }} />
            {switchStep === "select" ? (
              <>
                <div style={{ ...eyebrow, color: C.muted, marginBottom: 16 }}>WISSEL VAN TRAINER</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                  {(gymTeam ?? []).filter(t => !t.is_assigned).map(t => {
                    const clientLoad = "Gemiddeld"; // TODO: use real bucket when available
                    return (
                      <button
                        key={t.user_id}
                        onClick={() => { setSwitchTarget(t); setSwitchStep("message"); setSwitchError(null); }}
                        style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 14, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.03)", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}
                      >
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: C.subtle, flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {t.photo_url ? <img src={t.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 18, color: C.muted }}>👤</span>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{t.display_name}</div>
                          {t.specialties?.length > 0 && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{t.specialties.slice(0, 2).join(" · ")}</div>}
                          <div style={{ fontSize: 11, color: C.subtle, marginTop: 2 }}>Beschikbaarheid: {clientLoad}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <button onClick={() => setSwitchSheet(false)} style={{ width: "100%", padding: "13px", borderRadius: 12, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.04)", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 700, color: C.muted }}>Annuleren</button>
              </>
            ) : (
              <>
                <div style={{ ...eyebrow, color: C.muted, marginBottom: 16 }}>VERZOEK AAN {(switchTarget?.display_name ?? "TRAINER").toUpperCase()}</div>
                <textarea
                  value={switchMsg}
                  onChange={e => setSwitchMsg(e.target.value)}
                  placeholder="Optioneel bericht aan de gym…"
                  maxLength={300}
                  rows={3}
                  style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, color: C.text, fontSize: 14, fontFamily: "inherit", resize: "none", boxSizing: "border-box", marginBottom: 12 }}
                />
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 16, padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}` }}>
                  {gymModel === 'zzp'
                    ? `Je verzoek gaat naar jouw huidige trainer${trainer?.display_name ? ", " + trainer.display_name : ""}.`
                    : "Je verzoek gaat naar de eigenaar van de gym. Je hoort zo snel mogelijk terug."}
                </div>
                {switchError && <div style={{ fontSize: 12, color: "#ef4444", marginBottom: 10 }}>{switchError}</div>}
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setSwitchStep("select")} style={{ flex: 1, padding: "13px", borderRadius: 12, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.04)", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 700, color: C.muted }}>Terug</button>
                  <button onClick={handleSendSwitch} disabled={switchSending} style={{ flex: 2, padding: "13px", borderRadius: 12, border: "none", background: "var(--accent)", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 700, color: "#fff" }}>
                    {switchSending ? "Versturen…" : "Verstuur verzoek →"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Team member profile sheet ── */}
      {profileSheet && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} onClick={() => setProfileSheet(null)} />
          <div style={{ position: "relative", background: "#0f172a", borderRadius: "20px 20px 0 0", padding: "24px 20px 48px", maxHeight: "80dvh", overflowY: "auto" }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: C.subtle, margin: "0 auto 24px" }} />
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 16 }}>
              <div style={{ width: 72, height: 72, borderRadius: 18, background: C.subtle, flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {profileSheet.photo_url ? <img src={profileSheet.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 30, color: C.muted }}>👤</span>}
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 900, color: C.text, marginBottom: 4 }}>{profileSheet.display_name ?? "Trainer"}</div>
                {profileSheet.specialties?.length > 0 && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {profileSheet.specialties.map(s => (
                      <span key={s} style={{ padding: "3px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, color: C.muted }}>{s}</span>
                    ))}
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", fontSize: 12, color: C.muted, marginTop: 6 }}>
                  {availDot(profileSheet.availability_status)}
                  {profileSheet.availability_status === 'available' ? "Beschikbaar" : profileSheet.availability_status === 'busy' ? "Bezig" : "Offline"}
                </div>
              </div>
            </div>
            {profileSheet.bio && (
              <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, fontStyle: "italic", marginBottom: 20 }}>"{profileSheet.bio}"</div>
            )}
            <button onClick={() => setProfileSheet(null)} style={{ width: "100%", padding: "13px", borderRadius: 12, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.04)", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 700, color: C.muted }}>Sluiten</button>
          </div>
        </div>
      )}

      <button
        onClick={() => onWeeklyPlan()}
        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 13, fontWeight: 700, color: C.muted, fontFamily: "inherit" }}
      >
        {t("Weekly plan →")}
      </button>

      {/* ── Berichten bottom sheet ── */}
      {msgSheet && (
        <>
          <div onClick={() => setMsgSheet(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 40 }} />
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50, background: "#0f172a", borderRadius: "24px 24px 0 0", padding: "0 0 env(safe-area-inset-bottom)", maxHeight: "80dvh", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px 12px" }}>
              <div style={{ fontSize: 15, fontWeight: 900, color: C.text }}>
                {trainer?.display_name ?? "Trainer"} — Berichten
              </div>
              <button onClick={() => setMsgSheet(false)} style={{ background: "none", border: "none", color: C.muted, fontSize: 18, cursor: "pointer", padding: 4 }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
              {msgLoading && <div style={{ fontSize: 13, color: C.muted, textAlign: "center", marginTop: 24 }}>Laden…</div>}
              {!msgLoading && messages.length === 0 && (
                <div style={{ fontSize: 13, color: C.muted, textAlign: "center", marginTop: 24 }}>Nog geen berichten. Stuur je trainer een bericht!</div>
              )}
              {messages.map(m => (
                <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: m.is_mine ? "flex-end" : "flex-start" }}>
                  <div style={{ maxWidth: "78%", padding: "10px 13px", borderRadius: m.is_mine ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: m.is_mine ? 'var(--accent)' : C.bgCard, border: m.is_mine ? "none" : `1px solid ${C.border}`, fontSize: 13, color: m.is_mine ? "#020617" : C.text, lineHeight: 1.5 }}>
                    {m.body}
                  </div>
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 3, paddingLeft: 4, paddingRight: 4 }}>
                    {(() => { const d = new Date(m.sent_at_ms); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; })()}
                  </div>
                </div>
              ))}
            </div>
            {msgError && <div style={{ fontSize: 11, color: "#f43f5e", padding: "0 20px 8px" }}>{msgError}</div>}
            <div style={{ display: "flex", gap: 8, padding: "8px 16px 16px", borderTop: `1px solid ${C.border}` }}>
              <input
                value={msgInput}
                onChange={e => setMsgInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                placeholder="Stuur een bericht…"
                maxLength={1000}
                style={{ flex: 1, padding: "10px 14px", borderRadius: 12, border: `1px solid ${C.border}`, background: C.bgCard, color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none" }}
              />
              <button
                onClick={handleSendMessage}
                disabled={msgSending || !msgInput.trim()}
                style={{ padding: "10px 16px", borderRadius: 12, border: "none", background: 'var(--accent)', color: "#020617", fontFamily: "inherit", fontWeight: 900, fontSize: 13, cursor: (msgSending || !msgInput.trim()) ? "not-allowed" : "pointer", opacity: (msgSending || !msgInput.trim()) ? 0.5 : 1 }}
              >
                {msgSending ? "…" : "→"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
