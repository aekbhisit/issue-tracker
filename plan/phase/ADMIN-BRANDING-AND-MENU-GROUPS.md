# Admin Dashboard Branding & Menu Groups Enhancement

## Overview
Enhance the admin dashboard with customizable branding (app name and logo) and improved menu organization with visual group separation.

## Goals
1. **Customizable App Branding**
   - Make app name configurable (from settings or environment)
   - Support custom logo upload/configuration
   - Display app name alongside logo in sidebar

2. **Menu Group Organization**
   - Organize menu items into logical groups
   - Add visual separators between groups
   - Support group labels/headers
   - Improve menu hierarchy and navigation

## Current State

### Logo & Branding
- Logo files located in `apps/admin/public/images/logo/`:
  - `logo.svg` (light mode)
  - `logo-dark.svg` (dark mode)
  - `logo-icon.svg` (collapsed sidebar icon)
- Logo displayed in sidebar header (lines 477-503 in `AppSidebar.tsx`)
- No app name displayed currently

### Menu Structure
- Two sections: "MENU" (default + DB items) and "SYSTEM MENU" (hardcoded for super admin)
- **MENU section** includes:
  - Default items: Dashboard, Projects, Issues
  - Database menu items (loaded via `adminMenuApiService.getMenu()`)
- **SYSTEM MENU section** includes (super admin only):
  - Admin Menu, User Management, Roles, Permissions, Activity Logs, File Manager
- No visual grouping within sections (all items shown as flat list)

## Implementation Plan

### Phase 1: App Branding Configuration

#### 1.1 Settings Schema Extension
**File**: `infra/database/prisma/schema/setting.prisma`

Add fields to `Setting` model (logoHeader and logoFooter already exist):
```prisma
model Setting {
  // ... existing fields
  logoHeader     String?  @map("logo_header")      // ✅ Already exists
  logoFooter     String?  @map("logo_footer")      // ✅ Already exists
  appName        String?  @map("app_name")
  appNameShort   String?  @map("app_name_short")   // For collapsed sidebar
  logoIcon       String?  @map("logo_icon")        // For collapsed sidebar
  favicon        String?  @map("favicon")
}
```

#### 1.2 Settings API Endpoints
**File**: `apps/api/src/modules/settings/settings.service.ts`

Add methods:
- `getSettings()` - Get all settings including branding
- `updateBranding(data)` - Update app name and logos
- `uploadLogo(type: 'header' | 'footer' | 'icon')` - Handle logo uploads

#### 1.3 Settings Admin UI
**File**: `apps/admin/app/admin/settings/page.tsx` (new)

Create settings page with:
- App Name input fields (full name, short name)
- Logo upload sections (header, footer, icon, favicon)
- Preview of logos
- Save functionality

#### 1.4 Sidebar Branding Component
**File**: `apps/admin/layout/AppSidebar.tsx`

Update logo section:
- Fetch app name from settings API
- Display app name next to logo when expanded
- Use custom logos from settings (fallback to default)
- Show short name when sidebar collapsed

**Changes**:
```typescript
// Add state for branding
const [appBranding, setAppBranding] = useState({
  appName: 'Issue Collector',
  appNameShort: 'IC',
  logoHeader: '/images/logo/logo.svg',
  logoDark: '/images/logo/logo-dark.svg',
  logoIcon: '/images/logo/logo-icon.svg',
});

// Fetch branding from settings API
useEffect(() => {
  // Load branding settings
}, []);

// Update logo rendering to use branding state
```

### Phase 2: Menu Group Organization

#### 2.1 Database Schema Extension
**File**: `infra/database/prisma/schema/admin_menu.prisma`

Extend `AdminMenu` model (group field already exists, mapped as `required_group`):
```prisma
model AdminMenu {
  // ... existing fields
  group         String?  @map("required_group")   // ✅ Already exists - Group identifier (e.g., "core", "content", "system")
  groupLabel    String?  @map("group_label")     // NEW - Display label for group (translatable)
  groupSequence Int?     @default(0) @map("group_sequence")  // NEW - Order within group
}
```

**Note**: The existing `group` field is mapped as `required_group` in the database. We'll use it for grouping, but may need to add `groupLabel` and `groupSequence` for better organization.

#### 2.2 Menu Group Types
Define standard groups:
- `core` - Core functionality (Dashboard, Projects, Issues)
- `content` - Content management
- `system` - System administration (Users, Roles, Permissions)
- `tools` - Tools and utilities (File Manager, Activity Logs)
- `custom` - Custom groups defined by admin

#### 2.3 Sidebar Menu Grouping Logic
**File**: `apps/admin/layout/AppSidebar.tsx`

Update `convertDBMenuToNavItems`:
- Group menu items by `group` field
- Sort groups by sequence
- Sort items within group by `groupSequence` or `sequence`
- Add group headers/separators

**New structure**:
```typescript
type MenuGroup = {
  key: string;
  label: string;
  items: NavItem[];
  sequence: number;
};

const menuGroups: MenuGroup[] = [
  {
    key: 'core',
    label: 'Core',
    items: [...],
    sequence: 1
  },
  {
    key: 'content',
    label: 'Content',
    items: [...],
    sequence: 2
  },
  // ...
];
```

#### 2.4 Visual Group Separators
**File**: `apps/admin/layout/AppSidebar.tsx`

Add visual separators:
- Group header with label (when expanded)
- Subtle divider line between groups
- Consistent spacing
- Collapsed state shows dots/icon for groups

**Rendering**:
```typescript
{menuGroups.map((group) => (
  <div key={group.key} className="menu-group">
    {(isExpanded || isHovered || isMobileOpen) && (
      <h3 className="menu-group-header">{group.label}</h3>
    )}
    {renderMenuItems(group.items, "main")}
    {group.key !== menuGroups[menuGroups.length - 1].key && (
      <div className="menu-group-divider" />
    )}
  </div>
))}
```

#### 2.5 Admin Menu Form Enhancement
**File**: `apps/admin/app/admin/admin-menu/components/AdminMenuForm.tsx`

Add fields:
- Group dropdown/select
- Group Label input (for custom groups)
- Group Sequence input
- Visual preview of menu structure

### Phase 3: System Menu Integration

#### 3.1 System Menu Grouping
**File**: `apps/admin/layout/AppSidebar.tsx`

Organize `systemMenuItems` into groups:
```typescript
const systemMenuGroups = [
  {
    key: 'administration',
    label: 'Administration',
    items: [
      { name: 'Admin Menu', path: '/admin/admin-menu' },
      { name: 'User Management', path: '/admin/user' },
      { name: 'Roles', path: '/admin/role/admin' },
      { name: 'Permissions', path: '/admin/permission/admin' },
    ]
  },
  {
    key: 'monitoring',
    label: 'Monitoring',
    items: [
      { name: 'Activity Logs', path: '/admin/activity-log' },
    ]
  },
];
```

#### 3.2 Consistent Grouping UI
Apply same visual grouping to system menu as main menu.

## Files to Create/Modify

### New Files
1. `apps/admin/app/admin/settings/page.tsx` - Settings page
2. `apps/admin/app/admin/settings/components/BrandingSection.tsx` - Branding settings component
3. `apps/admin/app/admin/settings/components/LogoUpload.tsx` - Logo upload component
4. `apps/admin/lib/api/settings.ts` - Settings API client
5. `docs/development/BRANDING-CONFIGURATION.md` - Branding documentation

### Modified Files
1. `infra/database/prisma/schema/setting.prisma` - Add branding fields
2. `infra/database/prisma/schema/admin_menu.prisma` - Add group fields
3. `apps/api/src/modules/settings/settings.service.ts` - Add branding methods
4. `apps/api/src/modules/settings/settings.controller.ts` - Add branding endpoints
5. `apps/admin/layout/AppSidebar.tsx` - Update branding and grouping
6. `apps/admin/app/admin/admin-menu/components/AdminMenuForm.tsx` - Add group fields
7. `packages/types/src/setting.types.ts` - Add branding types

## Database Migration

### Migration Steps
1. Add branding fields to `Setting` table
2. Add group fields to `admin_menu` table
3. Migrate existing menu items to appropriate groups
4. Seed default branding values

### Default Values
```typescript
// Settings defaults
appName: 'Issue Collector'
appNameShort: 'IC'
logoHeader: '/images/logo/logo.svg'
logoDark: '/images/logo/logo-dark.svg'
logoIcon: '/images/logo/logo-icon.svg'

// Menu groups defaults
**MENU section:**
- Dashboard → group: 'core'
- Projects → group: 'core'
- Issues → group: 'core'
- (Database items will be assigned groups)

**SYSTEM MENU section:**
- Admin Menu → group: 'administration'
- User Management → group: 'administration'
- Roles → group: 'administration'
- Permissions → group: 'administration'
- Activity Logs → group: 'monitoring'
- File Manager → group: 'tools'
```

## UI/UX Considerations

### Branding Display
- **Expanded Sidebar**: Logo + App Name (horizontal layout)
- **Collapsed Sidebar**: Logo Icon only (centered)
- **Mobile Header**: Logo + App Name Short

### Menu Groups
- **Group Headers**: Subtle gray text, uppercase, small font
- **Group Dividers**: Light gray line with spacing
- **Collapsed State**: Show group indicators (dots or icons)
- **Hover State**: Show group labels on hover

### Responsive Design
- Mobile: Show all groups, no collapse
- Tablet: Collapsible groups
- Desktop: Full expanded/collapsed sidebar

## Testing Checklist

### Branding
- [ ] App name displays correctly in sidebar
- [ ] Logo uploads work for all types (header, footer, icon)
- [ ] Logo preview updates immediately
- [ ] Default logos fallback correctly
- [ ] Dark mode logos work correctly
- [ ] Favicon updates in browser tab

### Menu Groups
- [ ] Menu items group correctly
- [ ] Group headers display when expanded
- [ ] Group separators visible
- [ ] Menu items sort correctly within groups
- [ ] Groups sort correctly
- [ ] Collapsed sidebar shows group indicators
- [ ] System menu groups correctly
- [ ] Admin can assign items to groups
- [ ] Custom group labels work

## Implementation Priority

### High Priority
1. App name configuration and display
2. Menu group organization
3. Visual group separators

### Medium Priority
1. Logo upload functionality
2. Custom group labels
3. Group sequence management

### Low Priority
1. Favicon configuration
2. Advanced branding options
3. Menu group permissions

## Estimated Effort

- **Phase 1 (Branding)**: 4-6 hours
- **Phase 2 (Menu Groups)**: 6-8 hours
- **Phase 3 (System Menu)**: 2-3 hours
- **Testing & Polish**: 2-3 hours

**Total**: 14-20 hours

## Dependencies

- Settings API module (already exists)
- Admin Menu API (already exists)
- File upload functionality (already exists)
- Database migrations

## Notes

- This enhancement improves admin UX significantly
- Can be implemented incrementally (branding first, then groups)
- Backward compatible with existing menu structure
- No breaking changes to existing functionality

