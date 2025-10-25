import { getBaseMonitor } from '@/lib/monitors/base-monitor'
import { getSolanaMonitor } from '@/lib/monitors/solana-monitor'
import { getContractDiscovery } from './contract-discovery'
import { getX402ScanClient } from './x402scan-client'
import { prisma } from '@/lib/database/client'

/**
 * Hybrid Monitor
 *
 * Combines multiple data sources for comprehensive x402 protocol monitoring:
 * 1. x402scan.com - for discovering existing protocols
 * 2. Base blockchain - for real-time monitoring
 * 3. Solana blockchain - for real-time monitoring
 *
 * Strategy:
 * - Initial: Pull historical data from x402scan
 * - Ongoing: Monitor blockchains in real-time
 * - Periodic: Sync with x402scan to catch any missed protocols
 */

export class HybridMonitor {
  private baseMonitor = getBaseMonitor()
  private solanaMonitor = getSolanaMonitor()
  private contractDiscovery = getContractDiscovery()
  private x402Client = getX402ScanClient()

  private isRunning = false
  private syncInterval: NodeJS.Timeout | null = null

  constructor() {
    console.log('[HybridMonitor] Initialized')
  }

  /**
   * Start the hybrid monitoring system
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('[HybridMonitor] Already running')
      return
    }

    this.isRunning = true
    console.log('[HybridMonitor] Starting...\n')

    try {
      // Phase 1: Check x402scan availability
      console.log('=== Phase 1: x402scan Integration ===')
      const isAvailable = await this.x402Client.checkAvailability()

      if (isAvailable) {
        console.log('[HybridMonitor] ✅ x402scan.com is accessible')

        // Import historical data
        await this.syncHistoricalData()
      } else {
        console.log('[HybridMonitor] ⚠️  x402scan.com is not accessible')
        console.log('[HybridMonitor] Will proceed with blockchain monitoring only')
      }

      // Phase 2: Start blockchain monitors
      console.log('\n=== Phase 2: Blockchain Monitoring ===')
      await this.startBlockchainMonitors()

      // Phase 3: Schedule periodic sync
      if (isAvailable) {
        console.log('\n=== Phase 3: Periodic Sync ===')
        this.schedulePeriodicSync()
      }

      console.log('\n=== Hybrid Monitor Active ===')
      this.printStats()
    } catch (error) {
      console.error('[HybridMonitor] Error during startup:', error)
      this.isRunning = false
      throw error
    }
  }

  /**
   * Stop the hybrid monitor
   */
  stop(): void {
    console.log('[HybridMonitor] Stopping...')
    this.isRunning = false

    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }

    this.baseMonitor.stop()
    this.solanaMonitor.stop()

    console.log('[HybridMonitor] Stopped')
  }

  /**
   * Sync historical data from x402scan
   */
  private async syncHistoricalData(): Promise<void> {
    console.log('[HybridMonitor] Syncing historical data from x402scan...')

    try {
      const imported = await this.contractDiscovery.discoverAndImport()

      if (imported > 0) {
        console.log(`[HybridMonitor] ✅ Imported ${imported} protocols from x402scan`)
      } else {
        console.log('[HybridMonitor] No new protocols found on x402scan')
      }
    } catch (error) {
      console.error('[HybridMonitor] Error syncing historical data:', error)
    }
  }

  /**
   * Start blockchain monitors
   */
  private async startBlockchainMonitors(): Promise<void> {
    try {
      // Start Base monitor
      console.log('[HybridMonitor] Starting Base monitor...')
      this.baseMonitor.start().catch((error) => {
        console.error('[HybridMonitor] Base monitor error:', error)
      })

      // Wait a bit before starting Solana
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Start Solana monitor
      console.log('[HybridMonitor] Starting Solana monitor...')
      this.solanaMonitor.start().catch((error) => {
        console.error('[HybridMonitor] Solana monitor error:', error)
      })

      console.log('[HybridMonitor] ✅ Blockchain monitors started')
    } catch (error) {
      console.error('[HybridMonitor] Error starting blockchain monitors:', error)
      throw error
    }
  }

  /**
   * Schedule periodic sync with x402scan
   */
  private schedulePeriodicSync(): void {
    const syncIntervalMs = parseInt(process.env.SCAN_INTERVAL_MS || '300000') // 5 minutes default

    console.log(`[HybridMonitor] Scheduling sync every ${syncIntervalMs / 1000}s`)

    this.syncInterval = setInterval(async () => {
      console.log('[HybridMonitor] Running periodic sync with x402scan...')
      await this.syncWithX402Scan()
    }, syncIntervalMs)
  }

  /**
   * Periodic sync with x402scan
   */
  private async syncWithX402Scan(): Promise<void> {
    try {
      const protocols = await this.x402Client.fetchRecentActivity()

      if (protocols.length === 0) {
        console.log('[HybridMonitor] No new activity from x402scan')
        return
      }

      let newCount = 0

      for (const protocol of protocols) {
        // Check if we already have this protocol
        const existing = await prisma.protocol.findUnique({
          where: {
            chain_address: {
              chain: protocol.chain,
              address: protocol.address.toLowerCase(),
            },
          },
        })

        if (!existing) {
          // New protocol discovered via x402scan
          await this.contractDiscovery.storeProtocol(protocol, false)
          newCount++
        }
      }

      if (newCount > 0) {
        console.log(`[HybridMonitor] ✅ Discovered ${newCount} new protocols from x402scan`)
      }
    } catch (error) {
      console.error('[HybridMonitor] Error during periodic sync:', error)
    }
  }

  /**
   * Print monitoring statistics
   */
  private async printStats(): Promise<void> {
    try {
      const stats = await this.contractDiscovery.getStats()
      const monitorStats = {
        base: this.baseMonitor.getStats(),
        solana: this.solanaMonitor.getStats(),
      }

      console.log('\n📊 Current Status:')
      console.log(`   Total Protocols: ${stats.total}`)
      console.log(`   - Base: ${stats.base}`)
      console.log(`   - Solana: ${stats.solana}`)
      console.log(`   - Verified: ${stats.verified}`)
      console.log('\n🔍 Monitor Status:')
      console.log(`   Base: ${monitorStats.base.isRunning ? '🟢 Running' : '🔴 Stopped'}`)
      if (monitorStats.base.lastProcessedBlock) {
        console.log(`   - Last Block: ${monitorStats.base.lastProcessedBlock}`)
      }
      console.log(`   Solana: ${monitorStats.solana.isRunning ? '🟢 Running' : '🔴 Stopped'}`)
      if (monitorStats.solana.lastProcessedSlot) {
        console.log(`   - Last Slot: ${monitorStats.solana.lastProcessedSlot}`)
      }
      console.log('')
    } catch (error) {
      console.error('[HybridMonitor] Error printing stats:', error)
    }
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      monitors: {
        base: this.baseMonitor.getStats(),
        solana: this.solanaMonitor.getStats(),
      },
    }
  }

  /**
   * Force a sync with x402scan
   */
  async forceSync(): Promise<void> {
    console.log('[HybridMonitor] Force syncing with x402scan...')
    await this.syncWithX402Scan()
    await this.printStats()
  }

  /**
   * Get comprehensive statistics
   */
  async getComprehensiveStats() {
    const [protocolStats, recentProtocols, recentTransactions] = await Promise.all([
      this.contractDiscovery.getStats(),
      prisma.protocol.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          address: true,
          chain: true,
          name: true,
          createdAt: true,
        },
      }),
      prisma.transaction.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      }),
    ])

    return {
      protocols: protocolStats,
      recentProtocols,
      recentTransactions,
      monitors: this.getStatus(),
    }
  }
}

// Singleton instance
let hybridMonitorInstance: HybridMonitor | null = null

export function getHybridMonitor(): HybridMonitor {
  if (!hybridMonitorInstance) {
    hybridMonitorInstance = new HybridMonitor()
  }
  return hybridMonitorInstance
}
