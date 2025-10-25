import { useEffect, useState, useCallback } from 'react'

interface WebSocketMessage {
  type: 'token' | 'agent' | 'stats' | 'pong'
  data?: any
}

export function useWebSocket(url: string) {
  const [ws, setWs] = useState<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)

  useEffect(() => {
    const websocket = new WebSocket(url)

    websocket.onopen = () => {
      console.log('WebSocket connected')
      setIsConnected(true)
    }

    websocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage
        setLastMessage(message)
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    websocket.onclose = () => {
      console.log('WebSocket disconnected')
      setIsConnected(false)
    }

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    setWs(websocket)

    return () => {
      websocket.close()
    }
  }, [url])

  const send = useCallback(
    (message: any) => {
      if (ws && isConnected) {
        ws.send(JSON.stringify(message))
      }
    },
    [ws, isConnected]
  )

  return { isConnected, lastMessage, send }
}
