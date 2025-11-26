"use client";

import { ChangeEvent } from "react";

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchField({
  value,
  onChange,
  placeholder = "Search",
  className = "",
}: SearchFieldProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className={`relative flex-1 ${className}`}>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="input-control w-full pl-10 pr-4"
      />
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M9.5 17a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" />
        </svg>
      </span>
    </div>
  );
}


