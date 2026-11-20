// Media 1 — pure helpers for the exercise photos (ExercisePhotos.jsx, ExerciseThumb.jsx).

/** The step's [start, end] photo paths, or null — only same-origin paths, as the server sends them. */
export function stepImages(ex) {
  const imgs = ex?.images;
  return Array.isArray(imgs) && imgs.length >= 2 && imgs.slice(0, 2).every((s) => typeof s === "string" && s.startsWith("/") && !s.startsWith("//"))
    ? imgs.slice(0, 2) : null;
}

// "Foto's verbergen" on the working screen is remembered per device (like the theme), not per
// account: it is about the size of this phone's screen. Until the user chooses, short screens
// (under 640 px tall — an iPhone SE is 568) start with the photos folded away, so the counter,
// the timer's Start and the tap zone stay in reach; taller screens start with them shown.
// Storage can be blocked (private mode, cleared site data): then the default applies.
const KEY = "jf_photos_hidden";
export const SHORT_SCREEN = 640;

export function photosHidden(height = typeof window !== "undefined" ? window.innerHeight : 800) {
  let v = null;
  try { v = localStorage.getItem(KEY); } catch { /* storage blocked */ }
  if (v === "1") return true;
  if (v === "0") return false;
  return height < SHORT_SCREEN;
}

export function setPhotosHidden(on) {
  try { localStorage.setItem(KEY, on ? "1" : "0"); } catch { /* storage blocked */ }
}
