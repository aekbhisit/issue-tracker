#!/bin/bash
# Script to help check API logs for screenshot storage

echo "=== API Log Check Guide ==="
echo ""
echo "To verify screenshot storage, check your API server logs for:"
echo ""
echo "✅ SUCCESS INDICATORS:"
echo "  [API Controller] Received issue creation request: { hasScreenshot: true }"
echo "  [API Service] Processing screenshot for issue: ..."
echo "  [API Service] Screenshot saved to storage: { storagePath: '...' }"
echo "  [API Service] Element selector data validated and ready to store:"
echo "  [API Service] Screenshot record created in database: { hasElementSelector: true }"
echo ""
echo "❌ ERROR INDICATORS:"
echo "  [API Service] Failed to save screenshot for issue ..."
echo "  [API Service] Element selector missing required fields:"
echo "  [API Service] Element selector is null or invalid:"
echo ""
echo "To check logs:"
echo "  1. Look at your API server console output"
echo "  2. Or check log files if using a logging system"
echo ""


