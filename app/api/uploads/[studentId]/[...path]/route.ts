/**
 * Protected File Access Route
 * 
 * GET /api/uploads/[studentId]/[...path] - Download uploaded file
 * 
 * Access control:
 * - Student can access their own files
 * - Parents can access linked students' files
 * - Admins can access all files
 */

import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { getCurrentSession, canAccessStudent } from '@/lib/auth'
import { errorResponse } from '@/lib/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { studentId: string; path: string[] } }
) {
  try {
    const { studentId, path: filePath } = params

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
        errorResponse('Access denied to this file', 'FORBIDDEN'),
        { status: 403 }
      )
    }

    // Construct file path (security: prevent path traversal)
    const filename = filePath.join('/')
    const safePath = path.join(
      process.cwd(),
      'public',
      'uploads',
      studentId,
      filename
    )

    // Verify path is within uploads directory (security check)
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', studentId)
    if (!safePath.startsWith(uploadsDir)) {
      return NextResponse.json(
        errorResponse('Invalid file path', 'FORBIDDEN'),
        { status: 403 }
      )
    }

    // Read file
    let fileBuffer: Buffer
    try {
      fileBuffer = await readFile(safePath)
    } catch (error) {
      return NextResponse.json(
        errorResponse('File not found', 'NOT_FOUND'),
        { status: 404 }
      )
    }

    // Determine content type based on extension
    const ext = path.extname(filename).toLowerCase()
    const contentTypeMap: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
    }
    const contentType = contentTypeMap[ext] || 'application/octet-stream'

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${path.basename(filename)}"`,
        'Cache-Control': 'private, max-age=3600', // Cache for 1 hour
      },
    })
  } catch (error) {
    console.error('File access error:', error)
    return NextResponse.json(
      errorResponse('Failed to access file', 'SERVER_ERROR'),
      { status: 500 }
    )
  }
}
