// Text comes from login-i18n.js (loaded first): Dutch by default, English per jf_lang / browser.
const T = (key) => (window.JF_LOGIN ? window.JF_LOGIN.T(key) : key);

// ─── STATE ───────────────────────────────────────────────────────────────
// One path (UX review E, finding 14). view: 'email' (e-mail + "Ga verder met e-mail" = magic link, for
// existing and new users alike), 'password' (revealed by a quiet link) or 'signup' (a quiet toggle).
let view = 'email';
let passkeyAvailable = false;
const $ = (id) => document.getElementById(id);

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
// #main-alert is a role="alert" region that is always in the page: adding text announces it.
function showAlert(msg, type = 'error') {
  const el = $('main-alert');
  el.className = `alert alert-${type}`;
  el.textContent = msg;
}
function hideAlert() { const el = $('main-alert'); el.className = 'alert'; el.textContent = ''; }

// ─── VIEW SWITCHING ──────────────────────────────────────────────────────
const TITLES = { email: ['title_email', 'lead_email'], password: ['title_password', 'lead_password'], signup: ['title_signup', 'lead_signup'] };

function setView(v, { focus = false } = {}) {
  view = v;
  const [title, lead] = TITLES[v];
  $('form-title').textContent = T(title);
  $('form-lead').textContent  = T(lead);
  const pw = v !== 'email';
  $('password-field').hidden = !pw;
  $('forgot-link').hidden    = v !== 'password';
  $('accept-row').hidden     = v !== 'signup';
  $('magic-btn').hidden      = v !== 'email';
  $('submit-btn').hidden     = !pw;
  $('submit-btn').textContent = v === 'signup' ? T('btn_create') : T('btn_signin');
  $('mt-password').hidden    = v !== 'email';
  $('mt-magic').hidden       = v !== 'password';
  $('tab-signup').hidden     = v === 'signup';
  $('tab-login').hidden      = v !== 'signup';
  $('passkey-btn').hidden    = !(passkeyAvailable && v !== 'signup');
  $('password').autocomplete = v === 'signup' ? 'new-password' : 'current-password';
  hideAlert();
  if (focus) (pw && $('email').value.trim() ? $('password') : $('email')).focus();
}

function showForgot() {
  $('main-view').hidden = true;
  $('guest-section').hidden = true;
  $('forgot-view').hidden = false;
  hideAlert();
  if (!$('forgot-email').value) $('forgot-email').value = $('email').value;   // the address already typed
  $('forgot-email').focus();
}

function showMain() {
  $('forgot-view').hidden = true;
  $('main-view').hidden = false;
  $('guest-section').hidden = false;
  hideAlert();
}

// ─── HANDLERS ────────────────────────────────────────────────────────────
// Password sign-in and sign-up share one button (#submit-btn); the view decides which.
async function handleSubmit() {
  const email    = $('email').value.trim();
  const password = $('password').value;
  const btn      = $('submit-btn');
  const signup   = view === 'signup';
  const label    = signup ? T('btn_create') : T('btn_signin');

  if (!email)              { showAlert(T('a_email')); return; }
  if (!password)           { showAlert(T('a_password')); return; }
  if (password.length < 6) { showAlert(T('a_pw_short')); return; }
  if (signup && !$('accept-check').checked) { showAlert(T('a_accept')); return; }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';
  hideAlert();

  try {
    const body = { action: signup ? 'signup' : 'login', email, password };
    if (signup) {
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
        setView('password');
        showAlert(T(data.error || 'a_registered'));
        return;
      }
      showAlert(T(data.error || 'a_wrong'));
      btn.disabled = false;
      btn.textContent = label;
      return;
    }

    localStorage.setItem('jf_user_id', data.userId);
    redirectAfterAuth();
  } catch {
    showAlert(T('a_network'));
    btn.disabled = false;
    btn.textContent = label;
  }
}

// "Ga verder met e-mail": sends the magic link. The server answers the same for known and unknown
// addresses; an unknown one lands on the sign-up form (magic.html: needsSignup) after the click.
async function handleMagicLink() {
  const email = $('email').value.trim();
  const btn   = $('magic-btn');

  if (!email) { showAlert(T('a_email')); $('email').focus(); return; }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';
  hideAlert();

  try {
    await fetch('/api/auth', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'magic_link', email }),
    });
    showAlert(T('a_magic_sent'), 'success');
  } catch {
    showAlert(T('a_network'));
  }

  btn.disabled = false;
  btn.textContent = T('btn_continue');
}

async function handleForgot() {
  const email = $('forgot-email').value.trim();
  const btn   = $('forgot-btn');

  if (!email) { showAlert(T('a_email')); return; }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';
  hideAlert();

  try {
    await fetch('/api/auth', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'forgot_password', email }),
    });
    showAlert(T('a_reset_sent'), 'success');
  } catch {
    showAlert(T('a_network'));
  }

  btn.disabled = false;
  btn.textContent = T('btn_reset');
}

// ─── PASSKEY LOGIN ───────────────────────────────────────────────────────
async function handlePasskeyLogin() {
  const btn = $('passkey-btn');
  btn.disabled = true;
  $('passkey-label').textContent = T('passkey_wait');
  hideAlert();

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
      showAlert(T('a_passkey_cancel'));
    } else {
      showAlert(e.message ? T(e.message) : T('a_passkey_failed'));
    }
    btn.disabled = false;
    $('passkey-label').textContent = T('passkey');
  }
}

// ─── GUEST SIGNUP ────────────────────────────────────────────────────────
async function handleGuestSignup() {
  const btn = $('guest-btn');
  if (!$('guest-accept-check').checked) { showAlert(T('a_accept')); return; }
  btn.disabled = true;
  btn.textContent = T('guest_setup');
  hideAlert();
  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'guest_signup',
        accepted_terms_version:   CURRENT_TERMS_VERSION,
        accepted_privacy_version: CURRENT_PRIVACY_VERSION,
      }),
    });
    const data = await res.json();
    if (!data.ok) {
      showAlert(T(data.error || 'a_guest_failed'));
      btn.disabled = false;
      btn.textContent = T('guest');
      return;
    }
    localStorage.setItem('jf_user_id', data.userId);
    redirectAfterAuth();
  } catch {
    showAlert(T('a_network'));
    btn.disabled = false;
    btn.textContent = T('guest');
  }
}

// ─── MAGIC LINK AUTO-VERIFY (legacy login.html?magic=; the emailed link opens magic.html) ──────
async function verifyMagicLink(token) {
  $('main-view').hidden = true;
  $('guest-section').hidden = true;
  $('magic-view').hidden = false;

  try {
    const res  = await fetch(`/api/auth?magic=${encodeURIComponent(token)}`);
    const data = await res.json();

    if (data.needsSignup && data.email) {   // an address with no account yet: finish it on the sign-up form
      window.location.href = `/login.html?email=${encodeURIComponent(data.email)}&mode=signup`;
      return;
    }
    if (!data.ok) throw new Error(T(data.error || 'magic_invalid'));

    localStorage.setItem('jf_user_id', data.userId);
    $('magic-title').textContent = T('magic_done');
    $('magic-sub').textContent   = T('magic_redirect');
    setTimeout(redirectAfterAuth, 600);
  } catch (e) {
    $('magic-title').textContent = T('magic_expired');
    $('magic-sub').textContent   = e.message;
    $('magic-back').hidden = false;
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
    $('email').value        = emailParam;
    $('forgot-email').value = emailParam;
  }

  // Switch to signup from ?mode=signup or #signup hash
  if (params.get('mode') === 'signup' || window.location.hash === '#signup') setView('signup');

  // Wire up event listeners
  $('mt-password').addEventListener('click', () => setView('password', { focus: true }));
  $('mt-magic').addEventListener('click',    () => setView('email', { focus: true }));
  $('tab-signup').addEventListener('click',  () => setView('signup', { focus: true }));
  $('tab-login').addEventListener('click',   () => setView('email', { focus: true }));
  $('forgot-link').addEventListener('click', showForgot);
  $('back-link').addEventListener('click', showMain);
  $('submit-btn').addEventListener('click', handleSubmit);
  $('magic-btn').addEventListener('click', handleMagicLink);
  $('forgot-btn').addEventListener('click', handleForgot);
  $('passkey-btn').addEventListener('click', handlePasskeyLogin);
  $('guest-btn').addEventListener('click', handleGuestSignup);
  $('main-view').addEventListener('submit', (e) => e.preventDefault());
  // The guest button is only usable once the same terms + privacy consent as signup is given
  $('guest-accept-check').addEventListener('change', (e) => {
    $('guest-btn').disabled = !e.target.checked;
  });

  // Enter inside a field does what the visible primary button does (a button handles its own Enter)
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || !(e.target instanceof HTMLInputElement) || e.target.type === 'checkbox') return;
    if (!$('forgot-view').hidden) { handleForgot(); return; }
    if (e.target.id === 'guest-accept-check') return;
    e.preventDefault();
    if (view === 'email') handleMagicLink(); else handleSubmit();
  });

  // Passkey availability
  if (window.PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable) {
    passkeyAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    if (passkeyAvailable) {
      $('passkey-btn').hidden = view === 'signup';
      const ua = navigator.userAgent;
      let label = T('passkey');
      if (/Windows/i.test(ua)) label = T('passkey_windows');
      if (/Android/i.test(ua)) label = T('passkey_android');
      $('passkey-label').textContent = label;
    }
  }
})();
