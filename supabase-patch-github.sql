-- ============================================================
-- Qrew — GitHub OAuth Patch
-- Run this in Supabase SQL Editor before using the build pipeline
-- ============================================================

-- Add GitHub OAuth columns to profiles
alter table profiles add column if not exists github_access_token text;
alter table profiles add column if not exists github_username text;

-- Verify
select id, email, github_username,
       case when github_access_token is not null then 'connected' else 'not connected' end as github_status
from profiles;
