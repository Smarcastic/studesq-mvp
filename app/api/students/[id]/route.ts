/**
 * Student Profile API Route
 * 
 * GET  /api/students/:id - Fetch student profile
 * PUT  /api/students/:id - Update student profile
 * 
 * Access control:
 * - Student can access their own profile
 * - Parents can access linked students
 * - Admins can access all profiles
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentSession, canAccessStudent } from '@/lib/auth'
import { updateProfileSchema } from '@/lib/validations'
import { errorResponse, successResponse } from '@/lib/utils'

// GET student profile
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id

    // Check authentication
    const session = await getCurrentSession()
    if (!session) {
      return NextResponse.json(
        errorResponse('Authentication required', 'UNAUTHORIZED'),
        { status: 401 }
      )
    }

    // Check access permission
    const hasAccess = await canAccessStudent(studentId)
    if (!hasAccess) {
      return NextResponse.json(
        errorResponse('Access denied to this student profile', 'FORBIDDEN'),
        { status: 403 }
      )
    }

    // Fetch student profile with relations
    const profile = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
          },
        },
        achievements: {
          orderBy: { date: 'desc' },
        },
        parentLinks: {
          where: { verified: true },
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

    if (!profile) {
      return NextResponse.json(
        errorResponse('Student profile not found', 'NOT_FOUND'),
        { status: 404 }
      )
    }

    return NextResponse.json(successResponse(profile))
  } catch (error) {
    console.error('Get student profile error:', error)
    return NextResponse.json(
      errorResponse('Failed to fetch student profile', 'SERVER_ERROR'),
      { status: 500 }
    )
  }
}

// PUT update student profile
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id

    // Check authentication
    const session = await getCurrentSession()
    if (!session) {
      return NextResponse.json(
        errorResponse('Authentication required', 'UNAUTHORIZED'),
        { status: 401 }
      )
    }

    // Only students can update their own profile (not parents)
    if (session.user.role !== 'STUDENT' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        errorResponse('Only students can update their profile', 'FORBIDDEN'),
        { status: 403 }
      )
    }

    // Verify student owns this profile
    const profile = await prisma.studentProfile.findUnique({
      where: { id: studentId },
    })

    if (!profile) {
      return NextResponse.json(
        errorResponse('Student profile not found', 'NOT_FOUND'),
        { status: 404 }
      )
    }

    // Check ownership (unless admin)
    if (session.user.role !== 'ADMIN' && profile.userId !== session.user.id) {
      return NextResponse.json(
        errorResponse('You can only update your own profile', 'FORBIDDEN'),
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = updateProfileSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        errorResponse('Invalid profile data', 'VALIDATION_ERROR'),
        { status: 400 }
      )
    }

    // Update profile
    const updatedProfile = await prisma.studentProfile.update({
      where: { id: studentId },
      data: validation.data,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
        achievements: {
          orderBy: { date: 'desc' },
          take: 5,
        },
      },
    })

    return NextResponse.json(
      successResponse(updatedProfile, 'Profile updated successfully')
    )
  } catch (error) {
    console.error('Update student profile error:', error)
    return NextResponse.json(
      errorResponse('Failed to update student profile', 'SERVER_ERROR'),
      { status: 500 }
    )
  }
}
