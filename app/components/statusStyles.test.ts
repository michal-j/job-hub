import { describe, expect, it } from "vitest";
import { statusColorVar } from "./statusStyles";

describe("statusColorVar", () => {
  const knownStatuses = [
    "new",
    "interested",
    "applied",
    "interviewing",
    "rejected",
    "offer",
    "not_interested",
  ];

  it.each(knownStatuses)("maps %s to its own CSS variable", (status) => {
    expect(statusColorVar(status)).toBe(`var(--status-${status})`);
  });

  it("falls back to the 'new' color for an unrecognized status", () => {
    expect(statusColorVar("some_future_status")).toBe("var(--status-new)");
  });

  it("falls back to the 'new' color for an empty string", () => {
    expect(statusColorVar("")).toBe("var(--status-new)");
  });
});
