/**
 * Prisma Client Singleton
 * 
 * Prevents multiple Prisma Client instances during hot-reload in development.
 * In production, creates a single instance.
 * 
 * Usage:
 *   import { prisma } from '@/lib/prisma'
 *   const users = await prisma.user.findMany()
 */

import { PrismaClient } from '@prisma/client'

// Global type declaration for development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create Prisma Client with logging in development
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

// Prevent multiple instances in development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Graceful shutdown
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}
