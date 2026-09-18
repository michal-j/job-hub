"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const supabase = getSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError("Incorrect email or password.");
      setSubmitting(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 360,
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 32,
        }}
      >
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 24px 0" }}>
          Job Hub
        </h1>

        <form onSubmit={handleSubmit}>
          <label style={{ display: "block", marginBottom: 16 }}>
            <span style={{ display: "block", fontSize: 13, color: "#6b7280", marginBottom: 6 }}>
              Email
            </span>
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                boxSizing: "border-box",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                padding: "10px 12px",
                fontSize: 14,
              }}
            />
          </label>

          <label style={{ display: "block", marginBottom: 16 }}>
            <span style={{ display: "block", fontSize: 13, color: "#6b7280", marginBottom: 6 }}>
              Password
            </span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                boxSizing: "border-box",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                padding: "10px 12px",
                fontSize: 14,
              }}
            />
          </label>

          {error && (
            <p style={{ fontSize: 13, color: "#991b1b", margin: "0 0 12px 0" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: "100%",
              padding: "10px 0",
              borderRadius: 6,
              border: "none",
              background: submitting ? "#9ca3af" : "#111827",
              color: "white",
              fontSize: 14,
              fontWeight: 600,
              cursor: submitting ? "default" : "pointer",
            }}
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: 13, color: "#6b7280", marginTop: 20, marginBottom: 0 }}>
          <a href="/demo" style={{ color: "#111827" }}>
            Or try the public demo →
          </a>
        </p>
      </div>
    </main>
  );
}
