/**
 * Validation Schemas (Zod)
 * 
 * Type-safe validation for forms and API requests.
 * Used with React Hook Form and API route handlers.
 */

import { z } from 'zod'
import { VALIDATION } from './constants'

// =============================================================================
// User & Profile Schemas
// =============================================================================

export const userRoleSchema = z.enum(['STUDENT', 'PARENT', 'ADMIN'])

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(VALIDATION.name.min).max(VALIDATION.name.max),
  role: userRoleSchema,
  googleId: z.string().optional(),
})

export const updateProfileSchema = z.object({
  displayName: z.string().min(VALIDATION.name.min).max(VALIDATION.name.max),
  bio: z.string().max(VALIDATION.bio.max).optional().nullable(),
  school: z.string().max(200).optional().nullable(),
  grade: z.string().max(50).optional().nullable(),
  dob: z.string().datetime().optional().nullable(),
})

// =============================================================================
// Achievement Schemas
// =============================================================================

export const achievementTypeSchema = z.enum([
  'ACADEMIC',
  'EXTRACURRICULAR',
  'CERTIFICATION',
  'COMPETITION',
  'PROJECT',
  'OTHER',
])

export const createAchievementSchema = z.object({
  title: z.string().min(1, 'Title is required').max(VALIDATION.achievement.titleMax),
  description: z.string().min(1, 'Description is required').max(VALIDATION.achievement.descriptionMax),
  type: achievementTypeSchema,
  date: z.string().datetime('Invalid date format'),
  certificatePath: z.string().optional().nullable(),
})

export const updateAchievementSchema = createAchievementSchema.partial()

// =============================================================================
// Waitlist Schema
// =============================================================================

export const waitlistSignupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

// =============================================================================
// File Upload Schema
// =============================================================================

export const fileUploadSchema = z.object({
  filename: z.string().min(1),
  mimetype: z.string().min(1),
  size: z.number().positive(),
})

// =============================================================================
// Mock Auth Schema
// =============================================================================

export const mockSigninSchema = z.object({
  email: z.string().email(),
})

// =============================================================================
// Type Exports
// =============================================================================

export type UserRole = z.infer<typeof userRoleSchema>
export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type AchievementType = z.infer<typeof achievementTypeSchema>
export type CreateAchievementInput = z.infer<typeof createAchievementSchema>
export type UpdateAchievementInput = z.infer<typeof updateAchievementSchema>
export type WaitlistSignupInput = z.infer<typeof waitlistSignupSchema>
export type FileUploadInput = z.infer<typeof fileUploadSchema>
export type MockSigninInput = z.infer<typeof mockSigninSchema>
