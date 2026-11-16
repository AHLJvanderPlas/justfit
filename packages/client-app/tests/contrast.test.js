// UX review C, finding 7 — WCAG 2.1 AA contrast, computed from the real token source.
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { THEMES, ACCENT_COLORS } from "../src/tokens.js";
import { contrast, luminance, composite, surfaces, accentText, accentTextSurfaces, onAccent, parseColor, toHex } from "../src/contrast.js";
import { auditThemes, auditCss, auditJsx, auditLogin, accentsNeedingVariant } from "../src/contrastAudit.js";

describe("contrast maths", () => {
  it("matches the published WCAG values", () => {
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrast("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
    expect(luminance("#ffffff")).toBeCloseTo(1, 5);
    // the review's number: #64748b on #020617 is 4.25:1
    expect(contrast("#64748b", "#020617")).toBeCloseTo(4.24, 1);
  });
  it("composites a translucent colour on its background before comparing", () => {
    const c = composite("rgba(255,255,255,0.04)", "#020617");
    expect(toHex(c)).toBe("#0c1020");
    expect(contrast("rgba(255,255,255,1)", "#020617")).toBeCloseTo(contrast("#ffffff", "#020617"), 5);
  });
  it("parses hex, rgb and rgba", () => {
    expect(parseColor("#fff")).toEqual({ r: 255, g: 255, b: 255, a: 1 });
    expect(parseColor("rgba(1,2,3,0.5)")).toEqual({ r: 1, g: 2, b: 3, a: 0.5 });
    expect(parseColor("1,2,3")).toEqual({ r: 1, g: 2, b: 3, a: 1 });
    expect(() => parseColor("blue")).toThrow();
  });
});

describe("the token source meets WCAG 2.1 AA", () => {
  it("every audited pair passes in both themes (text 4.5, ring and disabled 3)", () => {
    expect(auditThemes({ THEMES, ACCENT_COLORS })).toEqual([]);
  });
  it("the old dark --muted (#64748b) fails the audit — the guard can fail", () => {
    const old = { ...THEMES, dark: { ...THEMES.dark, "--muted": "#64748b" } };
    const fails = auditThemes({ THEMES: old, ACCENT_COLORS });
    expect(fails.some((f) => f.includes("dark --muted"))).toBe(true);
  });
  it("a raw accent as light-theme text fails, the derived variant passes", () => {
    const needs = accentsNeedingVariant({ THEMES, ACCENT_COLORS }, "light");
    expect(needs.length).toBe(ACCENT_COLORS.length); // every accent is too light as text on #f7f8fa
    for (const a of ACCENT_COLORS) {
      const v = accentText(a.hex, THEMES.light, "light");
      for (const s of accentTextSurfaces(a.hex, THEMES.light)) expect(contrast(v, s)).toBeGreaterThanOrEqual(4.5);
    }
  });
  it("dark: only the accents that fail as text get a variant; the rest are unchanged", () => {
    const needs = accentsNeedingVariant({ THEMES, ACCENT_COLORS }, "dark");
    expect(needs.sort()).toEqual(["fuchsia", "indigo", "rose", "violet"]);
    for (const a of ACCENT_COLORS) {
      const v = accentText(a.hex, THEMES.dark, "dark");
      expect(v === a.hex).toBe(!needs.includes(a.id));
    }
  });
  it("the variant keeps the accent's hue direction (a tint or a shade, never another colour)", () => {
    const v = parseColor(accentText("#10b981", THEMES.light, "light"));
    expect(v.g).toBeGreaterThan(v.r); expect(v.g).toBeGreaterThan(v.b);
  });
  it("dark ink on the accent-filled button reads >= 4.5:1 for all 11 accents; onAccent() agrees", () => {
    for (const a of ACCENT_COLORS) {
      expect(contrast(THEMES.dark["--on-accent"], a.hex)).toBeGreaterThanOrEqual(4.5);
      expect(onAccent(a.hex)).toBe("#020617");
    }
  });
  it("sheets and cards are the surfaces text sits on", () => {
    const s = surfaces(THEMES.dark);
    expect(Object.keys(s).sort()).toEqual(["card", "card2", "page", "sheet", "sheetCard"]);
  });
  it("the muted / subtle-text ladder has a visible step on the page, both themes", () => {
    for (const th of ["dark", "light"]) {
      const p = THEMES[th]; const page = surfaces(p).page;
      const r = ["--text", "--text-soft", "--muted", "--subtle-text"].map((t) => contrast(p[t], page));
      for (let i = 1; i < r.length; i++) expect(r[i - 1] / r[i]).toBeGreaterThan(1.1);
    }
  });
});

describe("source guards (what smoke runs)", () => {
  const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), "utf8");
  it("styles.css: placeholders read --muted, no text in raw --accent / --subtle", () => {
    expect(auditCss(read("src/styles.css"))).toEqual([]);
    expect(auditCss("a { color: var(--accent); }").some((f) => f.includes("--accent-text"))).toBe(true);
    expect(auditCss("a { color: var(--subtle); }").some((f) => f.includes("--subtle-text"))).toBe(true);
  });
  it("JSX: no text in C.emerald / C.subtle", () => {
    expect(auditJsx("x.jsx", "<div style={{ color: C.accentText }} />")).toEqual([]);
    expect(auditJsx("x.jsx", "<div style={{ color: on ? C.emerald : C.muted }} />").length).toBe(1);
    expect(auditJsx("x.jsx", "<div style={{ background: C.emerald, color: C.subtle }} />").length).toBe(1);
  });
  it("login.html: its tokens and literal colours pass; the old coral button text fails", () => {
    const html = read("public/login.html");
    expect(auditLogin(html)).toEqual([]);
    expect(auditLogin(html.replace("--on-accent: #020617", "--on-accent: #ffffff")).some((f) => f.includes("coral button"))).toBe(true);
    expect(auditLogin(html.replace("--muted: #8f9db2", "--muted: #64748b")).some((f) => f.includes("--muted"))).toBe(true);
    expect(auditLogin(html.replace("color: var(--muted); margin-bottom: 8px;", "color: #334155; margin-bottom: 8px;")).some((f) => f.includes("#334155"))).toBe(true);
  });
  it("prepaint.js carries the same --muted as tokens.js", () => {
    const pre = read("public/prepaint.js");
    expect(pre).toContain(`"--muted": "${THEMES.dark["--muted"]}"`);
    expect(pre).toContain(`"--muted": "${THEMES.light["--muted"]}"`);
  });
});
