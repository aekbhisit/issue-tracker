"use client";

import React, { useEffect, useState } from "react";
import Select, { SingleValue, MultiValue, StylesConfig, GroupBase } from "react-select";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/context/ThemeContext";

export interface SelectOption {
  value: string | number;
  label: string;
  isDisabled?: boolean;
}

interface ReactSelectProps {
  id?: string;
  name?: string;
  label?: string;
  value?: string | number | string[] | number[];
  onChange: (value: string | number | string[] | number[] | null) => void;
  options: SelectOption[];
  placeholder?: string;
  isMulti?: boolean;
  isSearchable?: boolean;
  isClearable?: boolean;
  isDisabled?: boolean;
  required?: boolean;
  error?: string;
  helperText?: string;
  className?: string;
  noOptionsMessage?: string;
  loadingMessage?: string;
  isLoading?: boolean;
}

export default function ReactSelect({
  id,
  name,
  label,
  value,
  onChange,
  options,
  placeholder,
  isMulti = false,
  isSearchable = true,
  isClearable = true,
  isDisabled = false,
  required = false,
  error,
  helperText,
  className = "",
  noOptionsMessage,
  loadingMessage,
  isLoading = false
}: ReactSelectProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Custom styles for react-select
  const customStyles: StylesConfig<SelectOption, boolean, GroupBase<SelectOption>> = {
    control: (provided, state) => ({
      ...provided,
      minHeight: '42px',
      borderColor: error 
        ? '#ef4444' 
        : state.isFocused 
          ? '#3b82f6' 
          : '#d1d5db',
      boxShadow: state.isFocused 
        ? (error ? '0 0 0 1px #ef4444' : '0 0 0 1px #3b82f6')
        : 'none',
      '&:hover': {
        borderColor: error ? '#ef4444' : '#9ca3af'
      },
      backgroundColor: isDisabled ? '#f9fafb' : 'white',
      cursor: isDisabled ? 'not-allowed' : 'default'
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: '2px 8px'
    }),
    input: (provided) => ({
      ...provided,
      margin: '0px',
      padding: '0px'
    }),
    indicatorSeparator: () => ({
      display: 'none'
    }),
    indicatorsContainer: (provided) => ({
      ...provided,
      padding: '0px 8px'
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      padding: '4px'
    }),
    clearIndicator: (provided) => ({
      ...provided,
      padding: '4px'
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 9999,
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? '#3b82f6'
        : state.isFocused
          ? '#f3f4f6'
          : 'white',
      color: state.isSelected
        ? 'white'
        : '#374151',
      cursor: 'pointer',
      '&:active': {
        backgroundColor: state.isSelected ? '#3b82f6' : '#e5e7eb'
      }
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: '#e0e7ff'
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: '#3730a3',
      fontSize: '14px'
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: '#3730a3',
      '&:hover': {
        backgroundColor: '#c7d2fe',
        color: '#1e1b4b'
      }
    })
  };

  // Dark mode styles
  const darkStyles: StylesConfig<SelectOption, boolean, GroupBase<SelectOption>> = {
    ...customStyles,
    control: (provided, state) => ({
      ...customStyles.control!(provided, state),
      backgroundColor: isDisabled ? '#374151' : '#1f2937',
      borderColor: error 
        ? '#ef4444' 
        : state.isFocused 
          ? '#3b82f6' 
          : '#4b5563',
      color: '#f9fafb'
    }),
    menu: (provided, state) => ({
      ...customStyles.menu!(provided, state),
      backgroundColor: '#1f2937',
      border: '1px solid #4b5563'
    }),
    option: (provided, state) => ({
      ...customStyles.option!(provided, state),
      backgroundColor: state.isSelected
        ? '#3b82f6'
        : state.isFocused
          ? '#374151'
          : '#1f2937',
      color: state.isSelected
        ? 'white'
        : '#f9fafb'
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#f9fafb'
    }),
    input: (provided) => ({
      ...provided,
      color: '#f9fafb'
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#9ca3af'
    })
  };

  // Convert value to react-select format
  const getSelectValue = () => {
    if (value === undefined || value === null) return null;

    if (isMulti) {
      const values = Array.isArray(value) ? value : [value];
      return options.filter(option => values.includes(option.value));
    } else {
      return options.find(option => option.value === value) || null;
    }
  };

  // Handle change
  const handleChange = (selectedOption: SingleValue<SelectOption> | MultiValue<SelectOption>) => {
    if (isMulti) {
      const values = Array.isArray(selectedOption) 
        ? selectedOption.map(option => option.value)
        : [];
      onChange(values);
    } else {
      const singleOption = selectedOption as SingleValue<SelectOption>;
      onChange(singleOption ? singleOption.value : null);
    }
  };

  return (
    <div className={className}>
      {label && (
        <label 
          htmlFor={id}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {isMounted ? (
        <Select
          id={id}
          name={name}
          value={getSelectValue()}
          onChange={handleChange}
          options={options}
          placeholder={placeholder || t('common.selectPlaceholder')}
          isMulti={isMulti}
          isSearchable={isSearchable}
          isClearable={isClearable}
          isDisabled={isDisabled}
          required={required}
          isLoading={isLoading}
          styles={theme === "dark" ? darkStyles : customStyles}
          className="react-select-container"
          classNamePrefix="react-select"
          noOptionsMessage={() => noOptionsMessage || t('common.noOptions')}
          loadingMessage={() => loadingMessage || t('common.loading')}
          menuPortalTarget={document.body}
          menuPosition="fixed"
          menuShouldScrollIntoView={false}
          openMenuOnFocus={false}
        />
      ) : (
        <div className="relative control-height rounded border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800" />
      )}

      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
      )}
    </div>
  );
}
