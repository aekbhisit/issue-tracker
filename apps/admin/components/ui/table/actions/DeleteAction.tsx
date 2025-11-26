"use client";

import React from "react";

interface DeleteActionProps {
  onClick: () => void;
  title?: string;
  className?: string;
}

export default function DeleteAction({ 
  onClick, 
  title = "Delete", 
  className = "" 
}: DeleteActionProps) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-sm font-medium rounded-md border border-red-200 bg-white text-red-700 hover:bg-red-50 hover:text-red-800 hover:border-red-300 dark:bg-gray-800 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300 dark:hover:border-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 ${className}`}
      title={title}
      type="button"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
      <span className="sr-only">{title}</span>
    </button>
  );
}
