import { z } from 'zod'

/**
 * Environment Variable Validation
 *
 * Validates all required environment variables at startup
 * Provides type-safe access to configuration
 */

// Define the schema for environment variables
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // Database (required)
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Redis (optional)
  REDIS_URL: z.string().optional(),

  // Base Network
  BASE_RPC_URL: z.string().url().default('https://mainnet.base.org'),
  BASE_WS_URL: z.string().url().optional(),

  // Solana Network
  SOLANA_RPC_URL: z.string().url().default('https://api.mainnet-beta.solana.com'),
  HELIUS_API_KEY: z.string().optional(),

  // Research Features
  ENABLE_HISTORICAL_SYNC: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),
  DATA_RETENTION_DAYS: z.string().transform(Number).default('90'),
  ANALYSIS_INTERVAL_MS: z.string().transform(Number).default('60000'),

  // x402scan Integration
  X402SCAN_URL: z.string().url().default('https://www.x402scan.com'),
  SCAN_INTERVAL_MS: z.string().transform(Number).default('300000'),

  // API Configuration
  API_RATE_LIMIT: z.string().transform(Number).default('100'),
  API_RATE_WINDOW_MS: z.string().transform(Number).default('60000'),

  // Security (optional in development)
  JWT_SECRET: z.string().optional(),
  API_SECRET_KEY: z.string().optional(),

  // Webhook Configuration
  WEBHOOK_TIMEOUT_MS: z.string().transform(Number).default('5000'),
  WEBHOOK_RETRY_ATTEMPTS: z.string().transform(Number).default('3'),

  // Export Storage
  EXPORT_STORAGE_PATH: z.string().default('./exports'),
  EXPORT_RETENTION_DAYS: z.string().transform(Number).default('30'),
})

// Infer the type from the schema
export type Env = z.infer<typeof envSchema>

// Validate and parse environment variables
function validateEnv(): Env {
  try {
    const parsed = envSchema.parse(process.env)
    return parsed
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:')
      console.error('')
      error.errors.forEach((err) => {
        console.error(`  • ${err.path.join('.')}: ${err.message}`)
      })
      console.error('')
      console.error('Please check your .env file and fix the errors above.')
      console.error('See .env.example for reference.')
      process.exit(1)
    }
    throw error
  }
}

// Export validated configuration
export const config = validateEnv()

// Helper function to check if in production
export const isProduction = config.NODE_ENV === 'production'

// Helper function to check if in development
export const isDevelopment = config.NODE_ENV === 'development'

// Helper function to check if in test
export const isTest = config.NODE_ENV === 'test'

// Log configuration on startup (excluding secrets)
if (!isTest) {
  console.log('✅ Environment configuration loaded:')
  console.log(`   NODE_ENV: ${config.NODE_ENV}`)
  console.log(`   PORT: ${config.PORT}`)
  console.log(`   LOG_LEVEL: ${config.LOG_LEVEL}`)
  console.log(`   DATABASE_URL: ${config.DATABASE_URL.split('@')[1] || 'configured'}`)
  console.log(`   REDIS_URL: ${config.REDIS_URL ? 'configured' : 'not configured'}`)
  console.log('')
}
