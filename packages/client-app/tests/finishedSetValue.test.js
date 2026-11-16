import { describe, it, expect } from "vitest";
import { finishedSetValue } from "../src/timerFace.js";

describe("finishedSetValue — what Set afronden records", () => {
  it("records the rep counter for a rep-based set", () => {
    expect(finishedSetValue({ timeBased: false, running: false, remaining: 0, total: 30, repCount: 7 })).toBe(7);
  });
  it("records the prescribed seconds for a timed set whose clock was never started", () => {
    expect(finishedSetValue({ timeBased: true, running: false, remaining: 0, total: 30, repCount: 0 })).toBe(30);
  });
  it("records the elapsed seconds while the clock runs", () => {
    expect(finishedSetValue({ timeBased: true, running: true, remaining: 12, total: 30, repCount: 0 })).toBe(18);
  });
  it("never records a negative or over-long value", () => {
    expect(finishedSetValue({ timeBased: true, running: true, remaining: 99, total: 30, repCount: 0 })).toBe(0);
    expect(finishedSetValue({ timeBased: true, running: true, remaining: -5, total: 30, repCount: 0 })).toBe(30);
  });
});
