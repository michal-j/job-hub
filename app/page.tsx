import { getJobList } from "@/lib/jobs";
import { JobList } from "./components/JobList";
import { SignOutButton } from "./components/SignOutButton";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function HomePage() {
  let jobs: Awaited<ReturnType<typeof getJobList>> = [];
  let errorMessage = "";

  try {
    jobs = await getJobList();
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : "Unknown error";
  }

  return (
    <main
      style={{
        maxWidth: 960,
        margin: "48px auto",
        padding: "0 24px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>Job Hub</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <a
            href="/cv"
            style={{ fontSize: 14, color: "#374151", textDecoration: "none" }}
          >
            Your CV →
          </a>
          <SignOutButton />
        </div>
      </div>

      {errorMessage && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 8,
            padding: 16,
            color: "#991b1b",
            marginBottom: 24,
          }}
        >
          <strong>Couldn&apos;t load jobs:</strong> {errorMessage}
        </div>
      )}

      {!errorMessage && jobs.length === 0 && (
        <p style={{ color: "#374151" }}>
          No jobs yet. Trigger ingestion to pull some in.
        </p>
      )}

      {!errorMessage && jobs.length > 0 && <JobList initialJobs={jobs} />}
    </main>
  );
}
