/**
 * Header Component
 * 
 * Top navigation bar with logo, navigation links, and user menu.
 * Adapts based on authentication state.
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Menu, X, User, LogOut, Home, Award, Compass } from 'lucide-react'

interface HeaderProps {
  user?: {
    name: string
    email: string
    role: 'STUDENT' | 'PARENT' | 'ADMIN'
  } | null
  onSignOut?: () => void
}

export const Header = ({ user, onSignOut }: HeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  const navLinks = user
    ? [
        { href: '/dashboard', label: 'Dashboard', icon: Home },
        { href: '/timeline', label: 'Timeline', icon: Award },
        { href: '/opportunities', label: 'Opportunities', icon: Compass },
      ]
    : [
        { href: '/', label: 'Home', icon: Home },
        { href: '/opportunities', label: 'Opportunities', icon: Compass },
      ]

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 backdrop-blur-sm bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-lg bg-primary-500 flex items-center justify-center transition-transform group-hover:scale-105">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect x="4" y="4" width="8" height="8" rx="1" fill="white" />
                <path d="M12 12L20 20V16L16 16V12H12Z" fill="white" opacity="0.6" />
              </svg>
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">
              Studesq
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive(link.href)
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </span>
                </Link>
              )
            })}
          </nav>

          {/* User Menu / Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.role}</p>
                </div>
                <button
                  onClick={onSignOut}
                  className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/signin"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signin"
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 transition-colors shadow-sm"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200">
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive(link.href)
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {link.label}
                    </span>
                  </Link>
                )
              })}
              
              {user ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    onSignOut?.()
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors text-left"
                >
                  <span className="flex items-center gap-2">
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </span>
                </button>
              ) : (
                <Link
                  href="/auth/signin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 transition-colors text-center"
                >
                  Get Started
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
