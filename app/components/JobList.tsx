"use client";

import { useMemo, useState } from "react";
import { StatusSelect } from "./StatusSelect";
import type { JobListItem } from "@/lib/jobs";

const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "interested", label: "Interested" },
  { value: "applied", label: "Applied" },
  { value: "interviewing", label: "Interviewing" },
  { value: "rejected", label: "Rejected" },
  { value: "offer", label: "Offer" },
  { value: "not_interested", label: "Not interested" },
];

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function JobList({ initialJobs }: { initialJobs: JobListItem[] }) {
  const [jobs, setJobs] = useState(initialJobs);
  const [filter, setFilter] = useState("all");

  const visibleJobs = useMemo(
    () => (filter === "all" ? jobs : jobs.filter((j) => j.status === filter)),
    [jobs, filter]
  );

  function handleStatusChange(jobId: string, newStatus: string) {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j))
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            style={{
              fontSize: 13,
              padding: "6px 12px",
              borderRadius: 999,
              border: "1px solid #d1d5db",
              background: filter === opt.value ? "#111827" : "white",
              color: filter === opt.value ? "white" : "#374151",
              cursor: "pointer",
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <p style={{ color: "#6b7280", marginTop: 0, marginBottom: 16, fontSize: 14 }}>
        {visibleJobs.length} job{visibleJobs.length === 1 ? "" : "s"}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {visibleJobs.map((job) => (
          <div
            key={job.id}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              padding: "16px 20px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 12,
              }}
            >
              <div>
                <a
                  href={job.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: "#111827",
                    textDecoration: "none",
                  }}
                >
                  {job.title}
                </a>
                {job.isNew && (
                  <span
                    style={{
                      marginLeft: 8,
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#065f46",
                      background: "#d1fae5",
                      borderRadius: 4,
                      padding: "2px 6px",
                      verticalAlign: "middle",
                    }}
                  >
                    NEW
                  </span>
                )}
                <div style={{ fontSize: 14, color: "#374151", marginTop: 2 }}>
                  {job.companyName}
                  {job.locationRaw ? ` · ${job.locationRaw}` : ""}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                <div style={{ fontSize: 12, color: "#9ca3af", whiteSpace: "nowrap", textAlign: "right" }}>
                  <div>{formatDate(job.originalPostedAt)}</div>
                  <div style={{ marginTop: 4 }}>{job.sourceName}</div>
                </div>
                <StatusSelect
                  jobId={job.id}
                  status={job.status}
                  onChange={handleStatusChange}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
