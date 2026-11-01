// Path choice (General / Running / Cycling / Military). Moved out of App.jsx (F4); lazy.
// Since UAT R6 a new account answers this in onboarding's goal step; the modal stays for
// "Wijzig pad" in Settings and for existing users without a primary_intent. Both write
// pathPrefs.js's preferences and share the follow-up form (PathDetails.jsx).
import { useState } from "react";
import api from "./apiClient.js";
import { t, useLang } from "./i18n.js";
import { DEFAULT_PATH_DETAILS, PATH_INTRO, pathLocked, savePath } from "./pathPrefs.js";
import PathDetails from "./PathDetails.jsx";

const START_LABEL = { running: "Start Running Coach →", cycling: "Start Cycling Coach →", military: "Start Military Coach →" };
const TITLE = { running: "RUNNING", cycling: "CYCLING", military: "MILITARY" };

export default function PathChoiceModal({ token, onComplete, isPro, entitlementKnown, onUpgrade }) {
  useLang();
  const [step, setStep] = useState("pick"); // "pick" | "running" | "cycling" | "military"
  const [saving, setSaving] = useState(false);
  const [details, setDetails] = useState(DEFAULT_PATH_DETAILS);

  async function saveAndComplete(intent) {
    setSaving(true);
    try { await savePath(api, token, intent, details); } catch { /* ignore */ }
    setSaving(false);
    onComplete(intent);
  }

  if (step === "pick") {
    const PATHS = [
      { key: "general",  icon: "●", name: t("GENERAL\nFITNESS"), line: t("A coach picks one safe, useful session a day.") },
      { key: "running",  icon: "▲", name: t("RUNNING"),          line: t("Build a runner, not a workout app.") },
      { key: "cycling",  icon: "◆", name: t("CYCLING"),          line: t("Structured sessions, week by week.") },
      { key: "military", icon: "◼", name: t("MILITARY"),         line: t("Keuring or Opleiding. We taper for you.") },
    ];
    return (
      <div className="jf-pathmodal">
        <div className="jf-pathmodal__inner">
          <div className="jf-pathmodal__eyebrow">{t("Welcome to JustFit.")}</div>
          <h1 className="jf-pathmodal__title">{t("PICK YOUR")}<br />{t("TRAINING PATH.")}</h1>
          <p className="jf-pathmodal__lead">
            {t("We coach four kinds of athletes.")}<br />{t("You train with one coach at a time. You can change later.")}
          </p>
          <div className="jf-pathmodal__grid">
            {PATHS.map((p) => {
              const locked = pathLocked(p.key, { isPro, entitlementKnown });
              return (
                <button key={p.key} type="button" className={`jf-pathmodal__tile${locked ? " jf-pathmodal__tile--locked" : ""}`}
                  onClick={() => {
                    if (locked) { onUpgrade?.(); return; }
                    if (p.key === "general") saveAndComplete("general"); else setStep(p.key);
                  }}
                >
                  <span className="jf-pathmodal__icon">{locked ? "🔒" : p.icon}</span>
                  <span className="jf-pathmodal__name">{p.name}</span>
                  <span className="jf-pathmodal__line">{locked ? t("Pro required") : p.line}</span>
                </button>
              );
            })}
          </div>
          <div className="jf-pathmodal__foot">
            {t("Privacy-first. We store only what your coach needs. Export or delete any time in Settings → Privacy.")}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="jf-pathmodal">
      <div className="jf-pathmodal__inner">
        <button type="button" onClick={() => setStep("pick")} className="jf-pathmodal__back">{t("← Back")}</button>
        <h2 className="jf-pathmodal__h2">{t(TITLE[step])}</h2>
        <p className="jf-pathmodal__ask">{t(PATH_INTRO[step])}</p>
        <div className="jf-pathmodal__form">
          <PathDetails path={step} value={details} onChange={setDetails} />
        </div>
        <button type="button" disabled={saving} className="jf-pathmodal__save" onClick={() => saveAndComplete(step)}>
          {saving ? t("Saving…") : t(START_LABEL[step])}
        </button>
      </div>
    </div>
  );
}
