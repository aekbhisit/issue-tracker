"use client";

import React from "react";

interface EditActionProps {
  onClick: () => void;
  title?: string;
  className?: string;
}

export default function EditAction({ 
  onClick, 
  title = "Edit", 
  className = "" 
}: EditActionProps) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-sm font-medium rounded-md border border-blue-200 bg-white text-blue-700 hover:bg-blue-50 hover:text-blue-800 hover:border-blue-300 dark:bg-gray-800 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20 dark:hover:text-blue-300 dark:hover:border-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${className}`}
      title={title}
      type="button"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
      <span className="sr-only">{title}</span>
    </button>
  );
}
