/**
 * Authentication Helpers
 * 
 * Unified authentication handling for both mock and Google OAuth modes.
 * Automatically switches based on AUTH_MODE environment variable.
 */

import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { AUTH_CONFIG, DEMO_ACCOUNTS } from './constants'
import { getSession as getMockSession, requireAuth as requireMockAuth } from './session'
import { prisma } from './prisma'
import type { SessionPayload } from './session'

// =============================================================================
// Session Type (unified for both modes)
// =============================================================================

export interface AuthSession {
  user: {
    id: string
    email: string
    name: string
    role: 'STUDENT' | 'PARENT' | 'ADMIN'
  }
}

// =============================================================================
// Get Current Session (mode-aware)
// =============================================================================

/**
 * Get current authenticated session (works in both mock and OAuth modes)
 */
export async function getCurrentSession(): Promise<AuthSession | null> {
  if (AUTH_CONFIG.isMockMode) {
    return await getMockSessionAdapted()
  } else {
    return await getOAuthSessionAdapted()
  }
}

/**
 * Require authentication (throws if not authenticated)
 */
export async function requireSession(): Promise<AuthSession> {
  const session = await getCurrentSession()
  
  if (!session) {
    throw new Error('Authentication required')
  }
  
  return session
}

// =============================================================================
// Mock Mode Adapters
// =============================================================================

async function getMockSessionAdapted(): Promise<AuthSession | null> {
  const mockSession = await getMockSession()
  
  if (!mockSession) {
    return null
  }
  
  return {
    user: {
      id: mockSession.userId,
      email: mockSession.email,
      name: mockSession.name,
      role: mockSession.role,
    },
  }
}

// =============================================================================
// OAuth Mode Adapters
// =============================================================================

async function getOAuthSessionAdapted(): Promise<AuthSession | null> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return null
    }
    
    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })
    
    if (!user) {
      return null
    }
    
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as 'STUDENT' | 'PARENT' | 'ADMIN',
      },
    }
  } catch (error) {
    console.error('OAuth session error:', error)
    return null
  }
}

// =============================================================================
// Demo Account Helpers
// =============================================================================

/**
 * Find demo account by email
 */
export function findDemoAccount(email: string) {
  // Check students
  const student = DEMO_ACCOUNTS.students.find(s => s.email === email)
  if (student) return student
  
  // Check parents
  const parent = DEMO_ACCOUNTS.parents.find(p => p.email === email)
  if (parent) return parent
  
  // Check admin
  if (DEMO_ACCOUNTS.admin.email === email) {
    return DEMO_ACCOUNTS.admin
  }
  
  return null
}

/**
 * Get all demo accounts (for mock login page)
 */
export function getAllDemoAccounts() {
  return {
    students: DEMO_ACCOUNTS.students,
    parents: DEMO_ACCOUNTS.parents,
    admin: DEMO_ACCOUNTS.admin,
  }
}

// =============================================================================
// Role-Based Authorization
// =============================================================================

/**
 * Check if current user has required role
 */
export async function hasRole(role: 'STUDENT' | 'PARENT' | 'ADMIN'): Promise<boolean> {
  const session = await getCurrentSession()
  return session?.user.role === role
}

/**
 * Require specific role (throws if not authorized)
 */
export async function requireRole(role: 'STUDENT' | 'PARENT' | 'ADMIN'): Promise<AuthSession> {
  const session = await requireSession()
  
  if (session.user.role !== role) {
    throw new Error('Insufficient permissions')
  }
  
  return session
}

// =============================================================================
// Student Profile Helpers
// =============================================================================

/**
 * Get student profile for current user (only if user is a student)
 */
export async function getCurrentStudentProfile() {
  const session = await getCurrentSession()
  
  if (!session || session.user.role !== 'STUDENT') {
    return null
  }
  
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      achievements: {
        orderBy: { date: 'desc' },
      },
      parentLinks: {
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  })
  
  return profile
}

/**
 * Get linked students for current user (only if user is a parent)
 */
export async function getLinkedStudents() {
  const session = await getCurrentSession()
  
  if (!session || session.user.role !== 'PARENT') {
    return []
  }
  
  const parentLinks = await prisma.parentLink.findMany({
    where: { parentUserId: session.user.id },
    include: {
      student: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          achievements: {
            orderBy: { date: 'desc' },
            take: 5, // Latest 5 achievements
          },
        },
      },
    },
  })
  
  return parentLinks.map(link => link.student)
}

// =============================================================================
// Access Control
// =============================================================================

/**
 * Check if current user can access a student profile
 * (student themselves, their parent, or admin)
 */
export async function canAccessStudent(studentId: string): Promise<boolean> {
  const session = await getCurrentSession()
  
  if (!session) {
    return false
  }
  
  // Admins can access all profiles
  if (session.user.role === 'ADMIN') {
    return true
  }
  
  // Students can access their own profile
  if (session.user.role === 'STUDENT') {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id },
    })
    return profile?.id === studentId
  }
  
  // Parents can access linked students
  if (session.user.role === 'PARENT') {
    const link = await prisma.parentLink.findFirst({
      where: {
        parentUserId: session.user.id,
        studentId: studentId,
        verified: true,
      },
    })
    return link !== null
  }
  
  return false
}

/**
 * Require access to student profile (throws if not authorized)
 */
export async function requireStudentAccess(studentId: string): Promise<void> {
  const hasAccess = await canAccessStudent(studentId)
  
  if (!hasAccess) {
    throw new Error('Access denied to this student profile')
  }
}
