'use client'

import { useState, useEffect } from 'react'
import { Activity, Globe, Zap } from 'lucide-react'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalScanned: 0,
    activeAgents: 0,
    newTokens: 0,
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            x402 Scanner
          </h1>
          <p className="text-xl text-gray-400">
            Real-time Blockchain Intelligence System
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard
            icon={<Activity className="w-8 h-8" />}
            title="Total Scanned"
            value={stats.totalScanned}
            color="blue"
          />
          <StatCard
            icon={<Globe className="w-8 h-8" />}
            title="Active AI Agents"
            value={stats.activeAgents}
            color="purple"
          />
          <StatCard
            icon={<Zap className="w-8 h-8" />}
            title="New Tokens (24h)"
            value={stats.newTokens}
            color="green"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Panel title="Recent Detections">
            <div className="text-gray-400 text-center py-8">
              No detections yet. Start the scanner to begin monitoring.
            </div>
          </Panel>

          <Panel title="Network Status">
            <div className="space-y-4">
              <NetworkStatus network="Base" status="ready" />
              <NetworkStatus network="Solana" status="ready" />
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, title, value, color }: any) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-700',
    purple: 'from-purple-500 to-purple-700',
    green: 'from-green-500 to-green-700',
  }

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} rounded-lg p-6 shadow-lg`}>
      <div className="flex items-center justify-between mb-4">
        {icon}
        <span className="text-3xl font-bold">{value.toLocaleString()}</span>
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
    </div>
  )
}

function Panel({ title, children }: any) {
  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      {children}
    </div>
  )
}

function NetworkStatus({ network, status }: any) {
  const statusColor = status === 'active' ? 'bg-green-500' : 'bg-yellow-500'

  return (
    <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
      <span className="font-semibold">{network}</span>
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${statusColor}`} />
        <span className="capitalize text-sm">{status}</span>
      </div>
    </div>
  )
}
