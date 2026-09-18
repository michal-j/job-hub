import { getSupabaseServerClient } from "@/lib/supabase";
import { CvUploadForm } from "./CvUploadForm";
import { AppHeader } from "../components/AppHeader";
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
    <div className="app-shell">
      <AppHeader active="cv" />
      <main className="main-container" style={{ maxWidth: 720 }}>
        <h1 className="page-title">Your CV</h1>
        <p className="page-sub" style={{ marginBottom: 28 }}>
          Used to compute compatibility scores against job listings. Stored
          privately — only sent to Anthropic&apos;s API when analyzing a job.
        </p>

        {cv ? (
          <div className="panel" style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>
              <strong style={{ color: "var(--text-primary)" }}>
                {cv.filename || "Current CV"}
              </strong>{" "}
              — uploaded {formatDate(cv.uploaded_at)} —{" "}
              {cv.raw_text.length.toLocaleString()} characters extracted
            </div>
          </div>
        ) : (
          <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>
            No CV uploaded yet.
          </p>
        )}

        <CvUploadForm />

        {facts && (
          <div style={{ marginTop: 32 }}>
            <div className="tag-ai" style={{ marginBottom: 14 }}>
              AI-EXTRACTED — not directly from your CV text
            </div>

            <p style={{ fontSize: 15, color: "var(--text-primary)" }}>
              {facts.summary}
            </p>

            <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 12 }}>
              <strong style={{ color: "var(--text-primary)" }}>Seniority:</strong>{" "}
              {facts.seniority_level || "—"}
              {facts.total_years_experience != null && (
                <>
                  {" · "}
                  <strong style={{ color: "var(--text-primary)" }}>Experience:</strong>{" "}
                  ~{facts.total_years_experience} years
                </>
              )}
            </div>

            {facts.skills?.length > 0 && (
              <div style={{ marginBottom: 12, fontSize: 14, color: "var(--text-secondary)" }}>
                <strong style={{ color: "var(--text-primary)" }}>Skills:</strong>{" "}
                {facts.skills.join(", ")}
              </div>
            )}

            {facts.domains_industries?.length > 0 && (
              <div style={{ marginBottom: 12, fontSize: 14, color: "var(--text-secondary)" }}>
                <strong style={{ color: "var(--text-primary)" }}>Industries:</strong>{" "}
                {facts.domains_industries.join(", ")}
              </div>
            )}

            {facts.roles?.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <strong style={{ fontSize: 14, color: "var(--text-primary)" }}>Roles:</strong>
                <div style={{ marginTop: 6 }}>
                  {facts.roles.map((role, i) => (
                    <div key={i} style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 600 }}>
                        {role.title} @ {role.company} ({role.years})
                      </div>
                      {role.highlights?.length > 0 && (
                        <ul
                          style={{
                            fontSize: 14,
                            color: "var(--text-secondary)",
                            margin: "4px 0 0 0",
                          }}
                        >
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
            <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: "var(--text-primary)" }}>
              Previous uploads
            </h2>
            <ul style={{ fontSize: 13, color: "var(--text-tertiary)", paddingLeft: 18 }}>
              {history.map((upload) => (
                <li key={upload.id}>
                  {upload.filename || "CV"} — {formatDate(upload.uploaded_at)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
