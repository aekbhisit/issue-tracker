"use client"

import React from "react"
import { useTranslation } from "react-i18next"

interface TextareaInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  rows?: number
  className?: string
  disabled?: boolean
  required?: boolean
  error?: string
  helperText?: string
}

export default function TextareaInput({
  value,
  onChange,
  placeholder,
  label,
  rows = 4,
  className = "",
  disabled = false,
  required = false,
  error,
  helperText
}: TextareaInputProps) {
  const { t } = useTranslation()

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        required={required}
        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-gray-900 bg-white dark:bg-gray-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed resize-vertical ${
          error
            ? "border-red-500 focus:ring-red-500 focus:border-red-500"
            : "border-gray-300 dark:border-gray-600"
        }`}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
      )}
    </div>
  )
}
