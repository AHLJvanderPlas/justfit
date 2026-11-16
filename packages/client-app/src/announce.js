// One place to say something to a screen reader without moving anything on screen (UX review C,
// finding 8). <Announcer/> (Announcer.jsx, mounted once in main.jsx) owns two visually hidden live
// regions that exist before the first message — a region created together with its text is often
// not announced. Everything else calls announce("…") or announce("…", "assertive").
//
// Timers announce at sensible moments only (timerCues): the start, 10 s, 5 s and the end — never
// every second.
const listeners = new Set();
let seq = 0;

export function announce(message, mode = "polite") {
  if (!message) return;
  seq += 1;
  for (const fn of listeners) fn({ message: String(message), mode, seq });
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Which of the cues {start, ten, five, done} does a countdown reach at `remaining` seconds of `total`? */
export function timerCue(remaining, total) {
  if (remaining === total && total > 0) return "start";
  if (remaining === 10 && total > 10) return "ten";
  if (remaining === 5 && total > 5) return "five";
  if (remaining === 0) return "done";
  return null;
}
