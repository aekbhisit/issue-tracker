"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface LoadingState {
  isVisible: boolean;
  message: string;
}

interface LoadingContextType {
  loadingState: LoadingState;
  showLoading: (message?: string) => void;
  hideLoading: () => void;
  setMessage: (message: string) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

interface LoadingProviderProps {
  children: ReactNode;
}

export function LoadingProvider({ children }: LoadingProviderProps) {
  const [loadingState, setLoadingState] = useState<LoadingState>({
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

  return (
    <LoadingContext.Provider value={{
      loadingState,
      showLoading,
      hideLoading,
      setMessage
    }}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}
