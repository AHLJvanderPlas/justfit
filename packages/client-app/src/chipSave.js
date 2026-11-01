// UAT release 5 — chips that save on tap (training days, session length, experience, goal).
// The chip shows the stored value; a tap applies it at once, writes it, and says so for ~1.5 s.
// A write that does not land puts the previous value back and says "Niet opgeslagen".
export const CHIP_SAVED_MS = 1500;
export const CHIP_ERROR_MS = 4000;

/** POST /api/profile answers JSON: {ok:true,…} or {error}. Anything else is not saved. */
export function saveOk(result) {
  return !!result && !result.error && result.ok !== false;
}

/** The line under a chip group: "" | "Saved" | "Not saved — try again" (through the caller's t). */
export function chipStatusText(state, tr = (k) => k) {
  if (state === "saved") return tr("Saved");
  if (state === "error") return tr("Not saved — try again");
  if (state === "saving") return tr("Saving…");
  return "";
}

/**
 * persist() performs the write, revert() puts the previous value back, setStatus gets
 * "saving" | "saved" | "error" | "" . Resolves true when the write landed.
 */
export async function runChipSave({ persist, revert, setStatus, schedule = setTimeout }) {
  setStatus("saving");
  try {
    if (!saveOk(await persist())) throw new Error("not saved");
    setStatus("saved");
    schedule(() => setStatus(""), CHIP_SAVED_MS);
    return true;
  } catch {
    revert();
    setStatus("error");
    schedule(() => setStatus(""), CHIP_ERROR_MS);
    return false;
  }
}
