#!/usr/bin/env tsx

import { solanaConnection } from '@/lib/blockchain/solana'
import { prisma } from '@/lib/database/client'

/**
 * Solana Chain Collector
 *
 * This collector monitors the Solana blockchain for x402 protocol deployments
 * and tracks their activity for research purposes.
 */

async function main() {
  console.log('Starting Solana chain collector...')

  // Verify connection
  try {
    const version = await solanaConnection.getVersion()
    console.log(`Connected to Solana. Version: ${version['solana-core']}`)

    const slot = await solanaConnection.getSlot()
    console.log(`Current slot: ${slot}`)
  } catch (error) {
    console.error('Failed to connect to Solana:', error)
    process.exit(1)
  }

  // TODO: Implement protocol detection logic
  // This will be expanded to:
  // 1. Monitor for x402 protocol deployments
  // 2. Track protocol interactions
  // 3. Store data for analysis

  console.log('Solana collector initialized. Monitoring for protocols...')

  // Keep the process running
  process.on('SIGINT', async () => {
    console.log('Shutting down Solana collector...')
    await prisma.$disconnect()
    process.exit(0)
  })
}

// Only run if this is the main module
if (require.main === module) {
  main().catch(console.error)
}

export { main }
