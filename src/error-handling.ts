import { PcoApiError } from './api-error';
import type { ErrorObject as JsonApiError } from './types';

// Error categories for better monitoring
export enum ErrorCategory {
  EXTERNAL_API = 'external_api',
  VALIDATION = 'validation',
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  RATE_LIMIT = 'rate_limit',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown',
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Standard error context interface
export interface ErrorContext {
  endpoint?: string;
  method?: string;
  personId?: string;
  householdId?: string;
  fieldDefinitionId?: string;
  timestamp: string;
  category?: ErrorCategory;
  severity?: ErrorSeverity;
  retryCount?: number;
  metadata?: Record<string, any>;
}

// Enhanced PCO API Error with additional context
export class PcoError extends PcoApiError {
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly context: ErrorContext;
  public readonly retryable: boolean;

  constructor(
    message: string,
    status: number,
    statusText: string,
    errors: JsonApiError[],
    rateLimitHeaders?: Record<string, string | undefined>,
    context: Partial<ErrorContext> = {}
  ) {
    super(message, status, statusText, errors, rateLimitHeaders);
    this.name = 'PcoError';

    // Determine category and severity based on status code
    const { category, retryable, severity } = this.categorizeError(
      status,
      errors
    );

    this.category = category;
    this.severity = severity;
    this.retryable = retryable;

    // Build context
    this.context = {
      category,
      severity,
      timestamp: new Date().toISOString(),
      ...context,
    };
  }

  private categorizeError(
    status: number,
    errors: JsonApiError[]
  ): {
    category: ErrorCategory;
    severity: ErrorSeverity;
    retryable: boolean;
  } {
    // Authentication errors
    if (status === 401) {
      return {
        category: ErrorCategory.AUTHENTICATION,
        retryable: false,
        severity: ErrorSeverity.HIGH,
      };
    }

    // Authorization errors
    if (status === 403) {
      return {
        category: ErrorCategory.AUTHORIZATION,
        retryable: false,
        severity: ErrorSeverity.HIGH,
      };
    }

    // Rate limiting
    if (status === 429) {
      return {
        category: ErrorCategory.RATE_LIMIT,
        retryable: true,
        severity: ErrorSeverity.MEDIUM,
      };
    }

    // Validation errors
    if (status === 400 || status === 422) {
      return {
        category: ErrorCategory.VALIDATION,
        retryable: false,
        severity: ErrorSeverity.LOW,
      };
    }

    // Server errors
    if (status >= 500) {
      return {
        category: ErrorCategory.EXTERNAL_API,
        retryable: true,
        severity: ErrorSeverity.HIGH,
      };
    }

    // Network errors (timeout, connection refused, etc.)
    if (status === 0 || status === 408) {
      return {
        category: ErrorCategory.NETWORK,
        retryable: true,
        severity: ErrorSeverity.MEDIUM,
      };
    }

    // Unknown errors
    return {
      category: ErrorCategory.UNKNOWN,
      retryable: false,
      severity: ErrorSeverity.MEDIUM,
    };
  }

  // Create from fetch error
  static fromFetchError(
    response: Response,
    data?: any,
    context: Partial<ErrorContext> = {}
  ): PcoError {
    const status = response.status;
    const statusText = response.statusText;
    const errors = data?.errors || [];
    const rateLimitHeaders = {
      'Retry-After': response.headers.get('retry-after') || undefined,
      'X-PCO-API-Request-Rate-Count':
        response.headers.get('x-pco-api-request-rate-count') || undefined,
      'X-PCO-API-Request-Rate-Limit':
        response.headers.get('x-pco-api-request-rate-limit') || undefined,
      'X-PCO-API-Request-Rate-Period':
        response.headers.get('x-pco-api-request-rate-period') || undefined,
    };

    const message =
      errors.length > 0
        ? errors
            .map((e: any) => e.detail || e.title || 'Unknown error')
            .join('; ')
        : statusText;

    return new PcoError(
      message,
      status,
      statusText,
      errors,
      rateLimitHeaders,
      context
    );
  }

  // Create from network error
  static fromNetworkError(
    error: Error,
    context: Partial<ErrorContext> = {}
  ): PcoError {
    return new PcoError(
      `Network error: ${error.message}`,
      0,
      'Network Error',
      [],
      undefined,
      {
        ...context,
        category: ErrorCategory.NETWORK,
        severity: ErrorSeverity.MEDIUM,
      }
    );
  }

  // Create from timeout error
  static fromTimeoutError(
    timeoutMs: number,
    context: Partial<ErrorContext> = {}
  ): PcoError {
    return new PcoError(
      `Request timed out after ${timeoutMs}ms`,
      408,
      'Request Timeout',
      [],
      undefined,
      {
        ...context,
        category: ErrorCategory.TIMEOUT,
        severity: ErrorSeverity.MEDIUM,
      }
    );
  }

  // Get retry delay for rate limiting
  getRetryDelay(): number {
    if (this.status === 429 && this.rateLimitHeaders?.['Retry-After']) {
      const retryAfter = parseInt(this.rateLimitHeaders['Retry-After'], 10);

      return isNaN(retryAfter) ? 60000 : retryAfter * 1000; // Convert to milliseconds
    }

    return 0;
  }

  // Check if error should be retried
  shouldRetry(): boolean {
    return this.retryable;
  }

  // Get error summary for logging
  getErrorSummary(): Record<string, any> {
    return {
      category: this.category,
      context: this.context,
      errors: this.errors,
      message: this.message,
      name: this.name,
      rateLimitHeaders: this.rateLimitHeaders,
      retryable: this.retryable,
      severity: this.severity,
      status: this.status,
      statusText: this.statusText,
    };
  }
}

// Determine if an error should not be retried
export function shouldNotRetry(error: any): boolean {
  if (error instanceof PcoError) {
    return !error.shouldRetry();
  }

  if (error instanceof PcoApiError) {
    // Don't retry authentication, authorization, or validation errors
    return (
      error.status === 401 ||
      error.status === 403 ||
      error.status === 400 ||
      error.status === 422
    );
  }

  return false;
}

// Retry with exponential backoff
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    context?: Partial<ErrorContext>;
    onRetry?: (error: PcoError, attempt: number) => void;
  } = {}
): Promise<T> {
  const {
    baseDelay = 1000,
    context = {},
    maxDelay = 30000,
    maxRetries = 3,
    onRetry,
  } = options;

  const attemptOperation = async (attempt: number): Promise<T> => {
    try {
      return await fn();
    } catch (error) {
      // Don't retry on certain error types
      if (shouldNotRetry(error)) {
        throw error;
      }

      if (attempt === maxRetries) {
        // Final attempt failed
        if (error instanceof PcoError) {
          throw error;
        }
        throw error;
      }

      // Calculate delay with exponential backoff
      let delay = Math.min(baseDelay * 2 ** (attempt - 1), maxDelay);

      // If it's a rate limit error, use the retry-after header
      if (error instanceof PcoError && error.status === 429) {
        const retryDelay = error.getRetryDelay();

        if (retryDelay > 0) {
          delay = retryDelay;
        }
      }

      // Call onRetry callback if provided
      if (onRetry && error instanceof PcoError) {
        onRetry(error, attempt);
      }

      // Wait before retry
      await new Promise(resolve => {
        setTimeout(resolve, delay);
      });

      // Try again
      return attemptOperation(attempt + 1);
    }
  };

  return attemptOperation(1);
}

// Error boundary wrapper for async functions
export function withErrorBoundary<T>(
  fn: () => Promise<T>,
  context: Partial<ErrorContext> = {}
): Promise<T> {
  return fn().catch(error => {
    if (error instanceof PcoError) {
      throw error;
    }

    // Wrap unknown errors
    const pcoError = new PcoError(
      error.message || 'Unknown error',
      0,
      'Unknown Error',
      [],
      undefined,
      {
        ...context,
        category: ErrorCategory.UNKNOWN,
        severity: ErrorSeverity.HIGH,
      }
    );

    throw pcoError;
  });
}

// Validation error handler
export function handleValidationError(
  error: unknown,
  field: string,
  context: Partial<ErrorContext> = {}
): never {
  if (error instanceof PcoError) {
    throw error;
  }

  const pcoError = new PcoError(
    `Validation failed for field: ${field}`,
    400,
    'Bad Request',
    [],
    undefined,
    {
      ...context,
      category: ErrorCategory.VALIDATION,
      metadata: { field },
      severity: ErrorSeverity.LOW,
    }
  );

  throw pcoError;
}

// Timeout error handler
export function handleTimeoutError(
  operation: string,
  timeoutMs: number,
  context: Partial<ErrorContext> = {}
): never {
  const pcoError = PcoError.fromTimeoutError(timeoutMs, {
    ...context,
    metadata: { operation, timeoutMs },
  });

  throw pcoError;
}

// Network error handler
export function handleNetworkError(
  error: unknown,
  operation: string,
  context: Partial<ErrorContext> = {}
): never {
  if (error instanceof PcoError) {
    throw error;
  }

  const pcoError = PcoError.fromNetworkError(
    error instanceof Error ? error : new Error(String(error)),
    {
      ...context,
      metadata: { operation },
    }
  );

  throw pcoError;
}
