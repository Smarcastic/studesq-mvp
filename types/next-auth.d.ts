/**
 * NextAuth Type Extensions
 * 
 * Extends NextAuth default types to include custom fields.
 * This provides TypeScript support for session.user.role and session.user.id
 */

import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: 'STUDENT' | 'PARENT' | 'ADMIN'
      image?: string | null
    }
  }

  interface User {
    id: string
    email: string
    name: string
    role: 'STUDENT' | 'PARENT' | 'ADMIN'
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId: string
    role: string
  }
}
