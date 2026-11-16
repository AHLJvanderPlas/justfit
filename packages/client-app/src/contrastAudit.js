// The WCAG 2.1 AA audit behind scripts/uxC.scan.mjs (smoke) and tests/contrast.test.js: pure, it takes
// the real token source (THEMES, ACCENT_COLORS from tokens.js) and returns one string per failed pair.
// Thresholds: text 4.5:1, placeholders that are the only label 4.5:1, focus ring and disabled-button
// text 3:1. Ratios are against EVERY surface text can sit on (page, card, card 2, sheet, sheet card,
// and for accent text the accent's own 15 % wash) — see contrast.js surfaces().
import { contrast, surfaces, accentText, accentTextSurfaces, resolveOverlay, parseColor, composite } from "./contrast.js";

export const TEXT_MIN = 4.5;
export const UI_MIN = 3;

const min = (fg, list) => Math.min(...list.map((s) => contrast(fg, s)));

export function auditThemes({ THEMES, ACCENT_COLORS }) {
  const fails = [];
  const check = (label, ratio, need) => { if (ratio < need - 1e-9) fails.push(`${label}: ${ratio.toFixed(2)}:1 < ${need}:1`); };
  for (const theme of ["dark", "light"]) {
    const p = THEMES[theme];
    const s = surfaces(p);
    const all = Object.values(s);
    const textOf = (token) => (token === "--label" ? resolveOverlay(p[token], p) : p[token]);
    for (const token of ["--text", "--text-soft", "--muted", "--subtle-text", "--label"]) {
      check(`${theme} ${token} on every surface`, min(textOf(token), all), TEXT_MIN);
    }
    // placeholder = --muted (styles.css ::placeholder, checked in auditCss): the only label of some fields
    check(`${theme} placeholder (--muted) on a field (card 2)`, contrast(p["--muted"], s.card2), TEXT_MIN);
    // disabled primary button: exempt by WCAG, must stay legible
    check(`${theme} disabled .jf-primary text (--on-disabled on --subtle)`, contrast(p["--on-disabled"], p["--subtle"]), UI_MIN);
    // a visible step between text > text-soft > muted > subtle-text (on the page)
    const ladder = ["--text", "--text-soft", "--muted", "--subtle-text"].map((t) => contrast(textOf(t), s.page));
    for (let i = 1; i < ladder.length; i++) if (ladder[i - 1] / ladder[i] < 1.1) fails.push(`${theme} ladder: step ${i} (${ladder[i - 1].toFixed(2)} -> ${ladder[i].toFixed(2)}) is under 10 %`);
    for (const a of ACCENT_COLORS) {
      const derived = accentText(a.hex, p, theme);
      check(`${theme} ${a.id} accent text ${derived}`, min(derived, accentTextSurfaces(a.hex, p)), TEXT_MIN);
      // focus ring = the accent-text colour: >= 3:1 against what it is drawn on
      check(`${theme} ${a.id} focus ring on page/card/sheet`, min(derived, [s.page, s.card, s.sheet, s.sheetCard]), UI_MIN);
      check(`${theme} ${a.id} text on the accent-filled primary button`, contrast(p["--on-accent"], a.hex), TEXT_MIN);
    }
  }
  return fails;
}

/** Which accents need a text variant (the accent itself fails as text on that theme's surfaces). */
export function accentsNeedingVariant({ THEMES, ACCENT_COLORS }, theme) {
  const p = THEMES[theme];
  return ACCENT_COLORS.filter((a) => min(a.hex, accentTextSurfaces(a.hex, p)) < TEXT_MIN).map((a) => a.id);
}

/** styles.css: placeholders read --muted, and no rule paints text in the raw accent or in --subtle. */
export function auditCss(css) {
  const fails = [];
  const bare = css.replace(/\/\*[\s\S]*?\*\//g, "");
  if (!/::placeholder\s*\{[^}]*color:\s*var\(--muted\)/.test(bare)) fails.push("styles.css: ::placeholder must use var(--muted)");
  if (/(?<![-\w])color:\s*var\(--accent\)/.test(bare)) fails.push("styles.css: text colour var(--accent) — use var(--accent-text)");
  if (/(?<![-\w])color:\s*var\(--subtle\)/.test(bare)) fails.push("styles.css: text colour var(--subtle) — use var(--subtle-text)");
  return fails;
}

/** JSX: `color: C.emerald | "var(--accent)" | C.subtle` is text in a colour that fails (use C.accentText / C.subtleText). */
export function auditJsx(name, src) {
  const fails = [];
  const re = /(?<![-\w])color:\s*(?:[^,}\n]*?)(C\.emerald\b|"var\(--accent\)"|'var\(--accent\)'|C\.subtle\b)/g;
  for (const m of src.matchAll(re)) fails.push(`${name}: text colour ${m[1]} (line ${src.slice(0, m.index).split("\n").length}) — use C.accentText / C.subtleText`);
  return fails;
}

/** public/login.html (dark only): its tokens and every literal text colour against its page and card. */
export function auditLogin(html) {
  const fails = [];
  const root = html.match(/:root\s*\{([^}]*)\}/)?.[1] ?? "";
  const tok = (n) => root.match(new RegExp(`${n}:\\s*(#[0-9a-fA-F]{3,6})`))?.[1];
  const page = parseColor("#020617");
  const card = composite("rgba(255,255,255,0.04)", page);
  const coralWash = composite("rgba(244,63,94,0.12)", page);
  const muted = tok("--muted"), accentTx = tok("--accent-text"), onAccent = tok("--on-accent");
  if (!muted || !accentTx || !onAccent) return ["login.html: :root must define --muted, --accent-text and --on-accent"];
  const need = (label, fg, bgs) => { const r = Math.min(...bgs.map((b) => contrast(fg, b))); if (r < TEXT_MIN) fails.push(`login.html ${label}: ${r.toFixed(2)}:1 < ${TEXT_MIN}:1`); };
  need("--muted", muted, [page, card]);
  need("--accent-text", accentTx, [page, card, coralWash]);
  need("coral button text (--on-accent on #f43f5e)", onAccent, [parseColor("#f43f5e")]);
  need("body text #f8fafc", "#f8fafc", [page, card]);
  const bare = html.replace(/<!--[\s\S]*?-->/g, "");
  for (const m of bare.matchAll(/(?<![-\w])color:\s*(#[0-9a-fA-F]{6})/g)) {
    // text on the dark page/card only; the coral button text is checked above
    const ctx = bare.slice(Math.max(0, m.index - 160), m.index);
    if (/background:\s*#f43f5e/.test(ctx.slice(-80))) continue;
    need(`literal text colour ${m[1]}`, m[1], [page, card]);
  }
  if (!/::placeholder\s*\{[^}]*var\(--muted\)/.test(bare)) fails.push("login.html: ::placeholder must use var(--muted)");
  if (/\boutline:\s*(none|0)\b/.test(bare)) fails.push("login.html: outline none/0");
  return fails;
}
