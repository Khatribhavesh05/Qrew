-- ============================================================
-- Qrew — Profiles Patch
-- Run this in Supabase SQL Editor if buttons are stuck loading
-- ============================================================

-- 1. Add columns if missing (safe to run multiple times)
alter table profiles add column if not exists token_balance integer not null default 100000;
alter table profiles add column if not exists free_build_used boolean not null default false;

-- 2. Fix the trigger to explicitly set token_balance = 100000 on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, token_balance, free_build_used)
  values (new.id, new.email, 100000, false)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Backfill: create profile rows for any existing users who don't have one
insert into public.profiles (id, email, token_balance, free_build_used)
select
  au.id,
  au.email,
  100000,
  false
from auth.users au
left join public.profiles p on p.id = au.id
where p.id is null;

-- 4. Verify — should show your profile row with token_balance = 100000
select id, email, token_balance, free_build_used from profiles;
