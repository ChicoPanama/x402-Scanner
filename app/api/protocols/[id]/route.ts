import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/client'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const protocol = await prisma.protocol.findUnique({
      where: { id },
      include: {
        transactions: {
          take: 10,
          orderBy: { blockTimestamp: 'desc' },
        },
        _count: {
          select: {
            transactions: true,
            interactions: true,
          },
        },
      },
    })

    if (!protocol) {
      return NextResponse.json(
        { success: false, error: 'Protocol not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: protocol,
    })
  } catch (error) {
    console.error('[API] Error fetching protocol:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch protocol' },
      { status: 500 }
    )
  }
}
