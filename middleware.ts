import { NextRequest, NextResponse } from "next/server";

// Simple shared-secret gate: since this app is single-user with no auth
// system, this is enough to keep it from being casually indexed/browsed
// by anyone who finds the URL. The password lives only in Vercel's
// environment variables, never in code.
export function middleware(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  // Vercel Cron calls /api/ingest/* on a schedule and can't provide the
  // Basic Auth password (there's no browser involved). It sends a Bearer
  // token instead, set via the CRON_SECRET env var — only that route
  // accepts this alternate auth, and only with the exact matching secret.
  if (
    request.nextUrl.pathname.startsWith("/api/ingest/") &&
    authHeader === `Bearer ${process.env.CRON_SECRET}` &&
    process.env.CRON_SECRET
  ) {
    return NextResponse.next();
  }

  if (authHeader?.startsWith("Basic ")) {
    const decoded = atob(authHeader.split(" ")[1]);
    const [, password] = decoded.split(":");

    if (password && password === process.env.APP_PASSWORD) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="job-hub"' },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
