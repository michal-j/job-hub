-- Job Hub schema (V1 — no CV/AI tables yet, those come later)
create extension if not exists "pgcrypto";

create table job_source (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  enabled boolean not null default true
);

create table company (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  industry text
);

create table job (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references company(id),
  title text not null,
  location_raw text,
  remote_flag_raw text,
  description text,
  original_posted_at timestamptz,
  discovered_at timestamptz not null default now(),
  dedup_hash text not null unique
);

create table job_listing (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references job(id) on delete cascade,
  source_id uuid not null references job_source(id),
  source_url text not null,
  source_job_id text,
  raw_payload jsonb
);

create table job_status (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null unique references job(id) on delete cascade,
  status text not null default 'new'
    check (status in ('new','interested','applied','interviewing','rejected','offer','not_interested')),
  updated_at timestamptz not null default now()
);

create table update_run (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  source_id uuid references job_source(id),
  jobs_found integer default 0,
  jobs_new integer default 0,
  status text check (status in ('success','error')),
  error_message text
);

insert into job_source (name) values ('adzuna'), ('arbeitnow'), ('remotive');
