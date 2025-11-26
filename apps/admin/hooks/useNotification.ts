"use client";
import { useState, useCallback } from "react";

export interface NotificationOptions {
  title?: string;
  message: string;
  duration?: number;
}

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
}

export interface ConfirmState {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

export const useNotification = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    message: '',
  });

  const generateId = useCallback(() => {
    return Math.random().toString(36).substr(2, 9);
  }, []);

  const showSuccess = useCallback((options: NotificationOptions) => {
    const id = generateId();
    const toast: Toast = {
      id,
      type: 'success',
      title: options.title,
      message: options.message,
      duration: options.duration || 3000,
    };
    setToasts(prev => [...prev, toast]);
  }, [generateId]);

  const showError = useCallback((options: NotificationOptions) => {
    const id = generateId();
    const toast: Toast = {
      id,
      type: 'error',
      title: options.title,
      message: options.message,
      duration: options.duration || 3000,
    };
    setToasts(prev => [...prev, toast]);
  }, [generateId]);

  const showWarning = useCallback((options: NotificationOptions) => {
    const id = generateId();
    const toast: Toast = {
      id,
      type: 'warning',
      title: options.title,
      message: options.message,
      duration: options.duration || 3000,
    };
    setToasts(prev => [...prev, toast]);
  }, [generateId]);

  const showInfo = useCallback((options: NotificationOptions) => {
    const id = generateId();
    const toast: Toast = {
      id,
      type: 'info',
      title: options.title,
      message: options.message,
      duration: options.duration || 3000,
    };
    setToasts(prev => [...prev, toast]);
  }, [generateId]);

  const showConfirm = useCallback((options: ConfirmOptions) => {
    setConfirmState({
      isOpen: true,
      title: options.title || 'Confirm',
      message: options.message,
      confirmText: options.confirmText || 'Confirm',
      cancelText: options.cancelText || 'Cancel',
      onConfirm: options.onConfirm,
      onCancel: options.onCancel,
    });
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmState(prev => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  const handleConfirm = useCallback(async () => {
    if (confirmState.onConfirm) {
      try {
        await confirmState.onConfirm();
      } catch (error) {
        console.error('Error in confirm callback:', error);
      }
    }
    closeConfirm();
  }, [confirmState.onConfirm, closeConfirm]);

  const handleCancel = useCallback(() => {
    if (confirmState.onCancel) {
      confirmState.onCancel();
    }
    closeConfirm();
  }, [confirmState.onCancel, closeConfirm]);

  return {
    toasts,
    confirmState,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
    removeToast,
    handleConfirm,
    handleCancel,
  };
};
