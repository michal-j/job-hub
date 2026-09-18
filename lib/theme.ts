export const THEMES = ["linear-dark", "editorial-mono"] as const;
export type Theme = (typeof THEMES)[number];

export const DEFAULT_THEME: Theme = "linear-dark";
export const THEME_STORAGE_KEY = "jobHub.theme";

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && (THEMES as readonly string[]).includes(value);
}
