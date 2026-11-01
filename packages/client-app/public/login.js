// Text comes from login-i18n.js (loaded first): Dutch by default, English per jf_lang / browser.
const T = (key) => (window.JF_LOGIN ? window.JF_LOGIN.T(key) : key);

// ─── STATE ───────────────────────────────────────────────────────────────
let mode   = 'login';
let method = 'magic';
let passkeyAvailable = false;

// Must match CURRENT_TERMS_VERSION / CURRENT_PRIVACY_VERSION in functions/api/_shared/legalVersions.js
const CURRENT_TERMS_VERSION   = '1.1';
const CURRENT_PRIVACY_VERSION = '1.0';

// ─── POST-AUTH REDIRECT ──────────────────────────────────────────────────
// After successful login/signup, redirect to pending trainer invite if present, else home.
function redirectAfterAuth() {
  const pending = sessionStorage.getItem('jf_pending_invite');
  if (pending) {
    sessionStorage.removeItem('jf_pending_invite');
    window.location.href = '/trainer-invite?t=' + encodeURIComponent(pending);
  } else {
    window.location.href = '/';
  }
}

// Check for ?invite= on login page URL (new-user invite flow)
(function() {
  const p = new URLSearchParams(window.location.search);
  const inv = p.get('invite');
  if (inv) sessionStorage.setItem('jf_pending_invite', inv);
})();

// ─── BASE64URL HELPERS ───────────────────────────────────────────────────
const b64url = buf =>
  btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

const fromB64url = str => {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Uint8Array.from(atob(str), c => c.charCodeAt(0));
};

// ─── ALERT HELPERS ───────────────────────────────────────────────────────
function showAlert(id, msg, type = 'error') {
  const el = document.getElementById(id);
  el.className = `alert alert-${type}`;
  el.textContent = msg;
  el.style.display = 'block';
}
function hideAlert(id) { document.getElementById(id).style.display = 'none'; }

// ─── VIEW SWITCHING ──────────────────────────────────────────────────────
function setMode(m) {
  mode = m;
  document.getElementById('tab-login').classList.toggle('active',  m === 'login');
  document.getElementById('tab-signup').classList.toggle('active', m === 'signup');
  document.getElementById('method-switcher').style.display = m === 'login' ? 'flex' : 'none';
  document.getElementById('passkey-section').style.display = m === 'login' && passkeyAvailable ? 'block' : 'none';
  document.getElementById('guest-section').style.display   = m === 'signup' ? 'block' : 'none';
  if (m === 'signup') { setMethod('password'); }
  if (m === 'login')  { setMethod('magic'); }
  const pwdField   = document.getElementById('password-field');
  const forgotLink = document.getElementById('forgot-link');
  const acceptRow  = document.getElementById('accept-row');
  if (m === 'signup') {
    pwdField.style.display   = 'block';
    forgotLink.style.display = 'none';
    acceptRow.style.display  = 'flex';
    document.getElementById('submit-btn').textContent = T('btn_create');
    document.getElementById('password').autocomplete  = 'new-password';
  } else {
    pwdField.style.display   = method === 'password' ? 'block' : 'none';
    forgotLink.style.display = method === 'password' ? 'block' : 'none';
    acceptRow.style.display  = 'none';
    document.getElementById('submit-btn').textContent = T('btn_signin');
    document.getElementById('password').autocomplete  = 'current-password';
  }
  hideAlert('main-alert');
}

function setMethod(m, updateUI = true) {
  method = m;
  if (!updateUI) return;
  document.getElementById('mt-password').classList.toggle('active', m === 'password');
  document.getElementById('mt-magic').classList.toggle('active',    m === 'magic');
  document.getElementById('password-form').style.display = m === 'password' ? 'block' : 'none';
  document.getElementById('magic-form').style.display    = m === 'magic'    ? 'block' : 'none';
  document.getElementById('forgot-link').style.display   = m === 'password' ? 'block' : 'none';
  hideAlert('main-alert');
}

function showForgot() {
  document.getElementById('main-view').style.display   = 'none';
  document.getElementById('forgot-view').style.display = 'block';
  hideAlert('forgot-alert');
}

function showMain() {
  document.getElementById('forgot-view').style.display = 'none';
  document.getElementById('main-view').style.display   = 'block';
}

// ─── HANDLERS ────────────────────────────────────────────────────────────
async function handleSubmit() {
  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const btn      = document.getElementById('submit-btn');

  if (!email)              { showAlert('main-alert', T('a_email')); return; }
  if (!password)           { showAlert('main-alert', T('a_password')); return; }
  if (password.length < 6) { showAlert('main-alert', T('a_pw_short')); return; }
  if (mode === 'signup' && !document.getElementById('accept-check').checked) {
    showAlert('main-alert', T('a_accept'));
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';
  hideAlert('main-alert');

  try {
    const body = { action: mode === 'login' ? 'login' : 'signup', email, password };
    if (mode === 'signup') {
      body.accepted_terms_version   = CURRENT_TERMS_VERSION;
      body.accepted_privacy_version = CURRENT_PRIVACY_VERSION;
    }
    const res  = await fetch('/api/auth', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
    const data = await res.json();

    if (!data.ok) {
      if (data.loginRequired) {
        btn.disabled = false;
        setMode('login');
        showAlert('main-alert', T(data.error || 'a_registered'));
        return;
      }
      showAlert('main-alert', T(data.error || 'a_wrong'));
      btn.disabled = false;
      btn.textContent = mode === 'login' ? T('btn_login') : T('btn_create');
      return;
    }

    localStorage.setItem('jf_user_id', data.userId);
    redirectAfterAuth();
  } catch {
    showAlert('main-alert', T('a_network'));
    btn.disabled = false;
    btn.textContent = mode === 'login' ? T('btn_login') : T('btn_create');
  }
}

async function handleMagicLink() {
  const email = document.getElementById('magic-email').value.trim();
  const btn   = document.getElementById('magic-btn');

  if (!email) { showAlert('main-alert', T('a_email')); return; }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';
  hideAlert('main-alert');

  try {
    await fetch('/api/auth', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'magic_link', email }),
    });
    showAlert('main-alert', T('a_magic_sent'), 'success');
  } catch {
    showAlert('main-alert', T('a_network'));
  }

  btn.disabled = false;
  btn.textContent = T('btn_magic');
}

async function handleForgot() {
  const email = document.getElementById('forgot-email').value.trim();
  const btn   = document.getElementById('forgot-btn');

  if (!email) { showAlert('forgot-alert', T('a_email')); return; }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';
  hideAlert('forgot-alert');

  try {
    await fetch('/api/auth', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'forgot_password', email }),
    });
    showAlert('forgot-alert', T('a_reset_sent'), 'success');
  } catch {
    showAlert('forgot-alert', T('a_network'));
  }

  btn.disabled = false;
  btn.textContent = T('btn_reset');
}

// ─── PASSKEY LOGIN ───────────────────────────────────────────────────────
async function handlePasskeyLogin() {
  const btn = document.getElementById('passkey-btn');
  btn.disabled = true;
  document.getElementById('passkey-label').textContent = T('passkey_wait');
  hideAlert('main-alert');

  try {
    const beginRes = await fetch('/api/auth', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'passkey_begin_auth' }),
    }).then(r => r.json());

    if (!beginRes.challengeToken) throw new Error(beginRes.error || 'Failed to begin passkey auth');

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge:        fromB64url(beginRes.challenge),
        allowCredentials: beginRes.credentialIds.map(id => ({
          type: 'public-key',
          id:   fromB64url(id),
        })),
        userVerification: 'preferred',
        rpId:             beginRes.rpId || 'justfit.cc',
        timeout:          60000,
      },
    });

    const completeRes = await fetch('/api/auth', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        action:            'passkey_complete_auth',
        challengeToken:    beginRes.challengeToken,
        credentialId:      b64url(assertion.rawId),
        clientDataJSON:    b64url(assertion.response.clientDataJSON),
        authenticatorData: b64url(assertion.response.authenticatorData),
        signature:         b64url(assertion.response.signature),
        userHandle:        assertion.response.userHandle ? b64url(assertion.response.userHandle) : null,
      }),
    }).then(r => r.json());

    if (!completeRes.ok) throw new Error(completeRes.error || 'Passkey authentication failed');

    localStorage.setItem('jf_user_id', completeRes.userId);
    redirectAfterAuth();
  } catch (e) {
    if (e.name === 'NotAllowedError') {
      showAlert('main-alert', T('a_passkey_cancel'));
    } else {
      showAlert('main-alert', e.message ? T(e.message) : T('a_passkey_failed'));
    }
    btn.disabled = false;
    document.getElementById('passkey-label').textContent = T('passkey');
  }
}

// ─── GUEST SIGNUP ────────────────────────────────────────────────────────
async function handleGuestSignup() {
  const btn = document.getElementById('guest-btn');
  btn.disabled = true;
  btn.textContent = T('guest_setup');
  hideAlert('main-alert');
  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'guest_signup' }),
    });
    const data = await res.json();
    if (!data.ok) {
      showAlert('main-alert', T(data.error || 'a_guest_failed'));
      btn.disabled = false;
      btn.textContent = T('guest');
      return;
    }
    localStorage.setItem('jf_user_id', data.userId);
    redirectAfterAuth();
  } catch {
    showAlert('main-alert', T('a_network'));
    btn.disabled = false;
    btn.textContent = T('guest');
  }
}

// ─── MAGIC LINK AUTO-VERIFY ──────────────────────────────────────────────
async function verifyMagicLink(token) {
  document.getElementById('main-view').style.display  = 'none';
  document.getElementById('magic-view').style.display = 'block';

  try {
    const res  = await fetch(`/api/auth?magic=${encodeURIComponent(token)}`);
    const data = await res.json();

    if (!data.ok) throw new Error(T(data.error || 'magic_invalid'));

    localStorage.setItem('jf_user_id', data.userId);
    document.getElementById('magic-title').textContent = T('magic_done');
    document.getElementById('magic-sub').textContent   = T('magic_redirect');
    setTimeout(redirectAfterAuth, 600);
  } catch (e) {
    document.getElementById('magic-title').textContent = T('magic_expired');
    document.getElementById('magic-sub').innerHTML =
      `${e.message}<br/><a href="/login.html" style="color:#10b981;text-decoration:none;font-weight:700;margin-top:12px;display:inline-block;">${T('magic_back')}</a>`;
  }
}

// ─── INIT ─────────────────────────────────────────────────────────────────
(async () => {
  // Already logged in? Session lives in the HttpOnly cookie — verify server-side.
  //
  // A 2xx is not sufficient on its own. The app also needs jf_user_id in
  // localStorage, and the two can fall out of step: if a logout's cookie-clearing
  // request is aborted by the navigation that follows it, the cookie survives
  // while localStorage is already gone. Redirecting to "/" on the cookie alone
  // then loops forever — App.jsx sees no jf_user_id and sends us straight back.
  //
  // So: only redirect when BOTH halves of the session are present. A valid cookie
  // with no local user id is a half-finished logout, and is finished here rather
  // than resurrected — the user asked to sign out.
  try {
    const s = await fetch('/api/auth');
    if (s.ok) {
      const d = await s.json().catch(() => null);
      const hasLocal = !!localStorage.getItem('jf_user_id');
      if (d && d.valid && hasLocal) { redirectAfterAuth(); return; }
      if (d && d.valid && !hasLocal) {
        await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'logout' }),
        }).catch(() => {});
      }
    }
  } catch { /* offline or API down — show the login form */ }

  // Magic link in URL?
  const params = new URLSearchParams(window.location.search);
  const magic  = params.get('magic');
  if (magic) { verifyMagicLink(magic); return; }

  // Pre-fill email from ?email= param (e.g. from magic.html needsSignup redirect)
  const emailParam = params.get('email');
  if (emailParam) {
    document.getElementById('email').value        = emailParam;
    document.getElementById('magic-email').value  = emailParam;
    document.getElementById('forgot-email').value = emailParam;
  }

  // Switch to signup from ?mode=signup or #signup hash
  if (params.get('mode') === 'signup' || window.location.hash === '#signup') setMode('signup');

  // Wire up event listeners
  document.getElementById('tab-login').addEventListener('click', () => setMode('login'));
  document.getElementById('tab-signup').addEventListener('click', () => setMode('signup'));
  document.getElementById('mt-password').addEventListener('click', () => setMethod('password'));
  document.getElementById('mt-magic').addEventListener('click', () => setMethod('magic'));
  document.getElementById('forgot-link').addEventListener('click', showForgot);
  document.getElementById('back-link').addEventListener('click', showMain);
  document.getElementById('submit-btn').addEventListener('click', handleSubmit);
  document.getElementById('magic-btn').addEventListener('click', handleMagicLink);
  document.getElementById('forgot-btn').addEventListener('click', handleForgot);
  document.getElementById('passkey-btn').addEventListener('click', handlePasskeyLogin);
  document.getElementById('guest-btn').addEventListener('click', handleGuestSignup);

  // Enter key support
  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    if (document.getElementById('forgot-view').style.display !== 'none') { handleForgot(); return; }
    if (method === 'magic') { handleMagicLink(); return; }
    handleSubmit();
  });

  // Passkey availability
  if (window.PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable) {
    passkeyAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    if (passkeyAvailable) {
      document.getElementById('passkey-section').style.display = 'block';
      const ua = navigator.userAgent;
      let label = T('passkey');
      if (/Windows/i.test(ua)) label = T('passkey_windows');
      if (/Android/i.test(ua)) label = T('passkey_android');
      document.getElementById('passkey-label').textContent = label;
    }
  }
})();
