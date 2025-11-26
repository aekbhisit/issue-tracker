import { PrismaClient } from '@prisma/client'

/**
 * Global Prisma Client instance
 * 
 * Uses singleton pattern to prevent multiple instances in development
 * with hot reload.
 */
const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const db = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}

export * from '@prisma/client'

