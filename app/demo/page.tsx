import { JobList } from "../components/JobList";
import { ThemeSwitcher } from "../components/ThemeSwitcher";
import demoJobs from "@/data/jobs-demo.json";
import type { JobListItem } from "@/lib/jobs";

// Static snapshot — zero Supabase/Anthropic calls, no runtime fetch.
// The ~10 "New" jobs are real listings pulled from the live job table at
// snapshot time (their links may go dead later if the posting comes
// down — known limitation, not auto-refreshed). Everything else,
// including every compatibility/location result, is fabricated for
// demo purposes only.
const jobs = demoJobs as JobListItem[];

export default function DemoPage() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <div className="brand">
            <div className="brand-mark">💼</div>
            <div className="brand-name">Job Hub</div>
            <span
              className="tag-ai"
              style={{ marginLeft: 6, color: "var(--text-tertiary)", background: "var(--panel-soft)" }}
            >
              DEMO
            </span>
          </div>
          <nav className="app-nav">
            <ThemeSwitcher />
            <a href="/login" className="btn btn-primary" style={{ textDecoration: "none" }}>
              Sign in
            </a>
          </nav>
        </div>
      </header>

      <main className="main-container">
        <div className="panel" style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            You&apos;re viewing sample data — status changes are saved to
            this browser only, no account needed.{" "}
            <a href="/login" style={{ color: "var(--text-primary)", fontWeight: 600 }}>
              Sign in to the real app →
            </a>
          </div>
        </div>

        <h1 className="page-title">Jobs</h1>
        <div style={{ marginTop: 24 }}>
          <JobList initialJobs={jobs} demoMode />
        </div>
      </main>
    </div>
  );
}
