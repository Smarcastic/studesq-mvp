/**
 * Mock Authentication Route
 * 
 * Handles sign-in for demo accounts when AUTH_MODE=mock.
 * This allows testing without setting up Google OAuth.
 */

import { NextRequest, NextResponse } from 'next/server'
import { mockSigninSchema } from '@/lib/validations'
import { setSessionCookie } from '@/lib/session'
import { findDemoAccount, AUTH_CONFIG } from '@/lib/constants'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Only allow in mock mode
    if (!AUTH_CONFIG.isMockMode) {
      return NextResponse.json(
        { error: 'Mock authentication is disabled. Use Google OAuth.' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = mockSigninSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid email address', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { email } = validation.data

    // Find demo account
    const demoAccount = findDemoAccount(email)

    if (!demoAccount) {
      return NextResponse.json(
        { error: 'Demo account not found. Please use one of the provided demo emails.' },
        { status: 404 }
      )
    }

    // Find or create user in database
    let user = await prisma.user.findUnique({
      where: { email: demoAccount.email },
    })

    if (!user) {
      // Create user if they don't exist (first time seed)
      user = await prisma.user.create({
        data: {
          id: demoAccount.id,
          email: demoAccount.email,
          name: demoAccount.name,
          role: demoAccount.role,
        },
      })
    }

    // Create session
    await setSessionCookie({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as 'STUDENT' | 'PARENT' | 'ADMIN',
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Mock signin error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}

// Get current session (for checking if logged in)
export async function GET(request: NextRequest) {
  try {
    const { getSession } = await import('@/lib/session')
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.userId,
        email: session.email,
        name: session.name,
        role: session.role,
      },
    })
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json({ authenticated: false }, { status: 500 })
  }
}
