/**
 * Timeline Page
 * 
 * Visual timeline of student achievements organized by year.
 */

import { redirect } from 'next/navigation'
import { getCurrentSession, getCurrentStudentProfile } from '@/lib/auth'
import { Timeline } from '@/components/timeline/Timeline'
import { Card, Button, Badge } from '@/components/ui'
import { Calendar, Download, Share2 } from 'lucide-react'

export default async function TimelinePage() {
  // Check authentication
  const session = await getCurrentSession()
  
  if (!session) {
    redirect('/auth/signin')
  }

  // Get student profile
  if (session.user.role !== 'STUDENT') {
    redirect('/')
  }

  const profile = await getCurrentStudentProfile()

  if (!profile) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white shadow-lg">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-900">
                Your Journey Timeline
              </h1>
              <p className="text-slate-600 mt-1">
                A visual story of your achievements and milestones
              </p>
            </div>
          </div>

          {/* Stats Bar */}
          <Card variant="glass" className="bg-gradient-to-r from-primary-500/10 to-secondary-500/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-sm text-slate-600">Total Achievements</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {profile.achievements.length}
                  </p>
                </div>
                <div className="h-12 w-px bg-slate-300" />
                <div>
                  <p className="text-sm text-slate-600">Years Active</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {new Set(profile.achievements.map(a => new Date(a.date).getFullYear())).size || 0}
                  </p>
                </div>
                <div className="h-12 w-px bg-slate-300" />
                <div>
                  <p className="text-sm text-slate-600">Latest</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {profile.achievements[0] 
                      ? new Date(profile.achievements[0].date).getFullYear()
                      : new Date().getFullYear()
                    }
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
                  Export PDF
                </Button>
                <Button variant="outline" size="sm" leftIcon={<Share2 className="w-4 h-4" />}>
                  Share Timeline
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Timeline */}
        <div className="relative">
          {profile.achievements.length > 0 ? (
            <Timeline achievements={profile.achievements} />
          ) : (
            <Card variant="glass" className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                <Calendar className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Your Timeline Awaits
              </h3>
              <p className="text-slate-600 mb-6">
                Add achievements to see your journey come to life
              </p>
              <Button variant="primary">
                Add Your First Achievement
              </Button>
            </Card>
          )}
        </div>

        {/* Info Card */}
        {profile.achievements.length > 0 && (
          <Card variant="bordered" className="mt-8 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center text-white">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-1">About Your Timeline</h3>
                <p className="text-sm text-blue-700 leading-relaxed">
                  Your timeline shows your achievements organized by year, making it easy to see your growth over time. 
                  Share this view with colleges, scholarship committees, or keep it private for your own reflection.
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
