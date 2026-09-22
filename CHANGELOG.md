# Changelog

All notable changes to this project are documented here, in the
[Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format. This
project deploys straight from `main` with no version numbers, so
"Unreleased" means "merged locally but not yet pushed to `main`," not
"not yet a numbered release."

## Unreleased

### Fixed

- Job list rows no longer collapse the title/company down to zero width
  on phones — the status/score/location controls (each with a fixed
  minimum width) used to leave no room at all for the title below
  ~620px, silently hiding it. The row now wraps into a stacked card
  layout on narrow screens instead.
- Header no longer wraps "Job Hub" / "Sign in" text mid-word on narrow
  phones; the nav cluster now drops to its own line instead.
- Compatibility and location AI popovers now open on tap as well as
  hover — previously they were hover-only and unreachable on touch
  devices (tablet/mobile).
- Popover width is now capped relative to the viewport, so it can no
  longer be wider than the screen on a small phone.
- `lib/dedup.ts`'s accent-stripping didn't actually normalize `ł`
  (Polish L-with-stroke has no Unicode decomposition), so two listings
  for the same company/title differing only by `ł` vs `l` would hash to
  different values and fail to dedupe. Now handled with an explicit
  substitution before normalization.
- Popovers could open partly off the left edge of the screen — anchoring
  flush with the trigger's right edge overflows whenever the trigger
  isn't near the row's own right edge, which happens whenever the
  status select + score + location badges all fit on one line together
  (common in Editorial Mono specifically, since its much tighter row
  padding lets that happen at viewport widths where Linear Dark still
  wraps to two lines). Position is now clamped into the viewport instead
  of blindly trusting that anchor.
- Tapping an open popover's own trigger again now closes it, the same
  as tapping anywhere else outside it — previously tapping it again just
  re-opened it with no way to dismiss without tapping elsewhere first.
- While a popover is open, the rest of the page is no longer reachable
  underneath it — confirmed fixed 2026-09-22, on an iOS Simulator this
  time, not just Chrome. This took three attempts to get right:
  1. A transparent scrim (blocks via z-index) — shipped first, and
     testing showed it blocked job links on other rows but not a row's
     own status select or its other badge.
  2. A `pointer-events: none` lock shared across the *entire* job list —
     closed that gap in every test here, but froze the real app on
     sign-in/sign-out against actual Supabase data (almost certainly
     the re-render cost of one shared lock touched by every badge
     across every row, all re-rendering on every open/close) and, per
     the same report, regressed even the scrim's own link-blocking.
     Reverted.
  3. The same `pointer-events: none` idea, but scoped to **one row's**
     own `PopoverLockProvider` instead of the whole list — same fix,
     bounded blast radius (3 components per toggle,
     regardless of how many jobs are in the list). Verified this time
     on a real iOS Simulator (not just reasoned about): a row's own
     status select and its other badge are genuinely unreachable
     (checked via `elementFromPoint` and `getComputedStyle`, not just a
     visual check) while a popover in that row is open, cross-row
     blocking (attempt 1's win) still holds, and 20+ rapid open/close
     cycles produced no freeze. See `TEST_CASES.md` case 33 for the
     full detail and what's still not covered (switching between a
     row's two badges is deliberately allowed, not blocked).
- [Linear theme] The page background could shift or repaint
  inconsistently while scrolling on iOS Safari/Chrome —
  `background-attachment: fixed` (used to keep the gradient consistent
  across list lengths, see the "Added" 2026-09-18 entry) is unreliable
  there. Replaced with a `position: fixed` pseudo-element, which iOS
  handles correctly, without losing the original fix.
- Login email/password inputs are now 16px (from 14px) — below that,
  iOS auto-zooms the page on focus, and because signing in navigates
  away without a full page reload, the zoomed-in scale was never being
  reset afterwards, leaving the whole app zoomed in on first load.
- Demo-mode reload reverting to Linear Dark with neither switcher pill
  active (a different bug from the one fixed 2026-09-20 above) —
  **confirmed fixed 2026-09-22** by the reporter, on the second attempt:
  `useTheme` now self-heals if `data-theme` is ever missing or invalid
  when it mounts, instead of only reading it — re-applying the saved
  `localStorage` preference (or the default) to the DOM attribute
  itself, not just to React state. (The first attempt, reordering
  `ThemeScript` before the font stylesheet link in case a slow font
  fetch was delaying its execution, didn't fix it, but stays in as a
  legitimate hardening change on its own merits.) Neither attempt was
  ever reproducible locally, only on the reporter's real device — see
  `TEST_CASES.md` case 22.

### Added

- Vitest unit-test suite (`npm test`) covering dedup hashing, the
  company-board title filter, status→theme color mapping, and demo-mode
  localStorage persistence.
- `TEST_CASES.md` — human-readable test cases for both the automated
  suite and the flows that need a live session/browser to exercise.
- This changelog.
- `app/components/PopoverLock.tsx` — a small context, instantiated once
  per job row, giving that row's `CompatibilityBadge`/`LocationBadge`/
  `StatusSelect` a shared "is either badge in this row open" flag to
  drive the `pointer-events: none` lock described above.

## 2026-09-20

### Fixed

- Theme switcher no longer flashes the wrong active pill on reload —
  the highlighted pill is now driven from the `data-theme` attribute
  (already correct pre-hydration) instead of React state.
- Theme now persists correctly across reloads; a hydration mismatch in
  date formatting (server renders in UTC, client in local time) was
  wiping the pre-hydration `data-theme` attribute — dates are now
  pinned to UTC.

## 2026-09-19

### Changed

- Untracked `.DS_Store` and `tsconfig.tsbuildinfo` from git.

## 2026-09-18

### Added

- Real Supabase email/password auth, replacing the single shared Basic
  Auth password.
- Public `/demo` route — a frozen sample dataset with edits kept in
  `localStorage` only, no login required.
- Linear Dark / Editorial Mono theme system with a switcher; redesigned
  login page.
- `HANDOFF.md` project doc; `README.md` rewritten for the app's current
  state.
- Favicon (briefcase icon).

### Fixed

- Sessions for anyone but the configured `OWNER_EMAIL` are rejected,
  even if Supabase's "allow signups" setting is ever left on by
  mistake.

### Changed

- Widened the PM job-title match regex used to filter company-board
  listings.

## 2026-09-12

### Added

- Personio as an ingestion source.
- Remote.com / SmartRecruiters (+ Ashby / Lever) as ingestion sources.

## 2026-09-09

### Added

- Jooble as an ingestion source.

## 2026-09-07

### Changed

- Improved AI compatibility analysis (hybrid roles, language handling)
  and popup positioning.

## 2026-09-04

### Added

- CV upload and location-fit scoring.

### Fixed

- `pdf-parse` type error.

### Changed

- Various UX/UI improvements.

## 2026-09-03

### Added

- Initial version: Arbeitnow and Remotive job sources.
