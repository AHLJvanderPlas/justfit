// WCAG 2.1 contrast maths. Pure: no DOM, no imports, so the app (tokens.js derives the accent
// text variants from it), the unit tests and scripts/uxC.scan.mjs (smoke) all use the same code.

/** "#rgb" | "#rrggbb" | "r,g,b" | "rgb(...)" | "rgba(r,g,b,a)" → { r, g, b, a } (0–255, a 0–1). */
export function parseColor(input) {
  const s = String(input).trim();
  let m = s.match(/^#([0-9a-f]{3})$/i);
  if (m) return { r: parseInt(m[1][0] + m[1][0], 16), g: parseInt(m[1][1] + m[1][1], 16), b: parseInt(m[1][2] + m[1][2], 16), a: 1 };
  m = s.match(/^#([0-9a-f]{6})$/i);
  if (m) return { r: parseInt(m[1].slice(0, 2), 16), g: parseInt(m[1].slice(2, 4), 16), b: parseInt(m[1].slice(4, 6), 16), a: 1 };
  m = s.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i);
  if (m) return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
  m = s.match(/^([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)$/);
  if (m) return { r: +m[1], g: +m[2], b: +m[3], a: 1 };
  throw new Error(`contrast: cannot parse colour "${input}"`);
}

/** Source-over: `top` (may be translucent) on an opaque `bottom`. Returns an opaque { r, g, b, a: 1 }. */
export function composite(top, bottom) {
  const t = typeof top === "string" ? parseColor(top) : top;
  const b = typeof bottom === "string" ? parseColor(bottom) : bottom;
  const mix = (x, y) => x * t.a + y * (1 - t.a);
  return { r: mix(t.r, b.r), g: mix(t.g, b.g), b: mix(t.b, b.b), a: 1 };
}

const lin = (v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
export function luminance(color) {
  const c = typeof color === "string" ? parseColor(color) : color;
  return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
}

/** WCAG contrast ratio of `fg` on `bg`. A translucent fg is composited on bg first. */
export function contrast(fg, bg) {
  const b = typeof bg === "string" ? parseColor(bg) : bg;
  const f = composite(typeof fg === "string" ? parseColor(fg) : fg, b);
  const l1 = luminance(f), l2 = luminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

export const toHex = (c) => "#" + [c.r, c.g, c.b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");

/** Resolve "rgba(var(--overlay-rgb),0.04)" style values against a palette's --overlay-rgb. */
export function resolveOverlay(value, palette) {
  return String(value).replace(/var\(--overlay-rgb\)/g, palette["--overlay-rgb"]);
}

/**
 * The surfaces text sits on in one theme: the page, a card (bgCard 4 %, bgCard2 6 % overlay on the
 * page), a sheet/modal panel, and the recessed well. Names match tokens.js.
 */
export function surfaces(palette) {
  const bg = palette["--bg"];
  const ov = (a) => composite(`rgba(${palette["--overlay-rgb"]},${a})`, bg);
  const sheet = palette["--sheet"];
  return {
    page: parseColor(bg),
    card: ov(0.04),
    card2: ov(0.06),
    sheet: parseColor(sheet),
    sheetCard: composite(`rgba(${palette["--overlay-rgb"]},0.04)`, sheet),
  };
}

const WHITE = "#ffffff", BLACK = "#000000";

/**
 * Nudge `hex` toward white (dir > 0) or black (dir < 0) in 1 % steps until it reaches `target` on
 * every surface in `against` (colour strings or {r,g,b,a}). Returns the colour unchanged when it
 * already passes. Mixing in sRGB keeps the hue; it is only ever a tint or a shade of the accent.
 */
export function nudge(hex, against, target, dir) {
  const base = parseColor(hex);
  const end = parseColor(dir > 0 ? WHITE : BLACK);
  const passes = (c) => against.every((s) => contrast(c, s) >= target);
  for (let i = 0; i <= 100; i++) {
    const k = i / 100;
    const c = { r: base.r + (end.r - base.r) * k, g: base.g + (end.g - base.g) * k, b: base.b + (end.b - base.b) * k, a: 1 };
    if (passes(c)) return toHex(c);
  }
  return dir > 0 ? WHITE : BLACK;
}

/**
 * The surfaces an accent-coloured TEXT can sit on: every surface above plus the accent's own 15 %
 * wash (the selected chip, .jf-chip--on) and 8 % wash (soft cards) laid over page and sheet.
 */
export function accentTextSurfaces(accentHex, palette) {
  const s = surfaces(palette);
  const list = [s.page, s.card, s.card2, s.sheet, s.sheetCard];
  const rgb = parseColor(accentHex);
  for (const base of [s.page, s.sheet]) {
    list.push(composite({ ...rgb, a: 0.15 }, base));
  }
  return list;
}

/** Accent as TEXT (≥ 4.5:1 on every surface above): the accent itself where it passes, else a tint (dark) or shade (light). */
export function accentText(accentHex, palette, theme) {
  return nudge(accentHex, accentTextSurfaces(accentHex, palette), 4.5, theme === "light" ? -1 : 1);
}

/** Text on the accent-filled primary button: the near-black ink, or white if that reads better. */
export function onAccent(accentHex, darkInk = "#020617") {
  return contrast(darkInk, accentHex) >= contrast(WHITE, accentHex) ? darkInk : WHITE;
}
