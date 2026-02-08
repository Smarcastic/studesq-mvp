/**
 * StatsOverview Component
 * 
 * Dashboard statistics cards showing achievement counts by type.
 * Animated counters and gradient cards.
 */

'use client'

import { useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { ACHIEVEMENT_TYPES } from '@/lib/constants'
import { Trophy, TrendingUp } from 'lucide-react'
import type { Achievement } from '@prisma/client'

interface StatsOverviewProps {
  achievements: Achievement[]
}

export const StatsOverview = ({ achievements }: StatsOverviewProps) => {
  const stats = useMemo(() => {
    const total = achievements.length
    const byType = ACHIEVEMENT_TYPES.map(type => ({
      ...type,
      count: achievements.filter(a => a.type === type.value).length,
    })).filter(t => t.count > 0)

    const thisYear = new Date().getFullYear()
    const thisYearCount = achievements.filter(
      a => new Date(a.date).getFullYear() === thisYear
    ).length

    return { total, byType, thisYearCount }
  }, [achievements])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Achievements */}
      <Card
        variant="glass"
        className="relative overflow-hidden bg-gradient-to-br from-primary-500 to-primary-600 text-white border-0"
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white/80">Total Achievements</span>
            <Trophy className="w-5 h-5 text-white/60" />
          </div>
          <p className="text-4xl font-bold mb-1">{stats.total}</p>
          <p className="text-sm text-white/80">All time</p>
        </div>
        {/* Decorative gradient */}
        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
      </Card>

      {/* This Year */}
      <Card
        variant="glass"
        className="relative overflow-hidden bg-gradient-to-br from-secondary-500 to-secondary-600 text-white border-0"
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white/80">This Year</span>
            <TrendingUp className="w-5 h-5 text-white/60" />
          </div>
          <p className="text-4xl font-bold mb-1">{stats.thisYearCount}</p>
          <p className="text-sm text-white/80">{new Date().getFullYear()}</p>
        </div>
        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
      </Card>

      {/* Top Categories */}
      {stats.byType.slice(0, 2).map((type, index) => (
        <Card
          key={type.value}
          variant="glass"
          hover
          className="relative overflow-hidden"
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-600">{type.label}</span>
              <span className="text-2xl">{type.emoji}</span>
            </div>
            <p className="text-4xl font-bold text-slate-900 mb-1">{type.count}</p>
            <p className="text-sm text-slate-500">
              {((type.count / stats.total) * 100).toFixed(0)}% of total
            </p>
          </div>
          <div
            className={`absolute -right-8 -bottom-8 w-32 h-32 rounded-full blur-2xl ${
              index === 0 ? 'bg-primary-500/10' : 'bg-secondary-500/10'
            }`}
          />
        </Card>
      ))}
    </div>
  )
}
