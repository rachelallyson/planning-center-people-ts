# Troubleshooting Guide

This guide helps you diagnose and resolve common issues when using the Planning Center People TypeScript library.

## Table of Contents

1. [Quick Diagnostics](#quick-diagnostics)
2. [Authentication Issues](#authentication-issues)
3. [API Connection Problems](#api-connection-problems)
4. [Rate Limiting Issues](#rate-limiting-issues)
5. [TypeScript Errors](#typescript-errors)
6. [Performance Problems](#performance-problems)
7. [Data Issues](#data-issues)
8. [Environment & Setup Issues](#environment--setup-issues)
9. [Debugging Techniques](#debugging-techniques)
10. [Getting Help](#getting-help)

## Quick Diagnostics

### Health Check Script

Run this diagnostic script to quickly identify common issues:

```typescript
// diagnostic.ts
import { createPcoClient, getOrganization, getRateLimitInfo } from '@rachelallyson/planning-center-people-ts';

async function runDiagnostics() {
  console.log('🔍 Running PCO Library Diagnostics...\n');
  
  // Check environment variables
  console.log('📋 Environment Check:');
  console.log(`  PCO_APP_ID: ${process.env.PCO_APP_ID ? '✅ Set' : '❌ Missing'}`);
  console.log(`  PCO_APP_SECRET: ${process.env.PCO_APP_SECRET ? '✅ Set' : '❌ Missing'}`);
  console.log(`  PCO_PERSONAL_ACCESS_TOKEN: ${process.env.PCO_PERSONAL_ACCESS_TOKEN ? '✅ Set' : '❌ Missing'}`);
  
  if (!process.env.PCO_APP_ID || !process.env.PCO_APP_SECRET || !process.env.PCO_PERSONAL_ACCESS_TOKEN) {
    console.log('\n❌ Missing required environment variables. Please check your .env file.');
    return;
  }
  
  try {
    // Create client
    console.log('\n🔧 Creating PCO Client...');
    const client = createPcoClient({
      appId: process.env.PCO_APP_ID!,
      appSecret: process.env.PCO_APP_SECRET!,
      personalAccessToken: process.env.PCO_PERSONAL_ACCESS_TOKEN!,
    });
    console.log('✅ Client created successfully');
    
    // Test API connection
    console.log('\n🌐 Testing API Connection...');
    const start = Date.now();
    const org = await getOrganization(client);
    const latency = Date.now() - start;
    console.log(`✅ API connection successful (${latency}ms)`);
    console.log(`  Organization: ${org.data?.attributes?.name || 'Unknown'}`);
    
    // Check rate limits
    console.log('\n⏱️ Rate Limit Status:');
    const rateLimitInfo = getRateLimitInfo(client);
    console.log(`  Requests used: ${rateLimitInfo.requestsUsed}`);
    console.log(`  Requests remaining: ${rateLimitInfo.requestsRemaining}`);
    console.log(`  Window resets in: ${rateLimitInfo.windowResetsIn}ms`);
    
    console.log('\n✅ All diagnostics passed!');
    
  } catch (error) {
    console.log('\n❌ Diagnostic failed:');
    console.error(error);
    
    // Provide specific guidance based on error type
    if (error.message.includes('401')) {
      console.log('\n💡 Authentication Error - Check your credentials');
    } else if (error.message.includes('403')) {
      console.log('\n💡 Authorization Error - Check your app permissions');
    } else if (error.message.includes('429')) {
      console.log('\n💡 Rate Limit Error - Wait before making more requests');
    } else if (error.message.includes('Network')) {
      console.log('\n💡 Network Error - Check your internet connection');
    }
  }
}

runDiagnostics().catch(console.error);
```

### Common Error Quick Reference

| Error | Status Code | Common Cause | Quick Fix |
|-------|-------------|--------------|-----------|
| `Invalid credentials` | 401 | Wrong token/secret | Check your .env file |
| `Insufficient permissions` | 403 | App lacks permissions | Update app permissions in PCO |
| `Rate limit exceeded` | 429 | Too many requests | Wait 1 minute or reduce request rate |
| `Network error` | 0 | Connection issues | Check internet/firewall |
| `Request timeout` | 408 | Slow response | Increase timeout or retry |
| `Not found` | 404 | Invalid ID/endpoint | Verify the resource exists |

## Authentication Issues

### Problem: "Invalid credentials" or 401 errors

**Symptoms:**

- Getting 401 Unauthorized errors
- "Invalid credentials" error messages
- Authentication failures

**Diagnosis:**

```typescript
// Check your credentials
console.log('App ID:', process.env.PCO_APP_ID);
console.log('App Secret:', process.env.PCO_APP_SECRET ? 'Set' : 'Not set');
console.log('Token:', process.env.PCO_PERSONAL_ACCESS_TOKEN ? 'Set' : 'Not set');
```

**Solutions:**

1. **Verify Environment Variables**

   ```bash
   # Check your .env file
   cat .env | grep PCO
   ```

2. **Test Token Validity**

   ```typescript
   // Test with a simple API call
   try {
     const org = await getOrganization(client);
     console.log('Token is valid');
   } catch (error) {
     console.log('Token is invalid:', error.message);
   }
   ```

3. **Regenerate Personal Access Token**
   - Go to [Planning Center Developer](https://api.planningcenteronline.com/)
   - Navigate to your app
   - Go to "Personal Access Tokens"
   - Create a new token
   - Update your `.env` file

4. **Check App Permissions**
   - Ensure your app has "People API" permissions
   - Verify the token has the required scopes

### Problem: OAuth token refresh failures

**Symptoms:**

- "Token refresh failed" errors
- Users getting logged out unexpectedly
- 401 errors after initial success

**Solutions:**

1. **Check Refresh Token Validity**

   ```typescript
   const client = createPcoClient({
     accessToken: userAccessToken,
     refreshToken: userRefreshToken,
     appId: process.env.PCO_APP_ID!,
     appSecret: process.env.PCO_APP_SECRET!,
     onTokenRefreshFailure: async (error, context) => {
       console.error('Token refresh failed:', error.message);
       // Handle the failure appropriately
     }
   });
   ```

2. **Implement Proper Error Handling**

   ```typescript
   try {
     const people = await getPeople(client);
   } catch (error) {
     if (error.message.includes('Token refresh failed')) {
       // Redirect user to re-authenticate
       redirectToLogin();
     }
   }
   ```

3. **Check Token Expiration**

   ```typescript
   // Store token expiration time
   const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);
   console.log('Token expires at:', tokenExpiresAt);
   ```

## API Connection Problems

### Problem: Network errors or connection timeouts

**Symptoms:**

- "Network error" messages
- Connection timeouts
- Intermittent failures

**Diagnosis:**

```typescript
// Test basic connectivity
async function testConnectivity() {
  try {
    const response = await fetch('https://api.planningcenteronline.com/people/v2', {
      method: 'HEAD',
      timeout: 5000
    });
    console.log('PCO API accessible:', response.ok);
  } catch (error) {
    console.log('Connectivity test failed:', error.message);
  }
}
```

**Solutions:**

1. **Check Network Connection**

   ```bash
   # Test basic connectivity
   ping api.planningcenteronline.com
   curl -I https://api.planningcenteronline.com/people/v2
   ```

2. **Increase Timeout Settings**

   ```typescript
   const client = createPcoClient({
     // ... other config
     timeout: 60000, // 60 seconds
   });
   ```

3. **Check Firewall/Proxy Settings**
   - Ensure outbound HTTPS (443) is allowed
   - Check if corporate firewall blocks the API
   - Configure proxy if needed

4. **Use Retry Logic**

   ```typescript
   import { retryWithBackoff } from '@rachelallyson/planning-center-people-ts';
   
   const result = await retryWithBackoff(
     () => getPeople(client),
     {
       maxRetries: 3,
       baseDelay: 1000,
       context: { endpoint: '/people', method: 'GET' }
     }
   );
   ```

### Problem: SSL/TLS certificate issues

**Symptoms:**

- "Certificate verify failed" errors
- SSL handshake failures
- Node.js certificate errors

**Solutions:**

1. **Update Node.js**

   ```bash
   node --version
   npm update
   ```

2. **Check Certificate Chain**

   ```bash
   openssl s_client -connect api.planningcenteronline.com:443 -servername api.planningcenteronline.com
   ```

3. **Environment-specific fixes**

   ```typescript
   // For development environments with self-signed certificates
   process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // Only for development!
   ```

## Rate Limiting Issues

### Problem: Rate limit exceeded (429 errors)

**Symptoms:**

- Getting 429 Too Many Requests errors
- "Rate limit exceeded" messages
- Requests being throttled

**Diagnosis:**

```typescript
// Check current rate limit status
const rateLimitInfo = getRateLimitInfo(client);
console.log('Rate limit status:', {
  used: rateLimitInfo.requestsUsed,
  remaining: rateLimitInfo.requestsRemaining,
  resetsIn: rateLimitInfo.windowResetsIn
});
```

**Solutions:**

1. **Implement Proper Rate Limiting**

   ```typescript
   const client = createPcoClient({
     // ... other config
     rateLimit: {
       maxRequests: 90, // Leave headroom
       perMilliseconds: 60000
     }
   });
   ```

2. **Add Delays Between Requests**

   ```typescript
   async function rateLimitedOperation() {
     const people = await getPeople(client);
     
     // Wait before next request
     await new Promise(resolve => setTimeout(resolve, 1000));
     
     return people;
   }
   ```

3. **Use Batch Processing**

   ```typescript
   import { processInBatches } from '@rachelallyson/planning-center-people-ts';
   
   const results = await processInBatches(
     personIds,
     10, // Process 10 at a time
     async (batch) => {
       // Process batch
       await Promise.all(batch.map(id => getPerson(client, id)));
       
       // Wait between batches
       await new Promise(resolve => setTimeout(resolve, 2000));
     }
   );
   ```

4. **Handle Rate Limit Errors Gracefully**

   ```typescript
   try {
     const people = await getPeople(client);
   } catch (error) {
     if (error.status === 429) {
       const retryAfter = error.getRetryDelay();
       console.log(`Rate limited. Retry after ${retryAfter}ms`);
       await new Promise(resolve => setTimeout(resolve, retryAfter));
       // Retry the request
     }
   }
   ```

## TypeScript Errors

### Problem: Type errors or missing types

**Symptoms:**

- TypeScript compilation errors
- Missing type definitions
- IntelliSense not working

**Solutions:**

1. **Check TypeScript Version**

   ```bash
   npx tsc --version
   # Should be 4.5.0 or higher
   ```

2. **Update tsconfig.json**

   ```json
   {
     "compilerOptions": {
       "target": "ES2020",
       "module": "ESNext",
       "moduleResolution": "node",
       "strict": true,
       "esModuleInterop": true,
       "skipLibCheck": true
     }
   }
   ```

3. **Check Import Statements**

   ```typescript
   // Correct imports
   import { createPcoClient, getPeople } from '@rachelallyson/planning-center-people-ts';
   
   // Check if types are available
   import type { PersonResource, PeopleList } from '@rachelallyson/planning-center-people-ts';
   ```

4. **Regenerate Type Definitions**

   ```bash
   npm install --force
   npx tsc --noEmit
   ```

### Problem: "Cannot find module" errors

**Solutions:**

1. **Check Package Installation**

   ```bash
   npm list @rachelallyson/planning-center-people-ts
   ```

2. **Clear Node Modules**

   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Check Module Resolution**

   ```json
   // tsconfig.json
   {
     "compilerOptions": {
       "moduleResolution": "node",
       "baseUrl": ".",
       "paths": {
         "@/*": ["src/*"]
       }
     }
   }
   ```

## Performance Problems

### Problem: Slow API responses

**Symptoms:**

- Long response times
- Timeouts
- Poor user experience

**Diagnosis:**

```typescript
// Measure response times
async function measurePerformance() {
  const start = Date.now();
  const people = await getPeople(client, { per_page: 100 });
  const duration = Date.now() - start;
  
  console.log(`Request took ${duration}ms`);
  console.log(`Retrieved ${people.data.length} people`);
}
```

**Solutions:**

1. **Optimize Request Parameters**

   ```typescript
   // Use appropriate page sizes
   const people = await getPeople(client, {
     per_page: 100, // Use larger page sizes when possible
     include: ['emails'] // Only include what you need
   });
   ```

2. **Implement Caching**

   ```typescript
   import { ApiCache } from '@rachelallyson/planning-center-people-ts';
   
   const cache = new ApiCache();
   
   async function getCachedPeople() {
     const cacheKey = 'people:all';
     let people = await cache.get(cacheKey);
     
     if (!people) {
       people = await getPeople(client);
       await cache.set(cacheKey, people, 5 * 60 * 1000); // 5 minutes
     }
     
     return people;
   }
   ```

3. **Use Streaming for Large Datasets**

   ```typescript
   import { streamPeopleData } from '@rachelallyson/planning-center-people-ts';
   
   async function processLargeDataset() {
     const peopleStream = streamPeopleData(client, { per_page: 100 });
     
     for await (const person of peopleStream) {
       // Process each person without loading all into memory
       await processPerson(person);
     }
   }
   ```

4. **Implement Parallel Processing**

   ```typescript
   // Process multiple requests in parallel
   const [people, households, fieldDefs] = await Promise.all([
     getPeople(client, { per_page: 50 }),
     getHouseholds(client, { per_page: 50 }),
     getFieldDefinitions(client, { per_page: 50 })
   ]);
   ```

### Problem: Memory usage issues

**Solutions:**

1. **Use Streaming Instead of Loading All Data**

   ```typescript
   // Instead of loading all people at once
   const allPeople = await getAllPages(client, '/people'); // Can use lots of memory
   
   // Use streaming
   const peopleStream = streamPeopleData(client);
   for await (const person of peopleStream) {
     // Process one at a time
   }
   ```

2. **Implement Pagination**

   ```typescript
   async function processAllPeopleInPages() {
     let page = 1;
     let hasMore = true;
     
     while (hasMore) {
       const people = await getPeople(client, { page, per_page: 50 });
       
       // Process this page
       await processPeoplePage(people.data);
       
       hasMore = !!people.links?.next;
       page++;
     }
   }
   ```

## Data Issues

### Problem: Missing or incorrect data

**Symptoms:**

- Empty responses
- Missing fields
- Unexpected data structure

**Diagnosis:**

```typescript
// Debug data structure
async function debugData() {
  const people = await getPeople(client, { per_page: 1 });
  console.log('People structure:', JSON.stringify(people, null, 2));
  
  if (people.data.length > 0) {
    const person = people.data[0];
    console.log('Person attributes:', Object.keys(person.attributes));
    console.log('Person relationships:', Object.keys(person.relationships || {}));
  }
}
```

**Solutions:**

1. **Check Include Parameters**

   ```typescript
   // Make sure you're including related data
   const person = await getPerson(client, personId, [
     'emails',
     'phone_numbers',
     'addresses',
     'field_data'
   ]);
   ```

2. **Verify Field Names**

   ```typescript
   // Check the actual field names in the response
   console.log('Available fields:', Object.keys(person.attributes));
   
   // Use the correct field names
   const firstName = person.attributes.first_name; // Not firstName
   const lastName = person.attributes.last_name;   // Not lastName
   ```

3. **Handle Missing Data Gracefully**

   ```typescript
   function getPersonName(person: PersonResource): string {
     const firstName = person.attributes.first_name || '';
     const lastName = person.attributes.last_name || '';
     return `${firstName} ${lastName}`.trim() || 'Unknown';
   }
   ```

### Problem: File upload issues

**Symptoms:**

- File uploads failing
- Incorrect file handling
- File field data not saving

**Solutions:**

1. **Check File Field Type**

   ```typescript
   import { isFileUpload, extractFileUrl } from '@rachelallyson/planning-center-people-ts';
   
   const value = '<a href="https://example.com/file.pdf" download>View File</a>';
   
   if (isFileUpload(value)) {
     const fileUrl = extractFileUrl(value);
     console.log('File URL:', fileUrl);
   }
   ```

2. **Use Smart Field Data Creation**

   ```typescript
   import { createPersonFieldData } from '@rachelallyson/planning-center-people-ts';
   
   // The library automatically handles file uploads
   await createPersonFieldData(
     client,
     personId,
     fieldDefinitionId,
     '<a href="https://example.com/document.pdf" download>View File</a>'
   );
   ```

3. **Verify Field Definition**

   ```typescript
   const fieldDef = await getFieldDefinition(client, fieldDefinitionId);
   console.log('Field type:', fieldDef.data?.attributes?.field_type);
   ```

## Environment & Setup Issues

### Problem: Environment variable issues

**Solutions:**

1. **Check .env File**

   ```bash
   # Verify .env file exists and has correct values
   ls -la .env
   cat .env | grep PCO
   ```

2. **Load Environment Variables**

   ```typescript
   // Make sure to load .env file
   import dotenv from 'dotenv';
   dotenv.config();
   
   // Or use built-in Node.js support (Node.js 20.6+)
   // No additional setup needed
   ```

3. **Check Environment in Different Contexts**

   ```typescript
   // Different ways to access environment variables
   console.log('NODE_ENV:', process.env.NODE_ENV);
   console.log('PCO_APP_ID:', process.env.PCO_APP_ID);
   
   // For React apps, use REACT_APP_ prefix
   console.log('REACT_APP_PCO_APP_ID:', process.env.REACT_APP_PCO_APP_ID);
   ```

### Problem: Node.js version compatibility

**Solutions:**

1. **Check Node.js Version**

   ```bash
   node --version
   # Should be 18.0.0 or higher
   ```

2. **Update Node.js**

   ```bash
   # Using nvm
   nvm install 18
   nvm use 18
   
   # Or download from nodejs.org
   ```

3. **Add Fetch Polyfill for Older Versions**

   ```typescript
   // For Node.js < 18
   import fetch from 'node-fetch';
   global.fetch = fetch;
   ```

## Debugging Techniques

### Enable Debug Logging

```typescript
// Enable detailed logging
const client = createPcoClient({
  // ... other config
  headers: {
    'X-Debug': 'true',
    'User-Agent': 'MyApp/1.0.0 (Debug Mode)'
  }
});

// Add request/response logging
const originalFetch = global.fetch;
global.fetch = async (url, options) => {
  console.log('Request:', { url, options });
  const response = await originalFetch(url, options);
  console.log('Response:', { status: response.status, headers: response.headers });
  return response;
};
```

### Network Debugging

```typescript
// Log all network requests
import { getPeople } from '@rachelallyson/planning-center-people-ts';

// Wrap API calls with logging
async function debugApiCall() {
  console.log('Making API call...');
  const start = Date.now();
  
  try {
    const people = await getPeople(client, { per_page: 5 });
    const duration = Date.now() - start;
    
    console.log(`API call successful (${duration}ms):`, {
      count: people.data.length,
      hasMore: !!people.links?.next
    });
    
    return people;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`API call failed (${duration}ms):`, error);
    throw error;
  }
}
```

### Performance Profiling

```typescript
// Profile API performance
class ApiProfiler {
  private metrics = new Map<string, number[]>();
  
  async profile<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    
    try {
      const result = await fn();
      const duration = Date.now() - start;
      
      this.recordMetric(operation, duration);
      console.log(`${operation}: ${duration}ms`);
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`${operation} failed: ${duration}ms`, error);
      throw error;
    }
  }
  
  private recordMetric(operation: string, duration: number) {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    this.metrics.get(operation)!.push(duration);
  }
  
  getStats(operation: string) {
    const durations = this.metrics.get(operation) || [];
    if (durations.length === 0) return null;
    
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    const min = Math.min(...durations);
    const max = Math.max(...durations);
    
    return { count: durations.length, average: avg, min, max };
  }
}

// Usage
const profiler = new ApiProfiler();

async function profiledGetPeople() {
  return await profiler.profile('get_people', () => getPeople(client));
}
```

## Getting Help

### Before Asking for Help

1. **Run the diagnostic script** (see Quick Diagnostics section)
2. **Check this troubleshooting guide** for your specific error
3. **Search existing issues** on GitHub
4. **Check the API documentation** for Planning Center

### When Reporting Issues

Include the following information:

```typescript
// Include this information when reporting issues
const debugInfo = {
  libraryVersion: require('@rachelallyson/planning-center-people-ts/package.json').version,
  nodeVersion: process.version,
  platform: process.platform,
  environment: process.env.NODE_ENV,
  error: error.message,
  stack: error.stack,
  requestDetails: {
    endpoint: '/people',
    method: 'GET',
    timestamp: new Date().toISOString()
  }
};

console.log('Debug info:', JSON.stringify(debugInfo, null, 2));
```

### Useful Resources

- **GitHub Issues**: [Report bugs or request features](https://github.com/rachelallyson/planning-center-people-ts/issues)
- **Planning Center API Docs**: [Official PCO API documentation](https://developer.planningcenteronline.com/)
- **TypeScript Handbook**: [TypeScript documentation](https://www.typescriptlang.org/docs/)

### Community Support

- **GitHub Discussions**: Ask questions and share experiences
- **Stack Overflow**: Tag questions with `planning-center` and `typescript`
- **Discord/Slack**: Join community channels if available

### Professional Support

For enterprise applications or critical issues:

- **GitHub Sponsors**: Support the project development
- **Consulting**: Hire for custom implementations
- **Training**: Get team training on the library

---

*This troubleshooting guide covers the most common issues. If you don't find your problem here, please [open an issue](https://github.com/rachelallyson/planning-center-people-ts/issues) with detailed information about your specific situation.*
