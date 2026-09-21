import { describe, expect, it } from "vitest";
import { computeDedupHash } from "./dedup";

describe("computeDedupHash", () => {
  it("is stable for identical input", () => {
    const a = computeDedupHash("Product Manager", "Acme", "Berlin");
    const b = computeDedupHash("Product Manager", "Acme", "Berlin");
    expect(a).toBe(b);
  });

  it("is case-insensitive", () => {
    const a = computeDedupHash("Product Manager", "Acme", "Berlin");
    const b = computeDedupHash("PRODUCT MANAGER", "acme", "BERLIN");
    expect(a).toBe(b);
  });

  it("ignores trailing/leading whitespace — the 'Creative Force ' vs 'Creative Force' case", () => {
    const a = computeDedupHash("Product Manager", "Creative Force", "Berlin");
    const b = computeDedupHash("Product Manager", "Creative Force ", "Berlin");
    expect(a).toBe(b);
  });

  it("ignores punctuation differences", () => {
    const a = computeDedupHash("Product Manager (Remote)", "Acme, Inc.", "Berlin");
    const b = computeDedupHash("Product Manager Remote", "Acme Inc", "Berlin");
    expect(a).toBe(b);
  });

  it("strips accents so equivalent names collapse to the same hash", () => {
    const a = computeDedupHash("Product Manager", "Zażółć", "Kraków");
    const b = computeDedupHash("Product Manager", "Zazolc", "Krakow");
    expect(a).toBe(b);
  });

  it("does NOT collapse genuinely different listings", () => {
    const a = computeDedupHash("Product Manager", "Acme", "Berlin");
    const b = computeDedupHash("Product Manager", "Acme", "Munich");
    expect(a).not.toBe(b);
  });
});
