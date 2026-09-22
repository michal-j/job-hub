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
- While a popover is open, job links underneath it are no longer
  reachable — a transparent scrim now catches those taps and closes the
  popover instead of letting them navigate. **Confirmed partial on real
  iPhone 15 Pro testing: this blocks job links but not status dropdowns
  or filter pills** — a follow-up attempt to close that gap (a shared
  `pointer-events: none` lock on the whole list, independent of the
  scrim's z-index) froze the real app on sign-in/sign-out against actual
  Supabase data and, per the same report, stopped blocking anything at
  all — reverted (see the "Unreleased" note below and `TEST_CASES.md`
  case 33). Left as scrim-only for now, matching what was explicitly
  OK'd rather than risk another regression against data this can't be
  tested against locally.
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

### Changed

- `ThemeScript` now runs before the Google Fonts stylesheet link in
  `<head>` instead of after — a classic `<script>` following a pending
  `<link rel="stylesheet">` has its execution deferred until that
  stylesheet loads, which could delay setting `data-theme` on a slow
  connection. **Confirmed on real-device retest that this did NOT fix**
  the demo-mode theme-persistence report (see next entry for the
  follow-up attempt). Stays as a legitimate hardening fix on its own
  merits regardless.

### Fixed (attempt 2)

- `useTheme` now self-heals if `data-theme` is ever missing or invalid
  when it mounts, instead of only reading it — re-applying the saved
  `localStorage` preference (or the default) to the DOM attribute
  itself, not just to React state. `ThemeScript` should always set a
  valid value before this ever runs, so landing in this branch means
  something upstream of it failed; this targets the *symptom* (neither
  theme actually applied, neither switcher pill lit up — the two report
  independently, and both are explained by the attribute being absent
  entirely, since the base tokens are declared on `:root` unconditionally
  too) rather than a specific unconfirmed cause. **Not yet confirmed
  fixed** — still unreproduced locally after two attempts; see
  `TEST_CASES.md` case 22 for what's been ruled out.

### Added

- Vitest unit-test suite (`npm test`) covering dedup hashing, the
  company-board title filter, status→theme color mapping, and demo-mode
  localStorage persistence.
- `TEST_CASES.md` — human-readable test cases for both the automated
  suite and the flows that need a live session/browser to exercise.
- This changelog.

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
