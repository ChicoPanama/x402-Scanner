import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'x402 Scanner - Blockchain Intelligence',
  description: 'Real-time blockchain intelligence system for x402 protocol tokens and AI agents',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
