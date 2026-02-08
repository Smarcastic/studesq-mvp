/**
 * AchievementList Component
 * 
 * Displays list of achievements with filtering by type.
 * Includes empty state and loading state.
 */

'use client'

import { useState, useMemo } from 'react'
import { AchievementCard } from './AchievementCard'
import { EmptyState, LoadingSpinner, Button, Badge } from '@/components/ui'
import { ACHIEVEMENT_TYPES } from '@/lib/constants'
import { Trophy, Filter } from 'lucide-react'
import type { Achievement } from '@prisma/client'

interface AchievementListProps {
  achievements: Achievement[]
  isLoading?: boolean
  showFilters?: boolean
  onDownloadCertificate?: (achievement: Achievement) => void
}

export const AchievementList = ({
  achievements,
  isLoading = false,
  showFilters = true,
  onDownloadCertificate,
}: AchievementListProps) => {
  const [selectedType, setSelectedType] = useState<string | null>(null)

  // Filter achievements by type
  const filteredAchievements = useMemo(() => {
    if (!selectedType) return achievements
    return achievements.filter(a => a.type === selectedType)
  }, [achievements, selectedType])

  // Loading state
  if (isLoading) {
    return <LoadingSpinner text="Loading achievements..." />
  }

  // Empty state
  if (achievements.length === 0) {
    return (
      <EmptyState
        icon={Trophy}
        title="No achievements yet"
        description="Start adding your academic achievements, certifications, and extracurricular activities to build your student profile."
        action={
          <Button variant="primary">
            Add Your First Achievement
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      {showFilters && (
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Filter className="w-4 h-4" />
            <span>Filter:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedType === null ? 'primary' : 'default'}
              className="cursor-pointer"
              onClick={() => setSelectedType(null)}
            >
              All ({achievements.length})
            </Badge>
            {ACHIEVEMENT_TYPES.map(type => {
              const count = achievements.filter(a => a.type === type.value).length
              if (count === 0) return null
              
              return (
                <Badge
                  key={type.value}
                  variant={selectedType === type.value ? 'primary' : 'default'}
                  className="cursor-pointer"
                  onClick={() => setSelectedType(type.value)}
                >
                  {type.emoji} {type.label} ({count})
                </Badge>
              )
            })}
          </div>
        </div>
      )}

      {/* Achievement Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          Showing <span className="font-semibold text-slate-900">{filteredAchievements.length}</span> 
          {selectedType && ' filtered'} achievement{filteredAchievements.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Achievement Cards */}
      <div className="space-y-4">
        {filteredAchievements.map((achievement, index) => (
          <div
            key={achievement.id}
            className="animate-slide-up"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <AchievementCard
              achievement={achievement}
              onDownload={() => onDownloadCertificate?.(achievement)}
            />
          </div>
        ))}
      </div>

      {/* No results for filter */}
      {filteredAchievements.length === 0 && selectedType && (
        <EmptyState
          icon={Filter}
          title="No achievements in this category"
          description="Try selecting a different filter or add a new achievement."
          action={
            <Button variant="ghost" onClick={() => setSelectedType(null)}>
              Clear Filter
            </Button>
          }
        />
      )}
    </div>
  )
}
