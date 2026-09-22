import "./globals.css";
import { ReactNode } from "react";
import { ThemeScript } from "./components/ThemeScript";

export const metadata = {
  title: "Job Hub",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Before the font stylesheet link deliberately — a classic
            <script> that comes after a pending <link rel="stylesheet">
            has its execution deferred until that stylesheet loads (so it
            can't query incorrect computed styles), which would delay
            setting data-theme on a slow connection. This has nothing to
            query, so it runs first and unconditionally. */}
        <ThemeScript />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
