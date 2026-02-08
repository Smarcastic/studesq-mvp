/**
 * ParentView Component
 * 
 * Read-only view for parents to see their child's profile and achievements.
 * Includes helpful explanations and locked editing indicators.
 */

'use client'

import { StudentCard } from '../student/StudentCard'
import { StatsOverview } from '../student/StatsOverview'
import { AchievementList } from '../achievement/AchievementList'
import { Card, Badge } from '@/components/ui'
import { Eye, Lock, Info } from 'lucide-react'
import type { StudentProfile, Achievement } from '@prisma/client'

interface ParentViewProps {
  studentProfile: StudentProfile & {
    user: {
      name: string
      email: string
    }
    achievements: Achievement[]
  }
}

export const ParentView = ({ studentProfile }: ParentViewProps) => {
  return (
    <div className="space-y-6">
      {/* Parent Notice Banner */}
      <Card variant="glass" className="bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-500 text-white flex items-center justify-center">
            <Eye className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-blue-900">Parent View</h3>
              <Badge variant="secondary" size="sm">
                <Lock className="w-3 h-3 mr-1" />
                Read Only
              </Badge>
            </div>
            <p className="text-sm text-blue-700 leading-relaxed">
              You're viewing <span className="font-semibold">{studentProfile.displayName}'s</span> profile. 
              You can see all achievements and progress, but cannot edit or add new content. 
              This ensures students maintain ownership of their journey.
            </p>
          </div>
        </div>
      </Card>

      {/* Student Profile Card */}
      <StudentCard profile={studentProfile} />

      {/* Stats Overview */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xl font-bold text-slate-900">Progress Overview</h2>
          <Badge variant="default" size="sm">
            {studentProfile.achievements.length} total
          </Badge>
        </div>
        <StatsOverview achievements={studentProfile.achievements} />
      </div>

      {/* Achievements */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Achievements</h2>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Info className="w-4 h-4" />
            <span>View only - student manages this content</span>
          </div>
        </div>
        <AchievementList 
          achievements={studentProfile.achievements}
          showFilters={true}
        />
      </div>

      {/* Helpful Information */}
      <Card variant="bordered" className="bg-slate-50">
        <h3 className="font-semibold text-slate-900 mb-3">About Parent Access</h3>
        <ul className="space-y-2 text-sm text-slate-600">
          <li className="flex items-start gap-2">
            <span className="text-primary-500 font-bold">•</span>
            <span>
              <strong>Privacy First:</strong> Students control what information appears on their profile
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-500 font-bold">•</span>
            <span>
              <strong>Read-Only Access:</strong> You can view all achievements but cannot edit or delete them
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-500 font-bold">•</span>
            <span>
              <strong>Secure:</strong> Your access was approved by {studentProfile.displayName}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-500 font-bold">•</span>
            <span>
              <strong>Stay Updated:</strong> See new achievements as they're added in real-time
            </span>
          </li>
        </ul>
      </Card>
    </div>
  )
}
