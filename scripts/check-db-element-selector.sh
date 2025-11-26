#!/bin/bash
# Quick script to check element selector data in database

echo "=== Checking Element Selector Storage ==="
echo ""

# Try to connect to database and check
# Adjust connection string as needed
DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/issue_collector}"

psql "$DATABASE_URL" -c "
SELECT 
    s.id,
    s.issue_id,
    i.title as issue_title,
    CASE 
        WHEN s.element_selector IS NULL THEN 'NULL'
        ELSE 'EXISTS'
    END as selector_status,
    CASE 
        WHEN s.element_selector IS NOT NULL 
        THEN (s.element_selector->>'outerHTML')::text
        ELSE NULL
    END as outer_html_preview
FROM issue_screenshots s
LEFT JOIN issues i ON s.issue_id = i.id
ORDER BY s.created_at DESC
LIMIT 10;
" 2>&1 || echo "Could not connect to database. Please check DATABASE_URL or run the TypeScript test script instead."

