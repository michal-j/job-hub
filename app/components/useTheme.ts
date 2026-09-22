"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { DEFAULT_THEME, THEME_STORAGE_KEY, Theme, isTheme } from "@/lib/theme";

// useLayoutEffect warns "does nothing on the server" if it's ever
// actually invoked during SSR — swap to useEffect there (layout effects
// don't apply server-side anyway, so behavior is unaffected).
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function useTheme() {
  // ThemeScript already set the real value on <html> before hydration —
  // this just mirrors it into React state so the switcher can render
  // which option is active and react to clicks. It starts at
  // DEFAULT_THEME to match the server-rendered markup (avoiding a
  // hydration mismatch on the switcher buttons' aria-pressed), then
  // gets corrected in a *layout* effect rather than a regular one —
  // layout effects run before the browser paints, so if the real theme
  // is different, the switcher jumps to the right answer before the
  // user ever sees the wrong one, instead of visibly flashing to it.
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);

  useIsomorphicLayoutEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    if (isTheme(current)) {
      setThemeState(current);
      return;
    }

    // ThemeScript (in <head>, runs before hydration) always sets this to
    // something valid — landing here means it didn't run, or something
    // cleared it before this effect did. Reported once as: page renders
    // like Linear Dark (the :root default, which is what you get with no
    // attribute at all) but *neither* switcher pill highlights (both
    // pills key off the exact attribute value, so a missing/invalid one
    // matches neither). Root cause unconfirmed — self-heal from
    // localStorage here instead of leaving that inconsistent state up,
    // whatever caused it.
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      const theme = isTheme(saved) ? saved : DEFAULT_THEME;
      document.documentElement.setAttribute("data-theme", theme);
      setThemeState(theme);
    } catch {
      document.documentElement.setAttribute("data-theme", DEFAULT_THEME);
      setThemeState(DEFAULT_THEME);
    }
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
