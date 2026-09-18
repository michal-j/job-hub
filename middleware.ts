import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

// Routes that need no session at all: the sign-in page itself, and the
// public demo (static snapshot + localStorage, no Supabase/Anthropic
// calls — see app/demo/page.tsx).
const PUBLIC_PATHS = ["/login", "/demo"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

export async function middleware(request: NextRequest) {
  // Vercel Cron calls /api/ingest/* on a schedule and can't provide a
  // Supabase session (there's no browser involved). It sends a Bearer
  // token instead, set via the CRON_SECRET env var — only that route
  // accepts this alternate auth, and only with the exact matching secret.
  const authHeader = request.headers.get("authorization");
  if (
    request.nextUrl.pathname.startsWith("/api/ingest/") &&
    authHeader === `Bearer ${process.env.CRON_SECRET}` &&
    process.env.CRON_SECRET
  ) {
    return NextResponse.next();
  }

  if (isPublicPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          response.cookies.set(name, value, options);
        },
        remove(name, options) {
          response.cookies.set(name, "", options);
        },
      },
    }
  );

  const { data } = await supabase.auth.getUser();

  // Not just "is there a session" — this is a single-owner app, so a
  // session for anyone other than the owner's account (e.g. someone who
  // self-registered before signups got disabled in the Supabase
  // dashboard) must be rejected too. Belt-and-suspenders alongside
  // disabling signups there.
  const isOwner =
    !!data.user &&
    !!process.env.OWNER_EMAIL &&
    data.user.email === process.env.OWNER_EMAIL;

  if (!isOwner) {
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
