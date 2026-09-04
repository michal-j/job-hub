"use client";

import { useState } from "react";
import type { JobListItem } from "@/lib/jobs";

const VERDICT_STYLES: Record<
  string,
  { bg: string; fg: string; label: string }
> = {
  fit: { bg: "#d1fae5", fg: "#065f46", label: "Location: Fit" },
  no_fit: { bg: "#fee2e2", fg: "#991b1b", label: "Location: No fit" },
  unknown: { bg: "#fef3c7", fg: "#92400e", label: "Location: Unclear" },
};

export function LocationBadge({
  jobId,
  locationFit,
  onAnalyzed,
}: {
  jobId: string;
  locationFit: JobListItem["locationFit"];
  onAnalyzed: (jobId: string, result: JobListItem["locationFit"]) => void;
}) {
  const [hovering, setHovering] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");

  async function runAnalysis(e: React.MouseEvent) {
    e.stopPropagation();
    setAnalyzing(true);
    setError("");

    try {
      const res = await fetch(`/api/jobs/${jobId}/analyze-location`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Analysis failed");
        return;
      }

      onAnalyzed(jobId, {
        verdict: data.verdict,
        explanation: data.explanation,
        highlights: data.highlights,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }

  if (!locationFit) {
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
          {analyzing ? "Checking…" : "Check location"}
        </button>
        {error && (
          <div style={{ fontSize: 12, color: "#991b1b", marginTop: 4 }}>
            {error}
          </div>
        )}
      </div>
    );
  }

  const style = VERDICT_STYLES[locationFit.verdict] ?? VERDICT_STYLES.unknown;

  return (
    <div
      style={{ position: "relative", display: "inline-block" }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          fontSize: 13,
          fontWeight: 700,
          padding: "4px 10px",
          borderRadius: 6,
          background: style.bg,
          color: style.fg,
          cursor: "default",
          whiteSpace: "nowrap",
        }}
      >
        {style.label}
      </div>

      {hovering && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            top: "100%",
            paddingTop: 6,
            right: 0,
            zIndex: 20,
            width: 300,
          }}
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
                title="Re-check location fit"
                style={{
                  fontSize: 11,
                  border: "none",
                  background: "none",
                  color: analyzing ? "#9ca3af" : "#374151",
                  cursor: analyzing ? "default" : "pointer",
                  textDecoration: "underline",
                }}
              >
                {analyzing ? "Re-checking…" : "↻ Re-check"}
              </button>
            </div>

            {error && (
              <div style={{ color: "#991b1b", marginBottom: 8 }}>{error}</div>
            )}

            <p style={{ margin: "0 0 10px 0" }}>{locationFit.explanation}</p>

            {locationFit.highlights?.length > 0 && (
              <ul style={{ margin: 0, padding: "0 0 0 16px" }}>
                {locationFit.highlights.map((h, i) => (
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
