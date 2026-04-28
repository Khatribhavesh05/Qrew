-- ============================================================
-- 001_initial_schema.sql
-- ============================================================

-- ── Profiles ────────────────────────────────────────────────
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  created_at timestamptz not null default now()
);

-- ── Companies ───────────────────────────────────────────────
create table public.companies (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  name        text not null,
  description text not null default '',
  created_at  timestamptz not null default now()
);

-- ── Employees ───────────────────────────────────────────────
create table public.employees (
  id         uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  name       text not null,
  role       text not null check (role in ('research', 'strategy', 'launch')),
  status     text not null default 'idle' check (status in ('idle', 'thinking', 'done')),
  created_at timestamptz not null default now()
);

-- ── Messages ────────────────────────────────────────────────
create table public.messages (
  id          uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  company_id  uuid not null references public.companies (id) on delete cascade,
  role        text not null check (role in ('user', 'assistant')),
  content     text not null,
  created_at  timestamptz not null default now()
);

-- ── Indexes ─────────────────────────────────────────────────
create index on public.companies  (user_id);
create index on public.employees  (company_id);
create index on public.messages   (company_id);
create index on public.messages   (employee_id);

-- ── Row Level Security ──────────────────────────────────────
alter table public.profiles  enable row level security;
alter table public.companies enable row level security;
alter table public.employees enable row level security;
alter table public.messages  enable row level security;

-- profiles: users access only their own row
create policy "profiles: own row"
  on public.profiles
  for all
  using (id = auth.uid());

-- companies: users access only companies they own
create policy "companies: owner only"
  on public.companies
  for all
  using (user_id = auth.uid());

-- employees: users access employees that belong to their companies
create policy "employees: owner only"
  on public.employees
  for all
  using (
    company_id in (
      select id from public.companies where user_id = auth.uid()
    )
  );

-- messages: users access messages that belong to their companies
create policy "messages: owner only"
  on public.messages
  for all
  using (
    company_id in (
      select id from public.companies where user_id = auth.uid()
    )
  );

-- ── Auto-create profile on sign-up ──────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
