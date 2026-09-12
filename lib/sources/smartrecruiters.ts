// SmartRecruiters public Posting API. Docs: https://developers.smartrecruiters.com/docs/posting-api
// No API key required for reads. The list endpoint returns partial data
// only — full description requires a per-posting detail fetch, so we
// only do that for jobs that already passed the title filter, to keep
// the number of extra requests small.

import type { NormalizedJob } from "./types";
import { PM_TITLE_MATCH, stripHtml } from "./shared";

interface SmartRecruitersListItem {
  id: string;
  name: string;
  releasedDate: string;
  location?: { city?: string; region?: string; country?: string };
  ref: string; // full detail URL
}

interface SmartRecruitersListResponse {
  content: SmartRecruitersListItem[];
  totalFound: number;
}

interface SmartRecruitersDetail {
  id: string;
  name: string;
  jobAd?: {
    sections?: Record<string, { title?: string; text?: string }>;
  };
}

function extractDescription(detail: SmartRecruitersDetail): string {
  const sections = detail.jobAd?.sections;
  if (!sections) return "";
  return Object.values(sections)
    .map((s) => stripHtml(s.text ?? ""))
    .filter(Boolean)
    .join("\n\n");
}

export async function fetchSmartRecruitersJobs(
  companyName: string,
  companyIdentifier: string
): Promise<NormalizedJob[]> {
  const allItems: SmartRecruitersListItem[] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const res = await fetch(
      `https://api.smartrecruiters.com/v1/companies/${companyIdentifier}/postings?limit=${limit}&offset=${offset}`
    );
    if (!res.ok) {
      throw new Error(
        `SmartRecruiters request failed (${res.status}) for company "${companyIdentifier}"`
      );
    }

    const data: SmartRecruitersListResponse = await res.json();
    allItems.push(...data.content);

    offset += data.content.length;
    if (data.content.length === 0 || offset >= data.totalFound) break;
  }

  const matched = allItems.filter((item) => PM_TITLE_MATCH.test(item.name));

  const jobs: NormalizedJob[] = [];
  for (const item of matched) {
    let description = "";
    try {
      const detailRes = await fetch(
        `https://api.smartrecruiters.com/v1/companies/${companyIdentifier}/postings/${item.id}`
      );
      if (detailRes.ok) {
        const detail: SmartRecruitersDetail = await detailRes.json();
        description = extractDescription(detail);
      }
    } catch {
      // Fall through with empty description rather than losing the job.
    }

    const locationRaw = [item.location?.city, item.location?.country]
      .filter(Boolean)
      .join(", ");

    jobs.push({
      title: item.name,
      companyName,
      locationRaw,
      remoteFlagRaw: null,
      description,
      originalPostedAt: item.releasedDate ?? null,
      sourceUrl: `https://jobs.smartrecruiters.com/${companyIdentifier}/${item.id}`,
      sourceJobId: item.id,
      rawPayload: item,
    });
  }

  return jobs;
}
