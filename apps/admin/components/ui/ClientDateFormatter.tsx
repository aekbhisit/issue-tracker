"use client";

import { useState, useEffect } from "react";

/**
 * Client-only date formatter component to prevent React hydration mismatches
 * 
 * Date formatting methods like toLocaleString(), toLocaleDateString(), etc.
 * produce different output on server vs client due to timezone/locale differences.
 * This component only renders the formatted date after client-side hydration.
 */
export function ClientDateFormatter({
  date,
  format = "datetime",
  locale = "th-TH",
  options,
}: {
  date: Date | string;
  format?: "datetime" | "date" | "time";
  locale?: string;
  options?: Intl.DateTimeFormatOptions;
}) {
  const [formatted, setFormatted] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const dateObj = typeof date === "string" ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      setFormatted("Invalid Date");
      return;
    }

    let formattedValue: string;
    
    if (format === "date") {
      formattedValue = dateObj.toLocaleDateString(locale, options);
    } else if (format === "time") {
      formattedValue = dateObj.toLocaleTimeString(locale, options);
    } else {
      formattedValue = dateObj.toLocaleString(locale, options);
    }
    
    setFormatted(formattedValue);
  }, [date, format, locale, options]);

  // During SSR, return empty span to prevent hydration mismatch
  if (!mounted) {
    return <span suppressHydrationWarning></span>;
  }

  return <span suppressHydrationWarning>{formatted}</span>;
}

/**
 * Client-only date formatter for table cells
 * Same as ClientDateFormatter but with default styling for tables
 */
export function ClientTableDate({
  date,
  format = "datetime",
}: {
  date: Date | string;
  format?: "datetime" | "date" | "time";
}) {
  return (
    <span className="text-gray-600 dark:text-gray-400">
      <ClientDateFormatter date={date} format={format} />
    </span>
  );
}


