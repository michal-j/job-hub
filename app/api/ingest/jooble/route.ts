import { NextResponse } from "next/server";
import { runIngestionForSource } from "@/lib/ingestion";
import { fetchJoobleJobs } from "@/lib/sources/jooble";

async function handle() {
  try {
    const result = await runIngestionForSource("jooble", fetchJoobleJobs);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return handle();
}

export async function POST() {
  return handle();
}
