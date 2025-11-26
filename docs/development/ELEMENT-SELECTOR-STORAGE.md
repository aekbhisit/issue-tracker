# Element Selector Storage Documentation

## Where HTML Element Data is Stored

When a user inspects an element using the Issue Collector SDK, the HTML element data is stored in the database as follows:

### Database Location

**Table**: `issue_screenshots`  
**Column**: `element_selector` (JSON type)  
**Database Column Name**: `element_selector` (snake_case)

### Data Structure

The `element_selector` column stores a JSON object containing:

```json
{
  "cssSelector": "div.min-h-screen.xl\\:flex:nth-child(2) > div.flex-1...",
  "xpath": "/html/body/div[2]/div[1]/div/div[2]/div/div[2]/div[2]/div[1]/div[1]",
  "boundingBox": {
    "x": 100,
    "y": 200,
    "width": 500,
    "height": 300
  },
  "outerHTML": "<div class=\"flex gap-4 rounded-lg bg-white p-4 dark:bg-gray-800\">...</div>"
}
```

### Storage Flow

1. **SDK Collection** (`apps/collector-sdk/src/widget.ts`)
   - User selects element in inspect mode
   - `extractElementSelector()` extracts: cssSelector, xpath, boundingBox, outerHTML
   - Combined with screenshot data into `ScreenshotMetadata`

2. **SDK Submission** (`apps/collector-sdk/src/panel.ts`)
   - Screenshot metadata (including selector) stored on panel as `currentScreenshot`
   - Included in payload when form is submitted

3. **API Reception** (`apps/api/src/modules/issue/issue.controller.ts`)
   - Receives payload with `screenshot.selector` object
   - Passes to service layer

4. **API Storage** (`apps/api/src/modules/issue/issue.service.ts`)
   - Extracts `data.screenshot.selector`
   - Stores in `issue_screenshots.element_selector` column as JSON

### Database Schema

```prisma
model IssueScreenshot {
  id            Int      @id @default(autoincrement())
  issueId       Int      @map("issue_id")
  storagePath   String   @map("storage_path")
  storageType   String   @map("storage_type")
  mimeType      String?  @map("mime_type")
  width         Int?
  height        Int?
  fileSize      Int?     @map("file_size")
  elementSelector Json?   @map("element_selector") // JSON object with cssSelector, xpath, boundingBox, outerHTML
  createdAt     DateTime @default(now()) @map("created_at")
  issue         Issue    @relation(fields: [issueId], references: [id], onDelete: Cascade)
  
  @@index([issueId])
  @@map("issue_screenshots")
}
```

### Querying the Data

To check if element selector data is stored:

```sql
-- Check all screenshots with element selector data
SELECT 
    id,
    issue_id,
    storage_path,
    element_selector->>'cssSelector' as css_selector,
    element_selector->>'xpath' as xpath,
    element_selector->>'outerHTML' as outer_html,
    LENGTH(element_selector->>'outerHTML') as html_length
FROM issue_screenshots
WHERE element_selector IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- Check specific issue
SELECT 
    s.id,
    s.issue_id,
    s.element_selector,
    i.title as issue_title
FROM issue_screenshots s
JOIN issues i ON s.issue_id = i.id
WHERE s.issue_id = 19;
```

### Display in Admin Panel

The element selector data is displayed in:
- **File**: `apps/admin/app/admin/issues/[id]/page.tsx`
- **Location**: Screenshot section, under each screenshot thumbnail
- **Shows**: CSS Selector, XPath, Bounding Box, and Outer HTML (with copy buttons)

### Troubleshooting

If element selector data is not appearing:

1. **Check SDK logs** - Look for `[SDK Selectors]` logs showing outerHTML extraction
2. **Check API logs** - Look for `[API Service]` logs showing element selector storage
3. **Check database** - Query `issue_screenshots.element_selector` column directly
4. **Verify payload** - Check browser network tab to see if selector is in request payload

### Related Files

- **SDK Selector Extraction**: `apps/collector-sdk/src/selectors.ts`
- **SDK Widget**: `apps/collector-sdk/src/widget.ts`
- **SDK Panel**: `apps/collector-sdk/src/panel.ts`
- **API Service**: `apps/api/src/modules/issue/issue.service.ts`
- **API Types**: `apps/api/src/modules/issue/issue.types.ts`
- **Database Schema**: `infra/database/prisma/schema/issue.prisma`
- **Admin Display**: `apps/admin/app/admin/issues/[id]/page.tsx`


