"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

// Scoped to a single job row's .job-actions (StatusSelect +
// CompatibilityBadge + LocationBadge), NOT the whole page — see
// usePopupDirection and JobList for why. Each row gets its own instance,
// so at most 3 components ever consume one of these, regardless of how
// many jobs are in the list.
const PopoverLockContext = createContext<{
  locked: boolean;
  setLocked: (locked: boolean) => void;
}>({ locked: false, setLocked: () => {} });

export function PopoverLockProvider({ children }: { children: ReactNode }) {
  const [locked, setLocked] = useState(false);
  return (
    <PopoverLockContext.Provider value={{ locked, setLocked }}>
      {children}
    </PopoverLockContext.Provider>
  );
}

export function usePopoverLock() {
  return useContext(PopoverLockContext);
}
