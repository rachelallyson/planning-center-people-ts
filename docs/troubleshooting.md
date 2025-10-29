# Troubleshooting Guide

Common issues and solutions for the Planning Center People TypeScript library.

## Authentication Issues

### Symptom: "401 Unauthorized" errors

**Cause**: Invalid or expired authentication token.

**Fix**:

```typescript
// For Personal Access Token: Regenerate token in PCO
const client = new PcoClient({
  auth: {
    type: 'personal_access_token',
    personalAccessToken: 'NEW_TOKEN_HERE' // Regenerate in PCO
  }
});

// For OAuth: Ensure refresh callbacks are set up
const client = new PcoClient({
  auth: {
    type: 'oauth',
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    onRefresh: async (tokens) => {
      // REQUIRED: Save new tokens
      await saveTokens(tokens);
    },
    onRefreshFailure: async (error) => {
      // REQUIRED: Handle refresh failure
      console.error('Token refresh failed:', error);
    }
  }
});
```

### Symptom: "Token refresh failed: 401 Unauthorized"

**Cause**: Missing client credentials for OAuth token refresh.

**Fix**:

```typescript
// Add client credentials to OAuth config
const client = new PcoClient({
  auth: {
    type: 'oauth',
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    clientId: 'your-app-id',        // ADD THIS
    clientSecret: 'your-app-secret', // ADD THIS
    onRefresh: async (tokens) => await saveTokens(tokens),
    onRefreshFailure: async (error) => console.error(error)
  }
});

// OR use environment variables
// Set PCO_APP_ID and PCO_APP_SECRET in your environment
```

### Symptom: TypeScript error "Property 'onRefresh' is missing"

**Cause**: OAuth configuration missing required refresh callbacks (v2.1.0+).

**Fix**:

```typescript
// Add required callbacks
const client = new PcoClient({
  auth: {
    type: 'oauth',
    accessToken: 'token',
    refreshToken: 'refresh-token',
    onRefresh: async (tokens) => {
      // REQUIRED: Save tokens
      await saveTokens(tokens);
    },
    onRefreshFailure: async (error) => {
      // REQUIRED: Handle failure
      console.error(error);
    }
  }
});
```

## Rate Limiting Issues

### Symptom: "429 Too Many Requests" errors

**Cause**: Exceeding rate limit of 100 requests per 20 seconds.

**Fix**:

```typescript
// Library handles automatically, but you can monitor:
client.on('rate:limit', (event) => {
  console.warn(`Rate limit: ${event.remaining}/${event.limit} remaining`);
  if (event.remaining < 10) {
    // Slow down requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
});

// Or wait and retry manually
try {
  await client.people.getAll();
} catch (error) {
  if (error instanceof PcoError && error.category === ErrorCategory.RATE_LIMIT) {
    const delay = error.getRetryDelay();
    await new Promise(resolve => setTimeout(resolve, delay));
    // Retry request
    await client.people.getAll();
  }
}
```

**Prevention**: Use batch operations and pagination efficiently to reduce API calls.

## Validation Errors

### Symptom: "422 Unprocessable Entity" errors

**Cause**: Invalid request data (missing required fields, invalid format, etc.).

**Fix**:

```typescript
try {
  await client.people.create({ first_name: 'John' });
} catch (error) {
  if (error instanceof PcoError && error.category === ErrorCategory.VALIDATION) {
    // Parse validation errors
    if (error.response?.errors) {
      error.response.errors.forEach(err => {
        console.error(`Field: ${err.source?.pointer}`);
        console.error(`Error: ${err.detail}`);
      });
    }
  }
}

// Common fixes:
// - Ensure required fields are present
// - Check date formats (use YYYY-MM-DD)
// - Verify email/phone formats
// - Ensure field slugs are correct
```

### Symptom: Field not found when setting custom field

**Cause**: Field slug or name is incorrect, or field doesn't exist.

**Fix**:

```typescript
// Get all field definitions first
const fieldDefinitions = await client.fields.getAllFieldDefinitions();

// Find the correct slug
const birthdateField = fieldDefinitions.find(f => 
  f.attributes.name === 'Birthdate' || 
  f.attributes.slug === 'BIRTHDATE'
);

if (birthdateField) {
  await client.fields.setPersonFieldBySlug(
    personId,
    birthdateField.attributes.slug,
    '1990-01-01'
  );
} else {
  console.error('Field not found');
}
```

## Pagination Issues

### Symptom: Infinite pagination loop

**Cause**: Same page returned repeatedly or `links.next` pointing to same page.

**Fix**:

```typescript
// Library handles this automatically, but if you see it:
let page = 1;
let previousData: string[] = [];
let hasMore = true;

while (hasMore) {
  const response = await client.people.getAll({ perPage: 25, page });
  
  // Check if we got new data
  const currentIds = response.data.map(p => p.id);
  if (previousData.length > 0 && 
      currentIds.length === previousData.length &&
      currentIds.every(id => previousData.includes(id))) {
    console.warn('Same data returned, stopping pagination');
    break;
  }
  
  previousData = currentIds;
  hasMore = response.links?.next !== undefined && response.links?.next !== null;
  page++;
}
```

### Symptom: Missing people in paginated results

**Cause**: People may have been created/deleted between page fetches, or filters changed.

**Fix**:

```typescript
// Use consistent filters
const allPeople = await client.people.getAllPages({
  perPage: 100,
  where: { status: 'active' }, // Use consistent filter
  order: 'created_at' // Use consistent ordering
});
```

## Timeout Issues

### Symptom: Request timeout errors

**Cause**: Request taking longer than timeout (default: 30 seconds).

**Fix**:

```typescript
// Increase timeout
const client = new PcoClient({
  auth: { type: 'personal_access_token', personalAccessToken: 'token' },
  timeout: 60000 // 60 seconds
});

// Or update timeout dynamically
client.updateConfig({ timeout: 60000 });
```

## Network Issues

### Symptom: "Network error" or "ECONNREFUSED"

**Cause**: Network connectivity issues or API endpoint unavailable.

**Fix**:

```typescript
// Check network connectivity
try {
  await client.people.getAll();
} catch (error) {
  if (error instanceof PcoError && error.category === ErrorCategory.NETWORK) {
    // Retry with exponential backoff
    await retryWithBackoff(
      () => client.people.getAll(),
      { maxRetries: 3, baseDelay: 1000 }
    );
  }
}

// Verify base URL
const client = new PcoClient({
  auth: { type: 'personal_access_token', personalAccessToken: 'token' },
  baseURL: 'https://api.planningcenteronline.com/people/v2' // Verify correct URL
});
```

## TypeScript Issues

### Symptom: Type errors when accessing attributes

**Cause**: TypeScript doesn't know about resource attributes.

**Fix**:

```typescript
// Properly type responses
const person = await client.people.getById('person-123');
console.log(person.data?.attributes.first_name); // ✅ TypeScript knows this exists

// Use type assertions if needed
const personData = person.data;
if (personData) {
  console.log(personData.attributes.first_name);
}
```

### Symptom: "Cannot find module" errors

**Cause**: Package not installed or incorrect import path.

**Fix**:

```bash
# Install package
npm install @rachelallyson/planning-center-people-ts

# Verify installation
npm list @rachelallyson/planning-center-people-ts
```

```typescript
// Use correct import
import { PcoClient } from '@rachelallyson/planning-center-people-ts';
```

## Batch Operation Issues

### Symptom: Batch operation fails with reference error

**Cause**: Invalid reference syntax (`$N.id`) or step doesn't exist.

**Fix**:

```typescript
// Use correct reference syntax
const results = await client.batch.execute([
  { type: 'people.create', data: { firstName: 'John' } },
  { type: 'people.addEmail', personId: '$0.id', data: { address: 'john@example.com' } }
  // $0.id references result from step 0 (first operation)
]);

// Verify step exists
if (results.successful[0]) {
  const personId = results.successful[0].data.id;
  // Use personId directly if needed
}
```

## File Upload Issues

### Symptom: File upload fails for custom field

**Cause**: Field type is not 'file' or file URL format is incorrect.

**Fix**:

```typescript
// Verify field type
const fieldDefinition = await client.fields.getFieldDefinition('field-id');
if (fieldDefinition.attributes.data_type !== 'file') {
  console.error('Field is not a file field');
  return;
}

// Use correct file URL format
await client.fields.setPersonField(personId, {
  fieldSlug: 'RESUME',
  value: 'https://example.com/file.pdf', // Use direct URL
  handleFileUploads: true // Let library handle upload
});
```

## Performance Issues

### Symptom: Slow pagination or requests

**Cause**: Not using caching, making too many requests, or inefficient pagination.

**Fix**:

```typescript
// Enable field definition caching
const client = new PcoClient({
  auth: { type: 'personal_access_token', personalAccessToken: 'token' },
  caching: {
    fieldDefinitions: true,
    ttl: 300000 // 5 minutes
  }
});

// Use larger page sizes
const allPeople = await client.people.getAllPages({ perPage: 100 }); // Max 100

// Use batch operations instead of individual requests
const results = await client.batch.execute([
  { type: 'people.create', data: { firstName: 'John' } },
  { type: 'people.create', data: { firstName: 'Jane' } }
]);
```

## Debugging Tips

### Enable Event Logging

```typescript
client.on('request:start', (event) => {
  console.log(`Request: ${event.method} ${event.endpoint}`);
});

client.on('request:complete', (event) => {
  console.log(`Completed: ${event.status} in ${event.duration}ms`);
});

client.on('error', (event) => {
  console.error('Error:', event.error);
  console.error('Context:', event.context);
});
```

### Check Rate Limit Status

```typescript
const rateLimitInfo = client.getRateLimitInfo();
console.log('Remaining:', rateLimitInfo.remaining);
console.log('Limit:', rateLimitInfo.limit);
console.log('Resets in:', rateLimitInfo.windowResetsIn, 'ms');
```

### Get Performance Metrics

```typescript
const metrics = client.getPerformanceMetrics();
console.log('Average response time:', metrics.averageResponseTime);
console.log('Success rate:', metrics.successRate);
console.log('Total requests:', metrics.totalRequests);
```

**Still having issues?** Check the [GitHub Issues](https://github.com/rachelallyson/planning-center-people-ts/issues) or review the [Error Handling Guide](./guides/error-handling.md).
