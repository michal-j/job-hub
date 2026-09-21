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
  const { triggerRef, direction, open, measureAndOpen, closePopup } = usePopupDirection();

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
    <div
      ref={triggerRef}
      style={{ position: "relative", display: "inline-block" }}
      onMouseEnter={measureAndOpen}
      onMouseLeave={closePopup}
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
          measureAndOpen();
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
          className={`popover-anchor ${direction === "up" ? "direction-up" : "direction-down"}`}
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
  );
}
