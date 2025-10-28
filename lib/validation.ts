import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ValidationError } from './errors'

/**
 * Request Validation Utilities
 *
 * Provides helpers for validating API request inputs
 */

/**
 * Validate request body against a Zod schema
 */
export async function validateBody<T>(request: NextRequest, schema: z.ZodSchema<T>): Promise<T> {
  try {
    const body = await request.json()
    return schema.parse(body)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fields = error.errors.map((err) => err.path.join('.'))
      const message = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join(', ')
      throw new ValidationError(message, fields)
    }
    throw error
  }
}

/**
 * Validate query parameters against a Zod schema
 */
export function validateQuery<T>(request: NextRequest, schema: z.ZodSchema<T>): T {
  try {
    const searchParams = request.nextUrl.searchParams
    const params: Record<string, string> = {}

    searchParams.forEach((value, key) => {
      params[key] = value
    })

    return schema.parse(params)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fields = error.errors.map((err) => err.path.join('.'))
      const message = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join(', ')
      throw new ValidationError(message, fields)
    }
    throw error
  }
}

/**
 * Common validation schemas
 */
export const schemas = {
  // Pagination
  pagination: z.object({
    limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional().default('20'),
    offset: z.string().transform(Number).pipe(z.number().min(0)).optional().default('0'),
  }),

  // Chain filter
  chainFilter: z.object({
    chain: z.enum(['BASE', 'SOLANA']).optional(),
  }),

  // Address validation
  address: z.object({
    address: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$|^[1-9A-HJ-NP-Za-km-z]{32,44}$/, 'Invalid blockchain address'),
  }),

  // Date range
  dateRange: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),

  // Protocol ID
  protocolId: z.object({
    id: z.string().cuid(),
  }),
}

/**
 * Create a response with validation error
 */
export function validationErrorResponse(error: ValidationError): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: 'Validation error',
      message: error.message,
      fields: error.fields,
    },
    { status: 400 }
  )
}
