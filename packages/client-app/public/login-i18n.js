// The login page's two languages. Static HTML has no React, so this is the whole i18n:
// a dictionary per language, applied to [data-i18n] (text) and [data-i18n-ph] (placeholder).
// Dutch is the default, like the app; English when jf_lang is 'en', or when jf_lang is unset
// and the browser language is English. Loaded before login.js (CSP: script-src 'self').
// The same file is required by packages/client-app/tests/loginI18n.test.js.
/* global module */
(function (root) {
  var EN = {
    page_title: 'JustFit.cc — Login',
    tab_login: 'Sign in', tab_signup: 'Create account',
    passkey: 'Use Face ID / Touch ID', passkey_windows: 'Use Windows Hello', passkey_android: 'Use Fingerprint / Face Unlock',
    passkey_wait: 'Waiting for biometrics…', or: 'or',
    mt_magic: 'Magic Link', mt_password: 'Password',
    label_email: 'Email', label_password: 'Password', ph_email: 'you@example.com',
    forgot_link: 'Forgot password?',
    terms_pre: 'I have read and agree to the', terms_terms: 'Terms & Conditions', terms_disclaimer: 'Disclaimer & Liability Waiver',
    terms_and: 'and', terms_privacy: 'Privacy Policy', terms_post: 'of JustFit.cc.',
    btn_login: 'Login', btn_signin: 'Sign in', btn_create: 'Create Account',
    magic_intro: "Enter your email and we'll send a secure link. No password needed.",
    btn_magic: 'Send Login Link',
    guest: 'Continue without account →', guest_note: 'Your data is saved locally. Add email later to keep access.', guest_setup: 'Setting up…',
    link_privacy: 'Privacy Policy', link_terms: 'Terms & Conditions',
    forgot_title: 'Forgot password?', forgot_text: "Enter your email and we'll send a reset link. It expires in 1 hour.",
    btn_reset: 'Send Reset Link', back_login: '← Back to login',
    magic_signing: 'Signing you in…', magic_verifying: 'Verifying your link.', magic_done: 'Signed in!', magic_redirect: 'Redirecting…',
    magic_expired: 'Link expired', magic_invalid: 'Invalid or expired link', magic_back: 'Back to login →',
    a_email: 'Please enter your email.', a_password: 'Please enter your password.', a_pw_short: 'Password must be at least 6 characters.',
    a_accept: 'Please accept the Terms & Conditions to create an account.',
    a_registered: 'This email is already registered — try signing in.', a_wrong: 'Something went wrong.',
    a_network: 'Network error. Please try again.',
    a_magic_sent: 'If this email is registered, a login link has been sent. Check your inbox.',
    a_reset_sent: 'If this email is registered, a reset link has been sent. Check your inbox.',
    a_passkey_cancel: 'Passkey sign-in was cancelled or no passkey found. Use password or magic link instead.',
    a_passkey_failed: 'Passkey sign-in failed.', a_guest_failed: 'Could not create guest session.',
    'Email and password required': 'Email and password required',
    'Invalid email or password': 'Invalid email or password',
    'Too many login attempts — please try again later': 'Too many login attempts — please try again later',
    'Too many attempts — please try again later': 'Too many attempts — please try again later',
    'You must accept the Terms & Conditions to create an account.': 'You must accept the Terms & Conditions to create an account.',
    'You must accept the Privacy Policy to create an account.': 'You must accept the Privacy Policy to create an account.',
    'This email is already registered — try signing in.': 'This email is already registered — try signing in.',
    'Invalid or expired link': 'Invalid or expired link',
    'This link has already been used': 'This link has already been used',
    'This link has expired': 'This link has expired'
  };
  var NL = {
    page_title: 'JustFit.cc — Inloggen',
    tab_login: 'Inloggen', tab_signup: 'Account maken',
    passkey: 'Gebruik Face ID / Touch ID', passkey_windows: 'Gebruik Windows Hello', passkey_android: 'Gebruik vingerafdruk / gezichtsherkenning',
    passkey_wait: 'Wachten op biometrie…', or: 'of',
    mt_magic: 'Magische link', mt_password: 'Wachtwoord',
    label_email: 'E-mail', label_password: 'Wachtwoord', ph_email: 'jij@voorbeeld.nl',
    forgot_link: 'Wachtwoord vergeten?',
    terms_pre: 'Ik heb de', terms_terms: 'Algemene voorwaarden', terms_disclaimer: 'Disclaimer en aansprakelijkheid',
    terms_and: 'en', terms_privacy: 'Privacybeleid', terms_post: 'van JustFit.cc gelezen en ga akkoord.',
    btn_login: 'Inloggen', btn_signin: 'Inloggen', btn_create: 'Account maken',
    magic_intro: 'Vul je e-mailadres in, dan sturen we je een beveiligde link. Een wachtwoord is niet nodig.',
    btn_magic: 'Stuur inloglink',
    guest: 'Doorgaan zonder account →', guest_note: 'Je gegevens staan alleen op dit apparaat. Voeg later je e-mail toe om toegang te houden.', guest_setup: 'Bezig met instellen…',
    link_privacy: 'Privacybeleid', link_terms: 'Algemene voorwaarden',
    forgot_title: 'Wachtwoord vergeten?', forgot_text: 'Vul je e-mailadres in, dan sturen we je een link om een nieuw wachtwoord te kiezen. De link werkt 1 uur.',
    btn_reset: 'Stuur herstellink', back_login: '← Terug naar inloggen',
    magic_signing: 'Je wordt ingelogd…', magic_verifying: 'We controleren je link.', magic_done: 'Ingelogd!', magic_redirect: 'Even doorsturen…',
    magic_expired: 'Link verlopen', magic_invalid: 'Ongeldige of verlopen link', magic_back: 'Terug naar inloggen →',
    a_email: 'Vul je e-mailadres in.', a_password: 'Vul je wachtwoord in.', a_pw_short: 'Je wachtwoord moet minstens 6 tekens hebben.',
    a_accept: 'Ga akkoord met de algemene voorwaarden om een account te maken.',
    a_registered: 'Dit e-mailadres heeft al een account — probeer in te loggen.', a_wrong: 'Er ging iets mis.',
    a_network: 'Netwerkfout. Probeer het opnieuw.',
    a_magic_sent: 'Staat dit e-mailadres bij ons? Dan is er een inloglink onderweg. Check je inbox.',
    a_reset_sent: 'Staat dit e-mailadres bij ons? Dan is er een herstellink onderweg. Check je inbox.',
    a_passkey_cancel: 'Inloggen met passkey is geannuleerd, of er is geen passkey gevonden. Log in met wachtwoord of magische link.',
    a_passkey_failed: 'Inloggen met passkey is niet gelukt.', a_guest_failed: 'Kon geen gastsessie maken.',
    'Email and password required': 'E-mail en wachtwoord zijn verplicht',
    'Invalid email or password': 'Onjuist e-mailadres of wachtwoord',
    'Too many login attempts — please try again later': 'Te veel inlogpogingen — probeer het later opnieuw',
    'Too many attempts — please try again later': 'Te veel pogingen — probeer het later opnieuw',
    'You must accept the Terms & Conditions to create an account.': 'Ga akkoord met de algemene voorwaarden om een account te maken.',
    'You must accept the Privacy Policy to create an account.': 'Ga akkoord met het privacybeleid om een account te maken.',
    'This email is already registered — try signing in.': 'Dit e-mailadres heeft al een account — probeer in te loggen.',
    'Invalid or expired link': 'Ongeldige of verlopen link',
    'This link has already been used': 'Deze link is al gebruikt',
    'This link has expired': 'Deze link is verlopen'
  };

  // jf_lang wins; without it the browser language decides; the default is Dutch.
  function pickLang(stored, navLang) {
    if (stored === 'en' || stored === 'nl') return stored;
    return /^en/i.test(navLang || '') ? 'en' : 'nl';
  }

  var api = { EN: EN, NL: NL, pickLang: pickLang };
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; return; }

  var stored = null;
  try { stored = localStorage.getItem('jf_lang'); } catch { /* storage blocked: browser language decides */ }
  var lang = pickLang(stored, navigator.language);
  var dict = lang === 'en' ? EN : NL;
  // T(key): the dictionary entry; a server message that has no entry is shown as it came.
  function T(key) { return dict[key] != null ? dict[key] : key; }
  function apply() {
    document.documentElement.lang = lang;
    document.title = T('page_title');
    var i, els = document.querySelectorAll('[data-i18n]');
    for (i = 0; i < els.length; i++) els[i].textContent = T(els[i].getAttribute('data-i18n'));
    els = document.querySelectorAll('[data-i18n-ph]');
    for (i = 0; i < els.length; i++) els[i].setAttribute('placeholder', T(els[i].getAttribute('data-i18n-ph')));
  }
  root.JF_LOGIN = { lang: lang, T: T, apply: apply };
  apply();
})(typeof window !== 'undefined' ? window : this);
