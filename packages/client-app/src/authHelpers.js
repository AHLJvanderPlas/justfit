// Shared auth/session helpers used by App.jsx and SettingsView.jsx.
// Inlining these in each lazy chunk was redundant — a shared module is fine
// because Vite will emit it as a common chunk referenced by both.

export function logout() {
  // Clear HttpOnly session cookie server-side, then clear localStorage.
  fetch('/api/auth', { method: 'POST', body: JSON.stringify({ action: 'logout' }),
    headers: { 'Content-Type': 'application/json' } }).catch(() => {});
  ["jf_token", "jf_user_id", "jf_prefs", "jf_accent", "jf_checkin_date"].forEach(k => localStorage.removeItem(k));
  Object.keys(localStorage).filter(k => k.startsWith("jf_completed_") || k.startsWith("jf_bonus_")).forEach(k => localStorage.removeItem(k));
  sessionStorage.clear();
  window.location.href = "/login.html";
}

// Clear the upcoming-plan sessionStorage cache so stale plans don't show after settings change.
export function clearPlanCache() {
  Object.keys(sessionStorage).filter(k => k.startsWith("jf_upcoming")).forEach(k => sessionStorage.removeItem(k));
}
