/**
 * Landing Page
 * 
 * Main marketing page with Hero, features, and waitlist signup.
 */

import { Hero } from '@/components/landing/Hero'
import { WaitlistForm } from '@/components/landing/WaitlistForm'
import { Card } from '@/components/ui/Card'
import { Shield, Lock, Award, Users, Zap, Globe } from 'lucide-react'

export default function LandingPage() {
  const features = [
    {
      icon: Shield,
      title: 'Privacy First',
      description: 'Your data is private by default. Share only what you want, when you want.',
      color: 'from-primary-500 to-primary-600',
    },
    {
      icon: Lock,
      title: 'Parent-Approved Access',
      description: 'Parents get read-only access. Students always maintain control.',
      color: 'from-secondary-500 to-secondary-600',
    },
    {
      icon: Award,
      title: 'Achievement Tracking',
      description: 'Store certificates, awards, and milestones in one secure place.',
      color: 'from-emerald-500 to-emerald-600',
    },
    {
      icon: Users,
      title: 'Shareable Profiles',
      description: 'Create a portfolio view to share with colleges and scholarships.',
      color: 'from-amber-500 to-amber-600',
    },
    {
      icon: Zap,
      title: 'Opportunity Discovery',
      description: 'Find relevant scholarships, programs, and competitions.',
      color: 'from-purple-500 to-purple-600',
    },
    {
      icon: Globe,
      title: 'Always Accessible',
      description: 'Access your journey from anywhere, on any device.',
      color: 'from-pink-500 to-pink-600',
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <Hero />

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Built for students, trusted by parents
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              A single, secure place to document your academic journey from middle school through college applications.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card
                  key={feature.title}
                  variant="glass"
                  hover
                  className="group"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Waitlist Section */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-primary-50 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl" />
        
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Join the early access list
            </h2>
            <p className="text-lg text-slate-600">
              Be among the first to experience Studesq. Early members get special perks and lifetime benefits.
            </p>
          </div>

          <Card variant="glass" className="max-w-xl mx-auto">
            <WaitlistForm />
          </Card>

          <p className="text-center text-sm text-slate-500 mt-6">
            Join <span className="font-semibold text-slate-700">500+</span> students already on the waitlist
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-500 to-secondary-500 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to own your student journey?
          </h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            Start building your academic profile today. No credit card required, no commitments.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/auth/signin"
              className="px-8 py-4 bg-white text-primary-600 rounded-lg font-semibold hover:bg-slate-50 transition-all shadow-xl hover:shadow-2xl hover:scale-105"
            >
              Get Started Free
            </a>
            <a
              href="#features"
              className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 rounded-lg font-semibold hover:bg-white/20 transition-all"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
