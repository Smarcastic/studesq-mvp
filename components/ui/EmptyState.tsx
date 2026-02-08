/**
 * EmptyState Component
 * 
 * Displays friendly message when no data is available.
 * Used for empty achievement lists, search results, etc.
 */

import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
      {...props}
    >
      {Icon && (
        <div className="mb-4 p-3 rounded-full bg-slate-100">
          <Icon className="w-8 h-8 text-slate-400" />
        </div>
      )}
      
      <h3 className="text-lg font-semibold text-slate-900 mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-sm text-slate-600 max-w-md mb-6">
          {description}
        </p>
      )}
      
      {action && <div>{action}</div>}
    </div>
  )
}
