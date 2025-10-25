import { createPublicClient, http, webSocket } from 'viem'
import { base } from 'viem/chains'

// HTTP client for queries
export const baseClient = createPublicClient({
  chain: base,
  transport: http(process.env.BASE_RPC_URL || 'https://mainnet.base.org'),
})

// WebSocket client for real-time events
export const baseWsClient = process.env.BASE_WS_URL
  ? createPublicClient({
      chain: base,
      transport: webSocket(process.env.BASE_WS_URL),
    })
  : null

export { base }
