"use client";

import { useState } from "react";
import type { JobListItem } from "@/lib/jobs";
import { usePopupDirection } from "./usePopupDirection";

const VERDICT_STYLES: Record<string, { cls: "fit" | "nofit" | "unclear"; label: string }> = {
  fit: { cls: "fit", label: "Fit" },
  no_fit: { cls: "nofit", label: "No fit" },
  unknown: { cls: "unclear", label: "Unclear" },
};

const DEMO_TOOLTIP = "Not available in the demo — sign in to run real analysis.";

// Must match .popover-anchor.narrow's own width cap in globals.css — see
// usePopupDirection for why this needs to be known in JS too.
const POPOVER_MAX_WIDTH = 300;

export function LocationBadge({
  jobId,
  locationFit,
  onAnalyzed,
  demoMode = false,
}: {
  jobId: string;
  locationFit: JobListItem["locationFit"];
  onAnalyzed: (jobId: string, result: JobListItem["locationFit"]) => void;
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
          className="btn-ghost"
          onClick={demoMode ? undefined : runAnalysis}
          aria-disabled={demoMode || analyzing}
          title={demoMode ? DEMO_TOOLTIP : undefined}
          style={{
            opacity: demoMode || analyzing ? 0.5 : 1,
            cursor: demoMode || analyzing ? "default" : "pointer",
          }}
        >
          {analyzing ? "Checking…" : "Check location"}
        </button>
        {error && <div className="error-text">{error}</div>}
      </div>
    );
  }

  const style = VERDICT_STYLES[locationFit.verdict] ?? VERDICT_STYLES.unknown;

  return (
    <>
      {/* Sibling of the trigger, not a child — see CompatibilityBadge for
          why: it visually covers the viewport via position:fixed, but
          would otherwise still count as "inside" the trigger for
          usePopupDirection's outside-click check since DOM containment,
          not visual position, is what `.contains()` tests. */}
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
          className={`loc ${style.cls}`}
          style={{ cursor: "default" }}
        >
          {style.label}
        </div>

        {open && (
          <div
            onClick={(e) => e.stopPropagation()}
            className={`popover-anchor narrow ${placement.direction === "up" ? "direction-up" : "direction-down"}`}
            style={{ left: placement.left }}
          >
            <div className="popover">
              <div className="popover-header">
                <span className="tag-ai">AI-GENERATED</span>
                <button
                  className="popover-reanalyze"
                  onClick={demoMode ? undefined : runAnalysis}
                  aria-disabled={demoMode || analyzing}
                  title={demoMode ? DEMO_TOOLTIP : "Re-check location fit"}
                  style={{ opacity: demoMode || analyzing ? 0.5 : 1 }}
                >
                  {analyzing ? "Re-checking…" : "↻ Re-check"}
                </button>
              </div>

              {error && <div className="error-text">{error}</div>}

              <p>{locationFit.explanation}</p>

              {locationFit.highlights?.length > 0 && (
                <ul>
                  {locationFit.highlights.map((h, i) => (
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
