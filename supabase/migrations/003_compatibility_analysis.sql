-- Run this once in Supabase's SQL editor.

create table compatibility_analysis (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null unique references job(id) on delete cascade,
  overall_score integer not null check (overall_score >= 0 and overall_score <= 100),
  category_scores jsonb not null,
  strong_matches jsonb not null,
  missing_requirements jsonb not null,
  concerns jsonb not null,
  reasoning text not null,
  created_at timestamptz not null default now()
);
