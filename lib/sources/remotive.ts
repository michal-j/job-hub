// Remotive API client. Docs: https://remotive.com/api-documentation
// No API key required.

import type { NormalizedJob } from "./types";

interface RemotiveJob {
  id: number;
  url: string;
  title: string;
  company_name: string;
  category: string;
  job_type: string;
  publication_date: string; // ISO
  candidate_required_location: string; // e.g. "USA only", "Europe", "Worldwide"
  description: string;
}

interface RemotiveResponse {
  jobs: RemotiveJob[];
}

export async function fetchRemotiveJobs(): Promise<NormalizedJob[]> {
  const params = new URLSearchParams({ search: "Product Manager" });
  const url = `https://remotive.com/api/remote-jobs?${params.toString()}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Remotive request failed (${res.status})`);
  }

  const data: RemotiveResponse = await res.json();

  return data.jobs.map((job) => ({
    title: job.title,
    companyName: job.company_name,
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
  }));
}
