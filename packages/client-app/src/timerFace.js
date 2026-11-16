// What a timed set's countdown shows (UAT release 6, D9).
//
// Before Start the clock reads the set's duration in a neutral colour — it used to
// read the previous timer's "0:00" in red, which looks like a failure before anything
// has happened. The emerald → amber → red ramp applies only while the clock runs.
export function timerFace({ running, remaining, total }) {
  const seconds = running ? Math.max(0, remaining) : Math.max(0, total ?? 0);
  const tone = !running ? "idle" : remaining <= 5 ? "danger" : remaining <= 10 ? "warn" : "run";
  return { seconds, text: `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`, tone };
}

// What "Set afronden" records for the current set. A timed set records seconds: the
// time on the clock when it runs, the prescribed duration when the user held it without
// starting the clock (it used to record the rep counter — always 0 — which is where
// "1 set × 0s" in Deze week came from). Everything else records the rep counter.
export function finishedSetValue({ timeBased, running, remaining, total, repCount }) {
  if (!timeBased) return repCount;
  const t = Math.max(0, total ?? 0);
  return running ? Math.max(0, Math.min(t, t - Math.max(0, remaining ?? 0))) : t;
}
