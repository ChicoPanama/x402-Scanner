import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'x402 Protocol Observatory',
  description: 'Blockchain Research Platform for x402 Protocol Analysis',
  keywords: ['blockchain', 'research', 'x402', 'base', 'solana', 'protocol', 'analytics'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <nav className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  <h1 className="text-xl font-bold text-gray-900">
                    x402 Protocol Observatory
                  </h1>
                </div>
                <div className="flex items-center space-x-4">
                  <a href="/" className="text-gray-700 hover:text-gray-900">Home</a>
                  <a href="/dashboard" className="text-gray-700 hover:text-gray-900">Dashboard</a>
                  <a href="/docs" className="text-gray-700 hover:text-gray-900">Docs</a>
                </div>
              </div>
            </div>
          </nav>
          <main>{children}</main>
          <footer className="bg-white border-t mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <p className="text-center text-gray-600">
                Built for blockchain research and education
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
