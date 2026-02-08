/**
 * Smoke Test
 * 
 * Basic tests to verify core utilities are working.
 * This is not comprehensive testing - just a sanity check.
 */

import { describe, it, expect } from 'vitest'
import { cn, formatDate, truncate, getInitials, isValidEmail } from '@/lib/utils'
import { validateFileSize, validateMimeType, generateSafeFilename } from '@/lib/upload'
import { UPLOAD_CONFIG, AUTH_CONFIG } from '@/lib/constants'

describe('Smoke Test - Core Utilities', () => {
  it('should merge Tailwind classes correctly', () => {
    const result = cn('px-2 py-1', 'px-4')
    expect(result).toBe('py-1 px-4')
  })

  it('should format dates correctly', () => {
    const date = new Date('2024-11-15')
    const formatted = formatDate(date)
    expect(formatted).toContain('2024')
    expect(formatted).toContain('Nov')
  })

  it('should truncate strings', () => {
    const result = truncate('Hello World', 5)
    expect(result).toBe('Hello...')
  })

  it('should generate initials', () => {
    expect(getInitials('Alice Chen')).toBe('AC')
    expect(getInitials('Marcus Johnson')).toBe('MJ')
  })

  it('should validate emails', () => {
    expect(isValidEmail('test@example.com')).toBe(true)
    expect(isValidEmail('invalid-email')).toBe(false)
  })
})

describe('Smoke Test - File Upload', () => {
  it('should validate file size', () => {
    const result = validateFileSize(1024 * 1024) // 1MB
    expect(result.valid).toBe(true)

    const tooBig = validateFileSize(UPLOAD_CONFIG.maxSize + 1)
    expect(tooBig.valid).toBe(false)
  })

  it('should validate MIME types', () => {
    const validPdf = validateMimeType('application/pdf')
    expect(validPdf.valid).toBe(true)

    const validImage = validateMimeType('image/jpeg')
    expect(validImage.valid).toBe(true)

    const invalid = validateMimeType('application/exe')
    expect(invalid.valid).toBe(false)
  })

  it('should generate safe filenames', () => {
    const filename = generateSafeFilename('my file.pdf')
    expect(filename).toMatch(/my_file_\d+\.pdf/)
    expect(filename).not.toContain(' ')
  })
})

describe('Smoke Test - Configuration', () => {
  it('should load auth config', () => {
    expect(AUTH_CONFIG.mode).toBeDefined()
    expect(['mock', 'google']).toContain(AUTH_CONFIG.mode)
  })

  it('should load upload config', () => {
    expect(UPLOAD_CONFIG.maxSize).toBeGreaterThan(0)
    expect(UPLOAD_CONFIG.allowedExtensions.length).toBeGreaterThan(0)
  })
})
