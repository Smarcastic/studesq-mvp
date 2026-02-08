/**
 * LoadingSpinner Component
 * 
 * Simple loading indicator with optional text.
 * Used throughout the app for async operations.
 */

import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

export interface LoadingSpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  fullScreen?: boolean
}

export const LoadingSpinner = ({
  size = 'md',
  text,
  fullScreen = false,
  className,
  ...props
}: LoadingSpinnerProps) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  const spinner = (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3',
        fullScreen && 'min-h-screen',
        className
      )}
      {...props}
    >
      <Loader2 className={cn('animate-spin text-primary-500', sizes[size])} />
      {text && <p className="text-sm text-slate-600">{text}</p>}
    </div>
  )

  return spinner
}
