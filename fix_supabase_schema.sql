-- SQL to fix the missing column error
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/lwrkfhoxsbxtpkrgiula/sql

-- 1. Add the missing recurrence columns if they don't exist
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_id TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_frequency TEXT DEFAULT 'none';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_end_date DATE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reminder_advance_value INTEGER;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reminder_advance_unit TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reminder_message TEXT;

-- 2. Refresh the schema cache (Supabase does this automatically, but sometimes it needs a nudge)
-- You can also go to Settings -> API -> PostgREST and click "Reload PostgREST" if the error persists.
