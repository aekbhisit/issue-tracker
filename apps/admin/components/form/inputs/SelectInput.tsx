"use client"

import React from "react"
import { useTranslation } from "react-i18next"

interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
}

interface SelectInputProps {
  value: string | number
  onChange: (value: string | number) => void
  options: SelectOption[]
  placeholder?: string
  label?: string
  className?: string
  disabled?: boolean
  required?: boolean
  name?: string
  id?: string
}

export default function SelectInput({
  value,
  onChange,
  options,
  placeholder,
  label,
  className = "",
  disabled = false,
  required = false,
  name,
  id
}: SelectInputProps) {
  const { t } = useTranslation()

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        id={id}
        name={name}
        value={value}
        onChange={(e) => {
          const selectedOption = options.find(option => option.value.toString() === e.target.value);
          if (selectedOption) {
            onChange(selectedOption.value);
          }
        }}
        disabled={disabled}
        required={required}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
