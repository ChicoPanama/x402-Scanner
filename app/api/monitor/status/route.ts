import { NextResponse } from 'next/server'
import { getBaseMonitor } from '@/lib/monitors/base-monitor'
import { getSolanaMonitor } from '@/lib/monitors/solana-monitor'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const baseMonitor = getBaseMonitor()
    const solanaMonitor = getSolanaMonitor()

    return NextResponse.json({
      success: true,
      data: {
        base: baseMonitor.getStats(),
        solana: solanaMonitor.getStats(),
      },
    })
  } catch (error) {
    console.error('[API] Error fetching monitor status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch monitor status' },
      { status: 500 }
    )
  }
}
