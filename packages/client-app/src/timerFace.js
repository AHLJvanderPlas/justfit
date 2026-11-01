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
