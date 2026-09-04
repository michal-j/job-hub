import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { analyzeLocationFit } from "@/lib/locationFit";

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
    .select("id, title, location_raw, remote_flag_raw, description")
    .eq("id", jobId)
    .single();

  if (jobError || !job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  try {
    const result = await analyzeLocationFit(
      job.title,
      job.location_raw ?? "",
      job.remote_flag_raw,
      job.description ?? ""
    );

    const { error: upsertError } = await supabase
      .from("location_analysis")
      .upsert(
        {
          job_id: job.id,
          verdict: result.verdict,
          explanation: result.explanation,
          highlights: result.highlights,
          created_at: new Date().toISOString(),
        },
        { onConflict: "job_id" }
      );

    if (upsertError) throw upsertError;

    return NextResponse.json(result);
  } catch (err) {
    console.error("Location fit analysis failed:", err);
    return NextResponse.json({ error: errorMessage(err) }, { status: 500 });
  }
}
