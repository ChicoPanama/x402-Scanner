import { baseClient } from '@/lib/blockchain/base'
import { solanaConnection, PublicKey } from '@/lib/blockchain/solana'
import { getX402ScanClient, type X402Protocol } from './x402scan-client'
import { prisma } from '@/lib/database/client'
import { isAddress } from 'viem'

/**
 * Contract Discovery Service
 *
 * Discovers and analyzes x402 protocol contracts
 * Combines data from x402scan.com with on-chain verification
 */

export class ContractDiscovery {
  private x402Client = getX402ScanClient()

  /**
   * Find x402 contracts from x402scan.com
   */
  async findX402Contracts(): Promise<X402Protocol[]> {
    console.log('[Discovery] Discovering x402 contracts from x402scan.com...')

    try {
      const protocols = await this.x402Client.fetchRecentActivity()
      console.log(`[Discovery] Found ${protocols.length} protocols from x402scan`)

      // Remove duplicates by address
      const uniqueProtocols = Array.from(
        new Map(protocols.map((p) => [p.address.toLowerCase(), p])).values()
      )

      return uniqueProtocols
    } catch (error) {
      console.error('[Discovery] Error fetching from x402scan:', error)
      return []
    }
  }

  /**
   * Analyze a Base contract to verify it's an x402 protocol
   */
  async analyzeBaseContract(address: string): Promise<{
    address: string
    isX402: boolean
    chain: 'BASE'
    bytecode?: string
    isContract: boolean
  }> {
    try {
      if (!isAddress(address)) {
        return {
          address,
          isX402: false,
          chain: 'BASE',
          isContract: false,
        }
      }

      // Get contract bytecode
      const bytecode = await baseClient.getBytecode({
        address: address as `0x${string}`,
      })

      if (!bytecode || bytecode === '0x') {
        return {
          address,
          isX402: false,
          chain: 'BASE',
          isContract: false,
        }
      }

      // Check for x402 signatures
      const isX402 = this.detectX402InBytecode(bytecode)

      return {
        address,
        isX402,
        chain: 'BASE',
        bytecode,
        isContract: true,
      }
    } catch (error) {
      console.error(`[Discovery] Error analyzing Base contract ${address}:`, error)
      return {
        address,
        isX402: false,
        chain: 'BASE',
        isContract: false,
      }
    }
  }

  /**
   * Analyze a Solana program
   */
  async analyzeSolanaProgram(address: string): Promise<{
    address: string
    isX402: boolean
    chain: 'SOLANA'
    isProgram: boolean
  }> {
    try {
      const pubkey = new PublicKey(address)

      // Check if account exists
      const accountInfo = await solanaConnection.getAccountInfo(pubkey)

      if (!accountInfo) {
        return {
          address,
          isX402: false,
          chain: 'SOLANA',
          isProgram: false,
        }
      }

      // Check if it's executable (a program)
      const isProgram = accountInfo.executable

      // For Solana, we'll trust x402scan's classification
      // But could add more sophisticated checks here
      const isX402 = isProgram // If it's a program and on x402scan, likely x402

      return {
        address,
        isX402,
        chain: 'SOLANA',
        isProgram,
      }
    } catch (error) {
      console.error(`[Discovery] Error analyzing Solana program ${address}:`, error)
      return {
        address,
        isX402: false,
        chain: 'SOLANA',
        isProgram: false,
      }
    }
  }

  /**
   * Detect x402 patterns in bytecode
   */
  private detectX402InBytecode(bytecode: string): boolean {
    const bytecodeHex = bytecode.toLowerCase()

    // x402 in hex: "783430322" or various encodings
    const patterns = [
      '783430322', // "x402" ASCII
      '34303200', // "402" ASCII
      '783430', // "x40"
    ]

    for (const pattern of patterns) {
      if (bytecodeHex.includes(pattern)) {
        return true
      }
    }

    // Could add more sophisticated pattern matching here
    // For example, checking for specific function signatures

    return false
  }

  /**
   * Store discovered protocol in database
   */
  async storeProtocol(protocol: X402Protocol, verified: boolean = false): Promise<void> {
    try {
      const existing = await prisma.protocol.findUnique({
        where: {
          chain_address: {
            chain: protocol.chain,
            address: protocol.address.toLowerCase(),
          },
        },
      })

      if (existing) {
        console.log(`[Discovery] Protocol ${protocol.address} already exists`)
        return
      }

      await prisma.protocol.create({
        data: {
          chain: protocol.chain,
          address: protocol.address.toLowerCase(),
          deploymentTxHash: protocol.txHash,
          deployer: protocol.deployer?.toLowerCase(),
          status: 'ACTIVE',
          name: protocol.name,
          symbol: protocol.symbol,
          metadata: {
            ...protocol.metadata,
            verified,
            source: 'x402scan',
            discoveredAt: new Date().toISOString(),
          },
        },
      })

      console.log(`[Discovery] ✅ Stored protocol: ${protocol.address}`)
    } catch (error) {
      console.error(`[Discovery] Error storing protocol ${protocol.address}:`, error)
    }
  }

  /**
   * Discover and import protocols from x402scan
   */
  async discoverAndImport(): Promise<number> {
    console.log('[Discovery] Starting protocol discovery...')

    // Get protocols from x402scan
    const protocols = await this.findX402Contracts()

    if (protocols.length === 0) {
      console.log('[Discovery] No protocols found')
      return 0
    }

    console.log(`[Discovery] Analyzing ${protocols.length} protocols...`)

    let imported = 0

    for (const protocol of protocols) {
      try {
        // Verify on-chain
        let verified = false

        if (protocol.chain === 'BASE') {
          const analysis = await this.analyzeBaseContract(protocol.address)
          verified = analysis.isX402 && analysis.isContract
        } else if (protocol.chain === 'SOLANA') {
          const analysis = await this.analyzeSolanaProgram(protocol.address)
          verified = analysis.isX402 && analysis.isProgram
        }

        // Store in database (even if not verified, for research purposes)
        await this.storeProtocol(protocol, verified)
        imported++

        // Rate limit to avoid overwhelming the RPC
        await new Promise((resolve) => setTimeout(resolve, 500))
      } catch (error) {
        console.error(`[Discovery] Error processing ${protocol.address}:`, error)
      }
    }

    console.log(`[Discovery] ✅ Imported ${imported} protocols`)
    return imported
  }

  /**
   * Get statistics about discovered protocols
   */
  async getStats(): Promise<{
    total: number
    base: number
    solana: number
    verified: number
  }> {
    const [total, base, solana, verified] = await Promise.all([
      prisma.protocol.count(),
      prisma.protocol.count({ where: { chain: 'BASE' } }),
      prisma.protocol.count({ where: { chain: 'SOLANA' } }),
      prisma.protocol.count({
        where: {
          metadata: {
            path: ['verified'],
            equals: true,
          },
        },
      }),
    ])

    return { total, base, solana, verified }
  }
}

// Singleton instance
let discoveryInstance: ContractDiscovery | null = null

export function getContractDiscovery(): ContractDiscovery {
  if (!discoveryInstance) {
    discoveryInstance = new ContractDiscovery()
  }
  return discoveryInstance
}
