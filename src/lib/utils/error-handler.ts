/**
 * Standardized error handling utilities
 * Provides consistent error handling across the application
 */

import { TRPCError } from '@trpc/server';
import { logger } from './logger';

export interface AppError {
  code: string;
  message: string;
  statusCode: number;
  details?: any;
}

export class StandardError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: any;

  constructor(error: AppError) {
    super(error.message);
    this.name = 'StandardError';
    this.code = error.code;
    this.statusCode = error.statusCode;
    this.details = error.details;
  }
}

// Predefined error types
export const ErrorCodes = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // Resource Management
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',
  
  // Database
  DATABASE_ERROR: 'DATABASE_ERROR',
  CONSTRAINT_VIOLATION: 'CONSTRAINT_VIOLATION',
  
  // External Services
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // System
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

export const ErrorMessages = {
  [ErrorCodes.UNAUTHORIZED]: 'Authentication required',
  [ErrorCodes.FORBIDDEN]: 'Access denied',
  [ErrorCodes.INVALID_CREDENTIALS]: 'Invalid email or password',
  [ErrorCodes.SESSION_EXPIRED]: 'Session has expired',
  [ErrorCodes.VALIDATION_ERROR]: 'Validation failed',
  [ErrorCodes.INVALID_INPUT]: 'Invalid input provided',
  [ErrorCodes.MISSING_REQUIRED_FIELD]: 'Required field is missing',
  [ErrorCodes.NOT_FOUND]: 'Resource not found',
  [ErrorCodes.ALREADY_EXISTS]: 'Resource already exists',
  [ErrorCodes.CONFLICT]: 'Resource conflict',
  [ErrorCodes.DATABASE_ERROR]: 'Database operation failed',
  [ErrorCodes.CONSTRAINT_VIOLATION]: 'Database constraint violation',
  [ErrorCodes.EXTERNAL_SERVICE_ERROR]: 'External service error',
  [ErrorCodes.RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded',
  [ErrorCodes.INTERNAL_ERROR]: 'Internal server error',
  [ErrorCodes.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable',
} as const;

// Error factory functions
export function createError(
  code: keyof typeof ErrorCodes,
  message?: string,
  details?: any
): StandardError {
  return new StandardError({
    code: ErrorCodes[code],
    message: message || ErrorMessages[ErrorCodes[code]],
    statusCode: getStatusCode(code),
    details,
  });
}

export function createTRPCError(
  code: keyof typeof ErrorCodes,
  message?: string,
  details?: any
): TRPCError {
  const standardError = createError(code, message, details);
  
  return new TRPCError({
    code: getTRPCCode(standardError.statusCode),
    message: standardError.message,
    cause: standardError,
  });
}

// Helper functions
function getStatusCode(code: keyof typeof ErrorCodes): number {
  const statusMap: Record<string, number> = {
    [ErrorCodes.UNAUTHORIZED]: 401,
    [ErrorCodes.FORBIDDEN]: 403,
    [ErrorCodes.INVALID_CREDENTIALS]: 401,
    [ErrorCodes.SESSION_EXPIRED]: 401,
    [ErrorCodes.VALIDATION_ERROR]: 400,
    [ErrorCodes.INVALID_INPUT]: 400,
    [ErrorCodes.MISSING_REQUIRED_FIELD]: 400,
    [ErrorCodes.NOT_FOUND]: 404,
    [ErrorCodes.ALREADY_EXISTS]: 409,
    [ErrorCodes.CONFLICT]: 409,
    [ErrorCodes.DATABASE_ERROR]: 500,
    [ErrorCodes.CONSTRAINT_VIOLATION]: 400,
    [ErrorCodes.EXTERNAL_SERVICE_ERROR]: 502,
    [ErrorCodes.RATE_LIMIT_EXCEEDED]: 429,
    [ErrorCodes.INTERNAL_ERROR]: 500,
    [ErrorCodes.SERVICE_UNAVAILABLE]: 503,
  };

  return statusMap[ErrorCodes[code]] || 500;
}

function getTRPCCode(statusCode: number): 'BAD_REQUEST' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'INTERNAL_SERVER_ERROR' {
  if (statusCode >= 400 && statusCode < 500) {
    if (statusCode === 401) return 'UNAUTHORIZED';
    if (statusCode === 403) return 'FORBIDDEN';
    if (statusCode === 404) return 'NOT_FOUND';
    return 'BAD_REQUEST';
  }
  return 'INTERNAL_SERVER_ERROR';
}

// Error handling wrapper for async functions
export async function handleAsyncError<T>(
  fn: () => Promise<T>,
  context?: string
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    logger.error(`Error in ${context || 'async operation'}:`, error);
    
    if (error instanceof StandardError) {
      throw error;
    }
    
    if (error instanceof TRPCError) {
      throw error;
    }
    
    // Convert unknown errors to standard errors
    throw createError('INTERNAL_ERROR', 'An unexpected error occurred', {
      originalError: error instanceof Error ? error.message : 'Unknown error',
      context,
    });
  }
}

// Error handling wrapper for sync functions
export function handleSyncError<T>(
  fn: () => T,
  context?: string
): T {
  try {
    return fn();
  } catch (error) {
    logger.error(`Error in ${context || 'sync operation'}:`, error);
    
    if (error instanceof StandardError) {
      throw error;
    }
    
    // Convert unknown errors to standard errors
    throw createError('INTERNAL_ERROR', 'An unexpected error occurred', {
      originalError: error instanceof Error ? error.message : 'Unknown error',
      context,
    });
  }
}

// Validation error helper
export function createValidationError(field: string, message: string): StandardError {
  return createError('VALIDATION_ERROR', `Validation failed for field '${field}': ${message}`, {
    field,
    validationMessage: message,
  });
}

// Database error helper
export function createDatabaseError(operation: string, originalError: any): StandardError {
  logger.error(`Database error in ${operation}:`, originalError);
  
  return createError('DATABASE_ERROR', `Database operation failed: ${operation}`, {
    operation,
    originalError: originalError instanceof Error ? originalError.message : 'Unknown database error',
  });
}
