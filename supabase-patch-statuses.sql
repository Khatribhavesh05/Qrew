-- ============================================================
-- Qrew — Status Migration
-- Run this in Supabase SQL Editor
-- Safe to run multiple times (idempotent updates)
-- ============================================================

-- 1. Migrate old status values to new ones in existing rows
UPDATE startups SET status = 'draft'     WHERE status IN ('processing', 'naming', 'team_assembly');
UPDATE startups SET status = 'ready'     WHERE status = 'report_ready';
UPDATE startups SET status = 'deployed'  WHERE status = 'live';

-- 2. Any startup stuck in 'building' with a completed build → move to 'built'
UPDATE startups s
SET status = 'built'
WHERE s.status = 'building'
  AND EXISTS (
    SELECT 1 FROM builds b
    WHERE b.startup_id = s.id
      AND b.status = 'done'
      AND b.current_step = 'code_ready'
  );

-- 3. Verify current distribution
SELECT status, COUNT(*) as count
FROM startups
GROUP BY status
ORDER BY count DESC;
