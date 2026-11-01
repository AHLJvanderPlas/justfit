// First-run / re-do onboarding. Moved out of App.jsx (F4); lazy — shown once.
//
// UAT R6 — folded: the goal is asked once. The goal step's first row is the five general
// goals (path Algemeen), its second row the sport paths (Hardlopen / Fietsen / Militair)
// with their short follow-up; experience joins "About you", sports join "Equipment & time".
// A goal tap answers the step. The path is saved exactly as PathChoiceModal saves it
// (pathPrefs.js), so the modal does not reappear after onboarding.
import { useState } from "react";
import { t, useLang } from "./i18n.js";
import { EXPERIENCE, EQUIPMENT_OPTIONS, ONBOARDING_SPORTS, SEX_OPTIONS, CYCLE_LENGTHS } from "./appConstants.js";
import api from "./apiClient.js";
import { DEFAULT_PATH_DETAILS, PATH_INTRO, onboardingPathToSave, onboardingSteps, pathLocked, savePath } from "./pathPrefs.js";
import PathDetails from "./PathDetails.jsx";

// Default last period ≈ 4 weeks ago
function defaultPeriodDate() {
  const d = new Date();
  d.setDate(d.getDate() - 28);
  return d.toISOString().split("T")[0];
}

const ic = (inner) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{inner}</svg>
);
const GOALS = [
  { value: "fat_loss", label: "Lose weight & feel better", sub: "Burn fat, build energy", icon: ic(<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>) },
  { value: "strength", label: "Build strength & muscle", sub: "Get stronger week by week", icon: ic(<><path d="M6 4v6a6 6 0 0 0 12 0V4"/><line x1="4" y1="4" x2="20" y2="4"/></>) },
  { value: "health", label: "Improve overall fitness", sub: "More stamina, more capacity", icon: ic(<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>) },
  { value: "mobility", label: "Boost energy & manage stress", sub: "Consistent movement, calmer mind", icon: ic(<><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></>) },
  { value: "pregnancy", label: "Stay active during/after pregnancy", sub: "Safe movement for every phase", icon: ic(<><circle cx="12" cy="6" r="3"/><path d="M9 13c-2 .5-4 2-4 4v1h14v-1c0-2-2-3.5-4-4"/><path d="M12 13v5"/></>) },
];
const PATH_CARDS = [
  { key: "running", icon: "▲", name: "Running", line: "Build up to a distance" },
  { key: "cycling", icon: "◆", name: "Cycling", line: "Structured rides" },
  { key: "military", icon: "◼", name: "Military", line: "Keuring or Opleiding" },
];
const DURATION_OPTIONS = [15, 20, 30, 45, 60, 90, 120, 999];
const durationLabel = (d) => (d === 999 ? "∞" : d === 60 ? t("1h") : d === 90 ? t("1.5h") : d === 120 ? t("2h") : `${d}m`);
const moon = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;

export default function OnboardingModal({ token, prefs, onComplete, onBack, isPro, entitlementKnown }) {
  useLang();
  const p = prefs ?? {};
  const pp = p.preferences ?? {};
  const existingIntent = pp.primary_intent ?? null;
  const [idx, setIdx] = useState(0);
  const [displayName, setDisplayName] = useState(pp.display_name ?? "");
  const [sex, setSex] = useState(p.sex ?? null);
  const [weightInput, setWeightInput] = useState(p.weight_kg ? String(p.weight_kg) : "");
  const [weightUnit, setWeightUnit] = useState("kg");
  const [heightInput, setHeightInput] = useState(p.height_cm ? String(p.height_cm) : "");
  const [heightUnit, setHeightUnit] = useState("cm");
  const [showCycleSetup, setShowCycleSetup] = useState(false);
  const [lastPeriodStart, setLastPeriodStart] = useState(defaultPeriodDate());
  const [cycleLength, setCycleLength] = useState(28);
  const [cycleTrackingMode, setCycleTrackingMode] = useState(null);
  const [cycleSetupDone, setCycleSetupDone] = useState(false);
  const [goal, setGoal] = useState(p.training_goal ?? "health");
  const [isPregnancyGoal, setIsPregnancyGoal] = useState(false);
  const [pathKey, setPathKey] = useState(existingIntent ?? "general");
  const [pathTouched, setPathTouched] = useState(false);
  const [pathDetails, setPathDetails] = useState(DEFAULT_PATH_DETAILS);
  const [lockNote, setLockNote] = useState(false);
  const [experience, setExperience] = useState(p.experience_level ?? "beginner");
  const [equipment, setEquipment] = useState(pp.available_equipment ?? ["none"]);
  const [duration, setDuration] = useState(p.session_duration_min ?? 45);
  const [sports, setSports] = useState((pp.sport_prefs?.sports) ?? []);
  const [saving, setSaving] = useState(false);

  const steps = onboardingSteps(pathKey, pathTouched);
  const stepId = steps[Math.min(idx, steps.length - 1)];
  const isLast = idx >= steps.length - 1;
  const next = () => { if (isLast) handleFinish(); else setIdx(idx + 1); };
  // A goal tap answers the goal step; a sport path opens its follow-up. Both move on.
  const pickGoal = (value) => {
    setIsPregnancyGoal(value === "pregnancy");
    setGoal(value === "pregnancy" ? "health" : value);
    setPathKey("general"); setPathTouched(true); setLockNote(false);
    setIdx(idx + 1);
  };
  const pickPath = (key) => {
    if (pathLocked(key, { isPro, entitlementKnown })) { setLockNote(true); return; }
    setPathKey(key); setPathTouched(true); setLockNote(false);
    setIdx(idx + 1);
  };

  const toggleEquip = (val) => {
    if (val === "none") setEquipment(["none"]);
    else setEquipment((prev) => {
      const without = prev.filter((e) => e !== "none");
      return without.includes(val) ? without.filter((e) => e !== val) : [...without, val];
    });
  };

  const handleFinish = async () => {
    setSaving(true);
    let savedIntent = null;
    try {
      let weight_kg;
      if (weightInput) {
        const w = parseFloat(weightInput);
        if (!isNaN(w)) weight_kg = weightUnit === "lbs" ? Math.round(w * 0.453592 * 10) / 10 : w;
      }
      let height_cm;
      if (heightInput) {
        const h = parseFloat(heightInput);
        if (!isNaN(h)) height_cm = heightUnit === "in" ? Math.round(h * 2.54 * 10) / 10 : h;
      }
      const cycle = (sex === "female" && cycleTrackingMode === "smart")
        ? { tracking_mode: "smart", cycle_length_days: cycleLength, last_period_start: lastPeriodStart }
        : { tracking_mode: "off" };
      const prefPayload = { available_equipment: equipment };
      if (displayName.trim()) prefPayload.display_name = displayName.trim();
      if (sports.length > 0) prefPayload.sport_prefs = { sports, primary: sports[0] };
      const profilePayload = {
        training_goal: goal, experience_level: experience, session_duration_min: duration,
        days_per_week_target: 3, preferences: prefPayload, sex, cycle,
      };
      // Only include body metrics if the user provided values (avoids overwriting with null)
      if (weight_kg !== undefined) profilePayload.weight_kg = weight_kg;
      if (height_cm !== undefined) profilePayload.height_cm = height_cm;
      await api.saveProfile(token, profilePayload);
      // Second, the path — the same call PathChoiceModal makes, after the profile as before.
      const intent = onboardingPathToSave({ existingIntent, pathKey, touched: pathTouched });
      if (intent) savedIntent = await savePath(api, token, intent, pathDetails);
      onComplete({ training_goal: goal, experience_level: experience, session_duration_min: duration, sex, weight_kg, height_cm, preferences: prefPayload, intent: savedIntent });
    } catch (e) {
      console.error("Failed to save profile:", e);
      onComplete({ intent: savedIntent });
    }
    setSaving(false);
  };

  const opt = (on) => `jf-ob__opt${on ? " jf-ob__opt--on" : ""}`;

  return (
    <div className="jf-ob">
      <div className="jf-ob__card">
        <div className="jf-ob__progress"><progress className="jf-ob__bar" max={steps.length - 1} value={idx} aria-hidden="true" /></div>
        <div className="jf-ob__body">
          {idx > 0 && <div className="jf-ob__step">{t("Step {n} of {total}", { n: idx, total: steps.length - 1 })}</div>}

          {stepId === "waiver" && (
            <>
              <div className="jf-ob__badge" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              </div>
              <h2 className="jf-ob__title">{t("Health & Safety")}</h2>
              <p className="jf-ob__lead">{t("JustFit.cc provides general fitness guidance for healthy adults. By continuing you confirm:")}</p>
              <ul className="jf-ob__list">
                {["You are 16 years or older", "You have no medical conditions that prevent exercise",
                  "JustFit.cc is not a medical app and does not provide medical advice",
                  "You accept responsibility for your own physical safety", "You will consult a doctor before starting if in doubt",
                ].map((item) => (
                  <li key={item} className="jf-ob__li"><span className="jf-ob__tick" aria-hidden="true">✓</span><span>{t(item)}</span></li>
                ))}
              </ul>
              <p className="jf-ob__fine">{t("Your fitness data is not sold or shared. EU/GDPR compliant.")}</p>
            </>
          )}

          {stepId === "goal" && (
            <>
              <h2 className="jf-ob__title">{t("What's your primary goal?")}</h2>
              <p className="jf-ob__lead">{t("Your plan adapts around this every day.")}</p>
              <div className="jf-ob__goals">
                {GOALS.map((g) => {
                  const on = pathKey === "general" && (g.value === "pregnancy" ? isPregnancyGoal : (!isPregnancyGoal && goal === g.value));
                  return (
                    <button key={g.value} type="button" data-goal={g.value} aria-pressed={on} className={`jf-ob__goal${on ? " jf-ob__goal--on" : ""}`} onClick={() => pickGoal(g.value)}>
                      <span className="jf-ob__goal-icon">{g.icon}</span>
                      <span>
                        <span className="jf-ob__goal-title">{t(g.label)}</span>
                        <span className="jf-ob__goal-sub">{t(g.sub)}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="jf-ob__label jf-ob__label--gap">{t("Or train for a sport")}</div>
              <div className="jf-ob__paths">
                {PATH_CARDS.map((c) => {
                  const locked = pathLocked(c.key, { isPro, entitlementKnown });
                  const on = pathKey === c.key;
                  return (
                    <button key={c.key} type="button" data-path={c.key} aria-pressed={on}
                      className={`jf-ob__path${on ? " jf-ob__path--on" : ""}${locked ? " jf-ob__path--locked" : ""}`} onClick={() => pickPath(c.key)}>
                      <span className="jf-ob__path-icon" aria-hidden="true">{locked ? "🔒" : c.icon}</span>
                      <span className="jf-ob__path-name">{t(c.name)}</span>
                      <span className="jf-ob__path-line">{locked ? t("Pro required") : t(c.line)}</span>
                    </button>
                  );
                })}
              </div>
              {lockNote && <p className="jf-ob__note" role="status">{t("Cycling is part of Pro. Pick another goal now — you can switch later in Settings → Goal & coach.")}</p>}
            </>
          )}

          {stepId === "path" && (
            <>
              <h2 className="jf-ob__title">{t(PATH_CARDS.find((c) => c.key === pathKey)?.name ?? "")}</h2>
              <p className="jf-ob__lead">{t(PATH_INTRO[pathKey])}</p>
              <PathDetails path={pathKey} value={pathDetails} onChange={setPathDetails} />
            </>
          )}

          {stepId === "about" && (
            <>
              <h2 className="jf-ob__title">{t("About you")}</h2>
              <p className="jf-ob__lead">{t("This helps us personalise your training baseline.")}</p>
              {isPregnancyGoal && <p className="jf-ob__note">{t("You'll complete pregnancy setup in Settings after onboarding.")}</p>}

              <label className="jf-ob__label" htmlFor="jf-ob-name">{t("Your name")} <span className="jf-ob__opt-hint">{t("(optional)")}</span></label>
              <input id="jf-ob-name" type="text" className="jf-ob__input jf-ob__input--full" placeholder={t("What should we call you?")}
                value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={50} />

              <div className="jf-ob__label">{t("How do you identify?")}</div>
              <div className="jf-ob__grid2">
                {SEX_OPTIONS.map((o) => (
                  <button key={o.value} type="button" aria-pressed={sex === o.value} className={opt(sex === o.value)}
                    onClick={() => { setSex(o.value); if (o.value !== "female") { setCycleSetupDone(false); setShowCycleSetup(false); } }}>{t(o.label)}</button>
                ))}
              </div>

              <div className="jf-ob__label">{t("Experience level?")}</div>
              <div className="jf-ob__stack">
                {EXPERIENCE.map((e) => (
                  <button key={e.value} type="button" aria-pressed={experience === e.value} className={`${opt(experience === e.value)} jf-ob__opt--row`} onClick={() => setExperience(e.value)}>
                    <span className="jf-ob__opt-title">{t(e.label)}</span>
                    <span className="jf-ob__opt-sub">{t(e.sub)}</span>
                  </button>
                ))}
              </div>

              <div className="jf-ob__label">{t("Your weight")} <span className="jf-ob__opt-hint">{t("(optional)")}</span></div>
              <div className="jf-ob__hint">{t("Helps us scale exercise volume to your body.")}</div>
              <div className="jf-ob__measure">
                <input type="number" inputMode="decimal" className="jf-ob__input" placeholder="—" aria-label={t("Your weight")} value={weightInput} onChange={(e) => setWeightInput(e.target.value)} />
                <button type="button" className="jf-ob__unit" onClick={() => setWeightUnit((u) => (u === "kg" ? "lbs" : "kg"))}>{weightUnit}</button>
              </div>

              <div className="jf-ob__label">{t("Your height")} <span className="jf-ob__opt-hint">{t("(optional)")}</span></div>
              <div className="jf-ob__hint">{t("Used to calculate BMI and adapt intensity guidance.")}</div>
              <div className="jf-ob__measure">
                <input type="number" inputMode="decimal" className="jf-ob__input" placeholder="—" aria-label={t("Your height")} value={heightInput} onChange={(e) => setHeightInput(e.target.value)} />
                <button type="button" className="jf-ob__unit" onClick={() => setHeightUnit((u) => (u === "cm" ? "in" : "cm"))}>{heightUnit}</button>
              </div>

              {sex === "female" && !cycleSetupDone && (
                <div className="jf-ob__cycle">
                  {!showCycleSetup ? (
                    <>
                      <div className="jf-ob__cycle-title">{moon}{t("Train with your natural rhythm")}</div>
                      <p className="jf-ob__cycle-text">{t("Your body has incredible wisdom. JustFit can adapt your sessions across your cycle — lighter when you need rest, and ready to push when you're at your strongest.")}</p>
                      <div className="jf-ob__row">
                        <button type="button" className="jf-ob__btn jf-ob__btn--soft jf-ob__btn--grow2" onClick={() => setShowCycleSetup(true)}>{t("Set up cycle tracking")}</button>
                        <button type="button" className="jf-ob__btn jf-ob__btn--ghost" onClick={() => { setCycleTrackingMode("off"); setCycleSetupDone(true); }}>{t("Maybe later")}</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="jf-ob__cycle-title">{moon}{t("Set up cycle tracking")}</div>
                      <div className="jf-ob__hint">{t("When did your last period start?")}</div>
                      <input type="date" className="jf-ob__input jf-ob__input--full" value={lastPeriodStart} max={new Date().toISOString().split("T")[0]} onChange={(e) => setLastPeriodStart(e.target.value)} />
                      <div className="jf-ob__hint">{t("How long is your typical cycle?")}</div>
                      <div className="jf-ob__chips">
                        {CYCLE_LENGTHS.map((d) => (
                          <button key={d} type="button" aria-pressed={cycleLength === d} className={`jf-ob__chip${cycleLength === d ? " jf-ob__chip--on" : ""}`} onClick={() => setCycleLength(d)}>{d}d</button>
                        ))}
                      </div>
                      <p className="jf-ob__fine">{t("Every body is different — these can be updated anytime in Settings.")}</p>
                      <div className="jf-ob__row">
                        <button type="button" className="jf-ob__btn jf-ob__btn--solid jf-ob__btn--grow2" onClick={() => { if (lastPeriodStart) { setCycleTrackingMode("smart"); setCycleSetupDone(true); } }}>{t("Save")}</button>
                        <button type="button" className="jf-ob__btn jf-ob__btn--ghost" onClick={() => { setCycleTrackingMode("off"); setCycleSetupDone(true); }}>{t("Skip")}</button>
                      </div>
                    </>
                  )}
                </div>
              )}
              {sex === "female" && cycleSetupDone && (
                <div className="jf-ob__done">{cycleTrackingMode === "smart" ? t("✓ Cycle tracking enabled") : t("Cycle tracking skipped — enable anytime in Settings.")}</div>
              )}
            </>
          )}

          {stepId === "setup" && (
            <>
              <h2 className="jf-ob__title">{t("Equipment & time?")}</h2>
              <p className="jf-ob__lead">{t("Your default session setup.")}</p>
              <div className="jf-ob__label">{t("Available equipment")}</div>
              <div className="jf-ob__stack">
                {EQUIPMENT_OPTIONS.map((eq) => (
                  <button key={eq.value} type="button" aria-pressed={equipment.includes(eq.value)} className={`${opt(equipment.includes(eq.value))} jf-ob__opt--split`} onClick={() => toggleEquip(eq.value)}>
                    <span>{t(eq.label)}</span>
                    <span className="jf-ob__opt-sub">{t(eq.sub)}</span>
                  </button>
                ))}
              </div>
              <div className="jf-ob__label">{t("Default session length")}</div>
              <div className="jf-ob__times">
                {DURATION_OPTIONS.map((d) => (
                  <button key={d} type="button" aria-pressed={duration === d} className={`jf-ob__time${duration === d ? " jf-ob__time--on" : ""}`} onClick={() => setDuration(d)}>{durationLabel(d)}</button>
                ))}
              </div>
              <div className="jf-ob__label">{t("Any sports you play?")} <span className="jf-ob__opt-hint">{t("(optional)")}</span></div>
              <div className="jf-ob__chips">
                {ONBOARDING_SPORTS.map((s) => {
                  const active = sports.includes(s.id);
                  return (
                    <button key={s.id} type="button" aria-pressed={active} className={`jf-ob__chip${active ? " jf-ob__chip--on" : ""}`}
                      onClick={() => setSports((prev) => (prev.includes(s.id) ? prev.filter((x) => x !== s.id) : [...prev, s.id]))}>
                      {t(s.label)}
                      {active && sports[0] === s.id && <span className="jf-ob__primary">{t("Primary")}</span>}
                    </button>
                  );
                })}
              </div>
              {sports.length > 0 && <p className="jf-ob__fine">{t("First tap = primary sport. The planner fills the gaps it doesn't cover.")}</p>}
            </>
          )}
        </div>

        <div className="jf-ob__foot">
          <div className="jf-ob__row">
            <button type="button" className="jf-ob__btn jf-ob__btn--ghost" onClick={idx === 0 ? onBack : () => setIdx(idx - 1)}>
              {idx === 0 ? t("← Log out") : t("Back")}
            </button>
            <button type="button" className="jf-ob__btn jf-ob__btn--main" disabled={saving} onClick={next}>
              {idx === 0 ? t("I Agree — Continue") : saving ? t("Saving...") : isLast ? t("Start Training") : t("Continue")}
            </button>
          </div>
          {idx > 0 && (
            <button type="button" className="jf-ob__skip" onClick={next}>{t("Skip this step")}</button>
          )}
        </div>
      </div>
    </div>
  );
}
