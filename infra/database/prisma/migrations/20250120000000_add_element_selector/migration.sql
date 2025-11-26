-- AlterTable: Add element_selector column to issue_screenshots if it doesn't exist
-- This migration adds the element_selector JSON column to store HTML element data from inspect mode

-- Check if column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'issue_screenshots' 
        AND column_name = 'element_selector'
    ) THEN
        ALTER TABLE "issue_screenshots" ADD COLUMN "element_selector" JSONB;
        COMMENT ON COLUMN "issue_screenshots"."element_selector" IS 'JSON object with cssSelector, xpath, boundingBox, outerHTML from element inspect';
    END IF;
END $$;


