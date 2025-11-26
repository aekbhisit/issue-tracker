-- Script to add element_selector column to issue_screenshots table
-- Run this directly against your database if the column doesn't exist

-- Add element_selector column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'issue_screenshots' 
        AND column_name = 'element_selector'
    ) THEN
        ALTER TABLE "issue_screenshots" ADD COLUMN "element_selector" JSONB;
        COMMENT ON COLUMN "issue_screenshots"."element_selector" IS 'JSON object with cssSelector, xpath, boundingBox, outerHTML from element inspect';
        RAISE NOTICE 'Column element_selector added to issue_screenshots table';
    ELSE
        RAISE NOTICE 'Column element_selector already exists in issue_screenshots table';
    END IF;
END $$;

-- Verify the column was added
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'issue_screenshots'
AND column_name = 'element_selector';


