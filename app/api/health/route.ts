import { NextResponse } from 'next/server'
import { prisma } from '@/lib/database/client'
import { config } from '@/lib/config'

/**
 * Health Check Endpoint
 *
 * Provides comprehensive health status of the application
 * Used by load balancers, monitoring systems, and DevOps
 */

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  uptime: number
  checks: {
    database: {
      status: 'up' | 'down'
      responseTime?: number
      error?: string
    }
    redis?: {
      status: 'up' | 'down'
      responseTime?: number
      error?: string
    }
    system: {
      memory: {
        used: number
        total: number
        percentage: number
      }
      cpu: NodeJS.CpuUsage
    }
  }
  environment: string
}

export async function GET() {
  const startTime = Date.now()
  const checks: HealthCheck['checks'] = {
    database: { status: 'down' },
    system: {
      memory: {
        used: 0,
        total: 0,
        percentage: 0,
      },
      cpu: process.cpuUsage(),
    },
  }

  // Check database connection
  const dbStart = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    checks.database = {
      status: 'up',
      responseTime: Date.now() - dbStart,
    }
  } catch (error) {
    checks.database = {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }

  // Check Redis connection (if configured)
  if (config.REDIS_URL) {
    const redisStart = Date.now()
    try {
      // Try to import and ping Redis
      const { default: Redis } = await import('ioredis')
      const redis = new Redis(config.REDIS_URL)
      await redis.ping()
      await redis.quit()
      checks.redis = {
        status: 'up',
        responseTime: Date.now() - redisStart,
      }
    } catch (error) {
      checks.redis = {
        status: 'down',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // Get system metrics
  const memUsage = process.memoryUsage()
  checks.system.memory = {
    used: memUsage.heapUsed,
    total: memUsage.heapTotal,
    percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100,
  }

  // Determine overall health status
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'

  if (checks.database.status === 'down') {
    status = 'unhealthy'
  } else if (checks.redis?.status === 'down') {
    status = 'degraded'
  } else if (checks.system.memory.percentage > 90) {
    status = 'degraded'
  }

  const response: HealthCheck = {
    status,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.1.0',
    uptime: process.uptime(),
    checks,
    environment: config.NODE_ENV,
  }

  const statusCode = status === 'unhealthy' ? 503 : status === 'degraded' ? 200 : 200

  return NextResponse.json(response, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
}
