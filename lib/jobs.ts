import { getSupabaseServerClient } from "@/lib/supabase";

export interface JobListItem {
  id: string;
  title: string;
  companyName: string;
  companyLogoUrl: string | null;
  locationRaw: string | null;
  originalPostedAt: string | null;
  discoveredAt: string;
  status: string;
  sourceUrl: string;
  sourceName: string;
  isNew: boolean;
  compatibility: {
    overallScore: number;
    categoryScores: Record<string, number>;
    overview: string;
    highlights: string[];
  } | null;
  locationFit: {
    verdict: "fit" | "no_fit" | "unknown";
    explanation: string;
    highlights: string[];
  } | null;
}

// PostgREST returns an embedded relation as an ARRAY when it could be
// many-to-one from the child's perspective, but as a single OBJECT when
// the foreign key is unique — it treats that as a one-to-one relation.
// Both compatibility_analysis.job_id and location_analysis.job_id are
// unique, so handle both shapes defensively rather than assuming an array.
function firstOrSelf<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export async function getJobList(): Promise<JobListItem[]> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("job")
    .select(
      `
      id,
      title,
      location_raw,
      original_posted_at,
      discovered_at,
      company:company_id ( name, logo_url ),
      job_status ( status ),
      job_listing ( source_url, source:source_id ( name ) ),
      compatibility_analysis (
        overall_score, category_scores, overview, highlights
      ),
      location_analysis (
        verdict, explanation, highlights
      )
    `
    )
    .order("original_posted_at", { ascending: false, nullsFirst: false });

  if (error) throw error;

  const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;

  return (data ?? []).map((row: any) => {
    const analysis = firstOrSelf<any>(row.compatibility_analysis);
    const locAnalysis = firstOrSelf<any>(row.location_analysis);

    return {
      id: row.id,
      title: row.title,
      companyName: row.company?.name ?? "Unknown company",
      companyLogoUrl: row.company?.logo_url ?? null,
      locationRaw: row.location_raw,
      originalPostedAt: row.original_posted_at,
      discoveredAt: row.discovered_at,
      status: row.job_status?.status ?? "new",
      sourceUrl: row.job_listing?.[0]?.source_url ?? "#",
      sourceName: row.job_listing?.[0]?.source?.name ?? "unknown",
      isNew: new Date(row.discovered_at).getTime() >= twentyFourHoursAgo,
      compatibility: analysis
        ? {
            overallScore: analysis.overall_score,
            categoryScores: analysis.category_scores,
            overview: analysis.overview,
            highlights: analysis.highlights,
          }
        : null,
      locationFit: locAnalysis
        ? {
            verdict: locAnalysis.verdict,
            explanation: locAnalysis.explanation,
            highlights: locAnalysis.highlights,
          }
        : null,
    };
  });
}
