"use client";

import React from "react";

interface StatusToggleActionProps {
  isActive: boolean;
  onClick: () => void;
  title?: string;
  className?: string;
}

export default function StatusToggleAction({ 
  isActive,
  onClick, 
  title, 
  className = "" 
}: StatusToggleActionProps) {
  const activeTitle = title || (isActive ? "Deactivate" : "Activate");
  
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-sm font-medium rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${
        isActive
          ? "border-green-200 bg-white text-green-700 hover:bg-green-50 hover:text-green-800 hover:border-green-300 dark:bg-gray-800 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/20 dark:hover:text-green-300 dark:hover:border-green-600 focus:ring-green-500"
          : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-900/20 dark:hover:text-gray-300 dark:hover:border-gray-600 focus:ring-gray-500"
      } ${className}`}
      title={activeTitle}
      type="button"
    >
      {isActive ? (
        // Play icon for active (green)
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5l14 7-14 7V5z" />
        </svg>
      ) : (
        // Pause icon for inactive (gray) - clearer than stop icon
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      <span className="sr-only">{activeTitle}</span>
    </button>
  );
}

