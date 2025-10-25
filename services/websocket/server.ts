import { WebSocketServer, WebSocket } from 'ws'
import Redis from 'redis'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const wss = new WebSocketServer({ port: parseInt(process.env.WS_PORT || '8080') })

const redisClient = Redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
})

const subscribers = new Set<WebSocket>()

interface ClientMessage {
  type: 'subscribe' | 'unsubscribe' | 'ping'
  channels?: string[]
}

interface ServerMessage {
  type: 'token' | 'agent' | 'stats' | 'pong'
  data?: any
}

async function initialize() {
  await redisClient.connect()

  // Subscribe to Redis pub/sub channels
  const subscriber = redisClient.duplicate()
  await subscriber.connect()

  await subscriber.subscribe('token:new', (message) => {
    broadcast({
      type: 'token',
      data: JSON.parse(message),
    })
  })

  await subscriber.subscribe('agent:new', (message) => {
    broadcast({
      type: 'agent',
      data: JSON.parse(message),
    })
  })

  console.log('WebSocket server initialized and subscribed to Redis channels')
}

wss.on('connection', (ws: WebSocket) => {
  console.log('New WebSocket connection')
  subscribers.add(ws)

  // Send initial stats
  sendStats(ws)

  ws.on('message', async (data: Buffer) => {
    try {
      const message: ClientMessage = JSON.parse(data.toString())

      switch (message.type) {
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }))
          break

        case 'subscribe':
          // Handle subscription to specific channels
          break

        case 'unsubscribe':
          // Handle unsubscription
          break
      }
    } catch (error) {
      console.error('Error handling message:', error)
    }
  })

  ws.on('close', () => {
    console.log('WebSocket connection closed')
    subscribers.delete(ws)
  })

  ws.on('error', (error) => {
    console.error('WebSocket error:', error)
    subscribers.delete(ws)
  })
})

function broadcast(message: ServerMessage) {
  const data = JSON.stringify(message)

  subscribers.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data)
    }
  })
}

async function sendStats(ws: WebSocket) {
  try {
    const [totalTokens, totalAgents, recentTokens] = await Promise.all([
      prisma.token.count(),
      prisma.aIAgent.count(),
      prisma.token.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
    ])

    ws.send(
      JSON.stringify({
        type: 'stats',
        data: {
          totalTokens,
          totalAgents,
          recentTokens,
        },
      })
    )
  } catch (error) {
    console.error('Error sending stats:', error)
  }
}

// Periodically broadcast stats to all clients
setInterval(async () => {
  try {
    const [totalTokens, totalAgents, recentTokens] = await Promise.all([
      prisma.token.count(),
      prisma.aIAgent.count(),
      prisma.token.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
    ])

    broadcast({
      type: 'stats',
      data: {
        totalTokens,
        totalAgents,
        recentTokens,
      },
    })
  } catch (error) {
    console.error('Error broadcasting stats:', error)
  }
}, 10000) // Every 10 seconds

console.log(`WebSocket server started on port ${process.env.WS_PORT || '8080'}`)
initialize()
