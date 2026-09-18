import { getJobList } from "@/lib/jobs";
import { JobList } from "./components/JobList";
import { AppHeader } from "./components/AppHeader";

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
    <div className="app-shell">
      <AppHeader active="jobs" />
      <main className="main-container">
        <h1 className="page-title">Jobs</h1>

        {errorMessage && (
          <div className="panel" style={{ marginTop: 20, color: "var(--score-low-fg)" }}>
            <strong>Couldn&apos;t load jobs:</strong> {errorMessage}
          </div>
        )}

        {!errorMessage && jobs.length === 0 && (
          <div className="empty-state" style={{ marginTop: 24 }}>
            <div className="glyph">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M4 13V7a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v6M4 13l3.5 4h9L20 13M4 13h5.2a1 1 0 0 1 .9.55l.8 1.6a1 1 0 0 0 .9.55h.4a1 1 0 0 0 .9-.55l.8-1.6a1 1 0 0 1 .9-.55H20"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="empty-title">No jobs yet</div>
            <div className="empty-sub">Trigger ingestion to pull some in.</div>
          </div>
        )}

        {!errorMessage && jobs.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <JobList initialJobs={jobs} />
          </div>
        )}
      </main>
    </div>
  );
}
