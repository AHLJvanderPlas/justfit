// Apply a path choice the moment PathChoiceModal has saved it (UAT D3).
//
// The modal writes primary_intent and the coach prefs (run_coach, cycling_coach,
// military_coach …) to the server. Before this, the shell only closed the modal
// and set primary_intent locally: the coach prefs never reached client state and
// today's plan stayed the one built for the OLD path — no coach card, a generic
// session, and Settings showing the old goal — until the next app load.
//
// Sequence: close the modal, refetch the profile and take its preferences (the
// server's copy is the truth), then regenerate today's plan once with
// path_change: true — exempt from the free daily cap (decideExistingPlan reason
// path_change), never replacing a user-authored session.
export async function applyPathChoice(intent, { api, userId, today, isPro, setShowPathChoice, setPrefs, setPlan, setPlanError, setIsGenerating }) {
  setShowPathChoice(false);
  setPrefs((p) => ({ ...p, preferences: { ...(p.preferences ?? {}), primary_intent: intent } }));
  try {
    const fresh = await api.getProfile();
    if (fresh?.preferences) setPrefs((p) => ({ ...p, preferences: fresh.preferences }));
  } catch { /* keep the optimistic intent; the next load corrects it */ }
  if (!userId) return null;
  setIsGenerating(true);
  try {
    const plan = await api.generatePlan(userId, today, null, undefined, isPro, { pathChange: true });
    setPlan(plan); setPlanError(null);
    return plan;
  } catch {
    return null;   // today's existing plan stays on screen
  } finally {
    setIsGenerating(false);
  }
}
