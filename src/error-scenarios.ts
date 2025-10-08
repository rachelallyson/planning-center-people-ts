/**
 * Enhanced Error Handling Scenarios
 *
 * This module provides comprehensive error handling for various edge cases
 * and failure scenarios that can occur when working with the PCO People API.
 */

import { PcoApiError } from './api-error';
import type { PcoClientState } from './core';

// ===== Error Recovery Strategies =====

/**
 * Retry configuration for different error types
 */
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryableStatuses: number[];
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  backoffFactor: 2,
  baseDelay: 1000,
  maxDelay: 30000,
  maxRetries: 3,
  retryableStatuses: [429, 500, 502, 503, 504],
};

/**
 * Enhanced retry with exponential backoff and jitter
 */
export async function retryWithExponentialBackoff<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error;

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on the last attempt
      if (attempt === finalConfig.maxRetries) {
        break;
      }

      // Check if error is retryable
      if (!isRetryableError(error, finalConfig.retryableStatuses)) {
        break;
      }

      // Calculate delay with jitter
      const delay = calculateDelay(attempt, finalConfig);

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: any, retryableStatuses: number[]): boolean {
  if (error instanceof PcoApiError) {
    return retryableStatuses.includes(error.status);
  }

  // Network errors are generally retryable
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return true;
  }

  return false;
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  const exponentialDelay =
    config.baseDelay * Math.pow(config.backoffFactor, attempt);
  const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter

  return Math.min(exponentialDelay + jitter, config.maxDelay);
}

// ===== Circuit Breaker Pattern =====

/**
 * Circuit breaker for API calls
 */
export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private failureThreshold = 5,
    private recoveryTimeout = 60000, // 1 minute
    private monitoringPeriod = 60000 // 1 minute
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN - operation blocked');
      }
    }

    try {
      const result = await operation();

      this.onSuccess();

      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  getState(): string {
    return this.state;
  }

  getFailureCount(): number {
    return this.failureCount;
  }
}

// ===== Bulk Operation Error Handling =====

/**
 * Result of a bulk operation with individual item results
 */
export interface BulkOperationResult<T> {
  successful: { index: number; data: T }[];
  failed: { index: number; error: Error; data?: any }[];
  totalProcessed: number;
  successRate: number;
}

/**
 * Execute bulk operations with individual error handling
 */
export async function executeBulkOperation<T, R>(
  items: T[],
  operation: (item: T, index: number) => Promise<R>,
  options: {
    continueOnError?: boolean;
    batchSize?: number;
    onItemComplete?: (index: number, result: R | Error) => void;
  } = {}
): Promise<BulkOperationResult<R>> {
  const { batchSize = 10, continueOnError = true, onItemComplete } = options;
  const successful: { index: number; data: R }[] = [];
  const failed: { index: number; error: Error; data?: any }[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    const batchPromises = batch.map(async (item, batchIndex) => {
      const globalIndex = i + batchIndex;

      try {
        const result = await operation(item, globalIndex);

        successful.push({ data: result, index: globalIndex });
        onItemComplete?.(globalIndex, result);

        return { index: globalIndex, result, success: true };
      } catch (error) {
        const errorObj = error as Error;

        failed.push({ data: item, error: errorObj, index: globalIndex });
        onItemComplete?.(globalIndex, errorObj);

        if (!continueOnError) {
          throw errorObj;
        }

        return { error: errorObj, index: globalIndex, success: false };
      }
    });

    await Promise.all(batchPromises);
  }

  const totalProcessed = successful.length + failed.length;
  const successRate =
    totalProcessed > 0 ? successful.length / totalProcessed : 0;

  return {
    failed,
    successful,
    successRate,
    totalProcessed,
  };
}

// ===== Timeout Handling =====

/**
 * Execute operation with timeout
 */
export async function withTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number,
  timeoutMessage?: string
): Promise<T> {
  return Promise.race([
    operation(),
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(
          new Error(
            timeoutMessage || `Operation timed out after ${timeoutMs}ms`
          )
        );
      }, timeoutMs);
    }),
  ]);
}

/**
 * Timeout configuration for different operations
 */
export const TIMEOUT_CONFIG = {
  // 10 seconds
  BULK: 60000,

  // 15 seconds
  DELETE: 10000,

  // 60 seconds
  EXPORT: 300000,

  GET: 10000,

  // 15 seconds
  PATCH: 15000,
  // 10 seconds
  POST: 15000, // 5 minutes
} as const;

// ===== Error Classification =====

/**
 * Classify errors for appropriate handling
 */
export function classifyError(error: any): {
  category:
    | 'network'
    | 'authentication'
    | 'authorization'
    | 'validation'
    | 'rate_limit'
    | 'server'
    | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  retryable: boolean;
  userMessage: string;
} {
  if (error instanceof PcoApiError) {
    return classifyPcoError(error);
  }

  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return {
      category: 'network',
      retryable: true,
      severity: 'medium',
      userMessage:
        'Network connection error. Please check your internet connection.',
    };
  }

  if (error.message.includes('timeout')) {
    return {
      category: 'network',
      retryable: true,
      severity: 'medium',
      userMessage: 'Request timed out. Please try again.',
    };
  }

  return {
    category: 'unknown',
    retryable: false,
    severity: 'high',
    userMessage: 'An unexpected error occurred. Please try again.',
  };
}

/**
 * Classify PCO API errors
 */
function classifyPcoError(error: PcoApiError): {
  category:
    | 'network'
    | 'authentication'
    | 'authorization'
    | 'validation'
    | 'rate_limit'
    | 'server'
    | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  retryable: boolean;
  userMessage: string;
} {
  const status = error.status;
  const errors = error.errors;

  // Rate limiting
  if (status === 429) {
    return {
      category: 'rate_limit',
      retryable: true,
      severity: 'medium',
      userMessage:
        'Rate limit exceeded. Please wait a moment before trying again.',
    };
  }

  // Authentication
  if (status === 401) {
    return {
      category: 'authentication',
      retryable: false,
      severity: 'high',
      userMessage: 'Authentication failed. Please check your credentials.',
    };
  }

  // Authorization
  if (status === 403) {
    return {
      category: 'authorization',
      retryable: false,
      severity: 'high',
      userMessage: 'You do not have permission to perform this action.',
    };
  }

  // Validation
  if (status === 422) {
    const validationErrors = errors.map(e => e.detail).join(', ');

    return {
      category: 'validation',
      retryable: false,
      severity: 'medium',
      userMessage: `Validation error: ${validationErrors}`,
    };
  }

  // Server errors
  if (status >= 500) {
    return {
      category: 'server',
      retryable: true,
      severity: 'high',
      userMessage: 'Server error occurred. Please try again later.',
    };
  }

  // Not found
  if (status === 404) {
    return {
      category: 'validation',
      retryable: false,
      severity: 'medium',
      userMessage: 'The requested resource was not found.',
    };
  }

  return {
    category: 'unknown',
    retryable: false,
    severity: 'medium',
    userMessage:
      error.message || 'An error occurred while processing your request.',
  };
}

// ===== Error Recovery =====

/**
 * Attempt to recover from common error scenarios
 */
export async function attemptRecovery<T>(
  operation: () => Promise<T>,
  error: any,
  context: {
    client: PcoClientState;
    operation: string;
    maxRetries?: number;
  }
): Promise<T> {
  const classification = classifyError(error);

  if (!classification.retryable) {
    throw error;
  }

  // Rate limit recovery
  if (
    classification.category === 'rate_limit' &&
    error instanceof PcoApiError
  ) {
    const retryAfter = error.rateLimitHeaders?.['Retry-After'];

    if (retryAfter) {
      const delay = parseInt(retryAfter) * 1000;

      await new Promise(resolve => setTimeout(resolve, delay));

      return operation();
    }
  }

  // Network error recovery
  if (classification.category === 'network') {
    return retryWithExponentialBackoff(operation, {
      baseDelay: 1000,
      maxRetries: context.maxRetries || 3,
    });
  }

  // Server error recovery
  if (classification.category === 'server') {
    return retryWithExponentialBackoff(operation, {
      baseDelay: 2000,
      maxRetries: context.maxRetries || 2,
    });
  }

  throw error;
}

// ===== Error Reporting =====

/**
 * Enhanced error reporting with context
 */
export interface ErrorReport {
  timestamp: string;
  operation: string;
  error: {
    name: string;
    message: string;
    stack?: string;
    status?: number;
    errors?: any[];
  };
  context: {
    clientConfig: {
      hasAppId: boolean;
      hasAppSecret: boolean;
      hasAccessToken: boolean;
    };
    requestInfo?: {
      url?: string;
      method?: string;
      headers?: Record<string, string>;
    };
  };
  classification: ReturnType<typeof classifyError>;
}

/**
 * Create detailed error report
 */
export function createErrorReport(
  error: any,
  context: {
    operation: string;
    client: PcoClientState;
    requestInfo?: {
      url?: string;
      method?: string;
      headers?: Record<string, string>;
    };
  }
): ErrorReport {
  const classification = classifyError(error);

  return {
    classification,
    context: {
      clientConfig: {
        hasAccessToken: !!context.client.config.accessToken,
        hasAppId: !!context.client.config.appId,
        hasAppSecret: !!context.client.config.appSecret,
      },
      requestInfo: context.requestInfo,
    },
    error: {
      errors: error.errors,
      message: error.message || 'Unknown error',
      name: error.name || 'UnknownError',
      stack: error.stack,
      status: error.status,
    },
    operation: context.operation,
    timestamp: new Date().toISOString(),
  };
}
