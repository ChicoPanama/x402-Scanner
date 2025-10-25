import { baseClient } from '@/lib/blockchain/base'
import { prisma } from '@/lib/database/client'
import { formatEther, isAddress } from 'viem'

/**
 * Base Chain Monitor
 *
 * Monitors Base blockchain for x402 protocol deployments and activity.
 * Focuses on contract creation transactions and specific protocol patterns.
 */

export class BaseMonitor {
  private isRunning = false
  private lastProcessedBlock: bigint | null = null
  private pollInterval = 12000 // 12 seconds (Base block time)

  constructor() {
    console.log('[BaseMonitor] Initialized')
  }

  /**
   * Start monitoring the Base blockchain
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('[BaseMonitor] Already running')
      return
    }

    this.isRunning = true
    console.log('[BaseMonitor] Starting...')

    try {
      // Get the current block number
      const currentBlock = await baseClient.getBlockNumber()
      this.lastProcessedBlock = currentBlock
      console.log(`[BaseMonitor] Starting from block ${currentBlock}`)

      // Start the monitoring loop
      await this.monitorLoop()
    } catch (error) {
      console.error('[BaseMonitor] Failed to start:', error)
      this.isRunning = false
      throw error
    }
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    console.log('[BaseMonitor] Stopping...')
    this.isRunning = false
  }

  /**
   * Main monitoring loop
   */
  private async monitorLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        await this.checkNewBlocks()
      } catch (error) {
        console.error('[BaseMonitor] Error in monitor loop:', error)
      }

      // Wait before next poll
      await this.sleep(this.pollInterval)
    }
  }

  /**
   * Check for new blocks and process them
   */
  private async checkNewBlocks(): Promise<void> {
    try {
      const currentBlock = await baseClient.getBlockNumber()

      if (!this.lastProcessedBlock || currentBlock > this.lastProcessedBlock) {
        // Process all new blocks
        for (
          let blockNum = (this.lastProcessedBlock || currentBlock - 1n) + 1n;
          blockNum <= currentBlock;
          blockNum++
        ) {
          await this.processBlock(blockNum)
        }

        this.lastProcessedBlock = currentBlock
      }
    } catch (error) {
      console.error('[BaseMonitor] Error checking new blocks:', error)
    }
  }

  /**
   * Process a single block
   */
  private async processBlock(blockNumber: bigint): Promise<void> {
    try {
      console.log(`[BaseMonitor] Processing block ${blockNumber}`)

      const block = await baseClient.getBlock({
        blockNumber,
        includeTransactions: true,
      })

      if (!block.transactions || block.transactions.length === 0) {
        return
      }

      // Process each transaction
      for (const txHash of block.transactions) {
        if (typeof txHash === 'string') {
          await this.processTransaction(txHash, block.timestamp)
        }
      }
    } catch (error) {
      console.error(`[BaseMonitor] Error processing block ${blockNumber}:`, error)
    }
  }

  /**
   * Process a single transaction
   */
  private async processTransaction(
    txHash: string,
    blockTimestamp: bigint
  ): Promise<void> {
    try {
      const tx = await baseClient.getTransaction({ hash: txHash as `0x${string}` })
      const receipt = await baseClient.getTransactionReceipt({ hash: txHash as `0x${string}` })

      // Check if this is a contract creation
      if (!tx.to && receipt.contractAddress) {
        await this.handleContractCreation(tx, receipt, blockTimestamp)
      }

      // Check if transaction interacts with known protocols
      if (tx.to && isAddress(tx.to)) {
        await this.handleProtocolInteraction(tx, receipt, blockTimestamp)
      }
    } catch (error) {
      // Silently skip transactions that cause errors (often pending or replaced txs)
      // console.error(`[BaseMonitor] Error processing tx ${txHash}:`, error)
    }
  }

  /**
   * Handle contract creation transactions
   */
  private async handleContractCreation(
    tx: any,
    receipt: any,
    blockTimestamp: bigint
  ): Promise<void> {
    try {
      const contractAddress = receipt.contractAddress

      // Check if this contract matches x402 protocol patterns
      const isX402Protocol = await this.detectX402Pattern(tx, receipt)

      if (isX402Protocol) {
        console.log(`[BaseMonitor] 🎯 New x402 protocol detected: ${contractAddress}`)

        // Check if already exists
        const existing = await prisma.protocol.findUnique({
          where: {
            chain_address: {
              chain: 'BASE',
              address: contractAddress.toLowerCase(),
            },
          },
        })

        if (!existing) {
          // Create new protocol entry
          await prisma.protocol.create({
            data: {
              chain: 'BASE',
              address: contractAddress.toLowerCase(),
              deploymentTxHash: tx.hash,
              deployer: tx.from.toLowerCase(),
              firstSeenBlock: tx.blockNumber,
              status: 'ACTIVE',
              metadata: {
                gasUsed: receipt.gasUsed?.toString(),
                deploymentCost: (tx.gasPrice * receipt.gasUsed)?.toString(),
              },
            },
          })

          console.log(`[BaseMonitor] ✅ Protocol saved: ${contractAddress}`)
        }
      }
    } catch (error) {
      console.error('[BaseMonitor] Error handling contract creation:', error)
    }
  }

  /**
   * Handle interactions with known protocols
   */
  private async handleProtocolInteraction(
    tx: any,
    receipt: any,
    blockTimestamp: bigint
  ): Promise<void> {
    try {
      // Check if the target address is a tracked protocol
      const protocol = await prisma.protocol.findUnique({
        where: {
          chain_address: {
            chain: 'BASE',
            address: tx.to.toLowerCase(),
          },
        },
      })

      if (protocol) {
        // Record the transaction
        const txExists = await prisma.transaction.findUnique({
          where: {
            chain_hash: {
              chain: 'BASE',
              hash: tx.hash,
            },
          },
        })

        if (!txExists) {
          await prisma.transaction.create({
            data: {
              chain: 'BASE',
              hash: tx.hash,
              blockNumber: tx.blockNumber,
              blockTimestamp: new Date(Number(blockTimestamp) * 1000),
              from: tx.from.toLowerCase(),
              to: tx.to.toLowerCase(),
              value: tx.value?.toString() || '0',
              gasUsed: receipt.gasUsed?.toString(),
              gasPrice: tx.gasPrice?.toString(),
              protocolId: protocol.id,
            },
          })

          // Update protocol stats
          await prisma.protocol.update({
            where: { id: protocol.id },
            data: {
              totalTransactions: { increment: 1 },
              totalVolume: {
                set: (
                  BigInt(protocol.totalVolume) + (tx.value || 0n)
                ).toString(),
              },
              lastActivityAt: new Date(Number(blockTimestamp) * 1000),
            },
          })
        }
      }
    } catch (error) {
      console.error('[BaseMonitor] Error handling protocol interaction:', error)
    }
  }

  /**
   * Detect if a contract matches x402 protocol patterns
   */
  private async detectX402Pattern(tx: any, receipt: any): Promise<boolean> {
    // Pattern detection logic
    // This looks for x402-specific patterns in contract bytecode or events

    try {
      // Check bytecode for x402 signatures
      if (tx.input && tx.input.includes('783430322')) { // hex for "x402"
        return true
      }

      // Check events emitted during deployment
      if (receipt.logs && receipt.logs.length > 0) {
        for (const log of receipt.logs) {
          // Look for specific event signatures
          if (log.topics && log.topics[0]) {
            const topic = log.topics[0].toLowerCase()
            // Add known x402 event signatures here
            if (topic.includes('x402') || topic.includes('783430322')) {
              return true
            }
          }
        }
      }

      // Check if contract name/symbol contains x402
      // This would require additional RPC calls to read contract data

      return false
    } catch (error) {
      console.error('[BaseMonitor] Error in pattern detection:', error)
      return false
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Get monitoring stats
   */
  getStats() {
    return {
      isRunning: this.isRunning,
      lastProcessedBlock: this.lastProcessedBlock?.toString(),
      pollInterval: this.pollInterval,
    }
  }
}

// Singleton instance
let monitorInstance: BaseMonitor | null = null

export function getBaseMonitor(): BaseMonitor {
  if (!monitorInstance) {
    monitorInstance = new BaseMonitor()
  }
  return monitorInstance
}
