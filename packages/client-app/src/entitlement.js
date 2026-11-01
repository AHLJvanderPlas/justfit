// Entitlement state for the shell (UAT D5). GET /api/subscribe is the only source
// of "is this user Pro" on the client — preferences.isPro was removed in F8 and the
// planner re-checks server-side anyway. It is fetched at mount, as soon as a
// session exists, independent of the profile: a fresh signup has no profile yet,
// and the path modal it then sees must already know the 14-day trial is Pro.
//
// Resolves to "known" (the answer arrived) or "failed" (network error, 401, a
// body without isPro). Never throws.
export async function loadEntitlement(api, { setIsPro, isProRef, setEarlyBirdRemaining }) {
  try {
    const sub = await api.getSubscription();
    if (sub?.early_bird_remaining != null) setEarlyBirdRemaining?.(sub.early_bird_remaining);
    if (typeof sub?.isPro !== "boolean") return "failed";
    setIsPro(sub.isPro);
    if (isProRef) isProRef.current = sub.isPro;
    return "known";
  } catch {
    return "failed";
  }
}

// The path modal may only open once the entitlement answer is in (or failed), and
// it locks a Pro path only on a KNOWN "not Pro".
export const entitlementSettled = (state) => state === "known" || state === "failed";
