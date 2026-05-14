-- ── Dodo Payments migration ──────────────────────────────────────────────────
-- Run this in Supabase SQL Editor after supabase-schema.sql

-- Add credits balance to profiles
alter table profiles add column if not exists credits_balance numeric(10,2) not null default 0;

-- Add Dodo payment tracking columns to token_transactions
alter table token_transactions add column if not exists type text;
alter table token_transactions add column if not exists credits numeric(10,2);
alter table token_transactions add column if not exists amount_paid integer;
alter table token_transactions add column if not exists payment_id text;
alter table token_transactions add column if not exists description text;

-- Allow users to insert their own transaction records (for build deductions)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'token_transactions'
    and policyname = 'Users can insert own token_transactions'
  ) then
    execute $policy$
      create policy "Users can insert own token_transactions"
        on token_transactions for insert
        with check (auth.uid() = user_id)
    $policy$;
  end if;
end
$$;
