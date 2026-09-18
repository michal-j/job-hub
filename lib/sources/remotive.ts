// Remotive API client. Docs: https://remotive.com/api-documentation
// No API key required.

import type { NormalizedJob } from "./types";

interface RemotiveJob {
  id: number;
  url: string;
  title: string;
  company_name: string;
  company_logo: string | null;
  category: string;
  job_type: string;
  publication_date: string; // ISO
  candidate_required_location: string; // e.g. "USA only", "Europe", "Worldwide"
  description: string;
}

interface RemotiveResponse {
  jobs: RemotiveJob[];
}

// Remotive's `search` param only accepts one phrase per call, so we
// fetch once per title variant and merge — ingestion dedups by
// title+company+location, so overlap between calls is harmless.
const SEARCH_TERMS = ["Product Manager", "Head of Product", "Product Operations"];

export async function fetchRemotiveJobs(): Promise<NormalizedJob[]> {
  const allJobs: NormalizedJob[] = [];

  for (const term of SEARCH_TERMS) {
    const params = new URLSearchParams({ search: term });
    const url = `https://remotive.com/api/remote-jobs?${params.toString()}`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Remotive request failed (${res.status}) for search "${term}"`);
    }

    const data: RemotiveResponse = await res.json();

    for (const job of data.jobs) {
      allJobs.push({
        title: job.title,
        companyName: job.company_name,
        companyLogoUrl: job.company_logo || null,
        // candidate_required_location is exactly the "where can they employ
        // someone" signal the product spec cares about — kept as-is in
        // location_raw and the raw payload for now; classification logic
        // comes later.
        locationRaw: job.candidate_required_location,
        remoteFlagRaw: "remote", // Remotive is remote-only by definition
        description: job.description,
        originalPostedAt: job.publication_date,
        sourceUrl: job.url,
        sourceJobId: String(job.id),
        rawPayload: job,
      });
    }
  }

  return allJobs;
}
