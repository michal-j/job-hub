import { getJobList } from "@/lib/jobs";
import { JobList } from "./components/JobList";

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
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24 }}>
        Job Hub
      </h1>

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
