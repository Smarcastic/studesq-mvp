/**
 * Sign Out Route
 * 
 * Handles sign-out for both mock and OAuth authentication modes.
 */

import { NextRequest, NextResponse } from 'next/server'
import { clearSession } from '@/lib/session'
import { AUTH_CONFIG } from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
    // Clear session cookie (works for both modes)
    await clearSession()

    return NextResponse.json({
      success: true,
      message: 'Signed out successfully',
    })
  } catch (error) {
    console.error('Sign out error:', error)
    return NextResponse.json(
      { error: 'Failed to sign out' },
      { status: 500 }
    )
  }
}

// Also support GET for NextAuth compatibility
export async function GET(request: NextRequest) {
  return POST(request)
}
