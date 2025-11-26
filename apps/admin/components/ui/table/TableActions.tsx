"use client";

import React from "react";

interface TableActionsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggle?: () => void;
  viewTitle?: string;
  editTitle?: string;
  deleteTitle?: string;
  toggleTitle?: string;
  showView?: boolean;
  showEdit?: boolean;
  showDelete?: boolean;
  showToggle?: boolean;
  className?: string;
}

export default function TableActions({
  onView,
  onEdit,
  onDelete,
  onToggle,
  viewTitle = "View",
  editTitle = "Edit",
  deleteTitle = "Delete",
  toggleTitle = "Toggle",
  showView = true,
  showEdit = true,
  showDelete = true,
  showToggle = false,
  className = ""
}: TableActionsProps) {
  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {showView && onView && (
        <button
          onClick={onView}
          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
          title={viewTitle}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
      )}
      
      {showEdit && onEdit && (
        <button
          onClick={onEdit}
          className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
          title={editTitle}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      )}
      
      {showToggle && onToggle && (
        <button
          onClick={onToggle}
          className="p-2 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-md transition-colors"
          title={toggleTitle}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </button>
      )}
      
      {showDelete && onDelete && (
        <button
          onClick={onDelete}
          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
          title={deleteTitle}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  );
}
