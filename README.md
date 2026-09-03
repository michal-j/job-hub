# Job Hub — Milestone 2

Password-gated app shell + working Adzuna ingestion, triggered manually.
Scheduled automation and the list UI come in later milestones.

## Setup

1. **Create a Supabase project** at supabase.com (free tier).
   - In the SQL Editor, paste and run `supabase/schema.sql`.
   - In Project Settings > API, copy the **Project URL** and the
     **service_role** key (not the anon key — this app runs entirely
     server-side).

2. **Install dependencies**
   ```
   npm install
   ```

3. **Configure environment variables**
   ```
   cp .env.local.example .env.local
   ```
   Fill in `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and pick any
   `APP_PASSWORD`.

   Also sign up free at https://developer.adzuna.com/ (instant, no
   approval wait) and fill in `ADZUNA_APP_ID` / `ADZUNA_APP_KEY`.

4. **Run locally**
   ```
   npm run dev
   ```
   Open http://localhost:3000 — your browser will prompt for a username
   (anything) and password (`APP_PASSWORD`). You should see "Connected to
   Supabase. No jobs yet."

## Deploying to Vercel (free tier)

1. Push this repo to GitHub.
2. Import it in Vercel.
3. In Vercel's Project Settings > Environment Variables, add the same
   three variables from `.env.local` (never commit `.env.local` itself —
   it's gitignored).
4. Deploy. The Basic Auth prompt will gate the live URL the same way it
   does locally.

## Trying ingestion

With the dev server running, trigger it manually:

```
curl -u :<APP_PASSWORD> -X POST http://localhost:3000/api/ingest/adzuna
```

Response looks like `{"jobsFound": 34, "jobsNew": 34}`. Run it twice in a
row — the second run should report `jobsNew: 0` since everything's already
deduped. Check the Supabase table editor to see real rows in `job`,
`job_listing`, and `company`.

## What's next (milestone 3)

A list UI reading from the `job` table — title, company, location, posted
date, source link.
