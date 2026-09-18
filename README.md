# Job Hub — Milestone 2

Password-gated app shell + working Adzuna ingestion, triggered manually.
Scheduled automation and the list UI come in later milestones.

## Setup

1. **Create a Supabase project** at supabase.com (free tier).
   - In the SQL Editor, paste and run `supabase/schema.sql`.
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

   Also sign up free at https://developer.adzuna.com/ (instant, no
   approval wait) and fill in `ADZUNA_APP_ID` / `ADZUNA_APP_KEY`.

4. **Run locally**
   ```
   npm run dev
   ```
   Open http://localhost:3000 — you'll be redirected to `/login`. Sign in
   with the account you created above. You should see "Connected to
   Supabase. No jobs yet."

   `/demo` is a public route with no login required — a frozen sample
   dataset with edits kept in `localStorage` only, no Supabase or
   Anthropic calls. Useful for showing the app off without exposing your
   real data.

## Deploying to Vercel (free tier)

1. Push this repo to GitHub.
2. Import it in Vercel.
3. In Vercel's Project Settings > Environment Variables, add the same
   variables from `.env.local` (never commit `.env.local` itself — it's
   gitignored).
4. Deploy. `/login` will gate the live URL the same way it does locally;
   `/demo` stays public.

## Trying ingestion

Ingestion routes are gated by middleware like everything else, so a plain
`curl` can't trigger them — sign in in the browser first, then run the
fetch from the browser console (it'll carry your session cookie):

```js
fetch("/api/ingest/adzuna", { method: "POST" }).then((r) => r.json()).then(console.log)
```

Response looks like `{"jobsFound": 34, "jobsNew": 34}`. Run it twice in a
row — the second run should report `jobsNew: 0` since everything's already
deduped. Check the Supabase table editor to see real rows in `job`,
`job_listing`, and `company`.

Vercel Cron uses a separate `Bearer` token (`CRON_SECRET`), unaffected by
any of this — see `middleware.ts`.

## What's next (milestone 3)

A list UI reading from the `job` table — title, company, location, posted
date, source link.
