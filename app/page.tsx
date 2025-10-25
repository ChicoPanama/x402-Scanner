'use client'

import { useState, useEffect } from 'react'

export default function Home() {
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    fetch('/api/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setStats(data.data)
      })
      .catch(console.error)
  }, [])

  const baseCount = stats?.chainBreakdown?.find((c: any) => c.chain === 'BASE')?.count || 0
  const solanaCount = stats?.chainBreakdown?.find((c: any) => c.chain === 'SOLANA')?.count || 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          x402 Protocol Observatory
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Blockchain Research Platform for Protocol Analysis
        </p>
        <div className="flex justify-center space-x-4">
          <a href="/dashboard" className="btn-primary">
            View Dashboard
          </a>
          <a href="/docs" className="btn-secondary">
            Documentation
          </a>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Base Network</h3>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-base-100 text-base-800">
              Active
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">{baseCount}</p>
          <p className="text-sm text-gray-600">Protocols Tracked</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Solana Network</h3>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-solana-100 text-solana-800">
              Active
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">{solanaCount}</p>
          <p className="text-sm text-gray-600">Protocols Tracked</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Total Analytics</h3>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
              Live
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">{stats?.totalTransactions || 0}</p>
          <p className="text-sm text-gray-600">Data Points</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Research Focus</h2>
          <ul className="space-y-3">
            <li className="flex items-start">
              <svg className="h-6 w-6 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-gray-700">Protocol Analysis and Pattern Recognition</span>
            </li>
            <li className="flex items-start">
              <svg className="h-6 w-6 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-gray-700">Market Research and Adoption Metrics</span>
            </li>
            <li className="flex items-start">
              <svg className="h-6 w-6 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-gray-700">Academic Studies and Dataset Building</span>
            </li>
            <li className="flex items-start">
              <svg className="h-6 w-6 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-gray-700">Educational Resources and Documentation</span>
            </li>
          </ul>
        </div>

        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Core Features</h2>
          <ul className="space-y-3">
            <li className="flex items-start">
              <svg className="h-6 w-6 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-gray-700">Real-time Protocol Monitoring</span>
            </li>
            <li className="flex items-start">
              <svg className="h-6 w-6 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="text-gray-700">Statistical Analysis Tools</span>
            </li>
            <li className="flex items-start">
              <svg className="h-6 w-6 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-gray-700">Data Export Capabilities</span>
            </li>
            <li className="flex items-start">
              <svg className="h-6 w-6 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-gray-700">Open API Access</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="card text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Ethical Research Platform</h2>
        <p className="text-gray-600 max-w-3xl mx-auto">
          All data is publicly available on blockchain networks. This platform is designed for
          legitimate research and educational purposes with transparent methodology and open-source code.
        </p>
      </div>
    </div>
  )
}
