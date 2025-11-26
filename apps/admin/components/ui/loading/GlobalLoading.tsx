"use client";

import React from "react";
import { useLoading } from "@/context/LoadingContext";

export default function GlobalLoading() {
  const { loadingState } = useLoading();

  if (!loadingState.isVisible) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm transition-opacity dark:bg-gray-950/50"
      role="status"
      aria-live="polite"
      aria-label={loadingState.message}
    >
      <div className="flex items-center gap-3 rounded-2xl bg-gray-900/85 px-5 py-4 text-sm font-medium text-white shadow-2xl dark:bg-gray-800/90">
        <svg
          className="h-5 w-5 flex-none animate-spin text-white"
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
        <span className="truncate" title={loadingState.message}>
          {loadingState.message}
        </span>
      </div>
    </div>
  );
}
