/**
 * OpportunityCard Component
 * 
 * Displays scholarship/program opportunity with external link.
 * Premium card design with hover effects.
 */

'use client'

import { formatDate } from '@/lib/utils'
import { Card, Badge, Button } from '@/components/ui'
import { ExternalLink, Calendar, Building } from 'lucide-react'
import type { Opportunity } from '@prisma/client'

interface OpportunityCardProps {
  opportunity: Opportunity
}

export const OpportunityCard = ({ opportunity }: OpportunityCardProps) => {
  const isUpcoming = new Date(opportunity.date) > new Date()
  const daysUntil = Math.ceil(
    (new Date(opportunity.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
    <Card variant="glass" hover className="group h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-primary-600 transition-colors">
            {opportunity.title}
          </h3>
          <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
            <Building className="w-4 h-4" />
            <span>{opportunity.provider}</span>
          </div>
        </div>
        {isUpcoming && (
          <Badge variant={daysUntil <= 7 ? 'warning' : 'success'} size="sm">
            {daysUntil <= 0 ? 'Today' : `${daysUntil}d left`}
          </Badge>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-slate-600 leading-relaxed mb-4 flex-1">
        {opportunity.description}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200/50">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(opportunity.date)}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          rightIcon={<ExternalLink className="w-4 h-4" />}
          onClick={() => window.open(opportunity.externalUrl, '_blank')}
        >
          Learn More
        </Button>
      </div>

      {/* Hover Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/0 via-secondary-500/5 to-primary-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-xl" />
    </Card>
  )
}
