"use client";

import React from "react";

interface DTLoadingProps {
  message?: string;
  className?: string;
}

export default function DTLoading({
  message = "Loading...",
  className = "",
}: DTLoadingProps) {
  return (
    <div
      className={`flex min-h-[12rem] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-gray-200 bg-white/90 p-10 text-center text-sm text-gray-500 shadow-sm dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-300 ${className}`}
      role="status"
      aria-live="polite"
    >
      <svg
        className="h-8 w-8 animate-spin text-primary"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="font-medium text-gray-600 dark:text-gray-200">{message}</span>
    </div>
  );
}

