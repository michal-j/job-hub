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
    <main className="login-page">
      <div className="login-brand">
        <div className="login-brand-name">Job Hub</div>
      </div>
      <p className="login-tagline">
        Pulls new Product Manager roles daily, scores each one against your
        CV with Claude, and tracks them from first look to offer.
      </p>

      <div className="login-cards">
        <div className="login-card">
          <div className="login-card-icon indigo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="2" />
              <path d="M8 11V7a4 4 0 1 1 8 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h2>Sign in</h2>
          <p className="login-card-sub">Your personal dashboard — jobs, CV, and AI scoring.</p>

          <form onSubmit={handleSubmit}>
            <label className="login-field">
              <span>Email</span>
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <label className="login-field">
              <span>Password</span>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            {error && <p className="login-error">{error}</p>}

            <button type="submit" disabled={submitting} className="login-submit">
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <div className="login-card">
          <div className="login-card-icon teal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
              <path d="M10 9l5 3-5 3V9z" fill="currentColor" />
            </svg>
          </div>
          <h2>Try the demo</h2>
          <p className="login-card-sub">See the whole app, no login required.</p>

          <ul className="login-demo-list">
            <li>Listings pulled daily from multiple job boards</li>
            <li>Each one scored against a CV, powered by Claude</li>
            <li>Track status from new lead to offer</li>
          </ul>

          <a href="/demo" className="login-demo-cta">
            Open the demo →
          </a>
        </div>
      </div>
    </main>
  );
}
