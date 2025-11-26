"use client";

import React from "react";
import { useTranslation } from "react-i18next";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onLabel?: string;
  offLabel?: string;
  name?: string;
  id?: string;
}

export default function ToggleSwitch({
  checked,
  onChange,
  label,
  disabled = false,
  size = 'md',
  className = "",
  onLabel = "เปิด",
  offLabel = "ปิด",
  name,
  id
}: ToggleSwitchProps) {
  const { t } = useTranslation();

  const sizeClasses = {
    sm: {
      switch: 'w-8 h-4',
      thumb: 'w-3 h-3',
      translate: 'translate-x-4'
    },
    md: {
      switch: 'w-11 h-6',
      thumb: 'w-5 h-5',
      translate: 'translate-x-5'
    },
    lg: {
      switch: 'w-14 h-7',
      thumb: 'w-6 h-6',
      translate: 'translate-x-7'
    }
  };

  const currentSize = sizeClasses[size];

  return (
    <div className={`flex items-start gap-4 ${className}`}>
      {/* Toggle Switch */}
      <button
        id={id}
        name={name}
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled && onChange) {
            onChange(!checked);
          }
        }}
        disabled={disabled}
        className={`
          relative inline-flex ${currentSize.switch} flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
          transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2
          ${checked 
            ? 'bg-brand-600 dark:bg-brand-500' 
            : 'bg-gray-200 dark:bg-gray-600'
          }
          ${disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:bg-brand-700 dark:hover:bg-brand-400'
          }
        `}
        role="switch"
        aria-checked={checked}
        aria-labelledby={label}
      >
        <span
          className={`
            pointer-events-none inline-block ${currentSize.thumb} transform rounded-full bg-white shadow-lg ring-0
            transition duration-200 ease-in-out
            ${checked ? currentSize.translate : 'translate-x-0'}
          `}
        />
      </button>

      {/* Label and Description */}
      {label && (
        <div className="flex-1 min-w-0">
          <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
          <div className="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <span className={`${!checked ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
              {offLabel}
            </span>
            <span className="text-gray-400 dark:text-gray-500">/</span>
            <span className={`${checked ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
              {onLabel}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}