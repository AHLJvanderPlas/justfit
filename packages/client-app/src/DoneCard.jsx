// Today's done card (UAT release 2, item 4). The UAT counted 17 controls on it:
// six sport chips, six minute chips, "Log it", four bonus chips — all open. Now:
// title, "Goed werk", the consistency score, ONE row "Extra activiteit loggen →"
// that opens the same chips in a sheet, ONE link "Bonussessie →" that reveals the
// minute chips, and the "Eigen training" link. After "Gewoon rusten" the card is
// a rest day: "Rustdag", and no bonus. After "Stop and save": "Gestopt na n van m
// oefeningen". e2e journey-workout (d) counts the buttons (≤ 6).
import { useState } from "react";
import { t, useLang } from "./i18n.js";
import { sessionTitle } from "./messagePolicy.js";
import { Sheet } from "./sessionSheet.jsx";
import { OwnTrainingLine, SaveAsTemplate } from "./EigenTraining.jsx";
import { doneKind } from "./sessionOutcome.js";

const ACTIVITY_TYPES = [
  { label: "Run",   value: "run"   },
  { label: "Walk",  value: "walk"  },
  { label: "Cycle", value: "bike"  },
  { label: "Swim",  value: "mixed" },
  { label: "Sport", value: "mixed" },
  { label: "Other", value: "mixed" },
];
const ACTIVITY_DURATIONS = [15, 20, 30, 45, 60, 90];
const BONUS_MINUTES = [10, 15, 20, 30];

function ActivitySheet({ onClose, onSave }) {
  useLang();
  const [type, setType] = useState(null);
  const [mins, setMins] = useState(null);
  const chip = (on) => `jf-chip jf-chip--tall${on ? " jf-chip--on" : ""}`;
  return (
    <Sheet title={t("Log extra activity")} onClose={onClose} padded>
      <div className="jf-sheet__eyebrow">{t("Activity")}</div>
      <div className="jf-done__chips">
        {ACTIVITY_TYPES.map((a) => (
          <button key={a.label} type="button" className={chip(type?.label === a.label)} aria-pressed={type?.label === a.label} onClick={() => setType(a)}>{t(a.label)}</button>
        ))}
      </div>
      <div className="jf-sheet__eyebrow">{t("Minutes")}</div>
      <div className="jf-done__chips">
        {ACTIVITY_DURATIONS.map((d) => (
          <button key={d} type="button" className={chip(mins === d)} aria-pressed={mins === d} onClick={() => setMins(d)}>{d}m</button>
        ))}
      </div>
      <button type="button" className="jf-mt-btn jf-mt-btn--accent jf-mt-btn--wide jf-done__save" disabled={!type || !mins}
        onClick={() => onSave(type.value, mins)}>
        {t("Log it →")}
      </button>
    </Sheet>
  );
}

export default function DoneCard({ score, prevScore, completedSession, onLogActivity, onBonusSession, bonusDone, onOwnTraining, canSaveTemplate, onTemplateSaved }) {
  useLang();
  const kind = doneKind(completedSession);
  const stop = completedSession?.stopped_after;
  const mins = completedSession?.duration_sec ? Math.round(completedSession.duration_sec / 60) : null;
  const sessionLabel = completedSession?.name ? sessionTitle(completedSession.name) : t("Session");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [bonusOpen, setBonusOpen] = useState(false);
  const [logDone, setLogDone] = useState(false);
  const showBonus = kind !== "rest" && !bonusDone && new Date().getHours() < 23;

  const title = kind === "rest" ? t("Rest day")
    : kind === "stopped" ? t("Stopped after {n} of {m} exercises", { n: stop.exercises_done, m: stop.exercises_total })
    : t("Session Complete");
  const sub = kind === "rest" ? t("Recovery day. Rest is training.") : `${sessionLabel}${mins ? ` · ${mins} min` : ""}`;

  return (
    <div className="jf-done" data-testid="done-card">
      <div className="jf-done__head">
        <div className="jf-done__check" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        </div>
        <div className="jf-done__titles">
          <div className="jf-done__title">{title}</div>
          <div className="jf-done__sub">{sub}</div>
        </div>
      </div>

      <div className="jf-done__praise">{t("Great work. You showed up today.")}</div>
      {score != null && (
        <div className={`jf-done__score${score > prevScore ? " jf-done__score--up" : ""}`}>
          {score > prevScore ? t("Consistency score: {prev} → {score}", { prev: prevScore, score }) : t("Consistency score: {score}", { score })}
        </div>
      )}

      {/* §6 — a session the user wrote, not started from a saved training */}
      {canSaveTemplate && <SaveAsTemplate defaultName={completedSession?.name} steps={completedSession?.own_steps} onSaved={onTemplateSaved} />}

      <div className="jf-done__actions">
        {logDone
          ? <div className="jf-done__logged">✓ {t("Activity logged")}</div>
          : (
            <button type="button" className="jf-done__row" onClick={() => setSheetOpen(true)}>
              <span>{t("Log extra activity")}</span><span aria-hidden="true">→</span>
            </button>
          )}
        {showBonus && (
          <>
            <button type="button" className="jf-done__link" aria-expanded={bonusOpen} onClick={() => setBonusOpen((o) => !o)}>
              {t("Bonus session")} <span aria-hidden="true">→</span>
            </button>
            {bonusOpen && (
              <div className="jf-done__bonus">
                <div className="jf-sheet__eyebrow">{t("Bonus session — minutes?")}</div>
                <div className="jf-done__bonus-chips">
                  {BONUS_MINUTES.map((m) => (
                    <button key={m} type="button" className="jf-done__bonus-chip" onClick={() => onBonusSession(m)}>{m}</button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <OwnTrainingLine whyNot={false} onOwn={onOwnTraining} />

      {sheetOpen && (
        <ActivitySheet onClose={() => setSheetOpen(false)}
          onSave={(type, m) => { onLogActivity(type, m); setLogDone(true); setSheetOpen(false); }} />
      )}
    </div>
  );
}
