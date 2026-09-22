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
    **A DIFFERENT failure of this case is open as of 2026-09-22, two fix
    attempts in, neither confirmed** — reported on `/demo`, real
    iPhone 15 Pro, Chrome, the deployed URL typed in directly (not an
    in-app browser, not localhost — confirmed by the reporter, so both
    of those are ruled out as factors): reload reverts to Linear Dark
    AND neither switcher pill shows as active. That combination points
    to `data-theme` ending up absent entirely rather than just wrong —
    `:root`'s tokens apply unconditionally (looks like Linear Dark with
    no attribute at all), and neither pill's exact-match selector fires
    without a valid value either. Tried:
    - Reordering `ThemeScript` before the font stylesheet link (in case
      a slow font fetch delayed its execution) — retested on device,
      did not fix it.
    - A blocking CSP was the next suspect (would produce exactly this
      symptom, and wouldn't show up locally if only added for
      production) — ruled out, there's no CSP anywhere in this codebase.
    - `useTheme` now self-heals on mount if `data-theme` is missing or
      invalid, re-applying the saved preference to the DOM attribute
      itself rather than only reading it into React state — added
      2026-09-22, **not yet confirmed** (still never reproduced locally
      to test against, even after two attempts).

    Local testing (Chrome desktop + mobile-viewport emulation, real
    `window.location.reload()`, checking `data-theme` and
    `localStorage.getItem('jobHub.theme')` directly) has never once
    reproduced a failure here, in any of these attempts. If you're
    picking this up: the reporter has said plainly they don't want to
    do more diagnostic legwork for this (no remote inspector, no
    testing other browsers/devices — it just needs to work on their
    one real setup), so don't ask for more of that. The self-heal fix
    is the best remaining move without new information; if it doesn't
    hold, the next thing worth trying is probably a visible on-page
    readout of `data-theme`/`localStorage` state (so the fact of it
    happening is self-reporting, nothing to go dig for) rather than
    another blind guess at the mechanism.
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
33. **Popover blocks interaction with the rest of the page while open —
    partially, by design for now.** Open a popover, then click/tap a
    job link underneath it → blocked, the popover just closes
    (`.popover-scrim`, a full-viewport element that catches the tap via
    z-index — check `document.elementFromPoint(x, y)` at the link's
    coordinates returns the scrim, not the link). **Status dropdowns
    and filter pills are NOT blocked** — confirmed on real iPhone 15
    Pro testing 2026-09-22, and left that way deliberately: a follow-up
    fix (`pointer-events: none` on the whole list via a shared
    `PopoverLock` context, independent of the scrim's z-index) closed
    that gap in every test run here, but froze the real app on
    sign-in/sign-out against actual Supabase data and, per the same
    report, regressed even the scrim's own link-blocking — reverted
    2026-09-22 rather than debug blind against data this can't be
    tested against locally (see `HANDOFF.md` and `CHANGELOG.md`). If
    you revisit this: reproduce it against the *real* authenticated
    app first (not `/demo`) before trusting any fix, since that's
    exactly what this gap needs and what wasn't available last time.
34. **[Linear theme] Background stays visually consistent while
    scrolling** — on Linear Dark (the only theme with a background
    gradient), scroll a long job list up and down → the gradient
    doesn't visibly shift, jump, or repaint inconsistently. This one is
    specifically about iOS Safari/Chrome's handling of fixed
    backgrounds during scroll (`background-attachment: fixed` is
    unreliable there); it cannot be verified in a desktop browser or
    its mobile-viewport emulation — it needs an actual iOS device or
    simulator.
35. **[iOS only] Signing in doesn't leave the page zoomed in** — on a
    real iPhone (not emulation — this is specifically about iOS's
    auto-zoom-on-input-focus behavior), sign in from `/login` → after
    landing on `/`, the page is at normal scale, not zoomed in on the
    login form's former position. Also cannot be verified without real
    iOS hardware.
