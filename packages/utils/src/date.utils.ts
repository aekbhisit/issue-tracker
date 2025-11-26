/**
 * Date utility functions
 */

/**
 * Formats a date to YYYY-MM-DD
 * 
 * @param date - The date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Formats a date to YYYY-MM-DD HH:mm:ss
 * 
 * @param date - The date to format
 * @returns Formatted datetime string
 */
export function formatDateTime(date: Date): string {
  const dateStr = formatDate(date)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${dateStr} ${hours}:${minutes}:${seconds}`
}

/**
 * Adds days to a date
 * 
 * @param date - The starting date
 * @param days - Number of days to add
 * @returns New date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Checks if a date is in the past
 * 
 * @param date - The date to check
 * @returns True if date is in the past
 */
export function isPast(date: Date): boolean {
  return date < new Date()
}

/**
 * Checks if a date is in the future
 * 
 * @param date - The date to check
 * @returns True if date is in the future
 */
export function isFuture(date: Date): boolean {
  return date > new Date()
}

