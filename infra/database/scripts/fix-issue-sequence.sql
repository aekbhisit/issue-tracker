-- Fix Issue ID Sequence Sync Issue
-- This script resets the auto-increment sequence for the issues table
-- Run this if you encounter P2002 unique constraint violations on the 'id' field
--
-- Usage:
--   psql -U <username> -d <database> -f fix-issue-sequence.sql
--   Or connect to database and run: \i fix-issue-sequence.sql

-- Check current sequence value
SELECT 
    'Current sequence value' as info,
    currval('issues_id_seq') as current_value,
    (SELECT MAX(id) FROM issues) as max_id_in_table;

-- Reset sequence to match the maximum ID in the table
-- This ensures the next auto-generated ID will be higher than any existing ID
SELECT setval(
    'issues_id_seq', 
    COALESCE((SELECT MAX(id) FROM issues), 0) + 1,
    false  -- Don't use the value immediately (nextval will increment)
);

-- Verify the fix
SELECT 
    'After fix' as info,
    currval('issues_id_seq') as current_value,
    (SELECT MAX(id) FROM issues) as max_id_in_table,
    CASE 
        WHEN currval('issues_id_seq') > (SELECT MAX(id) FROM issues) THEN '✅ Sequence is correct'
        ELSE '⚠️ Sequence may still be out of sync'
    END as status;

