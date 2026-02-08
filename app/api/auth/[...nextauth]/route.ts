/**
 * NextAuth Configuration
 * 
 * Handles Google OAuth authentication when AUTH_MODE=google.
 * Falls back gracefully if OAuth credentials are not configured.
 */

import NextAuth, { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import { AUTH_CONFIG } from '@/lib/constants'

export const authOptions: NextAuthOptions = {
  // Use Prisma adapter for database sessions
  adapter: PrismaAdapter(prisma),
  
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code'
        }
      }
    }),
  ],

  // Custom pages
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },

  // Session configuration
  session: {
    strategy: 'jwt',
    maxAge: AUTH_CONFIG.sessionMaxAge,
  },

  // Callbacks for custom logic
  callbacks: {
    async signIn({ user, account, profile }) {
      // Only allow sign-in if OAuth mode is enabled
      if (!AUTH_CONFIG.isGoogleMode) {
        console.warn('Google sign-in attempted but AUTH_MODE is not set to "google"')
        return false
      }

      // Check if user exists in database
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email || '' },
      })

      // If user doesn't exist, create them
      if (!existingUser && user.email) {
        await prisma.user.create({
          data: {
            email: user.email,
            name: user.name || user.email,
            role: 'STUDENT', // Default role - can be changed later
            googleId: account?.providerAccountId,
          },
        })
      }

      return true
    },

    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.role = user.role
        token.userId = user.id
      }

      return token
    },

    async session({ session, token }) {
      // Add custom fields to session
      if (session.user) {
        session.user.role = token.role as string
        session.user.id = token.userId as string
      }

      return session
    },

    async redirect({ url, baseUrl }) {
      // Redirect to dashboard after sign in
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`
      } else if (new URL(url).origin === baseUrl) {
        return url
      }
      return `${baseUrl}/dashboard`
    },
  },

  // Events for logging
  events: {
    async signIn({ user }) {
      console.log(`User signed in: ${user.email}`)
    },
    async signOut({ session }) {
      console.log(`User signed out`)
    },
  },

  // Debug mode in development
  debug: process.env.NODE_ENV === 'development',
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
