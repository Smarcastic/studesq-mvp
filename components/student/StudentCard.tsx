/**
 * StudentCard Component
 * 
 * Displays student profile summary with avatar, name, school, and stats.
 * Premium gradient card design.
 */

'use client'

import { getInitials } from '@/lib/utils'
import { Card, Badge } from '@/components/ui'
import { GraduationCap, Award, Calendar } from 'lucide-react'
import type { StudentProfile } from '@prisma/client'

interface StudentCardProps {
  profile: StudentProfile & {
    user: {
      name: string
      email: string
    }
    achievements?: Array<{ id: string }>
  }
  showEarlyFounder?: boolean
}

export const StudentCard = ({ profile, showEarlyFounder = true }: StudentCardProps) => {
  const initials = getInitials(profile.displayName)
  const achievementCount = profile.achievements?.length || 0

  return (
    <Card variant="glass" className="relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500 via-secondary-500 to-primary-600 opacity-90" />
      
      {/* Decorative Circles */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />

      {/* Content */}
      <div className="relative z-10 text-white">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0 group">
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center text-2xl font-bold shadow-xl group-hover:scale-110 transition-transform">
              {initials}
            </div>
            {showEarlyFounder && profile.earlyFounder && (
              <div className="absolute -top-2 -right-2">
                <Badge variant="earlyFounder" size="sm" className="shadow-lg">
                  ✨
                </Badge>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h2 className="text-2xl font-bold mb-1">{profile.displayName}</h2>
                {profile.school && profile.grade && (
                  <div className="flex items-center gap-2 text-sm text-white/90">
                    <GraduationCap className="w-4 h-4" />
                    <span>{profile.grade} • {profile.school}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-sm text-white/80 leading-relaxed mb-3 line-clamp-2">
                {profile.bio}
              </p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur-sm">
                <Award className="w-4 h-4" />
                <span className="font-semibold">{achievementCount}</span>
                <span className="text-white/80">achievement{achievementCount !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur-sm">
                <Calendar className="w-4 h-4" />
                <span className="text-white/80">
                  Since {new Date(profile.createdAt).getFullYear()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
