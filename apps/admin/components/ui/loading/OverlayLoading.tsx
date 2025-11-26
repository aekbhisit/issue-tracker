"use client";

import React from "react";

interface OverlayLoadingProps {
  isVisible: boolean;
  message?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

function OverlayLoading({
  isVisible,
  message = "Loading...",
  size = "md",
  className = ""
}: OverlayLoadingProps) {
  if (!isVisible) return null;

  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8", 
    lg: "w-12 h-12"
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm ${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col items-center space-y-4 min-w-[200px]">
        {/* Spinner */}
        <div className={`animate-spin rounded-full border-4 border-gray-200 border-t-brand-500 ${sizeClasses[size]}`}></div>
        
        {/* Message */}
        <div className="text-center">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}

export default OverlayLoading;
