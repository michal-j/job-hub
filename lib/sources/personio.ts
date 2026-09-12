// Personio public XML job feed. Docs: https://developer.personio.de/docs/retrieving-open-job-positions
// No API key required. Officially documented by Personio for external
// career-site integration.

import { XMLParser } from "fast-xml-parser";
import type { NormalizedJob } from "./types";
import { PM_TITLE_MATCH, stripHtml } from "./shared";

interface PersonioJobDescription {
  name: string;
  value: string;
}

interface PersonioPosition {
  id: number | string;
  office?: string;
  additionalOffices?: { office?: string | string[] };
  department?: string;
  name: string;
  jobDescriptions?: { jobDescription?: PersonioJobDescription | PersonioJobDescription[] };
  createdAt?: string;
}

function toArray<T>(value: T | T[] | undefined | null): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

export async function fetchPersonioJobs(
  companyName: string,
  slug: string
): Promise<NormalizedJob[]> {
  const res = await fetch(`https://${slug}.jobs.personio.de/xml?language=en`);

  if (!res.ok) {
    throw new Error(
      `Personio request failed (${res.status}) for slug "${slug}"`
    );
  }

  const xmlText = await res.text();

  // Personio sometimes serves an HTML page instead of the XML feed for
  // accounts with the feed disabled — fail clearly rather than trying to
  // parse HTML as XML and silently returning nothing.
  if (!xmlText.trim().startsWith("<?xml")) {
    throw new Error(
      `Personio slug "${slug}" did not return an XML feed — the feed may be disabled for this account.`
    );
  }

  const parser = new XMLParser();
  const parsed = parser.parse(xmlText);
  const positions = toArray<PersonioPosition>(
    parsed?.["workzag-jobs"]?.position
  );

  return positions
    .filter((pos) => PM_TITLE_MATCH.test(pos.name ?? ""))
    .map((pos) => {
      const offices = [
        pos.office,
        ...toArray(pos.additionalOffices?.office),
      ].filter(Boolean);
      const locationRaw = offices.join(", ");

      const descriptions = toArray<PersonioJobDescription>(
        pos.jobDescriptions?.jobDescription
      );
      const description = descriptions
        .map((d) => stripHtml(d.value ?? ""))
        .filter(Boolean)
        .join("\n\n");

      return {
        title: pos.name,
        companyName,
        locationRaw,
        remoteFlagRaw: /remote/i.test(locationRaw) ? "remote" : null,
        description,
        originalPostedAt: pos.createdAt ?? null,
        sourceUrl: `https://${slug}.jobs.personio.de/job/${pos.id}`,
        sourceJobId: String(pos.id),
        rawPayload: pos,
      };
    });
}
