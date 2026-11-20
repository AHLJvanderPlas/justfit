// Media 1 — pure helpers for the exercise photos (ExercisePhotos.jsx, ExerciseThumb.jsx).

/** The step's [start, end] photo paths, or null — only same-origin paths, as the server sends them. */
export function stepImages(ex) {
  const imgs = ex?.images;
  return Array.isArray(imgs) && imgs.length >= 2 && imgs.slice(0, 2).every((s) => typeof s === "string" && s.startsWith("/") && !s.startsWith("//"))
    ? imgs.slice(0, 2) : null;
}

// "Foto's verbergen" on the working screen is remembered per device (like the theme),
// not per account: it is about the size of this phone's screen. Storage can be blocked
// (private mode, cleared site data): then photos simply show.
const KEY = "jf_photos_hidden";

export function photosHidden() {
  try { return localStorage.getItem(KEY) === "1"; } catch { return false; }
}

export function setPhotosHidden(on) {
  try { if (on) localStorage.setItem(KEY, "1"); else localStorage.removeItem(KEY); } catch { /* storage blocked */ }
}
