import { createPublicClient, http, parseAbiItem, Log } from 'viem'
import { base } from 'viem/chains'
import { PrismaClient } from '@prisma/client'
import Redis from 'redis'
import { analyzeToken, checkForX402Pattern } from '../utils/token-analyzer'

const prisma = new PrismaClient()
const redisClient = Redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
})

const client = createPublicClient({
  chain: base,
  transport: http(process.env.BASE_RPC_URL),
})

const ERC20_TRANSFER_EVENT = parseAbiItem(
  'event Transfer(address indexed from, address indexed to, uint256 value)'
)

interface TokenDetection {
  address: string
  blockNumber: bigint
  transactionHash: string
  from: string
  to: string
}

class BaseScanner {
  private isRunning = false
  private lastScannedBlock: bigint = 0n

  async initialize() {
    await redisClient.connect()

    // Get last scanned block from Redis or start from current
    const lastBlock = await redisClient.get('base:lastBlock')
    if (lastBlock) {
      this.lastScannedBlock = BigInt(lastBlock)
    } else {
      this.lastScannedBlock = await client.getBlockNumber()
    }

    console.log(`Base Scanner initialized at block ${this.lastScannedBlock}`)
  }

  async start() {
    if (this.isRunning) {
      console.log('Base scanner is already running')
      return
    }

    this.isRunning = true
    console.log('Starting Base blockchain scanner...')

    while (this.isRunning) {
      try {
        await this.scanNewBlocks()
        await this.sleep(5000) // Wait 5 seconds between scans
      } catch (error) {
        console.error('Error in Base scanner:', error)
        await this.sleep(10000) // Wait longer on error
      }
    }
  }

  async scanNewBlocks() {
    const currentBlock = await client.getBlockNumber()

    if (currentBlock <= this.lastScannedBlock) {
      return
    }

    console.log(`Scanning Base blocks ${this.lastScannedBlock + 1n} to ${currentBlock}`)

    const logs = await client.getLogs({
      event: ERC20_TRANSFER_EVENT,
      fromBlock: this.lastScannedBlock + 1n,
      toBlock: currentBlock,
    })

    const detections = await this.processLogs(logs)

    if (detections.length > 0) {
      console.log(`Found ${detections.length} potential new tokens on Base`)
      await this.saveDetections(detections)
    }

    this.lastScannedBlock = currentBlock
    await redisClient.set('base:lastBlock', currentBlock.toString())

    // Log scan completion
    await this.logScan(currentBlock, detections.length)
  }

  async processLogs(logs: Log[]): Promise<TokenDetection[]> {
    const detections: TokenDetection[] = []
    const seenAddresses = new Set<string>()

    for (const log of logs) {
      const tokenAddress = log.address.toLowerCase()

      // Skip if we've already seen this address in this batch
      if (seenAddresses.has(tokenAddress)) continue

      // Check if token already exists in database
      const exists = await this.checkTokenExists(tokenAddress)
      if (exists) continue

      // Check for mint transaction (from address 0x0)
      const args = log.args as { from?: string; to?: string }
      if (args.from === '0x0000000000000000000000000000000000000000') {
        detections.push({
          address: tokenAddress,
          blockNumber: log.blockNumber!,
          transactionHash: log.transactionHash!,
          from: args.from,
          to: args.to || '',
        })

        seenAddresses.add(tokenAddress)
      }
    }

    return detections
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
        const isX402 = await checkForX402Pattern(detection.address, 'BASE')

        // Create token in database
        await prisma.token.create({
          data: {
            address: detection.address,
            name: metadata.name,
            symbol: metadata.symbol,
            decimals: metadata.decimals,
            network: 'BASE',
            isX402,
            metadata: {
              firstTxHash: detection.transactionHash,
              firstBlockNumber: detection.blockNumber.toString(),
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
            network: 'BASE',
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
      const [name, symbol, decimals] = await Promise.all([
        this.getTokenName(address),
        this.getTokenSymbol(address),
        this.getTokenDecimals(address),
      ])

      return { name, symbol, decimals }
    } catch (error) {
      return { name: null, symbol: null, decimals: null }
    }
  }

  async getTokenName(address: string): Promise<string | null> {
    try {
      const data = await client.readContract({
        address: address as `0x${string}`,
        abi: [{ name: 'name', type: 'function', inputs: [], outputs: [{ type: 'string' }], stateMutability: 'view' }],
        functionName: 'name',
      })
      return data as string
    } catch {
      return null
    }
  }

  async getTokenSymbol(address: string): Promise<string | null> {
    try {
      const data = await client.readContract({
        address: address as `0x${string}`,
        abi: [{ name: 'symbol', type: 'function', inputs: [], outputs: [{ type: 'string' }], stateMutability: 'view' }],
        functionName: 'symbol',
      })
      return data as string
    } catch {
      return null
    }
  }

  async getTokenDecimals(address: string): Promise<number | null> {
    try {
      const data = await client.readContract({
        address: address as `0x${string}`,
        abi: [{ name: 'decimals', type: 'function', inputs: [], outputs: [{ type: 'uint8' }], stateMutability: 'view' }],
        functionName: 'decimals',
      })
      return Number(data)
    } catch {
      return null
    }
  }

  async logScan(blockNumber: bigint, tokensFound: number) {
    await prisma.scanLog.create({
      data: {
        network: 'BASE',
        blockNumber,
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
    console.log('Stopping Base scanner...')
    this.isRunning = false
  }
}

// Main execution
const scanner = new BaseScanner()

process.on('SIGINT', () => {
  scanner.stop()
  process.exit(0)
})

scanner.initialize().then(() => scanner.start())
