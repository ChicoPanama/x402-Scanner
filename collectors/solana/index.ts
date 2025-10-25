#!/usr/bin/env tsx

import { getSolanaMonitor } from '@/lib/monitors/solana-monitor'
import { prisma } from '@/lib/database/client'

/**
 * Solana Chain Collector
 *
 * This collector monitors the Solana blockchain for x402 protocol deployments
 * and tracks their activity for research purposes.
 */

async function main() {
  console.log('===========================================')
  console.log('  Solana Chain x402 Protocol Monitor')
  console.log('===========================================\n')

  const monitor = getSolanaMonitor()

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\nShutting down Solana monitor...')
    monitor.stop()
    await prisma.$disconnect()
    console.log('Solana monitor stopped. Goodbye!')
    process.exit(0)
  })

  process.on('SIGTERM', async () => {
    console.log('\n\nShutting down Solana monitor...')
    monitor.stop()
    await prisma.$disconnect()
    console.log('Solana monitor stopped. Goodbye!')
    process.exit(0)
  })

  // Start monitoring
  try {
    await monitor.start()
  } catch (error) {
    console.error('Fatal error in Solana monitor:', error)
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
