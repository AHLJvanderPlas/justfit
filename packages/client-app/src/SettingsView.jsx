import { useState, useEffect, useRef } from "react";
import api from "./apiClient.js";
import { logout, clearPlanCache } from "./authHelpers.js";
import { C, display, eyebrow, mono, ACCENT_COLORS, applyAccent } from "./tokens.js";
import { Glass } from "./uiComponents.jsx";
import { GOALS, EXPERIENCE, ALL_EQUIPMENT, ALL_SPORTS, SEX_OPTIONS, CYCLE_LENGTHS, RUN_TARGETS } from "./appConstants.js";
import { Icons, GOAL_ICONS, GoalIcon, MilitaryIcon } from "./icons.jsx";
import { t, useLang, setLang, getLang } from "./i18n.js";

// ─── PASSKEY HELPERS ──────────────────────────────────────────────────────────
const b64url = (buf) =>
  btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

const fromB64url = (str) => {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
};

const PHASE_LABELS = {
  menstrual:  "Rest & restore phase",
  follicular: "Building strength phase",
  ovulation:  "Peak energy phase",
  luteal:     "Wind-down phase",
};


// ─── DOCUMENTATION CONTENT MAP ────────────────────────────────────────────────
// Single source of truth for all in-app doc summaries and their external pages.
// DocViewer in SettingsView renders any entry via the same shared renderer.
const DOCS = [
  {
    id: "mission",
    title: "Mission, Vision & Philosophy",
    subtitle: "What JustFit stands for and why consistency wins",
    version: "1.1",
    effectiveDate: "1 April 2025",
    lastUpdated: "April 2026",
    externalUrl: "/mission.html",
    summaryBullets: [
      "We design for consistency over intensity: show up often, adapt to real life, avoid all-or-nothing.",
      "Plans are deterministic and rule-based, so decisions are traceable and predictable.",
      "Running Coach, Cycling Coach, and Military Coach support structured progress without overriding recovery signals.",
      "Privacy-first by design: identity and health context are separated; no data sale or ad profiling.",
    ],
  },
  {
    id: "how_it_works",
    title: "How JustFit Works",
    subtitle: "Features, the planner engine, scoring, and coaching",
    version: "1.1",
    effectiveDate: "1 April 2025",
    lastUpdated: "April 2026",
    externalUrl: "/how-it-works.html",
    summaryBullets: [
      "Daily check-in is optional; plans generate from profile settings alone when skipped.",
      "Safety-first rule hierarchy: pain, sleep, stress, time, and body context override training preferences.",
      "Return-to-training re-ramp after ≥14 days inactive; recovery mode for low-energy days.",
      "Running Coach, Cycling Coach, and Military Coach are specialised structured programmes.",
      "Self-service data export (JSON) and account deletion are available in Settings.",
    ],
  },
  {
    id: "privacy",
    title: "Privacy Policy",
    subtitle: "What data we collect, your GDPR rights, and how to delete your data",
    version: "1.0",
    effectiveDate: "1 April 2025",
    lastUpdated: "1 April 2025",
    externalUrl: "/privacy.html",
    summaryBullets: [
      "We collect only account, profile, check-in, and workout data needed to run the service.",
      "We do not sell data, run ad trackers, or use third-party analytics pixels.",
      "Processors are limited (Cloudflare infrastructure, Resend transactional email).",
      "GDPR rights are supported: access, correction, deletion, restriction, and objection.",
      "Self-service JSON export and account deletion are in Settings — no request needed.",
    ],
  },
  {
    id: "terms",
    title: "Terms & Conditions",
    subtitle: "Usage rules, eligibility, and governing law",
    version: "1.1",
    effectiveDate: "1 April 2025",
    lastUpdated: "April 2026",
    externalUrl: "/terms.html",
    summaryBullets: [
      "Using JustFit means accepting Terms + Privacy under explicit versioned consent records.",
      "Service is general wellness support, not medical or clinical care.",
      "Minimum age is 16; users are responsible for account security and lawful use.",
      "Liability is limited to the maximum extent permitted by law.",
      "Dutch governing law applies; full dispute and change terms are on the external page.",
    ],
  },
  {
    id: "disclaimer",
    title: "Disclaimer & Liability Waiver",
    subtitle: "Health risks, medical advice, and your responsibility",
    version: "1.0",
    effectiveDate: "1 April 2025",
    lastUpdated: "1 April 2025",
    externalUrl: "/disclaimer.html",
    summaryBullets: [
      "JustFit is not medical advice, diagnosis, or treatment.",
      "Exercise carries risk; use at your own risk and stop if symptoms worsen.",
      "Consult a qualified professional before training with conditions, injury, pregnancy, or postnatal recovery.",
      "BMI and body-context adaptations are precautionary guidance, not diagnosis.",
      "Full liability waiver and scope are on the external disclaimer page.",
    ],
  },
];

function SettingsView({ prefs, onUpdate, userId, token, onRedoOnboarding, onResetDefaults, onChangePath, onOpenCooperModal, onProgressionRefresh, onNavigateAwards, onNavigateCoach, isPro, onUpgrade, onSubscriptionChange }) {
  useLang();
  const [passkeySupported, setPasskeySupported] = useState(false);
  const [addingPasskey, setAddingPasskey]       = useState(false);
  const [passkeyMsg, setPasskeyMsg]             = useState("");
  // Data export state
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState("");
  // Delete account state
  const [deleteStep, setDeleteStep]   = useState(null); // null | "confirm" | "type"
  const [deleteText, setDeleteText]   = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  // Email verification / change state
  const [emailStep, setEmailStep]     = useState(null); // null | "verify_code" | "change_enter" | "change_code"
  const [emailCode, setEmailCode]     = useState("");
  const [emailInput, setEmailInput]   = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError]   = useState("");
  const [emailSuccess, setEmailSuccess] = useState("");
  // Cycle settings state
  const [cycleTrackingMode, setCycleTrackingMode] = useState(prefs.cycle?.tracking_mode ?? "off");
  const [cycleLength, setCycleLength] = useState(prefs.cycle?.cycle_length_days ?? 28);
  const [lastPeriodStart, setLastPeriodStart] = useState(prefs.cycle?.last_period_start ?? "");
  const [cycleSaving, setCycleSaving] = useState(false);
  // Pregnancy mode state
  const [bodyMode, setBodyMode] = useState(prefs.cycle?.mode ?? "standard");
  const [pregnancySetupStep, setPregnancySetupStep] = useState(0); // 0=hidden,1=clearance,2=duedate
  const [medicalClearance, setMedicalClearance] = useState(false);
  const [pregnancyDueDate, setPregnancyDueDate] = useState(prefs.cycle?.pregnancy_due_date ?? "");
  const [pregnancySaving, setPregnancySaving] = useState(false);
  // Postnatal mode state
  const [postnatalSetupStep, setPostnatalSetupStep] = useState(0); // 0=hidden,1=birthdate,2=birthtype
  const [postnatalBirthDate, setPostnatalBirthDate] = useState(prefs.cycle?.postnatal_birth_date ?? "");
  const [postnatalBirthType, setPostnatalBirthType] = useState(prefs.cycle?.postnatal_birth_type ?? "");
  const [postnatalSaving, setPostnatalSaving] = useState(false);
  // Profile editing state
  const [displayName, setDisplayName] = useState(prefs.preferences?.display_name ?? "");
  const [profileSex, setProfileSex] = useState(prefs.sex ?? null);
  const [profileWeight, setProfileWeight] = useState(prefs.weight_kg ? String(prefs.weight_kg) : "");
  const [profileWeightUnit, setProfileWeightUnit] = useState("kg");
  const [profileHeight, setProfileHeight] = useState(prefs.height_cm ? String(prefs.height_cm) : "");
  const [profileHeightUnit, setProfileHeightUnit] = useState("cm");
  const [saveStatus, setSaveStatus] = useState(""); // "" | "saving" | "saved" | "error"
  const planAutoSaveRef = useRef(false);
  const profileAutoSaveRef = useRef(false);
  const accentAutoSaveRef = useRef(false);
  const [showSexWarning, setShowSexWarning] = useState(false);
  const [pendingSex, setPendingSex] = useState(null);
  const [bodyModeDeactivating, setBodyModeDeactivating] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  // Sub-view routing
  const [subView, setSubView] = useState(null); // null | 'you' | 'coach' | 'privacy' | 'account'
  const [primaryIntent, setPrimaryIntent] = useState(prefs.preferences?.primary_intent ?? null);
  const [showConflictModal, setShowConflictModal] = useState(false);
  // Doc overlay
  const [activeDoc, setActiveDoc] = useState(null); // null | one of the DOCS entries
  // Voucher (subscription upgrade)
  // Subscription management
  const [subData, setSubData] = useState(null);
  const [subLoading, setSubLoading] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [referralData, setReferralData] = useState(null);
  const [referralLoading, setReferralLoading] = useState(false);
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemState, setRedeemState] = useState("idle"); // idle | loading | done | error
  const [redeemMsg, setRedeemMsg] = useState("");
  const [pushState, setPushState] = useState("idle"); // idle | requesting | subscribed | denied
  const [pushMsg, setPushMsg] = useState("");
  // Feedback
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [feedbackDone, setFeedbackDone] = useState(false);
  // Accent colour
  const [accentHex, setAccentHex] = useState(prefs.preferences?.accent ?? localStorage.getItem("jf_accent") ?? "#10b981");
  // Daily planning preferences
  const [checkinMode, setCheckinMode] = useState(prefs.preferences?.checkin_mode ?? "once_a_day");
  const [planDuration, setPlanDuration] = useState(prefs.session_duration_min ?? 45);
  const [planEquipment, setPlanEquipment] = useState(prefs.preferences?.available_equipment ?? ["none"]);
  const [timeOverhead, setTimeOverhead] = useState(() => {
    const saved = prefs.preferences?.time_overhead;
    const emptyProfile = { presets: { change_clothes: 0, prepare_equipment: 0, clean_equipment: 0, shower: 0 }, custom: [] };
    // Migrate old single-profile format (had top-level presets/custom)
    if (saved && saved.presets) return { enabled: saved.enabled ?? false, short: emptyProfile, long: { presets: saved.presets, custom: saved.custom ?? [] } };
    return saved ?? { enabled: false, short: emptyProfile, long: { ...emptyProfile, custom: [] } };
  });
  const [overheadEditMode, setOverheadEditMode] = useState(false);
  const [showAdvancedSchedule, setShowAdvancedSchedule] = useState(() => prefs.preferences?.schedule_advanced ?? false);
  const [weeklySchedule, setWeeklySchedule] = useState(() => {
    const saved = prefs.preferences?.weekly_schedule;
    const d = prefs.session_duration_min ?? 45;
    return saved ?? { mon: d, tue: d, wed: d, thu: d, fri: d, sat: 0, sun: 0 };
  });

  const [equipEditMode, setEquipEditMode] = useState(false);
  const [equipDragItem, setEquipDragItem] = useState(null);
  const [equipDropZone, setEquipDropZone] = useState(null);
  // Sport preferences
  const sportAutoSaveRef = useRef(false);
  const [sportPrefs, setSportPrefs] = useState(() => {
    const saved = prefs.preferences?.sport_prefs;
    return saved ?? { sports: [], primary: "none" };
  });
  const [sportEditMode, setSportEditMode] = useState(false);
  const [runTargetSelect, setRunTargetSelect] = useState(
    prefs.preferences?.run_coach?.target_km ?? 5
  );
  const [cycleUnitSelect, setCycleUnitSelect] = useState(
    prefs.preferences?.cycling_coach?.unit ?? 'watts'
  );
  const [cycleFtpInput, setCycleFtpInput] = useState(
    String(prefs.preferences?.cycling_coach?.ftp_watts ?? 200)
  );
  const [cycleMaxHrInput, setCycleMaxHrInput] = useState(
    String(prefs.preferences?.cycling_coach?.max_hr ?? 180)
  );
  const [cycleTargetFtpInput, setCycleTargetFtpInput] = useState(
    String(prefs.preferences?.cycling_coach?.target_ftp ?? 250)
  );
  const [cycleSubGoalSelect, setCycleSubGoalSelect] = useState(
    prefs.preferences?.cycling_coach?.sub_goal ?? 'build_fitness'
  );
  const [cycleDaysPerWeek, setCycleDaysPerWeek] = useState(
    prefs.preferences?.cycling_coach?.cycling_days_per_week ?? 3
  );
  const [cycleCrossTrainEnabled, setCycleCrossTrainEnabled] = useState(
    !!(prefs.preferences?.cycling_coach?.run_cross_training)
  );
  const [cycleCrossTrainDays, setCycleCrossTrainDays] = useState(
    prefs.preferences?.cycling_coach?.run_days_per_week ?? 1
  );
  // FTP test modal
  const [showFtpTestModal, setShowFtpTestModal] = useState(false);
  const [ftpTestType, setFtpTestType] = useState('20min');
  const [ftpTestInput, setFtpTestInput] = useState('');
  const [ftpTestSaving, setFtpTestSaving] = useState(false);
  const [sportDragItem, setSportDragItem] = useState(null);
  const [sportDropZone, setSportDropZone] = useState(null);
  // Strava integration state
  const [stravaConnection, setStravaConnection]       = useState(null); // null=loading, false=not connected, object=connected
  const [stravaIsByo, setStravaIsByo]                 = useState(false);
  const [stravaConnecting, setStravaConnecting]       = useState(false);
  const [stravaDisconnecting, setStravaDisconnecting] = useState(false);
  const [stravaSyncing, setStravaSyncing]             = useState(false);
  const [stravaSyncResult, setStravaSyncResult]       = useState(null); // { imported, by_type }
  const [stravaMsg, setStravaMsg]                     = useState('');
  const [showStravaSetup, setShowStravaSetup]         = useState(false);
  const [byoClientId, setByoClientId]                 = useState(''); // populated from GET /api/strava-auth
  const [byoClientSecret, setByoClientSecret]         = useState(''); // never pre-filled (secret not returned from server)
  const [byoSaving, setByoSaving]                     = useState(false);
  // Pro entitlement — passed from App (entitlements table) or fallback to prefs flag
  const effectiveIsPro = !!(isPro || prefs.isPro);
  // Training Focus
  const runCoachActive   = !!(prefs.preferences?.run_coach?.enrolled && !prefs.preferences?.run_coach?.completed);
  const cycleCoachActive = !!(prefs.preferences?.cycling_coach?.active && !prefs.preferences?.cycling_coach?.completed);
  const milCoachActive   = !!(prefs.preferences?.military_coach?.active);
  const [focusSel, setFocusSel] = useState(() =>
    runCoachActive ? "running" : cycleCoachActive ? "cycling" : milCoachActive ? "military" : (prefs.training_goal ?? "health")
  );

  // Show conflict modal when 2+ coaches are active and no primary_intent is set
  useEffect(() => {
    const activeCount = [milCoachActive, runCoachActive, cycleCoachActive].filter(Boolean).length;
    if (activeCount >= 2 && !primaryIntent && subView === "coach") {
      setShowConflictModal(true);
    }
  }, [subView, milCoachActive, runCoachActive, cycleCoachActive, primaryIntent]);
  // Military Coach wizard state
  const [milTrack,        setMilTrack]        = useState(() => prefs.preferences?.military_coach?.track ?? 'keuring');
  const [milCluster,      setMilCluster]      = useState(() => prefs.preferences?.military_coach?.cluster_target ?? 3);
  const [milMode,         setMilMode]         = useState(() => prefs.preferences?.military_coach?.mode ?? 'target');
  const [milTargetDate,   setMilTargetDate]   = useState(() => prefs.preferences?.military_coach?.target_date ?? '');
  const [milPackWeight,   setMilPackWeight]   = useState(() => prefs.preferences?.military_coach?.pack_weights_available_kg ?? []);
  // has_trail_shoes is now derived from planEquipment.includes("trail_shoes") — no separate state needed
  const [localExpLevel, setLocalExpLevel] = useState(prefs.experience_level ?? "beginner");
  const [focusSaveStatus, setFocusSaveStatus] = useState("");
  const handleFocusTap = (val) => { setFocusSel(val); };
  const handleFocusSave = async () => {
    setFocusSaveStatus("saving");
    try {
      if (focusSel === "running") {
        const rcState = prefs.preferences?.run_coach ?? null;
        const unlockedTargets = rcState?.unlocked_targets ?? [];
        const newRc = { enrolled: true, target_km: runTargetSelect, week: 1, session_in_week: 0, enrolled_at_ms: Date.now(), last_run_at_ms: null, unlocked_targets: unlockedTargets, completed: false };
        const ccPatch = prefs.preferences?.cycling_coach ? { cycling_coach: { ...(prefs.preferences.cycling_coach), active: false } } : {};
        const newPrefs = { ...(prefs.preferences ?? {}), ...ccPatch, run_coach: newRc };
        onUpdate((p) => ({ ...p, preferences: newPrefs }));
        await api.saveProfile(token, { preferences: newPrefs });
      } else if (focusSel === "cycling") {
        const ftp = parseInt(cycleFtpInput) || 200;
        const maxHr = parseInt(cycleMaxHrInput) || 180;
        const targetFtp = parseInt(cycleTargetFtpInput) || 250;
        const existingCc = prefs.preferences?.cycling_coach ?? {};
        const newCc = { active: true, unit: cycleUnitSelect, ftp_watts: cycleUnitSelect === 'watts' ? ftp : null, max_hr: maxHr, target_ftp: cycleUnitSelect === 'watts' ? targetFtp : null, sub_goal: cycleSubGoalSelect, cycling_days_per_week: cycleDaysPerWeek, ftp_tested_at_ms: existingCc.ftp_tested_at_ms ?? null, ftp_test_interval_weeks: existingCc.ftp_test_interval_weeks ?? 6, ftp_history: existingCc.ftp_history ?? [], week: 1, session_in_week: 0, enrolled_at_ms: Date.now(), last_ride_at_ms: null, completed: false, run_cross_training: existingCc.run_cross_training ?? false, run_days_per_week: existingCc.run_days_per_week ?? 1, run_level: existingCc.run_level ?? 1, run_sessions_total: existingCc.run_sessions_total ?? 0, last_cross_run_at_ms: existingCc.last_cross_run_at_ms ?? null };
        const rcPatch = prefs.preferences?.run_coach ? { run_coach: { ...(prefs.preferences.run_coach), enrolled: false } } : {};
        const newPrefs = { ...(prefs.preferences ?? {}), ...rcPatch, cycling_coach: newCc };
        onUpdate((p) => ({ ...p, preferences: newPrefs }));
        await api.saveProfile(token, { preferences: newPrefs });
      } else if (focusSel === "military") {
        const existingMil = prefs.preferences?.military_coach ?? {};
        const newMil = {
          ...existingMil,  // preserve rpe_easy/hard_streak, last_cooper_distance_m, last_cooper_at_ms, etc.
          active: true, track: milTrack,
          cluster_target: milMode === 'open' ? 6 : milCluster,
          cluster_current: existingMil.cluster_current ?? (milMode === 'open' ? (milTrack === 'keuring' ? 0 : 1) : milCluster),
          mode: milMode, target_date: milMode === 'target' ? milTargetDate : null,
          block_session_index: existingMil.block_session_index ?? 0,
          block_number:        existingMil.block_number ?? 1,
          pack_weights_available_kg: milPackWeight,
          has_trail_shoes: planEquipment.includes("trail_shoes"),
          enrolled_at_ms: existingMil.enrolled_at_ms ?? Date.now(),
        };
        const rcPatch = prefs.preferences?.run_coach ? { run_coach: { ...(prefs.preferences.run_coach), enrolled: false } } : {};
        const ccPatch = prefs.preferences?.cycling_coach ? { cycling_coach: { ...(prefs.preferences.cycling_coach), active: false } } : {};
        const newPrefs = { ...(prefs.preferences ?? {}), ...rcPatch, ...ccPatch, military_coach: newMil };
        onUpdate((p) => ({ ...p, preferences: newPrefs }));
        await api.saveProfile(token, { preferences: newPrefs });
      } else {
        const rcPatch = prefs.preferences?.run_coach ? { run_coach: { ...(prefs.preferences.run_coach), enrolled: false } } : {};
        const ccPatch = prefs.preferences?.cycling_coach ? { cycling_coach: { ...(prefs.preferences.cycling_coach), active: false } } : {};
        const milPatch = prefs.preferences?.military_coach ? { military_coach: { ...(prefs.preferences.military_coach), active: false } } : {};
        const newPrefs = { ...(prefs.preferences ?? {}), ...rcPatch, ...ccPatch, ...milPatch };
        onUpdate((p) => ({ ...p, training_goal: focusSel, experience_level: localExpLevel, preferences: newPrefs }));
        await api.saveProfile(token, { training_goal: focusSel, experience_level: localExpLevel, preferences: newPrefs });
        onProgressionRefresh?.();
      }
      clearPlanCache();
      setFocusSaveStatus("saved");
      setTimeout(() => setFocusSaveStatus(""), 2000);
    } catch { setFocusSaveStatus(""); }
  };

  const moveSport = (id, toActive) => {
    setSportPrefs((prev) => {
      const sports = prev.sports ?? [];
      const next = toActive
        ? (sports.includes(id) ? sports : [...sports, id])
        : sports.filter((s) => s !== id);
      const primary = next.includes(prev.primary) ? prev.primary : (next[0] ?? "none");
      return { ...prev, sports: next, primary };
    });
  };

  const moveEquip = (value, toActive) => {
    if (toActive) {
      setPlanEquipment((prev) => {
        const without = prev.filter((v) => v !== "none");
        return without.includes(value) ? without : [...without, value];
      });
    } else {
      setPlanEquipment((prev) => {
        const next = prev.filter((v) => v !== value && v !== "none");
        return next.length === 0 ? ["none"] : next;
      });
    }
  };

  // ── Auto-save: plan preferences ──
  useEffect(() => {
    if (!planAutoSaveRef.current) { planAutoSaveRef.current = true; return; }
    setSaveStatus("saving");
    const t = setTimeout(async () => {
      try {
        await api.saveProfile(token, {
          training_goal: ['fat_loss','muscle_gain','endurance','strength','health','mobility','mixed'].includes(prefs.training_goal) ? prefs.training_goal : 'health',
          experience_level: prefs.experience_level ?? "beginner",
          session_duration_min: planDuration,
          days_per_week_target: prefs.days_per_week_target ?? 3,
          preferences: { ...(prefs.preferences ?? {}), available_equipment: planEquipment, weekly_schedule: weeklySchedule, checkin_mode: checkinMode, time_overhead: timeOverhead, schedule_advanced: showAdvancedSchedule },
        });
        onUpdate((p) => ({ ...p, session_duration_min: planDuration, preferences: { ...(p.preferences ?? {}), available_equipment: planEquipment, weekly_schedule: weeklySchedule, checkin_mode: checkinMode, time_overhead: timeOverhead, schedule_advanced: showAdvancedSchedule } }));
        clearPlanCache();
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus(""), 2000);
      } catch { setSaveStatus("error"); }
    }, 600);
    return () => clearTimeout(t);
  // token, prefs, onUpdate, and api are session-stable (not React state); excluding them prevents
  // the debounce from firing on every parent re-render. .join/.stringify used to stabilise arrays.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planDuration, planEquipment.join(","), JSON.stringify(weeklySchedule), checkinMode, JSON.stringify(timeOverhead), showAdvancedSchedule]);

  // ── Auto-save: profile ──
  useEffect(() => {
    if (!profileAutoSaveRef.current) { profileAutoSaveRef.current = true; return; }
    setSaveStatus("saving");
    const t = setTimeout(async () => {
      try {
        let weight_kg = null;
        if (profileWeight) { const w = parseFloat(profileWeight); if (!isNaN(w)) weight_kg = profileWeightUnit === "lbs" ? Math.round(w * 0.453592 * 10) / 10 : w; }
        let height_cm = null;
        if (profileHeight) { const h = parseFloat(profileHeight); if (!isNaN(h)) height_cm = profileHeightUnit === "in" ? Math.round(h * 2.54 * 10) / 10 : h; }
        const payload = { sex: profileSex, weight_kg, height_cm, preferences: { ...(prefs.preferences ?? {}), display_name: displayName } };
        if (profileSex === "female") {
          payload.cycle = cycleTrackingMode === "smart"
            ? { tracking_mode: "smart", cycle_length_days: cycleLength, last_period_start: lastPeriodStart || undefined, mode: bodyMode }
            : { tracking_mode: "off", mode: bodyMode };
        }
        await api.saveProfile(token, payload);
        onUpdate((p) => ({ ...p, sex: profileSex, weight_kg, height_cm, preferences: { ...(p.preferences ?? {}), display_name: displayName } }));
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus(""), 2000);
      } catch { setSaveStatus("error"); }
    }, 800);
    return () => clearTimeout(t);
  // token, prefs, onUpdate, and api are session-stable; excluding avoids infinite save loops.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayName, profileSex, profileWeight, profileWeightUnit, profileHeight, profileHeightUnit, cycleTrackingMode, cycleLength, lastPeriodStart, bodyMode]);

  // ── Auto-save: accent colour ──
  useEffect(() => {
    if (!accentAutoSaveRef.current) { accentAutoSaveRef.current = true; return; }
    localStorage.setItem("jf_accent", accentHex);
    api.saveProfile(token, { preferences: { ...(prefs.preferences ?? {}), accent: accentHex } })
      .then(() => onUpdate((p) => ({ ...p, preferences: { ...(p.preferences ?? {}), accent: accentHex } })))
      .catch(() => {});
  // token, prefs, and onUpdate are session-stable; accentHex is the only value that drives the save.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accentHex]);

  // ── Auto-save: sport preferences ──
  useEffect(() => {
    if (!sportAutoSaveRef.current) { sportAutoSaveRef.current = true; return; }
    api.saveProgressionPrefs(token, { sport_prefs: sportPrefs })
      .then(() => onUpdate((p) => ({ ...p, preferences: { ...(p.preferences ?? {}), sport_prefs: sportPrefs } })))
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(sportPrefs)]);

  const handleDeactivateBodyMode = async () => {
    setBodyModeDeactivating(true);
    try {
      await api.saveProfile(token, { cycle: { mode: "standard", tracking_mode: "off" } });
      setBodyMode("standard");
      setCycleTrackingMode("off");
      onUpdate((p) => ({ ...p, cycle: { ...(p.cycle ?? {}), mode: "standard", tracking_mode: "off" } }));
    } catch { /* ignore */ }
    setBodyModeDeactivating(false);
  };

  const handleConfirmSexChange = async () => {
    const newSex = pendingSex;
    setProfileSex(newSex);
    setBodyMode("standard");
    setCycleTrackingMode("off");
    setShowSexWarning(false);
    setPendingSex(null);
    try {
      await api.saveProfile(token, { sex: newSex, cycle: { mode: "standard", tracking_mode: "off" } });
      onUpdate((p) => ({ ...p, sex: newSex, cycle: { ...(p.cycle ?? {}), mode: "standard", tracking_mode: "off" } }));
    } catch { /* ignore */ }
  };


  // Load Strava connection status on mount
  useEffect(() => {
    fetch('/api/strava-auth', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        setStravaConnection(d.connection ?? false);
        setStravaIsByo(!!(d.is_byo));
        if (d.client_id) setByoClientId(d.client_id);
      })
      .catch(() => setStravaConnection(false));
  }, [token]);

  useEffect(() => {
    if (window.PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable) {
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(setPasskeySupported);
    }
  }, []);

  const handleStravaConnect = async () => {
    setStravaConnecting(true);
    setStravaMsg('');
    try {
      const data = await fetch('/api/strava-auth', {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json());
      if (data.auth_url) {
        window.location.href = data.auth_url;
      } else {
        setStravaMsg('Enter your Client ID and Client Secret below, then click Save credentials.');
        setShowStravaSetup(true);
      }
    } catch {
      setStravaMsg('Could not reach Strava. Try again.');
    }
    setStravaConnecting(false);
  };

  const handleStravaDisconnect = async () => {
    setStravaDisconnecting(true);
    setStravaMsg('');
    try {
      await fetch('/api/strava-auth', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setStravaConnection(false);
      setStravaSyncResult(null);
      setStravaMsg('Disconnected from Strava.');
    } catch {
      setStravaMsg('Could not disconnect. Try again.');
    }
    setStravaDisconnecting(false);
  };

  const handleByoSave = async () => {
    if (!byoClientId.trim()) { setStravaMsg('Client ID is required.'); return; }
    if (!byoClientSecret.trim()) { setStravaMsg('Client Secret is required.'); return; }
    setByoSaving(true);
    setStravaMsg('');
    try {
      const data = await api.saveStravaByo(token, byoClientId.trim(), byoClientSecret.trim());
      if (!data.ok) {
        setStravaMsg(data.error || 'Could not save credentials. Try again.');
        setByoSaving(false);
        return;
      }
      setByoClientSecret(''); // clear after save — never keep secret in local state
      setStravaMsg('App credentials saved. Click Connect Strava to link your account.');
      setShowStravaSetup(false);
      // Reload connection status to pick up new is_byo flag
      fetch('/api/strava-auth', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => {
          setStravaConnection(d.connection ?? false);
          setStravaIsByo(!!(d.is_byo));
          if (d.client_id) setByoClientId(d.client_id);
        })
        .catch(() => {});
    } catch {
      setStravaMsg('Could not save credentials. Try again.');
    }
    setByoSaving(false);
  };

  const handleStravaSync = async () => {
    setStravaSyncing(true);
    setStravaMsg('');
    setStravaSyncResult(null);
    try {
      const data = await api.stravaSync(token);
      if (data.ok) {
        setStravaSyncResult({ imported: data.imported, by_type: data.by_type, recent: data.recent ?? [] });
        // Update last_sync_at_ms in local connection state
        setStravaConnection(c => c ? { ...c, last_sync_at_ms: Date.now() } : c);
        setStravaMsg(data.imported === 0 ? 'Already up to date.' : '');
      } else {
        setStravaMsg(data.error ?? 'Sync failed. Try again.');
      }
    } catch {
      setStravaMsg('Could not reach sync service. Try again.');
    }
    setStravaSyncing(false);
  };

  const handleAddPasskey = async () => {
    setAddingPasskey(true);
    setPasskeyMsg("");
    try {
      const beginRes = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "passkey_begin_register" }),
      }).then((r) => r.json());

      if (!beginRes.challengeToken) throw new Error(beginRes.error || "Failed to begin");

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: fromB64url(beginRes.challenge),
          rp: { name: "JustFit.cc", id: "justfit.cc" },
          user: {
            id: fromB64url(beginRes.userId),
            name: prefs.email || userId,
            displayName: "JustFit User",
          },
          pubKeyCredParams: [{ type: "public-key", alg: -7 }],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            requireResidentKey: true,
            residentKey: "required",
            userVerification: "preferred",
          },
          timeout: 60000,
          attestation: "none",
        },
      });

      const pubKey   = credential.response.getPublicKey();
      const pubKeyB64 = btoa(String.fromCharCode(...new Uint8Array(pubKey)));

      const completeRes = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: "passkey_complete_register",
          challengeToken: beginRes.challengeToken,
          credentialId: b64url(credential.rawId),
          publicKey: pubKeyB64,
          algorithm: credential.response.getPublicKeyAlgorithm(),
        }),
      }).then((r) => r.json());

      if (!completeRes.ok) throw new Error(completeRes.error || "Registration failed");
      setPasskeyMsg("✓ Passkey registered — you can now use Face ID / Touch ID to log in.");
    } catch (e) {
      if (e.name === "NotAllowedError") {
        setPasskeyMsg("Cancelled — try again when ready.");
      } else {
        setPasskeyMsg(`Failed: ${e.message}`);
      }
    }
    setAddingPasskey(false);
  };

  const handleEnablePush = async () => {
    setPushState("requesting"); setPushMsg("");
    try {
      const statusRes = await api.getPushStatus();
      if (!statusRes.ok || !statusRes.vapid_public_key) {
        setPushMsg("Push notifications zijn nog niet beschikbaar."); setPushState("idle"); return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') { setPushState("denied"); return; }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: statusRes.vapid_public_key,
      });
      await api.subscribePush(sub.toJSON());
      setPushState("subscribed"); setPushMsg("✓ Notificaties ingeschakeld");
    } catch { setPushState("idle"); setPushMsg("Inschakelen mislukt — probeer opnieuw."); }
  };

  const handleDisablePush = async () => {
    try {
      const reg = await navigator.serviceWorker.ready.catch(() => null);
      const sub = await reg?.pushManager.getSubscription().catch(() => null);
      if (sub) { await sub.unsubscribe().catch(() => {}); await api.unsubscribePush(sub.endpoint); }
    } catch { /* non-fatal */ }
    setPushState("idle"); setPushMsg("");
  };

  // ── FTP test constants + handler ──────────────────────────────────────────
  const CYCLE_SUB_GOALS = [
    { v: 'build_fitness', label: 'Build fitness' },
    { v: 'climbing',      label: 'Climbing' },
    { v: 'sprint',        label: 'Sprint power' },
    { v: 'aerobic_base',  label: 'Aerobic base' },
    { v: 'race_fitness',  label: 'Race fitness' },
  ];

  function computeFtpFromTest(type, avgWatts) {
    if (type === 'ramp')  return Math.round(avgWatts * 0.75);
    if (type === '12min') return Math.round(avgWatts * 0.85);
    return Math.round(avgWatts * 0.95); // 20min
  }

  async function handleFtpTestSave() {
    const avgWatts = parseInt(ftpTestInput) || 0;
    if (avgWatts <= 0) return;
    setFtpTestSaving(true);
    const newFtp = computeFtpFromTest(ftpTestType, avgWatts);
    const cc = prefs.preferences?.cycling_coach ?? {};
    const now = Date.now();
    const updatedHistory = [...(cc.ftp_history ?? []), { ftp_watts: newFtp, tested_at_ms: now, test_type: ftpTestType }];
    const updatedCc = { ...cc, ftp_watts: newFtp, ftp_tested_at_ms: now, ftp_history: updatedHistory };
    const newPrefs = { ...(prefs.preferences ?? {}), cycling_coach: updatedCc };
    try {
      await api.saveProfile(token, { preferences: newPrefs });
      onUpdate(p => ({ ...p, preferences: newPrefs }));
      setCycleFtpInput(String(newFtp));
    } catch (e) {
      console.error('FTP test save failed:', e);
    }
    setFtpTestSaving(false);
    setShowFtpTestModal(false);
    setFtpTestInput('');
  }

  return (
    <div>
      {/* ── Doc overlay ──────────────────────────────────────── */}
      {/* ── FTP test modal ────────────────────────────────────── */}
      {showFtpTestModal && (() => {
        const avgWatts = parseInt(ftpTestInput) || 0;
        const previewFtp = avgWatts > 0 ? computeFtpFromTest(ftpTestType, avgWatts) : null;
        const TEST_TYPES = [
          { v: 'ramp',  label: 'Ramp test',     formula: 'last step × 0.75', hint: 'Enter the last completed step in watts' },
          { v: '12min', label: '12-min test',    formula: 'avg watts × 0.85', hint: 'Enter your average watts over 12 min' },
          { v: '20min', label: '20-min test',    formula: 'avg watts × 0.95', hint: 'Enter your average watts over 20 min' },
        ];
        const selected = TEST_TYPES.find(t => t.v === ftpTestType);
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(2,6,23,0.92)", zIndex: 70, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setShowFtpTestModal(false)}>
            <div style={{ width: "100%", maxWidth: 560, background: "#0f172a", borderRadius: "24px 24px 0 0", padding: "24px 20px calc(32px + env(safe-area-inset-bottom)) 20px", border: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: C.border, margin: "0 auto 20px" }} />
              <div style={{ fontSize: 18, fontWeight: 900, color: C.text, marginBottom: 4 }}>FTP Test Result</div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>Enter your test result to calculate your new FTP.</div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", color: C.muted, textTransform: "uppercase", marginBottom: 8 }}>Test type</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {TEST_TYPES.map(t => (
                    <button key={t.v} onClick={() => setFtpTestType(t.v)} style={{ padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 800, cursor: "pointer", border: `1px solid ${ftpTestType === t.v ? C.emeraldBorder : C.border}`, background: ftpTestType === t.v ? C.emeraldDim : "rgba(255,255,255,0.03)", color: ftpTestType === t.v ? C.emerald : C.muted }}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", color: C.muted, textTransform: "uppercase", marginBottom: 6 }}>
                  {selected?.hint ?? 'Enter watts'}
                </div>
                <input
                  type="number" min={50} max={600} placeholder="e.g. 280"
                  value={ftpTestInput} onChange={e => setFtpTestInput(e.target.value)}
                  autoFocus
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, color: C.text, fontSize: 18, fontWeight: 700, boxSizing: "border-box" }}
                />
              </div>

              {previewFtp && (
                <div style={{ marginBottom: 20, padding: "12px 16px", borderRadius: 14, background: C.emeraldDim, border: `1px solid ${C.emeraldBorder}` }}>
                  <div style={{ fontSize: 11, fontWeight: 900, color: C.emerald, marginBottom: 2 }}>New FTP</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: C.text }}>{previewFtp}W</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{selected?.formula} = {previewFtp}W</div>
                </div>
              )}

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => { setShowFtpTestModal(false); setFtpTestInput(''); }} style={{ flex: 1, padding: "14px 0", borderRadius: 14, background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, color: C.muted, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  Cancel
                </button>
                <button onClick={handleFtpTestSave} disabled={!previewFtp || ftpTestSaving} style={{ flex: 2, padding: "14px 0", borderRadius: 14, background: previewFtp ? C.emerald : "rgba(255,255,255,0.06)", border: "none", color: previewFtp ? "#020617" : C.muted, fontSize: 14, fontWeight: 900, cursor: previewFtp ? "pointer" : "default" }}>
                  {ftpTestSaving ? "Saving…" : `Save ${previewFtp ? `— ${previewFtp}W` : ''}`}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {activeDoc && (
        <div style={{ position: "fixed", inset: 0, background: C.bg, zIndex: 60, overflowY: "auto", padding: "calc(80px + env(safe-area-inset-top)) 20px calc(48px + env(safe-area-inset-bottom)) 20px" }}>
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 61, background: C.bg, borderBottom: `1px solid ${C.border}`, paddingTop: "calc(16px + env(safe-area-inset-top))", paddingBottom: "16px", paddingLeft: "max(20px, env(safe-area-inset-left))", paddingRight: "max(20px, env(safe-area-inset-right))", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button
              onClick={() => setActiveDoc(null)}
              style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: C.muted, fontSize: 14, fontWeight: 700, cursor: "pointer", padding: 0 }}
            >
              ← Back
            </button>
            {activeDoc.externalUrl && (
              <a
                href={activeDoc.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 13, fontWeight: 800, color: C.emerald, textDecoration: "none" }}
              >
                See full page →
              </a>
            )}
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
            {activeDoc.version && <span style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>v{activeDoc.version}</span>}
            {activeDoc.effectiveDate && <span style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>Effective {activeDoc.effectiveDate}</span>}
            {activeDoc.lastUpdated && activeDoc.lastUpdated !== activeDoc.effectiveDate && <span style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>Updated {activeDoc.lastUpdated}</span>}
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 900, color: C.text, letterSpacing: "-0.02em", marginBottom: 28, lineHeight: 1.2 }}>
            {activeDoc.title}
          </h2>
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: C.emerald, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
              Summary
            </div>
            {activeDoc.summaryBullets.map((bullet, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
                <span style={{ color: C.emerald, fontWeight: 900, fontSize: 14, flexShrink: 0, marginTop: 1 }}>·</span>
                <p style={{ fontSize: 14, color: C.text, lineHeight: 1.7, margin: 0, fontWeight: 600 }}>{bullet}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {subView === null ? (
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ ...display(36), color: C.text, margin: "0 0 28px 0" }}>{t("SETTINGS")}</h1>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {[
              { key: "goal",    label: t("Your goal"),   sub: t("Primary focus \u00b7 training days \u00b7 session length") },
              { key: "you",     label: t("You"),          sub: t("Body \u00b7 equipment \u00b7 schedule \u00b7 appearance") },
              { key: "coaches",  label: t("Coaches"),      sub: t("Active programmes \u00b7 add-on coaches \u00b7 Strava") },
              { key: "trainers", label: t("Trainers"),    sub: t("Connected trainers \u00b7 data sharing \u00b7 intake") },
              { key: "awards",   label: t("Trophy room"), sub: t("Awards & milestones") },
              { key: "privacy",  label: t("Privacy"),     sub: t("Data export \u00b7 legal docs \u00b7 feedback") },
              { key: "account", label: t("Account"),      sub: t("Email \u00b7 passkeys \u00b7 security") },
            ].map((row, i, arr) => (
              <button
                key={row.key}
                onClick={() => {
                  if (row.key === "awards") onNavigateAwards?.();
                  else if (row.key === "coaches") onNavigateCoach?.();
                  else setSubView(row.key);
                }}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  width: "100%", padding: "18px 0", background: "none", border: "none",
                  borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none",
                  cursor: "pointer", textAlign: "left",
                }}
              >
                <div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: C.text, letterSpacing: "-0.02em", marginBottom: 2 }}>{row.label}</div>
                  <div style={{ fontSize: 13, color: C.muted }}>{row.sub}</div>
                </div>
                <span style={{ color: C.muted, fontSize: 22, marginLeft: 16, flexShrink: 0 }}>›</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
          <button
            onClick={() => setSubView(null)}
            style={{ padding: "8px 16px", borderRadius: 12, border: `1px solid ${C.border}`, background: C.bgCard, color: C.text, fontWeight: 900, fontSize: 18, cursor: "pointer", lineHeight: 1, flexShrink: 0 }}
          >
            ‹
          </button>
          <h1 style={{ ...display(28), color: C.text, margin: 0 }}>
            {subView === "goal" ? t("YOUR GOAL") : subView === "you" ? t("YOU") : subView === "privacy" ? t("PRIVACY") : subView === "trainers" ? t("TRAINERS") : t("ACCOUNT")}
          </h1>
        </div>
      )}

      {subView === "goal" && (() => {
        const GOAL_OPTIONS = [
          { value: "fat_loss",  label: "Lose weight & feel better",   sub: "Burn fat, build energy",           icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
          ) },
          { value: "strength",  label: "Build strength & muscle",      sub: "Get stronger week by week",        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 5v7"/><path d="M18 5v7"/><path d="M8 5H4a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4"/><path d="M16 5h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4"/><path d="M8 9h8"/><path d="M10 15h4"/><path d="M12 12v6"/></svg>
          ) },
          { value: "health",    label: "Improve overall fitness",      sub: "More stamina, more capacity",      icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
          ) },
          { value: "mobility",  label: "Boost energy & manage stress", sub: "Consistent movement, calmer mind", icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2a7 7 0 0 1 7 7c0 4.5-7 13-7 13S5 13.5 5 9a7 7 0 0 1 7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
          ) },
        ];
        const currentGoal = prefs.training_goal ?? "health";

        const handleGoalSave = async (val) => {
          onUpdate(p => ({ ...p, training_goal: val }));
          await api.saveProfile(token, { training_goal: val });
        };

        const daysPerWeek = prefs.preferences?.training_days_per_week ?? 3;
        const sessionMins = prefs.session_duration_min ?? 45;

        const handleDays = async (n) => {
          const updated = { ...(prefs.preferences ?? {}), training_days_per_week: n };
          onUpdate(p => ({ ...p, preferences: updated }));
          await api.saveProfile(token, { preferences: updated });
        };

        const handleMins = async (m) => {
          onUpdate(p => ({ ...p, session_duration_min: m }));
          await api.saveProfile(token, { session_duration_min: m });
        };

        return (
          <div>
            <div style={{ ...eyebrow, color: C.muted, marginBottom: 16 }}>PRIMARY FOCUS</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 20, lineHeight: 1.5 }}>
              JustFit adapts your daily sessions to this. Coaches are add-ons you can activate separately.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 32 }}>
              {GOAL_OPTIONS.map(opt => {
                const sel = currentGoal === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleGoalSave(opt.value)}
                    style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "16px 18px", borderRadius: 16, textAlign: "left", cursor: "pointer",
                      background: sel ? "rgba(var(--accent-rgb),0.1)" : C.bgCard,
                      border: sel ? "1.5px solid var(--accent-border)" : `1px solid ${C.border}`,
                    }}
                  >
                    <span style={{ color: sel ? "var(--accent)" : C.muted, flexShrink: 0 }}>{opt.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: sel ? "var(--accent)" : C.text, marginBottom: 2 }}>{opt.label}</div>
                      <div style={{ fontSize: 12, color: C.muted }}>{opt.sub}</div>
                    </div>
                    {sel && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5"><path d="m20 6-11 11-5-5"/></svg>}
                  </button>
                );
              })}
            </div>

            <div style={{ ...eyebrow, color: C.muted, marginBottom: 12 }}>TRAINING DAYS</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
              {[2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => handleDays(n)} style={{
                  flex: 1, padding: "12px 0", borderRadius: 12, fontWeight: 900, fontSize: 14, cursor: "pointer",
                  background: daysPerWeek === n ? "rgba(var(--accent-rgb),0.12)" : C.bgCard,
                  border: daysPerWeek === n ? "1.5px solid var(--accent-border)" : `1px solid ${C.border}`,
                  color: daysPerWeek === n ? "var(--accent)" : C.text,
                }}>
                  {n}x
                </button>
              ))}
            </div>

            <div style={{ ...eyebrow, color: C.muted, marginBottom: 12 }}>SESSION LENGTH</div>
            <div style={{ display: "flex", gap: 8 }}>
              {[15, 30, 45, 60].map(m => (
                <button key={m} onClick={() => handleMins(m)} style={{
                  flex: 1, padding: "12px 0", borderRadius: 12, fontWeight: 900, fontSize: 13, cursor: "pointer",
                  background: sessionMins === m ? "rgba(var(--accent-rgb),0.12)" : C.bgCard,
                  border: sessionMins === m ? "1.5px solid var(--accent-border)" : `1px solid ${C.border}`,
                  color: sessionMins === m ? "var(--accent)" : C.text,
                }}>
                  {m}m
                </button>
              ))}
            </div>
          </div>
        );
      })()}

      {subView === "coach" && (<>
        {/* ── Active intent header ─────────────────────────── */}
        <div style={{ marginBottom: 28, paddingBottom: 24, borderBottom: `1px solid ${C.border}` }}>
          <div style={{ ...eyebrow, color: C.muted, marginBottom: 12 }}>ACTIVE COACH</div>
          {milCoachActive ? (
            <>
              <div style={{ ...display(32), color: C.text, marginBottom: 6 }}>
                {"MILITARY · " + (prefs.preferences?.military_coach?.track === "keuring"
                  ? (prefs.preferences.military_coach.cluster_current === 0 ? "KB" : `K${prefs.preferences.military_coach.cluster_current}`)
                  : `O${prefs.preferences?.military_coach?.cluster_current ?? 1}`)}
              </div>
              <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.5 }}>
                {prefs.preferences?.military_coach?.track === "keuring" ? "Keuring" : "Opleiding"} track
                {" · "}{prefs.preferences?.military_coach?.mode ?? "target"} mode
                {prefs.preferences?.military_coach?.target_date && (
                  " · " + Math.max(0, Math.ceil((new Date(prefs.preferences.military_coach.target_date) - new Date()) / 86400000)) + " days to assessment"
                )}
              </div>
            </>
          ) : runCoachActive ? (
            <>
              <div style={{ ...display(32), color: C.text, marginBottom: 6 }}>
                {"RUNNING · " + (prefs.preferences?.run_coach?.target_km ?? 5) + "KM"}
              </div>
              <div style={{ fontSize: 14, color: C.muted }}>
                {"Week " + (prefs.preferences?.run_coach?.week ?? 1) + " · " + (prefs.preferences?.run_coach?.target_km ?? 5) + "km programme"}
              </div>
            </>
          ) : cycleCoachActive ? (
            <>
              <div style={{ ...display(32), color: C.text, marginBottom: 6 }}>
                {"CYCLING · " + (prefs.preferences?.cycling_coach?.sub_goal ?? "build_fitness").replace(/_/g, " ").toUpperCase()}
              </div>
              <div style={{ fontSize: 14, color: C.muted }}>
                {"Week " + (prefs.preferences?.cycling_coach?.week ?? 1) + " · " + (prefs.preferences?.cycling_coach?.unit === "watts" ? `FTP ${prefs.preferences.cycling_coach.ftp_watts}W` : `Max HR ${prefs.preferences?.cycling_coach?.max_hr}bpm`)}
              </div>
            </>
          ) : (
            <>
              <div style={{ ...display(32), color: C.text, marginBottom: 6 }}>
                {(GOALS.find(g => g.value === (prefs.training_goal ?? "health"))?.label ?? "General Health").toUpperCase()}
              </div>
              <div style={{ fontSize: 14, color: C.muted }}>Adaptive daily training · no structured programme</div>
            </>
          )}
          {onChangePath && (
            <button
              onClick={onChangePath}
              style={{ marginTop: 14, padding: "8px 16px", borderRadius: 10, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.03)", color: C.muted, fontWeight: 700, fontSize: 12, cursor: "pointer", letterSpacing: "0.04em" }}
            >
              Change path →
            </button>
          )}
        </div>
      {/* ── Training Focus ──────────────────────────────────── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ ...eyebrow, color: C.faint, fontSize: 9.5, marginBottom: 16 }}>
          TRAINING FOCUS
        </div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 16, lineHeight: 1.5 }}>
          Your primary intent. JustFit can hold one at a time.
        </div>
        <Glass style={{ padding: 20 }}>
          {/* ── Training mode cards ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            {[
              { id: "general",  icon: "bolt",    title: "GENERAL HEALTH",  sub: "Strength · fat loss · mobility · endurance" },
              { id: "running",  icon: "run",     title: "RUNNING COACH",   sub: "5K → marathon plans · R556 ladder" },
              { id: "cycling",  icon: "cycle",   title: "CYCLING COACH",   sub: "Indoor + outdoor intervals" },
              { id: "military", icon: "shield",  title: "MILITARY COACH",  sub: "Keuring KCT · MARSOF · CSE" },
            ].map(card => {
              const isGeneral = card.id === "general";
              // selected = currently open/editing (drives highlight + expands settings)
              const selected = isGeneral
                ? !["running","cycling","military"].includes(focusSel)
                : focusSel === card.id;
              // saved = actually committed to DB (drives ACTIVE pill only)
              const saved = isGeneral
                ? !runCoachActive && !cycleCoachActive && !milCoachActive
                : card.id === "running" ? runCoachActive
                : card.id === "cycling" ? cycleCoachActive
                : milCoachActive;
              return (
                <button
                  key={card.id}
                  onClick={() => {
                    if (isGeneral) {
                      if (!selected) {
                        const lastGoal = ["running","cycling","military"].includes(prefs.training_goal ?? "health")
                          ? "health" : (prefs.training_goal ?? "health");
                        handleFocusTap(lastGoal);
                      }
                    } else {
                      if (selected) {
                        const goal = ["running","cycling","military"].includes(prefs.training_goal ?? "health")
                          ? "health" : (prefs.training_goal ?? "health");
                        handleFocusTap(goal);
                      } else {
                        handleFocusTap(card.id);
                      }
                    }
                  }}
                  style={{
                    width: "100%", textAlign: "left", cursor: "pointer",
                    padding: "14px 16px", borderRadius: 14,
                    border: `1px solid ${selected ? C.emeraldBorder : C.border}`,
                    background: selected ? C.emeraldDim : C.bgCard,
                    display: "flex", alignItems: "center", gap: 12,
                  }}
                >
                  {card.id === "military" ? <MilitaryIcon size={20} /> : (() => { const Ic = Icons[card.icon] || Icons.bolt; return <Ic size={20} c={selected ? C.emerald : C.muted} />; })()}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ ...eyebrow, fontSize: 11, color: selected ? C.emerald : C.text }}>{card.title}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{card.sub}</div>
                  </div>
                  {saved
                    ? <span style={{ ...eyebrow, fontSize: 9, color: C.emerald, background: C.emeraldDim, border: `1px solid ${C.emeraldBorder}`, padding: "3px 8px", borderRadius: 999, flexShrink: 0 }}>ACTIVE</span>
                    : <span style={{ color: C.faint, fontSize: 16, flexShrink: 0 }}>›</span>
                  }
                </button>
              );
            })}
          </div>

          {/* ── General Training sub-section ── */}
          {!["running","cycling","military"].includes(focusSel) && (
            <div>
              <div style={{ ...eyebrow, color: C.faint, fontSize: 9.5, marginBottom: 10 }}>YOUR GOAL</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 16 }}>
                {GOALS.map(g => {
                  const sel = focusSel === g.value;
                  return (
                    <button
                      key={g.value}
                      onClick={() => handleFocusTap(g.value)}
                      style={{
                        padding: "10px 6px 8px", borderRadius: 14, cursor: "pointer",
                        border: `1px solid ${sel ? C.emeraldBorder : C.border}`,
                        background: sel ? C.emeraldDim : "rgba(255,255,255,0.03)",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                      }}
                    >
                      <span style={{ color: sel ? C.emerald : C.muted, display: "flex", alignItems: "center" }}>
                        <GoalIcon value={g.value} size={20} />
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 900, color: sel ? C.emerald : C.text, textAlign: "center", lineHeight: 1.3 }}>
                        {g.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 8, borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
                Experience level
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {EXPERIENCE.map(ex => {
                  const sel = localExpLevel === ex.value;
                  return (
                    <button
                      key={ex.value}
                      onClick={() => setLocalExpLevel(ex.value)}
                      style={{
                        flex: 1, padding: "8px 4px", borderRadius: 14, cursor: "pointer",
                        border: `1px solid ${sel ? C.emeraldBorder : C.border}`,
                        background: sel ? C.emeraldDim : "rgba(255,255,255,0.03)",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                      }}
                    >
                      <span style={{ fontSize: 11, fontWeight: 900, color: sel ? C.emerald : C.text }}>{ex.label}</span>
                    </button>
                  );
                })}
              </div>
              {(() => {
                const info = {
                  health:      { title: "General Health · Balanced movement",      body: "Strength, cardio, mobility and recovery in rotation — the foundation of long-term fitness." },
                  strength:    { title: "Build Strength · Progressive overload",   body: "Compound movements with increasing resistance. Push/pull/legs cycling ensures full recovery between sessions." },
                  fat_loss:    { title: "Lose Weight · Mixed intensity",           body: "Cardio and strength combined to maximise calorie burn and build metabolic resilience over time." },
                  muscle_gain: { title: "Build Muscle · Volume focus",             body: "Higher set counts and controlled tempo. Progressive overload accumulates the stimulus needed for hypertrophy." },
                  endurance:   { title: "Endurance · Aerobic development",         body: "Longer sessions with steady-state cardio and zone 2 work to expand your aerobic base sustainably." },
                  mobility:    { title: "Mobility & Flex · Joint health",          body: "Stretching, flows and recovery work to improve range of motion, posture and injury resilience." },
                }[focusSel];
                if (!info) return null;
                return (
                  <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: 12, background: "rgba(16,185,129,0.06)", border: `1px solid ${C.emeraldBorder}` }}>
                    <div style={{ fontSize: 11, fontWeight: 900, color: C.emerald, marginBottom: 2 }}>{info.title}</div>
                    <div style={{ fontSize: 10, color: C.muted }}>{info.body}</div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ── Run Coach sub-section ── */}
          {focusSel === "running" && !planEquipment.includes("running_shoes") && (
            <button
              onClick={() => setPlanEquipment(eq => eq.includes("running_shoes") ? eq : [...eq.filter(v => v !== "none"), "running_shoes"])}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", borderRadius: 12, background: "rgba(16,185,129,0.06)", border: `1px solid ${C.emeraldBorder}`, cursor: "pointer", textAlign: "left" }}
            >
              <Icons.run size={18} c={C.emerald} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 900, color: C.emerald }}>Add running shoes</div>
                <div style={{ fontSize: 11, color: C.muted }}>Required for the running programme — tap to add to your equipment list.</div>
              </div>
            </button>
          )}
          {focusSel === "running" && planEquipment.includes("running_shoes") && (() => {
            const rcState = prefs.preferences?.run_coach ?? null;
            const isActive = rcState?.enrolled === true && !rcState?.completed;
            const unlockedTargets = rcState?.unlocked_targets ?? [];
            const prevRequired = Object.fromEntries(RUN_TARGETS.map(({ km, prevKm }) => [km, prevKm]));
            const weeksMap = Object.fromEntries(RUN_TARGETS.map(({ km, weeks }) => [km, weeks]));
            const showRampWarn = (() => {
              const prev = prevRequired[runTargetSelect];
              return prev && !unlockedTargets.includes(String(prev));
            })();
            return (
              <div style={{ opacity: effectiveIsPro ? 1 : 0.45 }}>
                <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 4 }}>Running Coach Program</div>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 12, lineHeight: 1.5 }}>
                  {isActive
                    ? `${rcState.target_km}km · Week ${rcState.week ?? 1} · Session ${rcState.session_in_week ?? 0} of 3`
                    : "Progressive run programme — 3 sessions per week, any days you choose."}
                </div>
                {effectiveIsPro ? (
                  <>
                    {/* Target distance — shown for both enrollment and active state */}
                    <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", color: C.muted, textTransform: "uppercase", marginBottom: 8 }}>Target distance</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: showRampWarn ? 10 : 12 }}>
                      {RUN_TARGETS.map(({ km, label }) => {
                        const done = unlockedTargets.includes(String(km));
                        const isSel = km === runTargetSelect;
                        return (
                          <button key={km} onClick={() => setRunTargetSelect(km)} style={{ padding: "7px 12px", borderRadius: 999, fontSize: 13, fontWeight: 800, cursor: "pointer", border: `1px solid ${isSel ? C.emeraldBorder : C.border}`, background: isSel ? C.emeraldDim : "rgba(255,255,255,0.03)", color: isSel ? C.emerald : C.muted }}>
                            {done ? "✓ " : ""}{label}
                          </button>
                        );
                      })}
                    </div>
                    {showRampWarn && (
                      <div role="status" style={{ marginBottom: 12, padding: "10px 14px", borderRadius: 12, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.25)", borderLeft: "2px solid #f59e0b" }}>
                        <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", color: C.amber, marginBottom: 4 }}>Progression caution</div>
                        <span style={{ fontSize: 11, color: "#fcd34d", fontWeight: 600, lineHeight: 1.5 }}>
                          Starting at {runTargetSelect}km without completing the {prevRequired[runTargetSelect]}km plan first significantly increases injury risk. We strongly recommend following the ramp-up progression.
                        </span>
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: C.subtle, marginBottom: 12 }}>
                      {weeksMap[runTargetSelect]} · up to 3 sessions/week · any days
                    </div>
                    {/* When active and target changed: show change button (restarts programme) */}
                    {isActive && runTargetSelect !== (rcState?.target_km ?? 5) && (
                      <div style={{ marginBottom: 12, padding: "10px 14px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}` }}>
                        <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>Switching target will restart your programme at week 1.</div>
                      </div>
                    )}
                  </>
                ) : (
                  <button onClick={onUpgrade} style={{ padding: "10px 16px", borderRadius: 12, fontFamily: "inherit", fontWeight: 900, fontSize: 13, cursor: "pointer", border: "1px solid rgba(var(--accent-rgb),0.3)", background: "rgba(var(--accent-rgb),0.08)", color: "var(--accent)" }}>
                    Upgrade naar Pro →
                  </button>
                )}
              <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: 12, background: "rgba(16,185,129,0.06)", border: `1px solid ${C.emeraldBorder}` }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: C.emerald, marginBottom: 2 }}>Running Coach · Structured progression</div>
                <div style={{ fontSize: 10, color: C.muted }}>3 sessions per week, any days you choose. Each target unlocks the next — safely building from 5 km to 30 km over time.</div>
              </div>
              </div>
            );
          })()}

          {/* ── Cycle Coach sub-section ── */}
          {focusSel === "cycling" && (() => {
            const ccState = prefs.preferences?.cycling_coach ?? null;
            const ccActive = ccState?.active === true && !ccState?.completed;
            const ftp = parseInt(cycleFtpInput) || 200;
            const maxHr = parseInt(cycleMaxHrInput) || 180;
            return (
              <div style={{ opacity: effectiveIsPro ? 1 : 0.45 }}>
                <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 4 }}>Cycling Coach Program</div>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 12, lineHeight: 1.5 }}>
                  {ccActive
                    ? `Week ${ccState.week ?? 1} · Session ${ccState.session_in_week ?? 0} of ${ccState.cycling_days_per_week ?? 3} · ${ccState.unit === 'hr' ? 'HR-based' : `FTP ${ccState.ftp_watts ?? 200}W`}`
                    : "Structured training — 5 goals, 7-week block cycle, 3–5 sessions per week, any days."}
                </div>
                {effectiveIsPro ? (
                  <>
                    {!ccActive && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 12 }}>
                        {/* Training goal (sub-goal) */}
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", color: C.muted, textTransform: "uppercase", marginBottom: 6 }}>Training goal</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {CYCLE_SUB_GOALS.map(g => (
                              <button key={g.v} onClick={() => setCycleSubGoalSelect(g.v)} style={{ padding: "5px 12px", borderRadius: 999, fontSize: 12, fontWeight: 800, cursor: "pointer", border: `1px solid ${cycleSubGoalSelect === g.v ? C.emeraldBorder : C.border}`, background: cycleSubGoalSelect === g.v ? C.emeraldDim : "rgba(255,255,255,0.03)", color: cycleSubGoalSelect === g.v ? C.emerald : C.muted }}>
                                {g.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        {/* Training unit */}
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", color: C.muted, textTransform: "uppercase", marginBottom: 6 }}>Training unit</div>
                          <div style={{ display: "flex", gap: 6 }}>
                            {[{v:'watts',label:'Watts (power meter)'},{v:'hr',label:'Heart rate (bpm)'}].map(u => (
                              <button key={u.v} onClick={() => setCycleUnitSelect(u.v)} style={{ padding: "5px 12px", borderRadius: 999, fontSize: 12, fontWeight: 800, cursor: "pointer", border: `1px solid ${cycleUnitSelect === u.v ? C.emeraldBorder : C.border}`, background: cycleUnitSelect === u.v ? C.emeraldDim : "rgba(255,255,255,0.03)", color: cycleUnitSelect === u.v ? C.emerald : C.muted }}>
                                {u.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                          {cycleUnitSelect === 'watts' ? (
                            <>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", color: C.muted, textTransform: "uppercase", marginBottom: 4 }}>Current FTP (W)</div>
                                <input type="number" min={50} max={600} value={cycleFtpInput} onChange={e => setCycleFtpInput(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, color: C.text, fontSize: 14, fontWeight: 700, boxSizing: "border-box" }} />
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", color: C.muted, textTransform: "uppercase", marginBottom: 4 }}>Target FTP (W)</div>
                                <input type="number" min={50} max={600} value={cycleTargetFtpInput} onChange={e => setCycleTargetFtpInput(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, color: C.text, fontSize: 14, fontWeight: 700, boxSizing: "border-box" }} />
                              </div>
                              <button onClick={() => setShowFtpTestModal(true)} style={{ padding: "8px 12px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, color: C.muted, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                                Test FTP
                              </button>
                            </>
                          ) : (
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", color: C.muted, textTransform: "uppercase", marginBottom: 4 }}>Max heart rate (bpm)</div>
                              <input type="number" min={100} max={220} value={cycleMaxHrInput} onChange={e => setCycleMaxHrInput(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, color: C.text, fontSize: 14, fontWeight: 700, boxSizing: "border-box" }} />
                            </div>
                          )}
                        </div>
                        {/* Cycling sessions per week */}
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", color: C.muted, textTransform: "uppercase", marginBottom: 6 }}>Cycling sessions / week</div>
                          <div style={{ display: "flex", gap: 6 }}>
                            {[3,4,5].map(n => (
                              <button key={n} onClick={() => setCycleDaysPerWeek(n)} style={{ padding: "5px 14px", borderRadius: 999, fontSize: 13, fontWeight: 800, cursor: "pointer", border: `1px solid ${cycleDaysPerWeek === n ? C.emeraldBorder : C.border}`, background: cycleDaysPerWeek === n ? C.emeraldDim : "rgba(255,255,255,0.03)", color: cycleDaysPerWeek === n ? C.emerald : C.muted }}>
                                {n}
                              </button>
                            ))}
                          </div>
                          <div style={{ fontSize: 10, color: C.subtle, marginTop: 4 }}>Min 2 rest days are always preserved.</div>
                        </div>
                        <div style={{ fontSize: 11, color: C.subtle, lineHeight: 1.5 }}>
                          7-week block cycle (base → build → recovery) · {cycleDaysPerWeek} sessions/week · any days
                          {cycleUnitSelect === 'watts' && ftp > 0 && <> · Z2 target: {Math.round(ftp * 0.55)}–{Math.round(ftp * 0.75)}W</>}
                          {cycleUnitSelect === 'hr' && maxHr > 0 && <> · Z2 target: {Math.round(maxHr * 0.68)}–{Math.round(maxHr * 0.83)} bpm</>}
                        </div>
                      </div>
                    )}
                    {/* When active: sub-goal switcher + FTP test + cross-training settings */}
                    {ccActive && (() => {
                      const maxCrossTrainDays = Math.min(3, 5 - (ccState?.cycling_days_per_week ?? 3));
                      const saveCrossTrainPrefs = async () => {
                        const updatedCc = { ...ccState, run_cross_training: cycleCrossTrainEnabled, run_days_per_week: cycleCrossTrainEnabled ? Math.min(cycleCrossTrainDays, maxCrossTrainDays) : (ccState.run_days_per_week ?? 1) };
                        const newPrefs = { ...(prefs.preferences ?? {}), cycling_coach: updatedCc };
                        onUpdate(p => ({ ...p, preferences: newPrefs }));
                        await api.saveProfile(token, { preferences: newPrefs });
                      };
                      const saveSubGoal = async () => {
                        const updatedCc = { ...ccState, sub_goal: cycleSubGoalSelect };
                        const newPrefs = { ...(prefs.preferences ?? {}), cycling_coach: updatedCc };
                        onUpdate(p => ({ ...p, preferences: newPrefs }));
                        await api.saveProfile(token, { preferences: newPrefs });
                      };
                      return (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 12 }}>
                          {/* Sub-goal switcher (always editable even when active) */}
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", color: C.muted, textTransform: "uppercase", marginBottom: 6 }}>Training goal</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                              {CYCLE_SUB_GOALS.map(g => (
                                <button key={g.v} onClick={() => setCycleSubGoalSelect(g.v)} style={{ padding: "5px 12px", borderRadius: 999, fontSize: 12, fontWeight: 800, cursor: "pointer", border: `1px solid ${cycleSubGoalSelect === g.v ? C.emeraldBorder : C.border}`, background: cycleSubGoalSelect === g.v ? C.emeraldDim : "rgba(255,255,255,0.03)", color: cycleSubGoalSelect === g.v ? C.emerald : C.muted }}>
                                  {g.label}
                                </button>
                              ))}
                            </div>
                            {cycleSubGoalSelect !== (ccState?.sub_goal ?? 'build_fitness') && (
                              <button onClick={saveSubGoal} style={{ padding: "5px 14px", borderRadius: 999, fontSize: 12, fontWeight: 800, cursor: "pointer", border: `1px solid ${C.emeraldBorder}`, background: C.emeraldDim, color: C.emerald }}>
                                Save goal →
                              </button>
                            )}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <button onClick={() => setShowFtpTestModal(true)} style={{ padding: "5px 12px", borderRadius: 999, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, color: C.muted, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                              Test FTP
                            </button>
                          </div>
                          {/* Cross-training runs toggle */}
                          <div style={{ padding: "10px 12px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}` }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: cycleCrossTrainEnabled ? 10 : 0 }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>Cross-training runs</div>
                                <div style={{ fontSize: 11, color: C.muted }}>Add running sessions on short or rest days</div>
                              </div>
                              <button onClick={() => setCycleCrossTrainEnabled(v => !v)} style={{ padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 800, cursor: "pointer", border: `1px solid ${cycleCrossTrainEnabled ? C.emeraldBorder : C.border}`, background: cycleCrossTrainEnabled ? C.emeraldDim : "rgba(255,255,255,0.03)", color: cycleCrossTrainEnabled ? C.emerald : C.muted }}>
                                {cycleCrossTrainEnabled ? "On" : "Off"}
                              </button>
                            </div>
                            {cycleCrossTrainEnabled && (
                              <div>
                                <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", color: C.muted, textTransform: "uppercase", marginBottom: 6 }}>Run days / week</div>
                                <div style={{ display: "flex", gap: 6 }}>
                                  {[1,2,3].filter(n => n <= maxCrossTrainDays).map(n => (
                                    <button key={n} onClick={() => setCycleCrossTrainDays(n)} style={{ padding: "4px 12px", borderRadius: 999, fontSize: 13, fontWeight: 800, cursor: "pointer", border: `1px solid ${cycleCrossTrainDays === n ? C.emeraldBorder : C.border}`, background: cycleCrossTrainDays === n ? C.emeraldDim : "rgba(255,255,255,0.03)", color: cycleCrossTrainDays === n ? C.emerald : C.muted }}>
                                      {n}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <button onClick={saveCrossTrainPrefs} style={{ padding: "7px 0", borderRadius: 10, background: C.emeraldDim, border: `1px solid ${C.emeraldBorder}`, color: C.emerald, fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
                            Save settings
                          </button>
                        </div>
                      );
                    })()}
                  </>
                ) : (
                  <button onClick={onUpgrade} style={{ padding: "10px 16px", borderRadius: 12, fontFamily: "inherit", fontWeight: 900, fontSize: 13, cursor: "pointer", border: "1px solid rgba(var(--accent-rgb),0.3)", background: "rgba(var(--accent-rgb),0.08)", color: "var(--accent)" }}>
                    Upgrade naar Pro →
                  </button>
                )}
              <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: 12, background: "rgba(16,185,129,0.06)", border: `1px solid ${C.emeraldBorder}` }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: C.emerald, marginBottom: 2 }}>Cycling Coach · FTP-based training</div>
                <div style={{ fontSize: 10, color: C.muted }}>Polarised 80/20 method — 80% zone 2 endurance, 20% high-intensity intervals. 3–5 sessions per week in 7-week cycles (base → build → recovery). Optional cross-training runs on rest or short days.</div>
              </div>
              </div>
            );
          })()}

          {/* ── Military Coach sub-section ── */}
          {focusSel === "military" && (() => {
            const mc = prefs.preferences?.military_coach ?? null;
            const isActive = !!(mc?.active);
            const KEURING_CLUSTERS  = [
              { v: 0, label: "KB", desc: "Basis — starting level" },
              { v: 1, label: "K1", desc: "Entry level service" },
              { v: 2, label: "K2", desc: "Standard service" },
              { v: 3, label: "K3", desc: "Infantry / most roles" },
              { v: 4, label: "K4", desc: "Above average" },
              { v: 5, label: "K5", desc: "High performance" },
              { v: 6, label: "K6", desc: "Special forces baseline" },
            ];
            const OPLEIDING_CLUSTERS = [
              { v: 1, label: "O1", desc: "Opleiding entry" },
              { v: 2, label: "O2", desc: "Standard training" },
              { v: 3, label: "O3", desc: "Infantry training" },
              { v: 4, label: "O4", desc: "Above average" },
              { v: 5, label: "O5", desc: "High performance" },
              { v: 6, label: "O6", desc: "Advanced training" },
            ];
            const clusters = milTrack === 'keuring' ? KEURING_CLUSTERS : OPLEIDING_CLUSTERS;
            return (
              <div>
                <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 4 }}>Military Coach Program</div>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 14, lineHeight: 1.5 }}>
                  {isActive
                    ? `${mc.track === 'keuring' ? 'Physical Assessment' : 'Educational Fitness'} · ${mc.mode === 'open' ? 'Open progression' : `Target ${mc.track === 'keuring' ? (mc.cluster_target === 0 ? 'KB' : `K${mc.cluster_target}`) : `O${mc.cluster_target}`}`}`
                    : "Dutch Defensie prep — train toward your target level at your own pace or with a fixed assessment date."}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {/* ── Mode — first ── */}
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", color: C.muted, textTransform: "uppercase", marginBottom: 6 }}>Mode</div>
                      <div style={{ display: "flex", gap: 6 }}>
                        {[
                          {v:'target', label:'Target date', sub:'Assessment on a set date'},
                          {v:'fit',    label:'Fit target',  sub:'Goal level, no fixed date'},
                          {v:'open',   label:'Open',        sub:'No goal or end date'},
                        ].map(m => (
                          <button key={m.v} onClick={() => setMilMode(m.v)}
                            style={{ flex: 1, padding: "9px 8px", borderRadius: 12, cursor: "pointer", border: `1px solid ${milMode === m.v ? C.emeraldBorder : C.border}`, background: milMode === m.v ? C.emeraldDim : "rgba(255,255,255,0.03)", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                            <span style={{ fontSize: 12, fontWeight: 900, color: milMode === m.v ? C.emerald : C.text }}>{m.label}</span>
                            <span style={{ fontSize: 10, color: C.muted }}>{m.sub}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* ── Track + Cluster — only for target / fit (open needs no cluster) ── */}
                    {milMode !== 'open' && (<>
                      <div>
                        <div style={{ ...eyebrow, color: C.faint, fontSize: 9.5, marginBottom: 8 }}>TRACK</div>
                        {[
                          { v: 'keuring',   title: 'KEURING',   body: 'Fitness assessment', sub: 'Basis → K6 · 7 levels' },
                          { v: 'opleiding', title: 'OPLEIDING', body: 'Training programme', sub: 'O1 → O6 · 6 levels' },
                        ].map(t => (
                          <button key={t.v} onClick={() => { setMilTrack(t.v); setMilCluster(3); }}
                            style={{
                              width: "100%", textAlign: "left",
                              background: milTrack === t.v ? C.emeraldDim : C.bgCard,
                              borderLeft: `4px solid ${milTrack === t.v ? C.emerald : "transparent"}`,
                              border: `1px solid ${milTrack === t.v ? C.emeraldBorder : C.border}`,
                              borderRadius: 14, padding: "14px 16px", marginBottom: 8,
                              cursor: "pointer",
                            }}>
                            <div style={{ ...eyebrow, color: milTrack === t.v ? C.emerald : C.faint }}>{t.title}</div>
                            <div style={{ ...display(18), color: C.text, marginTop: 4 }}>{t.body}</div>
                            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{t.sub}</div>
                          </button>
                        ))}
                      </div>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", color: C.muted, textTransform: "uppercase", marginBottom: 6 }}>Target cluster</div>
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                          {clusters.map(c => (
                            <button key={c.v} onClick={() => setMilCluster(c.v)}
                              title={c.desc}
                              style={{ padding: "7px 12px", borderRadius: 999, fontSize: 12, fontWeight: 800, cursor: "pointer", border: `1px solid ${milCluster === c.v ? C.emeraldBorder : C.border}`, background: milCluster === c.v ? C.emeraldDim : "rgba(255,255,255,0.03)", color: milCluster === c.v ? C.emerald : C.muted }}>
                              {c.label}
                            </button>
                          ))}
                        </div>
                        <div style={{ fontSize: 11, color: C.subtle, marginTop: 5 }}>{clusters.find(c => c.v === milCluster)?.desc ?? ""}</div>
                      </div>
                    </>)}
                    {/* ── Assessment date — only for target mode ── */}
                    {milMode === 'target' && (
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", color: C.muted, textTransform: "uppercase", marginBottom: 6 }}>Assessment date</div>
                        <input type="date" value={milTargetDate} onChange={e => setMilTargetDate(e.target.value)}
                          min={new Date(Date.now() + 21 * 86400000).toISOString().slice(0,10)}
                          style={{ width: "100%", padding: "9px 12px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, color: C.text, fontSize: 14, fontWeight: 700, boxSizing: "border-box" }} />
                        {milTargetDate && (() => {
                          const days  = Math.ceil((new Date(milTargetDate + 'T00:00:00Z') - Date.now()) / 86400000);
                          const weeks = Math.floor(days / 7);
                          if (days < 28) return <div style={{ fontSize: 11, color: C.rose, marginTop: 5, fontWeight: 600 }}>Too short — minimum 4 weeks needed</div>;
                          if (days > 42) return <div style={{ fontSize: 11, color: C.emerald, marginTop: 5, fontWeight: 600 }}>{weeks} weeks · Base building now → 6-week specific prep in week {weeks - 5}</div>;
                          return <div style={{ fontSize: 11, color: C.emerald, marginTop: 5, fontWeight: 600 }}>{weeks} weeks · Entering specific prep phase directly</div>;
                        })()}
                      </div>
                    )}
                    {/* ── Pack weight ── */}
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", color: C.muted, textTransform: "uppercase", marginBottom: 8 }}>Pack weight available (kg)</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {[5, 10, 15, 20, 25, 30, 35].map(kg => {
                          const sel = milPackWeight.includes(kg);
                          return (
                            <button key={kg} onClick={() => setMilPackWeight(w => sel ? w.filter(v => v !== kg) : [...w, kg].sort((a, b) => a - b))}
                              style={{ padding: "8px 14px", borderRadius: 20, fontSize: 13, fontWeight: 800, cursor: "pointer", border: sel ? `1px solid ${C.emeraldBorder}` : `1px solid ${C.border}`, background: sel ? C.emeraldDim : "rgba(255,255,255,0.04)", color: sel ? C.emerald : C.text, fontFamily: "inherit" }}>
                              {kg} kg
                            </button>
                          );
                        })}
                      </div>
                      <div style={{ fontSize: 11, color: C.subtle, marginTop: 6 }}>Select all weights you own. The planner picks the heaviest available weight for each session.</div>
                    </div>
                    {!planEquipment.includes("trail_shoes") && (
                      <button
                        onClick={() => setPlanEquipment(eq => eq.includes("trail_shoes") ? eq : [...eq.filter(v => v !== "none"), "trail_shoes"])}
                        style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", borderRadius: 12, background: "rgba(16,185,129,0.06)", border: `1px solid ${C.emeraldBorder}`, cursor: "pointer", textAlign: "left" }}
                      >
                        <Icons.run size={18} c={C.emerald} />
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 900, color: C.emerald }}>Add trail shoes / hiking boots</div>
                          <div style={{ fontSize: 11, color: C.muted }}>Recommended for march sessions — tap to add to your equipment list.</div>
                        </div>
                      </button>
                    )}
                    {/* ── Mode info panels ── */}
                    {milMode === 'open' && (
                      <div style={{ padding: "10px 14px", borderRadius: 12, background: "rgba(16,185,129,0.06)", border: `1px solid ${C.emeraldBorder}` }}>
                        <div style={{ fontSize: 11, fontWeight: 900, color: C.emerald, marginBottom: 2 }}>Open progression · Rolling 6-week cycle</div>
                        <div style={{ fontSize: 10, color: C.muted }}>No assessment date needed. Continuously cycles through training phases — great for long-term fitness maintenance.</div>
                      </div>
                    )}
                    {milMode === 'fit' && (
                      <div style={{ padding: "10px 14px", borderRadius: 12, background: "rgba(16,185,129,0.06)", border: `1px solid ${C.emeraldBorder}` }}>
                        <div style={{ fontSize: 11, fontWeight: 900, color: C.emerald, marginBottom: 2 }}>Fit target · Progressive base building</div>
                        <div style={{ fontSize: 10, color: C.muted }}>Train toward your goal level at your own pace. RPE signals advance your training automatically — no assessment date required.</div>
                      </div>
                    )}
                    {milMode === 'target' && !milTargetDate && (
                      <div style={{ padding: "10px 14px", borderRadius: 12, background: "rgba(16,185,129,0.06)", border: `1px solid ${C.emeraldBorder}` }}>
                        <div style={{ fontSize: 11, fontWeight: 900, color: C.emerald, marginBottom: 2 }}>Assessment target · Two-phase training</div>
                        <div style={{ fontSize: 10, color: C.muted }}>Training anchors to your assessment date. Base building starts immediately; a structured 6-week specific prep begins automatically at 6 weeks out.</div>
                      </div>
                    )}
                    {milMode === 'target' && milTargetDate && (() => {
                      const msLeft  = new Date(milTargetDate + 'T00:00:00Z').getTime() - Date.now();
                      const daysLeft = Math.ceil(msLeft / 86400000);
                      const weeks   = Math.floor(daysLeft / 7);
                      if (daysLeft < 28) return (
                        <div style={{ padding: "10px 14px", borderRadius: 12, background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.25)", borderLeft: "2px solid #f43f5e" }}>
                          <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", color: "#f43f5e", marginBottom: 3 }}>Too short</div>
                          <span style={{ fontSize: 11, color: "#fda4af", fontWeight: 600 }}>Minimum 4 weeks needed for safe preparation. Choose a later date.</span>
                        </div>
                      );
                      if (daysLeft > 42) return (
                        <div style={{ padding: "10px 14px", borderRadius: 12, background: "rgba(16,185,129,0.06)", border: `1px solid ${C.emeraldBorder}` }}>
                          <div style={{ fontSize: 11, fontWeight: 900, color: C.emerald, marginBottom: 2 }}>{weeks} weeks until assessment · Base building now</div>
                          <div style={{ fontSize: 10, color: C.muted }}>Progressive training starts today. Specific 6-week prep begins automatically at 6 weeks out.</div>
                        </div>
                      );
                      const phase = daysLeft >= 36 ? "On-ramp" : daysLeft >= 29 ? "Build" : daysLeft >= 22 ? "Build" : daysLeft >= 15 ? "Peak" : daysLeft >= 8 ? "Deload" : "Taper";
                      return (
                        <div style={{ padding: "10px 14px", borderRadius: 12, background: "rgba(16,185,129,0.06)", border: `1px solid ${C.emeraldBorder}` }}>
                          <div style={{ fontSize: 11, fontWeight: 900, color: C.emerald, marginBottom: 2 }}>{weeks} weeks until assessment · Starting in {phase} phase</div>
                          <div style={{ fontSize: 10, color: C.muted }}>Training anchors to your assessment date — phases shift automatically as the date approaches.</div>
                        </div>
                      );
                    })()}
                    {/* ── Cooper test stub ── */}
                    <div style={{ padding: "14px 16px", borderRadius: 14, background: C.bgCard2, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ ...eyebrow, color: C.faint, fontSize: 9.5, marginBottom: 4 }}>COOPER TEST</div>
                        <div style={{ ...mono(12), color: C.mutedStrong }}>
                          {prefs.preferences?.military_coach?.last_cooper_distance_m
                            ? `Last result: ${prefs.preferences.military_coach.last_cooper_distance_m} m`
                            : "No test recorded yet"}
                        </div>
                      </div>
                      <button
                        onClick={() => onOpenCooperModal?.()}
                        style={{ padding: "8px 14px", borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: "pointer", border: `1px solid ${C.emeraldBorder}`, background: C.emeraldDim, color: C.emerald, whiteSpace: "nowrap", flexShrink: 0 }}
                      >
                        Log test →
                      </button>
                    </div>
                  </div>
              </div>
            );
          })()}

          {/* ── Single save / activate button ── */}
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
            <button
              onClick={handleFocusSave}
              disabled={focusSaveStatus === "saving"}
              style={{
                width: "100%", padding: "13px 20px", borderRadius: 14, fontSize: 13, fontWeight: 900,
                cursor: focusSaveStatus === "saving" ? "default" : "pointer",
                border: `1px solid ${focusSaveStatus === "saved" ? "transparent" : C.emeraldBorder}`,
                background: focusSaveStatus === "saved" ? C.emerald : C.emeraldDim,
                color: focusSaveStatus === "saved" ? "#fff" : C.emerald,
              }}
            >
              {focusSaveStatus === "saved" ? "Saved ✓" :
               focusSaveStatus === "saving" ? "Saving…" :
               focusSel === "running" && runCoachActive && runTargetSelect === (prefs.preferences?.run_coach?.target_km ?? 5) ? `Re-enrol · ${runTargetSelect}km (resets progress)` :
               focusSel === "running" && runCoachActive ? `Switch to ${runTargetSelect}km →` :
               focusSel === "running" ? `Activate · ${runTargetSelect}km Run Coach` :
               focusSel === "cycling" ? "Activate · Cycling Coach" :
               focusSel === "military" && milCoachActive ? `Save changes · ${milMode === 'open' ? 'Open' : `${milTrack === 'keuring' ? (milCluster === 0 ? 'KB' : `K${milCluster}`) : `O${milCluster}`}${milMode === 'fit' ? ' · Fit target' : ''}`}` :
               focusSel === "military" ? `Activate · Military Coach · ${milMode === 'open' ? 'Open' : `${milTrack === 'keuring' ? (milCluster === 0 ? 'KB' : `K${milCluster}`) : `O${milCluster}`}${milMode === 'fit' ? ' · Fit target' : ''}`}` :
               `Activate · ${GOALS.find(g => g.value === focusSel)?.label ?? "General Health"}`}
            </button>
          </div>
        </Glass>
      </div>
      </>)}

      {subView === "trainers" && (
        <TrainersSubView token={token} C={C} display={display} Glass={Glass} />
      )}

      {subView === "you" && (<>
      {/* ── Daily Planning ──────────────────────────────────── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", color: C.emerald, textTransform: "uppercase", marginBottom: 16 }}>
          Daily Planning
        </div>
        <Glass style={{ padding: 24 }}>

          {/* Check-in mode */}
          <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 4 }}>
            Daily check-in
          </div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 12, lineHeight: 1.5 }}>
            Controls when the Daily Intelligence Prompt appears.
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
            {[
              { id: "every_time", label: "Every time",  sub: "On every open" },
              { id: "once_a_day", label: "Once a day",  sub: "First open only" },
              { id: "manual",     label: "Manual",       sub: "You decide" },
            ].map(({ id, label, sub }) => {
              const sel = checkinMode === id;
              return (
                <button
                  key={id}
                  onClick={() => setCheckinMode(id)}
                  style={{
                    flex: 1, padding: "10px 6px", borderRadius: 14, cursor: "pointer",
                    border: `1px solid ${sel ? C.emeraldBorder : C.border}`,
                    background: sel ? C.emeraldDim : "rgba(255,255,255,0.03)",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 900, color: sel ? C.emerald : C.text }}>{label}</span>
                  <span style={{ fontSize: 10, color: sel ? C.emerald : C.muted, opacity: 0.8 }}>{sub}</span>
                </button>
              );
            })}
          </div>

          {/* Session duration — Standard / Advanced selector */}
          <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 4, borderTop: `1px solid ${C.border}`, marginTop: 4, paddingTop: 20 }}>
            Available time per session
          </div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 12, lineHeight: 1.5 }}>
            Sets the default length of your daily plan. You can always adjust on the day.
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
            {[
              { id: false, label: "Standard", sub: "One duration for all days" },
              { id: true,  label: "Advanced", sub: "Set time per day of week" },
            ].map(({ id, label, sub }) => {
              const sel = showAdvancedSchedule === id;
              return (
                <button
                  key={String(id)}
                  onClick={() => {
                    if (id === true && !showAdvancedSchedule) {
                      // First activation: seed all days with current standard duration
                      setWeeklySchedule({ mon: planDuration, tue: planDuration, wed: planDuration, thu: planDuration, fri: planDuration, sat: planDuration, sun: planDuration });
                    }
                    setShowAdvancedSchedule(id);
                  }}
                  style={{
                    flex: 1, padding: "10px 6px", borderRadius: 14, cursor: "pointer",
                    border: `1px solid ${sel ? C.emeraldBorder : C.border}`,
                    background: sel ? C.emeraldDim : "rgba(255,255,255,0.03)",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 900, color: sel ? C.emerald : C.text }}>{label}</span>
                  <span style={{ fontSize: 10, color: sel ? C.emerald : C.muted, opacity: 0.8 }}>{sub}</span>
                </button>
              );
            })}
          </div>

          {!showAdvancedSchedule ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
              {[15, 20, 30, 45, 60, 90, 120].map((d) => (
                <button
                  key={d}
                  onClick={() => setPlanDuration(d)}
                  style={{
                    padding: "8px 18px", borderRadius: 999, fontWeight: 700, fontSize: 13,
                    border: `1px solid ${planDuration === d ? C.emeraldBorder : C.border}`,
                    background: planDuration === d ? C.emeraldDim : "rgba(255,255,255,0.03)",
                    color: planDuration === d ? C.emerald : C.muted,
                    cursor: "pointer",
                  }}
                >
                  {d === 60 ? '1h' : d === 90 ? '1.5h' : d === 120 ? '2h' : `${d} min`}
                </button>
              ))}
            </div>
          ) : (() => {
            const ADV_STEPS = [0, 10, 20, 30, 40, 50, 60, 75, 90, 105, 120, 135, 150, 165, 180, 210, 240, 270, 300, 330, 999];
            const fmtStep = v => {
              if (v === 0)   return 'Rest';
              if (v === 999) return '∞';
              if (v < 60)    return `${v}m`;
              const h = Math.floor(v / 60), m = v % 60;
              return m === 0 ? `${h}h` : `${h}h ${m}m`;
            };
            return (
              <div style={{ marginBottom: 24, display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { key: "mon", label: "Mon" },
                  { key: "tue", label: "Tue" },
                  { key: "wed", label: "Wed" },
                  { key: "thu", label: "Thu" },
                  { key: "fri", label: "Fri" },
                  { key: "sat", label: "Sat" },
                  { key: "sun", label: "Sun" },
                ].map(({ key, label }) => {
                  const raw = weeklySchedule[key] ?? planDuration;
                  const val = ADV_STEPS.reduce((best, s) => Math.abs(s - raw) < Math.abs(best - raw) ? s : best, ADV_STEPS[0]);
                  const idx = ADV_STEPS.indexOf(val);
                  const isRest = val === 0;
                  const btnStyle = (disabled) => ({
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.04)",
                    color: disabled ? C.subtle : C.text,
                    fontSize: 22, fontWeight: 300, cursor: disabled ? "default" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  });
                  return (
                    <div key={key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 34, fontSize: 11, fontWeight: 900, color: isRest ? C.subtle : C.muted, textTransform: "uppercase", letterSpacing: "0.08em", flexShrink: 0 }}>
                        {label}
                      </div>
                      <button
                        onClick={() => setWeeklySchedule(s => ({ ...s, [key]: ADV_STEPS[Math.max(0, idx - 1)] }))}
                        disabled={idx === 0}
                        style={btnStyle(idx === 0)}
                      >−</button>
                      <div style={{ flex: 1, textAlign: "center", fontSize: 15, fontWeight: 900, color: isRest ? C.muted : C.emerald }}>
                        {fmtStep(val)}
                      </div>
                      <button
                        onClick={() => setWeeklySchedule(s => ({ ...s, [key]: ADV_STEPS[Math.min(ADV_STEPS.length - 1, idx + 1)] }))}
                        disabled={idx === ADV_STEPS.length - 1}
                        style={btnStyle(idx === ADV_STEPS.length - 1)}
                      >+</button>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          <div style={{ height: 1, background: C.border, marginBottom: 24 }} />

          {/* ── Time overhead ── */}
          {(() => {
            const presetDefs = [
              { key: "change_clothes",    label: "Change clothes" },
              { key: "prepare_equipment", label: "Prepare equipment" },
              { key: "clean_equipment",   label: "Clean equipment" },
              { key: "shower",            label: "Shower" },
            ];
            const profileTotal = (profile) =>
              presetDefs.reduce((s, { key }) => s + (profile?.presets?.[key] || 0), 0) +
              (profile?.custom ?? []).reduce((s, c) => s + (c.minutes || 0), 0);
            const shortTotal = profileTotal(timeOverhead.short);
            const longTotal  = profileTotal(timeOverhead.long);

            const stepMin = (profile, key, delta) =>
              setTimeOverhead((o) => ({
                ...o,
                [profile]: { ...o[profile], presets: { ...o[profile].presets, [key]: Math.max(0, Math.min(60, (o[profile].presets?.[key] || 0) + delta)) } },
              }));
            const stepCustom = (profile, idx, delta) =>
              setTimeOverhead((o) => {
                const c = [...(o[profile].custom ?? [])];
                c[idx] = { ...c[idx], minutes: Math.max(0, Math.min(60, (c[idx].minutes || 0) + delta)) };
                return { ...o, [profile]: { ...o[profile], custom: c } };
              });
            const renameCustom = (profile, idx, lbl) =>
              setTimeOverhead((o) => {
                const c = [...(o[profile].custom ?? [])];
                c[idx] = { ...c[idx], label: lbl };
                return { ...o, [profile]: { ...o[profile], custom: c } };
              });
            const removeCustom = (profile, idx) =>
              setTimeOverhead((o) => ({ ...o, [profile]: { ...o[profile], custom: (o[profile].custom ?? []).filter((_, i) => i !== idx) } }));
            const addCustom = (profile) =>
              setTimeOverhead((o) => ({ ...o, [profile]: { ...o[profile], custom: [...(o[profile].custom ?? []), { label: "", minutes: 0 }] } }));

            const StepRow = ({ label, value, onMinus, onPlus }) => (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: value > 0 ? C.text : C.muted }}>{label}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button onClick={onMinus} style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.04)", color: C.text, cursor: "pointer", fontSize: 16, lineHeight: 1 }}>−</button>
                  <span style={{ width: 32, textAlign: "center", fontSize: 13, fontWeight: 900, color: value > 0 ? C.emerald : C.muted }}>{value}m</span>
                  <button onClick={onPlus} style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.04)", color: C.text, cursor: "pointer", fontSize: 16, lineHeight: 1 }}>+</button>
                </div>
              </div>
            );

            const ProfileSection = ({ profileKey, title }) => {
              const profile = timeOverhead[profileKey] ?? { presets: {}, custom: [] };
              return (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, marginTop: 16 }}>
                    <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", color: C.emerald, textTransform: "uppercase", whiteSpace: "nowrap" }}>{title}</div>
                    <div style={{ flex: 1, height: 1, background: C.border }} />
                  </div>
                  {presetDefs.map(({ key, label }) => (
                    <StepRow key={key} label={label} value={profile.presets?.[key] || 0}
                      onMinus={() => stepMin(profileKey, key, -5)} onPlus={() => stepMin(profileKey, key, 5)} />
                  ))}
                  {(profile.custom ?? []).map((c, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: `1px solid ${C.border}` }}>
                      <input
                        value={c.label}
                        onChange={(e) => renameCustom(profileKey, idx, e.target.value)}
                        placeholder="e.g. Drive to gym"
                        style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, borderRadius: 8, padding: "4px 10px", color: C.text, fontSize: 13, fontWeight: 700, outline: "none" }}
                      />
                      <button onClick={() => stepCustom(profileKey, idx, -5)} style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.04)", color: C.text, cursor: "pointer", fontSize: 16, lineHeight: 1 }}>−</button>
                      <span style={{ width: 32, textAlign: "center", fontSize: 13, fontWeight: 900, color: c.minutes > 0 ? C.emerald : C.muted }}>{c.minutes}m</span>
                      <button onClick={() => stepCustom(profileKey, idx, 5)} style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.04)", color: C.text, cursor: "pointer", fontSize: 16, lineHeight: 1 }}>+</button>
                      <button onClick={() => removeCustom(profileKey, idx)} style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid rgba(226,76,74,0.3)`, background: "rgba(226,76,74,0.08)", color: "#f87171", cursor: "pointer", fontSize: 15, lineHeight: 1 }}>×</button>
                    </div>
                  ))}
                  {(profile.custom ?? []).length < 3 && (
                    <button onClick={() => addCustom(profileKey)} style={{ marginTop: 8, padding: "5px 12px", borderRadius: 999, fontSize: 11, fontWeight: 800, cursor: "pointer", border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.03)", color: C.muted }}>
                      + Add custom block
                    </button>
                  )}
                </div>
              );
            };

            return (
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase" }}>Time overhead</div>
                  <button
                    onClick={() => setOverheadEditMode((v) => !v)}
                    style={{ padding: "4px 12px", borderRadius: 999, fontSize: 11, fontWeight: 800, cursor: "pointer", border: `1px solid ${overheadEditMode ? C.emeraldBorder : C.border}`, background: overheadEditMode ? C.emeraldDim : "rgba(255,255,255,0.04)", color: overheadEditMode ? C.emerald : C.muted }}
                  >
                    {overheadEditMode ? "Done" : "Edit"}
                  </button>
                </div>

                {!overheadEditMode ? (
                  <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.8 }}>
                    {timeOverhead.enabled && (shortTotal > 0 || longTotal > 0) ? (
                      <span>
                        {shortTotal > 0 && <span>Quick session: <span style={{ color: C.emerald, fontWeight: 800 }}>{shortTotal} min</span> overhead</span>}
                        {shortTotal > 0 && longTotal > 0 && <span style={{ color: C.subtle }}> · </span>}
                        {longTotal > 0 && <span>Full session: <span style={{ color: C.emerald, fontWeight: 800 }}>{longTotal} min</span> overhead</span>}
                      </span>
                    ) : (
                      <span style={{ color: C.subtle, fontStyle: "italic" }}>Not set — full window used for training</span>
                    )}
                  </div>
                ) : (
                  <div>
                    {/* Enable toggle */}
                    <div
                      onClick={() => setTimeOverhead((o) => ({ ...o, enabled: !o.enabled }))}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 12, marginBottom: 4, cursor: "pointer", background: timeOverhead.enabled ? C.emeraldDim : "rgba(255,255,255,0.03)", border: `1px solid ${timeOverhead.enabled ? C.emeraldBorder : C.border}` }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: timeOverhead.enabled ? C.emerald : C.text }}>Include overhead in planning</div>
                        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Subtracts overhead from your available training window</div>
                      </div>
                      <div style={{ width: 36, height: 20, borderRadius: 999, background: timeOverhead.enabled ? C.emerald : C.subtle, position: "relative", flexShrink: 0, transition: "background 0.2s" }}>
                        <div style={{ position: "absolute", top: 2, left: timeOverhead.enabled ? 18 : 2, width: 16, height: 16, borderRadius: 999, background: "#fff", transition: "left 0.2s" }} />
                      </div>
                    </div>

                    <ProfileSection profileKey="short" title="Quick session  ≤ 30 min" />
                    <ProfileSection profileKey="long"  title="Full session  > 30 min" />
                  </div>
                )}
              </div>
            );
          })()}

          <div style={{ height: 1, background: C.border, marginBottom: 24 }} />

          {/* Equipment */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase" }}>
              Available equipment
            </div>
            <button
              onClick={() => setEquipEditMode((v) => !v)}
              style={{ padding: "4px 12px", borderRadius: 999, fontSize: 11, fontWeight: 800, cursor: "pointer", border: `1px solid ${equipEditMode ? C.emeraldBorder : C.border}`, background: equipEditMode ? C.emeraldDim : "rgba(255,255,255,0.04)", color: equipEditMode ? C.emerald : C.muted }}
            >
              {equipEditMode ? "Done" : "Edit"}
            </button>
          </div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 14, lineHeight: 1.5 }}>
            The planner only suggests exercises you can actually do. Tap Edit to change your kit.
          </div>

          {!equipEditMode ? (
            /* ── Collapsed: show active chips only ── */
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20, minHeight: 32 }}>
              {planEquipment.filter((v) => v !== "none").length === 0 ? (
                <span style={{ fontSize: 12, color: C.subtle, fontStyle: "italic" }}>No equipment — bodyweight only</span>
              ) : (
                planEquipment.filter((v) => v !== "none").map((val) => {
                  const eq = ALL_EQUIPMENT.find((e) => e.value === val);
                  return eq ? (
                    <span key={val} style={{ padding: "5px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700, background: C.emeraldDim, border: `1px solid ${C.emeraldBorder}`, color: C.emerald }}>
                      {eq.label}
                    </span>
                  ) : null;
                })
              )}
            </div>
          ) : (
            /* ── Expanded: two-panel drag UI ── */
            <div style={{ marginBottom: 20 }}>
              {/* Your equipment panel */}
              <div
                onDragOver={(e) => { e.preventDefault(); setEquipDropZone("active"); }}
                onDragLeave={() => setEquipDropZone(null)}
                onDrop={(e) => { e.preventDefault(); if (equipDragItem) moveEquip(equipDragItem, true); setEquipDragItem(null); setEquipDropZone(null); }}
                style={{ borderRadius: 14, padding: "12px 14px", marginBottom: 10, border: `1.5px dashed ${equipDropZone === "active" ? C.emerald : C.emeraldBorder}`, background: equipDropZone === "active" ? C.emeraldDim : "rgba(var(--accent-rgb),0.04)", minHeight: 72, transition: "border-color 0.15s, background 0.15s" }}
              >
                <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", color: C.emerald, textTransform: "uppercase", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                  Your equipment
                  <span style={{ background: C.emeraldDim, color: C.emerald, borderRadius: 999, padding: "1px 7px", fontSize: 10, fontWeight: 800 }}>
                    {planEquipment.filter((v) => v !== "none").length}
                  </span>
                </div>
                {planEquipment.filter((v) => v !== "none").length === 0 ? (
                  <div style={{ fontSize: 12, color: C.subtle, fontStyle: "italic", padding: "4px 0" }}>Drag items here or tap ✓ below</div>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {planEquipment.filter((v) => v !== "none").map((val) => {
                      const eq = ALL_EQUIPMENT.find((e) => e.value === val);
                      return eq ? (
                        <div
                          key={val}
                          draggable
                          onDragStart={(e) => { setEquipDragItem(val); e.dataTransfer.effectAllowed = "move"; }}
                          onDragEnd={() => { setEquipDragItem(null); setEquipDropZone(null); }}
                          style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 8px 5px 12px", borderRadius: 999, background: C.emeraldDim, border: `1px solid ${C.emeraldBorder}`, color: C.emerald, fontSize: 12, fontWeight: 700, cursor: "grab", userSelect: "none", opacity: equipDragItem === val ? 0.4 : 1 }}
                        >
                          {eq.label}
                          <button
                            onClick={() => moveEquip(val, false)}
                            style={{ background: "none", border: "none", color: C.emerald, cursor: "pointer", fontSize: 15, lineHeight: 1, padding: "0 2px", opacity: 0.7, fontWeight: 400 }}
                            title="Remove"
                          >×</button>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              {/* Not in use panel */}
              <div
                onDragOver={(e) => { e.preventDefault(); setEquipDropZone("inactive"); }}
                onDragLeave={() => setEquipDropZone(null)}
                onDrop={(e) => { e.preventDefault(); if (equipDragItem) moveEquip(equipDragItem, false); setEquipDragItem(null); setEquipDropZone(null); }}
                style={{ borderRadius: 14, padding: "12px 14px", border: `1.5px dashed ${equipDropZone === "inactive" ? "rgba(255,255,255,0.3)" : C.border}`, background: equipDropZone === "inactive" ? "rgba(255,255,255,0.04)" : "transparent", transition: "border-color 0.15s, background 0.15s" }}
              >
                <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", color: C.muted, textTransform: "uppercase", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                  Not in use
                  <span style={{ background: "rgba(255,255,255,0.06)", color: C.muted, borderRadius: 999, padding: "1px 7px", fontSize: 10, fontWeight: 800 }}>
                    {ALL_EQUIPMENT.filter((e) => !planEquipment.includes(e.value)).length}
                  </span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {ALL_EQUIPMENT.filter((e) => !planEquipment.includes(e.value)).map((eq) => (
                    <div
                      key={eq.value}
                      draggable
                      onDragStart={(e) => { setEquipDragItem(eq.value); e.dataTransfer.effectAllowed = "move"; }}
                      onDragEnd={() => { setEquipDragItem(null); setEquipDropZone(null); }}
                      style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 8px 5px 12px", borderRadius: 999, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, color: C.muted, fontSize: 12, fontWeight: 600, cursor: "grab", userSelect: "none", opacity: equipDragItem === eq.value ? 0.4 : 1 }}
                    >
                      {eq.label}
                      <button
                        onClick={() => moveEquip(eq.value, true)}
                        style={{ background: "none", border: "none", color: C.emerald, cursor: "pointer", fontSize: 13, lineHeight: 1, padding: "0 2px", fontWeight: 900 }}
                        title="Add"
                      >✓</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Sports ── */}
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${C.border}`, marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase" }}>
                Sports & Activities
              </div>
              <button
                onClick={() => setSportEditMode((v) => !v)}
                style={{ padding: "4px 12px", borderRadius: 999, fontSize: 11, fontWeight: 800, cursor: "pointer", border: `1px solid ${sportEditMode ? C.emeraldBorder : C.border}`, background: sportEditMode ? C.emeraldDim : "rgba(255,255,255,0.04)", color: sportEditMode ? C.emerald : C.muted }}
              >
                {sportEditMode ? "Done" : "Edit"}
              </button>
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 14, lineHeight: 1.5 }}>
              Tell the planner which sports you do. It nudges your strength and conditioning targets toward the muscles your sport demands most — so gym sessions complement your training, not compete with it. A recent run or ride automatically reduces the leg and cardio bias to protect recovery.
            </div>

            {!sportEditMode ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, minHeight: 32 }}>
                {(sportPrefs.sports ?? []).length === 0 ? (
                  <span style={{ fontSize: 12, color: C.subtle, fontStyle: "italic" }}>No sports selected</span>
                ) : (
                  (sportPrefs.sports ?? []).map((id) => {
                    const sp = ALL_SPORTS.find((s) => s.id === id);
                    return sp ? (
                      <span key={id} style={{ padding: "5px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700, background: C.emeraldDim, border: `1px solid ${C.emeraldBorder}`, color: C.emerald }}>
                        {sp.label}
                      </span>
                    ) : null;
                  })
                )}
              </div>
            ) : (
              <div>
                {/* Your sports panel */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setSportDropZone("active"); }}
                  onDragLeave={() => setSportDropZone(null)}
                  onDrop={(e) => { e.preventDefault(); if (sportDragItem) moveSport(sportDragItem, true); setSportDragItem(null); setSportDropZone(null); }}
                  style={{ borderRadius: 14, padding: "12px 14px", marginBottom: 10, border: `1.5px dashed ${sportDropZone === "active" ? C.emerald : C.emeraldBorder}`, background: sportDropZone === "active" ? C.emeraldDim : "rgba(var(--accent-rgb),0.04)", minHeight: 72, transition: "border-color 0.15s, background 0.15s" }}
                >
                  <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", color: C.emerald, textTransform: "uppercase", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                    Your sports
                    <span style={{ background: C.emeraldDim, color: C.emerald, borderRadius: 999, padding: "1px 7px", fontSize: 10, fontWeight: 800 }}>
                      {(sportPrefs.sports ?? []).length}
                    </span>
                  </div>
                  {(sportPrefs.sports ?? []).length === 0 ? (
                    <div style={{ fontSize: 12, color: C.subtle, fontStyle: "italic", padding: "4px 0" }}>Tap ✓ below to add a sport</div>
                  ) : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {(sportPrefs.sports ?? []).map((id) => {
                        const sp = ALL_SPORTS.find((s) => s.id === id);
                        return sp ? (
                          <div
                            key={id}
                            draggable
                            onDragStart={(e) => { setSportDragItem(id); e.dataTransfer.effectAllowed = "move"; }}
                            onDragEnd={() => { setSportDragItem(null); setSportDropZone(null); }}
                            style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 8px 5px 12px", borderRadius: 999, background: C.emeraldDim, border: `1px solid ${C.emeraldBorder}`, color: C.emerald, fontSize: 12, fontWeight: 700, cursor: "grab", userSelect: "none", opacity: sportDragItem === id ? 0.4 : 1 }}
                          >
                            {sp.label}
                            <button
                              onClick={() => moveSport(id, false)}
                              style={{ background: "none", border: "none", color: C.emerald, cursor: "pointer", fontSize: 15, lineHeight: 1, padding: "0 2px", opacity: 0.7, fontWeight: 400 }}
                              title="Remove"
                            >×</button>
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>

                {/* Not in use panel */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setSportDropZone("inactive"); }}
                  onDragLeave={() => setSportDropZone(null)}
                  onDrop={(e) => { e.preventDefault(); if (sportDragItem) moveSport(sportDragItem, false); setSportDragItem(null); setSportDropZone(null); }}
                  style={{ borderRadius: 14, padding: "12px 14px", border: `1.5px dashed ${sportDropZone === "inactive" ? "rgba(255,255,255,0.3)" : C.border}`, background: sportDropZone === "inactive" ? "rgba(255,255,255,0.04)" : "transparent", transition: "border-color 0.15s, background 0.15s" }}
                >
                  <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", color: C.muted, textTransform: "uppercase", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                    Not in use
                    <span style={{ background: "rgba(255,255,255,0.06)", color: C.muted, borderRadius: 999, padding: "1px 7px", fontSize: 10, fontWeight: 800 }}>
                      {ALL_SPORTS.filter((s) => !(sportPrefs.sports ?? []).includes(s.id)).length}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {ALL_SPORTS.filter((s) => !(sportPrefs.sports ?? []).includes(s.id)).map((sp) => (
                      <div
                        key={sp.id}
                        draggable
                        onDragStart={(e) => { setSportDragItem(sp.id); e.dataTransfer.effectAllowed = "move"; }}
                        onDragEnd={() => { setSportDragItem(null); setSportDropZone(null); }}
                        style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 8px 5px 12px", borderRadius: 999, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, color: C.muted, fontSize: 12, fontWeight: 600, cursor: "grab", userSelect: "none", opacity: sportDragItem === sp.id ? 0.4 : 1 }}
                      >
                        {sp.label}
                        <button
                          onClick={() => moveSport(sp.id, true)}
                          style={{ background: "none", border: "none", color: C.emerald, cursor: "pointer", fontSize: 13, lineHeight: 1, padding: "0 2px", fontWeight: 900 }}
                          title="Add"
                        >✓</button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Primary sport picker (if 2+) */}
                {(sportPrefs.sports ?? []).length >= 2 && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 10 }}>Primary sport</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {(sportPrefs.sports ?? []).map((id) => {
                        const sp = ALL_SPORTS.find((s) => s.id === id);
                        const isPrimary = sportPrefs.primary === id;
                        return sp ? (
                          <button
                            key={id}
                            onClick={() => setSportPrefs((p) => ({ ...p, primary: id }))}
                            style={{ padding: "6px 14px", borderRadius: 999, fontSize: 12, fontWeight: 800, cursor: "pointer", border: `1px solid ${isPrimary ? C.emeraldBorder : C.border}`, background: isPrimary ? C.emerald : "rgba(255,255,255,0.04)", color: isPrimary ? "#fff" : C.muted }}
                          >
                            {sp.label}
                          </button>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Sport bias toggle ── */}
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20, marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: C.text, marginBottom: 2 }}>Sport-aware training bias</div>
                <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>
                  {sportPrefs.bias_enabled !== false
                    ? "Planner fills the gaps your sport doesn't cover."
                    : "Planner ignores your sport — trains all axes equally."}
                </div>
              </div>
              <button
                onClick={() => setSportPrefs(prev => ({ ...prev, bias_enabled: prev.bias_enabled === false ? true : false }))}
                style={{
                  flexShrink: 0, padding: "8px 18px", borderRadius: 999, fontSize: 12, fontWeight: 900,
                  cursor: "pointer",
                  border: `1px solid ${sportPrefs.bias_enabled !== false ? C.emeraldBorder : C.border}`,
                  background: sportPrefs.bias_enabled !== false ? C.emeraldDim : "rgba(255,255,255,0.05)",
                  color: sportPrefs.bias_enabled !== false ? C.emerald : C.muted,
                }}
              >
                {sportPrefs.bias_enabled !== false ? "On" : "Off"}
              </button>
            </div>
          </div>

          {/* ── Polarised Training ── */}
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20, marginBottom: 20, opacity: effectiveIsPro ? 1 : 0.45 }}>
            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 4 }}>Polarised Training</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 12, lineHeight: 1.5 }}>
              {sportPrefs.polarised_training
                ? `Next: ${sportPrefs.last_endurance_type === "hiit" ? "Zone 2 easy run" : "HIIT intervals"} — life always wins`
                : "Alternates high-intensity (HIIT) and easy aerobic (Zone 2). On low-energy days, Zone 2 is always chosen."}
            </div>
            {effectiveIsPro ? (
              <button
                onClick={() => setSportPrefs(prev => ({ ...prev, polarised_training: !prev.polarised_training }))}
                style={{ padding: "8px 20px", borderRadius: 999, fontSize: 12, fontWeight: 900, cursor: "pointer", border: `1px solid ${sportPrefs.polarised_training ? "transparent" : C.border}`, background: sportPrefs.polarised_training ? C.emerald : "rgba(255,255,255,0.05)", color: sportPrefs.polarised_training ? "#fff" : C.muted }}
              >
                {sportPrefs.polarised_training ? "Active" : "Enable"}
              </button>
            ) : (
              <button style={{ padding: "8px 20px", borderRadius: 999, fontSize: 12, fontWeight: 900, cursor: "not-allowed", border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.05)", color: C.muted }}>Pro only</button>
            )}
          </div>

          {/* Daily Adaptive Replan */}
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 4 }}>Daily Adaptive Replan</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 12, lineHeight: 1.5 }}>
              {effectiveIsPro ? "Recalibrates your plan each morning based on your check-in." : "Upgrade to Pro to unlock."}
            </div>
            <button
              onClick={() => {
                if (!effectiveIsPro) return;
                const newVal = !prefs.daily_replan;
                onUpdate((p) => ({ ...p, daily_replan: newVal, preferences: { ...(p.preferences ?? {}), daily_replan: newVal } }));
                api.saveProfile(token, { preferences: { ...(prefs.preferences ?? {}), daily_replan: newVal } }).catch(() => {});
              }}
              style={{ padding: "8px 20px", borderRadius: 999, fontSize: 12, fontWeight: 900, cursor: effectiveIsPro ? "pointer" : "not-allowed", border: `1px solid ${effectiveIsPro && prefs.daily_replan ? "transparent" : C.border}`, background: effectiveIsPro && prefs.daily_replan ? C.emerald : "rgba(255,255,255,0.05)", color: effectiveIsPro && prefs.daily_replan ? "#fff" : C.muted, opacity: effectiveIsPro ? 1 : 0.4 }}
            >
              {effectiveIsPro ? (prefs.daily_replan ? "Active" : "Enable") : "Pro only"}
            </button>
          </div>

          {saveStatus === "saving" && <div style={{ fontSize: 12, color: C.muted, textAlign: "center" }}>Saving…</div>}
          {saveStatus === "saved"  && <div style={{ fontSize: 12, color: "var(--accent)", textAlign: "center", fontWeight: 700 }}>All changes saved ✓</div>}
          {saveStatus === "error"  && <div style={{ fontSize: 12, color: "#f87171", textAlign: "center" }}>Save failed — check connection</div>}
        </Glass>
      </div>

      {/* ── Known Injuries ──────────────────────────────────── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", color: C.emerald, textTransform: "uppercase", marginBottom: 16 }}>
          Known Injuries
        </div>
        <Glass style={{ padding: 24 }}>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 16, lineHeight: 1.6 }}>
            Ongoing injury areas are always filtered from your plan. Tap to add or remove.
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            {[
              { k: "knee", l: "Knee" },
              { k: "shoulder", l: "Shoulder" },
              { k: "lower_back", l: "Lower back" },
              { k: "ankle", l: "Ankle" },
            ].map(({ k, l }) => {
              const active = (prefs.preferences?.chronic_injury_areas ?? []).includes(k);
              return (
                <button
                  key={k}
                  onClick={() => {
                    const current = prefs.preferences?.chronic_injury_areas ?? [];
                    const updated = active ? current.filter(a => a !== k) : [...current, k];
                    const newPrefs = { ...(prefs.preferences ?? {}), chronic_injury_areas: updated };
                    api.saveProfile(token, { preferences: newPrefs })
                      .then(() => onUpdate(p => ({ ...p, preferences: newPrefs })))
                      .catch(() => {});
                  }}
                  style={{ padding: "8px 16px", borderRadius: 14, background: active ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.05)", color: active ? "#f87171" : "#94a3b8", border: active ? "1px solid rgba(239,68,68,0.4)" : `1px solid ${C.border}`, fontWeight: active ? 700 : 500, fontSize: 13, cursor: "pointer" }}
                >
                  {l}
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.5 }}>
            You can also mark areas during check-in using "Save as ongoing issue". Not medical advice — stop any exercise causing sharp or worsening pain.
          </div>
        </Glass>
      </div>

      </>)}

      {/* ── Body profile — you sub-view ──────────────────────── */}
      {subView === "you" && (
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", color: C.emerald, textTransform: "uppercase", marginBottom: 16 }}>
          Your profile
        </div>
        <Glass style={{ padding: 24 }}>
          {/* Display name */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 8 }}>Display name</div>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              style={{ width: "100%", padding: "10px 14px", borderRadius: 14, background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, color: C.text, fontSize: 15, fontWeight: 700, boxSizing: "border-box", outline: "none" }}
            />
          </div>

          {/* Sex */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 8 }}>Sex</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {SEX_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    const leavingFemale = profileSex === "female" && opt.value !== "female";
                    const hasFemaleSettings = bodyMode !== "standard" || cycleTrackingMode === "smart"; // includes perimenopause
                    if (leavingFemale && hasFemaleSettings) {
                      setPendingSex(opt.value);
                      setShowSexWarning(true);
                    } else {
                      setProfileSex(opt.value);
                    }
                  }}
                  style={{ padding: "10px 16px", borderRadius: 14, fontWeight: 900, fontSize: 14, border: `1px solid ${profileSex === opt.value ? C.emeraldBorder : C.border}`, background: profileSex === opt.value ? C.emeraldDim : "rgba(255,255,255,0.04)", color: profileSex === opt.value ? C.emerald : C.muted, cursor: "pointer" }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Weight */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 8 }}>Weight</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="number"
                value={profileWeight}
                onChange={(e) => setProfileWeight(e.target.value)}
                placeholder={profileWeightUnit === "kg" ? "e.g. 70" : "e.g. 154"}
                style={{ flex: 1, padding: "10px 14px", borderRadius: 14, background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, color: C.text, fontSize: 15, fontWeight: 700, outline: "none" }}
              />
              <button
                onClick={() => setProfileWeightUnit(u => u === "kg" ? "lbs" : "kg")}
                style={{ padding: "10px 16px", borderRadius: 14, fontWeight: 900, fontSize: 13, border: `1px solid ${C.emeraldBorder}`, background: C.emeraldDim, color: C.emerald, cursor: "pointer", minWidth: 52, flexShrink: 0 }}
              >
                {profileWeightUnit}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 8 }}>Height</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="number"
                value={profileHeight}
                onChange={(e) => setProfileHeight(e.target.value)}
                placeholder={profileHeightUnit === "cm" ? "e.g. 175" : "e.g. 69"}
                style={{ flex: 1, padding: "10px 14px", borderRadius: 14, background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, color: C.text, fontSize: 15, fontWeight: 700, outline: "none" }}
              />
              <button
                onClick={() => {
                  if (profileHeightUnit === "cm") {
                    setProfileHeightUnit("in");
                    if (profileHeight) setProfileHeight(String(Math.round(parseFloat(profileHeight) / 2.54)));
                  } else {
                    setProfileHeightUnit("cm");
                    if (profileHeight) setProfileHeight(String(Math.round(parseFloat(profileHeight) * 2.54)));
                  }
                }}
                style={{ padding: "10px 16px", borderRadius: 14, fontWeight: 900, fontSize: 13, border: `1px solid ${C.emeraldBorder}`, background: C.emeraldDim, color: C.emerald, cursor: "pointer", minWidth: 52, flexShrink: 0 }}
              >
                {profileHeightUnit}
              </button>
            </div>
            {/* BMI display — shown when both weight and height are filled */}
            {(() => {
              const wkg = (() => { const w = parseFloat(profileWeight); if (isNaN(w)) return null; return profileWeightUnit === "lbs" ? w * 0.453592 : w; })();
              const hcm = (() => { const h = parseFloat(profileHeight); if (isNaN(h)) return null; return profileHeightUnit === "in" ? h * 2.54 : h; })();
              if (!wkg || !hcm || hcm === 0) return null;
              const bmi = wkg / ((hcm / 100) ** 2);
              const { label, color } = bmi < 18.5 ? { label: "Underweight", color: "#60a5fa" }
                : bmi < 25 ? { label: "Normal", color: C.emerald }
                : bmi < 30 ? { label: "Overweight", color: C.amber }
                : bmi < 35 ? { label: "Obese I", color: "#f97316" }
                : { label: "Obese II", color: "#f87171" };
              const isObese = bmi >= 30;
              return (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 8 }}>BMI</div>
                  <div style={{ width: "100%", padding: "10px 14px", borderRadius: 14, background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, color, fontSize: 15, fontWeight: 900, boxSizing: "border-box" }}>
                    {bmi.toFixed(1)} <span style={{ fontWeight: 600, fontSize: 13 }}>— {label}</span>
                  </div>
                  {isObese && (
                    <div style={{ marginTop: 10, padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: `1px solid ${C.border}` }}>
                      <div style={{ fontSize: 12, color: C.emerald, lineHeight: 1.7, fontWeight: 700, marginBottom: 8 }}>
                        Consistency and will always produce results — every session counts.
                      </div>
                      <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.7 }}>
                        JustFit uses your BMI to protect your joints — at this range, the planner will substitute low-impact alternatives for running and high-impact cardio to reduce injury risk as you build fitness.
                      </div>
                      <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.7, marginTop: 8, fontStyle: "italic" }}>
                        We are not a medical app. Always seek advice from a qualified health professional before starting or changing your exercise routine.
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Re-do onboarding */}
            {onRedoOnboarding && (
              <div style={{ marginTop: 20 }}>
                <button
                  onClick={onRedoOnboarding}
                  style={{ width: "100%", padding: "12px 0", borderRadius: 14, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.03)", color: C.muted, fontWeight: 900, fontSize: 14, cursor: "pointer" }}
                >
                  Re-do onboarding
                </button>
              </div>
            )}

            {/* Reset to defaults */}
            {onResetDefaults && (
              <div style={{ marginTop: 12 }}>
                {!showResetConfirm ? (
                  <button
                    onClick={() => setShowResetConfirm(true)}
                    style={{ width: "100%", padding: "12px 0", borderRadius: 14, border: `1px solid rgba(239,68,68,0.3)`, background: "rgba(239,68,68,0.06)", color: "#ef4444", fontWeight: 900, fontSize: 14, cursor: "pointer" }}
                  >
                    Set values to default
                  </button>
                ) : (
                  <div style={{ padding: "16px", borderRadius: 14, border: `1px solid rgba(239,68,68,0.3)`, background: "rgba(239,68,68,0.06)" }}>
                    <div style={{ fontSize: 13, color: C.text, fontWeight: 700, marginBottom: 6 }}>Reset all settings to default?</div>
                    <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, marginBottom: 14 }}>
                      This will clear your personal settings and preferences — name, body data, equipment, sports, injuries and accent colour — and reset them to the default values. Your workout history and progress are not affected.
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => setShowResetConfirm(false)}
                        style={{ flex: 1, padding: "10px 0", borderRadius: 12, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.04)", color: C.muted, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                      >
                        Cancel
                      </button>
                      <button
                        disabled={resetting}
                        onClick={async () => {
                          setResetting(true);
                          await onResetDefaults();
                          setResetting(false);
                          setShowResetConfirm(false);
                        }}
                        style={{ flex: 1, padding: "10px 0", borderRadius: 12, border: "none", background: "#ef4444", color: "#fff", fontWeight: 900, fontSize: 13, cursor: resetting ? "not-allowed" : "pointer", opacity: resetting ? 0.6 : 1 }}
                      >
                        {resetting ? "Resetting…" : "Yes, reset"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Female-only: cycle tracking */}
          {profileSex === "female" && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 8 }}>Cycle tracking</div>
              <div style={{ display: "flex", gap: 8, marginBottom: cycleTrackingMode === "smart" ? 14 : 0 }}>
                {[{ label: "Smart", value: "smart" }, { label: "Off", value: "off" }].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setCycleTrackingMode(opt.value)}
                    style={{ flex: 1, padding: "10px 16px", borderRadius: 14, fontWeight: 900, fontSize: 14, border: `1px solid ${cycleTrackingMode === opt.value ? C.emeraldBorder : C.border}`, background: cycleTrackingMode === opt.value ? C.emeraldDim : "rgba(255,255,255,0.04)", color: cycleTrackingMode === opt.value ? C.emerald : C.muted, cursor: "pointer" }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {cycleTrackingMode === "smart" && (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>Last period start</div>
                    <input
                      type="date"
                      value={lastPeriodStart}
                      onChange={(e) => setLastPeriodStart(e.target.value)}
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 14, background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, color: C.text, fontSize: 14, fontWeight: 700, boxSizing: "border-box", outline: "none" }}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>Cycle length (days)</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {CYCLE_LENGTHS.map((d) => (
                        <button
                          key={d}
                          onClick={() => setCycleLength(d)}
                          style={{ padding: "6px 12px", borderRadius: 10, fontWeight: 900, fontSize: 13, border: `1px solid ${cycleLength === d ? C.emeraldBorder : C.border}`, background: cycleLength === d ? C.emeraldDim : "rgba(255,255,255,0.04)", color: cycleLength === d ? C.emerald : C.muted, cursor: "pointer" }}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Female-only: pregnancy/postnatal status */}
          {profileSex === "female" && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 8 }}>Body mode</div>

              {/* Standard — show activate buttons, or inline setup steps */}
              {bodyMode === "standard" && pregnancySetupStep === 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <button
                    onClick={() => setPregnancySetupStep(1)}
                    style={{ width: "100%", padding: "10px 16px", borderRadius: 14, fontWeight: 700, fontSize: 14, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.04)", color: C.muted, cursor: "pointer", textAlign: "left" }}
                  >
                    Standard · Enable pregnancy mode →
                  </button>
                  <button
                    onClick={async () => {
                      setPregnancySaving(true);
                      try {
                        await api.saveProfile(token, { cycle: { mode: "perimenopause", tracking_mode: "off" } });
                        setBodyMode("perimenopause");
                        setCycleTrackingMode("off");
                        onUpdate((p) => ({ ...p, cycle: { ...(p.cycle ?? {}), mode: "perimenopause" } }));
                      } catch { /* ignore */ }
                      setPregnancySaving(false);
                    }}
                    disabled={pregnancySaving}
                    style={{ width: "100%", padding: "10px 16px", borderRadius: 14, fontWeight: 700, fontSize: 14, border: "1px solid rgba(167,139,250,0.25)", background: "rgba(167,139,250,0.05)", color: pregnancySaving ? C.muted : "#a78bfa", cursor: pregnancySaving ? "not-allowed" : "pointer", textAlign: "left" }}
                  >
                    {pregnancySaving ? "Saving…" : "Enable perimenopause mode →"}
                  </button>
                  <div style={{ fontSize: 11, color: C.subtle, lineHeight: 1.5 }}>
                    Pregnancy mode: full journey from conception to 3 months postnatal. Perimenopause mode: lowers stress threshold, caps intensity at moderate, pauses cycle phase rules.
                  </div>
                </div>
              )}

              {/* Step 1 — Medical advisory (inline, shown right after clicking) */}
              {bodyMode === "standard" && pregnancySetupStep === 1 && (
                <div style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 14, padding: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#fbbf24", marginBottom: 10 }}>Step 1 of 2 — Medical guidance</div>
                  <div style={{ fontSize: 12, color: C.text, lineHeight: 1.7, marginBottom: 6 }}>
                    JustFit is a fitness app, not a medical service. Pregnancy mode is designed for use during the 9 months of pregnancy and up to 3 months after birth.
                  </div>
                  <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6, marginBottom: 16 }}>
                    Please confirm that you have discussed or will discuss exercise with your midwife, GP, or OB-GYN.
                  </div>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", marginBottom: 16 }}>
                    <input
                      type="checkbox"
                      checked={medicalClearance}
                      onChange={(e) => setMedicalClearance(e.target.checked)}
                      style={{ marginTop: 2, accentColor: "#fbbf24", width: 16, height: 16, flexShrink: 0 }}
                    />
                    <span style={{ fontSize: 12, color: C.text, lineHeight: 1.6 }}>
                      I will seek medical guidance regarding exercise during this period.
                    </span>
                  </label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => { setPregnancySetupStep(0); setMedicalClearance(false); }}
                      style={{ flex: 1, padding: "9px 12px", borderRadius: 10, fontSize: 13, fontWeight: 700, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.03)", color: C.muted, cursor: "pointer" }}
                    >
                      Cancel
                    </button>
                    <button
                      disabled={!medicalClearance}
                      onClick={() => setPregnancySetupStep(2)}
                      style={{ flex: 2, padding: "9px 12px", borderRadius: 10, fontSize: 13, fontWeight: 700, border: "1px solid rgba(251,191,36,0.3)", background: medicalClearance ? "rgba(251,191,36,0.12)" : "rgba(255,255,255,0.03)", color: medicalClearance ? "#fbbf24" : C.muted, cursor: medicalClearance ? "pointer" : "not-allowed" }}
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2 — Due date (inline) */}
              {bodyMode === "standard" && pregnancySetupStep === 2 && (
                <div style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 14, padding: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#fbbf24", marginBottom: 10 }}>Step 2 of 2 — Your due date</div>
                  <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>When is your estimated due date?</div>
                  <input
                    type="date"
                    value={pregnancyDueDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setPregnancyDueDate(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, color: C.text, fontSize: 14, outline: "none", fontFamily: "inherit", marginBottom: 12, boxSizing: "border-box" }}
                  />
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 14, lineHeight: 1.6 }}>
                    Your due date helps us calculate your trimester and adapt sessions accordingly. You can update it anytime.
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => setPregnancySetupStep(1)}
                      style={{ flex: 1, padding: "9px 12px", borderRadius: 10, fontSize: 13, fontWeight: 700, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.03)", color: C.muted, cursor: "pointer" }}
                    >
                      Back
                    </button>
                    <button
                      disabled={!pregnancyDueDate || pregnancySaving}
                      onClick={async () => {
                        setPregnancySaving(true);
                        try {
                          await api.saveProfile(token, {
                            cycle: {
                              tracking_mode: "off",
                              mode: "pregnant",
                              pregnancy_due_date: pregnancyDueDate,
                              medical_clearance_confirmed: true,
                            },
                          });
                          setBodyMode("pregnant");
                          setPregnancySetupStep(0);
                          onUpdate((p) => ({
                            ...p,
                            cycle: {
                              ...(p.cycle ?? {}),
                              mode: "pregnant",
                              tracking_mode: "off",
                              pregnancy_due_date: pregnancyDueDate,
                              medical_clearance_confirmed: 1,
                            },
                          }));
                        } catch { /* ignore */ }
                        setPregnancySaving(false);
                      }}
                      style={{ flex: 2, padding: "9px 12px", borderRadius: 10, fontSize: 13, fontWeight: 700, border: "1px solid rgba(251,191,36,0.3)", background: pregnancyDueDate && !pregnancySaving ? "rgba(251,191,36,0.12)" : "rgba(255,255,255,0.03)", color: pregnancyDueDate && !pregnancySaving ? "#fbbf24" : C.muted, cursor: pregnancyDueDate && !pregnancySaving ? "pointer" : "not-allowed" }}
                    >
                      {pregnancySaving ? "Saving…" : "Enable pregnancy mode"}
                    </button>
                  </div>
                </div>
              )}

              {bodyMode === "pregnant" && (
                <div style={{ borderRadius: 14, background: C.amberDim, border: "1px solid rgba(245,158,11,0.3)", overflow: "hidden" }}>
                  <div style={{ padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ color: C.amber, fontWeight: 700, fontSize: 14 }}>
                      Pregnancy mode active
                      {pregnancyDueDate && <span style={{ color: C.muted, fontWeight: 500 }}> · Due {pregnancyDueDate}</span>}
                    </span>
                    <button
                      onClick={handleDeactivateBodyMode}
                      disabled={bodyModeDeactivating}
                      style={{ padding: "5px 12px", borderRadius: 10, fontSize: 12, fontWeight: 800, border: "1px solid rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.1)", color: C.amber, cursor: "pointer", flexShrink: 0, opacity: bodyModeDeactivating ? 0.5 : 1 }}
                    >
                      {bodyModeDeactivating ? "…" : "Deactivate"}
                    </button>
                  </div>
                </div>
              )}
              {bodyMode === "postnatal" && (
                <div style={{ borderRadius: 14, background: C.roseDim, border: "1px solid rgba(244,63,94,0.3)", overflow: "hidden" }}>
                  <div style={{ padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ color: C.rose, fontWeight: 700, fontSize: 14 }}>Postnatal mode active</span>
                    <button
                      onClick={handleDeactivateBodyMode}
                      disabled={bodyModeDeactivating}
                      style={{ padding: "5px 12px", borderRadius: 10, fontSize: 12, fontWeight: 800, border: "1px solid rgba(244,63,94,0.3)", background: "rgba(244,63,94,0.1)", color: C.rose, cursor: "pointer", flexShrink: 0, opacity: bodyModeDeactivating ? 0.5 : 1 }}
                    >
                      {bodyModeDeactivating ? "…" : "Deactivate"}
                    </button>
                  </div>
                </div>
              )}
              {bodyMode === "perimenopause" && (
                <div style={{ borderRadius: 14, background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.3)", overflow: "hidden" }}>
                  <div style={{ padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ color: "#a78bfa", fontWeight: 700, fontSize: 14 }}>Perimenopause mode active</span>
                    <button
                      onClick={handleDeactivateBodyMode}
                      disabled={bodyModeDeactivating}
                      style={{ padding: "5px 12px", borderRadius: 10, fontSize: 12, fontWeight: 800, border: "1px solid rgba(167,139,250,0.3)", background: "rgba(167,139,250,0.1)", color: "#a78bfa", cursor: "pointer", flexShrink: 0, opacity: bodyModeDeactivating ? 0.5 : 1 }}
                    >
                      {bodyModeDeactivating ? "…" : "Deactivate"}
                    </button>
                  </div>
                  <div style={{ padding: "0 14px 10px", fontSize: 11, color: "rgba(167,139,250,0.7)", lineHeight: 1.5 }}>
                    Intensity capped at moderate · stress threshold lowered · standard cycle rules paused
                  </div>
                </div>
              )}
            </div>
          )}

          {saveStatus === "saving" && <div style={{ fontSize: 12, color: C.muted, textAlign: "center" }}>Saving…</div>}
          {saveStatus === "saved"  && <div style={{ fontSize: 12, color: "var(--accent)", textAlign: "center", fontWeight: 700 }}>All changes saved ✓</div>}
          {saveStatus === "error"  && <div style={{ fontSize: 12, color: "#f87171", textAlign: "center" }}>Save failed — check connection</div>}
        </Glass>

        {/* Sex-change warning modal */}
        {showSexWarning && (
          <div
            onClick={() => setShowSexWarning(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ width: "100%", maxWidth: 380, background: "#0a1628", border: `1px solid ${C.border}`, borderRadius: 24, padding: 28 }}
            >
              <div style={{ fontSize: 20, fontWeight: 900, color: C.text, letterSpacing: "-0.02em", marginBottom: 10 }}>
                Deactivate female settings?
              </div>
              <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, marginBottom: 20 }}>
                Switching to <strong style={{ color: C.text }}>{pendingSex === "male" ? "Male" : "Non-binary"}</strong> will deactivate:
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
                {bodyMode !== "standard" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, background: C.amberDim, border: "1px solid rgba(245,158,11,0.2)" }}>
                    <Icons.moon size={16} c={C.amber} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.amber }}>
                      {bodyMode === "pregnant" ? "Pregnancy mode" : bodyMode === "postnatal" ? "Postnatal mode" : "Perimenopause mode"}
                    </span>
                  </div>
                )}
                {cycleTrackingMode === "smart" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, background: "rgba(var(--accent-rgb),0.06)", border: `1px solid ${C.emeraldBorder}` }}>
                    <Icons.refresh size={16} c={C.emerald} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.emerald }}>Smart cycle tracking</span>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => { setShowSexWarning(false); setPendingSex(null); }}
                  style={{ flex: 1, padding: "13px 0", borderRadius: 14, fontWeight: 800, fontSize: 14, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.04)", color: C.muted, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSexChange}
                  style={{ flex: 2, padding: "13px 0", borderRadius: 14, fontWeight: 900, fontSize: 14, background: "#ef4444", border: "none", color: "#fff", cursor: "pointer" }}
                >
                  Yes, deactivate
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      )}

      {/* ── Account sub-view ─────────────────────────────────── */}
      {subView === "account" && (<>
        {/* ── Subscription section ── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", color: C.emerald, textTransform: "uppercase", marginBottom: 16 }}>Abonnement</div>
          <Glass style={{ padding: 24 }}>
            {(() => {
              // Lazy-load subscription data when this section first renders
              if (!subData && !subLoading) {
                setSubLoading(true);
                api.getSubscription().then(d => { setSubData(d); setSubLoading(false); }).catch(() => setSubLoading(false));
              }
              if (subLoading && !subData) {
                return <div style={{ fontSize: 13, color: C.muted }}>Laden…</div>;
              }
              const s = subData;
              const isActive = s?.isPro && s?.status === 'active';
              const isTrialing = s?.status === 'trialing';
              const isGrace = s?.status === 'grace';
              const isCanceled = s?.status === 'canceled' || s?.status === 'expired';
              const endsDate = s?.ends_at_ms ? new Date(s.ends_at_ms).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }) : null;
              const trialDays = isTrialing && s?.ends_at_ms ? Math.max(0, Math.ceil((s.ends_at_ms - Date.now()) / 86400000)) : null;

              if (isActive || isGrace) {
                const planLabel = s.product_code?.includes('annual') ? 'Jaarlijks' : 'Maandelijks';
                const ebLabel = s.product_code?.endsWith('_eb') ? ' · vroegboeker' : '';
                return (
                  <>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 900, color: C.text, letterSpacing: "-0.02em" }}>JustFit Pro</div>
                        <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{planLabel}{ebLabel}</div>
                      </div>
                      <div style={{ padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 900, background: isGrace ? "rgba(245,158,11,0.15)" : "rgba(16,185,129,0.12)", color: isGrace ? "#f59e0b" : C.emerald }}>
                        {isGrace ? "Betalingsprobleem" : "Actief"}
                      </div>
                    </div>
                    {endsDate && <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>Geldig tot {endsDate}</div>}
                    {isGrace && <div style={{ fontSize: 12, color: "#f59e0b", marginBottom: 16, lineHeight: 1.5 }}>Je betaling kon niet worden verwerkt. Je houdt 7 dagen toegang. Vernieuw je betaalmethode via Mollie.</div>}
                    {!cancelConfirm ? (
                      <button onClick={() => setCancelConfirm(true)} style={{ fontSize: 12, fontWeight: 700, color: C.muted, background: "none", border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 14px", cursor: "pointer" }}>
                        Abonnement opzeggen
                      </button>
                    ) : (
                      <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 12, padding: 16 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>Weet je het zeker?</div>
                        <div style={{ fontSize: 12, color: C.muted, marginBottom: 12, lineHeight: 1.5 }}>Je houdt toegang tot Pro tot {endsDate ?? "het einde van je periode"}. Erna ga je terug naar de gratis versie.</div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button disabled={canceling} onClick={async () => { setCanceling(true); const r = await api.cancelSubscription().catch(() => null); if (r?.ok) { setSubData(d => ({ ...d, status: 'canceled' })); onSubscriptionChange?.(); } setCanceling(false); setCancelConfirm(false); }}
                            style={{ flex: 1, padding: "10px 0", borderRadius: 10, fontFamily: "inherit", fontWeight: 900, fontSize: 13, cursor: canceling ? "not-allowed" : "pointer", border: "none", background: "#ef4444", color: "#fff" }}>
                            {canceling ? "Bezig…" : "Ja, opzeggen"}
                          </button>
                          <button onClick={() => setCancelConfirm(false)} style={{ padding: "10px 16px", borderRadius: 10, fontFamily: "inherit", fontWeight: 700, fontSize: 12, cursor: "pointer", border: `1px solid ${C.border}`, background: "transparent", color: C.muted }}>
                            Annuleren
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                );
              }

              if (isTrialing) {
                return (
                  <>
                    <div style={{ fontSize: 16, fontWeight: 900, color: C.text, letterSpacing: "-0.02em", marginBottom: 4 }}>Gratis proefperiode</div>
                    <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>Nog {trialDays} {trialDays === 1 ? "dag" : "dagen"} gratis Pro toegang</div>
                    <button onClick={onUpgrade} style={{ width: "100%", padding: "12px 0", borderRadius: 12, fontFamily: "inherit", fontWeight: 900, fontSize: 14, cursor: "pointer", border: "none", background: "var(--accent)", color: "#fff" }}>
                      Activeer Pro →
                    </button>
                  </>
                );
              }

              // Not subscribed or canceled/expired
              return (
                <>
                  <div style={{ fontSize: 14, color: C.muted, marginBottom: 16 }}>
                    {isCanceled ? "Je abonnement is opgezegd." : "Geen actief abonnement."}
                  </div>
                  <button onClick={onUpgrade} style={{ width: "100%", padding: "12px 0", borderRadius: 12, fontFamily: "inherit", fontWeight: 900, fontSize: 14, cursor: "pointer", border: "none", background: "var(--accent)", color: "#fff" }}>
                    Upgrade naar Pro →
                  </button>
                </>
              );
            })()}
          </Glass>
        </div>
        {/* ── Early Access (Pro only) ── */}
        {effectiveIsPro && (() => {
          const betaFeatures = prefs.preferences?.beta_features ?? [];
          const earlyAccessOn = betaFeatures.includes('early_access');
          async function toggleEarlyAccess() {
            const next = earlyAccessOn
              ? betaFeatures.filter(f => f !== 'early_access')
              : [...betaFeatures, 'early_access'];
            await api.saveProfile(token, { preferences: { beta_features: next } });
            onUpdate(p => ({ ...p, preferences: { ...(p.preferences ?? {}), beta_features: next } }));
          }
          return (
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", color: C.emerald, textTransform: "uppercase", marginBottom: 16 }}>Early Access</div>
              <Glass style={{ padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: C.text, marginBottom: 3 }}>Vroege toegang nieuwe functies</div>
                    <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>
                      Je bent een van de eerste die nieuwe functies test vóór de brede uitrol. Feedback welkom.
                    </div>
                  </div>
                  <button
                    onClick={toggleEarlyAccess}
                    style={{ flexShrink: 0, width: 44, height: 26, borderRadius: 13, border: "none", cursor: "pointer", transition: "background 0.2s",
                      background: earlyAccessOn ? "var(--accent)" : "rgba(255,255,255,0.1)",
                      position: "relative" }}
                  >
                    <span style={{ position: "absolute", top: 3, left: earlyAccessOn ? 21 : 3, width: 20, height: 20, borderRadius: 10, background: "#fff", transition: "left 0.2s" }} />
                  </button>
                </div>
                {earlyAccessOn && (
                  <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 10, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", fontSize: 12, color: C.emerald }}>
                    Early access actief — je ontvangt nieuwe functies zodra ze beschikbaar zijn.
                  </div>
                )}
              </Glass>
            </div>
          );
        })()}

        {/* ── Referral section ── */}
        {!!prefs.email && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", color: C.emerald, textTransform: "uppercase", marginBottom: 16 }}>Geef een vriend een cadeau</div>
            <Glass style={{ padding: 24 }}>
              {(() => {
                if (!referralData && !referralLoading) {
                  setReferralLoading(true);
                  api.getReferral().then(d => { setReferralData(d); setReferralLoading(false); }).catch(() => setReferralLoading(false));
                }
                if (referralLoading && !referralData) return <div style={{ fontSize: 13, color: C.muted }}>Laden…</div>;
                const code = referralData?.code ?? '—';
                const stats = referralData?.stats ?? {};
                return (
                  <>
                    <div style={{ fontSize: 14, fontWeight: 900, color: C.text, marginBottom: 6 }}>Geef een vriend 14 dagen Pro gratis</div>
                    <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6, marginBottom: 16 }}>
                      Deel je code. Als ze hem invullen, krijgen jullie allebei 14 dagen Pro cadeau.
                    </div>
                    {/* Referral code display */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                      <div style={{ flex: 1, background: "rgba(16,185,129,0.08)", border: `1px solid ${C.emeraldBorder}`, borderRadius: 10, padding: "10px 14px", fontFamily: "monospace", fontSize: 18, fontWeight: 900, letterSpacing: "0.15em", color: C.emerald }}>{code}</div>
                      <button
                        onClick={() => { navigator.clipboard?.writeText(code); }}
                        style={{ padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                      >Kopieer</button>
                    </div>
                    {stats.rewarded > 0 && (
                      <div style={{ fontSize: 12, color: C.emerald, marginBottom: 16 }}>
                        ✓ {stats.rewarded} vriend{stats.rewarded !== 1 ? 'en' : ''} beloond
                      </div>
                    )}
                    {/* Redeem section */}
                    <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16, marginTop: 4 }}>
                      <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.08em", color: C.muted, textTransform: "uppercase", marginBottom: 8 }}>Code van een vriend invullen</div>
                      {redeemState === "done" ? (
                        <div style={{ fontSize: 13, color: C.emerald, fontWeight: 700 }}>✓ 14 dagen Pro toegevoegd!</div>
                      ) : (
                        <div style={{ display: "flex", gap: 8 }}>
                          <input
                            value={redeemCode}
                            onChange={e => { setRedeemCode(e.target.value.toUpperCase()); setRedeemMsg(""); }}
                            placeholder="JF…"
                            maxLength={12}
                            style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px", color: C.text, fontSize: 14, fontFamily: "monospace", outline: "none" }}
                          />
                          <button
                            disabled={redeemState === "loading" || !redeemCode.trim()}
                            onClick={async () => {
                              setRedeemState("loading"); setRedeemMsg("");
                              const r = await api.redeemReferral(redeemCode.trim()).catch(() => null);
                              if (r?.ok) { setRedeemState("done"); }
                              else { setRedeemState("error"); setRedeemMsg(r?.error ?? "Ongeldige code"); setTimeout(() => setRedeemState("idle"), 4000); }
                            }}
                            style={{ padding: "10px 14px", borderRadius: 10, border: "none", background: C.emerald, color: "#020617", fontWeight: 900, fontSize: 13, cursor: "pointer", fontFamily: "inherit", opacity: redeemState === "loading" ? 0.6 : 1 }}
                          >{redeemState === "loading" ? "…" : "Inwisselen"}</button>
                        </div>
                      )}
                      {redeemState === "error" && redeemMsg && (
                        <div style={{ fontSize: 12, color: "#ef4444", marginTop: 6 }}>{redeemMsg}</div>
                      )}
                    </div>
                  </>
                );
              })()}
            </Glass>
          </div>
        )}

        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", color: C.emerald, textTransform: "uppercase", marginBottom: 16 }}>Email & identity</div>
          <Glass style={{ padding: 24 }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 8 }}>Email address</div>
              {prefs.email_verified ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{prefs.email ?? "—"}</div>
                    <div style={{ fontSize: 12, color: "#10b981", fontWeight: 700, marginTop: 2 }}>✓ Verified</div>
                  </div>
                  <button onClick={() => { setEmailStep("change_enter"); setEmailInput(""); setEmailError(""); }} style={{ padding: "10px 14px", borderRadius: 14, cursor: "pointer", border: `1px solid ${C.emeraldBorder}`, background: C.emeraldDim, fontSize: 12, fontWeight: 900, color: C.emerald }}>
                    Change email →
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: emailSuccess ? 8 : 0 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{prefs.email ?? "—"}</div>
                      <div style={{ fontSize: 12, color: C.amber, fontWeight: 700, marginTop: 2 }}>⚠ Not verified</div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button disabled={emailLoading} onClick={async () => { setEmailLoading(true); await api.resendVerification().catch(() => {}); setEmailLoading(false); setEmailSuccess("Verification email sent"); setTimeout(() => setEmailSuccess(""), 4000); }} style={{ padding: "10px 14px", borderRadius: 14, cursor: "pointer", border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.03)", fontSize: 12, fontWeight: 900, color: C.muted }}>
                        {emailLoading ? "Sending…" : "Resend"}
                      </button>
                      <button onClick={() => { setEmailStep("verify_code"); setEmailCode(""); setEmailError(""); }} style={{ padding: "10px 14px", borderRadius: 14, cursor: "pointer", border: `1px solid ${C.emeraldBorder}`, background: C.emeraldDim, fontSize: 12, fontWeight: 900, color: C.emerald }}>
                        Enter code
                      </button>
                    </div>
                  </div>
                  {emailSuccess && <div style={{ fontSize: 12, color: "#10b981", fontWeight: 700 }}>{emailSuccess}</div>}
                </div>
              )}
            </div>
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 8 }}>Account ID</div>
              <div style={{ width: "100%", padding: "10px 14px", borderRadius: 14, background: "rgba(255,255,255,0.02)", border: `1px solid ${C.border}`, color: C.muted, fontSize: 13, fontWeight: 700, fontFamily: "monospace", boxSizing: "border-box", opacity: 0.6, marginBottom: 8 }}>{userId}</div>
              <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>Your unique identifier — links your workouts, plan, and score to your account privately and securely.</div>
            </div>
          </Glass>
        </div>
        <div style={{ marginBottom: 32 }}>
          <Glass style={{ padding: 20 }}>
            <button onClick={() => { logout(); }} style={{ width:"100%", padding:"12px 0", borderRadius:12, border:`1px solid ${C.border}`, background:"rgba(255,255,255,0.03)", color:C.muted, fontWeight:900, fontSize:14, cursor:"pointer" }}>
              Sign out
            </button>
          </Glass>
        </div>
      </>)}

      {/* ── Data export — privacy sub-view ───────────────────── */}
      {subView === "privacy" && (<>
        {/* ── Privacy Centre header ── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", color: C.emerald, textTransform: "uppercase", marginBottom: 8 }}>Privacy Centre</div>
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
            JustFit stores only what is needed to run your training. Your data is never sold and never used for advertising. Below is an honest account of what we hold and who can see it.
          </div>
        </div>

        {/* ── What we store ── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", color: C.emerald, textTransform: "uppercase", marginBottom: 16 }}>What we store</div>
          <Glass style={{ padding: 0 }}>
            {[
              { label: "Identity", detail: "Email address, display name", purpose: "Account login and essential notifications", visible: "JustFit only" },
              { label: "Training history", detail: "Completed workouts, duration, effort, exercise steps", purpose: "Consistency score, progression radar, planner adaptation", visible: "Visible to connected trainer if you are a gym member" },
              { label: "Training plan", detail: "Daily plan and rule trace", purpose: "Explain every coaching decision — fully traceable", visible: "JustFit only, rule trace visible in 'Why this plan?'" },
              { label: "Body context", detail: "Sex, weight, height, goal, injuries, cycle / pregnancy data", purpose: "Adapt training safely to your body and life stage", visible: "JustFit only — not shared with trainers" },
              { label: "Daily check-ins", detail: "Mood, energy, sleep, pain signals, free text", purpose: "Generate today's plan — used once, not retained as a profile", visible: "JustFit only" },
              { label: "Settings & preferences", detail: "Equipment, sports, coach enrollments, language, accent colour", purpose: "Personalise your daily plan and app experience", visible: "JustFit only" },
            ].map((row, i, arr) => (
              <div key={row.label} style={{ padding: "14px 20px", borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none" }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, marginBottom: 3 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: C.text }}>{row.label}</div>
                  <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.08em", color: row.visible.startsWith("Visible") ? "#f59e0b" : C.emerald, textTransform: "uppercase", flexShrink: 0 }}>
                    {row.visible.startsWith("Visible") ? "Trainer visible" : "Private"}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>{row.detail}</div>
                <div style={{ fontSize: 11, color: C.subtle, marginTop: 3, lineHeight: 1.4 }}>Used for: {row.purpose}</div>
                {row.visible.startsWith("Visible") && (
                  <div style={{ fontSize: 11, color: "#f59e0b", marginTop: 3 }}>{row.visible}</div>
                )}
              </div>
            ))}
          </Glass>
        </div>

        {/* ── Trainer visibility (only when connected to a gym) ── */}
        {prefs.gym_name && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", color: C.emerald, textTransform: "uppercase", marginBottom: 16 }}>Trainer visibility</div>
            <Glass style={{ padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.text, marginBottom: 8 }}>Connected: {prefs.gym_name}</div>
              <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.7, marginBottom: 12 }}>
                Your trainer can see your <strong style={{ color: C.text }}>completed workout history</strong> and <strong style={{ color: C.text }}>progression scores</strong> so they can coach you effectively.
              </div>
              <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.7 }}>
                Your trainer <strong style={{ color: C.text }}>cannot</strong> see: daily check-in free text, body mode details (cycle / pregnancy), injury areas, or your email address.
              </div>
            </Glass>
          </div>
        )}

        {/* ── Integration data (Strava) ── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", color: C.emerald, textTransform: "uppercase", marginBottom: 16 }}>Integration data</div>
          <Glass style={{ padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.text }}>Strava</div>
              <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.08em", color: prefs.strava_connected ? C.emerald : C.subtle, textTransform: "uppercase" }}>
                {prefs.strava_connected ? "Connected" : "Not connected"}
              </div>
            </div>
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6, marginBottom: 8 }}>
              When connected: we read <strong style={{ color: C.text }}>activity type, duration, distance, and heart rate</strong> to power your PMC chart and consistency score.
            </div>
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
              We do <strong style={{ color: C.text }}>not</strong> store GPS routes, location history, or your Strava contacts. Disconnect at any time in Settings → Your Coach → Integrations.
            </div>
          </Glass>
        </div>

        {/* ── Data controls ── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", color: C.emerald, textTransform: "uppercase", marginBottom: 16 }}>Your controls</div>
          <Glass style={{ padding: 24 }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.text, marginBottom: 4 }}>Export your data</div>
              <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, marginBottom: 10 }}>Download your full profile, settings, and workout history as a portable JSON file.</div>
              <button disabled={exporting} onClick={async () => {
                setExporting(true);
                try {
                  const [progressionRes, historyRes] = await Promise.all([api.getProgression(token), api.getHistory()]);
                  const bundle = { exported_at: new Date().toISOString(), profile: prefs, progression: progressionRes, history: historyRes };
                  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url; a.download = `justfit-data-${new Date().toISOString().slice(0, 10)}.json`;
                  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
                  setExportMsg("Downloaded.");
                } catch { setExportMsg("Export failed — please try again."); }
                setExporting(false);
              }} style={{ padding: "10px 18px", borderRadius: 14, fontSize: 13, fontWeight: 800, cursor: exporting ? "default" : "pointer", border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.04)", color: exporting ? C.subtle : C.muted, opacity: exporting ? 0.6 : 1 }}>
                {exporting ? "Preparing…" : "Download my data (JSON)"}
              </button>
              {exportMsg && <div style={{ fontSize: 12, fontWeight: 700, color: exportMsg.startsWith("Export failed") ? "#f43f5e" : C.emerald, marginTop: 8 }}>{exportMsg}</div>}
            </div>
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.text, marginBottom: 4 }}>Delete your account</div>
              <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, marginBottom: 10 }}>Permanently removes your account and all associated data. This cannot be undone.</div>
              <button onClick={() => setSubView("account")} style={{ padding: "10px 18px", borderRadius: 14, fontSize: 13, fontWeight: 800, cursor: "pointer", border: "1px solid rgba(244,63,94,0.3)", background: "rgba(244,63,94,0.06)", color: "#f43f5e" }}>
                Go to Account settings →
              </button>
            </div>
          </Glass>
        </div>
      </>)}

      {/* ── Integrations ──────────────────────────────────────────────────── */}
      {subView === "coach" && (
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", color: C.emerald, textTransform: "uppercase", marginBottom: 16 }}>
          Integrations
        </div>
        <Glass style={{ padding: 20 }}>
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(252,76,2,0.12)", border: "1px solid rgba(252,76,2,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066l-2.084 4.116z" fill="#FC4C02" />
                <path d="M11.094 13.828l2.525-4.977 2.524 4.977h2.948L15.619 6H13.62l-4.952 10.172h2.426z" fill="#FC4C02" opacity="0.8" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>Strava Import Beta</div>
                {stravaIsByo && (
                  <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.1em", padding: "2px 6px", borderRadius: 4, background: "rgba(252,76,2,0.12)", color: "#FC4C02", textTransform: "uppercase" }}>BYO App</span>
                )}
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>
                {stravaConnection === null
                  ? 'Checking connection…'
                  : stravaConnection
                  ? `Connected${stravaConnection.athlete_name ? ` · ${stravaConnection.athlete_name}` : ''}${stravaConnection.athlete_city ? ` · ${stravaConnection.athlete_city}` : ''}`
                  : 'Import rides and runs to power your PMC chart and cycling coach'}
              </div>
            </div>
            {stravaConnection === null ? null : stravaConnection ? (
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button
                  onClick={handleStravaSync}
                  disabled={stravaSyncing}
                  style={{ padding: "7px 14px", borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: "pointer", border: "1px solid rgba(252,76,2,0.4)", background: "rgba(252,76,2,0.1)", color: "#FC4C02", whiteSpace: "nowrap" }}
                >
                  {stravaSyncing ? 'Syncing…' : 'Sync'}
                </button>
                <button
                  onClick={handleStravaDisconnect}
                  disabled={stravaDisconnecting}
                  style={{ padding: "7px 14px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.04)", color: C.muted, whiteSpace: "nowrap" }}
                >
                  {stravaDisconnecting ? '…' : 'Disconnect'}
                </button>
              </div>
            ) : (
              <button
                onClick={handleStravaConnect}
                disabled={stravaConnecting}
                style={{ flexShrink: 0, padding: "7px 14px", borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: "pointer", border: "1px solid rgba(252,76,2,0.4)", background: "rgba(252,76,2,0.1)", color: "#FC4C02", whiteSpace: "nowrap" }}
              >
                {stravaConnecting ? 'Redirecting…' : 'Connect Strava'}
              </button>
            )}
          </div>

          {/* Last sync + result summary */}
          {stravaConnection && stravaConnection.last_sync_at_ms && (
            <div style={{ fontSize: 11, color: C.muted, marginTop: 4, marginBottom: 8 }}>
              Last synced: {(() => {
                const mins = Math.floor((Date.now() - stravaConnection.last_sync_at_ms) / 60000);
                if (mins < 2)  return 'just now';
                if (mins < 60) return `${mins}m ago`;
                const hrs = Math.floor(mins / 60);
                if (hrs < 24)  return `${hrs}h ago`;
                return `${Math.floor(hrs / 24)}d ago`;
              })()}
            </div>
          )}

          {stravaSyncResult && stravaSyncResult.imported > 0 && (() => {
            const SPORT_LABEL = { cycling: 'Ride', running: 'Run', walking: 'Walk', hiking: 'Hike', swimming: 'Swim', rowing: 'Row', fitness: 'Workout' };
            const fmtDur = (s) => s >= 3600 ? `${Math.floor(s/3600)}h ${Math.round((s%3600)/60)}m` : `${Math.round(s/60)}m`;
            const fmtDate = (d) => { const [y,m,day] = d.split('-'); return new Date(+y,+m-1,+day).toLocaleDateString(undefined,{month:'short',day:'numeric'}); };
            return (
              <div style={{ marginTop: 8, borderRadius: 12, border: "1px solid rgba(252,76,2,0.2)", overflow: "hidden" }}>
                <div style={{ padding: "7px 12px", background: "rgba(252,76,2,0.08)", fontSize: 11, fontWeight: 800, color: "#FC4C02", letterSpacing: "0.04em" }}>
                  {stravaSyncResult.imported} activit{stravaSyncResult.imported === 1 ? 'y' : 'ies'} imported
                </div>
                {(stravaSyncResult.recent ?? []).map((a, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", borderTop: i === 0 ? "none" : `1px solid rgba(255,255,255,0.04)`, background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
                    <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 6px", borderRadius: 6, background: "rgba(252,76,2,0.12)", color: "#FC4C02", flexShrink: 0 }}>{SPORT_LABEL[a.category] ?? a.category}</span>
                    <span style={{ fontSize: 12, color: C.text, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</span>
                    <span style={{ fontSize: 11, color: C.muted, flexShrink: 0 }}>{fmtDate(a.date)}</span>
                    {a.duration_sec > 0 && <span style={{ fontSize: 11, color: C.muted, flexShrink: 0 }}>{fmtDur(a.duration_sec)}</span>}
                  </div>
                ))}
                {stravaSyncResult.imported > 10 && (
                  <div style={{ padding: "6px 12px", borderTop: `1px solid rgba(255,255,255,0.04)`, fontSize: 11, color: C.muted }}>+ {stravaSyncResult.imported - 10} more — see History tab</div>
                )}
              </div>
            );
          })()}

          {stravaMsg && (
            <div style={{ fontSize: 11, color: stravaMsg === 'Already up to date.' || stravaMsg.includes('saved') ? C.muted : "#f87171", marginTop: 4 }}>
              {stravaMsg}
            </div>
          )}

          {/* Advanced setup toggle */}
          <button
            onClick={() => setShowStravaSetup(s => !s)}
            style={{ marginTop: 14, background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: 11, color: C.muted, display: "flex", alignItems: "center", gap: 4 }}
          >
            <span style={{ display: "inline-block", transform: showStravaSetup ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s" }}>▶</span>
            Advanced setup — use your own Strava app
          </button>

          {showStravaSetup && (
            <div style={{ marginTop: 12, padding: "16px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 10 }}>How to set up your own Strava app</div>
              <ol style={{ margin: 0, paddingLeft: 18, fontSize: 11, color: C.muted, lineHeight: 1.8 }}>
                <li>Go to <span style={{ color: C.text, fontFamily: "monospace" }}>strava.com/settings/api</span></li>
                <li>Create a new application</li>
                <li>Set <strong style={{ color: C.text }}>Authorization Callback Domain</strong> to <span style={{ color: C.text, fontFamily: "monospace" }}>justfit.cc</span></li>
                <li>Copy your <strong style={{ color: C.text }}>Client ID</strong> and <strong style={{ color: C.text }}>Client Secret</strong></li>
                <li>Paste them below, then save</li>
                <li>Click Connect Strava above</li>
              </ol>
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Client ID"
                  value={byoClientId}
                  onChange={e => setByoClientId(e.target.value)}
                  style={{ padding: "9px 12px", borderRadius: 10, background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, color: C.text, fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" }}
                />
                <input
                  type="password"
                  placeholder="Client Secret (write-only)"
                  value={byoClientSecret}
                  onChange={e => setByoClientSecret(e.target.value)}
                  style={{ padding: "9px 12px", borderRadius: 10, background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, color: C.text, fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" }}
                />
                <button
                  onClick={handleByoSave}
                  disabled={byoSaving || !byoClientId.trim() || !byoClientSecret.trim()}
                  style={{ padding: "9px 16px", borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: byoSaving || !byoClientId.trim() || !byoClientSecret.trim() ? "not-allowed" : "pointer", border: "1px solid rgba(252,76,2,0.4)", background: "rgba(252,76,2,0.1)", color: "#FC4C02", opacity: byoSaving || !byoClientId.trim() || !byoClientSecret.trim() ? 0.5 : 1 }}
                >
                  {byoSaving ? 'Saving…' : 'Save credentials'}
                </button>
              </div>
            </div>
          )}
        </Glass>
      </div>
      )}  {/* closes subView === "coach" for Integrations */}

      {subView === "account" && (
      <div style={{ marginBottom: 32 }}>
        {/* Security — Passkey */}
        {/* Push notifications */}
        {'Notification' in window && 'serviceWorker' in navigator && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", color: C.emerald, textTransform: "uppercase", marginBottom: 16 }}>Notificaties</div>
            <Glass style={{ padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 4 }}>Dagelijkse trainingsherinnering</div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 16, lineHeight: 1.6 }}>Ontvang een melding als je je training voor vandaag nog niet hebt gedaan.</div>
              {pushMsg && <div style={{ fontSize: 12, color: pushMsg.startsWith('✓') ? C.emerald : "#f87171", marginBottom: 12 }}>{pushMsg}</div>}
              {pushState === "denied" && <div style={{ fontSize: 12, color: "#f87171", marginBottom: 12 }}>Notificaties geblokkeerd. Sta ze toe via je browserinstellingen.</div>}
              {pushState !== "subscribed" && Notification.permission !== "granted" ? (
                <button onClick={handleEnablePush} disabled={pushState === "requesting" || pushState === "denied"}
                  style={{ width: "100%", padding: "11px 16px", borderRadius: 12, background: C.emeraldDim, border: `1px solid ${C.emeraldBorder}`, color: C.emerald, fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "inherit", opacity: pushState === "denied" ? 0.4 : 1 }}>
                  {pushState === "requesting" ? "Bezig…" : "Inschakelen"}
                </button>
              ) : (
                <button onClick={handleDisablePush}
                  style={{ width: "100%", padding: "11px 16px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, color: C.muted, fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                  Uitschakelen
                </button>
              )}
            </Glass>
          </div>
        )}

        {passkeySupported && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", color: C.emerald, textTransform: "uppercase", marginBottom: 16 }}>
              Security
            </div>
            <Glass style={{ padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 4 }}>Face ID / Touch ID</div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 16, lineHeight: 1.6 }}>
                Register a passkey so you can log in with biometrics — no password needed.
              </div>
              {passkeyMsg && (
                <div style={{
                  fontSize: 12, padding: "10px 14px", borderRadius: 10, marginBottom: 14,
                  background: passkeyMsg.startsWith("✓") ? "rgba(var(--accent-rgb),0.1)" : "rgba(226,76,74,0.1)",
                  border: `1px solid ${passkeyMsg.startsWith("✓") ? "rgba(var(--accent-rgb),0.3)" : "rgba(226,76,74,0.3)"}`,
                  color: passkeyMsg.startsWith("✓") ? C.emerald : "#f87171",
                }}>
                  {passkeyMsg}
                </div>
              )}
              <button
                onClick={handleAddPasskey}
                disabled={addingPasskey}
                style={{
                  width: "100%", padding: "11px 16px", borderRadius: 12,
                  background: addingPasskey ? "rgba(255,255,255,0.03)" : C.emeraldDim,
                  border: `1px solid ${C.emeraldBorder}`,
                  color: C.emerald, fontWeight: 800, fontSize: 13,
                  cursor: addingPasskey ? "not-allowed" : "pointer",
                  opacity: addingPasskey ? 0.6 : 1,
                }}
              >
                {addingPasskey ? "Follow your device prompt…" : "Add Face ID / Touch ID"}
              </button>
            </Glass>
          </div>
        )}
      </div>
      )}  {/* closes subView === "account" for Security */}

      {subView === "you" && (
      <div style={{ marginBottom: 32 }}>
        {/* ── Appearance ── */}
        <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", color: C.emerald, textTransform: "uppercase", marginBottom: 16 }}>
          {t("Appearance")}
        </div>
        <Glass style={{ padding: 24 }}>
          {/* ── Language toggle ── */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 12 }}>
              {t("Language")}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {["nl", "en"].map((lang) => {
                const active = getLang() === lang;
                return (
                  <button
                    key={lang}
                    onClick={() => setLang(lang)}
                    style={{
                      padding: "8px 20px", borderRadius: 12, fontWeight: 900, fontSize: 14, cursor: "pointer",
                      border: `1px solid ${active ? "var(--accent-border, rgba(16,185,129,0.3))" : C.border}`,
                      background: active ? "var(--accent-dim, rgba(16,185,129,0.15))" : "rgba(255,255,255,0.04)",
                      color: active ? "var(--accent, #10b981)" : C.muted,
                    }}
                  >
                    {lang === "nl" ? "NL" : "EN"}
                  </button>
                );
              })}
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 10 }}>
              {getLang() === "nl" ? "App wordt weergegeven in het Nederlands." : "App is displayed in English."}
            </div>
          </div>
          <div style={{ height: 1, background: C.border, marginBottom: 16 }} />
          <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 16 }}>
            {t("Accent colour")}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {ACCENT_COLORS.map((ac) => {
              const selected = accentHex === ac.hex;
              return (
                <button
                  key={ac.id}
                  title={ac.name}
                  onClick={() => {
                    setAccentHex(ac.hex);
                    applyAccent(ac.hex);
                  }}
                  style={{
                    width: 36, height: 36,
                    borderRadius: "50%",
                    background: ac.hex,
                    border: selected ? `3px solid ${C.text}` : "3px solid transparent",
                    outline: selected ? `2px solid ${ac.hex}` : "none",
                    outlineOffset: 2,
                    cursor: "pointer",
                    padding: 0,
                    boxShadow: selected ? `0 0 0 1px ${ac.hex}` : "none",
                    transition: "transform 0.12s, box-shadow 0.12s",
                    transform: selected ? "scale(1.15)" : "scale(1)",
                    flexShrink: 0,
                  }}
                />
              );
            })}
          </div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 14, lineHeight: 1.5 }}>
            {ACCENT_COLORS.find((a) => a.hex === accentHex)?.name ?? "Custom"} — saved locally on this device.
          </div>
        </Glass>
      </div>
      )}  {/* closes subView === "you" for Appearance */}

      {subView === "privacy" && (<>
      {/* ── Feedback ── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", color: C.emerald, textTransform: "uppercase", marginBottom: 16 }}>
          Feedback
        </div>
        <Glass style={{ padding: 24 }}>
          {feedbackDone ? (
            <div style={{ textAlign: "center", padding: "12px 0" }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>✓</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Thanks for your feedback!</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>We read every message.</div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 12, lineHeight: 1.5 }}>
                Bugs, ideas, or just a note — we read everything.
              </div>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Type your message here…"
                rows={4}
                style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 14, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.04)", color: C.text, fontSize: 14, fontWeight: 500, resize: "vertical", fontFamily: "inherit", outline: "none", lineHeight: 1.5 }}
              />
              <button
                disabled={feedbackSending || feedbackText.trim().length === 0}
                onClick={async () => {
                  if (feedbackText.trim().length === 0) return;
                  setFeedbackSending(true);
                  try {
                    await api.sendFeedback(token, feedbackText.trim());
                    setFeedbackDone(true);
                    setFeedbackText("");
                  } catch {
                    // silent — don't block user
                    setFeedbackDone(true);
                  } finally {
                    setFeedbackSending(false);
                  }
                }}
                style={{ marginTop: 12, width: "100%", padding: "12px 0", borderRadius: 14, fontWeight: 900, fontSize: 14, border: `1px solid ${C.emeraldBorder}`, background: C.emeraldDim, color: C.emerald, cursor: feedbackSending || feedbackText.trim().length === 0 ? "not-allowed" : "pointer", opacity: feedbackSending || feedbackText.trim().length === 0 ? 0.5 : 1 }}
              >
                {feedbackSending ? "Sending…" : "Submit feedback"}
              </button>
            </>
          )}
        </Glass>
      </div>

      {/* ── Information ─────────────────────────────────────── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", color: C.emerald, textTransform: "uppercase", marginBottom: 16 }}>
          Information
        </div>
        <Glass style={{ padding: 20 }}>
          {DOCS.map((doc, i) => (
            <button
              key={doc.id}
              onClick={() => setActiveDoc(doc)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                width: "100%", padding: "12px 0", background: "none", border: "none", cursor: "pointer",
                borderBottom: i < DOCS.length - 1 ? `1px solid ${C.border}` : "none",
                textAlign: "left",
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{doc.title}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{doc.subtitle}</div>
              </div>
              <span style={{ color: C.muted, fontSize: 18, marginLeft: 12, flexShrink: 0 }}>›</span>
            </button>
          ))}
        </Glass>
      </div>
      </>)}  {/* closes subView === "privacy" for Feedback + Information */}

      {/* ── Your body — only shown to female users, you sub-view ── */}
      {subView === "you" && prefs.sex === "female" && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", color: C.emerald, textTransform: "uppercase", marginBottom: 16 }}>
            Your body
          </div>

          <Glass style={{ padding: 20, marginBottom: 12 }}>
            {/* Cycle tracking mode */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>Cycle tracking</div>
                {cycleTrackingMode === "smart" && prefs.cycle?.current_phase && (
                  <div style={{ fontSize: 12, color: "rgba(167,139,250,0.8)", marginTop: 3 }}>
                    Currently in your {PHASE_LABELS[prefs.cycle.current_phase]} · Day {prefs.cycle.cycle_day}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {["smart", "off"].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setCycleTrackingMode(mode)}
                    style={{
                      padding: "6px 12px", borderRadius: 10, fontSize: 12, fontWeight: 700,
                      border: `1px solid ${cycleTrackingMode === mode ? C.emeraldBorder : C.border}`,
                      background: cycleTrackingMode === mode ? C.emeraldDim : "rgba(255,255,255,0.03)",
                      color: cycleTrackingMode === mode ? C.emerald : C.muted, cursor: "pointer",
                    }}
                  >
                    {mode === "smart" ? "Smart" : "Off"}
                  </button>
                ))}
              </div>
            </div>

            {cycleTrackingMode === "smart" && (
              <>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>Last period started</div>
                <input
                  type="date"
                  value={lastPeriodStart}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setLastPeriodStart(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, color: C.text, fontSize: 14, outline: "none", fontFamily: "inherit", marginBottom: 14, boxSizing: "border-box" }}
                />

                <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>Cycle length</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                  {CYCLE_LENGTHS.map((d) => (
                    <button
                      key={d}
                      onClick={() => setCycleLength(d)}
                      style={{ padding: "6px 11px", borderRadius: 999, fontSize: 12, fontWeight: 700, border: `1px solid ${cycleLength === d ? C.emeraldBorder : C.border}`, background: cycleLength === d ? C.emeraldDim : "rgba(255,255,255,0.03)", color: cycleLength === d ? C.emerald : C.muted, cursor: "pointer" }}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
              </>
            )}

            <button
              disabled={cycleSaving}
              onClick={async () => {
                setCycleSaving(true);
                try {
                  await api.saveProfile(token, {
                    cycle: { tracking_mode: cycleTrackingMode, cycle_length_days: cycleLength, last_period_start: lastPeriodStart || undefined },
                  });
                  onUpdate((p) => ({ ...p, cycle: { ...(p.cycle ?? {}), tracking_mode: cycleTrackingMode, cycle_length_days: cycleLength, last_period_start: lastPeriodStart } }));
                } catch { /* ignore */ }
                setCycleSaving(false);
              }}
              style={{ width: "100%", padding: "10px 16px", borderRadius: 12, background: cycleSaving ? "rgba(255,255,255,0.03)" : C.emeraldDim, border: `1px solid ${C.emeraldBorder}`, color: C.emerald, fontWeight: 800, fontSize: 13, cursor: cycleSaving ? "not-allowed" : "pointer" }}
            >
              {cycleSaving ? "Saving…" : "Save"}
            </button>
          </Glass>

          {bodyMode === "pregnant" && (
            <Glass style={{ padding: 20, marginBottom: 12, border: "1px solid rgba(251,191,36,0.25)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#fbbf24" }}>Pregnancy mode active</div>
                  {prefs.cycle?.pregnancy_week && (
                    <div style={{ fontSize: 12, color: "rgba(251,191,36,0.7)", marginTop: 3 }}>
                      Week {prefs.cycle.pregnancy_week} · Trimester {prefs.cycle.trimester}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 14, lineHeight: 1.6 }}>
                Your sessions are adapted for pregnancy — pelvic floor included, high-impact excluded, intensity matched to your trimester.
              </div>
              {pregnancyDueDate && (
                <>
                  <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>Due date</div>
                  <input
                    type="date"
                    value={pregnancyDueDate}
                    onChange={(e) => setPregnancyDueDate(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, color: C.text, fontSize: 14, outline: "none", fontFamily: "inherit", marginBottom: 12, boxSizing: "border-box" }}
                  />
                  <button
                    disabled={pregnancySaving}
                    onClick={async () => {
                      setPregnancySaving(true);
                      try {
                        await api.saveProfile(token, {
                          cycle: { mode: "pregnant", pregnancy_due_date: pregnancyDueDate, tracking_mode: "off" },
                        });
                        onUpdate((p) => ({ ...p, cycle: { ...(p.cycle ?? {}), pregnancy_due_date: pregnancyDueDate } }));
                      } catch { /* ignore */ }
                      setPregnancySaving(false);
                    }}
                    style={{ width: "100%", padding: "9px 16px", borderRadius: 10, fontSize: 13, fontWeight: 700, border: "1px solid rgba(251,191,36,0.3)", background: pregnancySaving ? "rgba(255,255,255,0.03)" : "rgba(251,191,36,0.1)", color: pregnancySaving ? C.muted : "#fbbf24", cursor: pregnancySaving ? "not-allowed" : "pointer", marginBottom: 12 }}
                  >
                    {pregnancySaving ? "Saving…" : "Update due date"}
                  </button>
                </>
              )}
              {/* Baby arrived prompt — show when due date has passed */}
              {prefs.cycle?.pregnancy_due_date && new Date(prefs.cycle.pregnancy_due_date) <= new Date() && postnatalSetupStep === 0 && (
                <div style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 10, padding: 14, marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#fbbf24", marginBottom: 6 }}>Has your baby arrived?</div>
                  <div style={{ fontSize: 12, color: C.muted, marginBottom: 12, lineHeight: 1.6 }}>
                    When you're ready, switch to postnatal mode for a gentle recovery programme.
                  </div>
                  <button
                    onClick={() => setPostnatalSetupStep(1)}
                    style={{ padding: "8px 14px", borderRadius: 9, fontSize: 12, fontWeight: 700, border: "1px solid rgba(251,191,36,0.3)", background: "rgba(251,191,36,0.1)", color: "#fbbf24", cursor: "pointer" }}
                  >
                    Yes — set up postnatal mode
                  </button>
                </div>
              )}

              {postnatalSetupStep === 1 && (
                <div style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 10, padding: 14, marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#fbbf24", marginBottom: 10 }}>Step 1 of 2 — Birth date</div>
                  <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>When did your baby arrive?</div>
                  <input
                    type="date"
                    value={postnatalBirthDate}
                    max={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setPostnatalBirthDate(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, color: C.text, fontSize: 14, outline: "none", fontFamily: "inherit", marginBottom: 12, boxSizing: "border-box" }}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setPostnatalSetupStep(0)} style={{ flex: 1, padding: "8px 12px", borderRadius: 9, fontSize: 12, fontWeight: 700, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.03)", color: C.muted, cursor: "pointer" }}>Cancel</button>
                    <button
                      disabled={!postnatalBirthDate}
                      onClick={() => setPostnatalSetupStep(2)}
                      style={{ flex: 2, padding: "8px 12px", borderRadius: 9, fontSize: 12, fontWeight: 700, border: "1px solid rgba(251,191,36,0.3)", background: postnatalBirthDate ? "rgba(251,191,36,0.1)" : "rgba(255,255,255,0.03)", color: postnatalBirthDate ? "#fbbf24" : C.muted, cursor: postnatalBirthDate ? "pointer" : "not-allowed" }}
                    >Continue</button>
                  </div>
                </div>
              )}

              {postnatalSetupStep === 2 && (
                <div style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 10, padding: 14, marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#fbbf24", marginBottom: 10 }}>Step 2 of 2 — Birth type</div>
                  <div style={{ fontSize: 12, color: C.muted, marginBottom: 10, lineHeight: 1.6 }}>This helps us adapt your recovery timeline. (Optional)</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                    {[["vaginal", "Vaginal"], ["caesarean", "Caesarean"], ["prefer_not_to_say", "Prefer not to say"]].map(([val, label]) => (
                      <button
                        key={val}
                        onClick={() => setPostnatalBirthType(val)}
                        style={{ padding: "7px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700, border: `1px solid ${postnatalBirthType === val ? "rgba(251,191,36,0.4)" : C.border}`, background: postnatalBirthType === val ? "rgba(251,191,36,0.12)" : "rgba(255,255,255,0.03)", color: postnatalBirthType === val ? "#fbbf24" : C.muted, cursor: "pointer" }}
                      >{label}</button>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setPostnatalSetupStep(1)} style={{ flex: 1, padding: "8px 12px", borderRadius: 9, fontSize: 12, fontWeight: 700, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.03)", color: C.muted, cursor: "pointer" }}>Back</button>
                    <button
                      disabled={postnatalSaving}
                      onClick={async () => {
                        setPostnatalSaving(true);
                        try {
                          await api.saveProfile(token, {
                            cycle: {
                              mode: "postnatal",
                              tracking_mode: "off",
                              postnatal_birth_date: postnatalBirthDate,
                              postnatal_birth_type: postnatalBirthType || "prefer_not_to_say",
                            },
                          });
                          setBodyMode("postnatal");
                          setPostnatalSetupStep(0);
                          onUpdate((p) => ({
                            ...p,
                            cycle: {
                              ...(p.cycle ?? {}),
                              mode: "postnatal",
                              postnatal_birth_date: postnatalBirthDate,
                              postnatal_birth_type: postnatalBirthType || "prefer_not_to_say",
                            },
                          }));
                        } catch { /* ignore */ }
                        setPostnatalSaving(false);
                      }}
                      style={{ flex: 2, padding: "8px 12px", borderRadius: 9, fontSize: 12, fontWeight: 700, border: "1px solid rgba(251,191,36,0.3)", background: postnatalSaving ? "rgba(255,255,255,0.03)" : "rgba(251,191,36,0.1)", color: postnatalSaving ? C.muted : "#fbbf24", cursor: postnatalSaving ? "not-allowed" : "pointer" }}
                    >{postnatalSaving ? "Saving…" : "Start postnatal mode"}</button>
                  </div>
                </div>
              )}

              <button
                onClick={async () => {
                  if (!confirm("Switch back to standard mode? Your pregnancy data will be kept.")) return;
                  setPregnancySaving(true);
                  try {
                    await api.saveProfile(token, {
                      cycle: { mode: "standard", tracking_mode: "off" },
                    });
                    setBodyMode("standard");
                    onUpdate((p) => ({ ...p, cycle: { ...(p.cycle ?? {}), mode: "standard" } }));
                  } catch { /* ignore */ }
                  setPregnancySaving(false);
                }}
                style={{ width: "100%", padding: "9px 16px", borderRadius: 10, fontSize: 12, fontWeight: 700, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.03)", color: C.muted, cursor: "pointer" }}
              >
                Leave pregnancy mode
              </button>
            </Glass>
          )}

          {/* ── Postnatal mode card ── */}
          {bodyMode === "postnatal" && (
            <Glass style={{ padding: 20, marginBottom: 12, border: "1px solid rgba(251,191,36,0.2)" }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#fbbf24", marginBottom: 4 }}>Postnatal mode active</div>
              {prefs.cycle?.postnatal_phase && (
                <div style={{ fontSize: 12, color: "rgba(251,191,36,0.7)", marginBottom: 12 }}>
                  {{ immediate: "Immediate recovery (0–2 wks)", early: "Early recovery (2–6 wks)", rebuilding: "Rebuilding (6–16 wks)", strengthening: "Strengthening (16–26 wks)", returning: "Returning to fitness (26+ wks)" }[prefs.cycle.postnatal_phase]}
                </div>
              )}
              <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6, marginBottom: 14 }}>
                Your programme is adapted to your postnatal phase — pelvic floor foundation first, progressive rebuilding as you heal.
              </div>
              <button
                onClick={async () => {
                  if (!confirm("Switch back to standard mode?")) return;
                  setPostnatalSaving(true);
                  try {
                    await api.saveProfile(token, { cycle: { mode: "standard", tracking_mode: "off" } });
                    setBodyMode("standard");
                    onUpdate((p) => ({ ...p, cycle: { ...(p.cycle ?? {}), mode: "standard" } }));
                  } catch { /* ignore */ }
                  setPostnatalSaving(false);
                }}
                style={{ width: "100%", padding: "9px 16px", borderRadius: 10, fontSize: 12, fontWeight: 700, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.03)", color: C.muted, cursor: "pointer" }}
              >
                Leave postnatal mode
              </button>
            </Glass>
          )}

          <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.6, padding: "0 4px" }}>
            Your body data is stored privately on your device and our secure servers. It is never shared, sold, or used for advertising. Ever.
          </div>
        </div>
      )}

      {subView === "account" && (
      <div style={{marginTop:24, display:"flex", flexDirection:"column", gap:10}}>
        {/* Delete account card */}
        <div style={{ padding:"14px 16px", borderRadius:14, border:`1px solid ${C.border}`, background:C.bgCard, display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:C.muted, marginBottom:2 }}>Delete Account</div>
            <div style={{ fontSize:12, color:C.subtle, lineHeight:1.5 }}>
              Permanently removes your account and all data.
            </div>
          </div>
          <button
            onClick={() => { setDeleteStep("confirm"); setDeleteText(""); setDeleteError(""); }}
            style={{ flexShrink:0, padding:"10px 14px", borderRadius:14, border:"1px solid rgba(226,76,74,0.4)", background:"rgba(226,76,74,0.1)", color:"#f87171", fontWeight:900, fontSize:12, cursor:"pointer" }}
          >
            Delete →
          </button>
        </div>
      </div>
      )}  {/* closes subView === "account" for Delete account */}

      {/* ── Coach conflict modal ── */}
      {showConflictModal && (
        <div style={{ position:"fixed", inset:0, zIndex:300, display:"flex", alignItems:"center", justifyContent:"center", padding:24, background:"rgba(2,6,23,0.9)" }}>
          <div style={{ width:"100%", maxWidth:360, background:"#0f172a", border:`1px solid ${C.border}`, borderRadius:20, padding:28, display:"flex", flexDirection:"column", gap:20 }}>
            <div style={{ ...display(22), color:C.text }}>WHICH COACH DRIVES TODAY?</div>
            <div style={{ fontSize:14, color:C.muted, lineHeight:1.6 }}>
              You have more than one active coach. Pick the one that shapes today's session.
            </div>
            {[
              milCoachActive  && { key:"military",  label:"MILITARY", sub: prefs.preferences?.military_coach?.track === "keuring" ? "Keuring track" : "Opleiding track" },
              runCoachActive  && { key:"running",   label:"RUNNING",  sub: `${prefs.preferences?.run_coach?.target_km ?? 5}km programme` },
              cycleCoachActive && { key:"cycling",  label:"CYCLING",  sub: (prefs.preferences?.cycling_coach?.sub_goal ?? "build_fitness").replace(/_/g, " ") },
            ].filter(Boolean).map(opt => (
              <button key={opt.key} onClick={async () => {
                setPrimaryIntent(opt.key);
                setShowConflictModal(false);
                try { await api.saveProfile(token, { preferences: { primary_intent: opt.key } }); } catch { /* ignore */ }
              }} style={{ padding:"14px 16px", borderRadius:14, border:`1px solid ${C.emeraldBorder}`, background:C.emeraldDim, color:C.emerald, fontWeight:900, fontSize:16, cursor:"pointer", textAlign:"left" }}>
                <div style={{ fontSize:18, fontWeight:900 }}>{opt.label}</div>
                <div style={{ fontSize:12, fontWeight:500, color:"rgba(16,185,129,0.7)", marginTop:2 }}>{opt.sub}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Email verify / change modal */}
      {emailStep && (
        <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:24, background:"rgba(2,6,23,0.85)" }}
          onClick={() => { if (!emailLoading) { setEmailStep(null); setEmailCode(""); setEmailInput(""); setEmailError(""); } }}
        >
          <div style={{ width:"100%", maxWidth:360, background:"#0f172a", border:`1px solid ${C.border}`, borderRadius:20, padding:28, display:"flex", flexDirection:"column", gap:20 }}
            onClick={e => e.stopPropagation()}
          >
            {emailStep === "verify_code" && (
              <>
                <div style={{ fontSize:18, fontWeight:900, color:C.text }}>Verify your email</div>
                <div style={{ fontSize:14, color:C.muted, lineHeight:1.6 }}>
                  Enter the 6-digit code sent to <strong style={{color:C.text}}>{prefs.email}</strong>. No email yet? Close this and tap "Resend email".
                </div>
                <input
                  type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6}
                  value={emailCode}
                  onChange={e => { setEmailCode(e.target.value.replace(/\D/g, "")); setEmailError(""); }}
                  placeholder="123456" autoFocus
                  style={{ padding:"14px", borderRadius:12, border:`1px solid ${emailError ? "rgba(226,76,74,0.6)" : C.border}`, background:"rgba(255,255,255,0.04)", color:C.text, fontSize:24, fontWeight:900, outline:"none", textAlign:"center", letterSpacing:"0.2em", fontFamily:"monospace" }}
                />
                {emailError && <div style={{ fontSize:12, color:"#f87171", marginTop:-12 }}>{emailError}</div>}
                <div style={{ display:"flex", gap:10 }}>
                  <button onClick={() => { setEmailStep(null); setEmailCode(""); setEmailError(""); }}
                    style={{ flex:1, padding:"12px 0", borderRadius:12, border:`1px solid ${C.border}`, background:C.bgCard, color:C.text, fontWeight:700, fontSize:14, cursor:"pointer" }}>
                    Cancel
                  </button>
                  <button
                    disabled={emailLoading || emailCode.length !== 6}
                    onClick={async () => {
                      setEmailLoading(true);
                      const res = await api.verifyEmailCode(emailCode).catch(() => ({ error: "Network error" }));
                      setEmailLoading(false);
                      if (res.ok) {
                        setEmailStep(null); setEmailCode("");
                        onUpdate({ ...prefs, email_verified: true });
                      } else { setEmailError(res.error ?? "Invalid code"); }
                    }}
                    style={{ flex:1, padding:"12px 0", borderRadius:12, border:`1px solid ${C.emeraldBorder}`, background:(emailLoading || emailCode.length !== 6) ? "rgba(16,185,129,0.05)" : C.emeraldDim, color:(emailLoading || emailCode.length !== 6) ? C.muted : C.emerald, fontWeight:900, fontSize:14, cursor:(emailLoading || emailCode.length !== 6) ? "default" : "pointer" }}>
                    {emailLoading ? "Verifying…" : "Verify"}
                  </button>
                </div>
              </>
            )}
            {emailStep === "change_enter" && (
              <>
                <div style={{ fontSize:18, fontWeight:900, color:C.text }}>Change email address</div>
                <div style={{ fontSize:14, color:C.muted, lineHeight:1.6 }}>
                  We'll send a verification link and code to your new address.
                </div>
                <input
                  type="email" value={emailInput}
                  onChange={e => { setEmailInput(e.target.value); setEmailError(""); }}
                  placeholder="new@email.com" autoFocus
                  style={{ padding:"12px 14px", borderRadius:12, border:`1px solid ${emailError ? "rgba(226,76,74,0.6)" : C.border}`, background:"rgba(255,255,255,0.04)", color:C.text, fontSize:15, fontWeight:700, outline:"none" }}
                />
                {emailError && <div style={{ fontSize:12, color:"#f87171", marginTop:-12 }}>{emailError}</div>}
                <div style={{ display:"flex", gap:10 }}>
                  <button onClick={() => { setEmailStep(null); setEmailInput(""); setEmailError(""); }}
                    style={{ flex:1, padding:"12px 0", borderRadius:12, border:`1px solid ${C.border}`, background:C.bgCard, color:C.text, fontWeight:700, fontSize:14, cursor:"pointer" }}>
                    Cancel
                  </button>
                  <button
                    disabled={emailLoading || !emailInput.includes("@")}
                    onClick={async () => {
                      setEmailLoading(true);
                      const res = await api.requestEmailChange(emailInput).catch(() => ({ error: "Network error" }));
                      setEmailLoading(false);
                      if (res.ok) { setEmailStep("change_code"); setEmailCode(""); setEmailError(""); }
                      else { setEmailError(res.error ?? "Something went wrong"); }
                    }}
                    style={{ flex:1, padding:"12px 0", borderRadius:12, border:`1px solid ${C.emeraldBorder}`, background:(emailLoading || !emailInput.includes("@")) ? "rgba(16,185,129,0.05)" : C.emeraldDim, color:(emailLoading || !emailInput.includes("@")) ? C.muted : C.emerald, fontWeight:900, fontSize:14, cursor:(emailLoading || !emailInput.includes("@")) ? "default" : "pointer" }}>
                    {emailLoading ? "Sending…" : "Send verification"}
                  </button>
                </div>
              </>
            )}
            {emailStep === "change_code" && (
              <>
                <div style={{ fontSize:18, fontWeight:900, color:C.text }}>Enter verification code</div>
                <div style={{ fontSize:14, color:C.muted, lineHeight:1.6 }}>
                  Enter the 6-digit code sent to <strong style={{color:C.text}}>{emailInput}</strong>. Or click the link in that email.
                </div>
                <input
                  type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6}
                  value={emailCode}
                  onChange={e => { setEmailCode(e.target.value.replace(/\D/g, "")); setEmailError(""); }}
                  placeholder="123456" autoFocus
                  style={{ padding:"14px", borderRadius:12, border:`1px solid ${emailError ? "rgba(226,76,74,0.6)" : C.border}`, background:"rgba(255,255,255,0.04)", color:C.text, fontSize:24, fontWeight:900, outline:"none", textAlign:"center", letterSpacing:"0.2em", fontFamily:"monospace" }}
                />
                {emailError && <div style={{ fontSize:12, color:"#f87171", marginTop:-12 }}>{emailError}</div>}
                <div style={{ display:"flex", gap:10 }}>
                  <button onClick={() => setEmailStep("change_enter")}
                    style={{ flex:1, padding:"12px 0", borderRadius:12, border:`1px solid ${C.border}`, background:C.bgCard, color:C.text, fontWeight:700, fontSize:14, cursor:"pointer" }}>
                    Back
                  </button>
                  <button
                    disabled={emailLoading || emailCode.length !== 6}
                    onClick={async () => {
                      setEmailLoading(true);
                      const res = await api.verifyChangeCode(emailCode).catch(() => ({ error: "Network error" }));
                      setEmailLoading(false);
                      if (res.ok) {
                        setEmailStep(null); setEmailCode("");
                        onUpdate({ ...prefs, email: emailInput, email_verified: true });
                        if (res.token) localStorage.setItem("jf_token", res.token);
                      } else { setEmailError(res.error ?? "Invalid code"); }
                    }}
                    style={{ flex:1, padding:"12px 0", borderRadius:12, border:`1px solid ${C.emeraldBorder}`, background:(emailLoading || emailCode.length !== 6) ? "rgba(16,185,129,0.05)" : C.emeraldDim, color:(emailLoading || emailCode.length !== 6) ? C.muted : C.emerald, fontWeight:900, fontSize:14, cursor:(emailLoading || emailCode.length !== 6) ? "default" : "pointer" }}>
                    {emailLoading ? "Confirming…" : "Confirm change"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete account modal */}
      {deleteStep && (
        <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:24, background:"rgba(2,6,23,0.85)" }}
          onClick={() => { if (!deleteLoading) { setDeleteStep(null); setDeleteText(""); setDeleteError(""); } }}
        >
          <div style={{ width:"100%", maxWidth:360, background:"#0f172a", border:`1px solid ${C.border}`, borderRadius:20, padding:28, display:"flex", flexDirection:"column", gap:20 }}
            onClick={e => e.stopPropagation()}
          >
            {deleteStep === "confirm" ? (
              <>
                <div style={{ fontSize:18, fontWeight:900, color:C.text, lineHeight:1.3 }}>
                  Delete your account?
                </div>
                <div style={{ fontSize:14, color:C.muted, lineHeight:1.6 }}>
                  This will permanently delete your account and <strong style={{color:C.text}}>all relevant data</strong> — workouts, history, preferences, and progress. This action cannot be undone.
                </div>
                <div style={{ display:"flex", gap:10 }}>
                  <button
                    onClick={() => { setDeleteStep(null); setDeleteText(""); setDeleteError(""); }}
                    style={{ flex:1, padding:"12px 0", borderRadius:12, border:`1px solid ${C.border}`, background:C.bgCard, color:C.text, fontWeight:700, fontSize:14, cursor:"pointer" }}
                  >
                    No, keep it
                  </button>
                  <button
                    onClick={() => setDeleteStep("type")}
                    style={{ flex:1, padding:"12px 0", borderRadius:12, border:"1px solid rgba(226,76,74,0.4)", background:"rgba(226,76,74,0.1)", color:"#f87171", fontWeight:700, fontSize:14, cursor:"pointer" }}
                  >
                    Yes, delete
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize:18, fontWeight:900, color:"#f87171", lineHeight:1.3 }}>
                  Confirm deletion
                </div>
                <div style={{ fontSize:14, color:C.muted, lineHeight:1.6 }}>
                  Type <strong style={{color:C.text, fontFamily:"monospace"}}>delete</strong> to confirm.
                </div>
                <input
                  type="text"
                  value={deleteText}
                  onChange={e => { setDeleteText(e.target.value); setDeleteError(""); }}
                  placeholder="delete"
                  autoFocus
                  style={{ padding:"12px 14px", borderRadius:12, border:`1px solid ${deleteError ? "rgba(226,76,74,0.6)" : C.border}`, background:"rgba(255,255,255,0.04)", color:C.text, fontSize:15, fontWeight:700, outline:"none", fontFamily:"monospace" }}
                />
                {deleteError && <div style={{ fontSize:12, color:"#f87171", marginTop:-12 }}>{deleteError}</div>}
                <div style={{ display:"flex", gap:10 }}>
                  <button
                    disabled={deleteLoading}
                    onClick={() => { setDeleteStep("confirm"); setDeleteText(""); setDeleteError(""); }}
                    style={{ flex:1, padding:"12px 0", borderRadius:12, border:`1px solid ${C.border}`, background:C.bgCard, color:C.muted, fontWeight:700, fontSize:14, cursor:"pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    disabled={deleteLoading}
                    onClick={async () => {
                      if (deleteText.trim().toLowerCase() !== "delete") {
                        setDeleteError('Please type "delete" to confirm.');
                        return;
                      }
                      setDeleteLoading(true);
                      try {
                        const res = await api.deleteAccount();
                        if (res.ok) {
                          logout();
                        } else {
                          setDeleteError(res.error ?? "Something went wrong. Please try again.");
                          setDeleteLoading(false);
                        }
                      } catch { setDeleteError("Network error. Please try again."); setDeleteLoading(false); }
                    }}
                    style={{ flex:1, padding:"12px 0", borderRadius:12, border:"1px solid rgba(226,76,74,0.4)", background: deleteLoading ? "rgba(226,76,74,0.05)" : "rgba(226,76,74,0.15)", color: deleteLoading ? C.muted : "#f87171", fontWeight:900, fontSize:14, cursor: deleteLoading ? "default" : "pointer" }}
                  >
                    {deleteLoading ? "Deleting…" : "Delete account"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <p
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.1em",
          color: C.subtle,
          textTransform: "uppercase",
          textAlign: "center",
          marginTop: 40,
        }}
      >
        JustFit.cc — System Operational
      </p>
    </div>
  );
}

// ─── TRAINERS SUB-VIEW ────────────────────────────────────────────────────────
const LEVEL_LABELS = { L0: 'None', L1: 'Basic', L2: 'Standard', L3: 'Full (billable)', L4: 'Complete' };
const LEVEL_ORDER = ['L0', 'L1', 'L2', 'L3', 'L4'];

function TrainersSubView({ token }) {
  const [disclosures, setDisclosures] = useState([]);
  const [intake, setIntake] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showIntake, setShowIntake] = useState(false);
  const [intakeForm, setIntakeForm] = useState({ goals: [], experience_level: 'beginner', injuries: [], equipment_access: [], availability_days_per_week: 3 });
  const [savingIntake, setSavingIntake] = useState(false);
  const [responding, setResponding] = useState(false);
  const [levelChanging, setLevelChanging] = useState(null);
  const [error, setError] = useState('');

  // Trainer switch consent toggle
  const [allowSwitch, setAllowSwitch] = useState(true);
  const [switchConsentSaving, setSwitchConsentSaving] = useState(false);
  const [isInGym, setIsInGym] = useState(false);

  // Connect to trainer flow (Sub-flow C)
  const [connectStep, setConnectStep] = useState(0); // 0=hidden 1=code-entry 2=confirm 3=done
  const [connectCode, setConnectCode] = useState('');
  const [connectGymInfo, setConnectGymInfo] = useState(null);
  const [connectLoading, setConnectLoading] = useState(false);
  const [connectError, setConnectError] = useState('');

  useEffect(() => {
    if (!token) return;
    Promise.all([api.getDisclosures(token), api.getIntake(token), api.getTrainerData(token)])
      .then(([d, i, td]) => {
        setDisclosures(d.disclosures ?? []);
        if (i) {
          setIntake(i);
          setIntakeForm({
            goals: i.goals ?? [],
            experience_level: i.experience_level ?? 'beginner',
            injuries: i.injuries ?? [],
            equipment_access: i.equipment_access ?? [],
            availability_days_per_week: i.availability_days_per_week ?? 3,
          });
        }
        if (td && !td.error && td.gym_id) {
          setIsInGym(true);
          setAllowSwitch(td.allow_trainer_switch !== false);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSwitchConsentToggle(newVal) {
    setAllowSwitch(newVal);
    setSwitchConsentSaving(true);
    try {
      await api.setTrainerSwitchConsent(token, newVal);
    } catch { setAllowSwitch(!newVal); }
    setSwitchConsentSaving(false);
  }

  async function handleLevelChange(gymId, newLevel) {
    if (!token) return;
    setLevelChanging(gymId); setError('');
    try {
      await api.upsertDisclosure(token, gymId, newLevel);
      setDisclosures(prev => prev.map(d => d.gym_id === gymId ? { ...d, level: newLevel } : d));
    } catch (e) {
      setError(e.message ?? 'Update failed');
    } finally { setLevelChanging(null); }
  }

  async function handleUpgradeResponse(gymId, requestId, response) {
    if (!token) return;
    setResponding(true); setError('');
    try {
      await api.respondUpgradeRequest(token, gymId, requestId, response);
      setDisclosures(prev => prev.map(d => d.gym_id === gymId
        ? { ...d, upgrade_request: null, level: response === 'accept' ? (d.upgrade_request?.target_level ?? d.level) : d.level }
        : d
      ));
    } catch (e) {
      setError(e.message ?? 'Failed');
    } finally { setResponding(false); }
  }

  async function handleSaveIntake(e) {
    e.preventDefault();
    if (!token) return;
    setSavingIntake(true); setError('');
    try {
      await api.saveIntake(token, intakeForm);
      setIntake(intakeForm);
      setShowIntake(false);
    } catch (e2) {
      setError(e2.message ?? 'Save failed');
    } finally { setSavingIntake(false); }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
      <div style={{ width: 32, height: 32, border: `2px solid ${C.emerald}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  );

  return (
    <div>
      {/* Pending upgrade requests */}
      {disclosures.filter(d => d.upgrade_request).map(d => (
        <div key={d.gym_id} style={{ marginBottom: 16, padding: 16, borderRadius: 20, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)' }}>
          <p style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.1em', color: '#f59e0b', textTransform: 'uppercase', marginBottom: 4 }}>
            Disclosure upgrade request
          </p>
          <p style={{ fontSize: 14, color: C.text, marginBottom: 2 }}>
            <strong>{d.gym_name ?? d.gym_id}</strong> requests level {d.upgrade_request.target_level}
          </p>
          {d.upgrade_request.reason && (
            <p style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>{d.upgrade_request.reason}</p>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button disabled={responding}
              onClick={() => handleUpgradeResponse(d.gym_id, d.upgrade_request.request_id, 'accept')}
              style={{ flex: 1, padding: '10px 0', borderRadius: 12, background: C.emerald, color: C.bg, fontWeight: 900, fontSize: 13, border: 'none', cursor: 'pointer', opacity: responding ? 0.5 : 1 }}>
              Accept
            </button>
            <button disabled={responding}
              onClick={() => handleUpgradeResponse(d.gym_id, d.upgrade_request.request_id, 'decline')}
              style={{ flex: 1, padding: '10px 0', borderRadius: 12, background: 'transparent', color: '#f59e0b', fontWeight: 700, fontSize: 13, border: '1px solid rgba(245,158,11,0.4)', cursor: 'pointer', opacity: responding ? 0.5 : 1 }}>
              Decline
            </button>
          </div>
        </div>
      ))}

      {/* Connected trainers */}
      {disclosures.length === 0 ? (
        <Glass style={{ padding: 24, textAlign: 'center' }}>
          <p style={{ fontSize: 32, marginBottom: 8 }}>👥</p>
          <p style={{ fontSize: 14, color: C.muted }}>No trainers connected yet.</p>
          <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Your trainer will send you an invite link, or connect via a short code below.</p>
        </Glass>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {disclosures.map(d => (
            <Glass key={d.gym_id} style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{d.gym_name ?? d.gym_id}</p>
                  <p style={{ fontSize: 12, color: C.muted }}>Connected trainer</p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.emerald, background: 'rgba(16,185,129,0.1)', padding: '3px 8px', borderRadius: 8 }}>
                  {LEVEL_LABELS[d.level] ?? d.level}
                </span>
              </div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: C.muted, textTransform: 'uppercase', marginBottom: 8 }}>
                Data sharing level
              </p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {LEVEL_ORDER.map(l => (
                  <button key={l} disabled={levelChanging === d.gym_id}
                    onClick={() => handleLevelChange(d.gym_id, l)}
                    style={{
                      padding: '6px 12px', borderRadius: 10, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
                      background: d.level === l ? C.emerald : C.bgCard,
                      color: d.level === l ? C.bg : C.muted,
                      opacity: levelChanging === d.gym_id ? 0.5 : 1,
                    }}>
                    {l}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: 11, color: C.muted, marginTop: 8, lineHeight: 1.5 }}>
                {d.level === 'L0' && 'Trainer cannot see any personal data.'}
                {d.level === 'L1' && 'Trainer sees your name only.'}
                {d.level === 'L2' && 'Trainer sees name, goals, and progress.'}
                {d.level === 'L3' && 'Trainer can send invoices (billing data shared).'}
                {d.level === 'L4' && 'Full profile including contact details shared.'}
              </p>
            </Glass>
          ))}
        </div>
      )}

      {/* Connect to trainer (Sub-flow C) */}
      {connectStep === 0 && (
        <button onClick={() => { setConnectStep(1); setConnectError(''); setConnectCode(''); setConnectGymInfo(null); }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, color: C.muted, fontWeight: 700, fontSize: 13, cursor: 'pointer', marginBottom: 20, width: '100%' }}>
          <span style={{ fontSize: 16 }}>+</span> Connect to a trainer
        </button>
      )}
      {connectStep === 1 && (
        <div style={{ marginBottom: 20, padding: 20, borderRadius: 20, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}` }}>
          <p style={{ ...eyebrow, fontSize: 9.5, color: C.muted, marginBottom: 12 }}>ENTER TRAINER CODE</p>
          <p style={{ fontSize: 13, color: C.muted, marginBottom: 14, lineHeight: 1.5 }}>
            Ask your trainer for their code (format: FIT-XXXXXX) or paste a full invite link.
          </p>
          <input
            value={connectCode}
            onChange={e => { setConnectCode(e.target.value.trim()); setConnectError(''); }}
            placeholder="FIT-XXXXXX"
            style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: `1px solid ${connectError ? '#f87171' : C.border}`, background: 'rgba(255,255,255,0.06)', color: C.text, fontSize: 16, fontWeight: 700, letterSpacing: '0.05em', outline: 'none', boxSizing: 'border-box', marginBottom: 10, textTransform: 'uppercase' }}
          />
          {connectError && <p style={{ fontSize: 12, color: '#f87171', marginBottom: 10 }}>{connectError}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              disabled={connectLoading || !connectCode}
              onClick={async () => {
                setConnectLoading(true); setConnectError('');
                try {
                  const res = await api.lookupConnect(connectCode);
                  if (res.error) { setConnectError('Code not found — check with your trainer.'); }
                  else { setConnectGymInfo(res); setConnectStep(2); }
                } catch { setConnectError('Could not reach server — try again.'); }
                finally { setConnectLoading(false); }
              }}
              style={{ flex: 1, padding: '12px 0', borderRadius: 12, background: C.emeraldDim, border: `1px solid ${C.emeraldBorder}`, color: C.emerald, fontWeight: 900, fontSize: 13, cursor: (connectLoading || !connectCode) ? 'not-allowed' : 'pointer', opacity: (connectLoading || !connectCode) ? 0.5 : 1 }}>
              {connectLoading ? '…' : 'Look up →'}
            </button>
            <button onClick={() => setConnectStep(0)}
              style={{ padding: '12px 16px', borderRadius: 12, background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
      {connectStep === 2 && connectGymInfo && (
        <div style={{ marginBottom: 20, padding: 20, borderRadius: 20, background: 'rgba(16,185,129,0.05)', border: `1px solid ${C.emeraldBorder}` }}>
          <p style={{ ...eyebrow, fontSize: 9.5, color: C.emerald, marginBottom: 12 }}>CONFIRM CONNECTION</p>
          <p style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>{connectGymInfo.trainer_name}</p>
          <p style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700, marginBottom: 16 }}>{connectGymInfo.gym_name}</p>
          <p style={{ fontSize: 13, color: C.muted, marginBottom: 20, lineHeight: 1.5 }}>
            Your trainer will need to approve this request before they can view your data.
          </p>
          {connectError && <p style={{ fontSize: 12, color: '#f87171', marginBottom: 10 }}>{connectError}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              disabled={connectLoading}
              onClick={async () => {
                setConnectLoading(true); setConnectError('');
                try {
                  const res = await api.connectToTrainer(token, connectCode);
                  if (res.ok || res.error === 'already_connected') setConnectStep(3);
                  else setConnectError(res.error ?? 'Request failed');
                } catch { setConnectError('Could not reach server — try again.'); }
                finally { setConnectLoading(false); }
              }}
              style={{ flex: 1, padding: '12px 0', borderRadius: 12, background: C.emeraldDim, border: `1px solid ${C.emeraldBorder}`, color: C.emerald, fontWeight: 900, fontSize: 13, cursor: connectLoading ? 'not-allowed' : 'pointer', opacity: connectLoading ? 0.5 : 1 }}>
              {connectLoading ? '…' : 'Send request'}
            </button>
            <button onClick={() => { setConnectStep(1); setConnectGymInfo(null); }}
              style={{ padding: '12px 16px', borderRadius: 12, background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              Back
            </button>
          </div>
        </div>
      )}
      {connectStep === 3 && (
        <div style={{ marginBottom: 20, padding: 20, borderRadius: 20, background: 'rgba(16,185,129,0.05)', border: `1px solid ${C.emeraldBorder}`, textAlign: 'center' }}>
          <p style={{ fontSize: 24, marginBottom: 8 }}>✓</p>
          <p style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>Request sent!</p>
          <p style={{ fontSize: 13, color: C.muted, marginBottom: 16, lineHeight: 1.5 }}>Your trainer will approve the connection shortly.</p>
          <button onClick={() => { setConnectStep(0); setConnectCode(''); setConnectGymInfo(null); }}
            style={{ padding: '10px 20px', borderRadius: 12, background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            Done
          </button>
        </div>
      )}

      {/* Intake form */}
      <div style={{ marginTop: 24, marginBottom: 8, fontSize: 10, fontWeight: 900, letterSpacing: '0.15em', color: C.emerald, textTransform: 'uppercase' }}>
        Health Intake
      </div>
      <Glass style={{ padding: 20 }}>
        <p style={{ fontSize: 14, color: C.muted, marginBottom: 12, lineHeight: 1.5 }}>
          {intake ? 'Your intake is on file. Trainers with Level 2+ access can view it.' : 'Complete your health intake so your trainer can personalise your programme.'}
        </p>
        {!showIntake ? (
          <button onClick={() => setShowIntake(true)}
            style={{ width: '100%', padding: '12px 0', borderRadius: 14, background: intake ? 'transparent' : C.emerald, color: intake ? C.text : C.bg, fontWeight: 700, fontSize: 14, border: intake ? `1px solid ${C.border}` : 'none', cursor: 'pointer' }}>
            {intake ? 'Update intake' : 'Complete intake'}
          </button>
        ) : (
          <form onSubmit={handleSaveIntake} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.1em', color: C.muted, textTransform: 'uppercase', marginBottom: 8 }}>Experience level</p>
              <div style={{ display: 'flex', gap: 8 }}>
                {['beginner', 'intermediate', 'advanced'].map(l => (
                  <button key={l} type="button" onClick={() => setIntakeForm(f => ({ ...f, experience_level: l }))}
                    style={{ flex: 1, padding: '8px 0', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      background: intakeForm.experience_level === l ? C.emerald : C.bgCard,
                      color: intakeForm.experience_level === l ? C.bg : C.muted,
                      border: 'none' }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.1em', color: C.muted, textTransform: 'uppercase', marginBottom: 8 }}>
                Sessions per week
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                {[2, 3, 4, 5].map(n => (
                  <button key={n} type="button" onClick={() => setIntakeForm(f => ({ ...f, availability_days_per_week: n }))}
                    style={{ flex: 1, padding: '8px 0', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer',
                      background: intakeForm.availability_days_per_week === n ? C.emerald : C.bgCard,
                      color: intakeForm.availability_days_per_week === n ? C.bg : C.muted,
                      border: 'none' }}>
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {error && <p style={{ color: '#f87171', fontSize: 13 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setShowIntake(false)}
                style={{ flex: 1, padding: '12px 0', borderRadius: 14, border: `1px solid ${C.border}`, background: 'transparent', color: C.muted, fontSize: 14, cursor: 'pointer' }}>
                Cancel
              </button>
              <button type="submit" disabled={savingIntake}
                style={{ flex: 1, padding: '12px 0', borderRadius: 14, background: C.emerald, color: C.bg, fontWeight: 900, fontSize: 14, border: 'none', cursor: 'pointer', opacity: savingIntake ? 0.5 : 1 }}>
                {savingIntake ? '...' : 'Save'}
              </button>
            </div>
          </form>
        )}
      </Glass>

      {error && !showIntake && (
        <p style={{ color: '#f87171', fontSize: 13, marginTop: 12 }}>{error}</p>
      )}

      {/* ── Trainer instellingen (only shown when connected to a gym) ── */}
      {isInGym && (
        <>
          <div style={{ marginTop: 28, marginBottom: 8, fontSize: 10, fontWeight: 900, letterSpacing: '0.15em', color: C.emerald, textTransform: 'uppercase' }}>
            Jouw trainer
          </div>
          <Glass style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>Trainer wissel toestaan</div>
                <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>
                  {allowSwitch
                    ? 'Gym mag jou van trainer wisselen zonder eerst toestemming te vragen.'
                    : 'Je bevestigt elke wisseling zelf voordat deze ingaat.'}
                </div>
              </div>
              <button
                onClick={() => handleSwitchConsentToggle(!allowSwitch)}
                disabled={switchConsentSaving}
                style={{
                  width: 44, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
                  background: allowSwitch ? C.emerald : C.subtle,
                  position: 'relative', flexShrink: 0, transition: 'background 0.2s',
                  opacity: switchConsentSaving ? 0.5 : 1,
                }}
              >
                <span style={{
                  position: 'absolute', top: 3, left: allowSwitch ? 21 : 3,
                  width: 20, height: 20, borderRadius: 10, background: '#fff',
                  transition: 'left 0.2s',
                }} />
              </button>
            </div>
          </Glass>
        </>
      )}
    </div>
  );
}

export default SettingsView;
