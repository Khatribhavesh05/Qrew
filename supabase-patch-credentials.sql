-- ============================================================
-- Qrew — Credentials Patch
-- Run in Supabase SQL Editor to enable Supabase OAuth integration
-- ============================================================

-- 1. Add OAuth + GitHub columns to profiles (safe to re-run)
alter table profiles add column if not exists supabase_oauth_token text;
alter table profiles add column if not exists github_access_token  text;
alter table profiles add column if not exists github_username      text;

-- 2. startup_credentials — stores per-startup API keys fetched via OAuth
create table if not exists startup_credentials (
  id                       uuid primary key default gen_random_uuid(),
  startup_id               uuid references startups on delete cascade unique,
  supabase_project_url     text,
  supabase_anon_key        text,
  supabase_service_role_key text,
  stripe_publishable_key   text,
  stripe_secret_key        text,
  created_at               timestamptz default now(),
  updated_at               timestamptz default now()
);

alter table startup_credentials enable row level security;

create policy "Users can manage own credentials" on startup_credentials
  using  (startup_id in (select id from startups where user_id = auth.uid()))
  with check (startup_id in (select id from startups where user_id = auth.uid()));
