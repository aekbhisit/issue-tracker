#!/bin/bash
# Complete storage verification script

echo "=== Screenshot and Element Selector Storage Verification ==="
echo ""

# Check storage directory
STORAGE_DIR="storage/uploads/screenshots"
echo "1. Checking storage directory..."
if [ -d "$STORAGE_DIR" ]; then
    echo "   ✅ Storage directory exists"
    ISSUE_COUNT=$(find "$STORAGE_DIR" -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')
    FILE_COUNT=$(find "$STORAGE_DIR" -type f \( -name "*.png" -o -name "*.jpg" \) | wc -l | tr -d ' ')
    echo "   Issue directories: $ISSUE_COUNT"
    echo "   Screenshot files: $FILE_COUNT"
    
    if [ "$FILE_COUNT" -gt 0 ]; then
        echo "   Files found:"
        find "$STORAGE_DIR" -type f \( -name "*.png" -o -name "*.jpg" \) | head -5 | while read file; do
            SIZE=$(ls -lh "$file" | awk '{print $5}')
            echo "     - $file ($SIZE)"
        done
    else
        echo "   ⚠️  No screenshot files found"
    fi
else
    echo "   ❌ Storage directory does not exist"
fi

echo ""
echo "2. Checking database (requires Prisma)..."
echo "   Run: cd infra/database && node -e \"...\" (see test-db-storage.js)"
echo ""
echo "3. To verify a specific issue:"
echo "   Check API logs for [API Service] messages"
echo "   Check database: SELECT * FROM issue_screenshots WHERE issue_id = [id];"
