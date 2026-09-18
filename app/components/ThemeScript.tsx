import { DEFAULT_THEME, THEME_STORAGE_KEY } from "@/lib/theme";

// Runs before hydration so the correct theme's colors are already in
// place on first paint — without this, the page would flash the default
// theme and then snap to whatever was saved in localStorage.
const SCRIPT = `
(function() {
  try {
    var saved = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    var theme = saved === "linear-dark" || saved === "editorial-mono" ? saved : ${JSON.stringify(DEFAULT_THEME)};
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {
    document.documentElement.setAttribute("data-theme", ${JSON.stringify(DEFAULT_THEME)});
  }
})();
`;

export function ThemeScript() {
  // eslint-disable-next-line react/no-danger
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
