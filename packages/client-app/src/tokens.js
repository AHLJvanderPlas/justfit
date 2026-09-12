// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
// Every theme-dependent value is a CSS custom property so the palette can be
// swapped at :root without touching the ~2,100 inline style objects that read
// these tokens. applyTheme() below writes the values; THEMES holds the palettes.
//
// --overlay-rgb is the important one. The dark design layered white at low alpha
// for every raised surface, border, divider and muted text — 320 literal
// rgba(255,255,255,α) values. On light the same ladder is black at the same
// alphas, so the whole family collapses to one variable with the alpha left
// inline. That preserves the exact elevation design instead of re-deciding it.
export const C = {
  bg:           "var(--bg)",
  onAccent:     "var(--on-accent)",
  recessed:     "var(--recessed)",
  scrim:        "var(--scrim)",
  bgCard:       "rgba(var(--overlay-rgb),0.04)",
  bgCard2:      "rgba(var(--overlay-rgb),0.06)",
  border:       "rgba(var(--overlay-rgb),0.08)",
  borderHover:  "rgba(var(--overlay-rgb),0.14)",
  borderStrong: "rgba(var(--overlay-rgb),0.14)",
  emerald:      "var(--accent)",
  emeraldSoft:  "rgba(var(--accent-rgb), 0.75)",
  emeraldDim:   "var(--accent-dim)",
  emeraldBorder:"var(--accent-border)",
  emeraldGlow:  "rgba(var(--accent-rgb), 0.45)",
  text:         "var(--text)",
  muted:        "var(--muted)",
  mutedStrong:  "rgba(var(--overlay-rgb),0.55)",
  faint:        "rgba(var(--overlay-rgb),0.32)",
  subtle:       "var(--subtle)",
  amber:        "var(--amber)",
  amberDim:     "var(--amber-dim)",
  amberBorder:  "var(--amber-border)",
  rose:         "var(--rose)",
  roseDim:      "var(--rose-dim)",
  roseBorder:   "var(--rose-border)",
  font: {
    display: '"Barlow Condensed", "Oswald", "Helvetica Neue", system-ui, sans-serif',
    body: '"Inter Tight", "Inter", -apple-system, "SF Pro Text", system-ui, sans-serif',
    mono: '"JetBrains Mono", "SF Mono", ui-monospace, Menlo, monospace',
  },
};

// ─── TYPOGRAPHY HELPERS ───────────────────────────────────────────────────────
export const display = (size, weight = 800) => ({
  fontFamily: C.font.display,
  fontWeight: weight,
  fontSize: size,
  letterSpacing: "-0.005em",
  lineHeight: 0.95,
});

export const eyebrow = {
  fontFamily: C.font.body,
  fontSize: 10.5,
  fontWeight: 600,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
};

export const mono = (size = 11) => ({
  fontFamily: C.font.mono,
  fontSize: size,
  letterSpacing: "0.05em",
  fontVariantNumeric: "tabular-nums",
});

// ─── ACCENT COLOUR SYSTEM ─────────────────────────────────────────────────────
export const ACCENT_COLORS = [
  { id: "emerald", hex: "#10b981", name: "Emerald"  },
  { id: "violet",  hex: "#8b5cf6", name: "Violet"   },
  { id: "sky",     hex: "#0ea5e9", name: "Sky"       },
  { id: "rose",    hex: "#f43f5e", name: "Rose"      },
  { id: "amber",   hex: "#f59e0b", name: "Amber"     },
  { id: "indigo",  hex: "#6366f1", name: "Indigo"    },
  { id: "lime",    hex: "#84cc16", name: "Lime"      },
  { id: "cyan",    hex: "#06b6d4", name: "Cyan"      },
  { id: "orange",  hex: "#f97316", name: "Orange"    },
  { id: "fuchsia", hex: "#d946ef", name: "Fuchsia"   },
  { id: "coral",   hex: "#fb7185", name: "Coral"     },
];

export function hexToRgbParts(hex) {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(",");
}

export function applyAccent(hex) {
  const rgb = hexToRgbParts(hex);
  const root = document.documentElement;
  root.style.setProperty("--accent",        hex);
  root.style.setProperty("--accent-rgb",    rgb);
  root.style.setProperty("--accent-dim",    `rgba(${rgb},0.15)`);
  root.style.setProperty("--accent-border", `rgba(${rgb},0.3)`);
}


// ─── THEME SYSTEM ─────────────────────────────────────────────────────────────
// Three modes: "dark", "light", "system". System follows prefers-color-scheme and
// keeps following it — the listener stays attached so a change at sunset applies
// without a reload.

export const THEMES = {
  dark: {
    "--bg":           "#020617",
    "--text":         "#f8fafc",
    "--muted":        "#64748b",
    "--subtle":       "#334155",
    "--overlay-rgb":  "255,255,255",
    "--amber":        "#f59e0b",
    "--amber-dim":    "rgba(245,158,11,0.08)",
    "--amber-border": "rgba(245,158,11,0.30)",
    "--rose":         "#f43f5e",
    "--rose-dim":     "rgba(244,63,94,0.08)",
    "--rose-border":  "rgba(244,63,94,0.30)",
    "--scrim":        "rgba(2,6,23,0.72)",
    "--recessed":     "rgba(0,0,0,0.30)",
    "--on-accent":    "#020617",
  },
  light: {
    // Not pure white: #f7f8fa keeps the black-alpha surface ladder visible, which
    // pure white flattens. Text is the dark bg inverted rather than pure black,
    // so the two themes read as one design.
    "--bg":           "#f7f8fa",
    "--text":         "#0f172a",
    "--muted":        "#5b6675",
    "--subtle":       "#94a3b8",
    "--overlay-rgb":  "0,0,0",
    // Amber and rose are darkened for contrast against a light ground; the dark
    // values are tuned to glow on near-black and fail WCAG AA on white.
    "--amber":        "#b45309",
    "--amber-dim":    "rgba(180,83,9,0.10)",
    "--amber-border": "rgba(180,83,9,0.32)",
    "--rose":         "#be123c",
    "--rose-dim":     "rgba(190,18,60,0.10)",
    "--rose-border":  "rgba(190,18,60,0.32)",
    "--scrim":        "rgba(15,23,42,0.45)",
    "--recessed":     "rgba(0,0,0,0.05)",
    "--on-accent":    "#020617",
  },
};

export const THEME_STORAGE_KEY = "jf_theme";

/** Resolve "system" to the OS preference; "dark"/"light" pass through. */
export function resolveTheme(mode) {
  if (mode === "light" || mode === "dark") return mode;
  return (typeof window !== "undefined"
    && window.matchMedia?.("(prefers-color-scheme: light)").matches) ? "light" : "dark";
}

/** Write a resolved palette onto :root and sync the browser chrome colour. */
export function applyTheme(mode) {
  const resolved = resolveTheme(mode);
  const root = document.documentElement;
  for (const [k, v] of Object.entries(THEMES[resolved])) root.style.setProperty(k, v);
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", THEMES[resolved]["--bg"]);
  return resolved;
}

/**
 * Keep "system" live. Returns an unsubscribe function.
 * Only reacts while the stored mode is still "system".
 */
export function watchSystemTheme(getMode) {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mq = window.matchMedia("(prefers-color-scheme: light)");
  const onChange = () => { if (getMode() === "system") applyTheme("system"); };
  mq.addEventListener?.("change", onChange);
  return () => mq.removeEventListener?.("change", onChange);
}

/**
 * Resolved token values for consumers that cannot read CSS variables:
 * canvas 2D contexts and SVG presentation attributes.
 */
export function themeValue(name, fallback = "") {
  if (typeof window === "undefined") return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

/** rgba() built from --overlay-rgb, for canvas and SVG attributes. */
export function overlay(alpha) {
  return `rgba(${themeValue("--overlay-rgb", "255,255,255")},${alpha})`;
}
