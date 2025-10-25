import { Connection, PublicKey } from '@solana/web3.js'

// Create Solana connection
export const solanaConnection = new Connection(
  process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  'confirmed'
)

// Helper function to validate Solana address
export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address)
    return true
  } catch {
    return false
  }
}

export { PublicKey }
