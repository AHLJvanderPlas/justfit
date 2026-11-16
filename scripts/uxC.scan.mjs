// UX review C — accessibility (offline source scan, run by smoke). One line per broken rule; exit 1.
//
//  1. Contrast (finding 7): WCAG 2.1 AA ratios computed from the REAL token source (THEMES and
//     ACCENT_COLORS in tokens.js) — muted / subtle-text / label / text-soft on every surface of both
//     themes, placeholder, disabled primary, all 11 accents as text (derived variant) and as the
//     primary button's fill, the focus ring; prepaint.js agrees with tokens.js; login.html's tokens
//     and literal colours; no text in raw --accent / --subtle (CSS and JSX).
//  2. Focus (finding 8): no `outline: none|0` without a visible replacement: in styles.css and in the
//     static pages every such rule needs a `:focus-visible` sibling for the same selector, or must be
//     the programmatic-focus exception `[tabindex="-1"]:focus`; none inline in JSX; one global
//     `:focus-visible` ring exists with a >= 2 px outline.
//  3. Names and dialogs (finding 8): every `<svg>` is aria-hidden / labelled; every dialog root in the
//     shared list uses useDialog; every icon-only <button> has an aria-label.
//  4. Hit areas (finding 9): `.jf-chip` / `.jf-icon-btn` keep the 44 px hit area (smoke A1) and the
//     shared classes below stay >= 44 px.
import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';
import { THEMES, ACCENT_COLORS } from '../packages/client-app/src/tokens.js';
import { auditThemes, auditCss, auditJsx, auditLogin } from '../packages/client-app/src/contrastAudit.js';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SRC = 'packages/client-app/src';
const PUB = 'packages/client-app/public';
const rd = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const errs = [];

// 1 — contrast
errs.push(...auditThemes({ THEMES, ACCENT_COLORS }));
const css = rd(`${SRC}/styles.css`);
errs.push(...auditCss(css));
const jsxFiles = [...fs.readdirSync(path.join(ROOT, SRC)).filter((f) => f.endsWith('.jsx')), ...fs.readdirSync(path.join(ROOT, SRC, 'settings')).map((f) => `settings/${f}`)];
for (const f of jsxFiles) errs.push(...auditJsx(f, rd(`${SRC}/${f}`)));
const pre = rd(`${PUB}/prepaint.js`);
for (const [theme, key] of [['light', 'light'], ['dark', 'dark']]) {
  const muted = THEMES[theme]['--muted'];
  const line = pre.split('\n').find((l) => l.includes(theme === 'light' ? '"--bg": "#f7f8fa"' : '"--bg": "#020617"'));
  if (!line || !line.includes(`"--muted": "${muted}"`)) errs.push(`prepaint.js: ${key} --muted must equal tokens.js (${muted})`);
}
errs.push(...auditLogin(rd(`${PUB}/login.html`)));

// 2 — focus: outline none/0 needs a visible replacement
function outlineErrs(name, src) {
  const out = [];
  const bare = src.replace(/\/\*[\s\S]*?\*\//g, '');
  const rules = [...bare.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ sel: m[1].trim().split(/\s*,\s*/), body: m[2] }));
  for (const r of rules) {
    if (!/\boutline(?:-style)?:\s*(none|0)\b/.test(r.body)) continue;
    for (const sel of r.sel) {
      if (/\[tabindex="-1"\]:focus$/.test(sel)) continue; // programmatic focus target, not a control
      if (/:focus-visible$/.test(sel)) continue;
      const base = sel.replace(/:(focus|hover|active)\b.*$/, '');
      const replaced = rules.some((o) => o !== r && o.sel.some((s) => s === `${base}:focus-visible` || s === `${base}:focus-within`) && /outline:\s*\d/.test(o.body));
      if (!replaced) out.push(`${name}: "${sel}" sets outline none/0 without a ${base}:focus-visible rule`);
    }
  }
  return out;
}
errs.push(...outlineErrs('styles.css', css));
for (const f of fs.readdirSync(path.join(ROOT, PUB)).filter((x) => x.endsWith('.html'))) {
  const html = rd(`${PUB}/${f}`);
  for (const m of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) errs.push(...outlineErrs(f, m[1]));
}
for (const f of jsxFiles) {
  const src = rd(`${SRC}/${f}`);
  if (/outline:\s*["']none["']|outline:\s*0\b/.test(src)) errs.push(`${f}: inline outline none/0 (it beats the global :focus-visible ring)`);
}
if (!/(^|\n)\s*:focus-visible\s*\{[^}]*outline:\s*[2-9]px solid/.test(css.replace(/\/\*[\s\S]*?\*\//g, ''))) errs.push('styles.css: the global :focus-visible ring (outline >= 2px) is missing');

// 3 — svgs, dialogs, icon-only buttons (AST)
function walk(n, cb) { if (!n || typeof n !== 'object') return; if (Array.isArray(n)) { n.forEach((x) => walk(x, cb)); return; } if (n.type) cb(n); for (const k in n) { if (k !== 'loc') walk(n[k], cb); } }
for (const f of jsxFiles) {
  const src = rd(`${SRC}/${f}`);
  const ast = parse(src, { sourceType: 'module', plugins: ['jsx'] });
  walk(ast.program, (n) => {
    if (n.type === 'JSXOpeningElement' && n.name.name === 'svg') {
      const names = n.attributes.map((a) => (a.type === 'JSXAttribute' ? a.name.name : '...'));
      if (!names.some((x) => ['aria-hidden', 'aria-label', 'role', 'aria-labelledby', '...'].includes(x))) errs.push(`${f}:${n.loc.start.line}: <svg> is neither aria-hidden nor labelled`);
    }
    if (n.type === 'JSXElement' && n.openingElement.name.name === 'button') {
      const names = n.openingElement.attributes.map((a) => (a.type === 'JSXAttribute' ? a.name.name : '...'));
      if (names.includes('aria-label') || names.includes('aria-labelledby') || names.includes('...')) return;
      const kids = n.children.filter((c) => !(c.type === 'JSXText' && !c.value.trim()));
      const onlySymbol = kids.length > 0 && kids.every((c) => c.type === 'JSXText' && !/[A-Za-zÀ-ÿ]{2,}/.test(c.value));
      if (onlySymbol) errs.push(`${f}:${n.loc.start.line}: icon-only <button> without aria-label`);
    }
  });
}
const DIALOG_FILES = {
  'CheckInModal.jsx': 'check-in sheet', 'WhyNotModal.jsx': 'why-not modal', 'PathChoiceModal.jsx': 'path modal', 'GuestConvertModal.jsx': 'guest-convert modal',
  'WorkoutView.jsx': 'cancel confirm + alternatives sheet', 'CoachView.jsx': 'trainer sheets', 'App.jsx': 'terms gate + sign-out + Cooper',
  'sessionSheet.jsx': 'session sheets', 'OnboardingModal.jsx': 'onboarding', 'PendingInviteModal.jsx': 'trainer invite', 'PlanWeekView.jsx': 'delete confirm', 'SettingsView.jsx': 'settings modals',
};
for (const [f, what] of Object.entries(DIALOG_FILES)) {
  const src = rd(`${SRC}/${f}`);
  if (!/from "\.\/useDialog\.js"/.test(src) || !/useDialog\(/.test(src)) errs.push(`${f}: ${what} must use useDialog (focus in, trap, Escape, focus back)`);
  if (/addEventListener\(["']keydown["']/.test(src) && /Escape/.test(src) && f !== 'WorkoutView.jsx') errs.push(`${f}: its own Escape handler — dialogs use useDialog`);
}

// 4 — hit areas that must hold
const bare = css.replace(/\/\*[\s\S]*?\*\//g, '');
const rule = (sel) => { const m = bare.match(new RegExp(`(?:^|\\})\\s*${sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`)); return m ? m[1] : ''; };
const px = (b, p) => { const m = b.match(new RegExp(`(?:^|[\\s;])${p}:\\s*(\\d+(?:\\.\\d+)?)px`)); return m ? Number(m[1]) : 0; };
for (const [sel, prop, minPx] of [['.jf-sheet-close', 'min-height', 44], ['.jf-nav__item', 'min-height', 44]]) {
  if (rule(sel) && px(rule(sel), prop) < minPx) errs.push(`styles.css: ${sel} ${prop} < ${minPx}px`);
}
process.stdout.write(errs.join('\n') + (errs.length ? '\n' : ''));
process.exit(errs.length ? 1 : 0);
