# IC-3 Testing Instructions

This document provides step-by-step instructions for manually testing IC-3 Inspect Mode + Screenshot Capture functionality.

## Prerequisites

1. **API Server Running**: `pnpm dev:api` (should be running on `http://localhost:4501`)
2. **Admin Dashboard Running**: `pnpm dev:admin` (should be running on `http://localhost:4502`)
3. **Project Created**: At least one active project exists in the database
4. **Project Key**: Copy the `publicKey` of an active project from the admin dashboard

## Setup

1. **Update Test Page**:
   - Open `apps/collector-sdk/test/index.html`
   - Replace `YOUR_PROJECT_KEY` with your actual project key
   - Save the file

2. **Build SDK** (if not already built):
   ```bash
   pnpm --filter=collector-sdk build
   ```

3. **Serve Test Page**:
   ```bash
   cd apps/collector-sdk/test
   python3 -m http.server 8080
   ```

4. **Open Browser**:
   - Navigate to `http://localhost:8080/index.html`
   - Open browser DevTools (F12) to monitor console

## Phase 2: SDK Integration Testing

### Steps:
1. **Verify SDK Loads**:
   - Check browser console for any errors
   - Verify floating "+" button appears in bottom-right corner
   - Button should be blue and circular

2. **Test Modal Opening**:
   - Click the floating button
   - Modal should appear centered on screen
   - Verify form fields are visible:
     - Title input
     - Description textarea
     - Severity dropdown
   - **Verify "Capture Screenshot" button is visible** (IC-3 feature)

**Expected Result**: ✅ SDK loads, button appears, modal opens, form fields visible, "Capture Screenshot" button present

## Phase 3: Inspect Mode Functionality Testing

### Steps:
1. **Activate Inspect Mode**:
   - Click "Capture Screenshot" button in the modal
   - Verify inspect mode activates:
     - Overlay appears covering the page
     - Cursor changes to crosshair
     - Page elements can be hovered

2. **Test Hover Highlighting**:
   - Move mouse over various elements on the page
   - Verify elements are highlighted with blue border
   - Verify highlight follows mouse cursor smoothly
   - Test with different element types:
     - Button elements
     - Div elements
     - Input elements
     - Text elements

3. **Test Element Selection**:
   - Click on a button element
   - Verify element is selected
   - Click on a div element
   - Verify element is selected
   - Click on an input element
   - Verify element is selected

4. **Test ESC Key**:
   - Activate inspect mode
   - Press ESC key
   - Verify inspect mode exits
   - Verify overlay disappears

**Expected Result**: ✅ Inspect mode activates, hover highlighting works smoothly, element selection works, ESC key exits

## Phase 4: Screenshot Capture Testing

### Steps:
1. **Capture Small Element**:
   - Activate inspect mode
   - Click on a small button (< 100x100px)
   - Wait for capture to complete
   - Verify preview modal appears
   - Verify screenshot image is displayed

2. **Capture Medium Element**:
   - Retake screenshot
   - Click on a medium div (100-500px)
   - Verify capture completes
   - Verify preview shows correct element

3. **Capture Large Element**:
   - Retake screenshot
   - Click on a large element (> 500px)
   - Verify capture completes (may take longer)
   - Verify element is downscaled if needed
   - Verify image quality is acceptable

**Expected Result**: ✅ Screenshots captured for all element sizes, preview modal appears, image quality acceptable

## Phase 5: Selector Extraction Testing

### Steps:
1. **Capture Screenshot**:
   - Capture screenshot of an element with an ID (e.g., `#test-button`)
   - Verify preview modal shows metadata section

2. **Verify CSS Selector**:
   - Check CSS selector field
   - Verify it includes the element's ID or classes
   - Copy selector and test in browser console:
     ```javascript
     document.querySelector('PASTE_SELECTOR_HERE')
     ```
   - Verify it selects the correct element

3. **Verify XPath**:
   - Check XPath field
   - Copy XPath and test in browser console:
     ```javascript
     document.evaluate('PASTE_XPATH_HERE', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
     ```
   - Verify it selects the correct element

4. **Verify Bounding Box**:
   - Check bounding box coordinates
   - Verify x, y, width, height are displayed
   - Verify coordinates match element's position

5. **Verify HTML Snippet**:
   - Click "Show HTML" to expand HTML snippet
   - Verify HTML matches element's outerHTML
   - Click "Hide HTML" to collapse

**Expected Result**: ✅ All selectors are accurate and work in browser console, bounding box is correct, HTML matches

## Phase 6: Preview Modal Testing

### Steps:
1. **Verify Preview Display**:
   - Capture a screenshot
   - Verify screenshot image is displayed (centered, proper size)
   - Verify metadata section is visible below image
   - Verify all metadata fields are displayed

2. **Test "Use This Screenshot"**:
   - Click "Use This Screenshot" button
   - Verify returns to form view
   - Verify form fields are still filled (if previously filled)
   - Verify screenshot is attached (will be submitted with form)

3. **Test "Retake Screenshot"**:
   - Click "Retake Screenshot" button
   - Verify inspect mode reactivates
   - Select a different element
   - Verify new screenshot replaces old one

4. **Test "Skip Screenshot"**:
   - Click "Skip Screenshot" button
   - Verify returns to form view
   - Verify no screenshot is attached

5. **Test HTML Snippet Expand/Collapse**:
   - Expand HTML snippet
   - Verify HTML is displayed
   - Collapse HTML snippet
   - Verify HTML is hidden

6. **Test Modal Close**:
   - Click X button in modal header
   - Verify modal closes
   - Reopen modal and capture screenshot
   - Click outside modal (on overlay)
   - Verify modal closes

**Expected Result**: ✅ Preview modal displays correctly, all buttons work, HTML snippet expand/collapse works, modal closes properly

## Phase 7: Form Submission with Screenshot Testing

### Steps:
1. **Submit with Screenshot**:
   - Open modal
   - Capture a screenshot and click "Use This Screenshot"
   - Fill in form:
     - Title: "Test Issue with Screenshot"
     - Description: "This is a test issue with screenshot"
     - Severity: "Medium"
   - Click "Submit" button
   - Verify loading state appears
   - Verify success message appears
   - Verify modal closes automatically

2. **Check API Logs**:
   - Check API server console logs
   - Verify request was received
   - Verify payload includes screenshot data:
     - `screenshot.screenshot.dataUrl` is present
     - `screenshot.screenshot.fileSize` is present
     - `screenshot.screenshot.width` and `height` are present
     - `screenshot.selector.cssSelector` is present
     - `screenshot.selector.xpath` is present
     - `screenshot.selector.boundingBox` is present
     - `screenshot.selector.outerHTML` is present

3. **Submit without Screenshot**:
   - Open modal
   - Click "Skip Screenshot" (or don't capture)
   - Fill in form and submit
   - Verify submission works
   - Verify no screenshot data in payload

**Expected Result**: ✅ Form submission works with and without screenshot, API receives correct data, response includes issue ID

## Phase 8: Error Handling Testing

### Steps:
1. **Test Large Element Timeout** (if possible):
   - Try to capture a very large/complex element
   - If capture takes > 30 seconds, verify timeout error
   - Verify user-friendly error message
   - Verify retry option (if implemented)

2. **Test Network Error**:
   - Stop API server
   - Submit form with screenshot
   - Verify error handling
   - Verify retry logic works
   - Verify user-friendly error message
   - Restart API server

3. **Test Invalid Project Key**:
   - Update test page with invalid project key
   - Reload page
   - Try to submit issue
   - Verify error message is displayed

**Expected Result**: ✅ All error scenarios handled gracefully with user-friendly messages

## Phase 9: Browser Compatibility Testing

### Steps:
Repeat Phases 2-7 in each browser:

1. **Chrome** (latest version)
2. **Firefox** (latest version)
3. **Safari** (latest version, if on macOS)
4. **Edge** (latest version)

For each browser:
- Verify SDK loads
- Test inspect mode
- Test screenshot capture
- Test preview modal
- Test form submission
- Check console for errors

**Expected Result**: ✅ All functionality works in all target browsers

## Phase 10: Performance Testing

### Steps:
1. **Hover Performance**:
   - Activate inspect mode
   - Move mouse quickly over many elements
   - Verify no lag or jank
   - Verify highlight updates smoothly

2. **Capture Timing**:
   - Capture small element and note time
   - Capture medium element and note time
   - Capture large element and note time
   - Verify all complete within timeout (30s)

3. **Memory Usage**:
   - Open browser DevTools Memory profiler
   - Capture multiple screenshots
   - Verify memory doesn't increase significantly
   - Verify no memory leaks

**Expected Result**: ✅ Performance is acceptable, no lag, captures complete in time, no memory leaks

## Phase 11: API Validation Testing

### Steps:
1. **Test Valid Screenshot**:
   - Submit issue with valid screenshot
   - Verify API accepts (201 status)

2. **Test Invalid Screenshot** (requires API testing):
   - Use curl or Postman to send invalid screenshot data
   - Test invalid data URL format
   - Test file size > 10MB
   - Test dimensions > 4096x4096
   - Test invalid mime type
   - Verify API rejects with clear error messages

**Expected Result**: ✅ Valid data accepted, invalid data rejected with clear errors

## Phase 12: Edge Cases Testing

### Steps:
1. **Multiple Screenshots**:
   - Capture screenshot, retake, capture again
   - Verify previous screenshot is cleaned up
   - Verify new screenshot replaces old one

2. **Modal State Management**:
   - Open modal, start inspect mode, close modal
   - Verify inspect mode is cleaned up
   - Verify no memory leaks

3. **Concurrent Operations**:
   - Try to activate inspect mode while capture is in progress
   - Verify only one operation at a time

4. **Window Resize**:
   - Activate inspect mode
   - Resize browser window
   - Verify highlight still works correctly

**Expected Result**: ✅ All edge cases handled correctly

## Recording Results

After completing each phase, update `IC-3-TEST-RESULTS.md` with:
- Test results (PASSED/FAILED)
- Any issues found
- Performance metrics
- Browser versions tested
- Screenshots (if applicable)

## Troubleshooting

### SDK Not Loading
- Check browser console for errors
- Verify script tag has correct `data-project-key`
- Verify `collector.min.js` file exists in `dist/` folder
- Verify HTTP server is running

### Inspect Mode Not Activating
- Check browser console for errors
- Verify "Capture Screenshot" button is clicked
- Verify no JavaScript errors

### Screenshot Capture Failing
- Check browser console for errors
- Verify html2canvas is loaded
- Check for CORS issues
- Verify element is visible and not hidden

### API Errors
- Verify API server is running
- Check API server logs
- Verify project key is valid
- Verify CORS is configured correctly

## Next Steps

After completing all tests:
1. Update `IC-3-TEST-RESULTS.md` with final results
2. Document any issues found
3. Fix any critical issues
4. Re-test affected areas
5. Sign off on IC-3 completion

