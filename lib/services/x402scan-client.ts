import axios, { AxiosInstance } from 'axios'
import * as cheerio from 'cheerio'

/**
 * x402scan.com Client
 *
 * Fetches x402 protocol data from x402scan.com
 * Uses API if available, falls back to web scraping if needed
 *
 * IMPORTANT: This is for research and educational purposes only.
 * Respects rate limits and robots.txt
 */

export interface X402Protocol {
  address: string
  chain: 'BASE' | 'SOLANA'
  txHash?: string
  deployer?: string
  timestamp?: Date
  name?: string
  symbol?: string
  metadata?: any
}

export interface X402Transaction {
  hash: string
  from: string
  to?: string
  timestamp: Date
  value?: string
  protocolAddress?: string
}

export class X402ScanClient {
  private baseUrl: string
  private axios: AxiosInstance
  private lastRequestTime: number = 0
  private minRequestInterval: number = 2000 // 2 seconds between requests

  constructor(baseUrl: string = 'https://www.x402scan.com') {
    this.baseUrl = baseUrl
    this.axios = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'User-Agent': 'x402-Observatory-Research-Bot/1.0 (Educational Research)',
        'Accept': 'application/json, text/html',
      },
    })
  }

  /**
   * Rate limiting - wait before making request
   */
  private async rateLimit(): Promise<void> {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime

    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest
      console.log(`[X402Scan] Rate limiting: waiting ${waitTime}ms`)
      await new Promise((resolve) => setTimeout(resolve, waitTime))
    }

    this.lastRequestTime = Date.now()
  }

  /**
   * Try to fetch data from potential API endpoints
   */
  async fetchFromAPI(): Promise<X402Protocol[] | null> {
    await this.rateLimit()

    const apiEndpoints = [
      '/api/protocols',
      '/api/recent',
      '/api/tokens',
      '/api/v1/protocols',
      '/api/v1/activity',
    ]

    for (const endpoint of apiEndpoints) {
      try {
        console.log(`[X402Scan] Trying API endpoint: ${endpoint}`)
        const response = await this.axios.get(endpoint)

        if (response.status === 200 && response.data) {
          console.log(`[X402Scan] ✅ Found working API endpoint: ${endpoint}`)
          return this.normalizeAPIData(response.data)
        }
      } catch (error) {
        // Silently continue to next endpoint
        continue
      }
    }

    console.log('[X402Scan] No API endpoints found, will try scraping')
    return null
  }

  /**
   * Normalize API data to our format
   */
  private normalizeAPIData(data: any): X402Protocol[] {
    if (!data) return []

    // Handle different API response formats
    const items = Array.isArray(data) ? data : data.protocols || data.data || []

    return items.map((item: any) => ({
      address: item.address || item.contract || item.id,
      chain: (item.chain || 'BASE').toUpperCase() as 'BASE' | 'SOLANA',
      txHash: item.txHash || item.deploymentTx || item.tx,
      deployer: item.deployer || item.creator || item.from,
      timestamp: item.timestamp ? new Date(item.timestamp) : undefined,
      name: item.name,
      symbol: item.symbol,
      metadata: item,
    })).filter((p: X402Protocol) => p.address) // Only include items with addresses
  }

  /**
   * Scrape website for protocol data (fallback)
   * Uses lightweight HTML parsing instead of Puppeteer for better performance
   */
  async scrapeWebsite(): Promise<X402Protocol[]> {
    await this.rateLimit()

    try {
      console.log('[X402Scan] Fetching HTML from x402scan.com...')
      const response = await this.axios.get('/')

      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}`)
      }

      const $ = cheerio.load(response.data)
      const protocols: X402Protocol[] = []

      // Try common selectors for protocol/token lists
      const selectors = [
        '.protocol-item',
        '.token-item',
        '.contract-item',
        'tr[data-address]',
        '[data-protocol]',
        '.address-row',
      ]

      for (const selector of selectors) {
        const items = $(selector)

        if (items.length > 0) {
          console.log(`[X402Scan] Found ${items.length} items with selector: ${selector}`)

          items.each((i, elem) => {
            try {
              const protocol = this.parseProtocolElement($, elem)
              if (protocol && protocol.address) {
                protocols.push(protocol)
              }
            } catch (error) {
              // Skip invalid items
            }
          })

          if (protocols.length > 0) break // Found data, stop trying other selectors
        }
      }

      // If no structured data, try to extract addresses from links
      if (protocols.length === 0) {
        console.log('[X402Scan] No structured data found, extracting addresses from links')
        const addressLinks = $('a[href*="/address/"], a[href*="/token/"], a[href*="/contract/"]')

        addressLinks.each((i, elem) => {
          const href = $(elem).attr('href')
          const match = href?.match(/\/(address|token|contract)\/([0-9a-zA-Z]+)/)

          if (match && match[2]) {
            protocols.push({
              address: match[2],
              chain: 'BASE',
              metadata: {
                source: 'extracted_from_link',
                href: href,
              },
            })
          }
        })
      }

      console.log(`[X402Scan] Scraped ${protocols.length} protocols`)
      return protocols
    } catch (error) {
      console.error('[X402Scan] Error scraping website:', error)
      throw error
    }
  }

  /**
   * Parse a protocol element from HTML
   */
  private parseProtocolElement($: ReturnType<typeof cheerio.load>, elem: cheerio.Element): X402Protocol | null {
    try {
      const $elem = $(elem)

      // Try to extract address
      const address =
        $elem.attr('data-address') ||
        $elem.find('[data-address]').attr('data-address') ||
        $elem.find('.address, .contract-address').text().trim() ||
        $elem.find('a[href*="/address/"]').attr('href')?.split('/').pop()

      if (!address) return null

      // Try to extract other fields
      const name = $elem.find('.name, .token-name').text().trim() || undefined
      const symbol = $elem.find('.symbol, .token-symbol').text().trim() || undefined
      const deployer = $elem.find('.deployer, .creator').text().trim() || undefined
      const txHash = $elem.find('.tx-hash, [data-tx]').text().trim() || undefined

      // Try to extract timestamp
      let timestamp: Date | undefined
      const timeText = $elem.find('.timestamp, .time, time').text().trim()
      if (timeText) {
        const parsed = new Date(timeText)
        if (!isNaN(parsed.getTime())) {
          timestamp = parsed
        }
      }

      return {
        address: address.trim(),
        chain: 'BASE', // Default to BASE, can be updated later
        txHash,
        deployer,
        timestamp,
        name,
        symbol,
        metadata: {
          source: 'scraped',
        },
      }
    } catch (error) {
      console.error('[X402Scan] Error parsing protocol element:', error)
      return null
    }
  }

  /**
   * Fetch recent activity (try API first, fallback to scraping)
   */
  async fetchRecentActivity(): Promise<X402Protocol[]> {
    console.log('[X402Scan] Fetching recent x402 activity...')

    try {
      // Try API first
      const apiData = await this.fetchFromAPI()
      if (apiData && apiData.length > 0) {
        return apiData
      }

      // Fallback to scraping
      return await this.scrapeWebsite()
    } catch (error) {
      console.error('[X402Scan] Error fetching activity:', error)
      return []
    }
  }

  /**
   * Check if x402scan.com is accessible
   */
  async checkAvailability(): Promise<boolean> {
    try {
      await this.rateLimit()
      const response = await this.axios.head('/')
      return response.status === 200
    } catch (error) {
      console.error('[X402Scan] x402scan.com not available:', error)
      return false
    }
  }

  /**
   * Get protocol details by address
   */
  async getProtocol(address: string): Promise<X402Protocol | null> {
    await this.rateLimit()

    try {
      // Try API endpoint
      const response = await this.axios.get(`/api/protocol/${address}`)
      if (response.status === 200 && response.data) {
        return this.normalizeAPIData([response.data])[0]
      }
    } catch (error) {
      // Fallback to scraping protocol page
      try {
        const response = await this.axios.get(`/address/${address}`)
        const $ = cheerio.load(response.data)

        // Extract protocol details from page
        return {
          address,
          chain: 'BASE',
          name: $('.protocol-name, .token-name').text().trim() || undefined,
          symbol: $('.protocol-symbol, .token-symbol').text().trim() || undefined,
          metadata: {
            source: 'scraped_detail_page',
          },
        }
      } catch (err) {
        console.error(`[X402Scan] Could not fetch protocol ${address}:`, err)
        return null
      }
    }

    return null
  }
}

// Singleton instance
let clientInstance: X402ScanClient | null = null

export function getX402ScanClient(): X402ScanClient {
  if (!clientInstance) {
    const baseUrl = process.env.X402SCAN_URL || 'https://www.x402scan.com'
    clientInstance = new X402ScanClient(baseUrl)
  }
  return clientInstance
}
