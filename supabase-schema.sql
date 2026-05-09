-- ============================================================
-- Qrew — Full Database Schema
-- Run this in Supabase SQL Editor (Project → SQL Editor → New query)
-- ============================================================

-- ── profiles (extends auth.users) ───────────────────────────────────────────
create table if not exists profiles (
  id                uuid references auth.users on delete cascade primary key,
  email             text,
  token_balance     integer not null default 100000,
  free_build_used   boolean not null default false,
  created_at        timestamptz not null default now()
);

alter table profiles enable row level security;
create policy "Users can read own profile"   on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── startups ────────────────────────────────────────────────────────────────
create table if not exists startups (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users on delete cascade not null,
  name            text,
  idea            text not null,
  industry        text,
  audience        text,
  customer_type   text,
  revenue_model   text,
  brand_vibe      text,
  status          text not null default 'processing',
  build_type      text,
  tokens_spent    integer not null default 0,
  report_data     jsonb,
  github_url      text,
  live_url        text,
  created_at      timestamptz not null default now()
);

alter table startups enable row level security;
create policy "Users can manage own startups" on startups
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── company_brain ────────────────────────────────────────────────────────────
create table if not exists company_brain (
  startup_id          uuid references startups on delete cascade primary key,
  startup_name        text,
  idea                text,
  audience            text,
  customer_type       text,
  revenue_model       text,
  brand_vibe          text,
  positioning         text,
  colors              text[] default '{}',
  fonts               text,
  flux_bg_url         text,
  flux_texture_url    text,
  video_frames_url    text,
  tech_stack          text,
  live_url            text,
  github_url          text,
  key_decisions       jsonb not null default '[]',
  history             jsonb not null default '[]',
  updated_at          timestamptz not null default now()
);

alter table company_brain enable row level security;
create policy "Users can manage own company_brain" on company_brain
  using (
    exists (select 1 from startups s where s.id = startup_id and s.user_id = auth.uid())
  )
  with check (
    exists (select 1 from startups s where s.id = startup_id and s.user_id = auth.uid())
  );

-- ── agent_messages ───────────────────────────────────────────────────────────
create table if not exists agent_messages (
  id           uuid primary key default gen_random_uuid(),
  startup_id   uuid references startups on delete cascade not null,
  agent_name   text not null,
  role         text not null,
  content      text,
  tokens_used  integer not null default 0,
  created_at   timestamptz not null default now()
);

alter table agent_messages enable row level security;
create policy "Users can manage own agent_messages" on agent_messages
  using (
    exists (select 1 from startups s where s.id = startup_id and s.user_id = auth.uid())
  )
  with check (
    exists (select 1 from startups s where s.id = startup_id and s.user_id = auth.uid())
  );

-- ── agent_summaries ──────────────────────────────────────────────────────────
create table if not exists agent_summaries (
  startup_id     uuid references startups on delete cascade,
  agent_name     text,
  summary        text,
  message_count  integer not null default 0,
  updated_at     timestamptz not null default now(),
  primary key (startup_id, agent_name)
);

alter table agent_summaries enable row level security;
create policy "Users can manage own agent_summaries" on agent_summaries
  using (
    exists (select 1 from startups s where s.id = startup_id and s.user_id = auth.uid())
  )
  with check (
    exists (select 1 from startups s where s.id = startup_id and s.user_id = auth.uid())
  );

-- ── code_maps ────────────────────────────────────────────────────────────────
create table if not exists code_maps (
  startup_id    uuid references startups on delete cascade primary key,
  file_map      jsonb,
  architecture  text,
  patterns      text,
  updated_at    timestamptz not null default now()
);

alter table code_maps enable row level security;
create policy "Users can manage own code_maps" on code_maps
  using (
    exists (select 1 from startups s where s.id = startup_id and s.user_id = auth.uid())
  )
  with check (
    exists (select 1 from startups s where s.id = startup_id and s.user_id = auth.uid())
  );

-- ── token_transactions ───────────────────────────────────────────────────────
create table if not exists token_transactions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users on delete cascade not null,
  startup_id       uuid references startups on delete set null,
  action           text,
  tokens_consumed  integer not null default 0,
  credits_used     numeric(10,4) not null default 0,
  created_at       timestamptz not null default now()
);

alter table token_transactions enable row level security;
create policy "Users can read own token_transactions" on token_transactions
  for select using (auth.uid() = user_id);

-- ── builds ───────────────────────────────────────────────────────────────────
create table if not exists builds (
  id            uuid primary key default gen_random_uuid(),
  startup_id    uuid references startups on delete cascade not null,
  status        text not null default 'pending',
  build_type    text,
  current_step  text,
  error_log     text,
  started_at    timestamptz,
  completed_at  timestamptz
);

alter table builds enable row level security;
create policy "Users can manage own builds" on builds
  using (
    exists (select 1 from startups s where s.id = startup_id and s.user_id = auth.uid())
  )
  with check (
    exists (select 1 from startups s where s.id = startup_id and s.user_id = auth.uid())
  );
