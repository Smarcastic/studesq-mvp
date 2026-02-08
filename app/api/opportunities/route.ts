/**
 * Opportunities API Route
 * 
 * GET /api/opportunities - List all opportunities
 * 
 * Public endpoint - no authentication required for MVP.
 * Shows scholarships, programs, and competitions for students.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { errorResponse, successResponse } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const upcoming = searchParams.get('upcoming') === 'true'

    // Build query
    const where = upcoming
      ? {
          date: {
            gte: new Date(), // Only future/current opportunities
          },
        }
      : {}

    // Fetch opportunities
    const [opportunities, total] = await Promise.all([
      prisma.opportunity.findMany({
        where,
        orderBy: { date: 'asc' },
        take: limit,
        skip: offset,
      }),
      prisma.opportunity.count({ where }),
    ])

    return NextResponse.json(
      successResponse({
        opportunities,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      })
    )
  } catch (error) {
    console.error('Get opportunities error:', error)
    return NextResponse.json(
      errorResponse('Failed to fetch opportunities', 'SERVER_ERROR'),
      { status: 500 }
    )
  }
}
