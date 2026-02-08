/**
 * Profile Page
 * 
 * Edit student profile information and settings.
 */

import { redirect } from 'next/navigation'
import { getCurrentSession, getCurrentStudentProfile } from '@/lib/auth'
import { ProfileEditor } from '@/components/student/ProfileEditor'
import { Card } from '@/components/ui'
import { User } from 'lucide-react'

export default async function ProfilePage() {
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

  const handleUpdateProfile = async (data: any) => {
    'use server'
    // This will be implemented with client-side form handling
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white shadow-lg">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Profile Settings
              </h1>
              <p className="text-slate-600 mt-1">
                Manage your personal information and preferences
              </p>
            </div>
          </div>
        </div>

        {/* Profile Editor */}
        <ProfileEditor
          initialData={{
            displayName: profile.displayName,
            bio: profile.bio,
            school: profile.school,
            grade: profile.grade,
            dob: profile.dob?.toISOString(),
          }}
          onSubmit={async (data) => {
            // Client-side implementation will handle this
            console.log('Update profile:', data)
          }}
        />

        {/* Additional Settings */}
        <div className="mt-8 space-y-6">
          {/* Parent Access */}
          <Card variant="glass">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Parent Access
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-slate-900">Linked Parents</p>
                  <p className="text-sm text-slate-600">
                    {profile.parentLinks.length} parent{profile.parentLinks.length !== 1 ? 's' : ''} have read-only access
                  </p>
                </div>
                <button className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
                  Manage Access
                </button>
              </div>
            </div>
          </Card>

          {/* Privacy */}
          <Card variant="glass">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Privacy & Sharing
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-slate-900">Profile Visibility</p>
                  <p className="text-sm text-slate-600">
                    Your profile is currently private
                  </p>
                </div>
                <button className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
                  Change Settings
                </button>
              </div>
            </div>
          </Card>

          {/* Account */}
          <Card variant="glass">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Account Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-slate-900">Email</p>
                  <p className="text-sm text-slate-600">{session.user.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between py-2 pt-3 border-t border-slate-200">
                <div>
                  <p className="font-medium text-slate-900">Member Since</p>
                  <p className="text-sm text-slate-600">
                    {new Date(profile.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
