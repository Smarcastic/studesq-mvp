/**
 * Root Layout
 * 
 * Global layout with providers, header, and footer.
 */

import { Inter } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { getCurrentSession } from '@/lib/auth'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Studesq - Your Student Journey',
  description: 'A trust-first student journey hub. Store academics, achievements, and certificates in one secure place.',
  keywords: ['student', 'portfolio', 'achievements', 'education', 'academic records'],
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get current session for header
  const session = await getCurrentSession()

  const handleSignOut = async () => {
    'use server'
    // Sign out handled client-side
  }

  return (
    <html lang="en" className="scroll-smooth">
      <body className={inter.className}>
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Header 
              user={session?.user || null}
              onSignOut={handleSignOut}
            />
            
            <main className="flex-1">
              {children}
            </main>
            
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  )
}
