"use client";

import { useState } from "react";
import type { JobListItem } from "@/lib/jobs";
import { usePopupDirection } from "./usePopupDirection";

function scoreColor(score: number): { bg: string; fg: string } {
  if (score >= 75) return { bg: "#d1fae5", fg: "#065f46" };
  if (score >= 50) return { bg: "#fef3c7", fg: "#92400e" };
  return { bg: "#fee2e2", fg: "#991b1b" };
}

const CATEGORY_LABELS: Record<string, string> = {
  skills: "Skills",
  experience: "Experience",
  domain_industry: "Domain",
  seniority: "Seniority",
};

export function CompatibilityBadge({
  jobId,
  compatibility,
  onAnalyzed,
}: {
  jobId: string;
  compatibility: JobListItem["compatibility"];
  onAnalyzed: (jobId: string, result: JobListItem["compatibility"]) => void;
}) {
  const [hovering, setHovering] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const { triggerRef, direction, measureAndOpen } = usePopupDirection();

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
          onClick={runAnalysis}
          disabled={analyzing}
          style={{
            fontSize: 12,
            padding: "4px 10px",
            borderRadius: 6,
            border: "1px solid #d1d5db",
            background: analyzing ? "#f3f4f6" : "white",
            color: "#374151",
            cursor: analyzing ? "default" : "pointer",
          }}
        >
          {analyzing ? "Analyzing…" : "Analyze fit"}
        </button>
        {error && (
          <div style={{ fontSize: 12, color: "#991b1b", marginTop: 4 }}>
            {error}
          </div>
        )}
      </div>
    );
  }

  const colors = scoreColor(compatibility.overallScore);

  return (
    <div
      ref={triggerRef}
      style={{ position: "relative", display: "inline-block" }}
      onMouseEnter={() => {
        measureAndOpen();
        setHovering(true);
      }}
      onMouseLeave={() => setHovering(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          fontSize: 13,
          fontWeight: 700,
          padding: "4px 10px",
          borderRadius: 6,
          background: colors.bg,
          color: colors.fg,
          cursor: "default",
          whiteSpace: "nowrap",
        }}
      >
        {compatibility.overallScore}% match
      </div>

      {hovering && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={
            direction === "up"
              ? {
                  position: "absolute",
                  bottom: "100%",
                  paddingBottom: 6,
                  right: 0,
                  zIndex: 20,
                  width: 320,
                }
              : {
                  position: "absolute",
                  top: "100%",
                  paddingTop: 6,
                  right: 0,
                  zIndex: 20,
                  width: 320,
                }
          }
        >
          <div
            style={{
              padding: 14,
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
              fontSize: 13,
              color: "#374151",
              textAlign: "left",
            }}
          >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#92400e",
                background: "#fef3c7",
                borderRadius: 4,
                padding: "1px 6px",
              }}
            >
              AI-GENERATED
            </div>
            <button
              onClick={runAnalysis}
              disabled={analyzing}
              title="Re-analyze with the latest CV"
              style={{
                fontSize: 11,
                border: "none",
                background: "none",
                color: analyzing ? "#9ca3af" : "#374151",
                cursor: analyzing ? "default" : "pointer",
                textDecoration: "underline",
              }}
            >
              {analyzing ? "Re-analyzing…" : "↻ Re-analyze"}
            </button>
          </div>

          {error && (
            <div style={{ color: "#991b1b", marginBottom: 8 }}>{error}</div>
          )}

          <p style={{ margin: "0 0 10px 0" }}>{compatibility.overview}</p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "4px 12px",
              marginBottom: 10,
            }}
          >
            {Object.entries(compatibility.categoryScores).map(
              ([key, val]) => (
                <div
                  key={key}
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span>{CATEGORY_LABELS[key] ?? key}</span>
                  <span style={{ fontWeight: 600 }}>{val}%</span>
                </div>
              )
            )}
          </div>

          {compatibility.highlights?.length > 0 && (
            <ul style={{ margin: 0, padding: "0 0 0 16px" }}>
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
