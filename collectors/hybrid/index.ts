#!/usr/bin/env tsx

import { getHybridMonitor } from '@/lib/services/hybrid-monitor'
import { prisma } from '@/lib/database/client'

/**
 * Hybrid Collector
 *
 * Combines x402scan.com data with real-time blockchain monitoring
 * for comprehensive x402 protocol tracking
 */

async function main() {
  console.log('===========================================')
  console.log('  x402 Protocol Observatory')
  console.log('  Hybrid Monitoring System')
  console.log('===========================================\n')

  console.log('Data Sources:')
  console.log('  1. x402scan.com (discovery & historical)')
  console.log('  2. Base blockchain (real-time)')
  console.log('  3. Solana blockchain (real-time)\n')

  const monitor = getHybridMonitor()

  // Handle graceful shutdown
  const shutdown = async () => {
    console.log('\n\nShutting down hybrid monitor...')
    monitor.stop()
    await prisma.$disconnect()
    console.log('Hybrid monitor stopped. Goodbye!')
    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)

  // Start hybrid monitoring
  try {
    await monitor.start()

    // Keep the process alive
    setInterval(async () => {
      // Periodically print stats
      const stats = await monitor.getComprehensiveStats()
      console.log(`\n📊 Status Update (${new Date().toLocaleTimeString()}):`)
      console.log(`   Protocols: ${stats.protocols.total} (${stats.protocols.base} Base, ${stats.protocols.solana} Solana)`)
      console.log(`   Recent Transactions (24h): ${stats.recentTransactions}`)
    }, 300000) // Every 5 minutes
  } catch (error) {
    console.error('Fatal error in hybrid monitor:', error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

// Only run if this is the main module
if (require.main === module) {
  main().catch((error) => {
    console.error('Unhandled error:', error)
    process.exit(1)
  })
}

export { main }
