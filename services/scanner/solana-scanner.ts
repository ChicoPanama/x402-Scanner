import { Connection, PublicKey, ParsedInstruction } from '@solana/web3.js'
import { PrismaClient } from '@prisma/client'
import Redis from 'redis'
import { checkForX402Pattern } from '../utils/token-analyzer'

const prisma = new PrismaClient()
const redisClient = Redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
})

const connection = new Connection(
  process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  'confirmed'
)

// Token Program ID for SPL tokens
const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'

interface TokenDetection {
  address: string
  signature: string
  slot: number
}

class SolanaScanner {
  private isRunning = false
  private lastProcessedSlot = 0

  async initialize() {
    await redisClient.connect()

    // Get last processed slot from Redis or start from current
    const lastSlot = await redisClient.get('solana:lastSlot')
    if (lastSlot) {
      this.lastProcessedSlot = parseInt(lastSlot, 10)
    } else {
      this.lastProcessedSlot = await connection.getSlot()
    }

    console.log(`Solana Scanner initialized at slot ${this.lastProcessedSlot}`)
  }

  async start() {
    if (this.isRunning) {
      console.log('Solana scanner is already running')
      return
    }

    this.isRunning = true
    console.log('Starting Solana blockchain scanner...')

    while (this.isRunning) {
      try {
        await this.scanNewTransactions()
        await this.sleep(3000) // Wait 3 seconds between scans
      } catch (error) {
        console.error('Error in Solana scanner:', error)
        await this.sleep(10000) // Wait longer on error
      }
    }
  }

  async scanNewTransactions() {
    const currentSlot = await connection.getSlot()

    if (currentSlot <= this.lastProcessedSlot) {
      return
    }

    console.log(`Scanning Solana slots ${this.lastProcessedSlot + 1} to ${currentSlot}`)

    // Get recent signatures for the Token Program
    const signatures = await connection.getSignaturesForAddress(
      new PublicKey(TOKEN_PROGRAM_ID),
      {
        limit: 100,
      }
    )

    const detections: TokenDetection[] = []

    for (const sig of signatures) {
      if (sig.slot <= this.lastProcessedSlot) continue

      try {
        const tx = await connection.getParsedTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0,
        })

        if (!tx || !tx.meta) continue

        // Look for token mint instructions
        const mintInstructions = this.findMintInstructions(tx)

        for (const mint of mintInstructions) {
          const exists = await this.checkTokenExists(mint.address)
          if (!exists) {
            detections.push({
              address: mint.address,
              signature: sig.signature,
              slot: sig.slot,
            })
          }
        }
      } catch (error) {
        console.error(`Error processing transaction ${sig.signature}:`, error)
      }
    }

    if (detections.length > 0) {
      console.log(`Found ${detections.length} potential new tokens on Solana`)
      await this.saveDetections(detections)
    }

    this.lastProcessedSlot = currentSlot
    await redisClient.set('solana:lastSlot', currentSlot.toString())

    // Log scan completion
    await this.logScan(BigInt(currentSlot), detections.length)
  }

  findMintInstructions(tx: any): Array<{ address: string }> {
    const mints: Array<{ address: string }> = []

    if (!tx.transaction || !tx.transaction.message) return mints

    const instructions = tx.transaction.message.instructions

    for (const instruction of instructions) {
      if (instruction.program === 'spl-token' && instruction.parsed) {
        const parsed = instruction.parsed

        if (parsed.type === 'initializeMint' || parsed.type === 'initializeMint2') {
          const mintAddress = instruction.accounts?.[0]?.toString()
          if (mintAddress) {
            mints.push({ address: mintAddress })
          }
        }
      }
    }

    return mints
  }

  async checkTokenExists(address: string): Promise<boolean> {
    const cached = await redisClient.get(`token:${address}`)
    if (cached) return true

    const token = await prisma.token.findUnique({
      where: { address },
    })

    if (token) {
      await redisClient.setEx(`token:${address}`, 3600, 'exists')
      return true
    }

    return false
  }

  async saveDetections(detections: TokenDetection[]) {
    for (const detection of detections) {
      try {
        // Get token metadata
        const metadata = await this.getTokenMetadata(detection.address)

        // Check if it's an x402 token
        const isX402 = await checkForX402Pattern(detection.address, 'SOLANA')

        // Create token in database
        await prisma.token.create({
          data: {
            address: detection.address,
            name: metadata.name,
            symbol: metadata.symbol,
            decimals: metadata.decimals,
            network: 'SOLANA',
            isX402,
            metadata: {
              firstTxSignature: detection.signature,
              firstSlot: detection.slot,
            },
          },
        })

        // Cache in Redis
        await redisClient.setEx(`token:${detection.address}`, 3600, 'exists')

        // Publish to real-time feed
        await redisClient.publish(
          'token:new',
          JSON.stringify({
            address: detection.address,
            network: 'SOLANA',
            isX402,
            ...metadata,
          })
        )

        console.log(`✓ Saved new token: ${metadata.symbol || 'UNKNOWN'} (${detection.address})`)
      } catch (error) {
        console.error(`Error saving token ${detection.address}:`, error)
      }
    }
  }

  async getTokenMetadata(address: string) {
    try {
      const mintPubkey = new PublicKey(address)
      const accountInfo = await connection.getParsedAccountInfo(mintPubkey)

      if (!accountInfo.value || !accountInfo.value.data) {
        return { name: null, symbol: null, decimals: null }
      }

      const data = accountInfo.value.data as any

      if (data.parsed && data.parsed.info) {
        const info = data.parsed.info
        return {
          name: null, // SPL tokens don't have name on-chain
          symbol: null, // Symbol comes from metadata
          decimals: info.decimals || null,
        }
      }

      return { name: null, symbol: null, decimals: null }
    } catch (error) {
      console.error(`Error getting metadata for ${address}:`, error)
      return { name: null, symbol: null, decimals: null }
    }
  }

  async logScan(slot: bigint, tokensFound: number) {
    await prisma.scanLog.create({
      data: {
        network: 'SOLANA',
        blockNumber: slot,
        tokensFound,
        agentsFound: 0,
        startTime: new Date(),
        endTime: new Date(),
        status: 'SUCCESS',
      },
    })
  }

  sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  stop() {
    console.log('Stopping Solana scanner...')
    this.isRunning = false
  }
}

// Main execution
const scanner = new SolanaScanner()

process.on('SIGINT', () => {
  scanner.stop()
  process.exit(0)
})

scanner.initialize().then(() => scanner.start())
