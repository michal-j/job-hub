import { getSupabaseServerClient } from "@/lib/supabase";
import { computeDedupHash } from "@/lib/dedup";
import { analyzeCompatibility } from "@/lib/compatibility";
import { analyzeLocationFit } from "@/lib/locationFit";
import type { CvFacts } from "@/lib/cv";
import type { NormalizedJob } from "@/lib/sources/types";

export async function runIngestionForSource(
  sourceName: string,
  fetchJobs: () => Promise<NormalizedJob[]>
) {
  const supabase = getSupabaseServerClient();

  const { data: source, error: sourceError } = await supabase
    .from("job_source")
    .select("id")
    .eq("name", sourceName)
    .single();

  if (sourceError || !source) {
    throw new Error(
      `"${sourceName}" source row not found — did you run schema.sql?`
    );
  }

  const { data: runRow } = await supabase
    .from("update_run")
    .insert({ source_id: source.id })
    .select("id")
    .single();

  let jobsFound = 0;
  let jobsNew = 0;

  // Fetch once, reused for every new job this run — avoids a query per job.
  const { data: cv } = await supabase
    .from("cv_profile")
    .select("structured_facts")
    .order("uploaded_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const cvFacts = (cv?.structured_facts as CvFacts | null) ?? null;

  try {
    const jobs = await fetchJobs();
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
        // Backfill a logo if we now have one and didn't before (e.g. this
        // company was first seen via a source that doesn't provide logos).
        if (job.companyLogoUrl) {
          await supabase
            .from("company")
            .update({ logo_url: job.companyLogoUrl })
            .eq("id", companyId)
            .is("logo_url", null);
        }
      } else {
        const { data: newCompany, error: companyError } = await supabase
          .from("company")
          .insert({ name: job.companyName, logo_url: job.companyLogoUrl ?? null })
          .select("id")
          .single();
        if (companyError || !newCompany) throw companyError;
        companyId = newCompany.id;
      }

      // Job: skip if this exact hash already exists (dedup). This also
      // catches the same role posted on a different source, as long as
      // title/company/location normalize the same way.
      const { data: existingJob } = await supabase
        .from("job")
        .select("id")
        .eq("dedup_hash", dedupHash)
        .maybeSingle();

      if (existingJob) continue;

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

      // Auto-analyze if a CV is on file. Best-effort: a failure here
      // (rate limit, transient API error) shouldn't break ingestion for
      // the rest of the batch — the job just stays unscored and can be
      // analyzed manually later.
      if (cvFacts) {
        try {
          const result = await analyzeCompatibility(
            cvFacts,
            job.title,
            job.description ?? ""
          );
          await supabase.from("compatibility_analysis").upsert(
            {
              job_id: newJob.id,
              overall_score: result.overall_score,
              category_scores: result.category_scores,
              overview: result.overview,
              highlights: result.highlights,
              created_at: new Date().toISOString(),
            },
            { onConflict: "job_id" }
          );
        } catch (analysisErr) {
          console.error(
            `Auto-analysis failed for job ${newJob.id}:`,
            analysisErr
          );
        }
      }

      // Location fit doesn't need a CV — runs unconditionally for every
      // new job. Same best-effort pattern: a failure here shouldn't break
      // ingestion for the rest of the batch.
      try {
        const locationResult = await analyzeLocationFit(
          job.title,
          job.locationRaw ?? "",
          job.remoteFlagRaw,
          job.description ?? ""
        );
        await supabase.from("location_analysis").upsert(
          {
            job_id: newJob.id,
            verdict: locationResult.verdict,
            explanation: locationResult.explanation,
            highlights: locationResult.highlights,
            created_at: new Date().toISOString(),
          },
          { onConflict: "job_id" }
        );
      } catch (locationErr) {
        console.error(
          `Auto location-fit analysis failed for job ${newJob.id}:`,
          locationErr
        );
      }

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
