import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const network = searchParams.get('network')
    const limit = parseInt(searchParams.get('limit') || '50')
    const activeOnly = searchParams.get('active') === 'true'

    const agents = await prisma.aIAgent.findMany({
      where: {
        ...(network && { network: network as any }),
        ...(activeOnly && { isActive: true }),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      include: {
        patterns: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: agents,
      count: agents.length,
    })
  } catch (error) {
    console.error('Error fetching agents:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch agents',
      },
      { status: 500 }
    )
  }
}
