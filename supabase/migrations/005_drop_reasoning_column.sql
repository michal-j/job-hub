-- Run this once in Supabase's SQL editor.
-- Fixes an oversight in migration 004: the old "reasoning" column was
-- never dropped, and its NOT NULL constraint was blocking every insert
-- since nothing writes to it anymore (replaced by "overview").

alter table compatibility_analysis
  drop column reasoning;
