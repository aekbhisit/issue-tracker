"use client"

import React from "react"
import { useTranslation } from "react-i18next"

interface CheckboxInputProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  className?: string
  disabled?: boolean
  required?: boolean
  error?: string
}

export default function CheckboxInput({
  checked,
  onChange,
  label,
  className = "",
  disabled = false,
  required = false,
  error
}: CheckboxInputProps) {
  const { t } = useTranslation()

  return (
    <div className={className}>
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          required={required}
          className={`h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed ${
            error ? "border-red-500" : ""
          }`}
        />
        {label && (
          <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  )
}
