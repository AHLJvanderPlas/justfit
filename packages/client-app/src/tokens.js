// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
export const C = {
  bg: "#020617",
  bgCard: "rgba(255,255,255,0.04)",
  bgCard2: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.08)",
  borderHover: "rgba(255,255,255,0.14)",
  borderStrong: "rgba(255,255,255,0.14)",
  emerald: "var(--accent)",
  emeraldSoft: "rgba(var(--accent-rgb), 0.75)",
  emeraldDim: "var(--accent-dim)",
  emeraldBorder: "var(--accent-border)",
  emeraldGlow: "rgba(var(--accent-rgb), 0.45)",
  text: "#f8fafc",
  muted: "#64748b",
  mutedStrong: "rgba(255,255,255,0.55)",
  faint: "rgba(255,255,255,0.32)",
  subtle: "#334155",
  amber: '#f59e0b',
  amberDim: 'rgba(245,158,11,0.08)',
  amberBorder: 'rgba(245,158,11,0.3)',
  rose: '#f43f5e',
  roseDim: 'rgba(244,63,94,0.08)',
  roseBorder: 'rgba(244,63,94,0.3)',
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
  { id: "rose",    hex: C.rose,    name: "Rose"      },
  { id: "amber",   hex: C.amber,   name: "Amber"     },
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
