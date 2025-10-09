# Installation & Setup Guide

This guide covers everything you need to get started with the Planning Center People TypeScript library.

## Prerequisites

### System Requirements

- **Node.js**: 18.0.0 or higher (uses native fetch API)
- **TypeScript**: 4.5.0 or higher (for full type support)
- **Planning Center Account**: Active PCO account with People API access

### Environment Support

- ✅ **Node.js 18+** (built-in fetch support)
- ✅ **Modern browsers** (Chrome 42+, Firefox 39+, Safari 10.1+)
- ✅ **React Native** (with fetch polyfill)
- ✅ **Deno** (built-in fetch support)
- ✅ **Bun** (built-in fetch support)

## Installation

### NPM (Recommended)

```bash
npm install @rachelallyson/planning-center-people-ts
```

### Yarn

```bash
yarn add @rachelallyson/planning-center-people-ts
```

### PNPM

```bash
pnpm add @rachelallyson/planning-center-people-ts
```

### Package Manager Comparison

| Package Manager | Command | Lock File | Speed | Bundle Size |
|----------------|---------|-----------|-------|-------------|
| NPM | `npm install` | `package-lock.json` | Medium | Standard |
| Yarn | `yarn add` | `yarn.lock` | Fast | Standard |
| PNPM | `pnpm add` | `pnpm-lock.yaml` | Fastest | Optimized |

## TypeScript Setup

### Basic TypeScript Configuration

Create or update your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Advanced TypeScript Configuration

For production applications:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

## Environment Setup

### 1. Create Environment File

Create a `.env` file in your project root:

```env
# Planning Center App Credentials
PCO_APP_ID=your_app_id_here
PCO_APP_SECRET=your_app_secret_here

# Optional: OAuth tokens (for multi-user apps)
PCO_ACCESS_TOKEN=your_access_token_here
PCO_REFRESH_TOKEN=your_refresh_token_here

# Optional: Custom configuration
PCO_BASE_URL=https://api.planningcenteronline.com/people/v2
PCO_TIMEOUT=30000
PCO_MAX_RETRIES=3
```

### 2. Environment Variable Types

Create a `types/env.d.ts` file for type safety:

```typescript
declare namespace NodeJS {
  interface ProcessEnv {
    PCO_APP_ID: string;
    PCO_APP_SECRET: string;
    PCO_ACCESS_TOKEN?: string;
    PCO_REFRESH_TOKEN?: string;
    PCO_BASE_URL?: string;
    PCO_TIMEOUT?: string;
    PCO_MAX_RETRIES?: string;
  }
}
```

### 3. Load Environment Variables

#### Node.js Applications

```typescript
import dotenv from 'dotenv';
dotenv.config();

// Or use built-in Node.js support (Node.js 20.6+)
// No additional setup needed
```

#### Next.js Applications

```typescript
// next.config.js
module.exports = {
  env: {
    PCO_APP_ID: process.env.PCO_APP_ID,
    PCO_APP_SECRET: process.env.PCO_APP_SECRET,
  },
};
```

#### React Applications

```typescript
// Use environment variables prefixed with REACT_APP_
// .env
REACT_APP_PCO_APP_ID=your_app_id_here
REACT_APP_PCO_APP_SECRET=your_app_secret_here

// In your code
const appId = process.env.REACT_APP_PCO_APP_ID;
const appSecret = process.env.REACT_APP_PCO_APP_SECRET;
```

## Basic Setup Examples

### 1. Simple Node.js Application

```typescript
// src/index.ts
import { createPcoClient, getPeople } from '@rachelallyson/planning-center-people-ts';

async function main() {
  const client = createPcoClient({
    appId: process.env.PCO_APP_ID!,
    appSecret: process.env.PCO_APP_SECRET!,
  });

  try {
    const people = await getPeople(client, { per_page: 10 });
    console.log(`Found ${people.data.length} people`);
  } catch (error) {
    console.error('Error:', error);
  }
}

main().catch(console.error);
```

### 2. Express.js API Server

```typescript
// src/server.ts
import express from 'express';
import { createPcoClient, getPeople, getPerson } from '@rachelallyson/planning-center-people-ts';

const app = express();
const client = createPcoClient({
  appId: process.env.PCO_APP_ID!,
  appSecret: process.env.PCO_APP_SECRET!,
});

app.get('/api/people', async (req, res) => {
  try {
    const people = await getPeople(client, { per_page: 50 });
    res.json(people);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch people' });
  }
});

app.get('/api/people/:id', async (req, res) => {
  try {
    const person = await getPerson(client, req.params.id);
    res.json(person);
  } catch (error) {
    res.status(404).json({ error: 'Person not found' });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### 3. Next.js API Routes

```typescript
// pages/api/people/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { createPcoClient, getPeople } from '@rachelallyson/planning-center-people-ts';

const client = createPcoClient({
  appId: process.env.PCO_APP_ID!,
  appSecret: process.env.PCO_APP_SECRET!,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const people = await getPeople(client, { per_page: 100 });
    res.json(people);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

### 4. React Component

```typescript
// src/components/PeopleList.tsx
import React, { useEffect, useState } from 'react';
import { createPcoClient, getPeople, type PeopleList } from '@rachelallyson/planning-center-people-ts';

const client = createPcoClient({
  appId: process.env.REACT_APP_PCO_APP_ID!,
  appSecret: process.env.REACT_APP_PCO_APP_SECRET!,
});

export function PeopleList() {
  const [people, setPeople] = useState<PeopleList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPeople() {
      try {
        const data = await getPeople(client, { per_page: 20 });
        setPeople(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchPeople();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!people) return <div>No people found</div>;

  return (
    <div>
      <h2>People ({people.data.length})</h2>
      <ul>
        {people.data.map((person) => (
          <li key={person.id}>
            {person.attributes.first_name} {person.attributes.last_name}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Advanced Configuration

### 1. Custom Client Configuration

```typescript
import { createPcoClient } from '@rachelallyson/planning-center-people-ts';

const client = createPcoClient({
  // Authentication
  appId: process.env.PCO_APP_ID!,
  appSecret: process.env.PCO_APP_SECRET!,
  
  // Rate limiting
  rateLimit: {
    maxRequests: 100,
    perMilliseconds: 60000, // 1 minute
  },
  
  // Request configuration
  timeout: 30000, // 30 seconds
  baseURL: 'https://api.planningcenteronline.com/people/v2',
  
  // Retry configuration
  retry: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    onRetry: (error, attempt) => {
      console.log(`Retry attempt ${attempt}:`, error.message);
    },
  },
  
  // Custom headers
  headers: {
    'User-Agent': 'MyApp/1.0.0',
    'X-Custom-Header': 'value',
  },
});
```

### 2. OAuth 2.0 Configuration

```typescript
import { createPcoClient } from '@rachelallyson/planning-center-people-ts';

const client = createPcoClient({
  // OAuth tokens
  accessToken: userAccessToken,
  refreshToken: userRefreshToken,
  appId: process.env.PCO_APP_ID!,
  appSecret: process.env.PCO_APP_SECRET!,
  
  // Token refresh callbacks
  onTokenRefresh: async (newTokens) => {
    // Save new tokens to database
    await saveTokensToDatabase(userId, newTokens);
  },
  
  onTokenRefreshFailure: async (error, context) => {
    // Handle refresh failures
    console.error('Token refresh failed:', error.message);
    await clearUserTokens(userId);
    redirectToLogin();
  },
});
```

### 3. Environment-Specific Configuration

```typescript
// src/config/pco.ts
import { createPcoClient } from '@rachelallyson/planning-center-people-ts';

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

export const pcoClient = createPcoClient({
  appId: process.env.PCO_APP_ID!,
  appSecret: process.env.PCO_APP_SECRET!,
  
  // Development settings
  ...(isDevelopment && {
    timeout: 60000, // Longer timeout for debugging
    retry: {
      maxRetries: 1, // Fewer retries in development
      baseDelay: 500,
    },
  }),
  
  // Production settings
  ...(isProduction && {
    timeout: 30000,
    retry: {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 30000,
    },
  }),
});
```

## Testing Setup

### 1. Jest Configuration

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
};
```

### 2. Test Setup File

```typescript
// tests/setup.ts
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Mock fetch for testing
global.fetch = jest.fn();

// Test utilities
export const mockPcoClient = {
  appId: 'test-app-id',
  appSecret: 'test-app-secret',
  baseURL: 'https://api.planningcenteronline.com/people/v2',
};
```

### 3. Integration Test Setup

```typescript
// tests/integration-setup.ts
import { config } from 'dotenv';

// Load integration test environment
config({ path: '.env.integration' });

// Validate required environment variables
const requiredEnvVars = ['PCO_APP_ID', 'PCO_APP_SECRET'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}
```

## Troubleshooting Installation

### Common Issues

#### 1. TypeScript Errors

```bash
# Error: Cannot find module '@rachelallyson/planning-center-people-ts'
# Solution: Ensure package is installed
npm install @rachelallyson/planning-center-people-ts

# Error: Type errors in node_modules
# Solution: Add skipLibCheck to tsconfig.json
{
  "compilerOptions": {
    "skipLibCheck": true
  }
}
```

#### 2. Environment Variable Issues

```bash
# Error: process.env.PCO_APP_ID is undefined
# Solution: Check .env file and loading
console.log('App ID:', process.env.PCO_APP_ID); // Debug
```

#### 3. Fetch API Issues

```bash
# Error: fetch is not defined (Node.js < 18)
# Solution: Install node-fetch polyfill
npm install node-fetch
```

```typescript
// Add to your entry point
import fetch from 'node-fetch';
global.fetch = fetch;
```

#### 4. Module Resolution Issues

```bash
# Error: Cannot resolve module
# Solution: Check tsconfig.json moduleResolution
{
  "compilerOptions": {
    "moduleResolution": "node"
  }
}
```

### Verification Steps

1. **Check Installation**

```bash
npm list @rachelallyson/planning-center-people-ts
```

2. **Verify TypeScript Types**

```typescript
import { createPcoClient } from '@rachelallyson/planning-center-people-ts';
// Should have full IntelliSense support
```

3. **Test Basic Functionality**

```typescript
import { createPcoClient } from '@rachelallyson/planning-center-people-ts';

const client = createPcoClient({
  appId: 'test',
  appSecret: 'test',
});

console.log('Client created successfully:', !!client);
```

## Next Steps

- 🔐 **[Authentication Guide](./AUTHENTICATION.md)** - Set up authentication
- 📚 **[API Reference](./API_REFERENCE.md)** - Explore all available functions
- 💡 **[Examples](./EXAMPLES.md)** - See real-world usage patterns
- 🛠️ **[Error Handling](./ERROR_HANDLING.md)** - Handle errors gracefully

---

*Having trouble with installation? Check our [Troubleshooting Guide](./TROUBLESHOOTING.md) or [open an issue](https://github.com/rachelallyson/planning-center-people-ts/issues) for help.*
