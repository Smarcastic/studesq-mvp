/**
 * ProfileEditor Component
 * 
 * Form for editing student profile information.
 * Includes avatar, bio, school, and grade.
 */

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { updateProfileSchema, type UpdateProfileInput } from '@/lib/validations'
import { Input, Textarea, Button, Card } from '@/components/ui'
import { Save, User, School, GraduationCap } from 'lucide-react'

interface ProfileEditorProps {
  initialData: UpdateProfileInput
  onSubmit: (data: UpdateProfileInput) => Promise<void>
}

export const ProfileEditor = ({ initialData, onSubmit }: ProfileEditorProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: initialData,
  })

  const handleFormSubmit = async (data: UpdateProfileInput) => {
    setIsSubmitting(true)
    setSaveSuccess(false)
    
    try {
      await onSubmit(data)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      console.error('Failed to update profile:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card variant="glass" className="relative overflow-hidden">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-6 py-4 -mx-6 -mt-6 mb-6 rounded-t-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Edit Profile</h2>
            <p className="text-sm text-white/80">Update your personal information</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Display Name */}
        <Input
          {...register('displayName')}
          label="Display Name"
          placeholder="How you'd like to be called"
          leftIcon={<User className="w-5 h-5" />}
          error={errors.displayName?.message}
          required
        />

        {/* School */}
        <Input
          {...register('school')}
          label="School"
          placeholder="e.g., Lincoln High School"
          leftIcon={<School className="w-5 h-5" />}
          error={errors.school?.message}
        />

        {/* Grade */}
        <Input
          {...register('grade')}
          label="Grade/Year"
          placeholder="e.g., 10th Grade, Sophomore"
          leftIcon={<GraduationCap className="w-5 h-5" />}
          error={errors.grade?.message}
        />

        {/* Bio */}
        <Textarea
          {...register('bio')}
          label="Bio"
          placeholder="Tell us about yourself, your interests, and goals..."
          rows={4}
          showCharCount
          maxLength={500}
          error={errors.bio?.message}
          helperText="Share your story and what makes you unique"
        />

        {/* Date of Birth */}
        <Input
          {...register('dob')}
          label="Date of Birth"
          type="date"
          error={errors.dob?.message}
          helperText="Optional - helps us provide age-appropriate opportunities"
        />

        {/* Save Button */}
        <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            leftIcon={!isSubmitting ? <Save className="w-5 h-5" /> : undefined}
            disabled={!isDirty && !isSubmitting}
            className="flex-1 sm:flex-initial"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>

          {saveSuccess && (
            <span className="text-sm text-green-600 font-medium animate-fade-in">
              ✓ Changes saved successfully!
            </span>
          )}

          {isDirty && !isSubmitting && (
            <span className="text-sm text-amber-600 font-medium">
              You have unsaved changes
            </span>
          )}
        </div>
      </form>

      {/* Decorative Element */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-500/10 to-secondary-500/10 rounded-full blur-3xl -z-10" />
    </Card>
  )
}
