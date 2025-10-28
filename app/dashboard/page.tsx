'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatDistanceToNow } from 'date-fns'

interface Protocol {
  id: string
  address: string
  chain: string
  deployer?: string
  createdAt: string
  totalTransactions: number
  totalVolume: string
  lastActivityAt?: string
  status: string
  _count: {
    transactions: number
    interactions: number
  }
}

interface Stats {
  totalProtocols: number
  activeProtocols: number
  totalTransactions: number
  recentProtocols: Protocol[]
  chainBreakdown: Array<{ chain: string; count: number }>
}

interface MonitorStatus {
  base: {
    isRunning: boolean
    lastProcessedBlock?: string
  }
  solana: {
    isRunning: boolean
    lastProcessedSlot?: number
  }
}

export default function Dashboard() {
  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [monitorStatus, setMonitorStatus] = useState<MonitorStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterChain, setFilterChain] = useState<string>('')
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams()
      if (filterChain) queryParams.append('chain', filterChain)

      const [protocolsRes, statsRes, monitorRes] = await Promise.all([
        fetch(`/api/protocols?${queryParams}&limit=20`),
        fetch(`/api/stats?${queryParams}`),
        fetch('/api/monitor/status'),
      ])

      const protocolsData = await protocolsRes.json()
      const statsData = await statsRes.json()
      const monitorData = await monitorRes.json()

      if (protocolsData.success) setProtocols(protocolsData.data)
      if (statsData.success) setStats(statsData.data)
      if (monitorData.success) setMonitorStatus(monitorData.data)

      setLoading(false)
    } catch (error) {
      console.error('Error fetching data:', error)
      setLoading(false)
    }
  }, [filterChain])

  useEffect(() => {
    fetchData()

    if (autoRefresh) {
      const interval = setInterval(fetchData, 10000) // Refresh every 10 seconds
      return () => clearInterval(interval)
    }
  }, [fetchData, autoRefresh])

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatVolume = (volume: string) => {
    const val = parseFloat(volume)
    if (val === 0) return '0'
    if (val < 0.001) return '< 0.001'
    return val.toFixed(4)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Protocol Observatory Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time x402 protocol monitoring</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              autoRefresh
                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            {autoRefresh ? '🟢 Auto-refresh ON' : '⚪ Auto-refresh OFF'}
          </button>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            🔄 Refresh Now
          </button>
        </div>
      </div>

      {/* Monitor Status */}
      {monitorStatus && (
        <div className="mb-6 grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Base Monitor</h3>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  monitorStatus.base.isRunning
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {monitorStatus.base.isRunning ? 'Running' : 'Stopped'}
              </span>
            </div>
            {monitorStatus.base.lastProcessedBlock && (
              <p className="text-xs text-gray-600 mt-2">
                Block: {monitorStatus.base.lastProcessedBlock}
              </p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Solana Monitor</h3>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  monitorStatus.solana.isRunning
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {monitorStatus.solana.isRunning ? 'Running' : 'Stopped'}
              </span>
            </div>
            {monitorStatus.solana.lastProcessedSlot && (
              <p className="text-xs text-gray-600 mt-2">
                Slot: {monitorStatus.solana.lastProcessedSlot}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <p className="text-sm text-gray-600">Total Protocols</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalProtocols}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <p className="text-sm text-gray-600">Active Protocols</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{stats.activeProtocols}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <p className="text-sm text-gray-600">Total Transactions</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalTransactions}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <p className="text-sm text-gray-600">Chain Breakdown</p>
            <div className="mt-2 space-y-1">
              {stats.chainBreakdown.map((chain) => (
                <div key={chain.chain} className="flex justify-between text-sm">
                  <span className="text-gray-600">{chain.chain}:</span>
                  <span className="font-semibold">{chain.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex space-x-4">
        <select
          value={filterChain}
          onChange={(e) => setFilterChain(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Chains</option>
          <option value="BASE">Base</option>
          <option value="SOLANA">Solana</option>
        </select>
      </div>

      {/* Protocols Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Recent Protocols</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-600">Loading...</div>
        ) : protocols.length === 0 ? (
          <div className="p-8 text-center text-gray-600">
            No protocols detected yet. Monitors are running...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Chain
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Deployer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Transactions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Volume
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Discovered
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {protocols.map((protocol) => (
                  <tr key={protocol.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          protocol.chain === 'BASE'
                            ? 'bg-base-100 text-base-800'
                            : 'bg-solana-100 text-solana-800'
                        }`}
                      >
                        {protocol.chain}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-sm text-gray-900 font-mono">
                        {formatAddress(protocol.address)}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {protocol.deployer ? (
                        <code className="text-sm text-gray-600 font-mono">
                          {formatAddress(protocol.deployer)}
                        </code>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {protocol.totalTransactions}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatVolume(protocol.totalVolume)} ETH
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDistanceToNow(new Date(protocol.createdAt), { addSuffix: true })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          protocol.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {protocol.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
