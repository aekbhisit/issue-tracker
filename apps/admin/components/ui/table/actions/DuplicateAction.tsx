"use client";

import React from "react";

interface DuplicateActionProps {
  onClick: () => void;
  title?: string;
  className?: string;
}

export default function DuplicateAction({ 
  onClick, 
  title = "Duplicate", 
  className = "" 
}: DuplicateActionProps) {
  return (
    <button
      onClick={onClick}
      className={`p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-md transition-colors ${className}`}
      title={title}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    </button>
  );
}
