# C-B7: HttpOnly Cookie Auth Migration

> Status: Implementing 2026-06-18

## Problem

The JWT session token is stored in `localStorage` (`jf_token`). It is accessible to JavaScript, which means an XSS vulnerability in any first-party JS would expose the session token. The trainer portal (T-B6, 2026-05-22) already migrated to HttpOnly cookies. This doc describes the same migration for the consumer app.

## Current State

```
Login response:   { ok: true, token, userId, memberships }
Client stores:    localStorage.jf_token, localStorage.jf_user_id
API call header:  Authorization: Bearer <token>
Server reads:     functions/api/_shared/auth.js → Authorization header only
Logout:           Client removes localStorage keys, redirects to /login.html
```

## Target State

```
Login response:   { ok: true, userId, memberships } + Set-Cookie: __Host-jf_session
Client stores:    jf_user_id only in localStorage (token no longer stored)
API call header:  Cookie header (automatic) — no explicit Authorization header
Server reads:     Cookie __Host-jf_session OR Authorization Bearer (grace period)
Logout:           POST /api/auth { action: logout } clears cookie + client clears localStorage
```

## Cookie Spec

```
Name:     __Host-jf_session
Value:    <JWT>
Path:     /
Secure:   yes (required by __Host- prefix)
HttpOnly: yes
SameSite: Strict
Max-Age:  604800  (7 days, matches JWT expiry)
```

The `__Host-` prefix enforces `Secure`, `Path=/`, and no `Domain` attribute — prevents subdomain injection. Same approach used by trainer portal (`__Host-jft_trainer`).

## Grace Period (30 days)

`getUser()` tries cookie FIRST, then falls back to `Authorization: Bearer`. During the grace period:
- New logins receive the cookie + keep `token` in JSON response (client still stores in localStorage)
- Existing sessions that don't have a cookie still work via Bearer
- After grace period: remove `token` from login response JSON and Bearer fallback from `getUser()`

## Files to Change

### Back-end

**`functions/api/_shared/auth.js`** — `getUser()` fallback
```js
// After trying Authorization header:
if (!token) {
  const cookie = request.headers.get('Cookie') ?? '';
  const m = cookie.match(/(?:^|;\s*)__Host-jf_session=([^;]+)/);
  if (m) token = decodeURIComponent(m[1]);
}
```

**`functions/api/auth.js`** — set cookie on all auth success paths
- `handleLogin` → add Set-Cookie on successful response
- `handleSignup` → add Set-Cookie on successful response
- `handleMagicVerify` → add Set-Cookie on successful response
- `handlePasskeyComplete` → add Set-Cookie on successful response
- Add `handleLogout` action → expire cookie + return 200

### Client-side (during grace period — no change needed)

`apiClient.js` continues sending `Authorization: Bearer` header. Cookie is also sent automatically. Both work.

**`authHelpers.js`** — add server-side logout
```js
export async function logout() {
  try { await fetch('/api/auth', { method: 'POST', body: JSON.stringify({ action: 'logout' }) }); } catch {}
  // clear localStorage...
  window.location.href = '/login.html';
}
```

### Client-side (post-grace period — separate PR)

- Remove `Authorization: Bearer` from apiClient.js
- Remove `jf_token` from localStorage on login
- Remove Bearer fallback from `getUser()`

## Rollback

If cookie auth causes issues, revert `getUser()` to Bearer-only. Existing localStorage tokens are still valid (7-day expiry). No DB migration needed.

## Testing

- E2E suite (`npm run e2e`) must stay green throughout
- Verify: login sets `Set-Cookie` header in response
- Verify: subsequent requests authenticated via cookie without `Authorization` header
- Verify: logout clears cookie (cookie absent on next request)
- Verify: old Bearer sessions still work during grace period
