// Jooble API client. Docs: https://jooble.org/api/about
// Free official API — request a key at https://jooble.org/api/about, no
// approval wait, key emailed directly.
//
// Note: Jooble returns truncated description snippets, not full job
// text — this may weaken AI compatibility scoring for jobs from this
// source compared to sources with full descriptions.

import type { NormalizedJob } from "./types";

interface JoobleJob {
  id: string;
  title: string;
  location: string;
  snippet: string;
  salary: string;
  source: string;
  type: string;
  link: string;
  company: string;
  updated: string; // e.g. "2026-09-01 12:00:00"
}

interface JoobleResponse {
  totalCount: number;
  jobs: JoobleJob[];
}

const QUERIES = [
  { keywords: "Product Manager", location: "Poznań" },
  { keywords: "Product Manager remote", location: "Poland" },
];

function parseJoobleDate(value: string): string | null {
  if (!value) return null;
  const parsed = new Date(value.replace(" ", "T"));
  return isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export async function fetchJoobleJobs(): Promise<NormalizedJob[]> {
  const apiKey = process.env.JOOBLE_API_KEY;
  if (!apiKey) {
    throw new Error("Missing JOOBLE_API_KEY.");
  }

  const allJobs: NormalizedJob[] = [];

  for (const query of QUERIES) {
    const res = await fetch(`https://jooble.org/api/${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(query),
    });

    if (!res.ok) {
      throw new Error(
        `Jooble request failed (${res.status}) for query "${query.keywords}" / "${query.location}"`
      );
    }

    const data: JoobleResponse = await res.json();

    for (const job of data.jobs ?? []) {
      allJobs.push({
        title: job.title,
        companyName: job.company || "Unknown",
        locationRaw: job.location ?? "",
        remoteFlagRaw: null, // Jooble doesn't expose this as structured data
        description: job.snippet ?? "",
        originalPostedAt: parseJoobleDate(job.updated),
        sourceUrl: job.link,
        sourceJobId: job.id,
        rawPayload: job,
      });
    }
  }

  return allJobs;
}
