/**
 * Achievements API Route
 * 
 * GET  /api/students/:id/achievements - List achievements
 * POST /api/students/:id/achievements - Create achievement (with file upload)
 * 
 * Access control:
 * - Student can view/add their own achievements
 * - Parents can view linked students' achievements (read-only)
 * - Admins can do everything
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentSession, canAccessStudent } from '@/lib/auth'
import { createAchievementSchema } from '@/lib/validations'
import { saveFileFromFormData } from '@/lib/upload'
import { errorResponse, successResponse } from '@/lib/utils'

// GET achievements for a student
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

    // Fetch achievements
    const achievements = await prisma.achievement.findMany({
      where: { studentId },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(successResponse(achievements))
  } catch (error) {
    console.error('Get achievements error:', error)
    return NextResponse.json(
      errorResponse('Failed to fetch achievements', 'SERVER_ERROR'),
      { status: 500 }
    )
  }
}

// POST create new achievement
export async function POST(
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

    // Only students can add achievements (not parents)
    if (session.user.role !== 'STUDENT' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        errorResponse('Only students can add achievements', 'FORBIDDEN'),
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
        errorResponse('You can only add achievements to your own profile', 'FORBIDDEN'),
        { status: 403 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    
    // Extract achievement data
    const achievementData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      type: formData.get('type') as string,
      date: formData.get('date') as string,
    }

    // Validate achievement data
    const validation = createAchievementSchema.safeParse(achievementData)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid achievement data',
          details: validation.error.errors,
        },
        { status: 400 }
      )
    }

    // Handle file upload (optional)
    let certificatePath: string | null = null
    const certificateFile = formData.get('certificate')

    if (certificateFile && certificateFile instanceof File) {
      const uploadResult = await saveFileFromFormData(formData, 'certificate', studentId)
      
      if (!uploadResult.success) {
        return NextResponse.json(
          {
            error: 'File upload failed',
            details: uploadResult.error,
          },
          { status: 400 }
        )
      }

      certificatePath = uploadResult.file.publicUrl
    }

    // Create achievement
    const achievement = await prisma.achievement.create({
      data: {
        ...validation.data,
        studentId,
        certificatePath,
      },
    })

    return NextResponse.json(
      successResponse(achievement, 'Achievement added successfully'),
      { status: 201 }
    )
  } catch (error) {
    console.error('Create achievement error:', error)
    return NextResponse.json(
      errorResponse('Failed to create achievement', 'SERVER_ERROR'),
      { status: 500 }
    )
  }
}
