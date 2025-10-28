import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const chain = searchParams.get('chain')

    // Build where clause
    const where: any = {}
    if (chain) where.chain = chain

    // Get overall stats
    const [
      totalProtocols,
      activeProtocols,
      totalTransactions,
      recentProtocols,
    ] = await Promise.all([
      prisma.protocol.count({ where }),
      prisma.protocol.count({
        where: {
          ...where,
          status: 'ACTIVE',
        },
      }),
      prisma.transaction.count({
        where: chain ? { chain: chain as any } : undefined,
      }),
      prisma.protocol.findMany({
        where,
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          address: true,
          chain: true,
          createdAt: true,
          totalTransactions: true,
        },
      }),
    ])

    // Get chain breakdown
    const chainStats = await prisma.protocol.groupBy({
      by: ['chain'],
      _count: {
        _all: true,
      },
      where,
    })

    return NextResponse.json({
      success: true,
      data: {
        totalProtocols,
        activeProtocols,
        totalTransactions,
        recentProtocols,
        chainBreakdown: chainStats.map((stat: { chain: string; _count: { _all: number } }) => ({
          chain: stat.chain,
          count: stat._count._all,
        })),
      },
    })
  } catch (error) {
    console.error('[API] Error fetching stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
