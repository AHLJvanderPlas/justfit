// Media 1 — the start photo as a small rounded thumbnail in exercise lists. Decorative (alt=""):
// the exercise name sits right next to it. Without photos, or when the image fails, it renders
// `fallback` — the stick figure where a list had one, nothing where it did not.
import { useState } from "react";
import { stepImages } from "./mediaUi.js";

export default function ExerciseThumb({ ex, fallback = null }) {
  const imgs = stepImages(ex);
  const [failed, setFailed] = useState(false);
  if (!imgs || failed) return fallback;
  return <img className="jf-thumb" src={imgs[0]} alt="" loading="lazy" decoding="async" width="44" height="44" onError={() => setFailed(true)} />;
}
