"use client"

import React from "react"
import { useTranslation } from "react-i18next"

interface TextInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  type?: "text" | "email" | "password" | "number" | "url"
  className?: string
  disabled?: boolean
  required?: boolean
  error?: string
  helperText?: string
  name?: string
  id?: string
  autoComplete?: string
}

export default function TextInput({
  value,
  onChange,
  placeholder,
  label,
  type = "text",
  className = "",
  disabled = false,
  required = false,
  error,
  helperText,
  name,
  id,
  autoComplete
}: TextInputProps) {
  const { t } = useTranslation()

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        autoComplete={autoComplete}
        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-gray-900 bg-white dark:bg-gray-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed ${
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
