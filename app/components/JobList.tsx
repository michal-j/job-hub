"use client";

import { useMemo, useState } from "react";
import { StatusSelect } from "./StatusSelect";
import { CompatibilityBadge } from "./CompatibilityBadge";
import { LocationBadge } from "./LocationBadge";
import { STATUS_STYLES } from "./statusStyles";
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

function CompanyLogo({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt=""
        width={32}
        height={32}
        style={{ borderRadius: 7, objectFit: "contain", background: "#f3f4f6", flexShrink: 0 }}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
    );
  }

  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: 7,
        background: "#e5e7eb",
        color: "#4b5563",
        fontSize: 12,
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {initials || "?"}
    </div>
  );
}

export function JobList({ initialJobs }: { initialJobs: JobListItem[] }) {
  const [jobs, setJobs] = useState(initialJobs);
  const [filter, setFilter] = useState("new");
  const [sourceFilter, setSourceFilter] = useState("all");

  // Derived from the actual data rather than hardcoded — so this stays
  // correct as more sources get added later without touching this file.
  const availableSources = useMemo(() => {
    const names = new Set(jobs.map((j) => j.sourceName));
    return Array.from(names).sort();
  }, [jobs]);

  const visibleJobs = useMemo(() => {
    return jobs.filter((j) => {
      const statusMatch = filter === "all" || j.status === filter;
      const sourceMatch = sourceFilter === "all" || j.sourceName === sourceFilter;
      return statusMatch && sourceMatch;
    });
  }, [jobs, filter, sourceFilter]);

  function handleStatusChange(jobId: string, newStatus: string) {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j))
    );
  }

  function handleAnalyzed(
    jobId: string,
    compatibility: JobListItem["compatibility"]
  ) {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, compatibility } : j))
    );
  }

  function handleLocationAnalyzed(
    jobId: string,
    locationFit: JobListItem["locationFit"]
  ) {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, locationFit } : j))
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
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

      {availableSources.length > 1 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
          <button
            onClick={() => setSourceFilter("all")}
            style={{
              fontSize: 12,
              padding: "4px 10px",
              borderRadius: 999,
              border: "1px solid #e5e7eb",
              background: sourceFilter === "all" ? "#374151" : "#f9fafb",
              color: sourceFilter === "all" ? "white" : "#6b7280",
              cursor: "pointer",
            }}
          >
            All sources
          </button>
          {availableSources.map((source) => (
            <button
              key={source}
              onClick={() => setSourceFilter(source)}
              style={{
                fontSize: 12,
                padding: "4px 10px",
                borderRadius: 999,
                border: "1px solid #e5e7eb",
                background: sourceFilter === source ? "#374151" : "#f9fafb",
                color: sourceFilter === source ? "white" : "#6b7280",
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {source}
            </button>
          ))}
        </div>
      )}

      <p style={{ color: "#6b7280", marginTop: 0, marginBottom: 16, fontSize: 14 }}>
        {visibleJobs.length} job{visibleJobs.length === 1 ? "" : "s"}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {visibleJobs.map((job) => {
          const statusStyle = STATUS_STYLES[job.status] ?? STATUS_STYLES.new;
          return (
            <div
              key={job.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                border: "1px solid #e5e7eb",
                borderLeft: `4px solid ${statusStyle.border}`,
                borderRadius: 10,
                padding: "10px 16px",
                background: statusStyle.tint,
              }}
            >
              <CompanyLogo name={job.companyName} logoUrl={job.companyLogoUrl} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <a
                    href={job.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: "#111827",
                      textDecoration: "none",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {job.title}
                  </a>
                  {job.isNew && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: "#065f46",
                        background: "#d1fae5",
                        borderRadius: 4,
                        padding: "1px 5px",
                        flexShrink: 0,
                      }}
                    >
                      NEW
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#6b7280",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {job.companyName}
                  {job.locationRaw ? ` · ${job.locationRaw}` : ""}
                  {" · "}
                  {formatDate(job.originalPostedAt)}
                  {" · "}
                  {job.sourceName}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <StatusSelect
                  jobId={job.id}
                  status={job.status}
                  onChange={handleStatusChange}
                />
                <CompatibilityBadge
                  jobId={job.id}
                  compatibility={job.compatibility}
                  onAnalyzed={handleAnalyzed}
                />
                <LocationBadge
                  jobId={job.id}
                  locationFit={job.locationFit}
                  onAnalyzed={handleLocationAnalyzed}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
