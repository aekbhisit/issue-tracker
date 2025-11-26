# Admin UI/UX Guidelines

This document provides comprehensive guidelines for creating consistent, accessible, and user-friendly admin interface components for the Issue Collector Platform.

**Theme**: The admin app uses the **TailAdmin** theme, a modern admin dashboard template built with Tailwind CSS.

**Note**: These guidelines are based on the actual implementation in `apps/admin/`. All patterns, components, and examples reflect the current codebase using:
- **TailAdmin Theme** - Design system and component patterns
- **TanStack React Table** (`@tanstack/react-table@^8.21.3`) for tables with filters, sorting, and pagination
- **Tailwind CSS v4** for styling with custom design tokens
- **Next.js 15** with App Router
- **React 19** with TypeScript
- **Dark Mode** support via `ThemeContext`

## 📋 Table of Contents

1. [Design System](#design-system)
2. [Component Patterns](#component-patterns)
3. [Layout Patterns](#layout-patterns)
4. [Form Patterns](#form-patterns)
5. [Table Patterns](#table-patterns)
6. [Loading States](#loading-states)
7. [Best Practices](#best-practices)

---

## 🎨 TailAdmin Design System

### Color Palette

The admin interface uses the TailAdmin color system defined in `apps/admin/public/styles/globals.css` with comprehensive color scales:

#### Brand Colors (Primary Actions)
- `brand-25` (#f2f7ff) - Lightest background
- `brand-50` (#ecf3ff) - Subtle backgrounds
- `brand-100` (#dde9ff) - Hover backgrounds
- `brand-500` (#465fff) - **Primary brand color** - Main actions, links, active states
- `brand-600` (#3641f5) - Hover states
- `brand-700` (#2a31d8) - Active/pressed states
- `brand-900` (#262e89) - Darkest shade

**Usage**: Buttons, links, active menu items, focus rings

#### Semantic Colors

**Success** (Positive actions, success states):
- `success-50` (#ecfdf3) - Light backgrounds
- `success-500` (#12b76a) - **Primary success color**
- `success-600` (#039855) - Hover states

**Error** (Errors, destructive actions):
- `error-50` (#fef3f2) - Light backgrounds
- `error-500` (#f04438) - **Primary error color**
- `error-600` (#d92d20) - Hover states

**Warning** (Warnings, caution):
- `warning-50` (#fffaeb) - Light backgrounds
- `warning-500` (#f79009) - **Primary warning color**
- `warning-600` (#dc6803) - Hover states

**Info** (Informational):
- `blue-light-50` (#f0f9ff) - Light backgrounds
- `blue-light-500` (#0ba5ec) - **Primary info color**
- `blue-light-600` (#0086c9) - Hover states

#### Gray Scale (Neutral Colors)
- `gray-50` (#f9fafb) - Lightest backgrounds
- `gray-100` (#f2f4f7) - Subtle backgrounds
- `gray-200` (#e4e7ec) - Borders, dividers
- `gray-300` (#d0d5dd) - Disabled states
- `gray-400` (#98a2b3) - Placeholder text
- `gray-500` (#667085) - Secondary text
- `gray-600` (#475467) - Body text
- `gray-700` (#344054) - Headings (dark mode)
- `gray-800` (#1d2939) - Dark backgrounds
- `gray-900` (#101828) - Darkest backgrounds

### Typography

**Font Family**: Outfit (Google Fonts)

**Text Sizes** (defined as CSS custom properties):
- `text-title-2xl` - 72px / 90px line-height
- `text-title-xl` - 60px / 72px line-height
- `text-title-lg` - 48px / 60px line-height
- `text-title-md` - 36px / 44px line-height
- `text-title-sm` - 30px / 38px line-height
- `text-theme-xl` - 20px / 30px line-height
- `text-theme-sm` - 14px / 20px line-height
- `text-theme-xs` - 12px / 18px line-height

### Shadows

- `shadow-theme-xs` - Subtle shadows (cards, inputs)
- `shadow-theme-sm` - Small shadows (dropdowns)
- `shadow-theme-md` - Medium shadows (modals, popovers)
- `shadow-theme-lg` - Large shadows (overlays)
- `shadow-theme-xl` - Extra large shadows (drawers)

### Spacing & Layout

**Breakpoints**:
- `2xsm`: 375px
- `xsm`: 425px
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px
- `3xl`: 2000px

**Control Height**: `42px` (standard input/button height)
- **Warning**: `warning-500` (#f79009) - Warnings, caution states
- **Info**: `blue-light-500` (#0ba5ec) - Informational messages

#### Neutral Colors
- **Gray Scale**: `gray-50` to `gray-950` - Text, borders, backgrounds
- **White**: `white` (#ffffff) - Card backgrounds, light mode
- **Black**: `black` (#101828) - Primary text, dark mode

#### Usage Guidelines
```tsx
// ✅ Good - Use semantic colors
<Badge color="success">Active</Badge>
<Button variant="primary">Save</Button>

// ❌ Bad - Don't use arbitrary colors
<div className="bg-[#ff0000]">Error</div>
```

### Typography

#### Font Family
- **Primary**: `Outfit` (sans-serif)
- Applied via: `font-outfit` class

#### Text Sizes
- **Title 2XL**: 72px / 90px line-height - Hero sections
- **Title XL**: 60px / 72px line-height - Page titles
- **Title LG**: 48px / 60px line-height - Section headers
- **Title MD**: 36px / 44px line-height - Card titles
- **Title SM**: 30px / 38px line-height - Subsection headers
- **Theme XL**: 20px / 30px line-height - Large body text
- **Theme SM**: 14px / 20px line-height - Small text, captions
- **Theme XS**: 12px / 18px line-height - Tiny text, labels

#### Usage
```tsx
// ✅ Good - Use theme text sizes
<h1 className="text-title-lg">Dashboard</h1>
<p className="text-theme-sm text-gray-600">Description text</p>

// ❌ Bad - Don't use arbitrary sizes
<h1 className="text-[45px]">Dashboard</h1>
```

### Spacing

Use Tailwind's spacing scale (4px base unit):
- `p-4` = 16px padding
- `gap-4` = 16px gap
- `space-y-4` = 16px vertical spacing

### Shadows

- **xs**: `shadow-theme-xs` - Subtle elevation
- **sm**: `shadow-theme-sm` - Cards, inputs
- **md**: `shadow-theme-md` - Elevated cards
- **lg**: `shadow-theme-lg` - Modals, dropdowns
- **xl**: `shadow-theme-xl` - High elevation

### Border Radius

- **Small**: `rounded-lg` (8px) - Buttons, inputs, badges
- **Medium**: `rounded-xl` (12px) - Cards, containers
- **Full**: `rounded-full` - Badges, avatars

---

## 🧩 Component Patterns

### Buttons

**Location**: `apps/admin/components/ui/button/Button.tsx`

Comprehensive button guidelines for consistent UI patterns across the admin dashboard.

#### Button Variants

**Primary Button** (`variant="primary"`)
- **Use for**: Main actions (Save, Submit, Create, Add)
- **Color**: Brand blue (`brand-500`)
- **Style**: Solid background with white text

**Outline Button** (`variant="outline"`)
- **Use for**: Secondary actions (Cancel, Back, Reset)
- **Color**: Gray border with gray text
- **Style**: Transparent background with border

#### Button Sizes

- **sm**: `px-4 py-3 text-sm` - Small buttons for compact spaces
- **md**: `px-5 py-3.5 text-sm` - Default size (most use cases)
- **Default**: `control-height px-3 text-sm` - Standard height (42px)

#### Action-Based Button Colors

Buttons should use colors that match their action type:

| Action | Color | Icon | Usage |
|--------|-------|------|-------|
| **Create/Add** | Brand blue (primary) | `+` or `PlusIcon` | Add new items |
| **Edit/Update** | Green | `EditIcon` (pencil) | Modify existing items |
| **Delete/Remove** | Red | `DeleteIcon` (trash) | Remove items |
| **View/View Details** | Blue | `ViewIcon` (eye) | View information |
| **Save/Submit** | Brand blue (primary) | `SaveIcon` or `CheckIcon` | Save changes |
| **Cancel** | Gray (outline) | `XIcon` or `CloseIcon` | Cancel action |
| **Activate/Enable** | Green | `CheckIcon` | Enable/activate items |
| **Deactivate/Disable** | Yellow/Orange | `XIcon` or `BanIcon` | Disable/deactivate items |
| **Export** | Blue | `DownloadIcon` | Export data |
| **Import** | Blue | `UploadIcon` | Import data |
| **Refresh** | Gray | `RefreshIcon` | Refresh data |
| **Search** | Gray | `SearchIcon` | Search functionality |

#### Button Patterns

##### 1. Primary Action Buttons (Toolbar/Forms)

**Icon + Text** - Use when there's sufficient space:

```tsx
import Button from "@/components/ui/button/Button"

// Create/Add button
<Button onClick={handleAdd}>
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
  <span>Add User</span>
</Button>

// Save button
<Button variant="primary" onClick={handleSave}>
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
  <span>Save Changes</span>
</Button>
```

**Using startIcon prop** (Recommended):

```tsx
<Button 
  variant="primary" 
  onClick={handleSave}
  startIcon={
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  }
>
  Save Changes
</Button>
```

##### 2. Action Buttons in Table Rows

**Icon Only** - Use in table action columns (space-constrained):

```tsx
import { EditAction, DeleteAction, ViewAction } from "@/components/ui/table/actions"

// In table columns
{
  id: "actions",
  header: "Actions",
  cell: ({ row }) => (
    <div className="flex items-center gap-2">
      <ViewAction onClick={() => onView(row.original)} />
      <EditAction onClick={() => onEdit(row.original)} />
      <DeleteAction onClick={() => onDelete(row.original)} />
    </div>
  ),
  enableSorting: false,
}
```

**Action Components** (`apps/admin/components/ui/table/actions/`):

- `EditAction` - Green icon, edit action
- `DeleteAction` - Red icon, delete action
- `ViewAction` - Blue icon, view action

**Custom Icon Button Pattern**:

```tsx
// Edit button (green)
<button
  onClick={onEdit}
  className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
  title="Edit"
>
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
</button>

// Delete button (red)
<button
  onClick={onDelete}
  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
  title="Delete"
>
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
</button>
```

##### 3. Bulk Action Buttons (Toolbar)

**Icon + Text with Color Coding**:

```tsx
// Bulk Activate (green)
<Button
  variant="outline"
  onClick={onBulkActivate}
  className="border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/20 dark:hover:text-green-300"
>
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
  <span>Activate Selected</span>
</Button>

// Bulk Deactivate (yellow/orange)
<Button
  variant="outline"
  onClick={onBulkDeactivate}
  className="border-yellow-200 text-yellow-600 hover:bg-yellow-50 hover:text-yellow-700 dark:border-yellow-800 dark:text-yellow-400 dark:hover:bg-yellow-900/20 dark:hover:text-yellow-300"
>
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
  </svg>
  <span>Deactivate Selected</span>
</Button>

// Bulk Delete (red)
<Button
  variant="outline"
  onClick={onBulkDelete}
  className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
>
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
  <span>Delete Selected</span>
</Button>
```

##### 4. Status Toggle Buttons

**Toggle Status** - Use `StatusToggleButton` component:

```tsx
import { StatusToggleButton } from "@/components/ui/table/StatusToggleButton"

<StatusToggleButton
  isActive={user.status}
  onToggle={() => onToggleStatus(user)}
  activeLabel="Active"
  inactiveLabel="Inactive"
/>
```

##### 5. Form Action Buttons

**Save and Cancel**:

```tsx
<div className="flex items-center gap-3">
  <Button variant="outline" onClick={handleCancel}>
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
    <span>Cancel</span>
  </Button>
  <Button variant="primary" onClick={handleSave}>
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
    <span>Save Changes</span>
  </Button>
</div>
```

#### Button Guidelines

##### ✅ DO:

1. **Always include icons** - Every button should have an icon
2. **Use action-appropriate colors** - Match color to action type
3. **Icon-only in tables** - Use icon-only buttons in table action columns
4. **Icon + text in toolbars** - Use icon with text in toolbars and forms
5. **Consistent icon sizes** - Use `w-4 h-4` for icons in buttons
6. **Provide tooltips** - Add `title` prop for icon-only buttons
7. **Use semantic colors** - Green for edit, red for delete, blue for view
8. **Group related actions** - Place related buttons together with `gap-2`

##### ❌ DON'T:

1. **Don't use text-only buttons** - Always include an icon
2. **Don't mix icon sizes** - Keep icons consistent (`w-4 h-4`)
3. **Don't use wrong colors** - Don't use red for edit, green for delete
4. **Don't forget hover states** - Always include hover effects
5. **Don't use arbitrary colors** - Use TailAdmin color system
6. **Don't skip tooltips** - Icon-only buttons need tooltips
7. **Don't use buttons for navigation** - Use links for navigation

#### Icon Library

Use SVG icons from Heroicons or custom icons. Common icon paths are documented above.

#### Complete Examples

**Toolbar with Actions**:

```tsx
<div className="flex flex-wrap items-center gap-2">
  {/* Primary action */}
  <Button onClick={handleAdd}>
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
    <span>Add User</span>
  </Button>

  {/* Bulk actions */}
  {selectedCount > 0 && (
    <>
      <Button
        variant="outline"
        onClick={onBulkActivate}
        className="border-green-200 text-green-600 hover:bg-green-50"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span>Activate</span>
      </Button>
      <Button
        variant="outline"
        onClick={onBulkDelete}
        className="border-red-200 text-red-600 hover:bg-red-50"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        <span>Delete</span>
      </Button>
    </>
  )}
</div>
```

**Table Actions Column**:

```tsx
{
  id: "actions",
  header: "Actions",
  cell: ({ row }) => (
    <div className="flex items-center gap-2">
      <ViewAction onClick={() => onView(row.original)} />
      <EditAction onClick={() => onEdit(row.original)} />
      <DeleteAction onClick={() => onDelete(row.original)} />
    </div>
  ),
  enableSorting: false,
}
```

**Form Actions**:

```tsx
<div className="flex items-center justify-end gap-3 pt-6 border-t">
  <Button variant="outline" onClick={handleCancel}>
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
    <span>Cancel</span>
  </Button>
  <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
    <span>{isSubmitting ? "Saving..." : "Save Changes"}</span>
  </Button>
</div>
```

### Badges

**Location**: `apps/admin/components/ui/badge/Badge.tsx`

#### Variants
- **Light**: Subtle background with colored text
- **Solid**: Solid colored background

#### Colors
- `primary`, `success`, `error`, `warning`, `info`, `light`, `dark`

#### Usage
```tsx
import Badge from "@/components/ui/badge/Badge"

// Status indicators
<Badge color="success" variant="light">Active</Badge>
<Badge color="error" variant="solid">Inactive</Badge>
```

### Alerts

**Location**: `apps/admin/components/ui/alert/Alert.tsx`

Use for important messages, warnings, and errors.

### Loading Components

**Location**: `apps/admin/components/ui/loading/`

- **GlobalLoading**: Toast-style spinner for async operations
- **PageLoading**: Full-page overlay for initial loads
- **DTLoading**: Inline table placeholder
- **OverlayLoading**: Customizable overlay

---

## 📐 Layout Patterns

### Page Layout Structure

```tsx
<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
  {/* Header (sticky) */}
  <div className="sticky top-0 z-30 bg-white shadow-sm">
    <h1 className="text-title-md">Page Title</h1>
  </div>

  {/* Content */}
  <div className="p-4 md:p-6">
    {/* Toolbar */}
    <TableToolbar>
      {/* Search, filters, actions */}
    </TableToolbar>

    {/* Main content */}
    <TableSection>
      {/* Tables, forms, etc. */}
    </TableSection>
  </div>
</div>
```

### Form Layout

**Location**: `apps/admin/components/form/FormLayout.tsx`

Use `FormLayout` for create/edit forms:

```tsx
import { FormLayout } from "@/components/form/FormLayout"

<FormLayout
  title="Create User"
  description="Add a new user to the system"
  actions={
    <>
      <Button variant="outline" onClick={handleCancel}>Cancel</Button>
      <Button variant="primary" onClick={handleSave}>Save</Button>
    </>
  }
  sidebar={
    <div className="space-y-4">
      {/* Sidebar content: status, metadata, etc. */}
    </div>
  }
>
  {/* Form fields */}
</FormLayout>
```

### Table Page Layout

**Location**: `apps/admin/components/tables/TablePageLayout.tsx`

```tsx
import { TablePageLayout, TableToolbar, TableSection } from "@/components/tables/TablePageLayout"

<TablePageLayout>
  <TableToolbar>
    {/* Search, filters, bulk actions */}
  </TableToolbar>
  
  <TableSection>
    {/* Table component */}
  </TableSection>
</TablePageLayout>
```

---

## 📝 Form Patterns

### Form Inputs

**Location**: `apps/admin/components/form/inputs/`

#### Available Inputs
- `TextInput` - Text fields
- `TextareaInput` - Multi-line text
- `SelectInput` - Dropdown selects
- `ReactSelect` - Advanced select (multi-select, searchable)
- `ToggleSwitch` - Boolean toggles
- `CheckboxInput` - Checkboxes
- `DateLengthPicker` - Date/range pickers
- `FileUpload` - File uploads
- `TextEditor` - Rich text editor (Quill)

#### Form Pattern
```tsx
import TextInput from "@/components/form/inputs/TextInput"
import ReactSelect from "@/components/form/inputs/ReactSelect"
import ToggleSwitch from "@/components/form/inputs/ToggleSwitch"

<div className="space-y-4">
  <TextInput
    label="Name"
    value={formData.name}
    onChange={(e) => handleInputChange('name', e.target.value)}
    error={errors.name}
    required
  />
  
  <ReactSelect
    label="Role"
    options={roleOptions}
    value={formData.roleId}
    onChange={(option) => handleInputChange('roleId', option?.value)}
    error={errors.roleId}
  />
  
  <ToggleSwitch
    label="Active Status"
    checked={formData.status}
    onChange={(checked) => handleInputChange('status', checked)}
  />
</div>
```

#### Form Guidelines
- ✅ Always include labels
- ✅ Show validation errors below inputs
- ✅ Use `required` prop for required fields
- ✅ Group related fields together
- ✅ Use `space-y-4` for vertical spacing
- ✅ Disable form during submission (`isSubmitting`)

---

## 📊 Table Patterns

### Table Library: TanStack React Table

**The admin app uses `@tanstack/react-table` (v8)**, NOT DataTables. This is a headless, React-based table library that provides powerful features while maintaining full control over styling.

**Package**: `@tanstack/react-table@^8.21.3`

**Key Features**:
- ✅ **Server-side sorting** - Sorting handled by API
- ✅ **Server-side pagination** - Pagination handled by API
- ✅ **Column filtering** - Client-side filtering support
- ✅ **Row selection** - Single and bulk selection
- ✅ **Custom cell rendering** - Full control over cell content
- ✅ **Responsive design** - Works on all screen sizes
- ✅ **Dark mode support** - Automatic theme adaptation

### Table Structure Pattern

Tables follow a consistent pattern with:
1. **Table Component** - Uses TanStack React Table hooks
2. **Columns Definition** - Separate file with `use[Feature]TableColumns` hook
3. **Table Rendering** - Custom rendering with `flexRender`

#### Example: Complete Table Implementation

**Step 1: Define Columns** (`[Feature]TableColumns.tsx`)

```tsx
"use client"

import { useMemo } from "react"
import { ColumnDef } from "@tanstack/react-table"
import Badge from "@/components/ui/badge/Badge"
import { EditAction, DeleteAction } from "@/components/ui/table/actions"
import { StatusToggleButton } from "@/components/ui/table/StatusToggleButton"

import type { Project } from "../types"

export function useProjectTableColumns({
  onEdit,
  onDelete,
  onToggleStatus,
}: {
  onEdit: (project: Project) => void
  onDelete: (project: Project) => void
  onToggleStatus: (project: Project) => void
}): ColumnDef<Project>[] {
  return useMemo<ColumnDef<Project>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: "Project Name",
        cell: ({ row }) => (
          <span className="font-medium text-gray-900 dark:text-white">
            {row.original.name}
          </span>
        ),
      },
      {
        id: "status",
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <StatusToggleButton
            isActive={row.original.status}
            onToggle={() => onToggleStatus(row.original)}
            activeLabel="Active"
            inactiveLabel="Inactive"
          />
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <EditAction onClick={() => onEdit(row.original)} />
            <DeleteAction onClick={() => onDelete(row.original)} />
          </div>
        ),
        enableSorting: false,
      },
    ],
    [onEdit, onDelete, onToggleStatus]
  )
}
```

**Step 2: Create Table Component** (`[Feature]Table.tsx`)

```tsx
"use client"

import {
  ColumnFiltersState,
  PaginationState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import Button from "@/components/ui/button/Button"
import { DTLoading } from "@/components/ui/loading"
import ReactSelect, { type SelectOption } from "@/components/form/inputs/ReactSelect"

import type { Project } from "../types"
import { useProjectTableColumns } from "./ProjectTableColumns"

interface ProjectTableProps {
  data: Project[]
  loading: boolean
  totalItems: number
  totalPages: number
  currentPage: number
  itemsPerPage: number
  sortField: string
  sortOrder: "asc" | "desc"
  onSort: (field: string, order: "asc" | "desc") => void
  onPageChange: (page: number) => void
  onItemsPerPageChange: (size: number) => void
  onEdit: (project: Project) => void
  onDelete: (project: Project) => void
  onToggleStatus: (project: Project) => void
}

export function ProjectTable({
  data,
  loading,
  totalItems,
  totalPages,
  currentPage,
  itemsPerPage,
  sortField,
  sortOrder,
  onSort,
  onPageChange,
  onItemsPerPageChange,
  onEdit,
  onDelete,
  onToggleStatus,
}: ProjectTableProps) {
  const { t } = useTranslation()
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const sortingState = useMemo<SortingState>(
    () => (sortField ? [{ id: sortField, desc: sortOrder === "desc" }] : []),
    [sortField, sortOrder]
  )

  const paginationState = useMemo<PaginationState>(
    () => ({ pageIndex: Math.max(currentPage - 1, 0), pageSize: itemsPerPage }),
    [currentPage, itemsPerPage]
  )

  const columns = useProjectTableColumns({
    onEdit,
    onDelete,
    onToggleStatus,
  })

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting: sortingState,
      pagination: paginationState,
      columnFilters,
    },
    enableSortingRemoval: false,
    manualSorting: true, // Server-side sorting
    manualPagination: true, // Server-side pagination
    pageCount: totalPages,
    onSortingChange: (updater) => {
      const newSorting = typeof updater === "function" ? updater(sortingState) : updater
      if (newSorting.length > 0) {
        const nextSort = newSorting[0]
        onSort(nextSort.id, nextSort.desc ? "desc" : "asc")
      }
    },
    onPaginationChange: (updater) => {
      const newPagination = typeof updater === "function" ? updater(paginationState) : updater
      if (newPagination.pageIndex !== paginationState.pageIndex) {
        onPageChange(newPagination.pageIndex + 1)
      }
      if (newPagination.pageSize !== paginationState.pageSize) {
        onItemsPerPageChange(newPagination.pageSize)
      }
    },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: false,
  })

  const visibleColumnCount = Math.max(table.getVisibleLeafColumns().length, 1)
  const perPageOptions = useMemo<SelectOption[]>(
    () => [10, 20, 50].map((size) => ({ value: size, label: `${size} per page` })),
    []
  )

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      {/* Table Header */}
      <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Projects</h3>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 ${
                      header.column.getCanSort()
                        ? "cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <span>
                          {{ asc: "↑", desc: "↓" }[header.column.getIsSorted() as string] ?? "↕"}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
            {loading ? (
              <tr>
                <td className="px-6 py-10" colSpan={visibleColumnCount}>
                  <DTLoading
                    message="Loading projects..."
                    className="mx-auto w-full max-w-sm min-h-0 border-none p-0 shadow-none"
                  />
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
                  colSpan={visibleColumnCount}
                >
                  No projects found
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="whitespace-nowrap px-6 py-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700 md:flex-row md:items-center md:justify-between">
        <span className="text-sm text-gray-600 dark:text-gray-300">
          Showing {totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to{" "}
          {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} results
        </span>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
            disabled={currentPage <= 1}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage >= totalPages}
          >
            Next
          </Button>
          <ReactSelect
            className="ml-3 min-w-[140px]"
            options={perPageOptions}
            value={itemsPerPage}
            onChange={(value) => {
              const nextValue = typeof value === "number" ? value : parseInt(String(value ?? ""), 10)
              if (!Number.isNaN(nextValue)) {
                onItemsPerPageChange(nextValue)
              }
            }}
            isClearable={false}
            isSearchable={false}
          />
        </div>
      </div>
    </div>
  )
}
```

### Key TanStack React Table Features

#### Server-Side Operations
- **Manual Sorting**: `manualSorting: true` - Sorting handled by server
- **Manual Pagination**: `manualPagination: true` - Pagination handled by server
- **Page Count**: `pageCount: totalPages` - Total pages from server

#### Column Configuration
- **Accessor**: `accessorKey: "name"` - Maps to data property
- **Custom Cell**: `cell: ({ row }) => <Component />` - Custom rendering
- **Sorting**: `enableSorting: false` - Disable sorting for specific columns
- **Header**: `header: "Column Name"` or custom JSX

#### Table State Management
- **Sorting State**: `SortingState` - Current sort field and direction
- **Pagination State**: `PaginationState` - Current page and page size
- **Column Filters**: `ColumnFiltersState` - Column-level filters

### Table with Loading State

```tsx
<tbody>
  {loading ? (
    <tr>
      <td className="px-6 py-10" colSpan={visibleColumnCount}>
        <DTLoading message="Loading..." />
      </td>
    </tr>
  ) : table.getRowModel().rows.length === 0 ? (
    <tr>
      <td className="px-6 py-12 text-center text-gray-500" colSpan={visibleColumnCount}>
        No data found
      </td>
    </tr>
  ) : (
    table.getRowModel().rows.map((row) => (
      <tr key={row.id}>
        {row.getVisibleCells().map((cell) => (
          <td key={cell.id}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </td>
        ))}
      </tr>
    ))
  )}
</tbody>
```

### Table Actions

**Location**: `apps/admin/components/ui/table/actions/`

Use predefined action components:
- `EditAction` - Edit button
- `DeleteAction` - Delete button
- `ViewAction` - View button
- `ToggleAction` - Status toggle
- `DuplicateAction` - Duplicate button

```tsx
import { EditAction, DeleteAction, ToggleAction } from "@/components/ui/table/actions"

<TableCell>
  <div className="flex items-center gap-2">
    <EditAction onClick={() => handleEdit(item)} />
    <ToggleAction 
      checked={item.status}
      onChange={() => handleToggleStatus(item)}
    />
    <DeleteAction onClick={() => handleDelete(item)} />
  </div>
</TableCell>
```

---

## ⏳ Loading States

### Global Loading (Toast)

For async operations that don't block the UI:

```tsx
import { useLoading } from "@/context/LoadingContext"

const { showLoading, hideLoading } = useLoading()

const handleSave = async () => {
  try {
    showLoading("Saving user...")
    await saveUser(data)
    showSuccess("User saved successfully")
  } finally {
    hideLoading()
  }
}
```

### Page Loading (Overlay)

For initial page loads:

```tsx
import { PageLoading } from "@/components/ui/loading"

{loading ? (
  <PageLoading isVisible message="Loading user data..." />
) : (
  <UserForm user={user} />
)}
```

### Table Loading (Inline)

For table data loading:

```tsx
import { DTLoading } from "@/components/ui/loading"

<TableBody>
  {loading ? (
    <DTLoading colSpan={columns.length} />
  ) : (
    // Table rows
  )}
</TableBody>
```

---

## ✅ Best Practices

### Component Organization

```
app/admin/[feature]/
├── components/
│   ├── [Feature]Table.tsx
│   ├── [Feature]Form.tsx
│   ├── [Feature]Toolbar.tsx
│   └── [Feature]TableColumns.tsx
├── api.ts
├── types.ts
└── page.tsx
```

### Accessibility

- ✅ Use semantic HTML (`<button>`, `<form>`, `<table>`)
- ✅ Include `aria-label` for icon-only buttons
- ✅ Ensure keyboard navigation works
- ✅ Use proper heading hierarchy (h1 → h2 → h3)
- ✅ Provide alt text for images

### Responsive Design

- ✅ Use Tailwind responsive prefixes: `sm:`, `md:`, `lg:`, `xl:`
- ✅ Mobile-first approach
- ✅ Test on different screen sizes
- ✅ Use `flex-col sm:flex-row` for responsive layouts

### Dark Mode

- ✅ Always include dark mode classes
- ✅ Use `dark:` prefix for dark mode styles
- ✅ Test both light and dark modes
- ✅ Use theme-aware colors (gray-50, gray-800, etc.)

### Performance

- ✅ Use `useMemo` for expensive computations
- ✅ Use `useCallback` for event handlers passed to children
- ✅ Lazy load heavy components
- ✅ Optimize images and assets

### Error Handling

```tsx
// ✅ Good - Show user-friendly errors
try {
  await saveData()
  showSuccess("Saved successfully")
} catch (error) {
  showError({
    message: error.message || "Failed to save. Please try again."
  })
}

// ❌ Bad - Don't expose technical errors
catch (error) {
  alert(error.stack) // Never do this
}
```

### Code Examples

#### Complete Form Example

```tsx
"use client"

import { useState } from "react"
import { FormLayout } from "@/components/form/FormLayout"
import TextInput from "@/components/form/inputs/TextInput"
import Button from "@/components/ui/button/Button"
import { useLoading } from "@/context/LoadingContext"
import { useNotification } from "@/hooks/useNotification"

export function ProjectForm({ initialData }) {
  const { showLoading, hideLoading } = useLoading()
  const { showSuccess, showError } = useNotification()
  const [formData, setFormData] = useState(initialData || { name: "" })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    showLoading("Saving project...")
    
    try {
      // Validation
      if (!formData.name.trim()) {
        setErrors({ name: "Name is required" })
        return
      }
      
      await saveProject(formData)
      showSuccess("Project saved successfully")
    } catch (error) {
      showError({ message: "Failed to save project" })
    } finally {
      setIsSubmitting(false)
      hideLoading()
    }
  }

  return (
    <FormLayout
      title="Create Project"
      description="Register a new project for issue collection"
      actions={
        <>
          <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Project"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <TextInput
          label="Project Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          error={errors.name}
          required
        />
      </div>
    </FormLayout>
  )
}
```

### Table Structure Pattern

Tables follow a consistent pattern with three main components:

1. **Table Toolbar** (`[Feature]Toolbar.tsx`) - Search, filters, bulk actions
2. **Table Component** (`[Feature]Table.tsx`) - Main table with TanStack React Table
3. **Table Columns** (`[Feature]TableColumns.tsx`) - Column definitions

### Complete Table Implementation Example

#### Step 1: Create Table Toolbar (`ProjectToolbar.tsx`)

```tsx
"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import Button from "@/components/ui/button/Button"
import { SearchField } from "@/components/ui/table"
import ReactSelect, { type SelectOption } from "@/components/form/inputs/ReactSelect"

interface ProjectToolbarProps {
  searchQuery: string
  statusFilter: boolean | null
  selectedCount: number
  onSearch: (value: string) => void
  onStatusFilterChange: (status: boolean | null) => void
  onAdd: () => void
  onBulkDelete?: () => void
}

export function ProjectToolbar({
  searchQuery,
  statusFilter,
  selectedCount,
  onSearch,
  onStatusFilterChange,
  onAdd,
  onBulkDelete,
}: ProjectToolbarProps) {
  const { t } = useTranslation()
  const [showFilters, setShowFilters] = useState(false)

  const statusOptions: SelectOption[] = [
    { value: "true", label: t("common.table.status.active") },
    { value: "false", label: t("common.table.status.inactive") },
  ]

  const handleStatusSelect = (value: string | number | string[] | number[] | null) => {
    if (value === null || value === "") {
      onStatusFilterChange(null)
      return
    }
    onStatusFilterChange(value === "true")
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Projects
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your projects
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selectedCount > 0 && onBulkDelete && (
            <Button
              variant="outline"
              onClick={onBulkDelete}
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
            >
              Delete Selected ({selectedCount})
            </Button>
          )}
          <Button onClick={onAdd} className="flex items-center gap-2">
            <span>+</span>
            <span>Add Project</span>
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-4">
          <SearchField
            value={searchQuery}
            onChange={onSearch}
            placeholder="Search projects..."
          />
          <Button variant="outline" onClick={() => setShowFilters((prev) => !prev)}>
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>
        </div>

        {/* Collapsible Filter Section */}
        {showFilters && (
          <div className="grid grid-cols-1 gap-4 border-t border-gray-200 pt-4 dark:border-gray-700 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Status
              </label>
              <ReactSelect
                options={statusOptions}
                value={statusFilter === null ? undefined : statusFilter ? "true" : "false"}
                onChange={handleStatusSelect}
                isClearable
                placeholder="All Statuses"
              />
            </div>
            {/* Add more filters as needed */}
          </div>
        )}
      </div>
    </div>
  )
}
```

#### Step 2: Create Table Columns (`ProjectTableColumns.tsx`)

```tsx
"use client"

import { useMemo } from "react"
import { ColumnDef } from "@tanstack/react-table"
import Badge from "@/components/ui/badge/Badge"
import { EditAction, DeleteAction } from "@/components/ui/table/actions"
import { StatusToggleButton } from "@/components/ui/table/StatusToggleButton"

import type { Project } from "../types"

export function useProjectTableColumns({
  onEdit,
  onDelete,
  onToggleStatus,
}: {
  onEdit: (project: Project) => void
  onDelete: (project: Project) => void
  onToggleStatus: (project: Project) => void
}): ColumnDef<Project>[] {
  return useMemo<ColumnDef<Project>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: "Project Name",
        cell: ({ row }) => (
          <span className="font-medium text-gray-900 dark:text-white">
            {row.original.name}
          </span>
        ),
      },
      {
        id: "status",
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <StatusToggleButton
            isActive={row.original.status}
            onToggle={() => onToggleStatus(row.original)}
            activeLabel="Active"
            inactiveLabel="Inactive"
          />
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <EditAction onClick={() => onEdit(row.original)} />
            <DeleteAction onClick={() => onDelete(row.original)} />
          </div>
        ),
        enableSorting: false,
      },
    ],
    [onEdit, onDelete, onToggleStatus]
  )
}
```

#### Step 3: Create Table Component (`ProjectTable.tsx`)

```tsx
"use client"

import {
  ColumnFiltersState,
  PaginationState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import Button from "@/components/ui/button/Button"
import { DTLoading } from "@/components/ui/loading"
import ReactSelect, { type SelectOption } from "@/components/form/inputs/ReactSelect"

import type { Project } from "../types"
import { useProjectTableColumns } from "./ProjectTableColumns"

interface ProjectTableProps {
  data: Project[]
  loading: boolean
  totalItems: number
  totalPages: number
  currentPage: number
  itemsPerPage: number
  sortField: string
  sortOrder: "asc" | "desc"
  onSort: (field: string, order: "asc" | "desc") => void
  onPageChange: (page: number) => void
  onItemsPerPageChange: (size: number) => void
  onEdit: (project: Project) => void
  onDelete: (project: Project) => void
  onToggleStatus: (project: Project) => void
}

export function ProjectTable({
  data,
  loading,
  totalItems,
  totalPages,
  currentPage,
  itemsPerPage,
  sortField,
  sortOrder,
  onSort,
  onPageChange,
  onItemsPerPageChange,
  onEdit,
  onDelete,
  onToggleStatus,
}: ProjectTableProps) {
  const { t } = useTranslation()
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  // Convert server-side sort state to TanStack format
  const sortingState = useMemo<SortingState>(
    () => (sortField ? [{ id: sortField, desc: sortOrder === "desc" }] : []),
    [sortField, sortOrder]
  )

  // Convert server-side pagination state to TanStack format
  const paginationState = useMemo<PaginationState>(
    () => ({ pageIndex: Math.max(currentPage - 1, 0), pageSize: itemsPerPage }),
    [currentPage, itemsPerPage]
  )

  const columns = useProjectTableColumns({
    onEdit,
    onDelete,
    onToggleStatus,
  })

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting: sortingState,
      pagination: paginationState,
      columnFilters,
    },
    enableSortingRemoval: false,
    manualSorting: true, // Server-side sorting
    manualPagination: true, // Server-side pagination
    pageCount: totalPages,
    onSortingChange: (updater) => {
      const newSorting = typeof updater === "function" ? updater(sortingState) : updater
      if (newSorting.length > 0) {
        const nextSort = newSorting[0]
        onSort(nextSort.id, nextSort.desc ? "desc" : "asc")
      }
    },
    onPaginationChange: (updater) => {
      const newPagination = typeof updater === "function" ? updater(paginationState) : updater
      if (newPagination.pageIndex !== paginationState.pageIndex) {
        onPageChange(newPagination.pageIndex + 1)
      }
      if (newPagination.pageSize !== paginationState.pageSize) {
        onItemsPerPageChange(newPagination.pageSize)
      }
    },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: false,
  })

  const visibleColumnCount = Math.max(table.getVisibleLeafColumns().length, 1)
  const perPageOptions = useMemo<SelectOption[]>(
    () => [10, 20, 50].map((size) => ({ value: size, label: `${size} per page` })),
    []
  )

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      {/* Table Header */}
      <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Projects</h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Total: {totalItems}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 ${
                      header.column.getCanSort()
                        ? "cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <span>
                          {{ asc: "↑", desc: "↓" }[header.column.getIsSorted() as string] ?? "↕"}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
            {loading ? (
              <tr>
                <td className="px-6 py-10" colSpan={visibleColumnCount}>
                  <DTLoading
                    message="Loading projects..."
                    className="mx-auto w-full max-w-sm min-h-0 border-none p-0 shadow-none"
                  />
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
                  colSpan={visibleColumnCount}
                >
                  No projects found
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="whitespace-nowrap px-6 py-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700 md:flex-row md:items-center md:justify-between">
        <span className="text-sm text-gray-600 dark:text-gray-300">
          Showing {totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to{" "}
          {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} results
        </span>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
            disabled={currentPage <= 1}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage >= totalPages}
          >
            Next
          </Button>
          <ReactSelect
            className="ml-3 min-w-[140px]"
            options={perPageOptions}
            value={itemsPerPage}
            onChange={(value) => {
              const nextValue = typeof value === "number" ? value : parseInt(String(value ?? ""), 10)
              if (!Number.isNaN(nextValue)) {
                onItemsPerPageChange(nextValue)
              }
            }}
            isClearable={false}
            isSearchable={false}
          />
        </div>
      </div>
    </div>
  )
}
```

#### Step 4: Use in Page Component (`page.tsx`)

```tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { TablePageLayout, TableToolbar } from "@/components/tables/TablePageLayout"
import { ProjectTable, ProjectToolbar } from "./components"
import { projectApiService } from "./api"

export default function ProjectPage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<boolean | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [sortField, setSortField] = useState("updatedAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  const loadProjects = useCallback(async () => {
    setLoading(true)
    try {
      const response = await projectApiService.getProjects({
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery || undefined,
        status: statusFilter,
        sortBy: sortField,
        sortOrder,
      })
      setProjects(response.data.data)
      setTotalItems(response.data.pagination.total)
      setTotalPages(response.data.pagination.totalPages)
    } catch (error) {
      console.error("Failed to load projects", error)
    } finally {
      setLoading(false)
    }
  }, [currentPage, itemsPerPage, searchQuery, statusFilter, sortField, sortOrder])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter])

  const handleSort = (field: string, order: "asc" | "desc") => {
    setSortField(field)
    setSortOrder(order)
    setCurrentPage(1)
  }

  return (
    <TablePageLayout>
      <TableToolbar>
        <ProjectToolbar
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          onSearch={setSearchQuery}
          onStatusFilterChange={setStatusFilter}
          onAdd={() => {/* Navigate to form */}}
        />
      </TableToolbar>
      <ProjectTable
        data={projects}
        loading={loading}
        totalItems={totalItems}
        totalPages={totalPages}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={handleSort}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(size) => {
          setItemsPerPage(size)
          setCurrentPage(1)
        }}
        onEdit={(project) => {/* Navigate to edit */}}
        onDelete={(project) => {/* Handle delete */}}
        onToggleStatus={(project) => {/* Handle toggle */}}
      />
    </TablePageLayout>
  )
}
```

### Filter Implementation

#### Search Field Component

Use `SearchField` from `@/components/ui/table`:

```tsx
import { SearchField } from "@/components/ui/table"

<SearchField
  value={searchQuery}
  onChange={setSearchQuery}
  placeholder="Search projects..."
/>
```

#### Filter Dropdowns

Use `ReactSelect` from `@/components/form/inputs/ReactSelect`:

```tsx
import ReactSelect, { type SelectOption } from "@/components/form/inputs/ReactSelect"

const statusOptions: SelectOption[] = [
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
]

<ReactSelect
  options={statusOptions}
  value={statusFilter === null ? undefined : statusFilter ? "true" : "false"}
  onChange={(value) => {
    if (value === null || value === "") {
      setStatusFilter(null)
    } else {
      setStatusFilter(value === "true")
    }
  }}
  isClearable
  placeholder="All Statuses"
/>
```

#### Collapsible Filters Pattern

```tsx
const [showFilters, setShowFilters] = useState(false)

<Button variant="outline" onClick={() => setShowFilters((prev) => !prev)}>
  {showFilters ? "Hide Filters" : "Show Filters"}
</Button>

{showFilters && (
  <div className="grid grid-cols-1 gap-4 border-t border-gray-200 pt-4 dark:border-gray-700 md:grid-cols-2 lg:grid-cols-3">
    {/* Filter fields */}
  </div>
)}
```

### Table Guidelines

#### ✅ DO:
- Use TanStack React Table (`@tanstack/react-table`) for all data tables
- Separate column definitions into `[Feature]TableColumns.tsx` files
- Use `useMemo` for column definitions to prevent unnecessary re-renders
- Implement server-side sorting and pagination (`manualSorting: true`, `manualPagination: true`)
- Use `flexRender` for rendering cells and headers
- Include loading states with `DTLoading`
- Show empty states when no data
- Use consistent TailAdmin styling classes
- Implement filters in toolbar with collapsible sections
- Reset to page 1 when filters change
- Use `TablePageLayout` and `TableToolbar` components

#### ❌ DON'T:
- Don't use jQuery DataTables or other table libraries
- Don't use client-side pagination for large datasets
- Don't forget to handle loading and empty states
- Don't create columns without memoization (causes performance issues)
- Don't forget to reset pagination when filters change
- Don't use inline styles - use TailAdmin design tokens

---

## 📚 Reference Components

### Available UI Components

- **Button**: `@/components/ui/button/Button`
- **Badge**: `@/components/ui/badge/Badge`
- **Alert**: `@/components/ui/alert/Alert`
- **Table**: Uses `@tanstack/react-table` (headless) + custom styling
- **Modal**: `@/components/ui/modal`
- **Dropdown**: `@/components/ui/dropdown`
- **Avatar**: `@/components/ui/avatar`
- **Loading**: `@/components/ui/loading`

### Table Library

- **TanStack React Table**: `@tanstack/react-table@^8.21.3`
  - Headless table library (no default styling)
  - Full control over UI/UX
  - Server-side sorting and pagination support
  - TypeScript-first design
  - See examples: `apps/admin/app/admin/user/components/UserTable.tsx`

### Available Form Components

- **TextInput**: `@/components/form/inputs/TextInput`
- **TextareaInput**: `@/components/form/inputs/TextareaInput`
- **SelectInput**: `@/components/form/inputs/SelectInput`
- **ReactSelect**: `@/components/form/inputs/ReactSelect`
- **ToggleSwitch**: `@/components/form/inputs/ToggleSwitch`
- **CheckboxInput**: `@/components/form/inputs/CheckboxInput`
- **FileUpload**: `@/components/form/upload/FileUpload`
- **TextEditor**: `@/components/form/inputs/TextEditor`

---

## 🎯 Quick Checklist

When creating a new admin page:

- [ ] Use `FormLayout` for forms
- [ ] Use `TablePageLayout` for table pages
- [ ] Include loading states (GlobalLoading, DTLoading, PageLoading)
- [ ] Show error messages using `useNotification`
- [ ] Use semantic colors (success, error, warning)
- [ ] Include dark mode support
- [ ] Make it responsive (mobile-first)
- [ ] Add proper TypeScript types
- [ ] Include i18n translations
- [ ] Test keyboard navigation
- [ ] Verify accessibility (ARIA labels, semantic HTML)

---

## 📖 Additional Resources

- **Component Library**: `apps/admin/components/ui/`
- **Form Components**: `apps/admin/components/form/`
- **Example Pages**: `apps/admin/app/admin/user/` (User management)
- **Design Tokens**: `apps/admin/public/styles/globals.css`
- **Tailwind Config**: `apps/admin/tailwind.config.js`

---

**Last Updated**: January 2025  
**Version**: 1.0.0

