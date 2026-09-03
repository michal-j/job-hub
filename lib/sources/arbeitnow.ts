// Arbeitnow API client. Docs: https://www.arbeitnow.com/api/job-board-api
// No API key required. Returns all current listings (paginated); this
// endpoint doesn't support server-side keyword search, so we filter by
// title client-side.

import type { NormalizedJob } from "./types";

interface ArbeitnowJob {
  slug: string;
  company_name: string;
  title: string;
  description: string;
  remote: boolean;
  url: string;
  tags: string[];
  job_types: string[];
  location: string;
  created_at: number; // unix seconds
}

interface ArbeitnowResponse {
  data: ArbeitnowJob[];
  links: { next: string | null };
}

const TITLE_MATCH = /product\s*(manager|owner)/i;

export async function fetchArbeitnowJobs(): Promise<NormalizedJob[]> {
  const allJobs: NormalizedJob[] = [];
  let url: string | null = "https://www.arbeitnow.com/api/job-board-api";
  let pagesFetched = 0;
  const MAX_PAGES = 10; // safety cap — listings are date-sorted, this is well past a day's worth of new postings

  while (url && pagesFetched < MAX_PAGES) {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Arbeitnow request failed (${res.status})`);
    }

    const data: ArbeitnowResponse = await res.json();
    pagesFetched++;

    for (const job of data.data) {
      if (!TITLE_MATCH.test(job.title)) continue;

      allJobs.push({
        title: job.title,
        companyName: job.company_name,
        locationRaw: job.location,
        remoteFlagRaw: job.remote ? "remote" : null,
        description: job.description,
        originalPostedAt: new Date(job.created_at * 1000).toISOString(),
        sourceUrl: job.url,
        sourceJobId: job.slug,
        rawPayload: job,
      });
    }

    url = data.links?.next ?? null;
  }

  return allJobs;
}
