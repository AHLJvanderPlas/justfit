// The Today title's size step by its longest word (UAT R6). clamp() shrinks the title with
// the screen; a long Dutch compound ("CARDIOVERBRANDING", 17 letters) also needs a smaller
// step, or it clips at 320 px. Classes in styles.css (.jf-today__title--long / --xlong).
export function titleFitClass(...lines) {
  const longest = Math.max(0, ...lines.filter(Boolean).flatMap((l) => String(l).split(/\s+/)).map((w) => w.length));
  return longest >= 15 ? "jf-today__title--xlong" : longest >= 11 ? "jf-today__title--long" : "";
}
