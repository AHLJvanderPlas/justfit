// The wake-lock tip (UX review A, finding 2). When the browser cannot keep the screen on the
// workout shows ONE dismissible line, once per workout and not again that day. It used to be a
// permanent amber strip above the header on every screen.
const KEY_PREFIX = "jf_waketip_";

export function wakeTipDay(now = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}

/** Has the tip been shown/dismissed today? Storage can throw (private mode): then it has not. */
export function wakeTipSeenToday(storage = globalThis.localStorage, now = new Date()) {
  try { return storage?.getItem(KEY_PREFIX + wakeTipDay(now)) === "1"; } catch { return false; }
}

export function markWakeTipSeen(storage = globalThis.localStorage, now = new Date()) {
  try { storage?.setItem(KEY_PREFIX + wakeTipDay(now), "1"); } catch { /* the in-memory state still hides it for this workout */ }
}

/** Only on the first exercise's instruction screen, only while undismissed — never in the header. */
export function wakeTipVisible({ denied, open, phase, exIdx }) {
  return !!denied && !!open && phase === "instruction" && exIdx === 0;
}
