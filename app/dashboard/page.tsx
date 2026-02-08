/**
 * Dashboard Page
 * 
 * Main student dashboard showing profile, stats, and recent achievements.
 */

import { redirect } from 'next/navigation'
import { getCurrentSession, getCurrentStudentProfile } from '@/lib/auth'
import { StudentCard } from '@/components/student/StudentCard'
import { StatsOverview } from '@/components/student/StatsOverview'
import { AchievementList } from '@/components/achievement/AchievementList'
import { Button, Card } from '@/components/ui'
import { Plus, Award, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  // Check authentication
  const session = await getCurrentSession()
  
  if (!session) {
    redirect('/auth/signin')
  }

  // Get student profile (only for students)
  if (session.user.role !== 'STUDENT') {
    redirect('/') // Parents and admins have different views
  }

  const profile = await getCurrentStudentProfile()

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card variant="glass" className="max-w-md text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Profile Not Found</h2>
          <p className="text-slate-600">
            We couldn't find your student profile. Please contact support.
          </p>
        </Card>
      </div>
    )
  }

  const recentAchievements = profile.achievements.slice(0, 5)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8 animate-slide-up">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Welcome back, {profile.displayName.split(' ')[0]}! 👋
              </h1>
              <p className="text-slate-600 mt-1">
                Here's what's happening with your student journey
              </p>
            </div>
            <Link href="/profile">
              <Button variant="outline">
                Edit Profile
              </Button>
            </Link>
          </div>
        </div>

        {/* Student Profile Card */}
        <div className="mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <StudentCard 
            profile={{
              ...profile,
              achievements: profile.achievements,
            }} 
          />
        </div>

        {/* Stats Overview */}
        <div className="mb-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary-600" />
            <h2 className="text-xl font-bold text-slate-900">Your Progress</h2>
          </div>
          <StatsOverview achievements={profile.achievements} />
        </div>

        {/* Recent Achievements */}
        <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary-600" />
              <h2 className="text-xl font-bold text-slate-900">Recent Achievements</h2>
            </div>
            <div className="flex gap-2">
              <Link href="/timeline">
                <Button variant="ghost" size="sm">
                  View Timeline
                </Button>
              </Link>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add Achievement
              </Button>
            </div>
          </div>

          {recentAchievements.length > 0 ? (
            <AchievementList
              achievements={recentAchievements}
              showFilters={false}
            />
          ) : (
            <Card variant="glass" className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 mb-4">
                <Award className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Start Your Journey
              </h3>
              <p className="text-slate-600 mb-6 max-w-md mx-auto">
                Add your first achievement to begin building your student profile. 
                Include certificates, awards, and milestones.
              </p>
              <Button
                variant="primary"
                leftIcon={<Plus className="w-5 h-5" />}
              >
                Add Your First Achievement
              </Button>
            </Card>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <Link href="/opportunities">
            <Card variant="glass" hover className="group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Opportunities</h3>
                  <p className="text-sm text-slate-600">Find scholarships & programs</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/timeline">
            <Card variant="glass" hover className="group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Timeline</h3>
                  <p className="text-sm text-slate-600">View your journey</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/profile">
            <Card variant="glass" hover className="group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-secondary-500 to-secondary-600 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Edit Profile</h3>
                  <p className="text-sm text-slate-600">Update your information</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
