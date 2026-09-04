-- Run this once in Supabase's SQL editor.
-- Restructures compatibility_analysis for a more condensed AI output
-- (a short overview + a few highlight bullets, instead of three separate
-- lists). Existing analyses will need to be re-run via "Re-analyze" —
-- acceptable since this is a personal tool still being iterated on.

alter table compatibility_analysis
  drop column strong_matches,
  drop column missing_requirements,
  drop column concerns;

alter table compatibility_analysis
  add column highlights jsonb not null default '[]'::jsonb,
  add column overview text not null default '';

alter table compatibility_analysis
  alter column highlights drop default,
  alter column overview drop default;
