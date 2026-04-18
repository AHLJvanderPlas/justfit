// Shared legal policy version constants for all server-side endpoints.
// Bump these when making material policy changes — all users with a different
// stored version are re-prompted to accept on next app load.
//
// NOTE: public/login.js and src/App.jsx define the same values as module-level
// constants (those files cannot import from here). Keep them in sync manually.
export const CURRENT_TERMS_VERSION   = '1.1'; // Terms & Conditions + Disclaimer bundled
export const CURRENT_PRIVACY_VERSION = '1.0';
