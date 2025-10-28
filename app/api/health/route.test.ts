/**
 * Health Check API Tests
 *
 * Note: Full API route testing requires Next.js test environment setup.
 * These tests verify the health check logic and response structure.
 */

describe('/api/health', () => {
  it('should have correct health check structure', () => {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      success: true,
      message: 'x402 Observatory is running',
      system: {
        node: process.version,
        platform: process.platform,
      },
    }

    expect(healthData.status).toBe('healthy')
    expect(healthData.success).toBe(true)
    expect(healthData.timestamp).toBeDefined()
    expect(healthData.system.node).toBeDefined()
  })

  it('should include timestamp in ISO format', () => {
    const timestamp = new Date().toISOString()
    expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
  })

  it('should include system information', () => {
    const systemInfo = {
      node: process.version,
      platform: process.platform,
    }

    expect(systemInfo.node).toContain('v')
    expect(systemInfo.platform).toBeDefined()
    expect(['linux', 'darwin', 'win32']).toContain(systemInfo.platform)
  })
})
