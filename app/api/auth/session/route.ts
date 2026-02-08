/**
 * Session Check API Route
 * 
 * GET /api/auth/session - Get current session
 * 
 * Works for both mock and OAuth authentication modes.
 * Returns authenticated user info or null if not logged in.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { successResponse } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()

    if (!session) {
      return NextResponse.json({
        authenticated: false,
        user: null,
      })
    }

    return NextResponse.json(
      successResponse({
        authenticated: true,
        user: session.user,
      })
    )
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json({
      authenticated: false,
      user: null,
      error: 'Failed to check session',
    })
  }
}
