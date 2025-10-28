/**
 * Custom Error Classes
 *
 * Provides structured error types for better error handling and debugging
 */

/**
 * Base Error class with additional context
 */
export class BaseError extends Error {
  public readonly statusCode: number
  public readonly context?: Record<string, any>

  constructor(message: string, statusCode: number = 500, context?: Record<string, any>) {
    super(message)
    this.name = this.constructor.name
    this.statusCode = statusCode
    this.context = context
    Error.captureStackTrace(this, this.constructor)
  }

  toJSON() {
    return {
      error: this.name,
      message: this.message,
      statusCode: this.statusCode,
      context: this.context,
    }
  }
}

/**
 * Database-related errors
 */
export class DatabaseError extends BaseError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 500, context)
  }
}

/**
 * RPC/Blockchain errors
 */
export class RPCError extends BaseError {
  public readonly chain: string

  constructor(message: string, chain: string, context?: Record<string, any>) {
    super(message, 502, { ...context, chain })
    this.chain = chain
  }
}

/**
 * Validation errors
 */
export class ValidationError extends BaseError {
  public readonly fields?: string[]

  constructor(message: string, fields?: string[], context?: Record<string, any>) {
    super(message, 400, { ...context, fields })
    this.fields = fields
  }
}

/**
 * Rate limiting errors
 */
export class RateLimitError extends BaseError {
  public readonly retryAfter?: number

  constructor(message: string = 'Rate limit exceeded', retryAfter?: number) {
    super(message, 429, { retryAfter })
    this.retryAfter = retryAfter
  }
}

/**
 * Resource not found errors
 */
export class NotFoundError extends BaseError {
  public readonly resource: string

  constructor(resource: string, context?: Record<string, any>) {
    super(`${resource} not found`, 404, { ...context, resource })
    this.resource = resource
  }
}

/**
 * Authentication errors
 */
export class AuthenticationError extends BaseError {
  constructor(message: string = 'Authentication required', context?: Record<string, any>) {
    super(message, 401, context)
  }
}

/**
 * Authorization errors
 */
export class AuthorizationError extends BaseError {
  constructor(message: string = 'Insufficient permissions', context?: Record<string, any>) {
    super(message, 403, context)
  }
}

/**
 * External service errors
 */
export class ExternalServiceError extends BaseError {
  public readonly service: string

  constructor(service: string, message: string, context?: Record<string, any>) {
    super(message, 503, { ...context, service })
    this.service = service
  }
}

/**
 * Helper function to determine if error is operational (expected) vs programming error
 */
export function isOperationalError(error: Error): boolean {
  return error instanceof BaseError
}

/**
 * Helper to extract error message safely
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'An unknown error occurred'
}

/**
 * Helper to extract status code from error
 */
export function getErrorStatusCode(error: unknown): number {
  if (error instanceof BaseError) {
    return error.statusCode
  }
  return 500
}
