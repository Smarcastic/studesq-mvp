/**
 * Timeline Component
 * 
 * Visual timeline of student achievements grouped by year.
 * Premium design with animated timeline line and milestone markers.
 */

'use client'

import { useMemo } from 'react'
import { groupByYear, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { ACHIEVEMENT_TYPES } from '@/lib/constants'
import { Award, Calendar } from 'lucide-react'
import type { Achievement } from '@prisma/client'

interface TimelineProps {
  achievements: Achievement[]
}

export const Timeline = ({ achievements }: TimelineProps) => {
  // Group achievements by year
  const achievementsByYear = useMemo(() => {
    const grouped = groupByYear(achievements)
    // Sort years in descending order
    return Object.entries(grouped)
      .sort(([yearA], [yearB]) => parseInt(yearB) - parseInt(yearA))
      .map(([year, items]) => ({
        year: parseInt(year),
        achievements: items.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        ),
      }))
  }, [achievements])

  if (achievements.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
          <Calendar className="w-8 h-8 text-slate-400" />
        </div>
        <p className="text-slate-600">No timeline data yet</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Timeline Line */}
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-500 via-secondary-500 to-primary-500 opacity-20" />

      {/* Year Groups */}
      <div className="space-y-12">
        {achievementsByYear.map(({ year, achievements: yearAchievements }, yearIndex) => (
          <div
            key={year}
            className="relative animate-slide-up"
            style={{ animationDelay: `${yearIndex * 0.1}s` }}
          >
            {/* Year Marker */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative z-10 flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 text-white font-bold text-lg shadow-xl">
                <span>{year}</span>
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 animate-ping opacity-20" />
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-slate-300 to-transparent" />
              <Badge variant="secondary" size="sm">
                {yearAchievements.length} achievement{yearAchievements.length !== 1 ? 's' : ''}
              </Badge>
            </div>

            {/* Achievements for this year */}
            <div className="ml-24 space-y-4">
              {yearAchievements.map((achievement, achIndex) => {
                const achievementType = ACHIEVEMENT_TYPES.find(t => t.value === achievement.type)
                
                return (
                  <div
                    key={achievement.id}
                    className="relative group animate-fade-in"
                    style={{ animationDelay: `${(yearIndex * 0.1) + (achIndex * 0.05)}s` }}
                  >
                    {/* Connector Line */}
                    <div className="absolute -left-16 top-8 w-8 h-px bg-gradient-to-r from-primary-300 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                    
                    {/* Dot */}
                    <div className="absolute -left-[4.5rem] top-6 w-3 h-3 rounded-full bg-white border-2 border-primary-500 shadow-md group-hover:scale-150 group-hover:shadow-lg transition-all" />

                    {/* Achievement Card */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-slate-200 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer">
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white shadow-md">
                          <Award className="w-5 h-5" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className="font-semibold text-slate-900 group-hover:text-primary-600 transition-colors">
                              {achievement.title}
                            </h4>
                            <Badge variant="primary" size="sm">
                              {achievementType?.emoji}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 mb-2 line-clamp-2">
                            {achievement.description}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(achievement.date, 'MMM d, yyyy')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Timeline Start Marker */}
      <div className="flex items-center gap-4 mt-12">
        <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full bg-slate-200 text-slate-600 shadow-md">
          <Award className="w-5 h-5" />
        </div>
        <p className="text-sm text-slate-500 italic">Your journey starts here</p>
      </div>
    </div>
  )
}
