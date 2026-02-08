/**
 * Sign In Page
 * 
 * Authentication page supporting both Google OAuth and mock demo login.
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, Button, Badge } from '@/components/ui'
import { AUTH_CONFIG } from '@/lib/constants'
import { LogIn, Chrome, Sparkles } from 'lucide-react'

export default function SignInPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    // Redirect to NextAuth Google provider
    window.location.href = '/api/auth/signin/google'
  }

  const handleMockLogin = () => {
    router.push('/auth/mock')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-primary-50 p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-secondary-500/10 animate-gradient-shift" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary-500/20 rounded-full blur-3xl animate-float-delayed" />

      {/* Sign In Card */}
      <Card variant="glass" className="w-full max-w-md relative z-10 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-lg">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <rect x="4" y="4" width="8" height="8" rx="1" fill="white" />
                <path d="M12 12L20 20V16L16 16V12H12Z" fill="white" opacity="0.6" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-slate-900">Studesq</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Welcome back
          </h1>
          <p className="text-slate-600">
            Sign in to access your student journey
          </p>
        </div>

        {/* Auth Options */}
        <div className="space-y-4">
          {/* Google OAuth (if enabled) */}
          {AUTH_CONFIG.isGoogleMode && (
            <>
              <Button
                variant="outline"
                size="lg"
                onClick={handleGoogleSignIn}
                isLoading={isLoading}
                leftIcon={!isLoading ? <Chrome className="w-5 h-5" /> : undefined}
                className="w-full"
              >
                Continue with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-500">or</span>
                </div>
              </div>
            </>
          )}

          {/* Mock Auth (if enabled) */}
          {AUTH_CONFIG.isMockMode && (
            <div className="space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-900">Demo Mode</p>
                    <p className="text-xs text-amber-700 mt-1">
                      Try Studesq with pre-loaded demo accounts. No sign-up required!
                    </p>
                  </div>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                onClick={handleMockLogin}
                leftIcon={<LogIn className="w-5 h-5" />}
                className="w-full"
              >
                Try Demo Accounts
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-slate-200 text-center">
          <p className="text-sm text-slate-600">
            Don't have an account?{' '}
            <Link href="/" className="text-primary-600 hover:text-primary-700 font-medium">
              Join the waitlist
            </Link>
          </p>
        </div>
      </Card>

      {/* Trust Badge */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <Badge variant="default" className="bg-white/80 backdrop-blur-sm shadow-lg">
          🔒 Safe & Secure
        </Badge>
      </div>
    </div>
  )
}
