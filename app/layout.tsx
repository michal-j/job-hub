import "./globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "Job Hub",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
