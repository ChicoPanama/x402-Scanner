import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const [
      totalTokens,
      totalAgents,
      tokensToday,
      agentsToday,
      x402Tokens,
      baseTokens,
      solanaTokens,
    ] = await Promise.all([
      prisma.token.count(),
      prisma.aIAgent.count(),
      prisma.token.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.aIAgent.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.token.count({
        where: { isX402: true },
      }),
      prisma.token.count({
        where: { network: 'BASE' },
      }),
      prisma.token.count({
        where: { network: 'SOLANA' },
      }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        totalTokens,
        totalAgents,
        tokensToday,
        agentsToday,
        x402Tokens,
        networks: {
          base: baseTokens,
          solana: solanaTokens,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch stats',
      },
      { status: 500 }
    )
  }
}
