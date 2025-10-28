import { PrismaClient } from '@prisma/client'
import { config, isDevelopment } from '@/lib/config'

/**
 * Database Connection Pool Configuration
 *
 * Optimizes Prisma client for production use with connection pooling
 */

// Extend PrismaClient with custom configuration
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: isDevelopment ? ['query', 'error', 'warn'] : ['error'],

    // Connection pool configuration
    datasources: {
      db: {
        url: config.DATABASE_URL,
      },
    },
  })
}

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: ReturnType<typeof prismaClientSingleton> | undefined
}

// Singleton pattern for PrismaClient
export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

if (isDevelopment) globalThis.prismaGlobal = prisma

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await prisma.$disconnect()
  process.exit(0)
})

// Connection pool monitoring
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database connection check failed:', error)
    return false
  }
}

// Get connection pool stats
export function getPoolStats() {
  return {
    activeConnections: 0, // Prisma doesn't expose this directly
    waitingConnections: 0,
  }
}
