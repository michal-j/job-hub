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
