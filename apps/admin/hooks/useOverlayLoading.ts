"use client";

import { useState, useCallback } from 'react';

interface OverlayLoadingState {
  isVisible: boolean;
  message: string;
}

export function useOverlayLoading() {
  const [loadingState, setLoadingState] = useState<OverlayLoadingState>({
    isVisible: false,
    message: 'Loading...'
  });

  const showLoading = useCallback((message?: string) => {
    setLoadingState({
      isVisible: true,
      message: message || 'Loading...'
    });
  }, []);

  const hideLoading = useCallback(() => {
    setLoadingState(prev => ({
      ...prev,
      isVisible: false
    }));
  }, []);

  const setMessage = useCallback((message: string) => {
    setLoadingState(prev => ({
      ...prev,
      message
    }));
  }, []);

  return {
    loadingState,
    showLoading,
    hideLoading,
    setMessage
  };
}
