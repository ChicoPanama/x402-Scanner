import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const chain = searchParams.get('chain')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const protocols = await prisma.protocol.findMany({
      where: {
        ...(chain && { chain: chain as any }),
        ...(status && { status: status as any }),
      },
      take: limit,
      skip: offset,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: {
            transactions: true,
            interactions: true,
          },
        },
      },
    })

    const total = await prisma.protocol.count({
      where: {
        ...(chain && { chain: chain as any }),
        ...(status && { status: status as any }),
      },
    })

    return NextResponse.json({
      data: protocols,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    console.error('Error fetching protocols:', error)
    return NextResponse.json(
      { error: 'Failed to fetch protocols' },
      { status: 500 }
    )
  }
}
