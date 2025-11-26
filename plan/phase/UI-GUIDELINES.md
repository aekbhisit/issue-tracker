# UI Guidelines & Design System

> **Last Updated**: Based on IC-1 implementation and UI refinements

This document captures the established UI patterns, component guidelines, and design system standards for the Issue Collector Platform admin dashboard.

## Table of Contents

1. [Button Guidelines](#button-guidelines)
2. [Toast Notifications](#toast-notifications)
3. [Form Layout](#form-layout)
4. [Table Guidelines](#table-guidelines)
5. [Status Toggle](#status-toggle)
6. [Color System](#color-system)

---

## Button Guidelines

### Action Buttons in Tables

**Location**: `apps/admin/components/ui/table/actions/`

#### EditAction
- **Color**: Blue (`border-blue-200`, `text-blue-700`)
- **Variant**: Icon button with border and background
- **Styling**: `px-2.5 py-1.5`, `rounded-md`, `border`, `bg-white`
- **Usage**: Edit/update actions in table rows
- **Icon**: Edit/pencil icon (24x24 SVG)

```tsx
<EditAction onClick={() => onEdit(item)} title="Edit" />
```

#### DeleteAction
- **Color**: Red (`border-red-200`, `text-red-700`)
- **Variant**: Icon button with border and background
- **Styling**: Same as EditAction
- **Usage**: Delete/remove actions in table rows
- **Icon**: Trash/delete icon (24x24 SVG)

```tsx
<DeleteAction onClick={() => onDelete(item)} title="Delete" />
```

#### StatusToggleAction
- **Active State**: Green (`border-green-200`, `text-green-700`) with play icon ▶
- **Inactive State**: Gray (`border-gray-200`, `text-gray-600`) with pause icon ⏸
- **Variant**: Icon button with border and background
- **Usage**: Toggle status in Actions column (moved from Status column)
- **Icons**: Play icon for active, Pause icon for inactive

```tsx
<StatusToggleAction 
  isActive={item.status} 
  onClick={() => onToggleStatus(item)} 
  title={item.status ? "Deactivate" : "Activate"}
/>
```

### Form Buttons

#### Primary Actions (Create, Save, Update)
- **Variant**: `variant="primary"`
- **Size**: `size="sm"` for inline forms
- **Color**: Brand blue (`bg-brand-500`)
- **Usage**: Main form submission buttons

```tsx
<Button type="button" variant="primary" size="sm" onClick={handleSubmit}>
  Create Project
</Button>
```

#### Secondary Actions (Cancel, Add Domain, Add Environment)
- **Variant**: `variant="primary"` for add actions
- **Size**: `size="sm"`
- **Usage**: Add items, cancel actions

**Note**: Add actions should use `variant="primary"` not `variant="outline"` to follow UI guidelines.

### Button Placement

- **Form Actions**: Place at bottom of form in sticky footer
- **Table Actions**: Place in Actions column, aligned horizontally
- **Toolbar Actions**: Use primary variant for main actions

---

## Toast Notifications

**Location**: `apps/admin/components/ui/notification/ToastNotification.tsx`

### Design Specifications

- **Size**: Compact (`max-w-xs`, `p-2.5`)
- **Typography**: `text-xs` for all text
- **Glass Morphism**: 
  - Background: `bg-white/50 dark:bg-gray-900/50` (50% opacity)
  - Backdrop blur: `backdrop-blur-md`
  - Border: Color-specific with transparency (`border-success-500/30`)
- **Auto-hide**: 3 seconds default duration
- **Manual close**: Close button in top-right corner

### Color Variants

- **Success**: `bg-success-500/10`, `border-success-500/30`, `text-success-600`
- **Error**: `bg-error-500/10`, `border-error-500/30`, `text-error-600`
- **Warning**: `bg-warning-500/10`, `border-warning-500/30`, `text-warning-600`
- **Info**: `bg-blue-light-500/10`, `border-blue-light-500/30`, `text-blue-light-600`

### Usage

```tsx
// In useNotification hook
showSuccess({ message: "Project created successfully" });
showError({ message: "Failed to create project" });

// ToastContainer automatically displays toasts
<ToastContainer toasts={toasts} onRemoveToast={removeToast} />
```

### Implementation Notes

- **Auto-hide**: Implemented via `useEffect` with `setTimeout`
- **Prop name**: Must use `onRemoveToast` (not `onRemove`) when using `ToastContainer`
- **Safety checks**: Always verify `onClose` is a function before calling

---

## Form Layout

**Location**: `apps/admin/components/form/FormLayout.tsx`

### Header Structure

- **Layout**: Title on left, Breadcrumb on right (single row)
- **Title**: `text-xl font-semibold`, `mb-1`
- **Description**: `text-sm text-gray-500`, below title
- **Breadcrumb**: Right-aligned, uses `Breadcrumb` component

### Breadcrumb Component

**Location**: `apps/admin/components/common/Breadcrumb.tsx`

- **Items**: Array of `{ label: string, href?: string }`
- **Styling**: Gray text with hover states
- **Last item**: Bold, no link
- **Separator**: Chevron icon between items

```tsx
<FormLayout
  title="Create Project"
  description="Register a new project"
  breadcrumbs={[
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Projects", href: "/admin/projects" },
    { label: "Create Project" }
  ]}
>
  {/* Form content */}
</FormLayout>
```

### Form Actions

- **Placement**: Bottom of form in sticky footer
- **Single action button**: Only show at bottom, not in header
- **Styling**: Sticky footer with backdrop blur

### Spacing

- **Reduced padding**: No extra `pt-6` or large margins
- **Compact design**: Match TailAdmin's original spacing
- **Content grid**: Sidebar on right if provided

---

## Table Guidelines

### Column Structure

#### Standard Columns
- **Name**: Project/item name with description below
- **Issues**: Clickable link showing "X pending / Y total" format
- **Allowed Domains**: Count with first domain preview
- **Created**: Date and time
- **Actions**: StatusToggleAction, EditAction, DeleteAction

#### Removed Columns
- **Status**: Moved to Actions column as StatusToggleAction
- **Environments**: Removed from table (shown in detail view)
- **Public Key**: Removed (not needed in list view)

### Actions Column

**Order**: StatusToggleAction → EditAction → DeleteAction

All action buttons:
- Icon-only with borders
- Consistent sizing (`px-2.5 py-1.5`)
- Proper hover states
- Screen reader support (`sr-only` text)

### Issues Column

- **Format**: "X pending / Y total"
- **Pending count**: Orange if > 0, gray if 0
- **Clickable**: Links to `/admin/issues?projectId={id}`
- **Icon**: Chevron appears on hover

```tsx
<Link href={`/admin/issues?projectId=${project.id}`}>
  <span>{pendingCount} pending / {totalCount} total</span>
  <ChevronIcon />
</Link>
```

---

## Status Toggle

### StatusToggleAction Component

**Location**: `apps/admin/components/ui/table/actions/StatusToggleAction.tsx`

- **Active**: Green with play icon ▶
- **Inactive**: Gray with pause icon ⏸
- **Placement**: First button in Actions column
- **Styling**: Same as other action buttons (border, background, hover states)

### Status Column (Display Only)

- **Component**: `Badge` component
- **Variant**: `variant="light"`
- **Colors**: `color="success"` for active, `color="light"` for inactive
- **Usage**: Display-only status indicator (not interactive)

---

## Color System

### Action Colors

- **Edit**: Blue (`blue-200`, `blue-700`)
- **Delete**: Red (`red-200`, `red-700`)
- **Status Active**: Green (`green-200`, `green-700`)
- **Status Inactive**: Gray (`gray-200`, `gray-600`)
- **Success**: Green (`success-500`, `success-600`)
- **Error**: Red (`error-500`, `error-600`)
- **Warning**: Yellow/Orange (`warning-500`, `warning-600`)
- **Info**: Blue (`blue-light-500`, `blue-light-600`)

### Background Colors

- **Light mode**: `bg-white` with opacity overlays
- **Dark mode**: `dark:bg-gray-800` or `dark:bg-gray-900`
- **Glass effect**: `bg-white/50 dark:bg-gray-900/50` with `backdrop-blur-md`

### Text Colors

- **Primary**: `text-gray-900 dark:text-white`
- **Secondary**: `text-gray-600 dark:text-gray-300`
- **Muted**: `text-gray-500 dark:text-gray-400`

---

## Component Import Paths

```tsx
// Buttons
import Button from "@/components/ui/button/Button";
import { EditAction, DeleteAction, StatusToggleAction } from "@/components/ui/table/actions";

// Forms
import { FormLayout } from "@/components/form/FormLayout";
import { Breadcrumb, BreadcrumbItem } from "@/components/common/Breadcrumb";
import TextInput from "@/components/form/inputs/TextInput";
import TextareaInput from "@/components/form/inputs/TextareaInput";
import ReactSelect from "@/components/form/inputs/ReactSelect";
import ToggleSwitch from "@/components/form/inputs/ToggleSwitch";

// Notifications
import { useNotification } from "@/hooks/useNotification";
import ToastContainer from "@/components/ui/notification/ToastContainer";

// Badges
import Badge from "@/components/ui/badge/Badge";
```

---

## Best Practices

1. **Consistency**: Always use established components, don't create custom variants
2. **Accessibility**: Include `sr-only` text for icon-only buttons
3. **Auto-hide**: Toast notifications auto-hide after 3 seconds
4. **Breadcrumbs**: Use breadcrumbs instead of sticky headers for navigation
5. **Compact design**: Keep spacing minimal, match TailAdmin's original design
6. **Color coding**: Follow established color system (blue for edit, red for delete, green for active)
7. **Button placement**: Form actions at bottom, table actions in Actions column
8. **Status display**: Use StatusToggleAction in Actions column, Badge in Status column

---

## Migration Notes

### From Previous Versions

- **EditAction**: Changed from green to blue
- **Status column**: StatusToggleAction moved to Actions column
- **Toast notifications**: Updated to glass morphism design with 50% opacity
- **Form headers**: Changed from sticky headers to breadcrumb navigation
- **Button colors**: Standardized to blue for edit, red for delete

---

## References

- TailAdmin Design System: `apps/admin/public/`
- Component Library: `apps/admin/components/`
- UI Guidelines: `docs/development/admin-ui-guidelines.md` (if exists)

