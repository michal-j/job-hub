"use client";

import { useEffect, useState } from "react";
import { DEFAULT_THEME, THEME_STORAGE_KEY, Theme, isTheme } from "@/lib/theme";

export function useTheme() {
  // ThemeScript already set the real value on <html> before hydration —
  // this just mirrors it into React state so the switcher can render
  // which option is active and react to clicks.
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    if (isTheme(current)) setThemeState(current);
  }, []);

  function setTheme(next: Theme) {
    setThemeState(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // localStorage can throw in private-browsing contexts — the theme
      // still applies for this page view, it just won't persist.
    }
  }

  return { theme, setTheme };
}
