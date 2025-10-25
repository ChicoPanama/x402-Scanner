#!/usr/bin/env tsx

import { prisma } from '@/lib/database/client'

/**
 * Database Protocol Analyzer
 *
 * Analyzes protocols already collected in the database.
 * Useful after running the hybrid monitor to identify quality protocols.
 */

interface QualityMetrics {
  address: string
  chain: string
  totalTransactions: number
  totalVolume: string
  lastActivityAt: Date | null
  createdAt: Date
  daysSinceCreation: number
  transactionsPerDay: number
  qualityScore: number
  signals: string[]
  recommendation: string
}

class DatabaseAnalyzer {
  async analyzeProtocols(): Promise<QualityMetrics[]> {
    console.log('📊 Analyzing protocols in database...\n')

    const protocols = await prisma.protocol.findMany({
      where: {
        status: 'ACTIVE',
      },
      orderBy: {
        totalTransactions: 'desc',
      },
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    })

    console.log(`Found ${protocols.length} active protocols\n`)

    const analyzed: QualityMetrics[] = []

    for (const protocol of protocols) {
      const metrics = this.calculateMetrics(protocol)
      if (metrics.qualityScore > 30) {
        // Only include protocols with some activity
        analyzed.push(metrics)
      }
    }

    return analyzed.sort((a, b) => b.qualityScore - a.qualityScore)
  }

  private calculateMetrics(protocol: any): QualityMetrics {
    const now = new Date()
    const daysSinceCreation = Math.max(
      1,
      (now.getTime() - protocol.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    )

    const transactionsPerDay = protocol.totalTransactions / daysSinceCreation
    const volume = parseFloat(protocol.totalVolume)

    // Calculate quality score (0-100)
    let qualityScore = 0
    const signals: string[] = []

    // Transaction volume (0-30 points)
    if (protocol.totalTransactions > 100) {
      qualityScore += 30
      signals.push('HIGH_VOLUME')
    } else if (protocol.totalTransactions > 50) {
      qualityScore += 20
    } else if (protocol.totalTransactions > 10) {
      qualityScore += 10
    }

    // Daily activity rate (0-25 points)
    if (transactionsPerDay > 10) {
      qualityScore += 25
      signals.push('VERY_ACTIVE')
    } else if (transactionsPerDay > 5) {
      qualityScore += 15
      signals.push('ACTIVE')
    } else if (transactionsPerDay > 1) {
      qualityScore += 10
    }

    // Recent activity (0-20 points)
    if (protocol.lastActivityAt) {
      const hoursSinceActivity =
        (now.getTime() - protocol.lastActivityAt.getTime()) / (1000 * 60 * 60)

      if (hoursSinceActivity < 1) {
        qualityScore += 20
        signals.push('HOT')
      } else if (hoursSinceActivity < 24) {
        qualityScore += 15
      } else if (hoursSinceActivity < 168) {
        // 1 week
        qualityScore += 10
      }
    }

    // Volume metrics (0-25 points)
    if (volume > 10) {
      qualityScore += 25
      signals.push('HIGH_VALUE')
    } else if (volume > 1) {
      qualityScore += 15
    } else if (volume > 0.1) {
      qualityScore += 5
    }

    // Detect unusual patterns
    if (daysSinceCreation < 1 && protocol.totalTransactions > 50) {
      signals.push('HOT_LAUNCH')
    }

    if (volume / protocol.totalTransactions > 0.1 && protocol.totalTransactions > 10) {
      signals.push('WHALE_ACTIVITY')
    }

    if (transactionsPerDay > 20) {
      signals.push('VELOCITY_SPIKE')
    }

    const recommendation = this.generateRecommendation(qualityScore, signals)

    return {
      address: protocol.address,
      chain: protocol.chain,
      totalTransactions: protocol.totalTransactions,
      totalVolume: protocol.totalVolume,
      lastActivityAt: protocol.lastActivityAt,
      createdAt: protocol.createdAt,
      daysSinceCreation: Math.round(daysSinceCreation * 10) / 10,
      transactionsPerDay: Math.round(transactionsPerDay * 10) / 10,
      qualityScore: Math.round(qualityScore),
      signals,
      recommendation,
    }
  }

  private generateRecommendation(score: number, signals: string[]): string {
    if (score > 80 && signals.includes('WHALE_ACTIVITY')) {
      return '🔥 CRITICAL: Institutional interest detected'
    }

    if (signals.includes('HOT_LAUNCH') && score > 60) {
      return '🚀 EARLY: Strong initial traction'
    }

    if (score > 70) {
      return '⭐ HIGH: Strong metrics across the board'
    }

    if (score > 50) {
      return '👀 MONITOR: Showing promise'
    }

    if (score > 30) {
      return '📊 RESEARCH: Has some activity'
    }

    return '📉 LOW: Minimal activity'
  }

  async generateReport(protocols: QualityMetrics[]) {
    console.log('\n' + '='.repeat(70))
    console.log('DATABASE QUALITY ANALYSIS REPORT')
    console.log('='.repeat(70) + '\n')

    if (protocols.length === 0) {
      console.log('⚠️  No protocols in database yet.')
      console.log('   Run the hybrid monitor first: npm run collect:hybrid\n')
      return
    }

    // Top performers
    const topPerformers = protocols.slice(0, 10)
    console.log('🏆 TOP 10 PROTOCOLS BY QUALITY SCORE\n')
    console.log(
      'Rank | Address        | Chain  | Score | Txs   | $/Day | Signals'
    )
    console.log('-'.repeat(70))

    topPerformers.forEach((p, i) => {
      const addr = `${p.address.slice(0, 6)}...${p.address.slice(-4)}`
      const txs = p.totalTransactions.toString().padStart(5)
      const perDay = p.transactionsPerDay.toFixed(1).padStart(5)
      const score = p.qualityScore.toString().padStart(3)
      const chain = p.chain.padEnd(6)

      console.log(
        `${(i + 1).toString().padStart(2)}   | ${addr} | ${chain} | ${score}  | ${txs} | ${perDay} | ${p.signals.join(', ')}`
      )
    })

    console.log('')

    // Categorize by recommendation
    const critical = protocols.filter((p) => p.recommendation.includes('CRITICAL'))
    const early = protocols.filter((p) => p.recommendation.includes('EARLY'))
    const high = protocols.filter((p) => p.recommendation.includes('HIGH'))
    const monitor = protocols.filter((p) => p.recommendation.includes('MONITOR'))

    if (critical.length > 0) {
      console.log('\n🔥 CRITICAL ATTENTION\n')
      critical.forEach((p) => {
        console.log(`   ${p.address} (${p.chain})`)
        console.log(`   ${p.recommendation}`)
        console.log(`   Signals: ${p.signals.join(', ')}`)
        console.log(`   ${p.totalTransactions} txs, ${p.transactionsPerDay}/day\n`)
      })
    }

    if (early.length > 0) {
      console.log('\n🚀 EARLY OPPORTUNITIES\n')
      early.slice(0, 5).forEach((p) => {
        console.log(`   ${p.address} (${p.chain})`)
        console.log(`   ${p.daysSinceCreation} days old, ${p.totalTransactions} transactions`)
        console.log(`   Signals: ${p.signals.join(', ')}\n`)
      })
    }

    if (high.length > 0) {
      console.log(`\n⭐ HIGH QUALITY (${high.length} total)\n`)
      high.slice(0, 3).forEach((p) => {
        console.log(`   ${p.address} (${p.chain}) - Score: ${p.qualityScore}`)
      })
      if (high.length > 3) {
        console.log(`   ... and ${high.length - 3} more`)
      }
      console.log('')
    }

    // Statistics
    console.log('\n📊 STATISTICS\n')
    console.log(`   Total Protocols Analyzed: ${protocols.length}`)
    console.log(`   Critical: ${critical.length}`)
    console.log(`   Early Opportunities: ${early.length}`)
    console.log(`   High Quality: ${high.length}`)
    console.log(`   Worth Monitoring: ${monitor.length}`)

    const totalTxs = protocols.reduce((sum, p) => sum + p.totalTransactions, 0)
    const avgScore = protocols.reduce((sum, p) => sum + p.qualityScore, 0) / protocols.length

    console.log(`\n   Total Transactions: ${totalTxs}`)
    console.log(`   Average Quality Score: ${avgScore.toFixed(1)}/100`)

    // Chain breakdown
    const baseCount = protocols.filter((p) => p.chain === 'BASE').length
    const solanaCount = protocols.filter((p) => p.chain === 'SOLANA').length

    console.log(`\n   Base Protocols: ${baseCount}`)
    console.log(`   Solana Protocols: ${solanaCount}`)

    console.log('\n' + '='.repeat(70) + '\n')
  }

  async exportToCSV(protocols: QualityMetrics[], filename: string = 'quality-report.csv') {
    const header =
      'Address,Chain,Quality Score,Total Transactions,Transactions/Day,Total Volume,Days Since Creation,Signals,Recommendation\n'

    const rows = protocols.map((p) => {
      return [
        p.address,
        p.chain,
        p.qualityScore,
        p.totalTransactions,
        p.transactionsPerDay.toFixed(2),
        p.totalVolume,
        p.daysSinceCreation.toFixed(1),
        `"${p.signals.join(', ')}"`,
        `"${p.recommendation}"`,
      ].join(',')
    })

    const csv = header + rows.join('\n')

    const fs = require('fs')
    fs.writeFileSync(filename, csv)
    console.log(`\n📄 Exported to ${filename}`)
  }
}

// Main execution
async function main() {
  console.log('================================')
  console.log('Database Protocol Analyzer')
  console.log('================================\n')

  const analyzer = new DatabaseAnalyzer()

  try {
    const protocols = await analyzer.analyzeProtocols()
    await analyzer.generateReport(protocols)

    // Export to CSV
    if (protocols.length > 0) {
      const timestamp = new Date().toISOString().split('T')[0]
      await analyzer.exportToCSV(protocols, `quality-report-${timestamp}.csv`)
    }

    console.log('\nTip: Run this analyzer after collecting data with:')
    console.log('  npm run collect:hybrid\n')
  } catch (error) {
    console.error('Error during analysis:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}

export { DatabaseAnalyzer }
