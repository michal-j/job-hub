import { NextResponse } from "next/server";
import { runIngestionForSource } from "@/lib/ingestion";
import { fetchRemotiveJobs } from "@/lib/sources/remotive";

async function handle() {
  try {
    const result = await runIngestionForSource("remotive", fetchRemotiveJobs);
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
