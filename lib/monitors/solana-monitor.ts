import { solanaConnection, PublicKey } from '@/lib/blockchain/solana'
import { prisma } from '@/lib/database/client'
import { ParsedTransactionWithMeta, PartiallyDecodedInstruction } from '@solana/web3.js'

/**
 * Solana Chain Monitor
 *
 * Monitors Solana blockchain for x402 protocol deployments and activity.
 * Focuses on program deployments and specific protocol patterns.
 */

export class SolanaMonitor {
  private isRunning = false
  private lastProcessedSlot: number | null = null
  private pollInterval = 1000 // 1 second (Solana is fast)

  constructor() {
    console.log('[SolanaMonitor] Initialized')
  }

  /**
   * Start monitoring the Solana blockchain
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('[SolanaMonitor] Already running')
      return
    }

    this.isRunning = true
    console.log('[SolanaMonitor] Starting...')

    try {
      // Get the current slot
      const currentSlot = await solanaConnection.getSlot()
      this.lastProcessedSlot = currentSlot
      console.log(`[SolanaMonitor] Starting from slot ${currentSlot}`)

      // Start the monitoring loop
      await this.monitorLoop()
    } catch (error) {
      console.error('[SolanaMonitor] Failed to start:', error)
      this.isRunning = false
      throw error
    }
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    console.log('[SolanaMonitor] Stopping...')
    this.isRunning = false
  }

  /**
   * Main monitoring loop
   */
  private async monitorLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        await this.checkNewSlots()
      } catch (error) {
        console.error('[SolanaMonitor] Error in monitor loop:', error)
      }

      // Wait before next poll
      await this.sleep(this.pollInterval)
    }
  }

  /**
   * Check for new slots and process them
   */
  private async checkNewSlots(): Promise<void> {
    try {
      const currentSlot = await solanaConnection.getSlot()

      if (!this.lastProcessedSlot || currentSlot > this.lastProcessedSlot) {
        // Process recent blocks (limited to avoid overload)
        const blocksToProcess = Math.min(
          currentSlot - (this.lastProcessedSlot || currentSlot - 1),
          10 // Max 10 blocks at a time
        )

        for (let i = 0; i < blocksToProcess; i++) {
          const slot = currentSlot - blocksToProcess + i + 1
          await this.processSlot(slot)
        }

        this.lastProcessedSlot = currentSlot
      }
    } catch (error) {
      console.error('[SolanaMonitor] Error checking new slots:', error)
    }
  }

  /**
   * Process a single slot
   */
  private async processSlot(slot: number): Promise<void> {
    try {
      console.log(`[SolanaMonitor] Processing slot ${slot}`)

      const block = await solanaConnection.getBlock(slot, {
        maxSupportedTransactionVersion: 0,
      })

      if (!block || !block.transactions) {
        return
      }

      // Process each transaction
      for (const tx of block.transactions) {
        if (tx.transaction) {
          await this.processTransaction(tx, block.blockTime || 0)
        }
      }
    } catch (error) {
      // Skip errors for slots without blocks
      // console.error(`[SolanaMonitor] Error processing slot ${slot}:`, error)
    }
  }

  /**
   * Process a single transaction
   */
  private async processTransaction(
    tx: any,
    blockTime: number
  ): Promise<void> {
    try {
      const signature = tx.transaction.signatures[0]

      // Look for program deployments (BPF Loader instructions)
      const accountKeys = tx.transaction.message.accountKeys
      const instructions = tx.transaction.message.instructions

      for (const instruction of instructions) {
        const programId = accountKeys[instruction.programIdIndex]

        // Check for BPF Loader (program deployment)
        if (
          programId.toBase58() === 'BPFLoaderUpgradeab1e11111111111111111111111' ||
          programId.toBase58() === 'BPFLoader2111111111111111111111111111111111'
        ) {
          await this.handleProgramDeployment(tx, instruction, blockTime)
        }

        // Check for x402 protocol patterns
        if (await this.detectX402Pattern(tx, instruction)) {
          await this.handleX402Activity(tx, instruction, blockTime)
        }
      }
    } catch (error) {
      // Skip transaction errors silently
      // console.error('[SolanaMonitor] Error processing transaction:', error)
    }
  }

  /**
   * Handle program deployment
   */
  private async handleProgramDeployment(
    tx: any,
    instruction: any,
    blockTime: number
  ): Promise<void> {
    try {
      const signature = tx.transaction.signatures[0]
      const accountKeys = tx.transaction.message.accountKeys

      // The deployed program address is usually the first account after the program ID
      const programAddress = accountKeys[instruction.accounts[0]]

      if (!programAddress) return

      console.log(`[SolanaMonitor] 🔍 Program deployment detected: ${programAddress.toBase58()}`)

      // Check if this is an x402 protocol
      const isX402 = await this.detectX402Pattern(tx, instruction)

      if (isX402) {
        console.log(`[SolanaMonitor] 🎯 x402 protocol detected: ${programAddress.toBase58()}`)

        // Check if already exists
        const existing = await prisma.protocol.findUnique({
          where: {
            chain_address: {
              chain: 'SOLANA',
              address: programAddress.toBase58(),
            },
          },
        })

        if (!existing) {
          // Create new protocol entry
          await prisma.protocol.create({
            data: {
              chain: 'SOLANA',
              address: programAddress.toBase58(),
              deploymentTxHash: signature,
              deployer: tx.transaction.message.accountKeys[0]?.toBase58() || '',
              status: 'ACTIVE',
              metadata: {
                slot: tx.slot,
                fee: tx.meta?.fee || 0,
              },
            },
          })

          console.log(`[SolanaMonitor] ✅ Protocol saved: ${programAddress.toBase58()}`)
        }
      }
    } catch (error) {
      console.error('[SolanaMonitor] Error handling program deployment:', error)
    }
  }

  /**
   * Handle x402 protocol activity
   */
  private async handleX402Activity(
    tx: any,
    instruction: any,
    blockTime: number
  ): Promise<void> {
    try {
      const signature = tx.transaction.signatures[0]
      const accountKeys = tx.transaction.message.accountKeys
      const programId = accountKeys[instruction.programIdIndex]

      // Check if this program is a tracked protocol
      const protocol = await prisma.protocol.findUnique({
        where: {
          chain_address: {
            chain: 'SOLANA',
            address: programId.toBase58(),
          },
        },
      })

      if (protocol) {
        // Record the transaction
        const txExists = await prisma.transaction.findUnique({
          where: {
            chain_hash: {
              chain: 'SOLANA',
              hash: signature,
            },
          },
        })

        if (!txExists) {
          const signer = accountKeys[0]?.toBase58() || ''

          await prisma.transaction.create({
            data: {
              chain: 'SOLANA',
              hash: signature,
              blockNumber: BigInt(tx.slot || 0),
              blockTimestamp: new Date(blockTime * 1000),
              from: signer,
              to: programId.toBase58(),
              value: '0',
              gasUsed: tx.meta?.fee?.toString() || '0',
              protocolId: protocol.id,
            },
          })

          // Update protocol stats
          await prisma.protocol.update({
            where: { id: protocol.id },
            data: {
              totalTransactions: { increment: 1 },
              lastActivityAt: new Date(blockTime * 1000),
            },
          })
        }
      }
    } catch (error) {
      console.error('[SolanaMonitor] Error handling x402 activity:', error)
    }
  }

  /**
   * Detect if a transaction/instruction matches x402 protocol patterns
   */
  private async detectX402Pattern(tx: any, instruction: any): Promise<boolean> {
    try {
      // Check instruction data for x402 markers
      if (instruction.data) {
        const dataStr = Buffer.from(instruction.data).toString('hex')
        if (dataStr.includes('783430322')) { // hex for "x402"
          return true
        }
      }

      // Check account metadata
      // This could be enhanced with specific program ID checks

      // Check transaction memo
      if (tx.transaction.message.instructions) {
        for (const instr of tx.transaction.message.instructions) {
          if (instr.parsed?.type === 'memo') {
            const memo = instr.parsed.info
            if (memo?.includes('x402')) {
              return true
            }
          }
        }
      }

      return false
    } catch (error) {
      console.error('[SolanaMonitor] Error in pattern detection:', error)
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
      lastProcessedSlot: this.lastProcessedSlot,
      pollInterval: this.pollInterval,
    }
  }
}

// Singleton instance
let monitorInstance: SolanaMonitor | null = null

export function getSolanaMonitor(): SolanaMonitor {
  if (!monitorInstance) {
    monitorInstance = new SolanaMonitor()
  }
  return monitorInstance
}
