/**
 * Session Management (Mock Auth Mode)
 * 
 * Simple JWT-based session handling for demo/mock authentication.
 * In Google OAuth mode, NextAuth handles sessions automatically.
 */

import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { AUTH_CONFIG } from './constants'

// =============================================================================
// Types
// =============================================================================

export interface SessionPayload {
  userId: string
  email: string
  name: string
  role: 'STUDENT' | 'PARENT' | 'ADMIN'
  iat?: number
  exp?: number
}

// =============================================================================
// JWT Secret
// =============================================================================

const getSecretKey = () => {
  const secret = process.env.NEXTAUTH_SECRET || 'dev-secret-key-change-in-production'
  return new TextEncoder().encode(secret)
}

// =============================================================================
// Session Creation
// =============================================================================

/**
 * Create a new session JWT token
 */
export async function createSession(payload: Omit<SessionPayload, 'iat' | 'exp'>): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${AUTH_CONFIG.sessionMaxAge}s`)
    .sign(getSecretKey())

  return token
}

/**
 * Verify and decode a session token
 */
export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey())
    return payload as SessionPayload
  } catch (error) {
    // Token invalid or expired
    return null
  }
}

// =============================================================================
// Cookie Helpers
// =============================================================================

/**
 * Set session cookie
 */
export async function setSessionCookie(payload: Omit<SessionPayload, 'iat' | 'exp'>) {
  const token = await createSession(payload)
  const cookieStore = await cookies()
  
  cookieStore.set(AUTH_CONFIG.sessionCookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: AUTH_CONFIG.sessionMaxAge,
    path: '/',
  })
}

/**
 * Get session from cookie
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_CONFIG.sessionCookieName)?.value

  if (!token) {
    return null
  }

  return await verifySession(token)
}

/**
 * Clear session cookie
 */
export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.delete(AUTH_CONFIG.sessionCookieName)
}

// =============================================================================
// Session Guards
// =============================================================================

/**
 * Require authentication - throws if no session
 */
export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession()
  
  if (!session) {
    throw new Error('Unauthorized')
  }
  
  return session
}

/**
 * Require specific role - throws if no session or wrong role
 */
export async function requireRole(role: 'STUDENT' | 'PARENT' | 'ADMIN'): Promise<SessionPayload> {
  const session = await requireAuth()
  
  if (session.role !== role) {
    throw new Error('Forbidden')
  }
  
  return session
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession()
  return session !== null
}
