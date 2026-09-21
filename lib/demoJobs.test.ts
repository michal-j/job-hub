import { beforeEach, describe, expect, it } from "vitest";
import { loadDemoJobs, saveDemoJobs } from "./demoJobs";
import type { JobListItem } from "./jobs";

function makeJob(overrides: Partial<JobListItem> = {}): JobListItem {
  return {
    id: "job-1",
    title: "Product Manager",
    companyName: "Acme",
    companyLogoUrl: null,
    locationRaw: "Berlin",
    originalPostedAt: "2026-09-01T00:00:00.000Z",
    discoveredAt: "2026-09-01T00:00:00.000Z",
    status: "new",
    sourceUrl: "https://example.com/job-1",
    sourceName: "sample",
    isNew: true,
    compatibility: null,
    locationFit: null,
    ...overrides,
  };
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("loadDemoJobs", () => {
  it("returns the fallback when nothing is stored yet", () => {
    const fallback = [makeJob()];
    expect(loadDemoJobs(fallback)).toEqual(fallback);
  });

  it("returns whatever was previously saved, not the fallback", () => {
    const fallback = [makeJob({ id: "fallback" })];
    const saved = [makeJob({ id: "saved", status: "interested" })];

    saveDemoJobs(saved);

    expect(loadDemoJobs(fallback)).toEqual(saved);
  });

  it("falls back gracefully if the stored value is corrupt JSON", () => {
    window.localStorage.setItem("jobHub.demoJobs", "{not valid json");
    const fallback = [makeJob()];

    expect(loadDemoJobs(fallback)).toEqual(fallback);
  });
});

describe("saveDemoJobs", () => {
  it("persists the whole array under one key, overwriting the previous save", () => {
    saveDemoJobs([makeJob({ id: "first" })]);
    saveDemoJobs([makeJob({ id: "second" }), makeJob({ id: "third" })]);

    const raw = window.localStorage.getItem("jobHub.demoJobs");
    const parsed = JSON.parse(raw!);

    expect(parsed).toHaveLength(2);
    expect(parsed.map((j: JobListItem) => j.id)).toEqual(["second", "third"]);
  });
});
