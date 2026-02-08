/**
 * AchievementCard Component
 * 
 * Displays individual achievement with certificate preview,
 * type badge, and download link. Premium glassmorphism design.
 */

'use client'

import { formatDate } from '@/lib/utils'
import { ACHIEVEMENT_TYPES } from '@/lib/constants'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Download, FileText, Award, Calendar } from 'lucide-react'
import type { Achievement } from '@prisma/client'

interface AchievementCardProps {
  achievement: Achievement
  showActions?: boolean
  onDownload?: () => void
}

export const AchievementCard = ({
  achievement,
  showActions = true,
  onDownload,
}: AchievementCardProps) => {
  const achievementType = ACHIEVEMENT_TYPES.find(t => t.value === achievement.type)
  const hasCertificate = !!achievement.certificatePath

  return (
    <Card 
      variant="glass" 
      hover 
      className="group transition-all duration-300 border-l-4 border-l-primary-500"
    >
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Icon/Type Badge */}
        <div className="flex-shrink-0">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
            <Award className="w-7 h-7" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 mb-1 group-hover:text-primary-600 transition-colors">
                {achievement.title}
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="primary" size="sm">
                  {achievementType?.emoji} {achievementType?.label}
                </Badge>
                <div className="flex items-center gap-1 text-sm text-slate-500">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(achievement.date)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-slate-600 leading-relaxed mb-3 line-clamp-2 group-hover:line-clamp-none transition-all">
            {achievement.description}
          </p>

          {/* Actions */}
          {showActions && hasCertificate && (
            <div className="flex items-center gap-2 pt-3 border-t border-slate-200/50">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Download className="w-4 h-4" />}
                onClick={onDownload}
              >
                Download Certificate
              </Button>
              {hasCertificate && (
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <FileText className="w-3 h-3" />
                  <span>PDF available</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hover Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/0 via-primary-500/5 to-secondary-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-xl" />
    </Card>
  )
}
