import { NextResponse } from "next/server";
import { runIngestionForSource } from "@/lib/ingestion";
import { COMPANY_BOARDS } from "@/lib/companyBoards";
import { fetchGreenhouseJobs } from "@/lib/sources/greenhouse";
import { fetchAshbyJobs } from "@/lib/sources/ashby";
import { fetchSmartRecruitersJobs } from "@/lib/sources/smartrecruiters";
import { fetchPersonioJobs } from "@/lib/sources/personio";

async function handle() {
  const results: Record<string, unknown> = {};

  // Each company is isolated — one failing (bad slug, API change, rate
  // limit) shouldn't stop the rest of the batch from ingesting.
  for (const company of COMPANY_BOARDS) {
    try {
      const fetchFn = () => {
        if (company.platform === "greenhouse") {
          return fetchGreenhouseJobs(company.sourceName, company.slug);
        }
        if (company.platform === "ashby") {
          return fetchAshbyJobs(company.sourceName, company.slug);
        }
        if (company.platform === "personio") {
          return fetchPersonioJobs(company.sourceName, company.slug);
        }
        return fetchSmartRecruitersJobs(company.sourceName, company.slug);
      };

      const result = await runIngestionForSource(company.sourceName, fetchFn);
      results[company.sourceName] = result;
    } catch (err) {
      results[company.sourceName] = {
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  }

  return NextResponse.json(results);
}

export async function GET() {
  return handle();
}

export async function POST() {
  return handle();
}
