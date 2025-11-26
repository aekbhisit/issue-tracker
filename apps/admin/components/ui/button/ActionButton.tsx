"use client";

import React, { ReactNode } from "react";
import Button from "./Button";

type ActionType = "add" | "edit" | "delete" | "view" | "activate" | "deactivate" | "export" | "import" | "refresh" | "save" | "cancel";

interface ActionButtonProps {
  action: ActionType;
  children?: ReactNode; // Button text (optional for icon-only)
  iconOnly?: boolean; // Show only icon (for table rows)
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
  size?: "sm" | "md";
  title?: string; // Tooltip for icon-only buttons
}

// Icon components (using Heroicons paths)
const icons: Record<ActionType, ReactNode> = {
  add: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  edit: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  delete: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  view: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  activate: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  deactivate: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
  ),
  export: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
  import: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  ),
  refresh: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  save: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  cancel: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
};

// Action to color mapping
const actionColors: Record<ActionType, "default" | "success" | "danger" | "warning" | "info"> = {
  add: "default",
  edit: "success",
  delete: "danger",
  view: "info",
  activate: "success",
  deactivate: "warning",
  export: "info",
  import: "info",
  refresh: "default",
  save: "default",
  cancel: "default",
};

// Action to variant mapping
const actionVariants: Record<ActionType, "primary" | "outline"> = {
  add: "primary",
  edit: "outline",
  delete: "outline",
  view: "outline",
  activate: "outline",
  deactivate: "outline",
  export: "outline",
  import: "outline",
  refresh: "outline",
  save: "primary",
  cancel: "outline",
};

// Default labels for actions
const defaultLabels: Record<ActionType, string> = {
  add: "Add",
  edit: "Edit",
  delete: "Delete",
  view: "View",
  activate: "Activate",
  deactivate: "Deactivate",
  export: "Export",
  import: "Import",
  refresh: "Refresh",
  save: "Save",
  cancel: "Cancel",
};

const ActionButton: React.FC<ActionButtonProps> = ({
  action,
  children,
  iconOnly = false,
  onClick,
  disabled = false,
  className = "",
  type = "button",
  size,
  title,
}) => {
  const color = actionColors[action];
  const variant = actionVariants[action];
  const icon = icons[action];
  const label = children || defaultLabels[action];
  const tooltip = title || (iconOnly ? defaultLabels[action] : undefined);

  // Icon-only button (for table rows)
  if (iconOnly) {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        title={tooltip}
        className={`p-2 rounded-md transition-colors ${className} ${
          disabled ? "cursor-not-allowed opacity-50" : ""
        } ${
          color === "success"
            ? "text-green-600 hover:text-green-800 hover:bg-green-50 dark:hover:bg-green-900/20"
            : color === "danger"
            ? "text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
            : color === "warning"
            ? "text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
            : color === "info"
            ? "text-blue-light-600 hover:text-blue-light-800 hover:bg-blue-light-50 dark:hover:bg-blue-light-900/20"
            : "text-gray-600 hover:text-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/20"
        }`}
      >
        {icon}
      </button>
    );
  }

  // Icon + Text button (for toolbars/forms)
  return (
    <Button
      variant={variant}
      color={color}
      startIcon={icon}
      onClick={onClick}
      disabled={disabled}
      className={className}
      type={type}
      size={size}
    >
      {label}
    </Button>
  );
};

export default ActionButton;

