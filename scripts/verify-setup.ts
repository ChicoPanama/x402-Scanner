#!/usr/bin/env tsx

/**
 * Setup Verification Script
 *
 * Verifies that all components of the x402 Observatory are properly configured
 * and can connect to required services.
 */

import { prisma } from '@/lib/database/client'
import { baseClient } from '@/lib/blockchain/base'
import { solanaConnection } from '@/lib/blockchain/solana'
import { getX402ScanClient } from '@/lib/services/x402scan-client'

class SetupVerifier {
  private errors: string[] = []
  private warnings: string[] = []
  private successes: string[] = []

  async verify() {
    console.log('================================')
    console.log('x402 Observatory Setup Verification')
    console.log('================================\n')

    await this.checkEnvironment()
    await this.checkDatabase()
    await this.checkBaseConnection()
    await this.checkSolanaConnection()
    await this.checkX402Scan()

    this.printResults()
  }

  async checkEnvironment() {
    console.log('📋 Checking Environment Variables...')

    const required = [
      'DATABASE_URL',
    ]

    const recommended = [
      'BASE_RPC_URL',
      'SOLANA_RPC_URL',
      'X402SCAN_URL',
    ]

    for (const envVar of required) {
      if (!process.env[envVar]) {
        this.errors.push(`Missing required environment variable: ${envVar}`)
        console.log(`   ❌ ${envVar}: Missing`)
      } else {
        this.successes.push(`Environment variable ${envVar} is set`)
        console.log(`   ✅ ${envVar}: Set`)
      }
    }

    for (const envVar of recommended) {
      if (!process.env[envVar]) {
        this.warnings.push(`Recommended environment variable not set: ${envVar}`)
        console.log(`   ⚠️  ${envVar}: Not set (using defaults)`)
      } else {
        console.log(`   ✅ ${envVar}: Set`)
      }
    }

    console.log('')
  }

  async checkDatabase() {
    console.log('🗄️  Checking Database Connection...')

    try {
      // Try to connect
      await prisma.$connect()
      console.log('   ✅ Database connection successful')
      this.successes.push('Database connection established')

      // Check if schema exists
      try {
        const protocolCount = await prisma.protocol.count()
        console.log(`   ✅ Schema exists (${protocolCount} protocols in database)`)
        this.successes.push(`Database schema validated (${protocolCount} protocols)`)
      } catch (error) {
        this.errors.push('Database schema not initialized')
        console.log('   ❌ Schema not initialized')
        console.log('      Run: npx prisma generate && npx prisma db push')
      }
    } catch (error) {
      this.errors.push(`Database connection failed: ${error}`)
      console.log('   ❌ Database connection failed')
      console.log(`      Error: ${error}`)
    }

    console.log('')
  }

  async checkBaseConnection() {
    console.log('🔗 Checking Base Network Connection...')

    try {
      const blockNumber = await baseClient.getBlockNumber()
      console.log(`   ✅ Connected to Base (Block: ${blockNumber})`)
      this.successes.push(`Base network connection established (Block ${blockNumber})`)
    } catch (error) {
      this.errors.push(`Base network connection failed: ${error}`)
      console.log('   ❌ Base connection failed')
      console.log(`      Error: ${error}`)
      console.log('      Check BASE_RPC_URL in .env')
    }

    console.log('')
  }

  async checkSolanaConnection() {
    console.log('🔗 Checking Solana Network Connection...')

    try {
      const version = await solanaConnection.getVersion()
      const slot = await solanaConnection.getSlot()
      console.log(`   ✅ Connected to Solana (Slot: ${slot}, Version: ${version['solana-core']})`)
      this.successes.push(`Solana network connection established (Slot ${slot})`)
    } catch (error) {
      this.errors.push(`Solana network connection failed: ${error}`)
      console.log('   ❌ Solana connection failed')
      console.log(`      Error: ${error}`)
      console.log('      Check SOLANA_RPC_URL in .env')
    }

    console.log('')
  }

  async checkX402Scan() {
    console.log('🌐 Checking x402scan.com Availability...')

    try {
      const client = getX402ScanClient()
      const available = await client.checkAvailability()

      if (available) {
        console.log('   ✅ x402scan.com is accessible')
        this.successes.push('x402scan.com is accessible')
      } else {
        this.warnings.push('x402scan.com is not accessible')
        console.log('   ⚠️  x402scan.com is not accessible')
        console.log('      Will use blockchain monitoring only')
      }
    } catch (error) {
      this.warnings.push(`x402scan.com check failed: ${error}`)
      console.log('   ⚠️  Could not check x402scan.com')
      console.log(`      Error: ${error}`)
    }

    console.log('')
  }

  printResults() {
    console.log('================================')
    console.log('Verification Results')
    console.log('================================\n')

    console.log(`✅ Successes: ${this.successes.length}`)
    console.log(`⚠️  Warnings: ${this.warnings.length}`)
    console.log(`❌ Errors: ${this.errors.length}\n`)

    if (this.errors.length > 0) {
      console.log('❌ ERRORS:\n')
      this.errors.forEach((error) => {
        console.log(`   • ${error}`)
      })
      console.log('')
    }

    if (this.warnings.length > 0) {
      console.log('⚠️  WARNINGS:\n')
      this.warnings.forEach((warning) => {
        console.log(`   • ${warning}`)
      })
      console.log('')
    }

    if (this.errors.length === 0) {
      console.log('🎉 Setup verification passed!\n')
      console.log('You can now start the Observatory:\n')
      console.log('   Terminal 1: npm run dev')
      console.log('   Terminal 2: npm run collect:hybrid\n')
      console.log('Then visit: http://localhost:3000/dashboard\n')
    } else {
      console.log('⚠️  Setup has errors. Please fix them before continuing.\n')
      process.exit(1)
    }
  }
}

async function main() {
  const verifier = new SetupVerifier()

  try {
    await verifier.verify()
  } catch (error) {
    console.error('Verification failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}

export { SetupVerifier }
