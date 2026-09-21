# Job Hub

A personal job-search dashboard: pulls new listings from several sources
daily, scores each one against your CV with Claude, flags whether the
location/remote terms actually work for you, and lets you track status
(new → interested → applied → interviewing → rejected/offer) as you work
through them. Single-owner, real Supabase auth, deployed on Vercel.

For the full picture of how this app is built — architecture, data model,
every feature, known gaps, deployment gotchas — see
[`HANDOFF.md`](./HANDOFF.md). This file is just setup/day-to-day usage.

## Setup

1. **Create a Supabase project** at supabase.com (free tier).
   - In the SQL Editor, run `supabase/schema.sql`, then every file in
     `supabase/migrations/` in order (each is a one-time `alter table`/
     `insert` — see `HANDOFF.md` §5 for what each one did).
   - In Project Settings > API, copy the **Project URL**, the
     **service_role** key, and the **anon/publishable** key.
   - On the Authentication > Sign In / Up page (the page-level toggle,
     not inside a specific provider's settings), turn **off** "Allow new
     users to sign up" — this is a single-owner app, not a multi-user one.
   - In Authentication > Users, click "Add user" and create your one
     account (your email + a password of your choosing). That's your
     Job Hub login — and also the value for `OWNER_EMAIL` below, which is
     a second, code-level check so a session for any other email is
     rejected too, even if signups ever end up re-enabled by mistake.

2. **Install dependencies**
   ```
   npm install
   ```

3. **Configure environment variables**
   ```
   cp .env.local.example .env.local
   ```
   Fill in `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
   `OWNER_EMAIL` (the email of the user you created above).

   Then sign up for whichever job sources you want (all free, no approval
   wait): `ADZUNA_APP_ID`/`ADZUNA_APP_KEY` at
   https://developer.adzuna.com/, `JOOBLE_API_KEY` at
   https://jooble.org/api/about. Arbeitnow, Remotive, and the company-board
   sources (Greenhouse/Ashby/SmartRecruiters/Personio) need no key.

   `ANTHROPIC_API_KEY` powers CV extraction and the two AI analyses
   (compatibility, location fit) — get one at console.anthropic.com.

4. **Run locally**
   ```
   npm run dev
   ```
   Open http://localhost:3000 — you'll be redirected to `/login`. Sign in
   with the account you created above.

   `/demo` is a public route with no login required — a frozen sample
   dataset with edits kept in `localStorage` only, no Supabase or
   Anthropic calls. Useful for showing the app off without exposing your
   real data.

## Deploying to Vercel (free tier)

1. Push this repo to GitHub.
2. Import it in Vercel.
3. In Vercel's Project Settings > Environment Variables, add the same
   variables from `.env.local` — for each one, enable both **Production**
   and **Preview** (unless you specifically want it scoped narrower), and
   leave "Git Branch" empty (never commit `.env.local` itself, it's
   gitignored).
4. Deploy. `/login` will gate the live URL the same way it does locally;
   `/demo` stays public. `vercel.json` wires up the daily Cron schedule
   for each ingestion source automatically.

## Day-to-day usage

**Upload your CV** at `/cv` (PDF only) — this powers the compatibility
scoring. Re-upload any time; every upload is kept, the most recent one is
what's used.

**Ingestion** runs automatically once a day per source (see `vercel.json`
for the schedule). To trigger one manually, sign in in the browser first,
then run the fetch from the browser console (it'll carry your session
cookie — plain `curl` can't, since ingestion routes are gated by
middleware like everything else):

```js
fetch("/api/ingest/adzuna", { method: "POST" }).then((r) => r.json()).then(console.log)
```

Response looks like `{"jobsFound": 34, "jobsNew": 12}`. Vercel Cron itself
uses a separate `Bearer` token (`CRON_SECRET`), unaffected by any of
this — see `middleware.ts`.

**Analyzing a job**: new jobs are auto-analyzed at ingestion time if a CV
is on file. Use the "Analyze fit" / "Check location" buttons (or
"↻ Re-analyze" / "↻ Re-check" once a result exists) to run either one for
an individual job on demand — e.g. after uploading a new CV.

## Testing

```
npm test
```

Runs the Vitest unit suite (pure logic only — dedup hashing, source
filtering, demo persistence, theme color mapping). It doesn't touch
Supabase or Anthropic. For everything else — auth, ingestion, CV
upload, AI analysis, responsive layout — see the manual test cases in
[`TEST_CASES.md`](./TEST_CASES.md).
