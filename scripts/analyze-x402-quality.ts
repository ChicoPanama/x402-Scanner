#!/usr/bin/env tsx

import puppeteer from 'puppeteer'
import { prisma } from '@/lib/database/client'
import { getX402ScanClient } from '@/lib/services/x402scan-client'

/**
 * x402 Quality Analyzer
 *
 * Identifies high-quality x402 protocols based on activity patterns and quality signals.
 * Focuses on research-actionable insights rather than just data collection.
 */

class X402QualityAnalyzer {
  private baseUrl = 'https://www.x402scan.com'
  private x402Client = getX402ScanClient()

  // Quality indicators we're looking for
  private qualitySignals = {
    highActivity: 50, // Minimum transactions for "active"
    whaleThreshold: 100, // $100+ transactions
    velocitySpike: 3, // 3x normal volume
    uniqueWallets: 20, // Minimum unique participants
    sustainedActivity: 7, // Days of consistent activity
  }

  async analyzeProtocolQuality() {
    console.log('🔬 Analyzing x402 Protocol Quality Indicators\n')

    try {
      console.log('[Analyzer] Launching browser...')
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      })

      const page = await browser.newPage()

      // Track all network requests to find data sources
      const dataRequests: any[] = []
      page.on('response', async (response) => {
        if (response.url().includes('json') || response.url().includes('api')) {
          try {
            const data = await response.json()
            dataRequests.push({ url: response.url(), data })
            console.log(`[Analyzer] Found API endpoint: ${response.url()}`)
          } catch {
            // Skip non-JSON responses
          }
        }
      })

      console.log(`[Analyzer] Navigating to ${this.baseUrl}...`)
      await page.goto(this.baseUrl, { waitUntil: 'networkidle2', timeout: 30000 })

      // Extract protocol data and quality signals
      const protocols = await page.evaluate(() => {
        const extractedData: any[] = []

        // Find all protocol/token elements
        document
          .querySelectorAll('[class*="protocol"], [class*="token"], [class*="project"]')
          .forEach((elem) => {
            const data: any = {
              address: null,
              activity: {},
              signals: [],
            }

            // Extract addresses
            const addressElement = elem.querySelector('a[href*="0x"], [class*="address"]')
            if (addressElement) {
              data.address = addressElement.textContent?.trim()
            }

            // Extract activity metrics
            elem
              .querySelectorAll('[class*="stat"], [class*="metric"], [class*="count"]')
              .forEach((stat) => {
                const text = stat.textContent || ''

                // Parse transaction counts
                if (text.includes('transaction') || text.includes('tx')) {
                  data.activity.transactions = parseInt(text.replace(/\D/g, '')) || 0
                }

                // Parse volume
                if (text.includes('$') || text.includes('volume')) {
                  data.activity.volume = parseFloat(text.replace(/[^0-9.]/g, '')) || 0
                }

                // Parse wallet counts
                if (text.includes('wallet') || text.includes('holder')) {
                  data.activity.wallets = parseInt(text.replace(/\D/g, '')) || 0
                }

                // Parse time-based activity
                if (text.includes('hour') || text.includes('day')) {
                  data.activity.recentActivity = text
                }
              })

            if (data.address) {
              extractedData.push(data)
            }
          })

        return extractedData
      })

      console.log(`[Analyzer] Found ${protocols.length} protocols on page`)
      console.log(`[Analyzer] Discovered ${dataRequests.length} API endpoints`)

      await browser.close()

      // Analyze quality of each protocol
      const qualityProtocols = await this.evaluateProtocols(protocols)

      return { protocols: qualityProtocols, apiEndpoints: dataRequests }
    } catch (error) {
      console.error('[Analyzer] Error during analysis:', error)
      return { protocols: [], apiEndpoints: [] }
    }
  }

  async evaluateProtocols(protocols: any[]) {
    console.log(`\n📊 Evaluating ${protocols.length} protocols for quality signals...\n`)

    const evaluated = []

    for (const protocol of protocols) {
      const qualityScore = this.calculateQualityScore(protocol)
      const unusualActivity = this.detectUnusualActivity(protocol)

      if (qualityScore > 50 || unusualActivity.length > 0) {
        evaluated.push({
          ...protocol,
          qualityScore,
          unusualActivity,
          recommendation: this.generateRecommendation(qualityScore, unusualActivity),
        })

        // Store promising protocols
        await this.storePromisingProtocol(protocol, qualityScore, unusualActivity)
      }
    }

    console.log(`[Analyzer] Identified ${evaluated.length} high-quality protocols\n`)
    return evaluated
  }

  calculateQualityScore(protocol: any): number {
    let score = 0

    // High transaction volume
    if (protocol.activity.transactions > this.qualitySignals.highActivity) {
      score += 25
    }

    // Good wallet distribution
    if (protocol.activity.wallets > this.qualitySignals.uniqueWallets) {
      score += 25
    }

    // Sustained activity
    if (protocol.activity.recentActivity?.includes('hour')) {
      score += 20
    }

    // Volume indicators
    if (protocol.activity.volume > 1000) {
      score += 30
    }

    return score
  }

  detectUnusualActivity(protocol: any): string[] {
    const unusual = []

    // Sudden volume spike
    if (
      protocol.activity.recentActivity?.includes('spike') ||
      protocol.activity.recentActivity?.includes('surge')
    ) {
      unusual.push('VOLUME_SPIKE')
    }

    // High concentration of large transactions
    if (
      protocol.activity.volume / protocol.activity.transactions >
      this.qualitySignals.whaleThreshold
    ) {
      unusual.push('WHALE_ACTIVITY')
    }

    // New protocol with immediate high activity
    if (
      protocol.activity.transactions > 100 &&
      protocol.activity.recentActivity?.includes('new')
    ) {
      unusual.push('HOT_LAUNCH')
    }

    return unusual
  }

  generateRecommendation(score: number, unusual: string[]): string {
    if (score > 75 && unusual.includes('WHALE_ACTIVITY')) {
      return 'HIGH_INTEREST: Strong activity with institutional participation'
    }

    if (unusual.includes('HOT_LAUNCH')) {
      return 'EARLY_OPPORTUNITY: New protocol with strong initial traction'
    }

    if (score > 60) {
      return 'MONITOR: Shows promise, track for developments'
    }

    return 'RESEARCH: Interesting patterns detected'
  }

  async storePromisingProtocol(protocol: any, score: number, signals: string[]) {
    try {
      await prisma.protocol.upsert({
        where: {
          chain_address: {
            chain: 'BASE',
            address: protocol.address.toLowerCase(),
          },
        },
        create: {
          address: protocol.address.toLowerCase(),
          chain: 'BASE',
          status: 'ACTIVE',
          totalTransactions: protocol.activity.transactions || 0,
          totalVolume: (protocol.activity.volume || 0).toString(),
          metadata: {
            qualityScore: score,
            signals,
            activity: protocol.activity,
            discoveredAt: new Date().toISOString(),
            source: 'quality_analyzer',
          },
        },
        update: {
          totalTransactions: protocol.activity.transactions || 0,
          totalVolume: (protocol.activity.volume || 0).toString(),
          lastActivityAt: new Date(),
          metadata: {
            qualityScore: score,
            signals,
            activity: protocol.activity,
            lastAnalyzed: new Date().toISOString(),
            source: 'quality_analyzer',
          },
        },
      })
    } catch (error) {
      console.error(`[Analyzer] Error storing protocol ${protocol.address}:`, error)
    }
  }

  async generateReport(result: { protocols: any[]; apiEndpoints: any[] }) {
    const protocols = result.protocols

    console.log('\n📈 QUALITY RESEARCH REPORT')
    console.log('═══════════════════════════════════════\n')

    if (protocols.length === 0) {
      console.log('⚠️  No protocols found. x402scan.com may have changed structure.')
      console.log('   Check API endpoints discovered:\n')
      result.apiEndpoints.forEach((req) => {
        console.log(`   ${req.url}`)
      })
      console.log('\n   Consider using the database analyzer instead:')
      console.log('   npm run analyze:db\n')
      return
    }

    // High quality protocols
    const highQuality = protocols.filter((p) => p.qualityScore > 75)
    if (highQuality.length > 0) {
      console.log('🌟 HIGH QUALITY PROTOCOLS:')
      highQuality.forEach((p) => {
        console.log(`   ${p.address}`)
        console.log(`   Score: ${p.qualityScore}/100`)
        console.log(`   Signals: ${p.unusualActivity.join(', ') || 'None'}`)
        console.log(`   ${p.recommendation}\n`)
      })
    }

    // Unusual activity
    const unusual = protocols.filter((p) => p.unusualActivity.length > 1)
    if (unusual.length > 0) {
      console.log('🔥 UNUSUAL ACTIVITY DETECTED:')
      unusual.forEach((p) => {
        console.log(`   ${p.address}`)
        console.log(`   Patterns: ${p.unusualActivity.join(', ')}\n`)
      })
    }

    // Early opportunities
    const early = protocols.filter((p) => p.unusualActivity.includes('HOT_LAUNCH'))
    if (early.length > 0) {
      console.log('🚀 EARLY OPPORTUNITIES:')
      early.forEach((p) => {
        console.log(`   ${p.address}`)
        console.log(`   Activity: ${JSON.stringify(p.activity)}\n`)
      })
    }

    // Medium quality worth monitoring
    const medium = protocols.filter((p) => p.qualityScore >= 50 && p.qualityScore < 75)
    if (medium.length > 0) {
      console.log(`📊 WORTH MONITORING (${medium.length} protocols):`)
      medium.slice(0, 5).forEach((p) => {
        console.log(`   ${p.address} - Score: ${p.qualityScore}/100`)
      })
      if (medium.length > 5) {
        console.log(`   ... and ${medium.length - 5} more\n`)
      } else {
        console.log('')
      }
    }

    console.log('═══════════════════════════════════════')
    console.log(`\nTotal Analyzed: ${protocols.length}`)
    console.log(`High Quality: ${highQuality.length}`)
    console.log(`Unusual Activity: ${unusual.length}`)
    console.log(`Early Opportunities: ${early.length}`)
    console.log('═══════════════════════════════════════\n')
  }
}

// Main execution
async function main() {
  console.log('================================')
  console.log('x402 Quality Research Analyzer')
  console.log('================================\n')

  const analyzer = new X402QualityAnalyzer()

  try {
    // Analyze protocol quality
    const result = await analyzer.analyzeProtocolQuality()

    // Generate research report
    await analyzer.generateReport(result)

    // Summary
    if (result.protocols.length > 0) {
      console.log(`✅ Stored ${result.protocols.length} promising protocols for monitoring`)
      console.log('\nRun this analyzer periodically to track changes:')
      console.log('  npm run analyze\n')
    }
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

export { X402QualityAnalyzer }
