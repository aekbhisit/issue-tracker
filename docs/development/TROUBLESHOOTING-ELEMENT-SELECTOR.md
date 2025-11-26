# Troubleshooting: Element Selector Not Appearing

## Problem
Element selector data (CSS selector, XPath, outerHTML) is not being stored or displayed in the issue detail page.

## Diagnostic Steps

### Step 1: Check Browser Console (SDK Side)

When submitting an issue with inspect mode:

1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for these log messages:

**Expected logs:**
```
[SDK] Starting screenshot capture for element: {...}
[SDK] Screenshot captured successfully: {...}
[SDK] Element selector extracted: {...}
[SDK] Screenshot metadata created: {...}
[SDK Panel] updateScreenshot called: {...}
[SDK] Form submission - currentScreenshot: {...}
[SDK] Payload created for submission: {...}
[SDK API] Submitting payload: {...}
```

**If you see:**
- `Failed to capture screenshot` → Screenshot capture is failing
- `Cannot update panel without screenshot data` → Selector extracted but not stored
- `hasSelector: false` → Selector not in payload

### Step 2: Check Network Tab

1. Open Network tab in DevTools
2. Submit an issue
3. Find the POST request to `/api/public/v1/issues`
4. Check the Request Payload:

**Expected payload structure:**
```json
{
  "screenshot": {
    "screenshot": {
      "dataUrl": "data:image/jpeg;base64,...",
      "width": 500,
      "height": 300,
      ...
    },
    "selector": {
      "cssSelector": "div.class...",
      "xpath": "/html/body/...",
      "outerHTML": "<div>...</div>",
      "boundingBox": {...}
    }
  }
}
```

**If selector is missing:**
- Check if `screenshot.selector` exists in payload
- Check if all required fields are present (cssSelector, xpath, outerHTML, boundingBox)

### Step 3: Check API Server Logs

Look for these log messages in your API server console:

**Expected logs:**
```
[API Controller] Received issue creation request: {...}
[API Service] Processing screenshot for issue: {...}
[API Service] Element selector data validated and ready to store: {...}
[API Service] Screenshot record created in database: {...}
```

**If you see:**
- `hasSelector: false` → Selector not received by API
- `Element selector missing required fields` → Selector incomplete
- `Element selector is null or invalid` → Selector not sent properly

### Step 4: Check Database Directly

Run this query to check if data is stored:

```sql
-- Check recent screenshots
SELECT 
    id,
    issue_id,
    element_selector IS NOT NULL as has_element_data,
    CASE 
        WHEN element_selector IS NOT NULL 
        THEN jsonb_typeof(element_selector)
        ELSE 'null'
    END as selector_type,
    CASE 
        WHEN element_selector IS NOT NULL 
        THEN element_selector->>'outerHTML'
        ELSE NULL
    END as outer_html_preview
FROM issue_screenshots
ORDER BY created_at DESC
LIMIT 10;
```

**Or use the test script:**
```bash
npx tsx scripts/test-element-selector-storage.ts [issue_id]
```

### Step 5: Common Issues and Fixes

#### Issue 1: Screenshot Capture Fails
**Symptoms:** Browser console shows "Failed to capture screenshot"
**Cause:** html2canvas library failing or element too large
**Fix:** 
- Check browser console for html2canvas errors
- Try selecting a smaller element
- Check if element is in an iframe (cross-origin issues)

#### Issue 2: Selector Not in Payload
**Symptoms:** Network tab shows payload without `screenshot.selector`
**Cause:** Screenshot capture failed, selector not stored on panel
**Fix:** 
- Ensure screenshot capture succeeds
- Check `currentScreenshot` on panel before submission
- Verify `updateScreenshot` was called successfully

#### Issue 3: Validation Error
**Symptoms:** API returns 400 error about missing selector fields
**Cause:** Selector object missing required fields (cssSelector, xpath, outerHTML, boundingBox)
**Fix:**
- Check `extractElementSelector()` function
- Verify element has valid outerHTML
- Check if element is in shadow DOM (may not extract properly)

#### Issue 4: Selector Stored as NULL
**Symptoms:** Database shows `element_selector IS NULL`
**Cause:** Selector validation failed or was set to null
**Fix:**
- Check API logs for validation warnings
- Verify selector object has all required fields
- Check if Prisma.JsonNull is being set incorrectly

#### Issue 5: Selector Not Displayed
**Symptoms:** Database has data but admin page doesn't show it
**Cause:** Frontend mapping issue or data structure mismatch
**Fix:**
- Check browser console for `[SDK]` logs showing selector data
- Verify `screenshot.elementSelector` exists in API response
- Check admin page mapping in `apps/admin/app/admin/issues/api.ts`

## Verification Checklist

- [ ] SDK extracts selector: Check `[SDK Selectors]` logs
- [ ] SDK stores on panel: Check `[SDK Panel]` logs
- [ ] SDK includes in payload: Check `[SDK] Payload created` logs
- [ ] API receives selector: Check `[API Controller]` logs
- [ ] API validates selector: Check `[API Service]` logs
- [ ] API stores in DB: Check `[API Service] Screenshot record created` logs
- [ ] Database has data: Run SQL query or test script
- [ ] Admin page receives data: Check network response
- [ ] Admin page displays data: Check UI rendering

## Quick Test

1. Open issue collector widget
2. Click "Inspect Element"
3. Select any element on the page
4. Fill form and submit
5. Check browser console for all `[SDK]` logs
6. Check API server logs for all `[API]` logs
7. Check database: `SELECT element_selector FROM issue_screenshots WHERE issue_id = [new_issue_id]`

## Files to Check

- **SDK Selector Extraction**: `apps/collector-sdk/src/selectors.ts`
- **SDK Widget**: `apps/collector-sdk/src/widget.ts` (lines 179-270)
- **SDK Panel**: `apps/collector-sdk/src/panel.ts` (lines 892-932)
- **SDK API**: `apps/collector-sdk/src/api.ts` (lines 22-92)
- **API Controller**: `apps/api/src/modules/issue/issue.controller.ts` (lines 24-37)
- **API Service**: `apps/api/src/modules/issue/issue.service.ts` (lines 169-218)
- **API Validation**: `apps/api/src/modules/issue/issue.validation.ts` (lines 145-167)
- **Admin Mapping**: `apps/admin/app/admin/issues/api.ts` (line 63)
- **Admin Display**: `apps/admin/app/admin/issues/[id]/page.tsx` (line 615)


