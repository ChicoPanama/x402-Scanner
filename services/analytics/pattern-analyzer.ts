import { PrismaClient } from '@prisma/client'
import axios from 'axios'
import * as cheerio from 'cheerio'

const prisma = new PrismaClient()

interface AgentPattern {
  type: string
  value: string
  confidence: number
}

class PatternAnalyzer {
  private aiAgentKeywords = [
    'ai agent',
    'autonomous agent',
    'ai trading',
    'bot token',
    'ai powered',
    'machine learning',
    'neural network',
    'intelligent agent',
  ]

  async analyzeRecentTokens() {
    console.log('Starting pattern analysis...')

    // Get tokens from the last 24 hours
    const recentTokens = await prisma.token.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    console.log(`Analyzing ${recentTokens.length} tokens...`)

    for (const token of recentTokens) {
      try {
        const patterns = await this.detectAIAgentPatterns(token)

        if (patterns.length > 0) {
          await this.createAIAgent(token, patterns)
        }
      } catch (error) {
        console.error(`Error analyzing token ${token.address}:`, error)
      }
    }

    console.log('Pattern analysis complete')
  }

  async detectAIAgentPatterns(token: any): Promise<AgentPattern[]> {
    const patterns: AgentPattern[] = []

    // Check token name and symbol for AI keywords
    const nameSymbol = `${token.name || ''} ${token.symbol || ''}`.toLowerCase()
    for (const keyword of this.aiAgentKeywords) {
      if (nameSymbol.includes(keyword)) {
        patterns.push({
          type: 'NAME_KEYWORD',
          value: keyword,
          confidence: 0.7,
        })
      }
    }

    // Try to fetch and analyze website/social media
    if (token.mintUrl) {
      const webPatterns = await this.analyzeWebContent(token.mintUrl)
      patterns.push(...webPatterns)
    }

    return patterns
  }

  async analyzeWebContent(url: string): Promise<AgentPattern[]> {
    const patterns: AgentPattern[] = []

    try {
      const response = await axios.get(url, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; x402-scanner/1.0)',
        },
      })

      const $ = cheerio.load(response.data)
      const text = $('body').text().toLowerCase()

      // Check for AI-related content
      for (const keyword of this.aiAgentKeywords) {
        if (text.includes(keyword)) {
          patterns.push({
            type: 'WEB_CONTENT',
            value: keyword,
            confidence: 0.8,
          })
        }
      }

      // Extract social media links
      const socialLinks = this.extractSocialLinks($)
      if (socialLinks.twitter) {
        patterns.push({
          type: 'TWITTER',
          value: socialLinks.twitter,
          confidence: 0.9,
        })
      }
      if (socialLinks.telegram) {
        patterns.push({
          type: 'TELEGRAM',
          value: socialLinks.telegram,
          confidence: 0.9,
        })
      }
    } catch (error) {
      console.error(`Error analyzing web content for ${url}:`, error)
    }

    return patterns
  }

  extractSocialLinks($: cheerio.CheerioAPI) {
    const links = {
      twitter: null as string | null,
      telegram: null as string | null,
      discord: null as string | null,
    }

    $('a[href]').each((_, elem) => {
      const href = $(elem).attr('href')
      if (!href) return

      if (href.includes('twitter.com') || href.includes('x.com')) {
        links.twitter = href
      } else if (href.includes('t.me')) {
        links.telegram = href
      } else if (href.includes('discord.gg') || href.includes('discord.com')) {
        links.discord = href
      }
    })

    return links
  }

  async createAIAgent(token: any, patterns: AgentPattern[]) {
    try {
      // Check if agent already exists
      const existing = await prisma.aIAgent.findUnique({
        where: { address: token.address },
      })

      if (existing) return

      // Extract social links from patterns
      const twitter = patterns.find((p) => p.type === 'TWITTER')?.value
      const telegram = patterns.find((p) => p.type === 'TELEGRAM')?.value

      // Create AI agent
      const agent = await prisma.aIAgent.create({
        data: {
          address: token.address,
          name: token.name,
          description: `AI Agent detected via pattern analysis`,
          network: token.network,
          tokenAddress: token.address,
          website: token.mintUrl,
          twitter,
          telegram,
          isActive: true,
          verified: false,
        },
      })

      // Create pattern records
      for (const pattern of patterns) {
        await prisma.agentPattern.create({
          data: {
            agentId: agent.id,
            patternType: pattern.type,
            value: pattern.value,
            confidence: pattern.confidence,
          },
        })
      }

      console.log(`✓ Created AI Agent: ${token.name || token.address}`)
    } catch (error) {
      console.error(`Error creating AI agent for ${token.address}:`, error)
    }
  }

  async start() {
    console.log('Pattern Analyzer started')

    while (true) {
      try {
        await this.analyzeRecentTokens()
      } catch (error) {
        console.error('Error in pattern analyzer:', error)
      }

      // Run every 5 minutes
      await this.sleep(5 * 60 * 1000)
    }
  }

  sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

// Main execution
const analyzer = new PatternAnalyzer()
analyzer.start()
