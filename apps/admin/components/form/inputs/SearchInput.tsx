"use client"

import React from "react"
import { useTranslation } from "react-i18next"

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export default function SearchInput({
  value,
  onChange,
  placeholder,
  className = "",
  disabled = false
}: SearchInputProps) {
  const { t } = useTranslation()

  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || t('common.search')}
        disabled={disabled}
        className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <div className="absolute inset-y-0 left-0 flex items-center pl-3">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
    </div>
  )
}
