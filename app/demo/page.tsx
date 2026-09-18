import { JobList } from "../components/JobList";
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
    <main
      style={{
        maxWidth: 960,
        margin: "0 auto",
        padding: "0 24px 48px",
      }}
    >
      <div
        style={{
          background: "#eff6ff",
          border: "1px solid #bfdbfe",
          borderRadius: 8,
          padding: "10px 16px",
          margin: "24px 0",
          fontSize: 13,
          color: "#1e40af",
        }}
      >
        Demo mode — sample jobs, changes stay in your browser only.{" "}
        <a href="/login" style={{ color: "#1e40af", fontWeight: 600 }}>
          Sign in to the real app →
        </a>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>Job Hub</h1>
      </div>

      <JobList initialJobs={jobs} demoMode />
    </main>
  );
}
