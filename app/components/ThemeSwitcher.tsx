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
          aria-pressed={theme === opt.value}
          onClick={() => setTheme(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
