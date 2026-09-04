import { getSupabaseServerClient } from "@/lib/supabase";
import { CvUploadForm } from "./CvUploadForm";
import type { CvFacts } from "@/lib/cv";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function CvPage() {
  const supabase = getSupabaseServerClient();
  const { data: allUploads } = await supabase
    .from("cv_profile")
    .select("id, uploaded_at, raw_text, structured_facts, filename")
    .order("uploaded_at", { ascending: false });

  const cv = allUploads?.[0] ?? null;
  const history = allUploads?.slice(1) ?? [];
  const facts = cv?.structured_facts as CvFacts | null | undefined;

  return (
    <main style={{ maxWidth: 720, margin: "48px auto", padding: "0 24px" }}>
      <a
        href="/"
        style={{
          display: "inline-block",
          fontSize: 14,
          color: "#374151",
          textDecoration: "none",
          marginBottom: 16,
        }}
      >
        ← Back
      </a>

      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 4 }}>
        Your CV
      </h1>
      <p style={{ color: "#6b7280", marginTop: 0, marginBottom: 24 }}>
        Used to compute compatibility scores against job listings. Stored
        privately — only sent to Anthropic&apos;s API when analyzing a job.
      </p>

      {cv ? (
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            padding: 16,
            marginBottom: 24,
          }}
        >
          <div style={{ fontSize: 14, color: "#374151" }}>
            <strong>{cv.filename || "Current CV"}</strong> — uploaded{" "}
            {formatDate(cv.uploaded_at)} &mdash;{" "}
            {cv.raw_text.length.toLocaleString()} characters extracted
          </div>
        </div>
      ) : (
        <p style={{ color: "#374151", marginBottom: 24 }}>
          No CV uploaded yet.
        </p>
      )}

      <CvUploadForm />

      {facts && (
        <div style={{ marginTop: 32 }}>
          <div
            style={{
              display: "inline-block",
              fontSize: 11,
              fontWeight: 700,
              color: "#92400e",
              background: "#fef3c7",
              borderRadius: 4,
              padding: "2px 8px",
              marginBottom: 12,
            }}
          >
            AI-EXTRACTED — not directly from your CV text
          </div>

          <p style={{ fontSize: 15, color: "#111827" }}>{facts.summary}</p>

          <div style={{ fontSize: 14, color: "#374151", marginBottom: 12 }}>
            <strong>Seniority:</strong> {facts.seniority_level || "—"}
            {facts.total_years_experience != null && (
              <>
                {" · "}
                <strong>Experience:</strong> ~{facts.total_years_experience}{" "}
                years
              </>
            )}
          </div>

          {facts.skills?.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <strong style={{ fontSize: 14 }}>Skills:</strong>{" "}
              <span style={{ fontSize: 14, color: "#374151" }}>
                {facts.skills.join(", ")}
              </span>
            </div>
          )}

          {facts.domains_industries?.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <strong style={{ fontSize: 14 }}>Industries:</strong>{" "}
              <span style={{ fontSize: 14, color: "#374151" }}>
                {facts.domains_industries.join(", ")}
              </span>
            </div>
          )}

          {facts.roles?.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <strong style={{ fontSize: 14 }}>Roles:</strong>
              <div style={{ marginTop: 6 }}>
                {facts.roles.map((role, i) => (
                  <div key={i} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 14, color: "#111827", fontWeight: 600 }}>
                      {role.title} @ {role.company} ({role.years})
                    </div>
                    {role.highlights?.length > 0 && (
                      <ul style={{ fontSize: 14, color: "#374151", margin: "4px 0 0 0" }}>
                        {role.highlights.map((h, j) => (
                          <li key={j}>{h}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {history.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>
            Previous uploads
          </h2>
          <ul style={{ fontSize: 13, color: "#6b7280", paddingLeft: 18 }}>
            {history.map((upload) => (
              <li key={upload.id}>
                {upload.filename || "CV"} — {formatDate(upload.uploaded_at)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
