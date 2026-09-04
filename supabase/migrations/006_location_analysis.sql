-- Run this once in Supabase's SQL editor.

create table location_analysis (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null unique references job(id) on delete cascade,
  verdict text not null check (verdict in ('fit', 'no_fit', 'unknown')),
  explanation text not null,
  highlights jsonb not null,
  created_at timestamptz not null default now()
);
