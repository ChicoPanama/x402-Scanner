/**
 * Utility Functions Tests
 *
 * Testing basic utility functions used throughout the application
 */

describe('Format Utilities', () => {
  describe('Address Formatting', () => {
    it('should format ethereum addresses correctly', () => {
      const address = '0x1234567890123456789012345678901234567890'
      const formatted = formatAddress(address)

      expect(formatted).toBe('0x1234...7890')
    })

    it('should handle short addresses', () => {
      const address = '0x123'
      const formatted = formatAddress(address)

      expect(formatted).toBe('0x123')
    })
  })

  describe('Number Formatting', () => {
    it('should format large numbers with commas', () => {
      expect(formatNumber(1000)).toBe('1,000')
      expect(formatNumber(1000000)).toBe('1,000,000')
      expect(formatNumber(123456789)).toBe('123,456,789')
    })

    it('should handle zero and negative numbers', () => {
      expect(formatNumber(0)).toBe('0')
      expect(formatNumber(-1000)).toBe('-1,000')
    })
  })

  describe('Date Formatting', () => {
    it('should format dates consistently', () => {
      const date = new Date('2024-10-28T12:00:00Z')
      const formatted = formatDate(date)

      expect(formatted).toBeDefined()
      expect(typeof formatted).toBe('string')
    })
  })
})

// Simple utility functions for testing
function formatAddress(address: string): string {
  if (address.length <= 10) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function formatNumber(num: number): string {
  return num.toLocaleString('en-US')
}

function formatDate(date: Date): string {
  return date.toISOString()
}
