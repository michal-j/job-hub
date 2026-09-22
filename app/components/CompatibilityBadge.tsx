"use client";

import { useState } from "react";
import type { JobListItem } from "@/lib/jobs";
import { usePopupDirection } from "./usePopupDirection";

function scoreClass(score: number): "high" | "mid" | "low" {
  if (score >= 75) return "high";
  if (score >= 50) return "mid";
  return "low";
}

const CATEGORY_LABELS: Record<string, string> = {
  skills: "Skills",
  experience: "Experience",
  domain_industry: "Domain",
  seniority: "Seniority",
};

const DEMO_TOOLTIP = "Not available in the demo — sign in to run real analysis.";

// Must match .popover-anchor's own width cap in globals.css — see
// usePopupDirection for why this needs to be known in JS too.
const POPOVER_MAX_WIDTH = 320;

export function CompatibilityBadge({
  jobId,
  compatibility,
  onAnalyzed,
  demoMode = false,
}: {
  jobId: string;
  compatibility: JobListItem["compatibility"];
  onAnalyzed: (jobId: string, result: JobListItem["compatibility"]) => void;
  demoMode?: boolean;
}) {
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const { triggerRef, open, placement, openPopover, closePopover, togglePopover } =
    usePopupDirection();

  async function runAnalysis(e: React.MouseEvent) {
    e.stopPropagation();
    setAnalyzing(true);
    setError("");

    try {
      const res = await fetch(`/api/jobs/${jobId}/analyze`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Analysis failed");
        return;
      }

      onAnalyzed(jobId, {
        overallScore: data.overall_score,
        categoryScores: data.category_scores,
        overview: data.overview,
        highlights: data.highlights,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }

  if (!compatibility) {
    return (
      <div>
        <button
          className="btn-ghost"
          onClick={demoMode ? undefined : runAnalysis}
          aria-disabled={demoMode || analyzing}
          title={demoMode ? DEMO_TOOLTIP : undefined}
          style={{
            opacity: demoMode || analyzing ? 0.5 : 1,
            cursor: demoMode || analyzing ? "default" : "pointer",
          }}
        >
          {analyzing ? "Analyzing…" : "Analyze fit"}
        </button>
        {error && <div className="error-text">{error}</div>}
      </div>
    );
  }

  const cls = scoreClass(compatibility.overallScore);

  return (
    <>
      {/* Rendered as a SIBLING of the trigger, not a child of it — it has
          to be outside triggerRef's own subtree, or usePopupDirection's
          "is this click outside the trigger" check would see the scrim
          (which visually covers the whole viewport, but is still a DOM
          descendant) as "inside" and never close on a scrim click. */}
      {open && <div className="popover-scrim" />}
      <div
        ref={triggerRef}
        style={{
          position: "relative",
          display: "inline-block",
          zIndex: open ? 16 : "auto",
          // The row's job-actions gets pointer-events:none while any
          // badge in it is open (see JobList/PopoverLock) — this
          // specific trigger (and its own popover, nested inside it)
          // needs to opt back in, or it'd be unable to close/re-toggle
          // itself.
          pointerEvents: open ? "auto" : undefined,
        }}
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse") openPopover(POPOVER_MAX_WIDTH);
        }}
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse") closePopover();
        }}
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
            togglePopover(POPOVER_MAX_WIDTH);
          }}
          className={`score ${cls}`}
          style={{ cursor: "default" }}
        >
          <span className="ring" />
          {compatibility.overallScore}% match
        </div>

        {open && (
          <div
            onClick={(e) => e.stopPropagation()}
            className={`popover-anchor ${placement.direction === "up" ? "direction-up" : "direction-down"}`}
            style={{ left: placement.left }}
          >
            <div className="popover">
              <div className="popover-header">
                <span className="tag-ai">AI-GENERATED</span>
                <button
                  className="popover-reanalyze"
                  onClick={demoMode ? undefined : runAnalysis}
                  aria-disabled={demoMode || analyzing}
                  title={demoMode ? DEMO_TOOLTIP : "Re-analyze with the latest CV"}
                  style={{ opacity: demoMode || analyzing ? 0.5 : 1 }}
                >
                  {analyzing ? "Re-analyzing…" : "↻ Re-analyze"}
                </button>
              </div>

              {error && <div className="error-text">{error}</div>}

              <p>{compatibility.overview}</p>

              <div className="popover-grid">
                {Object.entries(compatibility.categoryScores).map(([key, val]) => (
                  <div key={key} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>{CATEGORY_LABELS[key] ?? key}</span>
                    <b>{val}%</b>
                  </div>
                ))}
              </div>

              {compatibility.highlights?.length > 0 && (
                <ul>
                  {compatibility.highlights.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
