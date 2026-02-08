/**
 * Application Constants
 * 
 * Centralized configuration for the Studesq MVP.
 * All environment-dependent values should be loaded here.
 */

// =============================================================================
// Authentication
// =============================================================================

export const AUTH_MODE = (process.env.AUTH_MODE || 'mock') as 'mock' | 'google'

export const AUTH_CONFIG = {
  mode: AUTH_MODE,
  isMockMode: AUTH_MODE === 'mock',
  isGoogleMode: AUTH_MODE === 'google',
  sessionMaxAge: 30 * 24 * 60 * 60, // 30 days in seconds
  sessionCookieName: 'studesq_session',
} as const

// =============================================================================
// File Upload
// =============================================================================

export const UPLOAD_CONFIG = {
  maxSize: parseInt(process.env.MAX_UPLOAD_SIZE || '10485760', 10), // 10MB default
  allowedExtensions: (process.env.ALLOWED_EXTENSIONS || '.pdf,.jpg,.jpeg,.png').split(','),
  allowedMimeTypes: [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
  ],
  uploadDir: '/public/uploads',
  publicPath: '/uploads',
} as const

// =============================================================================
// Features
// =============================================================================

export const FEATURE_FLAGS = {
  waitlistStore: process.env.ENABLE_WAITLIST_STORE === 'true',
  earlyFounderBadge: process.env.ENABLE_EARLY_FOUNDER_BADGE !== 'false', // Default true
} as const

// =============================================================================
// Demo Accounts (Mock Auth)
// =============================================================================

export const DEMO_ACCOUNTS = {
  students: [
    {
      id: 'student_alice',
      email: 'alice@demo.studesq.com',
      name: 'Alice Chen',
      role: 'STUDENT' as const,
    },
    {
      id: 'student_marcus',
      email: 'marcus@demo.studesq.com',
      name: 'Marcus Johnson',
      role: 'STUDENT' as const,
    },
    {
      id: 'student_priya',
      email: 'priya@demo.studesq.com',
      name: 'Priya Sharma',
      role: 'STUDENT' as const,
    },
  ],
  parents: [
    {
      id: 'parent_alice',
      email: 'alice-parent@demo.studesq.com',
      name: 'Helen Chen',
      role: 'PARENT' as const,
      childEmail: 'alice@demo.studesq.com',
    },
    {
      id: 'parent_marcus',
      email: 'marcus-parent@demo.studesq.com',
      name: 'David Johnson',
      role: 'PARENT' as const,
      childEmail: 'marcus@demo.studesq.com',
    },
  ],
  admin: {
    id: 'admin_user',
    email: 'admin@demo.studesq.com',
    name: 'Admin User',
    role: 'ADMIN' as const,
  },
} as const

// =============================================================================
// UI Constants
// =============================================================================

export const UI_CONFIG = {
  appName: 'Studesq',
  tagline: 'Your student journey — safe & yours.',
  colors: {
    primary: '#06b6d4', // Teal
    secondary: '#6366f1', // Indigo
  },
  timelineYearRange: 5, // Show achievements from last 5 years
} as const

// =============================================================================
// Achievement Types
// =============================================================================

export const ACHIEVEMENT_TYPES = [
  { value: 'ACADEMIC', label: 'Academic', emoji: '📚' },
  { value: 'EXTRACURRICULAR', label: 'Extracurricular', emoji: '🎯' },
  { value: 'CERTIFICATION', label: 'Certification', emoji: '🏆' },
  { value: 'COMPETITION', label: 'Competition', emoji: '🥇' },
  { value: 'PROJECT', label: 'Project', emoji: '💡' },
  { value: 'OTHER', label: 'Other', emoji: '✨' },
] as const

// =============================================================================
// API Routes
// =============================================================================

export const API_ROUTES = {
  auth: {
    signin: '/api/auth/signin',
    signout: '/api/auth/signout',
    session: '/api/auth/session',
    mockSignin: '/api/auth/mock-signin',
  },
  students: {
    get: (id: string) => `/api/students/${id}`,
    update: (id: string) => `/api/students/${id}`,
    achievements: (id: string) => `/api/students/${id}/achievements`,
  },
  opportunities: '/api/opportunities',
  waitlist: '/api/waitlist',
} as const

// =============================================================================
// Validation
// =============================================================================

export const VALIDATION = {
  name: {
    min: 2,
    max: 100,
  },
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  bio: {
    max: 500,
  },
  achievement: {
    titleMax: 200,
    descriptionMax: 1000,
  },
} as const
