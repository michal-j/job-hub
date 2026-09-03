// Adzuna API client. Docs: https://developer.adzuna.com/docs/search
// Free tier: sign up at developer.adzuna.com for an app_id + app_key.

import type { NormalizedJob } from "./types";

interface AdzunaResult {
  id: string;
  title: string;
  company?: { display_name?: string };
  location?: { display_name?: string };
  description?: string;
  created?: string;
  redirect_url: string;
}

interface AdzunaResponse {
  results: AdzunaResult[];
}

// One query per (keyword, location) combination we care about for V1:
// Poznań-based roles, and a broader "remote" keyword search within Poland's
// listings (Adzuna doesn't expose a structured remote filter — this is a
// best-effort keyword pass; refine once we see real result quality).
const QUERIES = [
  { what: "Product Manager", where: "Poznań" },
  { what: "Product Manager remote", where: "" },
];

export async function fetchAdzunaJobs(): Promise<NormalizedJob[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) {
    throw new Error("Missing ADZUNA_APP_ID or ADZUNA_APP_KEY.");
  }

  const allJobs: NormalizedJob[] = [];

  for (const query of QUERIES) {
    const params = new URLSearchParams({
      app_id: appId,
      app_key: appKey,
      what: query.what,
      results_per_page: "50",
      "content-type": "application/json",
      max_days_old: "14",
    });
    if (query.where) params.set("where", query.where);

    const url = `https://api.adzuna.com/v1/api/jobs/pl/search/1?${params.toString()}`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(
        `Adzuna request failed (${res.status}) for query "${query.what}" / "${query.where}"`
      );
    }

    const data: AdzunaResponse = await res.json();

    for (const result of data.results) {
      allJobs.push({
        title: result.title,
        companyName: result.company?.display_name ?? "Unknown",
        locationRaw: result.location?.display_name ?? "",
        remoteFlagRaw: null, // Adzuna doesn't expose this as structured data
        description: result.description ?? "",
        originalPostedAt: result.created ?? null,
        sourceUrl: result.redirect_url,
        sourceJobId: result.id,
        rawPayload: result,
      });
    }
  }

  return allJobs;
}
