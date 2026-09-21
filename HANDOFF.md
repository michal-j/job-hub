# Job Hub — Handoff (current state, 2026-09-21)

This describes the app **as it actually is right now**, for a fresh
Claude Code session with no memory of how it got here. Read this whole
file before touching code. The `README.md` covers setup/day-to-day usage;
this file covers the "why" and the traps.

---

## 1. What this app is

A personal job-search dashboard, single owner. Several sources are
polled once a day for Product-Manager-shaped roles; each new listing gets
scored against the owner's CV (0-100 compatibility) and checked for
location/remote eligibility, both via Claude. The owner works through the
resulting list, changing each job's status as they go
(`new → interested → applied → interviewing → rejected/offer/not_interested`).

**Repo:** `github.com/michal-j/job-hub`. Deployed to Vercel, git-connected
to the `main` branch — every push to `main` auto-deploys to production,
and pushing any other branch gets its own preview deployment (used
deliberately for the auth/demo work below rather than merging blind).

**Stack:** Next.js 14 (App Router), TypeScript, Supabase (Postgres +
Auth), Claude (Anthropic API) for the AI features. No CSS
framework — every component is inline `style={{...}}` objects, on
purpose; don't introduce Tailwind or a stylesheet without discussing it
first, it'd be an inconsistent patch over most of the app.

---

## 2. Architecture

```
middleware.ts              — the whole auth gate, see §3
app/page.tsx                — real app shell (server component, fetches via
                               service-role Supabase client)
app/login/page.tsx          — email/password sign-in ("use client")
app/demo/page.tsx            — public demo shell, see §3
app/cv/page.tsx + CvUploadForm.tsx — CV upload + extracted-facts display
app/components/JobList.tsx  — THE shared list UI, real app and demo both
                               render this (see §3) — filters, status
                               change, renders each job row
app/components/StatusSelect.tsx        — per-job status <select>
app/components/CompatibilityBadge.tsx  — "X% match" badge + AI popover
app/components/LocationBadge.tsx       — "Location: Fit/No fit/Unclear" badge
app/components/SignOutButton.tsx       — real app only
app/components/statusStyles.ts         — status → color mapping, shared
app/components/usePopupDirection.ts    — flips badge popovers up/down near
                                          the bottom of the viewport
lib/supabase.ts              — service-role server client (bypasses RLS —
                                see §5 for why that's fine)
lib/supabaseBrowser.ts       — anon-key browser client, login/sign-out only
lib/demoJobs.ts              — localStorage read/write for demo mode
lib/jobs.ts                  — getJobList(): the one big query behind "/"
lib/ingestion.ts             — runIngestionForSource(): shared pipeline
                                every source funnels through (dedup,
                                insert, auto-analyze) — see §4
lib/sources/*.ts             — one file per source, each returns
                                NormalizedJob[] (lib/sources/types.ts)
lib/companyBoards.ts          — config list consumed by the one
                                "company-boards" ingestion route (§4)
lib/dedup.ts                  — title+company+location → sha256, the
                                cross-source de-duplication key
lib/compatibility.ts          — Claude prompt + call for the match score
lib/locationFit.ts             — Claude prompt + call for location/remote
                                eligibility (fixed candidate context, see
                                the file itself if the owner ever moves)
lib/cv.ts                      — Claude prompt + call for CV → structured
                                facts extraction
lib/anthropic.ts               — client + AI_MODEL constant (currently
                                claude-haiku-4-5 — cheap, deliberately)
data/jobs-demo.json            — frozen demo snapshot, see §3
app/api/ingest/*/route.ts      — one route per source, GET (Cron) and
                                POST (manual) both call the same handler
app/api/jobs/status/route.ts   — PATCH: status changes from the real app
app/api/jobs/[id]/analyze/…    — POST: on-demand compatibility re-score
app/api/jobs/[id]/analyze-location/… — POST: on-demand location re-check
app/api/cv/upload/route.ts     — POST: PDF → text → Claude extraction
app/api/ai-test/route.ts       — diagnostic-only, not gated specially,
                                safe to delete or keep
supabase/schema.sql             — base schema
supabase/migrations/*.sql       — run once each, in order, by hand in the
                                Supabase SQL editor (no migration runner)
vercel.json                     — daily Cron schedule, one entry per
                                ingestion route, offset a few minutes apart
*.test.ts                        — Vitest unit tests, colocated with the
                                code they cover (lib/dedup.test.ts, etc.)
                                — run with `npm test`
vitest.config.ts                — jsdom environment + the same "@/" path
                                alias as tsconfig, so tests can import
                                app code the same way it imports itself
TEST_CASES.md                    — human-readable test cases, automated
                                and manual (see there for what's covered)
CHANGELOG.md                     — Keep a Changelog; "Unreleased" means
                                "not yet pushed to main", see its header
```

**Run locally:** `npm run dev` → http://localhost:3000.

**Responsive conventions (added 2026-09-21):** the job row's fixed-width
controls (status select, score badge, location badge — none of them
shrink) don't leave room for the title below ~620px, so
`app/globals.css` stacks the row at that breakpoint. Two things make
that possible without a full rewrite:
- `JobList.tsx` wraps the logo + title/meta block in a `.job-heading`
  div specifically so they wrap together as one unit, instead of the
  title column being squeezed to zero width by the actions cluster next
  to it (that's what used to happen).
- `CompatibilityBadge`/`LocationBadge`'s popovers use a shared
  `.popover-anchor` class (width capped with `min()` against the
  viewport) instead of the inline fixed-pixel-width style they used to
  have, and `usePopupDirection` now tracks an `open` state with a
  document-level outside-click listener — hover alone never reaches
  touch devices, so tapping the badge opens it and tapping elsewhere
  closes it. Any new hover-triggered popover should follow the same
  pattern rather than hover-only.

---

## 3. The single most important thing: real auth + a public demo

Until 2026-09-18 this app was gated by a single shared Basic Auth
password (`APP_PASSWORD`). It's now real Supabase email/password auth,
and there's a public `/demo` route — both added in the same piece of
work, modeled on a sister project (Movie Shelf) that solved the same
"single-owner app + public demo" problem, adapted to this app's Next.js
architecture (Movie Shelf is vanilla JS with no server layer; this app
already has one, so its RLS-based approach wasn't copied — see §5).

**`middleware.ts` is the entire gate.** For every request:
- `/api/ingest/*` with the exact `Bearer ${CRON_SECRET}` header passes
  unconditionally — that's Vercel Cron, which can't hold a session.
- `/login` and `/demo` (and anything under them) need no session at all.
- Everything else needs a Supabase session **whose email matches
  `OWNER_EMAIL` exactly** — not just "any session". That second check
  matters: Supabase's "disallow new signups" dashboard toggle is the
  first line of defense, but `OWNER_EMAIL` is what actually stops a
  stranger's account from getting in if that toggle is ever off,
  missed, or reset. Don't remove the email comparison and fall back to
  "session exists" even if disabling signups feels sufficient.
- A missing session fails a page request with a redirect to `/login`,
  and an API request with a 401 JSON body (not a redirect — a fetch call
  getting redirected to an HTML page is worse than a clean error).

**`app/demo/page.tsx` + `JobList` and its children are shared** between
the real app and the demo, the same principle as Movie Shelf's shared
`app.js` branching on a `DEMO_MODE` flag — here it's a `demoMode` prop
threaded through instead, since this is React:
- `JobList`: on mount, if `demoMode`, prefers whatever's in
  `localStorage` (`lib/demoJobs.ts`, key `jobHub.demoJobs`) over the
  frozen snapshot prop — a returning demo visitor sees their own edits.
  Every status change writes the *whole* array back to that one key
  (not a diff) — deliberately simple, same as Movie Shelf's
  `saveDemoMovies`.
- `StatusSelect`: `demoMode` skips the `PATCH /api/jobs/status` fetch
  entirely — no backend call happens in the demo, full stop.
- `CompatibilityBadge` / `LocationBadge`: `demoMode` makes the
  "Analyze"/"Re-analyze" and "Check location"/"Re-check" controls inert —
  no `onClick`, a `title` tooltip explaining why. **Deliberately not the
  native `disabled` attribute** — that suppresses hover/title tooltips in
  most browsers, which would silently break the "why can't I click this"
  explanation. Use `aria-disabled` + a conditional `onClick` instead, the
  same fix Movie Shelf already had to learn the hard way for this exact
  reason (see its own handoff, `.btn-inert`).

**`data/jobs-demo.json`** is a frozen 33-job snapshot: ~10 are real,
currently-published listings pulled from the live `job` table at
snapshot time (their links may go dead later if the posting comes down —
known, not auto-refreshed, same tradeoff Movie Shelf accepted for its own
demo). Every other job, and **every single compatibility/location result
on every job including the real ones**, is fabricated — plausible-
sounding, not real Anthropic output, not the owner's real analysis. If
you regenerate this file, keep both of those properties: real links
where used, but zero real AI output presented as demo data.

**What broke while shipping this, worth remembering:**
- `NEXT_PUBLIC_*` env vars are inlined **at build time**, not read live —
  adding one in Vercel and reloading the page does nothing until a fresh
  build runs. Same gotcha Movie Shelf hit with `TMDB_API_KEY`, different
  mechanism (build-time inlining vs. per-deployment env snapshot), same
  fix: trigger an actual redeploy.
- Vercel's env var UI can reject a save two different ways that look
  like bugs but aren't: naming something `NEXT_PUBLIC_*` while its type
  is "Sensitive" (switch it to "Config" — these values are meant to be
  public, RLS/middleware is the real boundary, not key secrecy), and
  scoping a var to a specific Git branch while also targeting more than
  just Preview (clear the branch field, or restrict the target to
  Preview only).
- Supabase moved "Allow new users to sign up" out of the per-provider
  (Email) settings panel to the page-level Sign In / Up screen in newer
  dashboard versions — if you're staring at the Email provider modal and
  don't see it, you're one level too deep, not missing a feature.

---

## 4. Ingestion pipeline

Every source, no matter how different its API, ends up calling
`runIngestionForSource(sourceName, fetchJobs)` in `lib/ingestion.ts`,
which does the *only* copy of: find-or-create the `job_source` row,
record an `update_run`, dedupe by `lib/dedup.ts`'s hash, insert
`job`/`job_listing`/`job_status`, and — best-effort, failures logged not
thrown — auto-run compatibility scoring (if a CV is on file) and location
analysis (always) for each genuinely new job. A failure analyzing one job
never breaks ingestion for the rest of the batch; that job just stays
unscored until a manual "Analyze"/"Check" click later.

Two shapes of source, both normalizing to `NormalizedJob`
(`lib/sources/types.ts`):
- **Keyword-search APIs** (Adzuna, Jooble, Remotive): the source file
  itself scopes results to PM-shaped roles via search terms — no
  additional filtering needed.
- **"Return the whole board" APIs** (Arbeitnow, and every company-board
  platform: Greenhouse/Ashby/SmartRecruiters/Personio): every result
  gets filtered client-side through `PM_TITLE_MATCH`
  (`lib/sources/shared.ts`) before anything is stored — otherwise every
  department's postings would flow into the pipeline and through AI
  scoring.

`lib/companyBoards.ts` is the config list the one `/api/ingest/company-
boards` route iterates — each company is isolated (one failing slug/API
change doesn't stop the rest). To add a company: find its careers URL,
match the ATS by URL pattern (documented in that file's header comment),
add one line.

`vercel.json`'s Cron schedule offsets each source by a few minutes
(06:00, 06:05, 06:10...) — not load-bearing, just avoids every source
hitting Supabase in the same instant.

---

## 5. Data model & backend

Base schema in `supabase/schema.sql`; every change since is a numbered
file in `supabase/migrations/`, run by hand in the SQL editor — **there
is no migration runner**, so a fresh Supabase project needs the base
schema then every migration file in order.

Core tables: `job_source`, `company`, `job` (one row per deduped
listing, `dedup_hash` is the unique key), `job_listing` (source-specific
detail — url, raw payload), `job_status` (the one mutable field the UI
changes), `update_run` (ingestion history/diagnostics). Added later:
`cv_profile` (append-only despite its own migration's comment claiming
"only ever holds one row" — the code actually keeps every upload and
just reads the most recent by `uploaded_at`; that comment is stale, the
code is what's true), `compatibility_analysis` and `location_analysis`
(one row per job, upserted on `job_id`).

`compatibility_analysis` went through a real shape change: migration 004
dropped `strong_matches`/`missing_requirements`/`concerns` (three
separate lists) in favor of `overview` (1-2 sentences) + `highlights`
(a short mixed list) — a deliberate simplification, not a rollback.
Migration 005 is a fix for an oversight in 004: the old `reasoning`
column was never actually dropped and its `NOT NULL` constraint was
silently blocking every insert since nothing wrote to it anymore. If a
future schema change touches a column that's genuinely being replaced,
double check the old one is actually gone, not just unused.

**RLS is enabled on every table (Supabase's default for new tables) but
none of them have any policies.** This isn't a gap — every real query
runs through `lib/supabase.ts`'s service-role client, which bypasses RLS
entirely, and the actual access boundary is `middleware.ts` (§3), not
row-level policy. This is a deliberate divergence from Movie Shelf, whose
vanilla-JS client talks to Supabase directly with the anon key and
therefore *needs* RLS to do anything at all. Don't "fix" job-hub by
adding RLS policies — there's no code path that would use them, and the
service-role key would ignore them anyway.

---

## 6. Known deferred work / backlog

1. **Company matching is find-or-create by exact name.** Two sources
   spelling the same company differently (`"SumUp"` vs `"sumup"`,
   `"Creative Force"` vs `"Creative Force "` with a trailing space — both
   seen in real ingested data) create two separate `company` rows. A real
   identity/matching strategy (domain-based, fuzzy match, manual merge
   UI) hasn't been designed.
2. **No UI for merging/deleting duplicate jobs** that slip past the
   dedup hash (e.g. a genuinely reworded repost). Would need to be done
   by hand via SQL today.
3. **`/api/ai-test`** is a leftover connectivity diagnostic from before
   any real AI feature existed. Harmless, ungated beyond the normal
   middleware, safe to delete whenever.
4. **The real-job links baked into `data/jobs-demo.json` will go stale**
   the moment one of those postings comes down — known, not
   auto-refreshed, same call already made for Movie Shelf's own demo.
5. **No way to manually trigger ingestion without a browser session**
   post-auth-migration — the old `curl -u :$APP_PASSWORD` recipe no
   longer works (see README's day-to-day section for the browser-console
   replacement). Building a proper "run ingestion now" button hasn't
   been asked for.

---

## 7. Environment / secrets / deployment gotchas

- **Two Supabase key pairs, different trust levels:** `SUPABASE_URL` +
  `SUPABASE_SERVICE_ROLE_KEY` (server-only, bypasses RLS, never expose)
  vs. `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  (public, browser-facing, used only for login/sign-out — RLS/middleware
  is the real boundary either way, see §5).
- **`OWNER_EMAIL`** must exactly match the one Supabase Auth user's
  email (case-sensitive in practice) or every sign-in will silently
  bounce back to `/login` with no visible error — this is the single
  most likely cause if "login doesn't work" gets reported and the
  credentials are definitely right.
- **`CRON_SECRET`** is unrelated to user auth — it's the one bypass
  `middleware.ts` grants to Vercel Cron for `/api/ingest/*` only, checked
  via exact `Bearer` match.
- **`NEXT_PUBLIC_*` build-time inlining** and the two Vercel env-var UI
  traps (Sensitive-vs-Config, Git-Branch-vs-multiple-targets) are covered
  in §3 — re-read that if a fresh deploy 500s with
  `MIDDLEWARE_INVOCATION_FAILED`.
- **Vercel Cron + preview deployments**: crons only run against
  production. A preview branch's `/api/ingest/*` routes still work
  manually (Cron secret or a signed-in session), they just won't fire on
  a schedule.
- **Test coverage is intentionally partial.** `npm test` (Vitest) covers
  pure logic with no Supabase/Anthropic/browser dependency — dedup
  hashing, the company-board title filter, status→theme color mapping,
  demo-mode localStorage persistence (see `TEST_CASES.md` for exactly
  what). Everything that needs a real session, a live browser, or an
  actual AI/PDF call is manual — walk through `TEST_CASES.md`'s manual
  section, plus `npm run build` (catches type errors), both locally and
  against a Vercel preview deployment before merging. Keep doing both
  for anything touching auth, ingestion, or the demo.
