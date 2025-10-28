import { NextResponse } from 'next/server'
import { prisma } from '@/lib/database/client'

/**
 * Metrics Endpoint (Prometheus-compatible)
 *
 * Provides application metrics in Prometheus text format
 * Can be scraped by Prometheus or other monitoring systems
 */

export async function GET() {
  try {
    // Collect metrics
    const [protocolCount, transactionCount, protocolsByChain] = await Promise.all([
      prisma.protocol.count(),
      prisma.transaction.count(),
      prisma.protocol.groupBy({
        by: ['chain'],
        _count: { _all: true },
      }),
    ])

    // Get recent activity
    const recentTransactions = await prisma.transaction.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    })

    // Get memory usage
    const memUsage = process.memoryUsage()

    // Format as Prometheus metrics
    const metrics = [
      '# HELP x402_protocols_total Total number of protocols tracked',
      '# TYPE x402_protocols_total gauge',
      `x402_protocols_total ${protocolCount}`,
      '',
      '# HELP x402_transactions_total Total number of transactions',
      '# TYPE x402_transactions_total counter',
      `x402_transactions_total ${transactionCount}`,
      '',
      '# HELP x402_transactions_24h Transactions in last 24 hours',
      '# TYPE x402_transactions_24h gauge',
      `x402_transactions_24h ${recentTransactions}`,
      '',
      '# HELP x402_protocols_by_chain Protocols grouped by blockchain',
      '# TYPE x402_protocols_by_chain gauge',
      ...protocolsByChain.map(
        (stat: { chain: string; _count: { _all: number } }) =>
          `x402_protocols_by_chain{chain="${stat.chain}"} ${stat._count._all}`
      ),
      '',
      '# HELP nodejs_memory_heap_used_bytes Node.js heap memory used',
      '# TYPE nodejs_memory_heap_used_bytes gauge',
      `nodejs_memory_heap_used_bytes ${memUsage.heapUsed}`,
      '',
      '# HELP nodejs_memory_heap_total_bytes Node.js total heap memory',
      '# TYPE nodejs_memory_heap_total_bytes gauge',
      `nodejs_memory_heap_total_bytes ${memUsage.heapTotal}`,
      '',
      '# HELP nodejs_process_uptime_seconds Node.js process uptime',
      '# TYPE nodejs_process_uptime_seconds gauge',
      `nodejs_process_uptime_seconds ${process.uptime()}`,
      '',
    ].join('\n')

    return new NextResponse(metrics, {
      headers: {
        'Content-Type': 'text/plain; version=0.0.4',
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to collect metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
