/**
 * Opportunities Page
 * 
 * Browse scholarships, programs, and competitions.
 */

import { prisma } from '@/lib/prisma'
import { OpportunityCard } from '@/components/opportunities/OpportunityCard'
import { Card, Badge } from '@/components/ui'
import { Compass, TrendingUp, Calendar } from 'lucide-react'

export default async function OpportunitiesPage() {
  // Fetch opportunities
  const opportunities = await prisma.opportunity.findMany({
    orderBy: { date: 'asc' },
  })

  const upcomingOpportunities = opportunities.filter(
    o => new Date(o.date) > new Date()
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
              <Compass className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-900">
                Opportunities
              </h1>
              <p className="text-slate-600 mt-1">
                Discover scholarships, programs, and competitions for students
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4">
            <Badge variant="primary" size="lg">
              <TrendingUp className="w-4 h-4 mr-1" />
              {upcomingOpportunities.length} Upcoming
            </Badge>
            <Badge variant="secondary" size="lg">
              <Calendar className="w-4 h-4 mr-1" />
              {opportunities.length} Total
            </Badge>
          </div>
        </div>

        {/* Opportunities Grid */}
        {opportunities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {opportunities.map((opportunity, index) => (
              <div
                key={opportunity.id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <OpportunityCard opportunity={opportunity} />
              </div>
            ))}
          </div>
        ) : (
          <Card variant="glass" className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 mb-4">
              <Compass className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No Opportunities Yet
            </h3>
            <p className="text-slate-600">
              Check back soon for scholarships, programs, and competitions
            </p>
          </Card>
        )}

        {/* Info Section */}
        <Card variant="bordered" className="mt-12 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center text-white">
              <Compass className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-purple-900 mb-2">
                About Opportunities
              </h3>
              <p className="text-sm text-purple-700 leading-relaxed mb-4">
                We curate scholarships, summer programs, and competitions that match student interests and goals. 
                All opportunities are verified and regularly updated.
              </p>
              <ul className="space-y-2 text-sm text-purple-700">
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 font-bold">•</span>
                  <span><strong>Verified Sources:</strong> All opportunities come from official providers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 font-bold">•</span>
                  <span><strong>Regular Updates:</strong> We add new opportunities weekly</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 font-bold">•</span>
                  <span><strong>Direct Links:</strong> Apply directly through official websites</span>
                </li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
