import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";

const VALID_STATUSES = [
  "new",
  "interested",
  "applied",
  "interviewing",
  "rejected",
  "offer",
  "not_interested",
];

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { jobId, status } = body as { jobId?: string; status?: string };

  if (!jobId || !status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: "jobId and a valid status are required" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServerClient();

  const { error } = await supabase
    .from("job_status")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("job_id", jobId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
