# Screenshot Storage Structure

## Storage Organization

Screenshots are organized by **project** and **issue** for better management and scalability.

### Directory Structure

```
storage/
└── uploads/
    └── screenshots/
        └── {projectId}/
            └── {issueId}/
                └── {uuid}.{ext}
```

### Example

```
storage/uploads/screenshots/
├── 1/                    # Project ID 1
│   ├── 10/               # Issue ID 10
│   │   ├── abc123.png
│   │   └── def456.png
│   └── 15/               # Issue ID 15
│       └── ghi789.png
└── 2/                    # Project ID 2
    ├── 20/               # Issue ID 20
    │   └── jkl012.png
    └── 29/               # Issue ID 29
        └── mno345.png
```

### Storage Path Format

**Database Storage Path**: `screenshots/{projectId}/{issueId}/{filename}`

Example: `screenshots/2/29/4daa8e5b-e2ec-47cb-9fb4-020237611f0f.png`

### Benefits

1. **Better Organization**: Screenshots grouped by project
2. **Easier Management**: Can delete all screenshots for a project
3. **Scalability**: Prevents too many files in a single directory
4. **Backup**: Can backup/restore by project
5. **Quota Management**: Can set per-project storage limits

### Implementation

**File**: `apps/api/src/shared/storage/storage.service.ts`

```typescript
// Storage path: screenshots/{projectId}/{issueId}/{filename}
const screenshotsDir = path.join(
  rootDir, 
  'storage', 
  'uploads', 
  'screenshots', 
  String(projectId),
  String(issueId)
)
```

**Usage**: `apps/api/src/modules/issue/issue.service.ts`

```typescript
const saveResult = await storageService.saveScreenshot(
  data.screenshot.screenshot,
  projectId,  // Project ID for organization
  issue.id,   // Issue ID
  data.screenshot.selector
)
```

### Backward Compatibility

The code supports both old and new path formats:
- **Old**: `screenshots/{issueId}/{filename}` (for existing screenshots)
- **New**: `screenshots/{projectId}/{issueId}/{filename}` (for new screenshots)

File retrieval handles both formats automatically.

### Migration

Existing screenshots with old format (`screenshots/{issueId}/...`) will continue to work. New screenshots will use the project-based structure.

To migrate existing screenshots:
1. Query all `issue_screenshots` records
2. Get `projectId` from `issue.projectId`
3. Move files from `screenshots/{issueId}/` to `screenshots/{projectId}/{issueId}/`
4. Update `storagePath` in database

### File Naming

- **Format**: UUID v4 + extension
- **Example**: `4daa8e5b-e2ec-47cb-9fb4-020237611f0f.png`
- **Purpose**: Prevents filename conflicts

### Element Selector Storage

Element selector data is stored in the database (`issue_screenshots.element_selector` column) as JSON:

```json
{
  "cssSelector": "div.class-name",
  "xpath": "/html/body/div[1]",
  "boundingBox": {
    "x": 49,
    "y": 320,
    "width": 677,
    "height": 164
  },
  "outerHTML": "<div class=\"...\">...</div>"
}
```

### Storage Limits

- **Max file size**: 10MB per screenshot
- **Max dimensions**: 4096x4096 pixels
- **Supported formats**: PNG, JPEG

### Cleanup

When an issue is deleted:
- Screenshot files are automatically deleted (CASCADE)
- Directory structure is preserved (empty directories remain)

When a project is deleted:
- All project screenshots should be cleaned up
- Consider implementing project deletion cleanup script


