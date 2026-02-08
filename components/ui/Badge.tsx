/**
 * Badge Component
 * 
 * Small label component for tags, status, achievement types.
 * Includes special "Early Founder" variant.
 */

import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'earlyFounder'
  size?: 'sm' | 'md' | 'lg'
  icon?: React.ReactNode
}

export const Badge = ({
  children,
  className,
  variant = 'default',
  size = 'md',
  icon,
  ...props
}: BadgeProps) => {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    primary: 'bg-primary-100 text-primary-700 border-primary-200',
    secondary: 'bg-secondary-100 text-secondary-700 border-secondary-200',
    success: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-100 text-amber-700 border-amber-200',
    danger: 'bg-red-100 text-red-700 border-red-200',
    earlyFounder: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-white border-amber-300 shadow-sm',
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium rounded-full border transition-all duration-200',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {icon && <span className="w-4 h-4">{icon}</span>}
      {children}
    </span>
  )
}
