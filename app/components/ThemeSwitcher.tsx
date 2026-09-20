"use client";

import { useTheme } from "./useTheme";

const OPTIONS: { value: "linear-dark" | "editorial-mono"; label: string }[] = [
  { value: "linear-dark", label: "Linear" },
  { value: "editorial-mono", label: "Editorial" },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="theme-switcher" role="group" aria-label="Theme">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          // aria-pressed is for assistive tech only — it's driven by React
          // state, which starts at DEFAULT_THEME on every load and can't
          // be correct until after hydration. The *visual* active state
          // below is driven by data-theme-option + CSS instead, which
          // reads [data-theme] on <html> — already correct before the
          // very first paint (see ThemeScript) — so the highlighted pill
          // is never wrong, not even for the one frame before React runs.
          aria-pressed={theme === opt.value}
          data-theme-option={opt.value}
          onClick={() => setTheme(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
