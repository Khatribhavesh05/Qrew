-- ============================================================
-- Qrew — Razorpay Credentials Patch
-- Run in Supabase SQL Editor to add Razorpay support
-- ============================================================

ALTER TABLE startup_credentials
ADD COLUMN IF NOT EXISTS razorpay_key_id     text,
ADD COLUMN IF NOT EXISTS razorpay_key_secret text;
