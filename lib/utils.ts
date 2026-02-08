/**
 * Common Utilities
 * 
 * Shared helper functions used throughout the application.
 */

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, parseISO } from 'date-fns'

// =============================================================================
// Styling Utilities
// =============================================================================

/**
 * Merge Tailwind classes with proper precedence
 * Combines clsx and tailwind-merge for optimal class handling
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// =============================================================================
// Date Utilities
// =============================================================================

/**
 * Format date for display
 */
export function formatDate(date: Date | string, formatString: string = 'MMM d, yyyy'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, formatString)
}

/**
 * Format relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(dateObj, { addSuffix: true })
}

/**
 * Get year from date
 */
export function getYear(date: Date | string): number {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return dateObj.getFullYear()
}

/**
 * Group items by year
 */
export function groupByYear<T extends { date: Date | string }>(items: T[]): Record<number, T[]> {
  return items.reduce((acc, item) => {
    const year = getYear(item.date)
    if (!acc[year]) {
      acc[year] = []
    }
    acc[year].push(item)
    return acc
  }, {} as Record<number, T[]>)
}

// =============================================================================
// String Utilities
// =============================================================================

/**
 * Truncate string to specified length
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

/**
 * Capitalize first letter
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Generate initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Slugify string (for URLs)
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// =============================================================================
// Array Utilities
// =============================================================================

/**
 * Sort array by date (newest first)
 */
export function sortByDateDesc<T extends { date: Date | string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const dateA = typeof a.date === 'string' ? parseISO(a.date) : a.date
    const dateB = typeof b.date === 'string' ? parseISO(b.date) : b.date
    return dateB.getTime() - dateA.getTime()
  })
}

/**
 * Get unique values from array
 */
export function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)]
}

// =============================================================================
// Validation Utilities
// =============================================================================

/**
 * Check if string is valid email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Check if value is empty (null, undefined, or empty string)
 */
export function isEmpty(value: any): boolean {
  return value === null || value === undefined || value === ''
}

// =============================================================================
// Number Utilities
// =============================================================================

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
  return num.toLocaleString()
}

/**
 * Calculate percentage
 */
export function percentage(value: number, total: number): number {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}

// =============================================================================
// API Response Utilities
// =============================================================================

/**
 * Create success response
 */
export function successResponse<T>(data: T, message?: string) {
  return {
    success: true,
    data,
    message,
  }
}

/**
 * Create error response
 */
export function errorResponse(message: string, code?: string) {
  return {
    success: false,
    error: {
      message,
      code,
    },
  }
}

// =============================================================================
// Async Utilities
// =============================================================================

/**
 * Wait for specified milliseconds
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Retry async function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | undefined
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      if (attempt < maxAttempts) {
        await wait(delay * attempt)
      }
    }
  }
  
  throw lastError
}
