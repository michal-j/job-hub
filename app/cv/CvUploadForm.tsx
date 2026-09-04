"use client";

import { useState } from "react";

export function CvUploadForm() {
  const [status, setStatus] = useState<"idle" | "uploading" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState("");

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("uploading");
    setErrorMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/cv/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data.error ?? "Upload failed");
        return;
      }

      if (data.extractionWarning) {
        alert(
          `CV saved, but the AI analysis step failed: ${data.extractionWarning}\n\nYour CV text is stored — you can try re-uploading, or this can be retried later.`
        );
      }

      setStatus("idle");
      window.location.reload();
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Upload failed");
    }
  }

  return (
    <div>
      <label
        style={{
          display: "inline-block",
          padding: "10px 16px",
          background: "#111827",
          color: "white",
          borderRadius: 8,
          fontSize: 14,
          cursor: "pointer",
        }}
      >
        {status === "uploading" ? "Uploading…" : "Upload CV (PDF)"}
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          disabled={status === "uploading"}
          style={{ display: "none" }}
        />
      </label>

      {status === "error" && (
        <p style={{ color: "#991b1b", fontSize: 14, marginTop: 8 }}>
          {errorMessage}
        </p>
      )}
    </div>
  );
}
