// Media 1 — "Oefening automatisch voorlezen": per device, off by default (like the theme and the
// photo toggle — it is about this phone's speaker and voices, not the account). Blocked storage = off.
const KEY = "jf_read_aloud_auto";

export function autoReadOn() {
  try { return localStorage.getItem(KEY) === "1"; } catch { return false; }
}

export function setAutoRead(on) {
  try { if (on) localStorage.setItem(KEY, "1"); else localStorage.removeItem(KEY); } catch { /* storage blocked */ }
}
