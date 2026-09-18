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
      style={{
        fontSize: 13,
        padding: "6px 12px",
        borderRadius: 6,
        border: "1px solid #d1d5db",
        background: "white",
        color: "#374151",
        cursor: signingOut ? "default" : "pointer",
      }}
    >
      {signingOut ? "Signing out…" : "Sign out"}
    </button>
  );
}
