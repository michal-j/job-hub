"use client";

import { useState } from "react";
import { STATUS_STYLES } from "./statusStyles";

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "interested", label: "Interested" },
  { value: "applied", label: "Applied" },
  { value: "interviewing", label: "Interviewing" },
  { value: "rejected", label: "Rejected" },
  { value: "offer", label: "Offer" },
  { value: "not_interested", label: "Not interested" },
];

export function StatusSelect({
  jobId,
  status,
  onChange,
}: {
  jobId: string;
  status: string;
  onChange: (jobId: string, newStatus: string) => void;
}) {
  const [saving, setSaving] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value;
    setSaving(true);

    // Update immediately for a responsive feel; the PATCH runs in the
    // background. If it fails, we just log it — worst case the person
    // re-picks the status, which is an acceptable failure mode for a
    // personal single-user tool.
    onChange(jobId, newStatus);

    try {
      const res = await fetch("/api/jobs/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, status: newStatus }),
      });
      if (!res.ok) {
        console.error("Failed to save status", await res.text());
      }
    } catch (err) {
      console.error("Failed to save status", err);
    } finally {
      setSaving(false);
    }
  }

  const style = STATUS_STYLES[status] ?? STATUS_STYLES.new;

  return (
    <select
      value={status}
      onChange={handleChange}
      onClick={(e) => e.stopPropagation()}
      disabled={saving}
      style={{
        fontSize: 13,
        padding: "4px 8px",
        borderRadius: 6,
        border: `1px solid ${style.border}`,
        background: saving ? "#f3f4f6" : "white",
        color: "#111827",
      }}
    >
      {STATUS_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
