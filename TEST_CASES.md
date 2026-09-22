# Job Hub — Test Cases

Two tiers:

- **Automated** — pure logic with no Supabase/Anthropic/browser dependency,
  covered by `npm test` (Vitest). Listed here so someone without the suite
  open can see what's actually checked.
- **Manual** — everything that needs a real Supabase session, a live
  browser, or an actual PDF/AI call. Walk through these by hand after any
  change that touches auth, ingestion, the job list, or responsive layout.
  See `HANDOFF.md` for how each piece is wired.

Run the automated tier with:

```
npm test
```

**If you are an AI agent working on this repo: actually run the manual
cases below yourself, don't just read them and move on.** Every case that
doesn't need real Supabase/Anthropic credentials (all of §"Demo mode",
§"Job list — filtering & status" cases 10-12, all of §"Responsive layout")
is reachable with nothing but a browser tool against `/demo` — there's no
excuse to skip those and leave them for the user. Use the project's
`preview_start`/browser tooling to open `/demo`, actually click through
each one, and check the real result (DOM state, computed styles, a
screenshot) rather than reasoning about the code and assuming it works —
several real bugs in this app were only ever found by actually clicking
through it (see `CHANGELOG.md`'s Unreleased section for examples: a
touch-only popover bug, a dedup hash bug found by an automated test, and
more). Only the cases explicitly marked "real app only" need credentials
you won't have — for those, say clearly in your final report which
specific cases you couldn't run and why, instead of silently skipping them
or implying they were checked.

**An iOS Simulator (Xcode) is available in this environment as of
2026-09-22 — use it for anything WebKit-specific instead of guessing.**
Several real bugs in this app (background repainting during scroll, a
popover-blocking gap local to WebKit's stacking behavior) only reproduced
on real iOS hardware and never in Chrome or its mobile-viewport emulation
— fixes attempted blind against those, without a way to see the actual
failure, shipped broken or made things worse (see `HANDOFF.md`'s fix
history). Two things to know going in, both found the hard way in this
same session: the `attach`/`tap`/`screenshot` control tool's tap
coordinates are in **device points**, not the screenshot's pixel
dimensions — divide screenshot pixel coordinates by the ratio the tool
reports on attach (roughly 2.3x on the device tested here) before
tapping, or every tap lands in the wrong place with no error to tell you
so; and the app's own dev-mode error overlay ("1 error") can appear
transiently on a fresh load tied to the dev server's HMR socket
reconnecting — it's not necessarily a real bug, don't chase it as one
unless it persists across a clean reload with a healthy dev server.
localhost:3000 (or 127.0.0.1:3000) is reachable directly from the
Simulator's Safari, same as from the host Mac.

---

## Automated

### `lib/dedup.test.ts` — cross-source dedup hashing

| Case | Steps | Expected |
|---|---|---|
| Stable hash | Hash the same title/company/location twice | Identical hash both times |
| Case-insensitive | Hash `"Product Manager"` vs `"PRODUCT MANAGER"` (same company/location) | Same hash |
| Trailing whitespace | Hash `"Creative Force"` vs `"Creative Force "` | Same hash (this is a real pair seen in production data — see `HANDOFF.md` §6) |
| Punctuation | Hash `"Product Manager (Remote)"` vs `"Product Manager Remote"` | Same hash |
| Accents | Hash a name with `ą/ę/ł/ó/ć` vs its plain-ASCII equivalent | Same hash |
| Genuinely different listings | Hash the same title/company with two different locations | Different hashes |

### `lib/sources/shared.test.ts` — company-board title filter + HTML cleanup

| Case | Steps | Expected |
|---|---|---|
| PM-shaped titles match | Test `PM_TITLE_MATCH` against "Product Manager", "Product Owner", "Head of Product", "VP Product", etc. | All match |
| Non-PM titles don't match | Test against "Software Engineer", "Sales Manager", "Product Designer", etc. | None match |
| Strip tags | `stripHtml("<p>Hello <b>world</b></p>")` | `"Hello world"` |
| Decode entities | `stripHtml` on a string with `&amp; &#39; &quot;` | Entities decoded to `& ' "` |

### `app/components/statusStyles.test.ts` — status → theme color mapping

| Case | Steps | Expected |
|---|---|---|
| Known statuses | Call `statusColorVar` for each of the 7 known statuses | Each returns its own `var(--status-*)` |
| Unknown status | Call with a made-up status string | Falls back to `var(--status-new)` |

### `lib/demoJobs.test.ts` — demo mode's localStorage persistence

| Case | Steps | Expected |
|---|---|---|
| No prior save | `loadDemoJobs(fallback)` with nothing in storage | Returns the fallback snapshot unchanged |
| Prior save wins | Save a job list, then load with a different fallback | Returns the saved list, not the fallback |
| Corrupt storage | Put invalid JSON in the storage key, then load | Falls back to the snapshot instead of throwing |
| Overwrite, not merge | Save list A, then save list B | Storage holds exactly list B — the whole array is replaced each time |

---

## Manual

### Auth

1. **Sign in with the owner account** — go to `/login`, enter the
   Supabase user's email/password → redirected to `/`, job list loads.
2. **Sign in with wrong password** — enter a bad password → inline error
   ("Incorrect email or password."), stays on `/login`.
3. **Visit a gated page while signed out** — open `/` or `/cv` directly
   with no session → redirected to `/login`.
4. **Sign out** — click "Sign out" in the header → redirected to
   `/login`; revisiting `/` redirects back to `/login`.
5. **`/demo` needs no session** — open `/demo` in a fresh
   incognito/private window → loads immediately, no redirect.

### Demo mode

6. **Sample data loads** — open `/demo` → 33-job frozen snapshot renders,
   "New" filter selected by default.
7. **Status change persists locally** — change a job's status on
   `/demo`, reload the page → the change is still there (localStorage,
   not the backend).
8. **Analyze/Check controls are inert** — on `/demo`, hover or tap
   "Analyze fit" / "Check location" on a job with no result yet → shows a
   "sign in to run real analysis" tooltip, no request fires (check the
   Network tab: zero calls to `/api/jobs/*`).
9. **Returning visitor keeps their edits** — change a status, close the
   tab, reopen `/demo` → the earlier change is still applied.

### Job list — filtering & status

10. **Status filter** — click each status pill ("New", "Interested",
    etc.) → list shows only jobs with that status; count updates.
11. **Source filter** — with 2+ sources present, click a source pill →
    list narrows to that source only; "All sources" resets it.
12. **Empty filter state** — pick a status/source combination with no
    matches → empty-state illustration + "No jobs match this filter".
13. **Status change (real app only)** — change a job's status via the
    dropdown → `PATCH /api/jobs/status` fires (check Network tab),
    succeeds, and the change survives a reload.

### AI analysis (real app only — needs `ANTHROPIC_API_KEY` + a CV on file)

14. **Analyze fit** — click "Analyze fit" on an unscored job → button
    shows "Analyzing…", then a score badge with overview + category
    breakdown appears on hover/tap.
15. **Re-analyze** — click "↻ Re-analyze" inside an existing popover →
    score updates in place.
16. **Check location** — click "Check location" → badge shows
    Fit/No fit/Unclear with an explanation on hover/tap.
17. **Analysis failure is recoverable** — simulate a failure (e.g. bad
    `ANTHROPIC_API_KEY`) → inline error text under the button, button
    stays usable to retry.

### CV upload (real app only)

18. **Upload a PDF** — go to `/cv`, upload a real PDF CV → "Uploading…"
    then the page reloads showing filename, character count, and
    AI-extracted facts (summary, seniority, skills, roles).
19. **Re-upload** — upload a second CV → becomes the "current" one; the
    previous upload appears under "Previous uploads", not deleted.
20. **Non-PDF rejected** — try uploading a non-PDF file → the file input
    itself restricts to `application/pdf`; if bypassed, the API should
    reject it with an error shown inline.

### Theming

21. **Switch themes** — toggle Linear Dark ↔ Editorial Mono anywhere in
    the app → every themed element (header, filters, job cards, badges,
    popovers) re-skins immediately, no partial/unstyled flash.
22. **Theme persists across reload** — pick a theme, reload the page →
    same theme loads with no flash of the other theme's active pill
    (this was a real bug, fixed 2026-09-20 — see `CHANGELOG.md`).
    A different failure of this case (reload reverting to Linear Dark
    with neither switcher pill active, on real iPhone 15 Pro/Chrome
    against the deployed URL) took two fix attempts — reordering
    `ThemeScript` didn't help, but `useTheme` self-healing `data-theme`
    on mount if it's missing/invalid (added 2026-09-22) **did** —
    confirmed fixed by the reporter. Neither attempt was ever
    reproducible in local/Chrome testing, only on the real device; keep
    that in mind for any future report that looks similar.
23. **Theme is independent per browser** — the login page always renders
    its own neutral palette regardless of the last picked theme.

### Responsive layout — check at all three on every visual change

Use the browser's device toolbar (or resize the window) at roughly:
**mobile** (375px and 320px), **tablet** (768px), **desktop** (1280px+).

24. **Job row at mobile width** — open `/demo` at 375px → each job's
    title/company/meta is fully visible (not collapsed to zero width),
    and the status/score/location controls wrap onto their own row,
    right-aligned, below the title. No horizontal scrollbar on the page.
25. **Job row at 320px** (smallest common phone width) — same as above,
    still no horizontal overflow, still readable.
26. **Header at mobile width** — brand and nav controls never wrap
    mid-word; below ~520px the nav cluster drops to its own full-width
    line with the theme switcher and sign-in/out button at opposite
    ends.
27. **AI popover on a touch device** — tap a score or location badge on
    a touch-emulated viewport → popover opens and stays within the
    viewport (no horizontal overflow); tapping anywhere outside it
    closes it. (Popovers used to be hover-only and were unreachable on
    touch — fixed 2026-09-21, see `CHANGELOG.md`.) Note: this app's
    browser tool simulates real mouse events even under mobile-viewport
    emulation, which fires hover before click and can make a popover
    that just opened immediately close again — that's an artifact of
    the tool, not a bug. To test the tap-only path faithfully, dispatch
    a bare `click` event with no preceding `pointerover`/`mouseenter`.
28. **Job row at tablet width (768px)** — title truncates with an
    ellipsis rather than disappearing; controls stay on one line, right
    aligned.
29. **Editorial Mono index numbers** — in Editorial Mono, the "01", "02…"
    index prefix shows at desktop/tablet widths and is hidden once the
    row stacks on mobile (nothing renders orphaned above the card).
30. **Desktop, wide window (1280px+)** — full one-line job rows, no
    wrapping, matches the original design exactly (this is the
    regression baseline — nothing above should change how this looks).
31. **Popover doesn't overflow when the trigger isn't near the row's
    right edge** — at a viewport width where the status select + score
    + location badges all fit on one line together (~380-400px is a
    reliable repro, especially in Editorial Mono — its tighter row
    padding makes this the common case, not the exception), open the
    *score* badge's popover (it's the middle control, not the last) →
    it stays fully within the viewport, not just the location badge's
    (which is usually last and flush against the row's right edge
    anyway, so it's a weaker test of this).
32. **Tap a popover's own trigger again to close it** — open a
    popover, then click/tap the same score or location badge again →
    it closes (same effect as tapping outside).
33. **Popover blocks interaction with the rest of the page while open.**
    Two things to check, both confirmed on a real iOS Simulator
    (iPhone 17 Pro, WebKit) as of 2026-09-22 — see `HANDOFF.md` for the
    fix history and why Simulator testing (not just Chrome) is what
    finally nailed this one down:
    - **Cross-row**: open a popover, tap a *different* row's job link
      or another row's badge → blocked, the tap just closes the
      popover (`.popover-scrim`, a full-viewport element catching the
      tap via z-index — `document.elementFromPoint(x, y)` at the
      target's coordinates should return the scrim, not the target).
      This part always worked, even before the fix below.
    - **Same-row**: open a popover, tap *that row's own* status select
      or its other badge → also blocked now (previously the real bug:
      the scrim's z-index approach doesn't cover a row's own siblings
      on WebKit specifically, a stacking quirk that never reproduced in
      Chrome). Fixed via `pointer-events: none` applied to just that
      row's `.job-actions` (a `PopoverLock` context scoped **per row**,
      not to the whole list — check `getComputedStyle(el).pointerEvents`
      is `"none"` on the row's select while open, `"auto"` again once
      closed). A first attempt scoped this lock to the *entire list*
      instead of one row — that closed the gap in every test here too,
      but froze the real app on sign-in/sign-out against actual
      Supabase data (almost certainly the re-render cost of one shared
      lock touched by every badge across every row, all re-rendering on
      every open/close) and was reverted. The per-row version has the
      same UI effect with a tiny, bounded blast radius — 3 components
      per toggle, however many jobs are in the list — so that failure
      mode shouldn't recur, but this hasn't been tested against a real
      large dataset or the authenticated app, only `/demo`'s 33 jobs.
    - Switching between a row's two badges (tapping the *other* AI
      badge while one is open, rather than the select) is intentionally
      not blocked — treated as a valid "switch" action, not something
      to prevent.
34. **[Linear theme] Background stays visually consistent while
    scrolling** — on Linear Dark (the only theme with a background
    gradient), scroll a long job list (the "All" filter, 33 jobs) up
    and down → the gradient doesn't visibly shift, jump, or repaint
    inconsistently. This is about iOS Safari/Chrome's handling of fixed
    backgrounds during scroll (`background-attachment: fixed` is
    unreliable there); a desktop browser or its mobile-viewport
    emulation can't reproduce the underlying bug. Checked on an iOS
    Simulator (iPhone 17 Pro) 2026-09-22 — before/after screenshots
    across a full scroll cycle showed no visible shift — but a
    mid-scroll repaint glitch is inherently a live, transient artifact;
    static screenshots can miss one even where it exists. Watch for a
    live repro (not just screenshots) if this regresses.
35. **[iOS only] Signing in doesn't leave the page zoomed in** — on a
    real iPhone (or the Simulator, now that it's set up — this is
    specifically about iOS's auto-zoom-on-input-focus behavior), sign
    in from `/login` → after landing on `/`, the page is at normal
    scale, not zoomed in on the login form's former position. Not
    checked on the Simulator yet — needs a real Supabase session, which
    this environment doesn't have credentials for; the fix (16px login
    inputs, avoiding iOS's sub-16px auto-zoom trigger) is a standard,
    well-known one, but this exact flow is still unverified end-to-end.
