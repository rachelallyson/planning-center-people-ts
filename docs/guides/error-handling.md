# Error Handling Guide

Comprehensive guide to error handling in the Planning Center People TypeScript library.

## Error Types

### PcoApiError

Base API error class for HTTP errors:

```typescript
import { PcoApiError } from '@rachelallyson/planning-center-people-ts';

try {
  await client.people.create({ first_name: 'John' });
} catch (error) {
  if (error instanceof PcoApiError) {
    console.log(error.status);      // HTTP status code (e.g., 400, 404, 500)
    console.log(error.message);      // Error message
    console.log(error.response);     // Full response object
  }
}
```

### PcoError

Enhanced error class with categorization:

```typescript
import { PcoError, ErrorCategory, ErrorSeverity } from '@rachelallyson/planning-center-people-ts';

try {
  await client.people.create({ first_name: 'John' });
} catch (error) {
  if (error instanceof PcoError) {
    console.log(error.category);     // ErrorCategory enum
    console.log(error.severity);     // ErrorSeverity enum
    console.log(error.retryable);    // boolean
    console.log(error.context);      // Error context
  }
}
```

## Error Categories

```typescript
enum ErrorCategory {
  AUTHENTICATION = 'authentication',    // 401 errors
  AUTHORIZATION = 'authorization',      // 403 errors
  RATE_LIMIT = 'rate_limit',            // 429 errors
  VALIDATION = 'validation',            // 400/422 errors
  NETWORK = 'network',                  // Connection/timeout errors
  EXTERNAL_API = 'external_api',        // 5xx server errors
  TIMEOUT = 'timeout',                  // Request timeout errors
  UNKNOWN = 'unknown'                   // Unknown errors
}
```

## Error Severity

```typescript
enum ErrorSeverity {
  LOW = 'low',           // Validation errors, etc.
  MEDIUM = 'medium',     // Rate limits, network issues
  HIGH = 'high',         // Auth errors, server errors
  CRITICAL = 'critical'  // Critical system failures
}
```

## Handling Errors by Category

### Authentication Errors (401)

```typescript
import { PcoError, ErrorCategory } from '@rachelallyson/planning-center-people-ts';

try {
  await client.people.getAll();
} catch (error) {
  if (error instanceof PcoError && error.category === ErrorCategory.AUTHENTICATION) {
    // Token expired or invalid
    console.error('Authentication failed - check your token');
    
    // For OAuth: token refresh should handle this automatically
    // For PAT: token may need to be regenerated
  }
}
```

### Rate Limit Errors (429)

```typescript
try {
  await client.people.getAll();
} catch (error) {
  if (error instanceof PcoError && error.category === ErrorCategory.RATE_LIMIT) {
    // Get retry delay
    const retryDelay = error.getRetryDelay();
    console.log(`Rate limited - retry after ${retryDelay}ms`);
    
    // Wait and retry
    await new Promise(resolve => setTimeout(resolve, retryDelay));
    
    // Retry request
    const people = await client.people.getAll();
  }
}
```

**Note**: The library automatically handles rate limiting, but you can catch and handle manually if needed.

### Validation Errors (400/422)

```typescript
try {
  await client.people.create({ first_name: 'John' });
} catch (error) {
  if (error instanceof PcoError && error.category === ErrorCategory.VALIDATION) {
    // Validation error - check request data
    console.error('Validation error:', error.message);
    console.error('Context:', error.context);
    
    // Parse validation errors from response
    if (error.response?.errors) {
      error.response.errors.forEach(err => {
        console.error(`Field: ${err.source?.pointer}, Error: ${err.detail}`);
      });
    }
  }
}
```

### Network Errors

```typescript
try {
  await client.people.getAll();
} catch (error) {
  if (error instanceof PcoError && error.category === ErrorCategory.NETWORK) {
    // Network error - check connection
    console.error('Network error:', error.message);
    
    // Retry if retryable
    if (error.retryable) {
      // Retry logic
    }
  }
}
```

### Timeout Errors

```typescript
try {
  await client.people.getAll();
} catch (error) {
  if (error instanceof PcoError && error.category === ErrorCategory.TIMEOUT) {
    // Request timed out
    console.error('Request timed out:', error.message);
    
    // Increase timeout or retry
    client.updateConfig({ timeout: 60000 }); // 60 seconds
  }
}
```

## Retry Logic

### Automatic Retries

Configure automatic retries in client config:

```typescript
const client = new PcoClient({
  auth: { type: 'personal_access_token', personalAccessToken: 'token' },
  retry: {
    enabled: true,
    maxRetries: 3,
    baseDelay: 1000,      // 1 second
    maxDelay: 30000,      // 30 seconds
    backoff: 'exponential' // or 'linear'
  }
});
```

### Manual Retry with Backoff

```typescript
import { retryWithBackoff } from '@rachelallyson/planning-center-people-ts';

const result = await retryWithBackoff(
  () => client.people.create({ first_name: 'John' }),
  {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    context: {
      endpoint: '/people',
      method: 'POST',
      metadata: { operation: 'create_person' }
    },
    onRetry: (error, attempt) => {
      console.log(`Retry attempt ${attempt} for ${error.context.endpoint}`);
    }
  }
);
```

### Retry Logic by Error Type

```typescript
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (error instanceof PcoError) {
        // Don't retry validation errors
        if (error.category === ErrorCategory.VALIDATION) {
          throw error;
        }

        // Don't retry authentication errors (unless OAuth refresh)
        if (error.category === ErrorCategory.AUTHENTICATION) {
          throw error;
        }

        // Retry rate limit errors
        if (error.category === ErrorCategory.RATE_LIMIT) {
          const delay = error.getRetryDelay();
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        // Retry network/timeout errors
        if (error.category === ErrorCategory.NETWORK || 
            error.category === ErrorCategory.TIMEOUT) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }

      // Unknown error - retry with exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

// Usage
const person = await retryOperation(
  () => client.people.create({ first_name: 'John' }),
  3
);
```

## Error Boundary Wrapper

Use `withErrorBoundary` to wrap operations with error handling:

```typescript
import { withErrorBoundary } from '@rachelallyson/planning-center-people-ts';

const result = await withErrorBoundary(
  () => client.people.create({ first_name: 'John' }),
  {
    endpoint: '/people',
    method: 'POST',
    metadata: {
      operation: 'create_person',
      user_id: 'user-123'
    }
  }
);
```

## Error Context

All operations support optional error context:

```typescript
await client.people.create(
  { first_name: 'John' },
  {
    metadata: {
      operation: 'import_user',
      user_id: 'user-123',
      batch_id: 'batch-456',
      source: 'csv_import'
    }
  }
);
```

Context is included in error objects for better debugging:

```typescript
try {
  await client.people.create({ first_name: 'John' }, { metadata: { operation: 'import' } });
} catch (error) {
  if (error instanceof PcoError) {
    console.log('Operation:', error.context?.metadata?.operation);
    console.log('User ID:', error.context?.metadata?.user_id);
  }
}
```

## Error Handling Patterns

### Pattern 1: Try-Catch with Category Switch

```typescript
async function handleOperation<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof PcoError) {
      switch (error.category) {
        case ErrorCategory.AUTHENTICATION:
          // Handle auth error
          await handleAuthError(error);
          throw error;
        case ErrorCategory.RATE_LIMIT:
          // Handle rate limit
          await handleRateLimit(error);
          return operation(); // Retry
        case ErrorCategory.VALIDATION:
          // Handle validation error
          await handleValidationError(error);
          throw error;
        case ErrorCategory.NETWORK:
        case ErrorCategory.TIMEOUT:
          // Retry with backoff
          return await retryWithBackoff(operation);
        default:
          // Handle unknown error
          await handleUnknownError(error);
          throw error;
      }
    }
    throw error;
  }
}
```

### Pattern 2: Error Handler Class

```typescript
class ErrorHandler {
  async handle<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof PcoError) {
        return this.handlePcoError(error, operation);
      }
      throw error;
    }
  }

  private async handlePcoError<T>(
    error: PcoError,
    operation: () => Promise<T>
  ): Promise<T> {
    switch (error.category) {
      case ErrorCategory.AUTHENTICATION:
        await this.onAuthError(error);
        throw error;
      case ErrorCategory.RATE_LIMIT:
        await this.waitForRateLimit(error);
        return this.handle(operation);
      case ErrorCategory.VALIDATION:
        await this.onValidationError(error);
        throw error;
      case ErrorCategory.NETWORK:
      case ErrorCategory.TIMEOUT:
        await this.waitWithBackoff(error);
        return this.handle(operation);
      default:
        await this.onUnknownError(error);
        throw error;
    }
  }

  private async waitForRateLimit(error: PcoError): Promise<void> {
    const delay = error.getRetryDelay();
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private async waitWithBackoff(error: PcoError, attempt: number = 0): Promise<void> {
    const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private async onAuthError(error: PcoError): Promise<void> {
    console.error('Authentication error:', error.message);
    // Log to error tracking service
  }

  private async onValidationError(error: PcoError): Promise<void> {
    console.error('Validation error:', error.message);
    // Log to error tracking service
  }

  private async onUnknownError(error: PcoError): Promise<void> {
    console.error('Unknown error:', error.message);
    // Log to error tracking service
  }
}

// Usage
const handler = new ErrorHandler();
const person = await handler.handle(() => client.people.create({ first_name: 'John' }));
```

### Pattern 3: Event-Based Error Handling

```typescript
// Set up error event handlers
client.on('error', (event) => {
  console.error(`Error in ${event.operation}:`, event.error);
  
  // Send to error tracking service
  errorTrackingService.log({
    operation: event.operation,
    error: event.error.message,
    category: event.error.category,
    severity: event.error.severity,
    context: event.context
  });
});

client.on('rate:limit', (event) => {
  console.warn(`Rate limited: ${event.remaining}/${event.limit} remaining`);
  
  // Alert if rate limit is low
  if (event.remaining < 10) {
    alertingService.send('Rate limit low', {
      remaining: event.remaining,
      limit: event.limit
    });
  }
});
```

## Default Retry Configuration

The library uses these default retry settings:

```typescript
const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,      // 1 second
  maxDelay: 30000,      // 30 seconds
  backoff: 'exponential'
};
```

## Timeout Configuration

Default timeout: 30 seconds

```typescript
const client = new PcoClient({
  auth: { type: 'personal_access_token', personalAccessToken: 'token' },
  timeout: 60000 // 60 seconds
});
```

## Best Practices

1. **Always check error categories** before retrying
2. **Don't retry validation errors** - fix the request data instead
3. **Handle authentication errors** separately (OAuth refresh handles automatically)
4. **Respect rate limits** - use retry delays from `getRetryDelay()`
5. **Log errors with context** - include metadata for debugging
6. **Use error boundaries** for critical operations
7. **Monitor error events** using the event system
8. **Set appropriate timeouts** based on operation type

## Common Error Scenarios

### Scenario 1: Invalid Token

```typescript
// Error: 401 Unauthorized
// Category: ErrorCategory.AUTHENTICATION
// Fix: Regenerate token or refresh OAuth token
```

### Scenario 2: Rate Limited

```typescript
// Error: 429 Too Many Requests
// Category: ErrorCategory.RATE_LIMIT
// Fix: Wait for retry delay, library handles automatically
```

### Scenario 3: Validation Error

```typescript
// Error: 422 Unprocessable Entity
// Category: ErrorCategory.VALIDATION
// Fix: Check request data, fix validation errors
```

### Scenario 4: Network Error

```typescript
// Error: Network error (ECONNREFUSED, ETIMEDOUT)
// Category: ErrorCategory.NETWORK
// Fix: Retry with exponential backoff
```

---

**Next**: See [Configuration Reference](../reference/config.md) for all configuration options.
