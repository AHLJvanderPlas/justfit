import { describe, it, expect } from "vitest";
import { safeAccent, DEFAULT_ACCENT, ACCENT_COLORS } from "../src/tokens.js";

describe("safeAccent — a stored accent can never break the app", () => {
  it("keeps every palette colour", () => {
    for (const c of ACCENT_COLORS) expect(safeAccent(c.hex)).toBe(c.hex);
  });
  it("falls back to the default for anything that is not #rrggbb", () => {
    for (const bad of ["amber", "", null, undefined, 42, "#fff", "rgb(1,2,3)", "#12345g"]) expect(safeAccent(bad)).toBe(DEFAULT_ACCENT);
  });
});
