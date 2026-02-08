/**
 * Mock Login Page
 * 
 * Demo account selector for trying Studesq without OAuth.
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Button, Badge } from '@/components/ui'
import { getAllDemoAccounts } from '@/lib/auth'
import { User, Users as ParentsIcon, Shield, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function MockLoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null)

  const demoAccounts = getAllDemoAccounts()

  const handleLogin = async (email: string) => {
    setIsLoading(true)
    setSelectedEmail(email)

    try {
      const response = await fetch('/api/auth/mock-signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        throw new Error('Login failed')
      }

      // Redirect to dashboard
      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      console.error('Mock login error:', error)
      alert('Login failed. Please try again.')
    } finally {
      setIsLoading(false)
      setSelectedEmail(null)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-primary-50 p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-secondary-500/10 animate-gradient-shift" />

      <div className="w-full max-w-4xl relative z-10">
        {/* Back Button */}
        <Link
          href="/auth/signin"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to sign in
        </Link>

        <Card variant="glass" className="shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Choose a Demo Account
            </h1>
            <p className="text-slate-600">
              Select an account to explore Studesq with pre-loaded data
            </p>
          </div>

          {/* Student Accounts */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-slate-900">Student Accounts</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {demoAccounts.students.map((student) => (
                <Card
                  key={student.email}
                  variant="bordered"
                  hover
                  className="group cursor-pointer"
                  onClick={() => handleLogin(student.email)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:scale-110 transition-transform">
                      {student.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 mb-1">
                        {student.name}
                      </h3>
                      <p className="text-xs text-slate-500 truncate mb-2">
                        {student.email}
                      </p>
                      <Badge variant="primary" size="sm">
                        {student.role}
                      </Badge>
                    </div>
                  </div>
                  {isLoading && selectedEmail === student.email && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <p className="text-sm text-slate-600 text-center">Signing in...</p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>

          {/* Parent Accounts */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <ParentsIcon className="w-5 h-5 text-secondary-600" />
              <h2 className="text-lg font-semibold text-slate-900">Parent Accounts</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {demoAccounts.parents.map((parent) => (
                <Card
                  key={parent.email}
                  variant="bordered"
                  hover
                  className="group cursor-pointer"
                  onClick={() => handleLogin(parent.email)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary-500 to-secondary-600 flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:scale-110 transition-transform">
                      {parent.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 mb-1">
                        {parent.name}
                      </h3>
                      <p className="text-xs text-slate-500 truncate mb-2">
                        {parent.email}
                      </p>
                      <Badge variant="secondary" size="sm">
                        {parent.role}
                      </Badge>
                    </div>
                  </div>
                  {isLoading && selectedEmail === parent.email && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <p className="text-sm text-slate-600 text-center">Signing in...</p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>

          {/* Admin Account */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-semibold text-slate-900">Admin Account</h2>
            </div>
            <Card
              variant="bordered"
              hover
              className="group cursor-pointer max-w-md"
              onClick={() => handleLogin(demoAccounts.admin.email)}
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:scale-110 transition-transform">
                  {demoAccounts.admin.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 mb-1">
                    {demoAccounts.admin.name}
                  </h3>
                  <p className="text-xs text-slate-500 truncate mb-2">
                    {demoAccounts.admin.email}
                  </p>
                  <Badge variant="warning" size="sm">
                    {demoAccounts.admin.role}
                  </Badge>
                </div>
              </div>
              {isLoading && selectedEmail === demoAccounts.admin.email && (
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <p className="text-sm text-slate-600 text-center">Signing in...</p>
                </div>
              )}
            </Card>
          </div>

          {/* Info Box */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> These are demo accounts with pre-loaded data. 
              In production, you would sign in with your real account via Google OAuth.
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
