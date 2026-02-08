/**
 * WaitlistForm Component
 * 
 * Email signup form for joining the waitlist.
 * Submits to /api/waitlist endpoint.
 */

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { waitlistSignupSchema, type WaitlistSignupInput } from '@/lib/validations'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { CheckCircle, Mail } from 'lucide-react'

export const WaitlistForm = () => {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<WaitlistSignupInput>({
    resolver: zodResolver(waitlistSignupSchema),
  })

  const onSubmit = async (data: WaitlistSignupInput) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to join waitlist')
      }

      setIsSubmitted(true)
      reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center animate-fade-in">
        <div className="flex justify-center mb-3">
          <CheckCircle className="w-12 h-12 text-green-500" />
        </div>
        <h3 className="text-lg font-semibold text-green-900 mb-2">
          You're on the list!
        </h3>
        <p className="text-sm text-green-700">
          We'll notify you when Studesq is ready for early access.
        </p>
        <button
          onClick={() => setIsSubmitted(false)}
          className="mt-4 text-sm text-green-600 hover:text-green-700 font-medium"
        >
          Join with another email
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            {...register('email')}
            type="email"
            placeholder="Enter your email"
            leftIcon={<Mail className="w-5 h-5" />}
            error={errors.email?.message}
            disabled={isLoading}
          />
        </div>
        <Button
          type="submit"
          size="lg"
          isLoading={isLoading}
          className="sm:w-auto"
        >
          {isLoading ? 'Joining...' : 'Join Waitlist'}
        </Button>
      </div>

      {error && (
        <p className="text-sm text-red-600 animate-fade-in">{error}</p>
      )}

      <p className="text-xs text-slate-500">
        By joining, you agree to receive updates about Studesq.
        No spam, unsubscribe anytime.
      </p>
    </form>
  )
}
