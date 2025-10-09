# Error Handling Guide

This guide covers comprehensive error handling patterns, best practices, and advanced techniques for the Planning Center People TypeScript library.

## Table of Contents

1. [Error Types & Categories](#error-types--categories)
2. [Basic Error Handling](#basic-error-handling)
3. [Advanced Error Patterns](#advanced-error-patterns)
4. [Retry Logic & Circuit Breakers](#retry-logic--circuit-breakers)
5. [Error Monitoring & Logging](#error-monitoring--logging)
6. [Production Error Handling](#production-error-handling)
7. [Testing Error Scenarios](#testing-error-scenarios)
8. [Troubleshooting Common Errors](#troubleshooting-common-errors)

## Error Types & Categories

### PcoError Class

The library provides a comprehensive `PcoError` class that extends the standard `Error` class with additional context and categorization.

```typescript
import { PcoError, ErrorCategory, ErrorSeverity } from '@rachelallyson/planning-center-people-ts';

// PcoError properties
interface PcoError extends Error {
  status: number;           // HTTP status code
  category: ErrorCategory;  // Error category
  severity: ErrorSeverity;  // Error severity level
  retryable: boolean;       // Whether the error can be retried
  context: ErrorContext;    // Additional error context
  errors?: any[];          // Detailed error information from API
  getRetryDelay(): number; // Get recommended retry delay
  getErrorSummary(): object; // Get error summary
}
```

### Error Categories

```typescript
enum ErrorCategory {
  AUTHENTICATION = 'authentication',    // 401 errors
  AUTHORIZATION = 'authorization',      // 403 errors
  RATE_LIMIT = 'rate_limit',           // 429 errors
  VALIDATION = 'validation',           // 400/422 errors
  NETWORK = 'network',                 // Connection/timeout errors
  EXTERNAL_API = 'external_api',       // 5xx server errors
  TIMEOUT = 'timeout',                 // Request timeout errors
  UNKNOWN = 'unknown'                  // Unknown errors
}
```

### Error Severity Levels

```typescript
enum ErrorSeverity {
  LOW = 'low',           // Validation errors, minor issues
  MEDIUM = 'medium',     // Rate limits, network issues
  HIGH = 'high',         // Auth errors, server errors
  CRITICAL = 'critical'  // Critical system failures
}
```

### Error Context

```typescript
interface ErrorContext {
  endpoint: string;                    // API endpoint
  method: string;                      // HTTP method
  personId?: string;                   // Person ID (if applicable)
  metadata?: Record<string, any>;      // Additional metadata
  timestamp: Date;                     // Error timestamp
  requestId?: string;                  // Request ID for tracking
}
```

## Basic Error Handling

### Simple Try-Catch Pattern

```typescript
import { getPeople, PcoError, ErrorCategory } from '@rachelallyson/planning-center-people-ts';

async function getPeopleSafely() {
  try {
    const people = await getPeople(client, { per_page: 50 });
    return { success: true, data: people.data };
  } catch (error) {
    if (error instanceof PcoError) {
      console.error('PCO Error:', {
        message: error.message,
        status: error.status,
        category: error.category,
        severity: error.severity,
        retryable: error.retryable
      });
      
      return { success: false, error: error.message };
    }
    
    console.error('Unexpected error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
```

### Error Category Handling

```typescript
async function handleApiCall(operation: () => Promise<any>) {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof PcoError) {
      switch (error.category) {
        case ErrorCategory.AUTHENTICATION:
          // Handle authentication errors
          console.error('Authentication failed - check your credentials');
          await handleAuthenticationError(error);
          break;
          
        case ErrorCategory.AUTHORIZATION:
          // Handle authorization errors
          console.error('Insufficient permissions for this operation');
          await handleAuthorizationError(error);
          break;
          
        case ErrorCategory.RATE_LIMIT:
          // Handle rate limiting
          console.error('Rate limited - retry after:', error.getRetryDelay(), 'ms');
          await handleRateLimitError(error);
          break;
          
        case ErrorCategory.VALIDATION:
          // Handle validation errors
          console.error('Validation error - check your request data');
          await handleValidationError(error);
          break;
          
        case ErrorCategory.NETWORK:
          // Handle network errors
          console.error('Network error - check your connection');
          await handleNetworkError(error);
          break;
          
        case ErrorCategory.EXTERNAL_API:
          // Handle server errors
          console.error('Server error - try again later');
          await handleServerError(error);
          break;
          
        case ErrorCategory.TIMEOUT:
          // Handle timeout errors
          console.error('Request timeout - operation took too long');
          await handleTimeoutError(error);
          break;
          
        default:
          console.error('Unknown error:', error.message);
          await handleUnknownError(error);
      }
    }
    
    throw error; // Re-throw if not a PcoError
  }
}
```

## Advanced Error Patterns

### Error Boundary Wrapper

```typescript
import { withErrorBoundary } from '@rachelallyson/planning-center-people-ts';

// Wrap operations with error boundary
async function safeOperation<T>(
  operation: () => Promise<T>,
  context: { operation: string; personId?: string; metadata?: any }
): Promise<{ success: true; data: T } | { success: false; error: string; details?: any }> {
  try {
    const result = await withErrorBoundary(operation, {
      endpoint: context.operation,
      method: 'GET',
      personId: context.personId,
      metadata: context.metadata
    });
    
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof PcoError) {
      return {
        success: false,
        error: error.message,
        details: {
          category: error.category,
          severity: error.severity,
          status: error.status,
          retryable: error.retryable
        }
      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Usage example
async function getPersonSafely(personId: string) {
  const result = await safeOperation(
    () => getPerson(client, personId, ['emails', 'phone_numbers']),
    { operation: 'get_person', personId }
  );
  
  if (result.success) {
    return result.data;
  } else {
    throw new Error(result.error);
  }
}
```

### Error Recovery Strategies

```typescript
// Error recovery with fallback strategies
async function getPersonWithFallback(personId: string) {
  try {
    // Primary operation
    return await getPerson(client, personId, ['emails', 'phone_numbers']);
  } catch (error) {
    if (error instanceof PcoError) {
      switch (error.category) {
        case ErrorCategory.NETWORK:
          // Try with reduced includes
          console.log('Network error, trying with minimal data...');
          return await getPerson(client, personId);
          
        case ErrorCategory.RATE_LIMIT:
          // Wait and retry
          const delay = error.getRetryDelay();
          console.log(`Rate limited, waiting ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return await getPerson(client, personId, ['emails', 'phone_numbers']);
          
        case ErrorCategory.AUTHENTICATION:
          // Try to refresh tokens
          console.log('Authentication error, attempting token refresh...');
          await refreshTokens();
          return await getPerson(client, personId, ['emails', 'phone_numbers']);
          
        default:
          throw error;
      }
    }
    throw error;
  }
}
```

### Batch Error Handling

```typescript
// Handle errors in batch operations
async function processBatchWithErrorHandling<T>(
  items: T[],
  processor: (item: T) => Promise<any>,
  options: {
    batchSize?: number;
    continueOnError?: boolean;
    onError?: (error: Error, item: T) => void;
  } = {}
) {
  const { batchSize = 10, continueOnError = true, onError } = options;
  const results: Array<{ success: boolean; data?: any; error?: string; item: T }> = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    const batchResults = await Promise.allSettled(
      batch.map(async (item) => {
        try {
          const data = await processor(item);
          return { success: true, data, item };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          if (onError) {
            onError(error instanceof Error ? error : new Error(errorMessage), item);
          }
          
          if (continueOnError) {
            return { success: false, error: errorMessage, item };
          } else {
            throw error;
          }
        }
      })
    );
    
    results.push(...batchResults.map(result => 
      result.status === 'fulfilled' ? result.value : {
        success: false,
        error: result.reason.message,
        item: null
      }
    ));
  }
  
  return {
    successful: results.filter(r => r.success),
    failed: results.filter(r => !r.success),
    successCount: results.filter(r => r.success).length,
    failureCount: results.filter(r => !r.success).length
  };
}

// Usage example
async function updateMultiplePeople(peopleUpdates: Array<{ id: string; data: any }>) {
  const results = await processBatchWithErrorHandling(
    peopleUpdates,
    async (update) => {
      return await updatePerson(client, update.id, update.data);
    },
    {
      batchSize: 5,
      continueOnError: true,
      onError: (error, update) => {
        console.error(`Failed to update person ${update.id}:`, error.message);
      }
    }
  );
  
  console.log(`Updated ${results.successCount} people successfully`);
  if (results.failureCount > 0) {
    console.log(`Failed to update ${results.failureCount} people`);
  }
  
  return results;
}
```

## Retry Logic & Circuit Breakers

### Exponential Backoff Retry

```typescript
import { retryWithBackoff } from '@rachelallyson/planning-center-people-ts';

// Custom retry configuration
async function retryOperation<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    context?: any;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    context = {}
  } = options;
  
  return await retryWithBackoff(operation, {
    maxRetries,
    baseDelay,
    maxDelay,
    context: {
      endpoint: context.endpoint || 'unknown',
      method: context.method || 'GET',
      ...context
    },
    onRetry: (error, attempt) => {
      console.log(`Retry attempt ${attempt}:`, {
        error: error.message,
        endpoint: context.endpoint,
        delay: Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay)
      });
    }
  });
}

// Usage example
async function createPersonWithRetry(personData: any) {
  return await retryOperation(
    () => createPerson(client, personData),
    {
      maxRetries: 3,
      baseDelay: 1000,
      context: { endpoint: '/people', method: 'POST' }
    }
  );
}
```

### Circuit Breaker Pattern

```typescript
// Simple circuit breaker implementation
class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private threshold: number = 5,
    private timeout: number = 60000 // 1 minute
  ) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
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
  
  private onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }
  
  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
    }
  }
  
  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime
    };
  }
}

// Usage with PCO client
const circuitBreaker = new CircuitBreaker(5, 60000);

async function getPersonWithCircuitBreaker(personId: string) {
  return await circuitBreaker.execute(() => getPerson(client, personId));
}
```

### Adaptive Retry Strategy

```typescript
// Adaptive retry based on error type
class AdaptiveRetryStrategy {
  private retryConfigs = {
    [ErrorCategory.NETWORK]: { maxRetries: 5, baseDelay: 1000 },
    [ErrorCategory.RATE_LIMIT]: { maxRetries: 3, baseDelay: 2000 },
    [ErrorCategory.EXTERNAL_API]: { maxRetries: 2, baseDelay: 5000 },
    [ErrorCategory.TIMEOUT]: { maxRetries: 3, baseDelay: 1000 }
  };
  
  async execute<T>(
    operation: () => Promise<T>,
    context: { endpoint: string; method: string }
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (error instanceof PcoError) {
          const config = this.retryConfigs[error.category];
          
          if (config && attempt < config.maxRetries) {
            const delay = config.baseDelay * Math.pow(2, attempt);
            console.log(`Retrying in ${delay}ms (attempt ${attempt + 1}/${config.maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        
        break;
      }
    }
    
    throw lastError!;
  }
}

// Usage
const retryStrategy = new AdaptiveRetryStrategy();

async function adaptiveApiCall<T>(operation: () => Promise<T>, context: any): Promise<T> {
  return await retryStrategy.execute(operation, context);
}
```

## Error Monitoring & Logging

### Structured Error Logging

```typescript
// Structured error logging
interface ErrorLogEntry {
  timestamp: Date;
  level: 'error' | 'warn' | 'info';
  category: string;
  severity: string;
  message: string;
  context: any;
  stack?: string;
  userId?: string;
  requestId?: string;
}

class ErrorLogger {
  private logs: ErrorLogEntry[] = [];
  
  logError(error: Error, context: any = {}) {
    const logEntry: ErrorLogEntry = {
      timestamp: new Date(),
      level: 'error',
      category: error instanceof PcoError ? error.category : 'unknown',
      severity: error instanceof PcoError ? error.severity : 'medium',
      message: error.message,
      context: {
        ...context,
        ...(error instanceof PcoError ? {
          status: error.status,
          retryable: error.retryable,
          endpoint: error.context.endpoint,
          method: error.context.method
        } : {})
      },
      stack: error.stack
    };
    
    this.logs.push(logEntry);
    
    // Send to external logging service
    this.sendToLoggingService(logEntry);
  }
  
  private async sendToLoggingService(logEntry: ErrorLogEntry) {
    // Send to your logging service (e.g., LogRocket, Sentry, etc.)
    console.error('Error logged:', logEntry);
  }
  
  getErrorStats() {
    const stats = {
      total: this.logs.length,
      byCategory: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      recent: this.logs.slice(-10)
    };
    
    this.logs.forEach(log => {
      stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1;
      stats.bySeverity[log.severity] = (stats.bySeverity[log.severity] || 0) + 1;
    });
    
    return stats;
  }
}

// Usage
const errorLogger = new ErrorLogger();

async function monitoredApiCall<T>(operation: () => Promise<T>, context: any): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    errorLogger.logError(error as Error, context);
    throw error;
  }
}
```

### Error Metrics Collection

```typescript
// Error metrics collection
class ErrorMetrics {
  private metrics = {
    totalErrors: 0,
    errorsByCategory: {} as Record<string, number>,
    errorsBySeverity: {} as Record<string, number>,
    retryableErrors: 0,
    nonRetryableErrors: 0,
    averageRetryDelay: 0,
    retryDelays: [] as number[]
  };
  
  recordError(error: PcoError) {
    this.metrics.totalErrors++;
    this.metrics.errorsByCategory[error.category] = 
      (this.metrics.errorsByCategory[error.category] || 0) + 1;
    this.metrics.errorsBySeverity[error.severity] = 
      (this.metrics.errorsBySeverity[error.severity] || 0) + 1;
    
    if (error.retryable) {
      this.metrics.retryableErrors++;
      const delay = error.getRetryDelay();
      this.metrics.retryDelays.push(delay);
      this.metrics.averageRetryDelay = 
        this.metrics.retryDelays.reduce((a, b) => a + b, 0) / this.metrics.retryDelays.length;
    } else {
      this.metrics.nonRetryableErrors++;
    }
  }
  
  getMetrics() {
    return {
      ...this.metrics,
      retrySuccessRate: this.metrics.retryableErrors / this.metrics.totalErrors,
      mostCommonCategory: Object.entries(this.metrics.errorsByCategory)
        .sort(([,a], [,b]) => b - a)[0]?.[0],
      mostCommonSeverity: Object.entries(this.metrics.errorsBySeverity)
        .sort(([,a], [,b]) => b - a)[0]?.[0]
    };
  }
  
  reset() {
    this.metrics = {
      totalErrors: 0,
      errorsByCategory: {},
      errorsBySeverity: {},
      retryableErrors: 0,
      nonRetryableErrors: 0,
      averageRetryDelay: 0,
      retryDelays: []
    };
  }
}

// Usage
const errorMetrics = new ErrorMetrics();

async function trackedApiCall<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof PcoError) {
      errorMetrics.recordError(error);
    }
    throw error;
  }
}
```

## Production Error Handling

### Error Handler Middleware

```typescript
// Express.js error handling middleware
import { Request, Response, NextFunction } from 'express';
import { PcoError, ErrorCategory } from '@rachelallyson/planning-center-people-ts';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  if (error instanceof PcoError) {
    const statusCode = getStatusCodeForError(error);
    const response = {
      error: error.message,
      category: error.category,
      severity: error.severity,
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
        context: error.context
      })
    };
    
    res.status(statusCode).json(response);
  } else {
    res.status(500).json({
      error: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && {
        message: error.message,
        stack: error.stack
      })
    });
  }
}

function getStatusCodeForError(error: PcoError): number {
  switch (error.category) {
    case ErrorCategory.AUTHENTICATION:
      return 401;
    case ErrorCategory.AUTHORIZATION:
      return 403;
    case ErrorCategory.RATE_LIMIT:
      return 429;
    case ErrorCategory.VALIDATION:
      return 400;
    case ErrorCategory.NETWORK:
    case ErrorCategory.TIMEOUT:
      return 503;
    case ErrorCategory.EXTERNAL_API:
      return 502;
    default:
      return 500;
  }
}
```

### Global Error Handler

```typescript
// Global error handler for unhandled errors
class GlobalErrorHandler {
  private static instance: GlobalErrorHandler;
  
  static getInstance(): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler();
    }
    return GlobalErrorHandler.instance;
  }
  
  private constructor() {
    this.setupGlobalHandlers();
  }
  
  private setupGlobalHandlers() {
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      this.logError(new Error(`Unhandled Rejection: ${reason}`), {
        type: 'unhandledRejection',
        promise: promise.toString()
      });
    });
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      this.logError(error, {
        type: 'uncaughtException'
      });
      
      // Exit process after logging
      process.exit(1);
    });
  }
  
  private logError(error: Error, context: any) {
    // Send to your logging service
    console.error('Global error logged:', {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    });
  }
}

// Initialize global error handler
GlobalErrorHandler.getInstance();
```

### Health Check with Error Status

```typescript
// Health check endpoint that includes error status
export async function healthCheck(req: Request, res: Response) {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      pco: await checkPcoHealth(),
      database: await checkDatabaseHealth(),
      external: await checkExternalServicesHealth()
    },
    metrics: errorMetrics.getMetrics()
  };
  
  // Determine overall health
  const hasErrors = health.metrics.totalErrors > 100; // Threshold
  const hasCriticalErrors = health.metrics.errorsBySeverity.critical > 0;
  
  if (hasCriticalErrors) {
    health.status = 'unhealthy';
    res.status(503);
  } else if (hasErrors) {
    health.status = 'degraded';
    res.status(200);
  }
  
  res.json(health);
}

async function checkPcoHealth(): Promise<{ status: string; latency?: number }> {
  try {
    const start = Date.now();
    await getOrganization(client);
    const latency = Date.now() - start;
    
    return { status: 'healthy', latency };
  } catch (error) {
    return { status: 'unhealthy' };
  }
}
```

## Testing Error Scenarios

### Error Testing Utilities

```typescript
// Test utilities for error scenarios
class ErrorTestHelper {
  static createMockPcoError(
    category: ErrorCategory,
    status: number = 500,
    message: string = 'Test error'
  ): PcoError {
    const error = new PcoError(message);
    error.category = category;
    error.status = status;
    error.severity = this.getSeverityForCategory(category);
    error.retryable = this.isRetryable(category);
    error.context = {
      endpoint: '/test',
      method: 'GET',
      timestamp: new Date()
    };
    
    return error;
  }
  
  private static getSeverityForCategory(category: ErrorCategory): ErrorSeverity {
    switch (category) {
      case ErrorCategory.AUTHENTICATION:
      case ErrorCategory.AUTHORIZATION:
        return ErrorSeverity.HIGH;
      case ErrorCategory.RATE_LIMIT:
      case ErrorCategory.NETWORK:
        return ErrorSeverity.MEDIUM;
      case ErrorCategory.VALIDATION:
        return ErrorSeverity.LOW;
      default:
        return ErrorSeverity.MEDIUM;
    }
  }
  
  private static isRetryable(category: ErrorCategory): boolean {
    return [
      ErrorCategory.NETWORK,
      ErrorCategory.RATE_LIMIT,
      ErrorCategory.EXTERNAL_API,
      ErrorCategory.TIMEOUT
    ].includes(category);
  }
}

// Jest test examples
describe('Error Handling', () => {
  test('should handle authentication errors', async () => {
    const mockError = ErrorTestHelper.createMockPcoError(
      ErrorCategory.AUTHENTICATION,
      401,
      'Invalid credentials'
    );
    
    // Mock the API call to throw the error
    jest.spyOn(client, 'getPeople').mockRejectedValue(mockError);
    
    const result = await getPeopleSafely();
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid credentials');
  });
  
  test('should retry on network errors', async () => {
    const mockError = ErrorTestHelper.createMockPcoError(
      ErrorCategory.NETWORK,
      0,
      'Network error'
    );
    
    let callCount = 0;
    jest.spyOn(client, 'getPeople').mockImplementation(() => {
      callCount++;
      if (callCount < 3) {
        throw mockError;
      }
      return Promise.resolve({ data: [] });
    });
    
    const result = await retryOperation(() => getPeople(client));
    
    expect(callCount).toBe(3);
    expect(result.data).toEqual([]);
  });
});
```

### Error Simulation

```typescript
// Error simulation for testing
class ErrorSimulator {
  private errorRate = 0; // 0-1, percentage of requests that should fail
  private errorCategory = ErrorCategory.UNKNOWN;
  
  setErrorRate(rate: number) {
    this.errorRate = Math.max(0, Math.min(1, rate));
  }
  
  setErrorCategory(category: ErrorCategory) {
    this.errorCategory = category;
  }
  
  async simulateError<T>(operation: () => Promise<T>): Promise<T> {
    if (Math.random() < this.errorRate) {
      const error = ErrorTestHelper.createMockPcoError(
        this.errorCategory,
        500,
        'Simulated error'
      );
      throw error;
    }
    
    return await operation();
  }
}

// Usage in tests
const errorSimulator = new ErrorSimulator();

test('should handle 50% error rate', async () => {
  errorSimulator.setErrorRate(0.5);
  errorSimulator.setErrorCategory(ErrorCategory.NETWORK);
  
  const results = [];
  for (let i = 0; i < 100; i++) {
    try {
      const result = await errorSimulator.simulateError(() => getPeople(client));
      results.push({ success: true, data: result });
    } catch (error) {
      results.push({ success: false, error: error.message });
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => !r.success).length;
  
  // Should be approximately 50/50
  expect(successCount).toBeGreaterThan(30);
  expect(failureCount).toBeGreaterThan(30);
});
```

## Troubleshooting Common Errors

### Authentication Errors

```typescript
// Common authentication error solutions
async function troubleshootAuthError(error: PcoError) {
  console.log('Troubleshooting authentication error...');
  
  if (error.status === 401) {
    console.log('Possible solutions:');
    console.log('1. Check if your access token is valid');
    console.log('2. Verify your app credentials');
    console.log('3. Ensure your token has not expired');
    console.log('4. Check if your app has the required permissions');
    
    // Try to refresh token if using OAuth
    if (client.refreshToken) {
      try {
        await refreshAccessToken(client, client.refreshToken);
        console.log('Token refreshed successfully');
      } catch (refreshError) {
        console.log('Token refresh failed:', refreshError.message);
      }
    }
  }
}
```

### Rate Limit Errors

```typescript
// Rate limit error handling
async function handleRateLimitError(error: PcoError) {
  const retryDelay = error.getRetryDelay();
  console.log(`Rate limited. Retry after ${retryDelay}ms`);
  
  // Check current rate limit status
  const rateLimitInfo = getRateLimitInfo(client);
  console.log('Rate limit info:', {
    used: rateLimitInfo.requestsUsed,
    remaining: rateLimitInfo.requestsRemaining,
    resetsIn: rateLimitInfo.windowResetsIn
  });
  
  // Implement backoff strategy
  await new Promise(resolve => setTimeout(resolve, retryDelay));
}
```

### Network Errors

```typescript
// Network error troubleshooting
async function troubleshootNetworkError(error: PcoError) {
  console.log('Network error troubleshooting:');
  console.log('1. Check your internet connection');
  console.log('2. Verify PCO API is accessible');
  console.log('3. Check firewall/proxy settings');
  console.log('4. Try increasing timeout settings');
  
  // Test connectivity
  try {
    const response = await fetch('https://api.planningcenteronline.com/people/v2', {
      method: 'HEAD',
      timeout: 5000
    });
    console.log('PCO API is accessible:', response.ok);
  } catch (testError) {
    console.log('PCO API connectivity test failed:', testError.message);
  }
}
```

## Next Steps

- ⚡ **[Performance Guide](./PERFORMANCE.md)** - Optimization techniques
- 🔧 **[Troubleshooting](./TROUBLESHOOTING.md)** - Common issues and solutions
- 📚 **[API Reference](./API_REFERENCE.md)** - Complete function reference
- 💡 **[Examples](./EXAMPLES.md)** - Real-world usage patterns

---

*This error handling guide provides comprehensive patterns for managing errors in production applications. For specific error scenarios or questions, check our [Troubleshooting Guide](./TROUBLESHOOTING.md) or [open an issue](https://github.com/rachelallyson/planning-center-people-ts/issues).*
