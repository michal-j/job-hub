import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { extractCvFacts } from "@/lib/cv";
// pdf-parse's package entry runs a debug self-test on import in some
// environments; importing the lib file directly avoids that.
import pdfParse from "pdf-parse/lib/pdf-parse.js";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json(
      { error: "Only PDF files are supported right now" },
      { status: 400 }
    );
  }

  let rawText: string;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await pdfParse(buffer);
    rawText = parsed.text.trim();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Couldn't read that PDF: ${message}` },
      { status: 400 }
    );
  }

  if (!rawText || rawText.length < 50) {
    return NextResponse.json(
      {
        error:
          "Couldn't extract meaningful text from that PDF (it may be a scanned image rather than text).",
      },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServerClient();

  // Keep every upload — "current" is just whichever is most recent
  // (queried by uploaded_at desc elsewhere). This gives us upload history
  // for free instead of destroying the previous CV each time.
  const { data: newRow, error } = await supabase
    .from("cv_profile")
    .insert({ raw_text: rawText, structured_facts: null, filename: file.name })
    .select("id")
    .single();

  if (error || !newRow) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to save CV" },
      { status: 500 }
    );
  }

  // Extraction failure shouldn't lose the uploaded CV — the raw text is
  // already saved. If this fails, structured_facts just stays null and
  // can be retried later without re-uploading.
  let extractionWarning: string | null = null;
  try {
    const facts = await extractCvFacts(rawText);
    await supabase
      .from("cv_profile")
      .update({ structured_facts: facts, updated_at: new Date().toISOString() })
      .eq("id", newRow.id);
  } catch (err) {
    extractionWarning =
      err instanceof Error ? err.message : "AI extraction failed";
  }

  return NextResponse.json({
    ok: true,
    characterCount: rawText.length,
    extractionWarning,
  });
}
