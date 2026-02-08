/**
 * File Upload Utilities
 * 
 * Handles file uploads with validation, MIME type checking, and storage.
 * For MVP: stores files in /public/uploads (local storage).
 */

import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { UPLOAD_CONFIG } from './constants'

// =============================================================================
// Types
// =============================================================================

export interface UploadedFile {
  filename: string
  originalFilename: string
  path: string
  publicUrl: string
  size: number
  mimetype: string
}

export interface UploadError {
  code: 'FILE_TOO_LARGE' | 'INVALID_TYPE' | 'UPLOAD_FAILED'
  message: string
}

// =============================================================================
// Validation
// =============================================================================

/**
 * Validate file size
 */
export function validateFileSize(size: number): { valid: boolean; error?: UploadError } {
  if (size > UPLOAD_CONFIG.maxSize) {
    return {
      valid: false,
      error: {
        code: 'FILE_TOO_LARGE',
        message: `File size exceeds ${UPLOAD_CONFIG.maxSize / 1024 / 1024}MB limit`,
      },
    }
  }
  return { valid: true }
}

/**
 * Validate MIME type
 */
export function validateMimeType(mimetype: string): { valid: boolean; error?: UploadError } {
  if (!UPLOAD_CONFIG.allowedMimeTypes.includes(mimetype)) {
    return {
      valid: false,
      error: {
        code: 'INVALID_TYPE',
        message: `File type ${mimetype} not allowed. Allowed types: ${UPLOAD_CONFIG.allowedMimeTypes.join(', ')}`,
      },
    }
  }
  return { valid: true }
}

/**
 * Validate file extension
 */
export function validateExtension(filename: string): { valid: boolean; error?: UploadError } {
  const ext = path.extname(filename).toLowerCase()
  
  if (!UPLOAD_CONFIG.allowedExtensions.includes(ext)) {
    return {
      valid: false,
      error: {
        code: 'INVALID_TYPE',
        message: `File extension ${ext} not allowed. Allowed extensions: ${UPLOAD_CONFIG.allowedExtensions.join(', ')}`,
      },
    }
  }
  return { valid: true }
}

/**
 * Validate file (comprehensive check)
 */
export function validateFile(
  filename: string,
  size: number,
  mimetype: string
): { valid: boolean; error?: UploadError } {
  // Check size
  const sizeCheck = validateFileSize(size)
  if (!sizeCheck.valid) return sizeCheck
  
  // Check MIME type
  const mimeCheck = validateMimeType(mimetype)
  if (!mimeCheck.valid) return mimeCheck
  
  // Check extension
  const extCheck = validateExtension(filename)
  if (!extCheck.valid) return extCheck
  
  return { valid: true }
}

// =============================================================================
// File Storage
// =============================================================================

/**
 * Generate safe filename (sanitized + timestamped)
 */
export function generateSafeFilename(originalFilename: string): string {
  // Remove any path traversal attempts
  const basename = path.basename(originalFilename)
  
  // Sanitize filename
  const sanitized = basename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
  
  // Add timestamp to prevent collisions
  const timestamp = Date.now()
  const ext = path.extname(sanitized)
  const name = path.basename(sanitized, ext)
  
  return `${name}_${timestamp}${ext}`
}

/**
 * Ensure upload directory exists
 */
async function ensureUploadDir(subdir?: string): Promise<string> {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', subdir || '')
  
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true })
  }
  
  return uploadDir
}

/**
 * Save file to disk
 */
export async function saveFile(
  file: File,
  subdir?: string
): Promise<{ success: true; file: UploadedFile } | { success: false; error: UploadError }> {
  try {
    // Validate file
    const validation = validateFile(file.name, file.size, file.type)
    if (!validation.valid) {
      return { success: false, error: validation.error! }
    }
    
    // Generate safe filename
    const safeFilename = generateSafeFilename(file.name)
    
    // Ensure directory exists
    const uploadDir = await ensureUploadDir(subdir)
    
    // Full path
    const filePath = path.join(uploadDir, safeFilename)
    
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Write file
    await writeFile(filePath, buffer)
    
    // Generate public URL
    const publicUrl = path.join(UPLOAD_CONFIG.publicPath, subdir || '', safeFilename)
    
    return {
      success: true,
      file: {
        filename: safeFilename,
        originalFilename: file.name,
        path: filePath,
        publicUrl,
        size: file.size,
        mimetype: file.type,
      },
    }
  } catch (error) {
    console.error('File upload error:', error)
    return {
      success: false,
      error: {
        code: 'UPLOAD_FAILED',
        message: 'Failed to save file',
      },
    }
  }
}

/**
 * Save file from FormData
 */
export async function saveFileFromFormData(
  formData: FormData,
  fieldName: string = 'file',
  subdir?: string
): Promise<{ success: true; file: UploadedFile } | { success: false; error: UploadError }> {
  const file = formData.get(fieldName)
  
  if (!file || !(file instanceof File)) {
    return {
      success: false,
      error: {
        code: 'UPLOAD_FAILED',
        message: 'No file provided',
      },
    }
  }
  
  return await saveFile(file, subdir)
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get file extension from MIME type
 */
export function getExtensionFromMime(mimetype: string): string {
  const mimeMap: Record<string, string> = {
    'application/pdf': '.pdf',
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
  }
  
  return mimeMap[mimetype] || ''
}

/**
 * Check if file is an image
 */
export function isImageFile(mimetype: string): boolean {
  return mimetype.startsWith('image/')
}

/**
 * Check if file is a PDF
 */
export function isPdfFile(mimetype: string): boolean {
  return mimetype === 'application/pdf'
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}
