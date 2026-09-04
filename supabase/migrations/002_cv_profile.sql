-- Run this once in Supabase's SQL editor to add CV storage.
-- Single-user app: this table only ever holds one row, replaced on
-- each new upload (see the upload route for the replace logic).

create table cv_profile (
  id uuid primary key default gen_random_uuid(),
  raw_text text not null,
  structured_facts jsonb,
  uploaded_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
