import { createClient } from "@supabase/supabase-js";

// Server-only client. Uses the service role key, which bypasses row-level
// security — fine here because the whole app is gated by the password
// middleware and this file is never imported into a "use client" component.
// Do NOT expose SUPABASE_SERVICE_ROLE_KEY via NEXT_PUBLIC_* env vars.
export function getSupabaseServerClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables."
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
