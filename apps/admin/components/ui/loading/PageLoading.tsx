"use client";

import React from "react";
import OverlayLoading from "./OverlayLoading";

interface PageLoadingProps {
  isVisible: boolean;
  message?: string;
}

export default function PageLoading({ 
  isVisible, 
  message = "Loading page..." 
}: PageLoadingProps) {
  return (
    <OverlayLoading
      isVisible={isVisible}
      message={message}
      size="lg"
      className="bg-white/80 dark:bg-gray-900/80"
    />
  );
}
