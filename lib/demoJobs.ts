import type { JobListItem } from "@/lib/jobs";

// The demo has no backend at all — a status change just rewrites this one
// localStorage key with the whole array, mirroring Movie Shelf's demo.
const DEMO_STORAGE_KEY = "jobHub.demoJobs";

export function loadDemoJobs(fallback: JobListItem[]): JobListItem[] {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(DEMO_STORAGE_KEY);
    if (!raw) return fallback;
    return JSON.parse(raw) as JobListItem[];
  } catch {
    return fallback;
  }
}

export function saveDemoJobs(jobs: JobListItem[]) {
  try {
    window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(jobs));
  } catch {
    // Best-effort — demo persistence failing silently is an acceptable
    // outcome (e.g. private browsing with storage blocked).
  }
}
