/**
 * errorReporter.js — lightweight client-side error reporting.
 *
 * Fire-and-forget. Non-blocking. Deduplicates within the session so the same
 * failure only produces one report event (prevents log floods on retry loops).
 *
 * Reports are sent via /api/feedback when a token is available, otherwise
 * logged to console as a structured payload.
 */

const _reported = new Set();

/**
 * Report a critical client-side failure.
 * @param {'plan_generation'|'auth_failure'|string} type  - failure category
 * @param {string} detail                                 - human-readable context
 * @param {string|null} [token]                           - JWT for authenticated reports
 */
export function reportError(type, detail, token = null) {
  const key = `${type}:${detail}`;
  if (_reported.has(key)) return; // dedupe within session
  _reported.add(key);

  const payload = {
    type,
    detail,
    url: window.location.pathname,
    ts: new Date().toISOString(),
  };

  if (token) {
    // Send via existing feedback channel — fire-and-forget
    fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        type,
        detail,
        text: `[CLIENT ERROR] ${type}: ${detail}`,
      }),
    }).catch(() => {});
  } else {
    // No token available — structured console output for Cloudflare log tailing
    console.error('[JustFit]', JSON.stringify(payload));
  }
}
