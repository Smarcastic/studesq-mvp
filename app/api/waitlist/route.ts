/**
 * Waitlist Signup API Route
 * 
 * POST /api/waitlist - Add email to waitlist
 * 
 * Only stores emails if ENABLE_WAITLIST_STORE=true in .env
 * Otherwise returns success but doesn't persist (for testing UI).
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { waitlistSignupSchema } from '@/lib/validations'
import { FEATURE_FLAGS } from '@/lib/constants'
import { errorResponse, successResponse } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validation = waitlistSignupSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid email address',
          details: validation.error.errors,
        },
        { status: 400 }
      )
    }

    const { email } = validation.data

    // Check if waitlist storage is enabled
    if (!FEATURE_FLAGS.waitlistStore) {
      // Return success but don't store (for demo purposes)
      console.log(`[DEMO] Waitlist signup (not stored): ${email}`)
      return NextResponse.json(
        successResponse(
          { email, stored: false },
          'Thanks for your interest! (Demo mode - email not stored)'
        )
      )
    }

    // Check if email already exists
    const existing = await prisma.waitlistSignup.findUnique({
      where: { email },
    })

    if (existing) {
      return NextResponse.json(
        successResponse(
          { email, stored: true, alreadyExists: true },
          'You\'re already on the waitlist!'
        )
      )
    }

    // Store email in database
    await prisma.waitlistSignup.create({
      data: { email },
    })

    console.log(`✅ Waitlist signup: ${email}`)

    return NextResponse.json(
      successResponse(
        { email, stored: true },
        'Successfully added to waitlist!'
      ),
      { status: 201 }
    )
  } catch (error) {
    console.error('Waitlist signup error:', error)
    return NextResponse.json(
      errorResponse('Failed to add to waitlist', 'SERVER_ERROR'),
      { status: 500 }
    )
  }
}
