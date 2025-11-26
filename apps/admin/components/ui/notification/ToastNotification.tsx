"use client";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";

interface ToastNotificationProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({
  id,
  type,
  title,
  message,
  duration = 3000,
  onClose,
}) => {
  const { t } = useTranslation();

  useEffect(() => {
    if (!onClose || typeof onClose !== 'function') {
      console.warn('ToastNotification: onClose is not a function', { onClose, id });
      return;
    }
    
    const timer = setTimeout(() => {
      if (onClose && typeof onClose === 'function') {
        onClose(id);
      }
    }, duration);

    return () => {
      clearTimeout(timer);
    };
  }, [id, duration, onClose]);

  const getVariantConfig = (type: string) => {
    switch (type) {
      case 'success':
        return {
          bgColor: "bg-success-500/10 dark:bg-success-500/20",
          borderColor: "border-success-500/30 dark:border-success-500/40",
          iconColor: "text-success-600 dark:text-success-400",
          icon: (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ),
        };
      case 'error':
        return {
          bgColor: "bg-error-500/10 dark:bg-error-500/20",
          borderColor: "border-error-500/30 dark:border-error-500/40",
          iconColor: "text-error-600 dark:text-error-400",
          icon: (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          ),
        };
      case 'warning':
        return {
          bgColor: "bg-warning-500/10 dark:bg-warning-500/20",
          borderColor: "border-warning-500/30 dark:border-warning-500/40",
          iconColor: "text-warning-600 dark:text-warning-400",
          icon: (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ),
        };
      case 'info':
        return {
          bgColor: "bg-blue-light-500/10 dark:bg-blue-light-500/20",
          borderColor: "border-blue-light-500/30 dark:border-blue-light-500/40",
          iconColor: "text-blue-light-600 dark:text-blue-light-400",
          icon: (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          ),
        };
      default:
        return {
          bgColor: "bg-gray-500/10 dark:bg-gray-500/20",
          borderColor: "border-gray-500/30 dark:border-gray-500/40",
          iconColor: "text-gray-600 dark:text-gray-400",
          icon: null,
        };
    }
  };

  const config = getVariantConfig(type);

  return (
    <div
      className={`max-w-xs w-full ${config.bgColor} ${config.borderColor} border backdrop-blur-md bg-white/50 dark:bg-gray-900/50 rounded-lg shadow-lg pointer-events-auto ring-1 ring-black/5 dark:ring-white/10 overflow-hidden transition-all duration-300 ease-in-out`}
    >
      <div className="p-2.5">
        <div className="flex items-center gap-2">
          <div className={`flex-shrink-0 ${config.iconColor}`}>
            {config.icon}
          </div>
          <div className="flex-1 min-w-0">
            {title && (
              <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                {title}
              </p>
            )}
            <p className={`text-xs ${title ? 'text-gray-600 dark:text-gray-300 mt-0.5' : 'text-gray-900 dark:text-white'} truncate`}>
              {message}
            </p>
          </div>
          <div className="flex-shrink-0">
            <button
              className={`text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 focus:outline-none p-0.5 rounded transition-colors`}
              onClick={() => {
                if (onClose && typeof onClose === 'function') {
                  onClose(id);
                }
              }}
            >
              <span className="sr-only">Close</span>
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToastNotification;
