// "Hoe voel je je?" on Today — the day's check-in in one tap (UAT R6). A tap sends the
// sheet's "mood → Toepassen" payload (checkinQuick.js); "Meer vertellen" opens the sheet
// for the detailed signals (pain, sleep, energy, time, location).
import { useState } from "react";
import { t } from "./i18n.js";
import { MOOD_OPTIONS } from "./checkinQuick.js";

function Face({ size, mouth }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="20" cy="20" r="17" />
      <circle cx="13" cy="16" r="2" fill="currentColor" stroke="none" />
      <circle cx="27" cy="16" r="2" fill="currentColor" stroke="none" />
      {mouth}
    </svg>
  );
}
export function SadFace({ size = 44 }) { return <Face size={size} mouth={<path d="M 11 28 Q 20 21 29 28" />} />; }
export function NeutralFace({ size = 44 }) { return <Face size={size} mouth={<line x1="13" y1="26" x2="27" y2="26" />} />; }
export function HappyFace({ size = 44 }) { return <Face size={size} mouth={<path d="M 11 24 Q 20 33 29 24" />} />; }
const FACES = { 1: SadFace, 2: NeutralFace, 3: HappyFace };

export default function MoodRow({ onPick, onMore }) {
  const [busy, setBusy] = useState(false);
  return (
    <section className="jf-mood" aria-labelledby="jf-mood-q" data-testid="mood-row">
      <div className="jf-mood__q" id="jf-mood-q">{t("How are you feeling?")}</div>
      <div className="jf-mood__row">
        {MOOD_OPTIONS.map(({ val, label }) => {
          const MoodFace = FACES[val];
          return (
            <button key={val} type="button" disabled={busy} className={`jf-mood__btn jf-mood__btn--${val}`}
              onClick={() => { setBusy(true); onPick(val); }}>
              <MoodFace size={28} />
              <span>{t(label)}</span>
            </button>
          );
        })}
      </div>
      {onMore && (
        <button type="button" className="jf-mood__more" onClick={onMore}>
          {t("Pain, poor sleep or short on time?")} <span className="jf-mood__more-cta">{t("Tell more →")}</span>
        </button>
      )}
    </section>
  );
}
