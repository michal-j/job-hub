"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";

export function SignOutButton() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleClick() {
    setSigningOut(true);
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleClick}
      disabled={signingOut}
      title="Sign out"
      className="btn"
      style={{ cursor: signingOut ? "default" : "pointer", opacity: signingOut ? 0.6 : 1 }}
    >
      {signingOut ? "Signing out…" : "Sign out"}
    </button>
  );
}
