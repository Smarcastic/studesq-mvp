/**
 * Card Component
 * 
 * Container component with optional header, footer, and hover effects.
 * Used for displaying content blocks throughout the app.
 */

import { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated' | 'glass'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
}

export const Card = ({
  children,
  className,
  variant = 'default',
  padding = 'md',
  hover = false,
  ...props
}: CardProps) => {
  const variants = {
    default: 'bg-white border border-slate-200 shadow-sm',
    bordered: 'bg-white border-2 border-slate-300',
    elevated: 'bg-white shadow-xl shadow-slate-200/50 border border-slate-100',
    glass: 'bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl shadow-slate-900/10',
  }

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  return (
    <div
      className={cn(
        'rounded-xl transition-all duration-300',
        variants[variant],
        paddings[padding],
        hover && 'hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02] cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export const CardHeader = ({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  )
}

export const CardTitle = ({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) => {
  return (
    <h3
      className={cn('text-xl font-bold text-slate-900 tracking-tight', className)}
      {...props}
    >
      {children}
    </h3>
  )
}

export const CardDescription = ({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) => {
  return (
    <p className={cn('text-sm text-slate-600 mt-1', className)} {...props}>
      {children}
    </p>
  )
}

export const CardContent = ({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  )
}

export const CardFooter = ({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn('mt-4 pt-4 border-t border-slate-200', className)}
      {...props}
    >
      {children}
    </div>
  )
}
