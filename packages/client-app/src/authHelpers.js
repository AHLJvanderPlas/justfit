// Shared auth/session helpers used by App.jsx and SettingsView.jsx.
// Inlining these in each lazy chunk was redundant — a shared module is fine
// because Vite will emit it as a common chunk referenced by both.

export async function logout() {
  // The cookie must be cleared server-side BEFORE we navigate.
  //
  // This was previously fire-and-forget: the request was issued and the page
  // navigated away in the same tick, which aborts it. localStorage was cleared
  // synchronously, so the session cookie could survive with no local user id —
  // and that combination loops forever. login.js sees a valid session and sends
  // you to "/", App.jsx sees no jf_user_id and sends you back to /login.html.
  // In an installed PWA there is no address bar to escape with, and the cookie
  // lives 7 days.
  //
  // keepalive keeps the request alive even if navigation starts early.
  try {
    await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' }),
      keepalive: true,
    });
  } catch { /* offline: login.js clears any session that survived */ }
  ["jf_token", "jf_user_id", "jf_prefs", "jf_accent", "jf_checkin_date"].forEach(k => localStorage.removeItem(k));
  Object.keys(localStorage).filter(k => k.startsWith("jf_completed_") || k.startsWith("jf_bonus_")).forEach(k => localStorage.removeItem(k));
  sessionStorage.clear();
  window.location.href = "/login.html";
}

// Clear the upcoming-plan sessionStorage cache so stale plans don't show after settings change.
export function clearPlanCache() {
  Object.keys(sessionStorage).filter(k => k.startsWith("jf_upcoming")).forEach(k => sessionStorage.removeItem(k));
}
