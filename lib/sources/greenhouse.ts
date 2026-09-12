// Greenhouse public Job Board API. Docs: https://developers.greenhouse.io/job-board.html
// No API key required for reads.

import type { NormalizedJob } from "./types";
import { PM_TITLE_MATCH, stripHtml } from "./shared";

interface GreenhouseJob {
  id: number;
  title: string;
  updated_at: string;
  absolute_url: string;
  location: { name: string } | null;
  content: string; // HTML
}

interface GreenhouseResponse {
  jobs: GreenhouseJob[];
}

export async function fetchGreenhouseJobs(
  companyName: string,
  boardToken: string
): Promise<NormalizedJob[]> {
  const res = await fetch(
    `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs?content=true`
  );

  if (!res.ok) {
    throw new Error(
      `Greenhouse request failed (${res.status}) for board "${boardToken}"`
    );
  }

  const data: GreenhouseResponse = await res.json();

  return data.jobs
    .filter((job) => PM_TITLE_MATCH.test(job.title))
    .map((job) => {
      const locationName = job.location?.name ?? "";
      return {
        title: job.title,
        companyName,
        locationRaw: locationName,
        remoteFlagRaw: /remote/i.test(locationName) ? "remote" : null,
        description: stripHtml(job.content ?? ""),
        originalPostedAt: job.updated_at ?? null,
        sourceUrl: job.absolute_url,
        sourceJobId: String(job.id),
        rawPayload: job,
      };
    });
}
