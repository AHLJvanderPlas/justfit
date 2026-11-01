// UAT release 5 — the "Specialistische coaching" card on Today (see coachingCard.js for the rules).
import { useEffect, useState } from "react";
import { t, useLang } from "./i18n.js";
import { useAppShell } from "./AppShellContext.js";
import { coachingCardVisible, readCoachingCard, writeCoachingCard } from "./coachingCard.js";

export default function CoachingCard({ prefs, sessions, onExplore }) {
  useLang();
  const userId = useAppShell()?.userId ?? null;
  const [stored] = useState(() => readCoachingCard(localStorage, userId));   // as it was before this visit
  const [dismissed, setDismissed] = useState(false);
  const visible = !dismissed && coachingCardVisible({ prefs, sessions, stored });
  useEffect(() => {
    // The first visit that really shows the card is its one showing: `stored` stays null for this
    // visit (it is read once), so the card stays up now and is gone on the next one.
    if (visible && stored == null) writeCoachingCard(localStorage, userId, "seen");
  }, [visible, stored, userId]);
  if (!visible) return null;
  const dismiss = () => { writeCoachingCard(localStorage, userId, "dismissed"); setDismissed(true); };
  return (
    <div className="jf-cc">
      <div className="jf-cc__eyebrow">{t("SPECIALIST COACHING")}</div>
      <div className="jf-cc__title">{t("Want a structured training programme?")}</div>
      <div className="jf-cc__body">{t("Add Running, Cycling, or Military coaching as an add-on alongside your current goal.")}</div>
      <div className="jf-cc__actions">
        <button className="jf-cc__go" onClick={() => { dismiss(); onExplore?.(); }}>{t("Explore coaches →")}</button>
        <button className="jf-cc__no" onClick={dismiss}>{t("Not for me")}</button>
      </div>
    </div>
  );
}
