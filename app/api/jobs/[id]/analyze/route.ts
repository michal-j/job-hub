import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { analyzeCompatibility } from "@/lib/compatibility";
import type { CvFacts } from "@/lib/cv";

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return "Unknown error";
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const jobId = params.id;
  const supabase = getSupabaseServerClient();

  const { data: job, error: jobError } = await supabase
    .from("job")
    .select("id, title, description")
    .eq("id", jobId)
    .single();

  if (jobError || !job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const { data: cv, error: cvError } = await supabase
    .from("cv_profile")
    .select("structured_facts")
    .order("uploaded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (cvError || !cv || !cv.structured_facts) {
    return NextResponse.json(
      { error: "No CV with extracted facts found — upload a CV first." },
      { status: 400 }
    );
  }

  try {
    const result = await analyzeCompatibility(
      cv.structured_facts as CvFacts,
      job.title,
      job.description ?? ""
    );

    const { error: upsertError } = await supabase
      .from("compatibility_analysis")
      .upsert(
        {
          job_id: job.id,
          overall_score: result.overall_score,
          category_scores: result.category_scores,
          overview: result.overview,
          highlights: result.highlights,
          created_at: new Date().toISOString(),
        },
        { onConflict: "job_id" }
      );

    if (upsertError) throw upsertError;

    return NextResponse.json(result);
  } catch (err) {
    console.error("Compatibility analysis failed:", err);
    return NextResponse.json({ error: errorMessage(err) }, { status: 500 });
  }
}
