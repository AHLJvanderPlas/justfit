// UX review C, finding 8 — the shared dialog helper and the announcer's timer cues (pure parts, no DOM).
import { describe, it, expect } from "vitest";
import { nextFocus, dialogKey, reachable, dialogAttrs, activateKey, FOCUSABLE } from "../src/useDialog.js";
import { timerCue, announce, subscribe } from "../src/announce.js";

const el = (name, extra = {}) => ({ name, offsetParent: {}, hidden: false, getAttribute: () => null, ...extra });

describe("nextFocus (Tab trap)", () => {
  const a = el("a"), b = el("b"), c = el("c");
  const items = [a, b, c];
  it("wraps forward from the last control to the first", () => { expect(nextFocus(items, c, false)).toBe(a); });
  it("wraps backward from the first control to the last", () => { expect(nextFocus(items, a, true)).toBe(c); });
  it("lets the browser move inside the dialog", () => {
    expect(nextFocus(items, b, false)).toBeNull();
    expect(nextFocus(items, b, true)).toBeNull();
  });
  it("pulls focus back in when it is on the dialog root or outside", () => {
    expect(nextFocus(items, el("root"), false)).toBe(a);
    expect(nextFocus(items, el("outside"), true)).toBe(c);
  });
  it("a dialog with nothing focusable keeps focus on its root", () => {
    const root = el("root");
    expect(nextFocus([], null, false, root)).toBe(root);
  });
});

describe("dialogKey", () => {
  const items = [el("a"), el("b")];
  const base = { items, active: items[1], container: el("root") };
  it("Escape closes when the dialog can be closed", () => {
    expect(dialogKey({ key: "Escape" }, { ...base, onClose: () => {} })).toBe("close");
  });
  it("Escape does nothing on a gate (no onClose)", () => {
    expect(dialogKey({ key: "Escape" }, { ...base, onClose: null })).toBeNull();
  });
  it("Tab on the last control returns the first", () => {
    expect(dialogKey({ key: "Tab", shiftKey: false }, { ...base, onClose: null })).toEqual({ focus: items[0] });
  });
  it("other keys are ignored", () => { expect(dialogKey({ key: "a" }, { ...base, onClose: () => {} })).toBeNull(); });
});

describe("helpers", () => {
  it("reachable drops hidden, aria-hidden and detached elements", () => {
    const shown = el("shown");
    const list = [shown, el("hidden", { hidden: true }), el("aria", { getAttribute: (k) => (k === "aria-hidden" ? "true" : null) }), el("detached", { offsetParent: null })];
    expect(reachable(list)).toEqual([shown]);
  });
  it("dialogAttrs carries role, aria-modal, the label and tabIndex -1", () => {
    expect(dialogAttrs("Hallo")).toEqual({ role: "dialog", "aria-modal": "true", "aria-label": "Hallo", tabIndex: -1 });
  });
  it("the focusable selector skips disabled controls and tabindex -1", () => {
    expect(FOCUSABLE).toContain("button:not([disabled])");
    expect(FOCUSABLE).toContain('[tabindex]:not([tabindex="-1"])');
  });
  it("activateKey fires on Enter and Space only", () => {
    let n = 0; const fn = activateKey(() => { n += 1; });
    const ev = (key) => ({ key, preventDefault() {} });
    fn(ev("Enter")); fn(ev(" ")); fn(ev("a"));
    expect(n).toBe(2);
  });
});

describe("timerCue — announce at sensible moments only", () => {
  it("speaks at the start, 10 s, 5 s and the end of a 30 s timer — nothing in between", () => {
    const cues = [];
    for (let r = 30; r >= 0; r--) { const c = timerCue(r, 30); if (c) cues.push([r, c]); }
    expect(cues).toEqual([[30, "start"], [10, "ten"], [5, "five"], [0, "done"]]);
  });
  it("a short rest skips cues it cannot reach", () => {
    const cues = [];
    for (let r = 8; r >= 0; r--) { const c = timerCue(r, 8); if (c) cues.push(c); }
    expect(cues).toEqual(["start", "five", "done"]);
  });
  it("announce() reaches subscribers with its mode, and ignores empty text", () => {
    const got = []; const off = subscribe((m) => got.push(m));
    announce("Set 1 van 3 klaar"); announce(""); announce("Fout", "assertive");
    off(); announce("niemand");
    expect(got.map((g) => [g.message, g.mode])).toEqual([["Set 1 van 3 klaar", "polite"], ["Fout", "assertive"]]);
  });
});
