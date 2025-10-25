import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const network = searchParams.get('network')
    const limit = parseInt(searchParams.get('limit') || '50')
    const isX402Only = searchParams.get('x402') === 'true'

    const tokens = await prisma.token.findMany({
      where: {
        ...(network && { network: network as any }),
        ...(isX402Only && { isX402: true }),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      include: {
        analytics: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: tokens,
      count: tokens.length,
    })
  } catch (error) {
    console.error('Error fetching tokens:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch tokens',
      },
      { status: 500 }
    )
  }
}
