import { getSupabaseServerClient } from "@/lib/supabase";

export interface JobListItem {
  id: string;
  title: string;
  companyName: string;
  locationRaw: string | null;
  originalPostedAt: string | null;
  discoveredAt: string;
  status: string;
  sourceUrl: string;
  sourceName: string;
  isNew: boolean;
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
      company:company_id ( name ),
      job_status ( status ),
      job_listing ( source_url, source:source_id ( name ) )
    `
    )
    .order("original_posted_at", { ascending: false, nullsFirst: false });

  if (error) throw error;

  const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    title: row.title,
    companyName: row.company?.name ?? "Unknown company",
    locationRaw: row.location_raw,
    originalPostedAt: row.original_posted_at,
    discoveredAt: row.discovered_at,
    status: row.job_status?.status ?? "new",
    sourceUrl: row.job_listing?.[0]?.source_url ?? "#",
    sourceName: row.job_listing?.[0]?.source?.name ?? "unknown",
    isNew: new Date(row.discovered_at).getTime() >= twentyFourHoursAgo,
  }));
}
