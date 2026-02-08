/**
 * Hero Component
 * 
 * Landing page hero section with headline, description, and CTA.
 * Includes subtle gradient animation and trust-forward messaging.
 */

'use client'

import Link from 'next/link'
import { ArrowRight, Shield, Lock, Award } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-primary-50">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-secondary-500/10 animate-gradient-shift" />
      
      {/* Floating Orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary-500/20 rounded-full blur-3xl animate-float-delayed" />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-32 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="text-center lg:text-left">
            {/* Trust Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-6 animate-fade-in">
              <Shield className="w-4 h-4" />
              <span>Trust-first student records</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight mb-6 animate-slide-up">
              Your student journey—
              <span className="block mt-2 bg-clip-text text-transparent bg-gradient-to-r from-primary-500 via-primary-600 to-secondary-500 animate-gradient-text">
                safe & yours.
              </span>
            </h1>

            {/* Description */}
            <p className="text-lg sm:text-xl text-slate-600 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
              A single, persistent profile for all your achievements, certificates, and 
              academic milestones. Private by default, shareable when you choose.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Link href="/auth/signin">
                <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                  Get Started Free
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline">
                  Learn More
                </Button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center gap-6 mt-12 justify-center lg:justify-start text-sm text-slate-600 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary-500" />
                <span>Private by default</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary-500" />
                <span>Parent-approved access</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-primary-500" />
                <span>Your achievements, your way</span>
              </div>
            </div>
          </div>

          {/* Right Column - Visual */}
          <div className="relative hidden lg:block">
            <div className="relative animate-fade-in" style={{ animationDelay: '0.4s' }}>
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-secondary-500/20 blur-3xl rounded-xl" />
              
              {/* Mock Browser Window */}
              <div className="relative bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden transform hover:scale-105 transition-transform duration-500">
                {/* Browser Chrome */}
                <div className="bg-slate-100/80 backdrop-blur-sm px-4 py-3 border-b border-slate-200/50 flex items-center gap-2">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400 shadow-sm" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400 shadow-sm" />
                    <div className="w-3 h-3 rounded-full bg-green-400 shadow-sm" />
                  </div>
                  <div className="flex-1 bg-white/80 backdrop-blur-sm rounded px-3 py-1 text-xs text-slate-400 ml-2 shadow-inner">
                    studesq.com/dashboard
                  </div>
                </div>

                {/* Mock Content */}
                <div className="p-6 space-y-4 bg-gradient-to-br from-white/50 to-slate-50/50 backdrop-blur-sm">
                  {/* Profile Card */}
                  <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl p-4 text-white shadow-lg transform hover:-translate-y-1 transition-transform">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center font-bold shadow-lg">
                        AC
                      </div>
                      <div>
                        <p className="font-semibold">Alice Chen</p>
                        <p className="text-sm text-white/90">10th Grade • Lincoln HS</p>
                      </div>
                    </div>
                  </div>

                  {/* Achievement Cards */}
                  <div className="space-y-2">
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-slate-200/50 shadow-md transform hover:translate-x-2 hover:shadow-lg transition-all">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 shadow-sm" />
                        <p className="text-sm font-medium text-slate-900">First Place - Robotics</p>
                      </div>
                      <p className="text-xs text-slate-500 ml-4">Nov 2024</p>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-slate-200/50 shadow-md transform hover:translate-x-2 hover:shadow-lg transition-all">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-secondary-500 to-secondary-600 shadow-sm" />
                        <p className="text-sm font-medium text-slate-900">AP Computer Science A</p>
                      </div>
                      <p className="text-xs text-slate-500 ml-4">May 2024</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Badge */}
              <div className="absolute -top-4 -right-4 bg-gradient-to-r from-amber-400 to-yellow-500 text-white px-4 py-2 rounded-xl shadow-2xl text-sm font-bold transform rotate-3 hover:rotate-6 transition-transform animate-bounce-slow">
                ✨ Early Founder
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
