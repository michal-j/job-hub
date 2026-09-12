// Ashby public Job Board API. Docs: https://developers.ashbyhq.com/reference/jobboardapi
// No API key required for reads.

import type { NormalizedJob } from "./types";
import { PM_TITLE_MATCH, stripHtml } from "./shared";

interface AshbyJob {
  id: string;
  title: string;
  location: string;
  isListed: boolean;
  publishedAt: string;
  jobUrl: string;
  applyUrl: string;
  descriptionHtml?: string;
  isRemote?: boolean;
}

interface AshbyResponse {
  jobs: AshbyJob[];
}

export async function fetchAshbyJobs(
  companyName: string,
  boardName: string
): Promise<NormalizedJob[]> {
  const res = await fetch(
    `https://api.ashbyhq.com/posting-api/job-board/${boardName}?includeCompensation=true`
  );

  if (!res.ok) {
    throw new Error(
      `Ashby request failed (${res.status}) for board "${boardName}"`
    );
  }

  const data: AshbyResponse = await res.json();

  return (data.jobs ?? [])
    .filter((job) => job.isListed !== false && PM_TITLE_MATCH.test(job.title))
    .map((job) => ({
      title: job.title,
      companyName,
      locationRaw: job.location ?? "",
      remoteFlagRaw: job.isRemote ? "remote" : null,
      description: stripHtml(job.descriptionHtml ?? ""),
      originalPostedAt: job.publishedAt ?? null,
      sourceUrl: job.jobUrl || job.applyUrl,
      sourceJobId: job.id,
      rawPayload: job,
    }));
}
