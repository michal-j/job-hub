import { createBrowserClient } from "@supabase/ssr";

// Client-only. Uses the public anon/publishable key, which is safe to
// expose — the whole app is still gated by middleware checking the
// session this client sets, and it's never used to bypass that.
export function getSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
