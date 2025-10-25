import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const chain = searchParams.get('chain')
    const status = searchParams.get('status')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where: any = {}
    if (chain) where.chain = chain
    if (status) where.status = status

    // Build order by clause
    const orderBy: any = {}
    if (sortBy === 'activity') {
      orderBy.lastActivityAt = sortOrder
    } else if (sortBy === 'transactions') {
      orderBy.totalTransactions = sortOrder
    } else if (sortBy === 'volume') {
      orderBy.totalVolume = sortOrder
    } else {
      orderBy.createdAt = sortOrder
    }

    const [protocols, total] = await Promise.all([
      prisma.protocol.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy,
        include: {
          _count: {
            select: {
              transactions: true,
              interactions: true,
            },
          },
        },
      }),
      prisma.protocol.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: protocols,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    console.error('[API] Error fetching protocols:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch protocols' },
      { status: 500 }
    )
  }
}
