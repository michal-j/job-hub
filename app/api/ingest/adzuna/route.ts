import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { fetchAdzunaJobs } from "@/lib/sources/adzuna";
import { computeDedupHash } from "@/lib/dedup";

async function runIngestion() {
  const supabase = getSupabaseServerClient();

  const { data: source, error: sourceError } = await supabase
    .from("job_source")
    .select("id")
    .eq("name", "adzuna")
    .single();

  if (sourceError || !source) {
    throw new Error("adzuna source row not found — did you run schema.sql?");
  }

  const { data: runRow } = await supabase
    .from("update_run")
    .insert({ source_id: source.id })
    .select("id")
    .single();

  let jobsFound = 0;
  let jobsNew = 0;

  try {
    const jobs = await fetchAdzunaJobs();
    jobsFound = jobs.length;

    for (const job of jobs) {
      const dedupHash = computeDedupHash(
        job.title,
        job.companyName,
        job.locationRaw
      );

      // Company: find-or-create by name. Fine for V1 — a proper company
      // identity/matching strategy is a later refinement.
      let companyId: string;
      const { data: existingCompany } = await supabase
        .from("company")
        .select("id")
        .eq("name", job.companyName)
        .maybeSingle();

      if (existingCompany) {
        companyId = existingCompany.id;
      } else {
        const { data: newCompany, error: companyError } = await supabase
          .from("company")
          .insert({ name: job.companyName })
          .select("id")
          .single();
        if (companyError || !newCompany) throw companyError;
        companyId = newCompany.id;
      }

      // Job: skip if this exact hash already exists (dedup).
      const { data: existingJob } = await supabase
        .from("job")
        .select("id")
        .eq("dedup_hash", dedupHash)
        .maybeSingle();

      if (existingJob) continue; // already known, not counted as new

      const { data: newJob, error: jobError } = await supabase
        .from("job")
        .insert({
          company_id: companyId,
          title: job.title,
          location_raw: job.locationRaw,
          remote_flag_raw: job.remoteFlagRaw,
          description: job.description,
          original_posted_at: job.originalPostedAt,
          dedup_hash: dedupHash,
        })
        .select("id")
        .single();

      if (jobError || !newJob) throw jobError;

      await supabase.from("job_listing").insert({
        job_id: newJob.id,
        source_id: source.id,
        source_url: job.sourceUrl,
        source_job_id: job.sourceJobId,
        raw_payload: job.rawPayload,
      });

      await supabase.from("job_status").insert({
        job_id: newJob.id,
        status: "new",
      });

      jobsNew++;
    }

    if (runRow) {
      await supabase
        .from("update_run")
        .update({
          finished_at: new Date().toISOString(),
          jobs_found: jobsFound,
          jobs_new: jobsNew,
          status: "success",
        })
        .eq("id", runRow.id);
    }

    return { jobsFound, jobsNew };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    if (runRow) {
      await supabase
        .from("update_run")
        .update({
          finished_at: new Date().toISOString(),
          jobs_found: jobsFound,
          jobs_new: jobsNew,
          status: "error",
          error_message: message,
        })
        .eq("id", runRow.id);
    }

    throw err;
  }
}

// GET: called by Vercel Cron on the daily schedule (see vercel.json).
// Cron requests are authenticated in middleware.ts via CRON_SECRET, not
// the app password, since there's no browser involved.
export async function GET() {
  try {
    const result = await runIngestion();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST: for manual testing via curl, same as before.
export async function POST() {
  try {
    const result = await runIngestion();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
