// Media 1 — the exercise's two photos (start and end position) as a slow cross-fade.
//
// CSS does the loop (.jf-photos*, styles.css): the end frame fades in and out over the start
// frame, ~1.2 s each. Tapping the photos pauses / resumes. Under prefers-reduced-motion the two
// frames stand side by side and nothing moves. A fixed 3:2 stage, lazy images and a light
// neutral backdrop (the photos are shot on light and gym backgrounds) so nothing jumps and the
// card reads the same in dark and light theme. If either image fails to load the component
// renders nothing and the screen is what it was before photos existed.
//
// `compact` is the working screen: a smaller stage and a "Foto's verbergen / tonen" toggle that
// is remembered per device (mediaUi.js), so the tap zone stays in reach on small phones.
import { useState } from "react";
import { t, exerciseName } from "./i18n.js";
import { stepImages, photosHidden, setPhotosHidden } from "./mediaUi.js";

export default function ExercisePhotos({ ex, compact = false }) {
  const imgs = stepImages(ex);
  const [failed, setFailed] = useState(false);
  const [paused, setPaused] = useState(false);
  const [hidden, setHidden] = useState(() => compact && photosHidden());
  if (!imgs || failed) return null;
  const name = exerciseName(ex);
  const toggle = () => { const next = !hidden; setHidden(next); setPhotosHidden(next); };
  return (
    <div className={`jf-photos${compact ? " jf-photos--compact" : ""}`} data-testid="exercise-photos">
      {!hidden && (
        <div className={`jf-photos__stage${paused ? " jf-photos__stage--paused" : ""}`}>
          {imgs.map((src, i) => (
            <figure key={src} className={`jf-photos__frame jf-photos__frame--${i}`}>
              <img className="jf-photos__img" src={src} loading="lazy" decoding="async" width="640" height="427"
                alt={t("{name} — {position}", { name, position: i === 0 ? t("start position") : t("end position") })}
                onError={() => setFailed(true)} />
              <figcaption className="jf-photos__cap">{i === 0 ? t("Start") : t("End")}</figcaption>
            </figure>
          ))}
          <button type="button" className="jf-photos__tap" aria-pressed={paused}
            aria-label={paused ? t("Play the photos") : t("Pause the photos")} onClick={() => setPaused((p) => !p)} />
        </div>
      )}
      {compact && (
        <button type="button" className="jf-photos__toggle" aria-expanded={!hidden} onClick={toggle}>
          {hidden ? t("Show photos") : t("Hide photos")}
        </button>
      )}
    </div>
  );
}
