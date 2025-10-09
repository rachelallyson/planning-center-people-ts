# Authentication Guide

This guide covers all authentication methods supported by the Planning Center People TypeScript library, including setup, token management, and best practices.

## Authentication Methods Overview

The library supports two main authentication methods:

| Method | Use Case | Token Type | Refresh Support | Multi-User |
|--------|----------|------------|-----------------|------------|
| **App Credentials** | Server applications, single-user apps | Personal Access Token | ❌ | ❌ |
| **OAuth 2.0** | Multi-user applications, web apps | Access Token + Refresh Token | ✅ | ✅ |

## 1. App Credentials Authentication

### When to Use

- **Server-side applications** (Node.js, Express, Next.js API routes)
- **Single-user applications** (personal tools, scripts)
- **Background processes** (cron jobs, data sync)
- **Development and testing**

### Setup

#### Step 1: Create a Planning Center App

1. Go to [Planning Center Developer](https://api.planningcenteronline.com/)
2. Click "Create an App"
3. Fill in app details:
   - **Name**: Your application name
   - **Description**: Brief description of your app
   - **Website**: Your app's website (optional)
4. Select **People API** permissions
5. Click "Create App"

#### Step 2: Generate Personal Access Token

1. In your app settings, go to "Personal Access Tokens"
2. Click "Create Token"
3. Give it a descriptive name
4. Select the scopes you need (typically "People API - Read" and "People API - Write")
5. Copy the generated token (you won't see it again!)

#### Step 3: Configure Your Application

```typescript
import { createPcoClient } from '@rachelallyson/planning-center-people-ts';

const client = createPcoClient({
  personalAccessToken: 'your-personal-access-token-here',
  appId: 'your-app-id',
  appSecret: 'your-app-secret',
});
```

### Environment Variables

```env
# .env
PCO_APP_ID=your_app_id_here
PCO_APP_SECRET=your_app_secret_here
PCO_PERSONAL_ACCESS_TOKEN=your_personal_access_token_here
```

```typescript
// Using environment variables
const client = createPcoClient({
  personalAccessToken: process.env.PCO_PERSONAL_ACCESS_TOKEN!,
  appId: process.env.PCO_APP_ID!,
  appSecret: process.env.PCO_APP_SECRET!,
});
```

### Example: Server Application

```typescript
// src/pco-client.ts
import { createPcoClient } from '@rachelallyson/planning-center-people-ts';

export const pcoClient = createPcoClient({
  personalAccessToken: process.env.PCO_PERSONAL_ACCESS_TOKEN!,
  appId: process.env.PCO_APP_ID!,
  appSecret: process.env.PCO_APP_SECRET!,
  
  // Optional: Custom configuration
  timeout: 30000,
  rateLimit: {
    maxRequests: 100,
    perMilliseconds: 60000,
  },
});
```

## 2. OAuth 2.0 Authentication

### When to Use

- **Multi-user applications** (web apps, mobile apps)
- **User-specific data access** (each user sees their own data)
- **Third-party integrations** (apps that other organizations install)
- **Public applications** (distributed to multiple churches)

### OAuth 2.0 Flow Overview

```mermaid
sequenceDiagram
    participant User
    participant YourApp
    participant PCO
    participant Library

    User->>YourApp: Click "Connect to PCO"
    YourApp->>PCO: Redirect to OAuth authorization
    PCO->>User: Show authorization page
    User->>PCO: Grant permissions
    PCO->>YourApp: Redirect with authorization code
    YourApp->>PCO: Exchange code for tokens
    PCO->>YourApp: Return access & refresh tokens
    YourApp->>Library: Create client with tokens
    Library->>PCO: Make API calls
    PCO->>Library: Return data
```

### Step 1: OAuth Configuration

#### Authorization URL

```
https://api.planningcenteronline.com/oauth/authorize?
  client_id=YOUR_APP_ID&
  redirect_uri=YOUR_REDIRECT_URI&
  response_type=code&
  scope=people
```

#### Token Exchange URL

```
POST https://api.planningcenteronline.com/oauth/token
Content-Type: application/x-www-form-urlencoded

client_id=YOUR_APP_ID&
client_secret=YOUR_APP_SECRET&
code=AUTHORIZATION_CODE&
redirect_uri=YOUR_REDIRECT_URI&
grant_type=authorization_code
```

### Step 2: Implementation Examples

#### Express.js OAuth Handler

```typescript
// src/auth/oauth.ts
import express from 'express';
import { createPcoClient } from '@rachelallyson/planning-center-people-ts';

const router = express.Router();

// Step 1: Redirect to PCO authorization
router.get('/auth/pco', (req, res) => {
  const authUrl = new URL('https://api.planningcenteronline.com/oauth/authorize');
  authUrl.searchParams.set('client_id', process.env.PCO_APP_ID!);
  authUrl.searchParams.set('redirect_uri', process.env.PCO_REDIRECT_URI!);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'people');
  
  res.redirect(authUrl.toString());
});

// Step 2: Handle OAuth callback
router.get('/auth/pco/callback', async (req, res) => {
  const { code, error } = req.query;
  
  if (error) {
    return res.status(400).json({ error: 'Authorization failed' });
  }
  
  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://api.planningcenteronline.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.PCO_APP_ID!,
        client_secret: process.env.PCO_APP_SECRET!,
        code: code as string,
        redirect_uri: process.env.PCO_REDIRECT_URI!,
        grant_type: 'authorization_code',
      }),
    });
    
    const tokens = await tokenResponse.json();
    
    // Save tokens to database
    await saveUserTokens(req.session.userId, tokens);
    
    // Create PCO client
    const client = createPcoClient({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      appId: process.env.PCO_APP_ID!,
      appSecret: process.env.PCO_APP_SECRET!,
      onTokenRefresh: async (newTokens) => {
        await saveUserTokens(req.session.userId, newTokens);
      },
      onTokenRefreshFailure: async (error, context) => {
        console.error('Token refresh failed:', error.message);
        await clearUserTokens(req.session.userId);
      },
    });
    
    res.json({ success: true, message: 'Connected to Planning Center!' });
  } catch (error) {
    console.error('OAuth error:', error);
    res.status(500).json({ error: 'Failed to connect to Planning Center' });
  }
});

export default router;
```

#### Next.js OAuth Implementation

```typescript
// pages/api/auth/pco.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { createPcoClient } from '@rachelallyson/planning-center-people-ts';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Redirect to PCO authorization
    const authUrl = new URL('https://api.planningcenteronline.com/oauth/authorize');
    authUrl.searchParams.set('client_id', process.env.PCO_APP_ID!);
    authUrl.searchParams.set('redirect_uri', `${process.env.NEXTAUTH_URL}/api/auth/pco/callback`);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'people');
    
    res.redirect(authUrl.toString());
  }
}

// pages/api/auth/pco/callback.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code } = req.query;
  
  try {
    const tokenResponse = await fetch('https://api.planningcenteronline.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.PCO_APP_ID!,
        client_secret: process.env.PCO_APP_SECRET!,
        code: code as string,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/pco/callback`,
        grant_type: 'authorization_code',
      }),
    });
    
    const tokens = await tokenResponse.json();
    
    // Store tokens in session or database
    req.session.pcoTokens = tokens;
    await req.session.save();
    
    res.redirect('/dashboard');
  } catch (error) {
    res.status(500).json({ error: 'OAuth failed' });
  }
}
```

### Step 3: Token Management

#### Token Storage

```typescript
// src/services/token-manager.ts
interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  userId: string;
}

class TokenManager {
  async saveTokens(userId: string, tokens: any): Promise<void> {
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
    
    await database.tokens.upsert({
      userId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt,
    });
  }
  
  async getTokens(userId: string): Promise<StoredTokens | null> {
    const stored = await database.tokens.findByUserId(userId);
    if (!stored || stored.expiresAt < new Date()) {
      return null;
    }
    
    return {
      accessToken: stored.accessToken,
      refreshToken: stored.refreshToken,
      expiresAt: stored.expiresAt,
      userId: stored.userId,
    };
  }
  
  async clearTokens(userId: string): Promise<void> {
    await database.tokens.deleteByUserId(userId);
  }
}

export const tokenManager = new TokenManager();
```

#### Client Factory

```typescript
// src/services/pco-client-factory.ts
import { createPcoClient, type PcoClientState } from '@rachelallyson/planning-center-people-ts';
import { tokenManager } from './token-manager';

export async function createUserPcoClient(userId: string): Promise<PcoClientState> {
  const tokens = await tokenManager.getTokens(userId);
  
  if (!tokens) {
    throw new Error('User not authenticated with Planning Center');
  }
  
  return createPcoClient({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    appId: process.env.PCO_APP_ID!,
    appSecret: process.env.PCO_APP_SECRET!,
    onTokenRefresh: async (newTokens) => {
      await tokenManager.saveTokens(userId, newTokens);
    },
    onTokenRefreshFailure: async (error, context) => {
      console.error('Token refresh failed for user:', userId, error.message);
      await tokenManager.clearTokens(userId);
      // Redirect user to re-authenticate
    },
  });
}
```

## 3. Token Refresh Handling

### Automatic Token Refresh

The library automatically handles token refresh when using OAuth 2.0:

```typescript
const client = createPcoClient({
  accessToken: userAccessToken,
  refreshToken: userRefreshToken,
  appId: process.env.PCO_APP_ID!,
  appSecret: process.env.PCO_APP_SECRET!,
  
  // Called when tokens are successfully refreshed
  onTokenRefresh: async (newTokens) => {
    console.log('Tokens refreshed successfully');
    await saveTokensToDatabase(userId, newTokens);
  },
  
  // Called when token refresh fails
  onTokenRefreshFailure: async (error, context) => {
    console.error('Token refresh failed:', error.message);
    
    if (error.message.includes('invalid_grant')) {
      // Refresh token is invalid - user needs to re-authenticate
      await clearUserTokens(userId);
      redirectToLogin();
    } else if (error.message.includes('Network error')) {
      // Network issue - could retry later
      showNetworkErrorToast();
    }
  },
});
```

### Manual Token Refresh

```typescript
import { refreshAccessToken, updateClientTokens } from '@rachelallyson/planning-center-people-ts';

// Manually refresh tokens
async function refreshUserTokens(client: PcoClientState, refreshToken: string) {
  try {
    const newTokens = await refreshAccessToken(client, refreshToken);
    
    // Update client with new tokens
    updateClientTokens(client, newTokens);
    
    // Save to database
    await saveTokensToDatabase(userId, newTokens);
    
    return newTokens;
  } catch (error) {
    console.error('Manual token refresh failed:', error);
    throw error;
  }
}
```

### Token Refresh Best Practices

```typescript
// src/middleware/token-refresh.ts
export async function withTokenRefresh<T>(
  userId: string,
  operation: (client: PcoClientState) => Promise<T>
): Promise<T> {
  let client = await createUserPcoClient(userId);
  
  try {
    return await operation(client);
  } catch (error) {
    if (error instanceof PcoError && error.status === 401) {
      // Token might be expired, try to refresh
      const tokens = await tokenManager.getTokens(userId);
      if (tokens?.refreshToken) {
        try {
          const newTokens = await refreshAccessToken(client, tokens.refreshToken);
          await tokenManager.saveTokens(userId, newTokens);
          
          // Retry with refreshed client
          client = await createUserPcoClient(userId);
          return await operation(client);
        } catch (refreshError) {
          // Refresh failed, user needs to re-authenticate
          await tokenManager.clearTokens(userId);
          throw new Error('Authentication expired. Please reconnect to Planning Center.');
        }
      }
    }
    throw error;
  }
}
```

## 4. Security Best Practices

### Environment Variables

```env
# Never commit these to version control
PCO_APP_ID=your_app_id_here
PCO_APP_SECRET=your_app_secret_here
PCO_PERSONAL_ACCESS_TOKEN=your_token_here

# Use different values for different environments
PCO_APP_ID_DEV=dev_app_id
PCO_APP_SECRET_DEV=dev_app_secret
PCO_APP_ID_PROD=prod_app_id
PCO_APP_SECRET_PROD=prod_app_secret
```

### Token Storage Security

```typescript
// ✅ Good: Encrypt tokens in database
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY!;

function encryptToken(token: string): string {
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decryptToken(encryptedToken: string): string {
  const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
  let decrypted = decipher.update(encryptedToken, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// ❌ Bad: Store tokens in plain text
await database.tokens.save({
  userId,
  accessToken: tokens.access_token, // Unencrypted!
  refreshToken: tokens.refresh_token, // Unencrypted!
});
```

### HTTPS Only

```typescript
// ✅ Good: Force HTTPS in production
const client = createPcoClient({
  accessToken: userToken,
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://api.planningcenteronline.com/people/v2'
    : 'http://localhost:3000/api/pco', // Development only
});

// ❌ Bad: HTTP in production
const client = createPcoClient({
  accessToken: userToken,
  baseURL: 'http://api.planningcenteronline.com/people/v2', // Insecure!
});
```

### Token Validation

```typescript
// Validate tokens before use
function validateTokens(tokens: any): boolean {
  if (!tokens.access_token || !tokens.refresh_token) {
    return false;
  }
  
  if (tokens.expires_in && tokens.expires_in < 60) {
    // Token expires in less than 1 minute
    return false;
  }
  
  return true;
}

// Use validation
const tokens = await tokenManager.getTokens(userId);
if (!validateTokens(tokens)) {
  throw new Error('Invalid or expired tokens');
}
```

## 5. Error Handling

### Authentication Errors

```typescript
import { PcoError, ErrorCategory } from '@rachelallyson/planning-center-people-ts';

try {
  const people = await getPeople(client);
} catch (error) {
  if (error instanceof PcoError) {
    switch (error.category) {
      case ErrorCategory.AUTHENTICATION:
        if (error.status === 401) {
          // Token expired or invalid
          console.log('Authentication failed - token may be expired');
          await handleTokenExpiration(userId);
        }
        break;
        
      case ErrorCategory.AUTHORIZATION:
        if (error.status === 403) {
          // Insufficient permissions
          console.log('Insufficient permissions for this operation');
          await handleInsufficientPermissions(userId);
        }
        break;
        
      default:
        console.error('Other PCO error:', error.message);
    }
  }
}
```

### Token Refresh Error Handling

```typescript
const client = createPcoClient({
  accessToken: userToken,
  refreshToken: userRefreshToken,
  appId: process.env.PCO_APP_ID!,
  appSecret: process.env.PCO_APP_SECRET!,
  
  onTokenRefreshFailure: async (error, context) => {
    console.error('Token refresh failed:', {
      error: error.message,
      context: context.endpoint,
      userId: context.metadata?.userId,
    });
    
    // Handle different failure scenarios
    if (error.message.includes('invalid_grant')) {
      // Refresh token is invalid - user needs to re-authenticate
      await clearUserTokens(userId);
      await notifyUserReauth(userId);
    } else if (error.message.includes('Network error')) {
      // Network issue - could be temporary
      await scheduleRetry(userId);
    } else {
      // Unknown error - log for investigation
      await logError(error, context);
    }
  },
});
```

## 6. Testing Authentication

### Mock Authentication for Tests

```typescript
// tests/mocks/pco-client.ts
import { createPcoClient } from '@rachelallyson/planning-center-people-ts';

export const mockPcoClient = createPcoClient({
  personalAccessToken: 'mock-token',
  appId: 'mock-app-id',
  appSecret: 'mock-app-secret',
});

// Mock successful responses
jest.mock('@rachelallyson/planning-center-people-ts', () => ({
  ...jest.requireActual('@rachelallyson/planning-center-people-ts'),
  getPeople: jest.fn().mockResolvedValue({
    data: [
      {
        id: '1',
        type: 'Person',
        attributes: {
          first_name: 'John',
          last_name: 'Doe',
        },
      },
    ],
  }),
}));
```

### Integration Test Setup

```typescript
// tests/integration/auth.test.ts
import { createPcoClient } from '@rachelallyson/planning-center-people-ts';

describe('Authentication Integration', () => {
  let client: PcoClientState;
  
  beforeAll(() => {
    client = createPcoClient({
      personalAccessToken: process.env.PCO_PERSONAL_ACCESS_TOKEN!,
      appId: process.env.PCO_APP_ID!,
      appSecret: process.env.PCO_APP_SECRET!,
    });
  });
  
  it('should authenticate successfully', async () => {
    const people = await getPeople(client, { per_page: 1 });
    expect(people.data).toBeDefined();
  });
  
  it('should handle invalid credentials', async () => {
    const invalidClient = createPcoClient({
      personalAccessToken: 'invalid-token',
      appId: 'invalid-app-id',
      appSecret: 'invalid-secret',
    });
    
    await expect(getPeople(invalidClient)).rejects.toThrow();
  });
});
```

## 7. Troubleshooting

### Common Authentication Issues

#### Issue: "Invalid credentials"

```typescript
// Check your credentials
console.log('App ID:', process.env.PCO_APP_ID);
console.log('App Secret:', process.env.PCO_APP_SECRET ? 'Set' : 'Not set');
console.log('Token:', process.env.PCO_PERSONAL_ACCESS_TOKEN ? 'Set' : 'Not set');
```

#### Issue: "Token expired"

```typescript
// For OAuth tokens, implement refresh logic
const client = createPcoClient({
  accessToken: userToken,
  refreshToken: userRefreshToken,
  appId: process.env.PCO_APP_ID!,
  appSecret: process.env.PCO_APP_SECRET!,
  onTokenRefresh: async (newTokens) => {
    await saveTokensToDatabase(userId, newTokens);
  },
});
```

#### Issue: "Insufficient permissions"

```typescript
// Check your app's permissions in PCO Developer Console
// Ensure you have the required scopes for your operations
```

### Debug Mode

```typescript
// Enable debug logging
const client = createPcoClient({
  personalAccessToken: process.env.PCO_PERSONAL_ACCESS_TOKEN!,
  appId: process.env.PCO_APP_ID!,
  appSecret: process.env.PCO_APP_SECRET!,
  
  // Add custom headers for debugging
  headers: {
    'X-Debug': 'true',
    'User-Agent': 'MyApp/1.0.0 (Debug Mode)',
  },
});
```

## Next Steps

- 📚 **[API Reference](./API_REFERENCE.md)** - Explore all available functions
- 💡 **[Examples](./EXAMPLES.md)** - See real-world usage patterns
- 🛠️ **[Error Handling](./ERROR_HANDLING.md)** - Handle errors gracefully
- ⚡ **[Performance Guide](./PERFORMANCE.md)** - Optimize your API usage

---

*Having trouble with authentication? Check our [Troubleshooting Guide](./TROUBLESHOOTING.md) or [open an issue](https://github.com/rachelallyson/planning-center-people-ts/issues) for help.*
