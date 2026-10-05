import { useState, useEffect, useCallback, useRef, lazy, Suspense } from "react";
import { AppShellContext } from "./AppShellContext.js";
import TrainerInviteScreen from "./TrainerInviteScreen.jsx";
import ConnectScreen from "./ConnectScreen.jsx";
import PendingInviteModal from "./PendingInviteModal.jsx";

// ─── SHARED MODULES ───────────────────────────────────────────────────────────
import { C, applyAccent, applyTheme, watchSystemTheme, THEME_STORAGE_KEY } from "./tokens.js";
import { LEGAL_VERSIONS } from "./appConstants.js";
import { Icons } from "./icons.jsx";
import { getUserId, getJwtPayload } from "./planUtils.js";
import api from "./apiClient.js";
import { t, useLang } from "./i18n.js";
import { reportError } from "./errorReporter.js";
import { logout } from "./authHelpers.js";
import { cachePlan, getCachedPlan, queueMutation, getPendingMutations, removeMutation, purgeExpiredMutations } from "./offlineCache.js";

// ─── VIEW COMPONENTS ──────────────────────────────────────────────────────────
// WorkoutView: active workout path — split into its own chunk, but the import()
// starts at module scope so the fetch runs in parallel with first render. Same
// network timing as an eager import (chunk is always loaded long before a workout
// can start — check-in comes first), while keeping its parse cost out of the
// critical main chunk. Do NOT change this to a plain lazy(() => import(...)):
// that would defer the fetch to workout start and break offline sessions.
const workoutViewPromise = import("./WorkoutView.jsx");
const WorkoutView = lazy(() => workoutViewPromise);
// HistoryView and PlanWeekView: secondary tabs — lazy loaded for bundle reduction
const HistoryView   = lazy(() => import("./HistoryView.jsx"));
const PlanWeekView  = lazy(() => import("./PlanWeekView.jsx"));
// AwardsView and SettingsView: rarely visited — lazy loaded
const AwardsView    = lazy(() => import("./AwardsView.jsx"));
const SettingsView  = lazy(() => import("./SettingsView.jsx"));
const ProGate       = lazy(() => import("./ProGate.jsx"));
// CoachView: large secondary tab — lazy loaded for bundle reduction
const CoachView     = lazy(() => import("./CoachView.jsx"));
const AssessmentView = lazy(() => import("./AssessmentView.jsx"));
// W4.2 — "Ik doe iets anders". Lazy: only loaded when someone opens it.
const SessionBuilder = lazy(() => import("./SessionBuilder.jsx"));

// F4 — moved out of App.jsx. Dashboard is the first screen and CheckInModal is
// the daily entry point: both start their import at module scope (the
// WorkoutView pattern) so the chunk loads in parallel with first render.
const dashboardPromise = import("./Dashboard.jsx");
const Dashboard = lazy(() => dashboardPromise);
const checkInModalPromise = import("./CheckInModal.jsx");
const CheckInModal = lazy(() => checkInModalPromise);
// First-run and occasional sheets — loaded when shown.
const OnboardingModal = lazy(() => import("./OnboardingModal.jsx"));
const PathChoiceModal = lazy(() => import("./PathChoiceModal.jsx"));
const WhyNotModal = lazy(() => import("./WhyNotModal.jsx"));
const GuestConvertModal = lazy(() => import("./GuestConvertModal.jsx"));
import Nav from "./Nav.jsx";

// ─── APPLY SAVED ACCENT BEFORE FIRST RENDER ─────────────────────────────────
applyAccent(localStorage.getItem("jf_accent") ?? "#10b981");
// Theme before first paint, so the app never flashes the wrong ground colour.
// index.html runs the same resolution inline for the pre-bundle window.
applyTheme(localStorage.getItem(THEME_STORAGE_KEY) ?? "system");
// "system" stays live: a sunset switch applies without a reload.
watchSystemTheme(() => localStorage.getItem(THEME_STORAGE_KEY) ?? "system");

const APP_VERSION = "2";

// ─── PREGNANCY PROGRESS BANNER ───────────────────────────────────────────────
const PREGNANCY_MILESTONES = [
  { week: 4,  msg: "Week 4 · Your baby is the size of a poppy seed. Movement is good — keep it gentle." },
  { week: 8,  msg: "Week 8 · First trimester well underway. Listen to your body — rest counts too." },
  { week: 13, msg: "Week 13 · Welcome to the second trimester. Energy often improves from here." },
  { week: 16, msg: "Week 16 · Time to move away from exercises lying flat on your back." },
  { week: 20, msg: "Week 20 · Halfway there. Your sessions are adapting with you." },
  { week: 24, msg: "Week 24 · Pelvic floor work pays dividends now and after birth." },
  { week: 28, msg: "Week 28 · Third trimester begins. Slower and steadier — you're doing brilliantly." },
  { week: 32, msg: "Week 32 · Breathlessness is normal. Short breaks are part of the session." },
  { week: 36, msg: "Week 36 · Practise your labour breathing — it's the most useful thing now." },
  { week: 40, msg: "Week 40 · Due any day. Movement can help — rest when you need to." },
];

const POSTNATAL_MILESTONES = [
  { day: 3,   msg: "Day 3 · Rest and pelvic floor breathing. That's everything right now." },
  { day: 7,   msg: "Week 1 · Gentle heel slides and pelvic tilts are a great start." },
  { day: 14,  msg: "Week 2 · Your body is healing quietly. Every breath counts." },
  { day: 42,  msg: "Week 6 · Time to check in with your midwife or GP about exercise clearance." },
  { day: 84,  msg: "Week 12 · Core rebuilding is underway. Take it one week at a time." },
  { day: 140, msg: "Week 20 · Great progress. Strength is returning." },
  { day: 182, msg: "Week 26 · You're in the returning phase. Full programme available when you're ready." },
];

function PregnancyProgressBanner({ cycle }) {
  const _uid = getUserId();
  const _msKey = _uid ? `jf_milestone_dismissed_${_uid}` : 'jf_milestone_dismissed';
  const [dismissed, setDismissed] = useState(() => {
    try {
      // best-effort migration: read namespaced key, fall back to legacy global key
      return JSON.parse(localStorage.getItem(_msKey) || localStorage.getItem('jf_milestone_dismissed') || "{}");
    } catch { return {}; }
  });

  if (!cycle) return null;
  const mode = cycle.mode ?? "standard";

  if (mode === "pregnant") {
    const week = cycle.pregnancy_week;
    const trimester = cycle.trimester;
    if (!week) return null;

    // Find current milestone
    const milestone = [...PREGNANCY_MILESTONES].reverse().find(m => week >= m.week);
    const milestoneKey = milestone ? `p_w${milestone.week}` : null;
    const showMilestone = milestone && !dismissed[milestoneKey];

    const pct = Math.min(100, Math.round((week / 40) * 100));
    const T_COLORS = { 1: "var(--accent)", 2: C.warningBright, 3: "#f97316" };
    const barColor = T_COLORS[trimester] ?? C.warningBright;

    return (
      <div style={{ marginBottom: 20 }}>
        <div style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.18)", borderRadius: 16, padding: "14px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.warningBright }}>Week {week} of your pregnancy</div>
            <div style={{ fontSize: 11, color: "rgba(251,191,36,0.6)", fontWeight: 700 }}>Trimester {trimester}</div>
          </div>
          <div style={{ height: 5, background: "rgba(var(--overlay-rgb),0.07)", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: 999, transition: "width 0.5s" }} />
          </div>
          {showMilestone && (
            <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
              <div style={{ fontSize: 12, color: "rgba(251,191,36,0.85)", lineHeight: 1.6, flex: 1 }}>{milestone.msg}</div>
              <button
                onClick={() => {
                  const updated = { ...dismissed, [milestoneKey]: true };
                  setDismissed(updated);
                  localStorage.setItem(_msKey, JSON.stringify(updated));
                }}
                style={{ fontSize: 11, color: C.muted, background: "none", border: "none", cursor: "pointer", padding: "2px 0", flexShrink: 0 }}
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (mode === "perimenopause") {
    return (
      <div style={{ marginBottom: 20 }}>
        <div style={{ background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: 16, padding: "14px 16px" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#a78bfa", marginBottom: 3 }}>Perimenopause mode</div>
          <div style={{ fontSize: 11, color: "rgba(167,139,250,0.65)", lineHeight: 1.5 }}>Intensity capped at moderate · stress threshold lowered · cycle phase rules paused</div>
        </div>
      </div>
    );
  }

  if (mode === "postnatal") {
    const birthDate = cycle.postnatal_birth_date;
    if (!birthDate) return null;
    const daysSince = Math.floor((new Date() - new Date(birthDate)) / (1000 * 60 * 60 * 24));
    const postnatalPhase = cycle.postnatal_phase;

    const milestone = [...POSTNATAL_MILESTONES].reverse().find(m => daysSince >= m.day);
    const milestoneKey = milestone ? `pn_d${milestone.day}` : null;
    const showMilestone = milestone && !dismissed[milestoneKey];

    const PHASE_LABELS_PN = {
      immediate: "Immediate recovery",
      early: "Early recovery",
      rebuilding: "Rebuilding",
      strengthening: "Strengthening",
      returning: "Returning to fitness",
    };

    return (
      <div style={{ marginBottom: 20 }}>
        <div style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.15)", borderRadius: 16, padding: "14px 16px" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.warningBright, marginBottom: 3 }}>
            {PHASE_LABELS_PN[postnatalPhase] ?? "Postnatal recovery"}
          </div>
          <div style={{ fontSize: 11, color: "rgba(251,191,36,0.6)" }}>Day {daysSince} after birth</div>
          {showMilestone && (
            <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
              <div style={{ fontSize: 12, color: "rgba(251,191,36,0.85)", lineHeight: 1.6, flex: 1 }}>{milestone.msg}</div>
              <button
                onClick={() => {
                  const updated = { ...dismissed, [milestoneKey]: true };
                  setDismissed(updated);
                  localStorage.setItem(_msKey, JSON.stringify(updated));
                }}
                style={{ fontSize: 11, color: C.muted, background: "none", border: "none", cursor: "pointer", padding: "2px 0", flexShrink: 0 }}
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  useLang();
  const userId = getUserId();
  // Kept only because many child props are still named `token`. The API layer
  // ignores it — authentication is the __Host-jf_session cookie (C-B17).
  const token = null;
  // Namespace user-scoped localStorage keys so multiple accounts on one device don't share state
  const uKey = (k) => userId ? `${k}_${userId}` : k;
  const shellValue = { token, userId };

  useEffect(() => {
    const toLogin = (reason) => {
      // Preserve any trainer invite token across the login redirect
      const _p = new URLSearchParams(window.location.search);
      const _inviteParam = _p.get('t') || _p.get('invite');
      if (_inviteParam) sessionStorage.setItem('jf_pending_invite', _inviteParam);
      reportError('auth_failure', reason);
      window.location.href = "/login.html";
    };
    if (!userId) { toLogin('missing session on app load'); return; }
    // Session lives in the HttpOnly cookie (C-B17) — verify it server-side.
    // Network errors keep the app open: offline mode must survive a failed verify.
    fetch('/api/auth').then(async (res) => {
      if (res.status === 401) {
        ["jf_token", "jf_user_id"].forEach(k => localStorage.removeItem(k));
        toLogin('invalid session on app load');
      } else if (res.ok) {
        const d = await res.json().catch(() => null);
        if (d && d.valid) setHasEmail(!!d.email);
      }
    }).catch(() => {});
    // userId is read from localStorage at render time (not React state).
    // It is session-stable; the page reloads on logout so this is safe as mount-only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fonts are loaded from index.html <head> (id="jf-fonts") so the CSS fetch
  // starts in parallel with the JS bundle — do not re-inject them here.

  const today = new Date().toISOString().split("T")[0];

  const [view, setView] = useState("today");
  const [inWorkout, setInWorkout] = useState(false);
  // Fitness assessment overlay. Config is fetched by HistoryView and handed over,
  // so the runner never renders before it knows the battery.
  const [assessmentConfig, setAssessmentConfig] = useState(null);

  // R598 — "recalibrate" schedules the measurement into today's training. On a day the user
  // wrote, W4.1 keeps their session: mark the offer on it and say why (F8).
  const handleForceAssessment = async () => {
    const { plan: fresh, preserved } = await api.forceAssessment(userId, today);
    setPlan(preserved ? { ...fresh, assessment_offer: true } : fresh); setView("today");
    if (preserved) { setActivityToast(t("You built today's session yourself, so it stays as it is; add the self-measurement with the button under your session.")); setTimeout(() => setActivityToast(""), 7000); }
    return fresh;
  };

  // The Trophy room is reachable from Progress and from Settings, so its back
  // control has to return to whichever one you actually came from.
  const [awardsOrigin, setAwardsOrigin] = useState("history");
  const openAwards = (from) => { setAwardsOrigin(from); setView("awards"); };
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [plan, setPlan] = useState(null);
  const [planError, setPlanError] = useState(null);
  const [score, setScore] = useState(0);
  const [prevScore, setPrevScore] = useState(0);
  const [history, setHistory] = useState([]);
  const [historyTruncated, setHistoryTruncated] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progression, setProgression] = useState(null);
  const [isLoadingProgression, setIsLoadingProgression] = useState(false);
  const [cyclingPmc, setCyclingPmc] = useState(null);
  const [trainerData, setTrainerData] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [clientSessions, setClientSessions] = useState([]);
  const [availableSessions, setAvailableSessions] = useState([]);
  const [clientPackages, setClientPackages] = useState([]);
  const [ftpSnoozedUntil, setFtpSnoozedUntil] = useState(() =>
    parseInt(localStorage.getItem(uKey('jf_ftp_snooze_until')) || localStorage.getItem('jf_ftp_snooze_until') || '0')
  );

  // No-email banner: shown when user has no email set (guest or registered without email)
  // Assume email exists until the session verify responds — avoids flashing the
  // "add your email" banner for registered users. Legacy localStorage tokens (pre-C-B17)
  // still carry the payload and give the right answer synchronously.
  const [hasEmail, setHasEmail] = useState(() => {
    const legacy = getJwtPayload(token);
    return legacy ? !!legacy.email : true;
  });
  const [showGuestConvert, setShowGuestConvert] = useState(false);
  const [emailBannerDismissed, setEmailBannerDismissed] = useState(() => {
    const ts = parseInt(localStorage.getItem(uKey('jf_email_banner_dismissed')) || localStorage.getItem('jf_email_banner_dismissed') || '0');
    return ts > Date.now() - 24 * 60 * 60 * 1000;
  });
  // Trainer message dismiss: stored as the sent_at_ms we dismissed, so new messages auto-show
  const [trainerMsgDismissedAt, setTrainerMsgDismissedAt] = useState(() =>
    parseInt(localStorage.getItem(uKey('jf_trainer_msg_dismissed')) || '0')
  );

  // Post-workout state
  const [todayCompleted, setTodayCompleted] = useState(
    () => localStorage.getItem(`jf_completed_${today}`) === "1"
  );
  const [completedSession, setCompletedSession] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`jf_completed_session_${today}`) || "null"); }
    catch { return null; }
  });
  const [bonusDone, setBonusDone] = useState(
    () => localStorage.getItem(`jf_bonus_${today}`) === "1"
  );
  const [activityToast, setActivityToast] = useState("");
  // ── UX-8 — install prompt ────────────────────────────────────────────────────
  // Captured on load, offered only after the 3rd completed workout: a high-intent
  // moment, not a gate on someone still deciding whether the app is for them.
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installDismissed, setInstallDismissed] = useState(() => {
    try { return localStorage.getItem("jf_install_dismissed") === "1"; } catch { return false; }
  });

  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); setInstallPrompt(e); };
    const onInstalled = () => {
      setInstallPrompt(null);
      try { localStorage.setItem("jf_install_dismissed", "1"); } catch { /* private mode */ }
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);
  const [showWhyNot, setShowWhyNot] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  // W4.3 — saved trainings, and what the builder opens with (a template to
  // edit, and the safety notes of a one-tap use that needs an acknowledgement).
  const [myTemplates, setMyTemplates] = useState([]);
  const [builderTemplate, setBuilderTemplate] = useState(null);
  const [builderNotes, setBuilderNotes] = useState(null);
  const openBuilder = (tpl = null, notes = null) => {
    setBuilderTemplate(tpl); setBuilderNotes(notes); setShowBuilder(true);
  };
  // Score + history after a save outside WorkoutView (activity, rest day, a session logged afterwards).
  const refreshScoreHistory = useCallback(async () => {
    const [s, h] = await Promise.all([api.getScore(), api.getHistory()]);
    setScore(s); setHistory(h.results); setHistoryTruncated(!!h.truncated);
  }, []);
  // Need C — a session logged from PlanWeekView (today … today−6).
  const handleLogged = async (date) => {
    await refreshScoreHistory().catch((e) => console.error("Refresh after logging failed:", e));
    if (date === today) { setTodayCompleted(true); localStorage.setItem(`jf_completed_${today}`, "1"); }
  };
  const handleTemplateSaved = (tpl) => setMyTemplates((list) => [tpl, ...list.filter((x) => x.id !== tpl.id)]);
  const handleDeleteTemplate = async (tpl) => {
    let ok = false;
    try { ok = await api.deleteMySession(tpl.id); } catch { ok = false; }
    if (ok) setMyTemplates((list) => list.filter((x) => x.id !== tpl.id));
    return ok;
  };
  const [inBonusWorkout, setInBonusWorkout] = useState(false);
  const [bonusPlan, setBonusPlan] = useState(null);

  // Cooper test modal (shown after military cooper_test session completes)
  const [showCooperModal, setShowCooperModal] = useState(false);
  const [cooperPending, setCooperPending] = useState(null); // { durationSec, perceivedExertion, stepsActual }
  const [cooperDistance, setCooperDistance] = useState("");

  // Terms acceptance gate (shown to existing users who haven't accepted current policy version)
  const [needsTermsGate, setNeedsTermsGate] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsAccepting, setTermsAccepting] = useState(false);
  const [termsAcceptError, setTermsAcceptError] = useState(null);

  // Path choice (shown after first onboarding OR for existing users without primary_intent)
  const [showPathChoice, setShowPathChoice] = useState(false);

  // Pending trainer invite token (from ?invite= on signup URL, resolved post-onboarding)
  const [pendingInviteToken, setPendingInviteToken] = useState(null);

  // Onboarding flow
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingReady, setOnboardingReady] = useState(false);
  const [prefs, setPrefs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("jf_prefs") || "{}");
    } catch {
      return {};
    }
  });

  // Captures checkin_mode and isPro from server before setting onboardingReady —
  // avoids stale prefs closure in the check-in effect without making it re-trigger on prefs changes.
  const checkinModeRef = useRef(null);
  const isProRef = useRef(prefs.isPro ?? false);
  useEffect(() => { isProRef.current = prefs.isPro ?? false; }, [prefs.isPro]);

  // Entitlement-based isPro (from /api/subscribe) — authoritative for UI gating
  const [isPro, setIsPro] = useState(() => !!(prefs.isPro ?? false));
  const [earlyBirdRemaining, setEarlyBirdRemaining] = useState(null);
  const [lastCheckin, setLastCheckin] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    try {
      localStorage.setItem("jf_prefs", JSON.stringify(prefs));
    } catch { /* ignore */ }
  }, [prefs]);

  // After profile load: apply prefs and advance to ready state
  function handleProfileLoaded(data) {
    // Apply accent from server if present
    if (data.preferences?.accent) {
      localStorage.setItem("jf_accent", data.preferences.accent);
      applyAccent(data.preferences.accent);
      // Theme follows the account to a new device. localStorage wins on this
      // device only until the profile arrives.
      if (data.preferences.theme) {
        localStorage.setItem(THEME_STORAGE_KEY, data.preferences.theme);
        applyTheme(data.preferences.theme);
      }
    }
    setPrefs((p) => ({
      ...p, ...data, exists: undefined,
      isPro: data.preferences?.isPro ?? p.isPro ?? false,
      daily_replan: data.preferences?.daily_replan ?? p.daily_replan ?? false,
    }));
    // Pin mode and isPro before setting onboardingReady so the check-in effect reads fresh data
    checkinModeRef.current = data.preferences?.checkin_mode ?? "once_a_day";
    isProRef.current = data.preferences?.isPro ?? false;
    // Fetch last check-in to pre-fill next check-in modal
    api.getLastCheckin(userId).then(setLastCheckin).catch(() => {});
    // Show terms gate if this user hasn't accepted the current policy version yet
    if (data.needsTermsAcceptance) {
      setNeedsTermsGate(true);
    }
    // Show path choice for users who haven't set a primary_intent yet
    if (!data.preferences?.primary_intent) {
      setShowPathChoice(true);
    }
    setOnboardingReady(true);
  }

  // Cross-tab session sync: if another tab clears the session keys (logout), follow immediately
  useEffect(() => {
    const handleStorage = (e) => {
      if ((e.key === 'jf_token' || e.key === 'jf_user_id') && !e.newValue) logout();
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // On mount: handle email_verified / email_changed / Strava OAuth callback redirect params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("email_verified")) {
      setActivityToast("Email verified ✓");
      setTimeout(() => setActivityToast(""), 4000);
      window.history.replaceState({}, "", "/");
    } else if (params.get("email_changed")) {
      setActivityToast("Email address updated ✓");
      setTimeout(() => setActivityToast(""), 4000);
      setPrefs((p) => ({ ...p, email_verified: true }));
      window.history.replaceState({}, "", "/");
    } else if (params.get("verify_error")) {
      setActivityToast("Verification link invalid or expired");
      setTimeout(() => setActivityToast(""), 5000);
      window.history.replaceState({}, "", "/");
    } else if (params.get("upgrade") === "success") {
      window.history.replaceState({}, "", "/");
      // Refresh entitlement state after Mollie redirect
      api.getSubscription().then(sub => {
        if (sub.isPro) { setIsPro(true); isProRef.current = true; }
        if (sub.early_bird_remaining != null) setEarlyBirdRemaining(sub.early_bird_remaining);
        setActivityToast("Pro geactiveerd! Welkom bij JustFit Pro. 🎉");
        setTimeout(() => setActivityToast(""), 6000);
      }).catch(() => {});
    } else if (params.get("error") && params.get("state")) {
      // Strava sends ?error=access_denied when the athlete declines consent.
      window.history.replaceState({}, "", "/");
      setActivityToast("Strava connection cancelled");
      setTimeout(() => setActivityToast(""), 4000);
    } else if (params.get("code") && params.get("scope")?.includes("activity")) {
      // Strava OAuth callback: exchange code for tokens
      const code  = params.get("code");
      const state = params.get("state");
      window.history.replaceState({}, "", "/");
      // This used to be gated on getToken(), which reads localStorage jf_token.
      // C-B17 moved the session into an HttpOnly cookie and nothing has written
      // jf_token since, so the guard was always false and the Strava code was
      // silently discarded on every single connection attempt. The session is the
      // cookie; exchangeStravaCode ignores the argument.
      {
        api.exchangeStravaCode(null, code, state)
          .then(d => {
            if (d.ok) {
              const name = d.athlete_name ? ` · ${d.athlete_name}` : "";
              setActivityToast(`Strava connected${name} ✓`);
            } else {
              // Surface the server's reason — "try again" is wrong advice for a
              // rejected state token or an app at its athlete capacity. Strava's
              // own detail is appended when it sent one.
              const why = d.strava_detail ? ` (${d.strava_detail})` : "";
              setActivityToast((d.error ?? "Strava connection failed — try again") + why);
            }
            setTimeout(() => setActivityToast(""), 6000);
          })
          .catch((e) => {
            setActivityToast(`Strava connection failed — ${e?.message ?? "no response from the server"}`);
            setTimeout(() => setActivityToast(""), 6000);
          });
      }
    }
  }, []);

  // On mount: load profile → decide full onboarding vs daily flow
  useEffect(() => {
    if (!userId) return;
    api.getProfile(token).then((data) => {
      if (!data.exists) {
        // First-time user
        setShowOnboarding(true);
        return;
      }
      // Inactivity >= 90 days → full re-onboarding
      // Null last_activity_at_ms means the account exists but has no recorded activity yet
      // (e.g. just signed up, or the timestamp wasn't stamped). Do NOT treat null as inactive.
      const lastMs = data.last_activity_at_ms;
      const daysSince = lastMs ? Math.floor((Date.now() - lastMs) / 86_400_000) : 0;
      if (lastMs && daysSince >= 90) {
        setShowOnboarding(true);
        return;
      }
      handleProfileLoaded(data);
      // Fetch entitlement state (isPro from DB, not from preferences flag)
      api.getSubscription().then(sub => {
        if (sub.isPro != null) { setIsPro(sub.isPro); isProRef.current = sub.isPro; }   // entitlements only — preferences.isPro is no longer a thing
        if (sub.early_bird_remaining != null) setEarlyBirdRemaining(sub.early_bird_remaining);
      }).catch(() => {});
    }).catch(() => setOnboardingReady(true));
    // handleProfileLoaded, token, and userId are session-stable: not React state,
    // designed to run once on mount (page reloads on auth changes).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    // Fetch fresh profile before advancing — ensures checkin_mode and all prefs are server-accurate
    api.getProfile(token).then((data) => {
      if (data?.exists) {
        setPrefs({ ...data, exists: undefined });
        checkinModeRef.current = data.preferences?.checkin_mode ?? "once_a_day";
        isProRef.current = data.preferences?.isPro ?? false;
      } else {
        checkinModeRef.current = "once_a_day";
      }
      if (data?.exists && !data.preferences?.primary_intent) {
        setShowPathChoice(true);
      }
      api.getLastCheckin(userId).then(setLastCheckin).catch(() => {});
    }).catch(() => {
      checkinModeRef.current = "once_a_day";
    }).finally(() => {
      // Check for pending trainer invite from signup flow (Sub-flow B)
      const _pi = sessionStorage.getItem('jf_pending_invite');
      if (_pi) { sessionStorage.removeItem('jf_pending_invite'); setPendingInviteToken(_pi); }
      setOnboardingReady(true); // triggers score/history/check-in effects after prefs are loaded
    });
  };

  const handlePathChoiceComplete = (intent) => {
    setShowPathChoice(false);
    setPrefs(p => ({ ...p, preferences: { ...(p.preferences ?? {}), primary_intent: intent } }));
  };

  // Load score, history, and progression from API on mount (only after onboarding done)
  useEffect(() => {
    if (!onboardingReady) return;
    api
      .getScore(userId)
      .then(setScore)
      .catch(() => {});
    setIsLoadingProgression(true);
    api
      .getProgression(token)
      .then((data) => { if (data?.ok) setProgression(data); })
      .catch(() => {})
      .finally(() => setIsLoadingProgression(false));
    api
      .getCyclingPmc(token)
      .then((data) => { if (data?.ok) setCyclingPmc(data); })
      .catch(() => {});
    api
      .getTrainerData(token)
      .then((data) => { if (data && !data.error) setTrainerData(data); })
      .catch(() => {});
    api
      .getSessions(token)
      .then((data) => { if (Array.isArray(data?.sessions)) setClientSessions(data.sessions); })
      .catch(() => {});
    api
      .getAvailableSessions(token)
      .then((data) => { if (Array.isArray(data?.sessions)) setAvailableSessions(data.sessions); })
      .catch(() => {});
    api
      .getMySessions()
      .then((list) => { if (Array.isArray(list)) setMyTemplates(list); })
      .catch(() => {});
    api
      .getClientPackages(token)
      .then((data) => { if (Array.isArray(data?.packages)) setClientPackages(data.packages); })
      .catch(() => {});
    api
      .getAssignments(token)
      .then((data) => { if (Array.isArray(data)) setAssignments(data); })
      .catch(() => {});
    api
      .getHistory(userId)
      .then(({ results: h, truncated }) => {
        setHistory(h);
        setHistoryTruncated(!!truncated);
        // Reconcile completed state against server history (handles cross-device sync)
        const todayExecutions = h.filter((ex) => ex.date === today);
        const hasToday = todayExecutions.length > 0;
        if (!hasToday) {
          // Completed on no device — clear local state
          setTodayCompleted(false);
          setCompletedSession(null);
          localStorage.removeItem(`jf_completed_${today}`);
          localStorage.removeItem(`jf_completed_session_${today}`);
          setBonusDone(false);
          localStorage.removeItem(`jf_bonus_${today}`);
        } else {
          // Completed on some device — mark done on this device too
          const mainSession = todayExecutions.find((ex) => ex.execution_type !== "bonus") ?? todayExecutions[0];
          const bonusSession = todayExecutions.find((ex) => ex.execution_type === "bonus");
          setTodayCompleted(true);
          localStorage.setItem(`jf_completed_${today}`, "1");
          if (mainSession && !localStorage.getItem(`jf_completed_session_${today}`)) {
            const reconstructed = {
              name: mainSession.execution_type ?? "Session",
              duration_sec: mainSession.total_duration_sec ?? 0,
            };
            setCompletedSession(reconstructed);
            localStorage.setItem(`jf_completed_session_${today}`, JSON.stringify(reconstructed));
          }
          if (bonusSession) {
            setBonusDone(true);
            localStorage.setItem(`jf_bonus_${today}`, "1");
          }
        }
      })
      .catch(() => {});
  }, [userId, onboardingReady, today, token]);

  // Auto-sync Strava on app open (30-min cooldown via localStorage)
  useEffect(() => {
    if (!onboardingReady) return;
    const COOLDOWN_MS = 30 * 60 * 1000;
    const lastSync = parseInt(localStorage.getItem(uKey('jf_strava_auto_sync')) || localStorage.getItem('jf_strava_auto_sync') || '0');
    if (Date.now() - lastSync < COOLDOWN_MS) return;
    // Fire-and-forget — check if connected first, then sync
    api.getStravaStatus(token)
      .then(d => {
        if (!d?.connection) return;
        localStorage.setItem(uKey('jf_strava_auto_sync'), String(Date.now()));
        return api.stravaSync(token);
      })
      .catch(() => {});
  // token and uKey are session-stable (derived from localStorage, not React state);
  // re-running on token change is unnecessary and would break the 30-min cooldown logic.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onboardingReady]);

  // Strava sync on app return from background (5-min cooldown — shorter than the 30-min
  // app-open cooldown so users who record a ride then return to JustFit get it imported quickly).
  useEffect(() => {
    if (!onboardingReady) return;
    const VISIBILITY_COOLDOWN_MS = 5 * 60 * 1000;
    const trySync = () => {
      if (document.visibilityState !== 'visible') return;
      const lastSync = parseInt(localStorage.getItem(uKey('jf_strava_auto_sync')) || '0');
      if (Date.now() - lastSync < VISIBILITY_COOLDOWN_MS) return;
      api.getStravaStatus(token)
        .then(d => {
          if (!d?.connection) return;
          localStorage.setItem(uKey('jf_strava_auto_sync'), String(Date.now()));
          return api.stravaSync(token);
        })
        .catch(() => {});
    };
    document.addEventListener('visibilitychange', trySync);
    return () => document.removeEventListener('visibilitychange', trySync);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onboardingReady]);

  // Refresh trainer data (unread message badge) when tab becomes visible again.
  useEffect(() => {
    if (!onboardingReady) return;
    const trySync = () => {
      if (document.visibilityState !== 'visible') return;
      api.getTrainerData(token)
        .then((data) => { if (data && !data.error) setTrainerData(data); })
        .catch(() => {});
    };
    document.addEventListener('visibilitychange', trySync);
    return () => document.removeEventListener('visibilitychange', trySync);
  }, [onboardingReady]);

  // Persist plan to IndexedDB after every successful load/generate for offline fallback.
  useEffect(() => { if (plan) cachePlan(plan); }, [plan]);

  // Flush offline mutation queue on mount and when network recovers.
  // Replays execution saves that failed due to network issues.
  useEffect(() => {
    if (!onboardingReady || !userId) return;

    async function flushQueue() {
      await purgeExpiredMutations();
      const pending = await getPendingMutations();
      setPendingSyncCount(pending.length);
      if (!navigator.onLine || pending.length === 0) return;
      let remaining = pending.length;
      for (const mut of pending) {
        try {
          if (mut.type === 'execution') {
            const p = mut.payload;
            await api.saveExecution(p.userId, p.planId, p.date, p.steps, p.durationSec, p.perceivedExertion, p.sessionType, p.sessionProgram, p.notes);
          }
          await removeMutation(mut.id);
          remaining--;
        } catch {
          break; // still offline — stop and try again later
        }
      }
      setPendingSyncCount(remaining);
      if (remaining === 0) {
        const [newScore, newHistory] = await Promise.all([api.getScore(), api.getHistory()]).catch(() => [null, null]);
        if (newScore !== null) { setPrevScore(score); setScore(newScore); }
        if (newHistory !== null) { setHistory(newHistory.results); setHistoryTruncated(!!newHistory.truncated); }
      }
    }

    flushQueue();
    window.addEventListener('online', flushQueue);
    return () => window.removeEventListener('online', flushQueue);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onboardingReady, userId]);

  // Track network connectivity for offline banner
  useEffect(() => {
    const goOnline  = () => setIsOffline(false);
    const goOffline = () => setIsOffline(true);
    window.addEventListener('online',  goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online',  goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Show check-in based on mode; if check-in won't be shown, load or generate today's plan
  useEffect(() => {
    if (!onboardingReady) return;
    // checkinModeRef and isProRef are set in handleProfileLoaded before onboardingReady is set —
    // avoids stale closure without making this effect re-trigger on every prefs change.
    const mode = checkinModeRef.current ?? "once_a_day";
    const alreadyCheckedInToday = localStorage.getItem("jf_checkin_date") === today;
    const willShowCheckIn =
      mode === "every_time" ||
      (mode === "once_a_day" && !alreadyCheckedInToday);

    if (mode === "every_time") {
      setShowCheckIn(true);
    } else if (mode === "once_a_day" && !alreadyCheckedInToday) {
      setShowCheckIn(true);
    }
    // "manual" — never auto-show

    if (!willShowCheckIn) {
      // No check-in modal — load existing plan or generate from settings only
      setIsGenerating(true);
      api.getTodayPlan(userId, today)
        .then((existing) => {
          if (existing) {
            setPlan(existing);
            setIsGenerating(false);
          } else {
            return api.generatePlan(userId, today, null, undefined, isProRef.current)
              .then((p) => { setPlan(p); setPlanError(null); })
              .catch(async (e) => {
                const cached = await getCachedPlan(today);
                if (cached) { setPlan(cached); setPlanError(null); return; }
                setPlanError({ code: e.planErrorCode ?? "PLAN-ERR", detail: e.message });
              })
              .finally(() => setIsGenerating(false));
          }
        })
        .catch(async () => {
          const cached = await getCachedPlan(today);
          if (cached) { setPlan(cached); setPlanError(null); }
          setIsGenerating(false);
        });
    }
    // today and userId are session-stable (not React state — derived from localStorage/Date at render time)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onboardingReady]);

  const handleCheckIn = useCallback(
    async (data) => {
      setShowCheckIn(false);
      setView("today");
      localStorage.setItem("jf_checkin_date", today);
      setIsGenerating(true);
      try {
        if (data.checkin_json?.period_today && userId) {
          api.logPeriod(userId, today).catch(() => {});
        }
        if (prefs.isPro) {
          // Pro: full daily replanning with check-in data
          const newPlan = await api.generatePlan(userId, today, data, undefined, true);
          setPlan(newPlan); setPlanError(null);
        } else {
          // Free: adapt the existing weekly plan for today's check-in
          // (same exercises, adjusted reps/rest/volume — no full regen)
          api.saveCheckin(userId, today, data).catch(() => {});
          const existing = await api.getTodayPlan(userId, today);
          if (existing) {
            const adapted = await api.adaptPlan(userId, today, data, existing);
            setPlan(adapted); setPlanError(null);
          } else {
            // No plan yet — generate a baseline, then adapt it
            const base = await api.generatePlan(userId, today, null, undefined, false);
            const adapted = await api.adaptPlan(userId, today, data, base);
            setPlan(adapted); setPlanError(null);
          }
        }
      } catch (e) {
        console.error("Plan generation failed:", e);
        reportError('plan_generation', e.planErrorCode ?? e.message ?? 'unknown', token);
        setPlanError({ code: e.planErrorCode ?? "PLAN-ERR", detail: e.message });
      } finally {
        setIsGenerating(false);
      }
    },
    [userId, today, prefs.isPro, token],
  );

  const handleSkipCheckIn = useCallback(async () => {
    setShowCheckIn(false);
    setView("today");
    localStorage.setItem("jf_checkin_date", today);
    setIsGenerating(true);
    try {
      const newPlan = await api.generatePlan(userId, today, null, undefined, prefs.isPro);
      setPlan(newPlan); setPlanError(null);
    } catch (e) {
      console.error("Plan generation failed:", e);
      reportError('plan_generation', e.planErrorCode ?? e.message ?? 'unknown', token);
      setPlanError({ code: e.planErrorCode ?? "PLAN-ERR", detail: e.message });
    } finally {
      setIsGenerating(false);
    }
  }, [userId, today, prefs.isPro, token]);

  const handleRetryPlan = useCallback(async () => {
    setPlanError(null);
    setIsGenerating(true);
    try {
      const newPlan = await api.generatePlan(userId, today, null, undefined, prefs.isPro);
      setPlan(newPlan);
    } catch (e) {
      console.error("Plan retry failed:", e);
      setPlanError({ code: e.planErrorCode ?? "PLAN-ERR", detail: e.message });
    } finally {
      setIsGenerating(false);
    }
  }, [userId, today, prefs.isPro]);

  // Save areas from check-in "Ongoing issue" button → profile chronic_injury_areas
  const handleMarkChronic = useCallback((areas) => {
    const current = prefs.preferences?.chronic_injury_areas ?? [];
    const merged  = [...new Set([...current, ...areas])];
    const newPrefs = { ...(prefs.preferences ?? {}), chronic_injury_areas: merged };
    api.saveProfile(token, { preferences: newPrefs })
      .then(() => {
        setPrefs(p => ({ ...p, preferences: newPrefs }));
        Object.keys(sessionStorage).filter(k => k.startsWith('jf_upcoming')).forEach(k => sessionStorage.removeItem(k));
      })
      .catch(() => {});
  }, [prefs.preferences, token]);

  const handleComplete = useCallback(
    async (durationSec, perceivedExertion, stepsActual, notes) => {
      // Cooper test: pause and ask for distance before saving
      if (plan?.military_program?.session_type === 'cooper_test') {
        setCooperPending({ durationSec, perceivedExertion, stepsActual, notes });
        setCooperDistance("");
        setShowCooperModal(true);
        setInWorkout(false);
        setView("today");
        return;
      }
      try {
        const mergedSteps = (stepsActual ?? plan?.steps ?? []);
        const isMilSession = !!(plan?.military_program);
        const sessionType = plan?.cross_training_run ? "cycling_cross_run"
          : plan?.cycling_program ? "cycling_coach"
          : plan?.run_program ? "run_coach"
          : "workout";
        await api.saveExecution(
          userId,
          plan?.id,
          today,
          mergedSteps,
          durationSec,
          perceivedExertion,
          sessionType,
          isMilSession ? "military" : null,
          notes,
        );
        const [newScore, newHistory] = await Promise.all([
          api.getScore(),
          api.getHistory(),
        ]);
        setPrevScore(score);
        setScore(newScore);
        setHistory(newHistory.results);
        setHistoryTruncated(!!newHistory.truncated);
        // Mark today as completed
        setTodayCompleted(true);
        localStorage.setItem(`jf_completed_${today}`, "1");
        const sessionInfo = { name: plan?.session_name, duration_sec: durationSec };
        setCompletedSession(sessionInfo);
        localStorage.setItem(`jf_completed_session_${today}`, JSON.stringify(sessionInfo));
      } catch (e) {
        console.error("Failed to save execution:", e);
        // Queue for replay when network recovers. Mark today complete optimistically.
        const isMilSession = !!(plan?.military_program);
        const sessionType = plan?.cross_training_run ? "cycling_cross_run"
          : plan?.cycling_program ? "cycling_coach"
          : plan?.run_program ? "run_coach"
          : "workout";
        await queueMutation('execution', {
          userId, planId: plan?.id, date: today,
          steps: stepsActual ?? plan?.steps ?? [],
          durationSec, perceivedExertion,
          sessionType, sessionProgram: isMilSession ? "military" : null, notes: null,
        });
        setPendingSyncCount(c => c + 1);
        setTodayCompleted(true);
        localStorage.setItem(`jf_completed_${today}`, "1");
        const sessionInfo = { name: plan?.session_name, duration_sec: durationSec };
        setCompletedSession(sessionInfo);
        localStorage.setItem(`jf_completed_session_${today}`, JSON.stringify(sessionInfo));
      }
      setInWorkout(false);
      setView("today");
    },
    [userId, plan, today, score],
  );

  const handleCooperSubmit = useCallback(
    async (distanceM) => {
      setShowCooperModal(false);
      setCooperPending(null);
      if (!cooperPending) {
        // Standalone entry from Settings — just persist the benchmark distance
        if (!distanceM || distanceM <= 0) return;
        const mil = prefs?.preferences?.military_coach ?? {};
        const updated = { ...mil, last_cooper_distance_m: distanceM, last_cooper_at_ms: Date.now() };
        try {
          const result = await api.saveProfile(token, { preferences: { ...prefs?.preferences, military_coach: updated } });
          if (result?.ok !== false) setPrefs(p => ({ ...p, preferences: { ...(p?.preferences ?? {}), military_coach: updated } }));
        } catch (e) {
          console.error("Failed to save Cooper benchmark:", e);
        }
        return;
      }
      const { durationSec, perceivedExertion, stepsActual, notes } = cooperPending;
      // Inject cooper_distance_m into the first step's actual_json
      const enriched = (stepsActual ?? plan?.steps ?? []).map((s, i) =>
        i === 0 ? { ...s, actual: { ...(s.actual ?? {}), cooper_distance_m: distanceM } } : s
      );
      try {
        await api.saveExecution(userId, plan?.id, today, enriched, durationSec, perceivedExertion, "workout", "military", notes);
        const [newScore, newHistory] = await Promise.all([api.getScore(), api.getHistory()]);
        setPrevScore(score);
        setScore(newScore);
        setHistory(newHistory.results);
        setHistoryTruncated(!!newHistory.truncated);
        setTodayCompleted(true);
        localStorage.setItem(`jf_completed_${today}`, "1");
        const sessionInfo = { name: plan?.session_name, duration_sec: durationSec };
        setCompletedSession(sessionInfo);
        localStorage.setItem(`jf_completed_session_${today}`, JSON.stringify(sessionInfo));
      } catch (e) {
        console.error("Failed to save Cooper execution:", e);
      }
    },
    [cooperPending, userId, plan, today, score, token, prefs],
  );

  const handleBonusComplete = useCallback(
    async (durationSec, perceivedExertion, stepsActual) => {
      try {
        const mergedSteps = stepsActual ?? bonusPlan?.steps ?? [];
        await api.saveExecution(userId, bonusPlan?.id, today, mergedSteps, durationSec, perceivedExertion, "bonus");
        const [newScore, newHistory] = await Promise.all([
          api.getScore(),
          api.getHistory(),
        ]);
        setScore(newScore);
        setHistory(newHistory.results);
        setHistoryTruncated(!!newHistory.truncated);
        setBonusDone(true);
        localStorage.setItem(`jf_bonus_${today}`, "1");
        setActivityToast("Double session — great work.");
        setTimeout(() => setActivityToast(""), 3000);
      } catch (e) {
        console.error("Failed to save bonus execution:", e);
      }
      setInBonusWorkout(false);
      setBonusPlan(null);
    },
    [userId, bonusPlan, today],
  );

  const handleDeleteExecution = useCallback(
    async (executionId) => {
      const targetExec = history.find((h) => h.id === executionId);
      const isToday = targetExec?.date === today;
      setHistory((prev) => prev.filter((h) => h.id !== executionId));
      await api.deleteExecution(executionId);
      const newScore = await api.getScore();
      setScore(newScore);
      if (isToday) {
        const remainingToday = history.filter((h) => h.id !== executionId && h.date === today);
        if (remainingToday.length === 0) {
          setTodayCompleted(false);
          setCompletedSession(null);
          localStorage.removeItem(`jf_completed_${today}`);
          localStorage.removeItem(`jf_completed_session_${today}`);
          setBonusDone(false);
          localStorage.removeItem(`jf_bonus_${today}`);
        }
      }
    },
    [history, today],
  );

  const handleBonusSelect = useCallback(
    async (minutes) => {
      setIsGenerating(true);
      try {
        const completedIds = (plan?.steps ?? []).map((s) => s.exercise_id).filter(Boolean);
        const bp = await api.generateBonusPlan(userId, today, minutes, completedIds);
        setBonusPlan(bp);
        setInBonusWorkout(true);
      } catch (e) {
        console.error("Bonus plan failed:", e);
        setActivityToast("Couldn't start bonus session — try again");
        setTimeout(() => setActivityToast(""), 3000);
      } finally {
        setIsGenerating(false);
      }
    },
    [userId, today, plan],
  );

  const handleLogActivity = useCallback(
    async (executionType, durationMin) => {
      try {
        await api.saveActivity(userId, today, executionType, durationMin * 60);
        await refreshScoreHistory();
        setActivityToast("Activity logged ✓");
        setTimeout(() => setActivityToast(""), 3000);
      } catch (e) {
        console.error("Failed to log activity:", e);
      }
    },
    [userId, today, refreshScoreHistory],
  );

  const handleWhyNotRegen = useCallback(
    async (checkinOverride, replaceUserPlan = false) => {
      setShowWhyNot(false);
      setIsGenerating(true);
      try {
        const newPlan = await api.generatePlan(userId, today, checkinOverride, undefined, prefs.isPro, { replaceUserPlan });
        setPlan(newPlan); setPlanError(null);
      } catch (e) {
        console.error("Plan regen failed:", e);
        setPlanError({ code: e.planErrorCode ?? "PLAN-ERR", detail: e.message });
      } finally {
        setIsGenerating(false);
      }
    },
    [userId, today, prefs.isPro],
  );

  const handleRestDay = useCallback(async () => {
    setShowWhyNot(false);
    try {
      await api.saveActivity(userId, today, "recovery", 0);
      await refreshScoreHistory();
      setTodayCompleted(true);
      localStorage.setItem(`jf_completed_${today}`, "1");
      setCompletedSession({ name: "Rest Day", duration_sec: 0 });
      localStorage.setItem(`jf_completed_session_${today}`, JSON.stringify({ name: "Rest Day", duration_sec: 0 }));
    } catch (e) {
      console.error("Failed to log rest day:", e);
    }
  }, [userId, today, refreshScoreHistory]);

  // W4.3 — use a saved training today. Goes through POST /api/plan custom_steps
  // (the W4.1 contract), so a blocking safety note comes back as a 409: the
  // builder opens preloaded with the notes and asks for the acknowledgement there.
  // Returns { ok } or { error } for the calling card to show.
  const handleUseTemplate = async (tpl, opts) => {
    let res;
    try { res = await api.useMySession(tpl, today, opts); } catch { return { error: "network" }; }
    const { status, data } = res;
    if (status === 409) { openBuilder(tpl, data.safety_notes ?? []); return { ok: true }; }
    if (status !== 200 || !data.ok) return { error: data.error === "unknown_exercise" ? "unknown_exercise" : "failed" };
    setPlan(data.plan); setPlanError(null);
    setView("today");
    return { ok: true };
  };

  // Route: /trainer-invite?t=<token> and /connect?t=<token> — full-screen sub-flows
  const _appPath = window.location.pathname;
  const _appParams = new URLSearchParams(window.location.search);
  if (_appPath === '/trainer-invite' && _appParams.get('t')) {
    return (
      <AppShellContext.Provider value={shellValue}>
        <TrainerInviteScreen inviteToken={_appParams.get('t')} />
      </AppShellContext.Provider>
    );
  }
  if (_appPath === '/connect' && _appParams.get('t')) {
    return (
      <AppShellContext.Provider value={shellValue}>
        <ConnectScreen connectToken={_appParams.get('t')} />
      </AppShellContext.Provider>
    );
  }

  return (
    <AppShellContext.Provider value={shellValue}>
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        color: C.text,
        fontFamily: "-apple-system, 'Helvetica Neue', Arial, sans-serif",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        /* ── UX-7 — touch targets ──
           Every control gets touch-action: manipulation, which removes iOS Safari's
           300ms tap delay. The small +/- steppers in Settings keep their 28px look —
           they are correct visually — while .jf-tap expands the actual hit area to
           44px with a centred pseudo-element. Enlarging the buttons themselves would
           have broken layouts that are working. */
        button, [role="button"] { touch-action: manipulation; }
        .jf-tap { position: relative; }
        .jf-tap::after {
          content: ""; position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 44px; height: 44px;
        }

        /* UX-5 — one skeleton style for every loading placeholder. */
        .jf-skeleton { background: rgba(var(--overlay-rgb),0.07); animation: pulse 1.4s ease-in-out infinite; }

        /* ── UX-2 — prefers-reduced-motion ──
           Applied as a blanket rule rather than per-animation. The login canvas was
           already handled, but tapScale, tapRing, the rest-ring dashoffset and every
           inline transition were not, and hunting them one at a time guarantees the
           next new animation is missed again.

           Spinners are the deliberate exception: rotation in place involves no
           translation and is not a vestibular trigger, while a loading spinner that
           does not spin reads as a frozen app. Slowed rather than stopped. */
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
          .jf-spin {
            animation-duration: 1.6s !important;
            animation-iteration-count: infinite !important;
          }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes tapScale { 0%{transform:scale(1)} 40%{transform:scale(0.96)} 100%{transform:scale(1)} }
        @keyframes tapRing { 0%{opacity:0.7;transform:scale(1)} 100%{opacity:0;transform:scale(1.18)} }
        ::-webkit-scrollbar { width: 0; }
        textarea { font-family: inherit; color: inherit; }
        button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
      `}</style>

      <div
        style={{ maxWidth: 760, margin: "0 auto", padding: "max(40px, calc(env(safe-area-inset-top) + 16px)) 20px 120px" }}
      >
        {!inWorkout && (
          <header
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 44,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <svg width="38" height="38" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" style={{ filter: "drop-shadow(0 4px 20px rgba(var(--accent-rgb),0.3))", flexShrink: 0 }}>
                <rect x="28" y="28" width="968" height="968" rx="180" style={{ fill: "var(--accent)" }}/>
                {/* Outer hexagon */}
                <path d="M 512 132 L 841 322 L 841 702 L 512 892 L 183 702 L 183 322 Z" fill="none" style={{ stroke: "rgba(var(--overlay-rgb),0.35)" }} strokeWidth="28" strokeLinejoin="round"/>
                {/* Inner web rings — solid */}
                <path d="M 512 277 L 716 395 L 716 630 L 512 747 L 308 630 L 308 395 Z" fill="none" style={{ stroke: "rgba(var(--overlay-rgb),0.2)" }} strokeWidth="14" strokeLinejoin="round"/>
                <path d="M 512 387 L 620 450 L 620 575 L 512 637 L 404 575 L 404 450 Z" fill="none" style={{ stroke: "rgba(var(--overlay-rgb),0.15)" }} strokeWidth="12" strokeLinejoin="round"/>
                {/* S-curve route */}
                <path d="M 308 630 C 580 590, 620 470, 480 420 C 360 380, 460 315, 512 294" fill="none" stroke={C.logoMark} strokeWidth="44" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="512" cy="294" r="32" fill={C.logoMark}/>
                {/* Pole + filled flag */}
                <path d="M 512 294 L 512 172" stroke={C.logoMark} strokeWidth="30" strokeLinecap="round"/>
                <path d="M 512 176 L 626 176 C 608 200, 608 226, 626 250 L 512 250 Z" fill={C.logoMark} stroke={C.logoMark} strokeWidth="8" strokeLinejoin="round"/>
              </svg>
              <span
                style={{
                  fontWeight: 900,
                  fontSize: 18,
                  letterSpacing: "-0.02em",
                }}
              >
                JustFit<span style={{ color: C.emerald }}>.cc</span>
              </span>
            </div>
            {view === "settings" ? (
              <button
                onClick={() => setShowSignOutConfirm(true)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "9px 16px", borderRadius: 14, fontSize: 12, fontWeight: 900,
                  letterSpacing: "0.06em", textTransform: "uppercase",
                  background: "rgba(226,76,74,0.08)", border: "1px solid rgba(226,76,74,0.25)",
                  color: C.danger, cursor: "pointer",
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.danger} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign out
              </button>
            ) : (
              <button
                onClick={() => setShowCheckIn(true)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "9px 18px", borderRadius: 14, fontSize: 12, fontWeight: 900,
                  letterSpacing: "0.06em", textTransform: "uppercase",
                  background: "rgba(var(--overlay-rgb),0.05)", border: `1px solid ${C.border}`,
                  color: C.muted, cursor: "pointer",
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.emerald} strokeWidth="2.5">
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                  <path d="M19 3v4" />
                  <path d="M21 5h-4" />
                </svg>
                Recalibrate
              </button>
            )}
          </header>
        )}

        {assessmentConfig ? (
          <Suspense fallback={null}>
            <AssessmentView
              config={assessmentConfig}
              accentHex={prefs.preferences?.accent ?? localStorage.getItem("jf_accent") ?? "#10b981"}
              onBack={() => setAssessmentConfig(null)}
              onDone={() => {
                setAssessmentConfig(null);
                // The assessment rewrites progression baselines, so pull the
                // fresh scores before the radar re-renders.
                api.getProgression(token).then(setProgression).catch(() => {});
              }}
            />
          </Suspense>
        ) : inBonusWorkout && bonusPlan ? (
          <Suspense fallback={null}>
            <WorkoutView
              plan={bonusPlan ? { ...bonusPlan, experience_level: prefs.experience_level ?? bonusPlan.experience_level } : bonusPlan}
              onComplete={handleBonusComplete}
              onBack={() => { setInBonusWorkout(false); setBonusPlan(null); }}
              cycle={prefs.cycle}
              prefs={prefs}
            />
          </Suspense>
        ) : inWorkout ? (
          <Suspense fallback={null}>
            <WorkoutView
              plan={plan ? { ...plan, experience_level: prefs.experience_level ?? plan.experience_level } : plan}
              onComplete={handleComplete}
              onBack={() => setInWorkout(false)}
              cycle={prefs.cycle}
              prefs={prefs}
            />
          </Suspense>
        ) : (
          <>
            {isOffline && (
              <div style={{ margin: "0 0 16px", padding: "12px 16px", borderRadius: 16, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)", display: "flex", alignItems: "center", gap: 10 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.warning} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <line x1="1" y1="1" x2="23" y2="23" /><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" /><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" /><path d="M10.71 5.05A16 16 0 0 1 22.56 9" /><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" /><path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><line x1="12" y1="20" x2="12.01" y2="20" />
                </svg>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.warning }}>Je bent offline — wijzigingen worden gesynchroniseerd zodra de verbinding hersteld is</div>
              </div>
            )}
            {view === "today" && (
              <>
                <PregnancyProgressBanner cycle={prefs.cycle} />
                {/* ── UX-8: install prompt — a banner, never a modal gate ──
                     Shown after the 3rd completed workout, when the app has already
                     proved useful. Dismissal is remembered; installing clears it. ── */}
                {installPrompt && !installDismissed && history.length >= 3 && (
                  <div style={{ margin: "0 0 16px", padding: "14px 16px", borderRadius: 16, background: C.emeraldDim, border: `1px solid ${C.emeraldBorder}`, display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: C.emerald }}>{t("Add JustFit to your home screen")}</div>
                      <div style={{ fontSize: 12, color: C.muted, marginTop: 2, lineHeight: 1.45 }}>
                        {t("Opens full screen and works offline.")}
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        const p = installPrompt;
                        setInstallPrompt(null);
                        try { await p.prompt(); } catch { /* dismissed by the browser */ }
                      }}
                      style={{ flex: "none", minHeight: 40, padding: "0 14px", borderRadius: 12, border: "none", cursor: "pointer", background: C.emerald, color: C.onAccent, fontSize: 13, fontWeight: 800, touchAction: "manipulation" }}
                    >
                      {t("Install")}
                    </button>
                    <button
                      aria-label={t("Dismiss")}
                      onClick={() => {
                        setInstallDismissed(true);
                        try { localStorage.setItem("jf_install_dismissed", "1"); } catch { /* private mode */ }
                      }}
                      style={{ flex: "none", width: 40, minHeight: 40, borderRadius: 12, border: "none", cursor: "pointer", background: "transparent", color: C.muted, fontSize: 18, fontWeight: 700, touchAction: "manipulation" }}
                    >
                      ×
                    </button>
                  </div>
                )}
                {pendingSyncCount > 0 && (
                  <div style={{ margin: "0 0 16px", padding: "12px 16px", borderRadius: 16, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)", display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>⏳</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.warning }}>{t('pending_sync_title') || 'Workout saved locally'}</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{t('pending_sync_body') || 'Syncing when your connection returns…'}</div>
                    </div>
                  </div>
                )}
                {!hasEmail && !emailBannerDismissed && (
                  <div style={{ margin: "0 0 16px", padding: "12px 16px", borderRadius: 16, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)", display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>⚠</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.warning }}>Add your email to keep your data</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Without email, you can't log back in when your session expires.</div>
                    </div>
                    <button onClick={() => setShowGuestConvert(true)} style={{ padding: "6px 12px", borderRadius: 10, border: "1px solid rgba(245,158,11,0.4)", background: "rgba(245,158,11,0.1)", color: C.warning, fontWeight: 800, fontSize: 11, cursor: "pointer", flexShrink: 0, fontFamily: "inherit" }}>
                      Add →
                    </button>
                    <button onClick={() => { setEmailBannerDismissed(true); localStorage.setItem(uKey('jf_email_banner_dismissed'), String(Date.now())); }} style={{ padding: "4px 8px", borderRadius: 8, border: "none", background: "transparent", color: C.muted, fontSize: 20, cursor: "pointer", lineHeight: 1, fontFamily: "inherit" }}>
                      ×
                    </button>
                  </div>
                )}
                {/* ── Van je trainer card ── */}
                {(() => {
                  const msg = prefs.trainer_message;
                  const msgFresh = msg?.sent_at_ms && (Date.now() - msg.sent_at_ms) < 7 * 86400000;
                  if (!msg || !msgFresh || trainerMsgDismissedAt === msg.sent_at_ms) return null;
                  return (
                    <div style={{ margin: "0 0 16px", padding: "16px 18px", borderRadius: 20, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.28)", position: "relative" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                        {msg.gym_logo_url ? (
                          <img src={msg.gym_logo_url} alt={msg.gym_name} style={{ width: 32, height: 32, borderRadius: 8, objectFit: "cover", flexShrink: 0, border: "1px solid rgba(var(--overlay-rgb),0.08)" }} />
                        ) : (
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.35)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: C.warning, fontSize: 16, fontWeight: 900 }}>
                            T
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: C.warning, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
                            Van je trainer{msg.gym_name ? ` · ${msg.gym_name}` : ""}
                          </div>
                          <div style={{ fontSize: 14, color: C.text, lineHeight: 1.5 }}>{msg.text}</div>
                        </div>
                        <button
                          onClick={() => {
                            setTrainerMsgDismissedAt(msg.sent_at_ms);
                            localStorage.setItem(uKey('jf_trainer_msg_dismissed'), String(msg.sent_at_ms));
                          }}
                          style={{ padding: "2px 6px", borderRadius: 6, border: "none", background: "transparent", color: C.muted, fontSize: 18, cursor: "pointer", lineHeight: 1, flexShrink: 0, fontFamily: "inherit" }}
                          aria-label="Verberg bericht"
                        >×</button>
                      </div>
                    </div>
                  );
                })()}
                <Suspense fallback={null}>
                  <Dashboard
                    plan={plan}
                    score={score}
                    prevScore={prevScore}
                    onStartWorkout={() => setInWorkout(true)}
                    isGenerating={isGenerating}
                    todayCompleted={todayCompleted}
                    completedSession={completedSession}
                    bonusDone={bonusDone}
                    onLogActivity={handleLogActivity}
                    onBonusSession={handleBonusSelect}
                    onWhyNot={() => setShowWhyNot(true)}
                    onBuildOwn={() => openBuilder()}
                    myTemplates={myTemplates}
                    onUseTemplate={handleUseTemplate}
                    onCheckIn={() => setShowCheckIn(true)}
                    prefs={prefs}
                    planError={planError}
                    onRetryPlan={handleRetryPlan}
                    token={token}
                    history={history}
                    onNavigateProgress={() => setView('history')}
                    onNavigateCoach={() => setView("coach")}
                    cycle={prefs.cycle}
                    planCapped={!!(plan?.capped)}
                    onUpgrade={() => setView("upgrade")}
                  />
                </Suspense>
              </>
            )}
            {view === "coach" && (
              <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: "var(--accent)", fontSize: 14 }}>Loading…</div>}>
                <CoachView
                  prefs={prefs}
                  plan={plan}
                  onUpdate={setPrefs}
                  onNavigateSettings={() => setView("settings")}
                  onWeeklyPlan={() => setView("plan")}
                  progression={progression}
                  cyclingPmc={cyclingPmc}
                  ftpSnoozedUntil={ftpSnoozedUntil}
                  setFtpSnoozedUntil={setFtpSnoozedUntil}
                  accentHex={prefs.preferences?.accent ?? "#10b981"}
                  setView={setView}
                  trainerData={trainerData}
                  onTrainerDataChange={setTrainerData}
                  assignments={assignments}
                  clientSessions={clientSessions}
                  availableSessions={availableSessions}
                  onAvailableSessionsChange={setAvailableSessions}
                  onClientSessionsChange={setClientSessions}
                  clientPackages={clientPackages}
                  myTemplates={myTemplates}
                  onUseTemplate={handleUseTemplate}
                  onEditTemplate={(tpl) => openBuilder(tpl)}
                  onBuildOwn={() => openBuilder()}
                  onDeleteTemplate={handleDeleteTemplate}
                />
              </Suspense>
            )}
            {view === "plan" && (
              <PlanWeekView history={history} plan={plan} userId={userId} onDeleteExecution={handleDeleteExecution} prefs={prefs} onLogged={handleLogged} />
            )}
            {view === "history" && (
              <HistoryView
                progression={progression}
                isLoading={isLoadingProgression}
                token={token}
                userId={userId}
                prefs={prefs}
                onProgressionUpdate={(updated) => setProgression(updated)}
                history={history}
                historyTruncated={historyTruncated}
                onUpgrade={() => setView("upgrade")}
                setView={setView}
                onStartAssessment={(cfg) => setAssessmentConfig(cfg)}
                assessmentPlanned={!!plan?.assessment_planned}
                onForceAssessment={handleForceAssessment}
                onOpenAwards={() => openAwards("history")}
              />
            )}
            {view === "awards" && (
              <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: "var(--accent)", fontSize: 14 }}>Loading…</div>}>
                <AwardsView history={history} score={score} isPro={isPro || !!prefs.isPro} progression={progression} runUnlocked={prefs.preferences?.run_coach?.unlocked_targets ?? []} onBack={() => setView(awardsOrigin)} origin={awardsOrigin} />
              </Suspense>
            )}
            {view === "upgrade" && (
              <Suspense fallback={null}>
                <ProGate onBack={() => setView("today")} earlyBirdRemaining={earlyBirdRemaining} />
              </Suspense>
            )}
            {view === "settings" && (
              <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: "var(--accent)", fontSize: 14 }}>Loading…</div>}>
                <SettingsView
                  prefs={prefs}
                  onUpdate={setPrefs}
                  onRedoOnboarding={() => setShowOnboarding(true)}
                  onResetDefaults={async () => {
                    const defaultPrefs = {
                      display_name: "User",
                      checkin_mode: "once_a_day",
                      available_equipment: ["none"],
                      accent: "#10b981",
                      time_overhead: { enabled: false },
                      sport_prefs: {},
                      chronic_injury_areas: [],
                    };
                    const result = await api.saveProfile(token, {
                      sex: "male",
                      weight_kg: 75,
                      height_cm: 180,
                      session_duration_min: 60,
                      preferences: defaultPrefs,
                    });
                    if (result?.ok && result.preferences) {
                      setPrefs(p => ({ ...p, sex: "male", weight_kg: 75, height_cm: 180, session_duration_min: 60, preferences: result.preferences }));
                      localStorage.setItem("jf_accent", "#10b981");
                      document.documentElement.style.setProperty("--accent", "#10b981");
                      document.documentElement.style.setProperty("--accent-rgb", "16,185,129");
                      document.documentElement.style.setProperty("--accent-dim", "rgba(16,185,129,0.15)");
                      document.documentElement.style.setProperty("--accent-border", "rgba(16,185,129,0.3)");
                    }
                  }}
                  onChangePath={() => setShowPathChoice(true)}
                  onOpenCooperModal={() => setShowCooperModal(true)}
                  onNavigateAwards={() => openAwards("settings")}
                  onNavigateCoach={() => setView("coach")}
                  isPro={isPro || !!prefs.isPro}
                  onUpgrade={() => setView("upgrade")}
                  onSubscriptionChange={() => api.getSubscription().then(sub => { if (sub.isPro != null) setIsPro(sub.isPro); }).catch(() => {})}
                  onProgressionRefresh={() =>
                    api.getProgression(token)
                      .then((data) => { if (data?.ok) setProgression(data); })
                      .catch(() => {})
                  }
                />
              </Suspense>
            )}
          </>
        )}
      </div>

      {!inWorkout && (() => {
        const hasTrainer = !!(trainerData?.assigned_trainer);
        const todayStr = new Date().toISOString().slice(0, 10);
        const coachDot = hasTrainer && (
          assignments.some(a => (a.sessions ?? []).some(s => s.scheduled_date === todayStr && s.status === 'scheduled')) ||
          (trainerData?.conv_unread_client ?? 0) > 0
        );
        return <Nav view={view} setView={setView} hasTrainer={hasTrainer} coachDot={coachDot} />;
      })()}

      {showSignOutConfirm && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "rgba(var(--bg-rgb),0.85)" }}
          onClick={() => setShowSignOutConfirm(false)}
        >
          <div
            style={{ width: "100%", maxWidth: 320, background: C.sheet, border: `1px solid ${C.border}`, borderRadius: 20, padding: 28, display: "flex", flexDirection: "column", gap: 20 }}
            onClick={e => e.stopPropagation()}
          >
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: C.text, marginBottom: 8 }}>Sign out?</div>
              <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.6 }}>Your plan and progress are saved. See you next time.</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                onClick={() => setShowSignOutConfirm(false)}
                style={{ width: "100%", padding: "13px 0", borderRadius: 14, border: `1px solid ${C.emeraldBorder}`, background: C.emeraldDim, color: C.emerald, fontWeight: 900, fontSize: 14, cursor: "pointer" }}
              >
                Return sporting
              </button>
              <button
                onClick={() => { setShowSignOutConfirm(false); logout(); }}
                style={{ width: "100%", padding: "13px 0", borderRadius: 14, border: `1px solid ${C.border}`, background: "rgba(var(--overlay-rgb),0.03)", color: C.muted, fontWeight: 900, fontSize: 14, cursor: "pointer" }}
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {showCheckIn && (
        <Suspense fallback={null}>
          <CheckInModal
            onSave={handleCheckIn}
            onClose={handleSkipCheckIn}
            isPro={!!prefs.isPro}
            sex={prefs.sex}
            cycle={prefs.cycle}
            defaultTimeBudget={(() => {
              const fallback = prefs.session_duration_min ?? 45;
              if (prefs.preferences?.schedule_advanced) {
                const dayKey = ['sun','mon','tue','wed','thu','fri','sat'][new Date().getDay()];
                const scheduled = prefs.preferences?.weekly_schedule?.[dayKey];
                return (scheduled != null && scheduled > 0) ? scheduled : fallback;
              }
              return fallback;
            })()}
            lastCheckin={lastCheckin}
            onMarkChronic={handleMarkChronic}
          />
        </Suspense>
      )}

      {showOnboarding && (
        <Suspense fallback={null}>
          <OnboardingModal token={token} prefs={prefs} onComplete={handleOnboardingComplete} onBack={logout} />
        </Suspense>
      )}

      {showPathChoice && (
        <Suspense fallback={null}>
          <PathChoiceModal token={token} onComplete={handlePathChoiceComplete} isPro={isPro} onUpgrade={() => { setShowPathChoice(false); setView("upgrade"); }} />
        </Suspense>
      )}

      {/* ── Terms acceptance gate ─────────────────────────────── */}
      {needsTermsGate && (
        <div style={{ position: "fixed", inset: 0, background: C.bg, zIndex: 80, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ width: "100%", maxWidth: 420, background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 28, padding: 32, boxShadow: "0 40px 100px rgba(0,0,0,0.5)" }}>
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
              <div style={{ width: 36, height: 36, background: C.emerald, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 13, color: C.onAccent }}>JF</div>
              <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.02em", color: C.text }}>Just<span style={{ color: C.emerald }}>Fit</span>.cc</div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.12em", color: C.emerald, textTransform: "uppercase", marginBottom: 10 }}>Updated Policies</div>
            <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.02em", color: C.text, marginBottom: 10, lineHeight: 1.2 }}>
              Review &amp; accept our terms
            </h2>
            <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.65, marginBottom: 24 }}>
              We've updated our legal documents. Please review and accept them to continue using JustFit.
            </p>
            {/* Policy links */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
              {[
                { label: "Terms & Conditions", href: "/terms.html" },
                { label: "Disclaimer & Liability Waiver", href: "/disclaimer.html" },
                { label: "Privacy Policy", href: "/privacy.html" },
              ].map(({ label, href }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", borderRadius: 12, background: "rgba(var(--accent-rgb),0.06)", border: `1px solid ${C.emeraldBorder}`, color: C.emerald, fontSize: 13, fontWeight: 800, textDecoration: "none" }}
                >
                  {label}
                  <span style={{ fontSize: 16, opacity: 0.7 }}>↗</span>
                </a>
              ))}
            </div>
            {/* Acceptance checkbox */}
            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 20, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                style={{ width: 18, height: 18, marginTop: 1, flexShrink: 0, accentColor: "#10b981", cursor: "pointer" }}
              />
              <span style={{ fontSize: 13, color: C.muted, lineHeight: 1.55, fontWeight: 500 }}>
                I have read and agree to the Terms &amp; Conditions, Disclaimer &amp; Liability Waiver, and Privacy Policy of JustFit.cc.
              </span>
            </label>
            {/* Accept button */}
            {termsAcceptError && (
              <div style={{ fontSize: 12, color: C.danger, marginBottom: 10, textAlign: "center" }}>
                {termsAcceptError}{" "}
                <button
                  onClick={() => setTermsAcceptError(null)}
                  style={{ background: "none", border: "none", color: C.danger, fontWeight: 700, fontSize: 12, cursor: "pointer", textDecoration: "underline", padding: 0 }}
                >
                  Retry
                </button>
              </div>
            )}
            <button
              disabled={!termsAccepted || termsAccepting}
              onClick={async () => {
                setTermsAccepting(true);
                setTermsAcceptError(null);
                try {
                  const result = await api.acceptTerms(token, LEGAL_VERSIONS.terms, LEGAL_VERSIONS.privacy);
                  if (!result?.ok) throw new Error("not ok");
                  setNeedsTermsGate(false);
                } catch {
                  setTermsAcceptError("Could not save — please try again.");
                } finally {
                  setTermsAccepting(false);
                }
              }}
              style={{ width: "100%", padding: 16, background: termsAccepted ? C.emerald : C.subtle, border: "none", borderRadius: 16, color: C.onAccent, fontSize: 15, fontWeight: 900, cursor: termsAccepted ? "pointer" : "not-allowed", opacity: termsAccepting ? 0.6 : 1, transition: "all 0.15s" }}
            >
              {termsAccepting ? "Saving…" : "I agree — Continue"}
            </button>
            <button
              onClick={logout}
              style={{ width: "100%", marginTop: 10, padding: "10px 0", background: "none", border: "none", color: C.muted, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
            >
              Sign out instead
            </button>
          </div>
        </div>
      )}


      {showWhyNot && (
        <Suspense fallback={null}>
          <WhyNotModal
            onRegen={handleWhyNotRegen}
            onRestDay={handleRestDay}
            onBuildOwn={() => { setShowWhyNot(false); openBuilder(); }}
            userAuthored={!!plan?.authored_by_user}
            onClose={() => setShowWhyNot(false)}
          />
        </Suspense>
      )}
      {showBuilder && (
        <Suspense fallback={null}>
          <SessionBuilder
            prefs={prefs}
            today={today}
            onClose={() => setShowBuilder(false)}
            onInstalled={(p) => { if (p) { setPlan(p); setPlanError(null); } }}
            template={builderTemplate}
            initialNotes={builderNotes}
            onTemplateSaved={handleTemplateSaved}
          />
        </Suspense>
      )}
      {showGuestConvert && (
        <Suspense fallback={null}>
          <GuestConvertModal
            onClose={() => setShowGuestConvert(false)}
            onConverted={() => {
              // Session cookie already refreshed server-side; reload to pick it up.
              window.location.reload();
            }}
          />
        </Suspense>
      )}

      {showCooperModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(var(--bg-rgb),0.92)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: C.sheet, border: `1px solid ${C.emeraldBorder}`, borderRadius: 24, padding: 28, width: "100%", maxWidth: 400 }}>
            <div style={{ marginBottom: 12 }}><Icons.run size={28} c={C.emerald} /></div>
            <div style={{ fontSize: 18, fontWeight: 900, color: C.text, marginBottom: 6 }}>Cooper Test Complete</div>
            <div style={{ fontSize: 14, color: C.muted, marginBottom: 20 }}>How far did you run in 12 minutes? Enter your distance in meters.</div>
            <input
              type="number"
              inputMode="numeric"
              placeholder="e.g. 2400"
              value={cooperDistance}
              onChange={e => setCooperDistance(e.target.value)}
              style={{ width: "100%", padding: "14px 16px", borderRadius: 14, border: `1px solid ${C.emeraldBorder}`, background: "rgba(var(--overlay-rgb),0.04)", color: C.text, fontSize: 22, fontWeight: 900, textAlign: "center", outline: "none", boxSizing: "border-box", marginBottom: 8 }}
            />
            <div style={{ fontSize: 11, color: C.muted, textAlign: "center", marginBottom: 20 }}>
              {(() => {
                const d = parseInt(cooperDistance, 10);
                if (!d || d < 500) return "Enter your distance to see your benchmark";
                if (d < 1800) return "Below K1 benchmark — great starting point";
                if (d < 2000) return "K1 level (< 2000 m)";
                if (d < 2200) return "K2 level (2000–2199 m)";
                if (d < 2400) return "K3 level (2200–2399 m)";
                if (d < 2600) return "K4 level (2400–2599 m)";
                if (d < 2800) return "K5 level (2600–2799 m)";
                return "K6 level (≥ 2800 m) — excellent!";
              })()}
            </div>
            <button
              onClick={() => handleCooperSubmit(parseInt(cooperDistance, 10) || 0)}
              style={{ width: "100%", padding: "16px", borderRadius: 16, background: C.emerald, border: "none", color: C.onAccent, fontSize: 15, fontWeight: 900, cursor: "pointer", marginBottom: 10 }}
            >
              Save Result
            </button>
            <button
              onClick={() => handleCooperSubmit(0)}
              style={{ width: "100%", padding: "12px", borderRadius: 16, background: "transparent", border: `1px solid ${C.border}`, color: C.muted, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              Skip — record without distance
            </button>
          </div>
        </div>
      )}

      {activityToast && (
        <div style={{ position: "fixed", bottom: 100, left: "50%", transform: "translateX(-50%)", background: C.sheet, border: `1px solid ${C.emeraldBorder}`, borderRadius: 14, padding: "12px 24px", fontSize: 14, fontWeight: 800, color: C.emerald, zIndex: 200, boxShadow: "0 8px 30px rgba(0,0,0,0.4)" }}>
          {activityToast}
        </div>
      )}

      {/* Pending trainer invite from signup flow (Sub-flow B) */}
      {pendingInviteToken && (
        <PendingInviteModal
          inviteToken={pendingInviteToken}
          onDone={() => setPendingInviteToken(null)}
        />
      )}
    </div>
    </AppShellContext.Provider>
  );
}
