"use client";

import React from "react";

interface ToggleActionProps {
  onClick: () => void;
  title?: string;
  className?: string;
}

export default function ToggleAction({ 
  onClick, 
  title = "Toggle", 
  className = "" 
}: ToggleActionProps) {
  return (
    <button
      onClick={onClick}
      className={`p-2 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-md transition-colors ${className}`}
      title={title}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    </button>
  );
}
