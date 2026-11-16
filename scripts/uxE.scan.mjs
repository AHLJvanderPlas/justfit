// UX review E — onboarding, login and the builder labels (offline source scan, run by smoke). One line per broken rule; exit 1.
//
//  1. Onboarding (finding 13): the scroll area (.jf-ob__scroll > .jf-ob__body) is a flex sibling ABOVE the footer, not an
//     overlay; a fade (.jf-ob__fade) marks more content; session length is rendered before equipment; only four common
//     equipment options show until "More equipment"; experience is one row of three chips; "Skip this step" appears on
//     the About step only (everywhere else it did exactly what Continue does).
//  2. Login (finding 14): one primary button per state, no tab roles, guest in its own section, no style="" attribute,
//     emerald not coral (login, magic, reset-password, the wave).
//  3. Builder (finding 16): SetRow renders real column labels (htmlFor) on the first row; Samenstellen and Registreren pass idBase.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const rd = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const SRC = 'packages/client-app/src', PUB = 'packages/client-app/public';
const errs = [];

// 1 — onboarding
const ob = rd(`${SRC}/OnboardingModal.jsx`), css = rd(`${SRC}/styles.css`);
const iLen = ob.indexOf('t("Default session length")'), iEq = ob.indexOf('id="jf-ob-equip-label"');
if (iLen < 0 || iEq < 0 || iLen > iEq) errs.push('OnboardingModal: session length must come before equipment');
if (!/COMMON_EQUIPMENT = \["none", "dumbbell", "resistance_bands", "pull_up_bar"\]/.test(ob)) errs.push('OnboardingModal: the four common equipment options are none, dumbbell, resistance_bands, pull_up_bar');
if (!/t\("More equipment"\)/.test(ob) || !/aria-expanded=\{moreEquip\}/.test(ob)) errs.push('OnboardingModal: "More equipment" disclosure with aria-expanded is missing');
if (!/useState\(\(\) => \(pp\.available_equipment/.test(ob)) errs.push('OnboardingModal: the disclosure must start open when something in the hidden part is selected');
if (!/jf-ob__exp"/.test(ob) || !/jf-ob__exp-desc/.test(ob)) errs.push('OnboardingModal: experience must be three chips (.jf-ob__exp) with the description underneath');
const skips = (ob.match(/t\("Skip this step"\)/g) ?? []).length;
if (skips !== 1 || !/stepId === "about" && \(\s*<button[^>]*jf-ob__skip/.test(ob)) errs.push('OnboardingModal: "Sla deze stap over" belongs on the About step only (found ' + skips + ')');
if (!/className="jf-ob__scroll"/.test(ob) || !/className="jf-ob__fade"/.test(ob)) errs.push('OnboardingModal: .jf-ob__scroll and .jf-ob__fade are missing');
const body = css.match(/\.jf-ob__body \{([^}]*)\}/)?.[1] ?? '', scroll = css.match(/\.jf-ob__scroll \{([^}]*)\}/)?.[1] ?? '';
if (/position:\s*(fixed|absolute|sticky)/.test(body) || !/min-height:\s*0/.test(body) || !/overflow-y:\s*auto/.test(body)) errs.push('styles.css: .jf-ob__body must be a normal scroll box (no overlay positioning, min-height 0)');
if (!/flex:\s*1 1 auto/.test(scroll) || !/min-height:\s*0/.test(scroll)) errs.push('styles.css: .jf-ob__scroll must fill the card above the footer');
if (/\.jf-ob__foot \{[^}]*position:\s*(fixed|absolute|sticky)/.test(css)) errs.push('styles.css: the onboarding footer is not an overlay');
if (!/\.jf-ob__body--more \+ \.jf-ob__fade \{ opacity: 1/.test(css)) errs.push('styles.css: the fade must show while more content follows');

// 2 — login
const login = rd(`${PUB}/login.html`);
const bare = login.replace(/<!--[\s\S]*?-->/g, '');
if (/\sstyle\s*=/.test(bare)) errs.push('login.html: a style="" attribute (CSP)');
if (/role="(tablist|tab)"|mode-tab|method-tab/.test(bare)) errs.push('login.html: tabs are back (one path, no tabs inside tabs)');
const prim = [...bare.matchAll(/<button\b[^>]*>/g)].map((m) => m[0]).filter((b) => /btn-primary/.test(b) && !/\bhidden\b/.test(b));
if (prim.filter((b) => !/forgot-btn/.test(b)).length !== 1) errs.push('login.html: exactly one visible primary button on first paint (the magic-link button)');
if (!/<section id="guest-section"/.test(bare) || bare.indexOf('id="guest-section"') < bare.indexOf('</form>')) errs.push('login.html: the guest is its own section after the sign-in form');
for (const f of ['login.html', 'magic.html', 'reset-password.html', 'login-wave.js', 'login.js']) if (/#f43f5e|244,\s*63,\s*94|\bSR = 244/i.test(rd(`${PUB}/${f}`))) errs.push(`${f}: coral accent`);
if (!/SR = 16, SG = 185, SB = 129/.test(rd(`${PUB}/login-wave.js`))) errs.push('login-wave.js: the wave is emerald (16,185,129)');

// 3 — builder labels
const ss = rd(`${SRC}/sessionSheet.jsx`);
if (!/className="jf-log-lab" htmlFor=/.test(ss) || !/t\("Sets"\)/.test(ss) || !/t\("Seconds"\)/.test(ss) || !/t\("Rest"\)/.test(ss)) errs.push('sessionSheet.jsx: SetRow must render real column labels (Sets / Herhalingen or Seconden / Rust)');
if (!/idBase=\{`jf-sb-/.test(rd(`${SRC}/SessionBuilder.jsx`))) errs.push('SessionBuilder.jsx: SetRow needs idBase (column labels)');
if (!/idBase=\{ri === 0/.test(rd(`${SRC}/LogSessionSheet.jsx`))) errs.push('LogSessionSheet.jsx: SetRow needs idBase on the first row (column labels)');

if (errs.length) { console.log(errs.join('\n')); process.exit(1); }
