"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

// Shared "is any AI popover open right now" flag. JobList wraps the whole
// list in the Provider and applies pointer-events:none to everything
// while locked; CompatibilityBadge/LocationBadge (via usePopupDirection)
// set it whenever their own popover opens/closes. A transparent scrim
// already blocks the rest of the page via z-index, but that depends on
// stacking/compositing being correct — pointer-events:none doesn't, it's
// an unconditional instruction with no dependency on paint order, so this
// is a second, independent guarantee rather than a duplicate of the same
// mechanism.
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
