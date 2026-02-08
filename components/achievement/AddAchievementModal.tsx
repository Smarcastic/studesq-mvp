/**
 * AddAchievementModal Component
 * 
 * Modal form for adding new achievements.
 * Includes file upload for certificates.
 */

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createAchievementSchema, type CreateAchievementInput } from '@/lib/validations'
import { ACHIEVEMENT_TYPES } from '@/lib/constants'
import { Input, Textarea, Select, Button } from '@/components/ui'
import { X, Upload, Plus, CheckCircle } from 'lucide-react'

interface AddAchievementModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateAchievementInput & { certificate?: File }) => Promise<void>
  studentId: string
}

export const AddAchievementModal = ({
  isOpen,
  onClose,
  onSubmit,
  studentId,
}: AddAchievementModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateAchievementInput>({
    resolver: zodResolver(createAchievementSchema),
  })

  const handleFormSubmit = async (data: CreateAchievementInput) => {
    setIsSubmitting(true)
    try {
      await onSubmit({ ...data, certificate: selectedFile || undefined })
      setIsSuccess(true)
      setTimeout(() => {
        reset()
        setSelectedFile(null)
        setIsSuccess(false)
        onClose()
      }, 2000)
    } catch (error) {
      console.error('Failed to add achievement:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Add Achievement</h2>
            <p className="text-sm text-white/80 mt-1">
              Record your accomplishments and milestones
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success State */}
        {isSuccess ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Achievement Added!
            </h3>
            <p className="text-slate-600">
              Your achievement has been successfully added to your profile.
            </p>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-6">
            {/* Title */}
            <Input
              {...register('title')}
              label="Achievement Title"
              placeholder="e.g., First Place - Regional Robotics Competition"
              error={errors.title?.message}
              required
            />

            {/* Type */}
            <Select
              {...register('type')}
              label="Category"
              options={ACHIEVEMENT_TYPES.map(type => ({
                value: type.value,
                label: `${type.emoji} ${type.label}`,
              }))}
              placeholder="Select achievement type"
              error={errors.type?.message}
              required
            />

            {/* Date */}
            <Input
              {...register('date')}
              label="Date Achieved"
              type="date"
              error={errors.date?.message}
              required
            />

            {/* Description */}
            <Textarea
              {...register('description')}
              label="Description"
              placeholder="Describe your achievement, what you did, and what you learned..."
              rows={4}
              showCharCount
              maxLength={1000}
              error={errors.description?.message}
              required
            />

            {/* Certificate Upload */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Certificate (Optional)
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                  id="certificate-upload"
                />
                <label
                  htmlFor="certificate-upload"
                  className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors cursor-pointer"
                >
                  <Upload className="w-5 h-5 text-slate-400" />
                  <span className="text-sm text-slate-600">
                    {selectedFile ? selectedFile.name : 'Upload PDF or Image (max 10MB)'}
                  </span>
                </label>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Accepted formats: PDF, JPG, PNG
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                leftIcon={!isSubmitting ? <Plus className="w-5 h-5" /> : undefined}
                className="flex-1"
              >
                {isSubmitting ? 'Adding...' : 'Add Achievement'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
