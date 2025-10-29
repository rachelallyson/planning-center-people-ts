# Configuration Reference

Complete reference for all configuration options, environment variables, and defaults.

## Client Configuration

### PcoClientConfig

```typescript
interface PcoClientConfig {
  auth: PcoAuthConfig;              // REQUIRED: Authentication configuration
  caching?: CachingConfig;           // Optional: Caching configuration
  retry?: RetryConfig;               // Optional: Retry configuration
  events?: EventHandlers;            // Optional: Event handlers
  baseURL?: string;                  // Optional: Base URL override
  timeout?: number;                  // Optional: Request timeout (ms)
  headers?: Record<string, string>; // Optional: Custom headers
}
```

## Authentication

### Personal Access Token (PAT)

**Use Case**: Single-user applications, scripts, testing

```typescript
const client = new PcoClient({
  auth: {
    type: 'personal_access_token',
    personalAccessToken: 'your-token-here'
  }
});
```

**Configuration**:

- `type`: `'personal_access_token'` (required)
- `personalAccessToken`: `string` (required) - Your PCO personal access token

**Environment Variable**: None (use secure storage)

### OAuth 2.0

**Use Case**: Multi-user applications, web apps

```typescript
const client = new PcoClient({
  auth: {
    type: 'oauth',
    accessToken: 'your-access-token',
    refreshToken: 'your-refresh-token',
    // REQUIRED: Handle token refresh
    onRefresh: async (tokens) => {
      await saveTokens(tokens);
    },
    // REQUIRED: Handle refresh failures
    onRefreshFailure: async (error) => {
      await handleAuthFailure(error);
    },
    // Optional: Client credentials (or use env vars)
    clientId: 'your-app-id',
    clientSecret: 'your-app-secret'
  }
});
```

**Configuration**:

- `type`: `'oauth'` (required)
- `accessToken`: `string` (required) - Current access token
- `refreshToken`: `string` (required) - Refresh token
- `onRefresh`: `(tokens: { accessToken: string; refreshToken: string }) => void | Promise<void>` (required) - Callback when token refreshes
- `onRefreshFailure`: `(error: Error) => void | Promise<void>` (required) - Callback when refresh fails
- `clientId`: `string` (optional) - Client ID for token refresh (defaults to `PCO_APP_ID` env var)
- `clientSecret`: `string` (optional) - Client secret for token refresh (defaults to `PCO_APP_SECRET` env var)

**Environment Variables**:

- `PCO_APP_ID` - Optional: Used for token refresh if `clientId` not provided
- `PCO_APP_SECRET` - Optional: Used for token refresh if `clientSecret` not provided

**Important**: `onRefresh` and `onRefreshFailure` are **required** (v2.1.0+). OAuth clients without refresh handling will fail at compile time.

### Basic Auth

**Use Case**: Server-to-server integrations

```typescript
const client = new PcoClient({
  auth: {
    type: 'basic',
    appId: 'your-app-id',
    appSecret: 'your-app-secret'
  }
});
```

**Configuration**:

- `type`: `'basic'` (required)
- `appId`: `string` (required) - Your PCO app ID
- `appSecret`: `string` (required) - Your PCO app secret

**Environment Variables**: None (use secure storage)

## Caching Configuration

```typescript
interface CachingConfig {
  fieldDefinitions?: boolean; // Cache field definitions (default: false)
  ttl?: number;               // Time to live in milliseconds (default: 300000 = 5 minutes)
  maxSize?: number;           // Maximum cache size (default: 1000)
}
```

**Example**:

```typescript
const client = new PcoClient({
  auth: { type: 'personal_access_token', personalAccessToken: 'token' },
  caching: {
    fieldDefinitions: true,
    ttl: 300000,      // 5 minutes
    maxSize: 1000     // Maximum 1000 entries
  }
});
```

**Defaults**:

- `fieldDefinitions`: `false`
- `ttl`: `300000` (5 minutes)
- `maxSize`: `1000`

**What Gets Cached**:

- Field definitions (if `fieldDefinitions: true`)
- Field options

**What Doesn't Get Cached**:

- Person data
- Household data
- Workflow data
- Any other resource data

## Retry Configuration

```typescript
interface RetryConfig {
  enabled?: boolean;              // Enable retries (default: true)
  maxRetries?: number;           // Maximum retry attempts (default: 3)
  baseDelay?: number;            // Base delay in milliseconds (default: 1000)
  maxDelay?: number;             // Maximum delay in milliseconds (default: 30000)
  backoff?: 'linear' | 'exponential'; // Backoff strategy (default: 'exponential')
}
```

**Example**:

```typescript
const client = new PcoClient({
  auth: { type: 'personal_access_token', personalAccessToken: 'token' },
  retry: {
    enabled: true,
    maxRetries: 3,
    baseDelay: 1000,      // 1 second
    maxDelay: 30000,     // 30 seconds
    backoff: 'exponential'
  }
});
```

**Defaults**:

- `enabled`: `true`
- `maxRetries`: `3`
- `baseDelay`: `1000` (1 second)
- `maxDelay`: `30000` (30 seconds)
- `backoff`: `'exponential'`

**Backoff Strategies**:

- **Exponential**: Delay doubles each retry: 1s, 2s, 4s, 8s, ...
- **Linear**: Delay increases linearly: 1s, 2s, 3s, 4s, ...

**Retry Behavior**:

- Retries on: Network errors, timeout errors, rate limit errors (with delay), 5xx server errors
- Does not retry on: 400/422 validation errors, 401 authentication errors (unless OAuth refresh), 403 authorization errors

## Event Handlers

```typescript
interface EventHandlers {
  onError?: (event: ErrorEvent) => void | Promise<void>;
  onAuthFailure?: (event: AuthFailureEvent) => void | Promise<void>;
  onRequestStart?: (event: RequestStartEvent) => void | Promise<void>;
  onRequestComplete?: (event: RequestCompleteEvent) => void | Promise<void>;
  onRateLimit?: (event: RateLimitEvent) => void | Promise<void>;
}
```

**Example**:

```typescript
const client = new PcoClient({
  auth: { type: 'personal_access_token', personalAccessToken: 'token' },
  events: {
    onError: (event) => {
      console.error('Error:', event.error);
      errorTrackingService.log(event);
    },
    onAuthFailure: (event) => {
      console.error('Auth failed:', event.error);
      alertingService.send('Auth failure', event);
    },
    onRequestStart: (event) => {
      console.log(`Starting: ${event.method} ${event.endpoint}`);
    },
    onRequestComplete: (event) => {
      console.log(`Completed: ${event.status} in ${event.duration}ms`);
    },
    onRateLimit: (event) => {
      console.warn(`Rate limit: ${event.remaining}/${event.limit}`);
    }
  }
});
```

**Event Types**:

### ErrorEvent

```typescript
interface ErrorEvent {
  error: Error;
  operation: string;
  timestamp: string;
  context?: Record<string, any>;
}
```

### AuthFailureEvent

```typescript
interface AuthFailureEvent {
  error: Error;
  timestamp: string;
  authType: 'oauth' | 'basic';
}
```

### RequestStartEvent

```typescript
interface RequestStartEvent {
  endpoint: string;
  method: string;
  timestamp: string;
  requestId: string;
}
```

### RequestCompleteEvent

```typescript
interface RequestCompleteEvent {
  endpoint: string;
  method: string;
  status: number;
  duration: number;
  timestamp: string;
  requestId: string;
}
```

### RateLimitEvent

```typescript
interface RateLimitEvent {
  limit: number;
  remaining: number;
  resetTime: string;
  timestamp: string;
}
```

## Base URL

Override the default base URL:

```typescript
const client = new PcoClient({
  auth: { type: 'personal_access_token', personalAccessToken: 'token' },
  baseURL: 'https://api.planningcenteronline.com/people/v2'
});
```

**Default**: `'https://api.planningcenteronline.com/people/v2'`

**Use Cases**:

- Testing with mock servers
- Using staging environments
- Custom API endpoints

## Timeout

Configure request timeout:

```typescript
const client = new PcoClient({
  auth: { type: 'personal_access_token', personalAccessToken: 'token' },
  timeout: 60000 // 60 seconds
});
```

**Default**: `30000` (30 seconds)

**Unit**: Milliseconds

**Note**: Timeout applies to individual requests, not batch operations or pagination.

## Custom Headers

Add custom headers to all requests:

```typescript
const client = new PcoClient({
  auth: { type: 'personal_access_token', personalAccessToken: 'token' },
  headers: {
    'X-Custom-Header': 'value',
    'User-Agent': 'MyApp/1.0'
  }
});
```

**Note**: Custom headers are merged with default headers. Authentication headers are always added automatically.

## Environment Variables

### PCO_APP_ID

**Type**: `string`  
**Required**: No  
**Usage**: Used for OAuth token refresh if `clientId` not provided in config  
**Example**: `PCO_APP_ID=your-app-id`

### PCO_APP_SECRET

**Type**: `string`  
**Required**: No  
**Usage**: Used for OAuth token refresh if `clientSecret` not provided in config  
**Example**: `PCO_APP_SECRET=your-app-secret`

### PCO_ACCESS_TOKEN

**Type**: `string`  
**Required**: No  
**Usage**: Can be used in examples/tests (not used by library automatically)  
**Example**: `PCO_ACCESS_TOKEN=your-access-token`

## Configuration Precedence

1. **Direct config values** (highest priority)
2. **Environment variables** (for OAuth client credentials only)
3. **Defaults** (lowest priority)

## Complete Example

```typescript
import { PcoClient } from '@rachelallyson/planning-center-people-ts';

const client = new PcoClient({
  // Authentication (required)
  auth: {
    type: 'oauth',
    accessToken: process.env.PCO_ACCESS_TOKEN!,
    refreshToken: process.env.PCO_REFRESH_TOKEN!,
    clientId: process.env.PCO_APP_ID,        // Optional: can use env var
    clientSecret: process.env.PCO_APP_SECRET, // Optional: can use env var
    onRefresh: async (tokens) => {
      await saveTokens(tokens);
    },
    onRefreshFailure: async (error) => {
      await handleAuthFailure(error);
    }
  },
  
  // Caching
  caching: {
    fieldDefinitions: true,
    ttl: 300000,      // 5 minutes
    maxSize: 1000
  },
  
  // Retry
  retry: {
    enabled: true,
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoff: 'exponential'
  },
  
  // Event handlers
  events: {
    onError: (event) => console.error('Error:', event.error),
    onRateLimit: (event) => console.warn(`Rate limit: ${event.remaining}/${event.limit}`)
  },
  
  // Timeout
  timeout: 60000, // 60 seconds
  
  // Custom headers
  headers: {
    'User-Agent': 'MyApp/1.0'
  }
});
```

## Updating Configuration

Update configuration at runtime:

```typescript
// Update timeout
client.updateConfig({ timeout: 60000 });

// Update retry config
client.updateConfig({
  retry: {
    enabled: true,
    maxRetries: 5
  }
});

// Get current config
const config = client.getConfig();
```

---

**Next**: See [Troubleshooting Guide](../troubleshooting.md) for common configuration issues.
