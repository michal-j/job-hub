"use client";

import { useEffect, useMemo, useState } from "react";
import { StatusSelect } from "./StatusSelect";
import { CompatibilityBadge } from "./CompatibilityBadge";
import { LocationBadge } from "./LocationBadge";
import { statusColorVar } from "./statusStyles";
import { PopoverLockProvider, usePopoverLock } from "./PopoverLock";
import { loadDemoJobs, saveDemoJobs } from "@/lib/demoJobs";
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
  // Pinned to UTC deliberately: this is a client component, so it renders
  // once on the server (build time, UTC on Vercel) and again during
  // client hydration (the visitor's local timezone). Without an explicit
  // timeZone, a date within a few hours of midnight UTC can format to a
  // different calendar day on each side, which is a text-content
  // hydration mismatch — React then discards the whole tree and
  // re-renders client-only, silently wiping any DOM state set before
  // hydration (e.g. the theme's data-theme attribute).
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function CompanyLogo({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt=""
        width={34}
        height={34}
        className="job-logo"
        style={{ objectFit: "contain" }}
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

  return <div className="job-logo">{initials || "?"}</div>;
}

// The scrim (see CompatibilityBadge/LocationBadge) blocks other rows and
// page chrome correctly via z-index, but real-device testing found it
// does NOT block this row's own siblings (the status select, and
// whichever badge isn't the one that's open) — a WebKit-specific
// stacking quirk local to this flex container that doesn't reproduce in
// Chrome. pointer-events:none is a second, independent guarantee that
// doesn't depend on z-index/compositing being right on any engine.
// Scoped to ONE row's PopoverLockProvider (not the whole list) so a
// toggle only ever re-renders these 3 components, however many jobs are
// in the list.
function JobActions({
  job,
  onStatusChange,
  onAnalyzed,
  onLocationAnalyzed,
  demoMode,
}: {
  job: JobListItem;
  onStatusChange: (jobId: string, newStatus: string) => void;
  onAnalyzed: (jobId: string, result: JobListItem["compatibility"]) => void;
  onLocationAnalyzed: (jobId: string, result: JobListItem["locationFit"]) => void;
  demoMode: boolean;
}) {
  return (
    <PopoverLockProvider>
      <JobActionsInner
        job={job}
        onStatusChange={onStatusChange}
        onAnalyzed={onAnalyzed}
        onLocationAnalyzed={onLocationAnalyzed}
        demoMode={demoMode}
      />
    </PopoverLockProvider>
  );
}

function JobActionsInner({
  job,
  onStatusChange,
  onAnalyzed,
  onLocationAnalyzed,
  demoMode,
}: {
  job: JobListItem;
  onStatusChange: (jobId: string, newStatus: string) => void;
  onAnalyzed: (jobId: string, result: JobListItem["compatibility"]) => void;
  onLocationAnalyzed: (jobId: string, result: JobListItem["locationFit"]) => void;
  demoMode: boolean;
}) {
  const { locked } = usePopoverLock();
  return (
    <div className="job-actions" style={{ pointerEvents: locked ? "none" : undefined }}>
      <StatusSelect
        jobId={job.id}
        status={job.status}
        onChange={onStatusChange}
        demoMode={demoMode}
      />
      <CompatibilityBadge
        jobId={job.id}
        compatibility={job.compatibility}
        onAnalyzed={onAnalyzed}
        demoMode={demoMode}
      />
      <LocationBadge
        jobId={job.id}
        locationFit={job.locationFit}
        onAnalyzed={onLocationAnalyzed}
        demoMode={demoMode}
      />
    </div>
  );
}

export function JobList({
  initialJobs,
  demoMode = false,
}: {
  initialJobs: JobListItem[];
  demoMode?: boolean;
}) {
  const [jobs, setJobs] = useState(initialJobs);
  const [filter, setFilter] = useState("new");
  const [sourceFilter, setSourceFilter] = useState("all");

  // The demo has no backend — on mount, prefer whatever the visitor left
  // in localStorage from a previous visit over the frozen snapshot.
  useEffect(() => {
    if (!demoMode) return;
    setJobs(loadDemoJobs(initialJobs));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    setJobs((prev) => {
      const next = prev.map((j) =>
        j.id === jobId ? { ...j, status: newStatus } : j
      );
      if (demoMode) saveDemoJobs(next);
      return next;
    });
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
      <div className="filters">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            className="pill"
            aria-pressed={filter === opt.value}
            onClick={() => setFilter(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {availableSources.length > 1 && (
        <div className="filters sub">
          <button
            className="pill"
            aria-pressed={sourceFilter === "all"}
            onClick={() => setSourceFilter("all")}
          >
            All sources
          </button>
          {availableSources.map((source) => (
            <button
              key={source}
              className="pill"
              aria-pressed={sourceFilter === source}
              onClick={() => setSourceFilter(source)}
              style={{ textTransform: "capitalize" }}
            >
              {source}
            </button>
          ))}
        </div>
      )}

      <div className="list-divider" />

      <p className="count-chip" style={{ margin: "0 0 16px" }}>
        <b>{visibleJobs.length}</b> job{visibleJobs.length === 1 ? "" : "s"}
      </p>

      {visibleJobs.length === 0 ? (
        <div className="empty-state">
          <div className="glyph">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="1.8" />
              <path d="M20 20L15.2 15.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
          <div className="empty-title">No jobs match this filter</div>
          <div className="empty-sub">Try a different status or source.</div>
        </div>
      ) : (
        <div className="job-list">
          {visibleJobs.map((job, i) => (
            <div key={job.id} className="job-row">
              <span className="job-index">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div
                className="job-stripe"
                style={{ background: statusColorVar(job.status) }}
              />
              <div className="job-heading">
                <CompanyLogo name={job.companyName} logoUrl={job.companyLogoUrl} />

                <div className="job-main">
                  <div className="job-title-row">
                    {job.sourceUrl && job.sourceUrl !== "#" ? (
                      <a
                        href={job.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="job-title"
                      >
                        {job.title}
                      </a>
                    ) : (
                      <span className="job-title">{job.title}</span>
                    )}
                    <span className="job-company-inline">{job.companyName}</span>
                    {job.isNew && <span className="badge-new">NEW</span>}
                  </div>
                  <div className="job-meta">
                    <span className="meta-company">{job.companyName}</span>
                    <span className="dot">·</span>
                    {job.locationRaw ? `${job.locationRaw} · ` : ""}
                    {formatDate(job.originalPostedAt)}
                    {" · "}
                    {job.sourceName}
                  </div>
                </div>
              </div>

              <JobActions
                job={job}
                onStatusChange={handleStatusChange}
                onAnalyzed={handleAnalyzed}
                onLocationAnalyzed={handleLocationAnalyzed}
                demoMode={demoMode}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
