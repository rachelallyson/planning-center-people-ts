# Quick Start Guide

Get up and running with the Planning Center People TypeScript library in 5 minutes.

## Installation

```bash
npm install @rachelallyson/planning-center-people-ts
```

**Requirements**:

- Node.js >= 16.0.0
- TypeScript >= 4.0 (recommended)

## Step 1: Create a Client

Choose your authentication method:

### Personal Access Token (Recommended for scripts)

```typescript
import { PcoClient } from '@rachelallyson/planning-center-people-ts';

const client = new PcoClient({
  auth: {
    type: 'personal_access_token',
    personalAccessToken: 'your-token-here'
  }
});
```

### OAuth 2.0 (Required for multi-user apps)

```typescript
import { PcoClient } from '@rachelallyson/planning-center-people-ts';

const client = new PcoClient({
  auth: {
    type: 'oauth',
    accessToken: 'your-access-token',
    refreshToken: 'your-refresh-token',
    // REQUIRED: Handle token refresh
    onRefresh: async (tokens) => {
      // Save new tokens to your database
      await saveTokens(tokens);
    },
    // REQUIRED: Handle refresh failures
    onRefreshFailure: async (error) => {
      // Handle auth failure (e.g., redirect to login)
      console.error('Token refresh failed:', error);
    }
  }
});
```

## Step 2: Basic Operations

### Get People

```typescript
// Get first page of people
const people = await client.people.getAll({ perPage: 25 });

console.log(`Found ${people.data.length} people`);
people.data.forEach(person => {
  console.log(`${person.attributes.first_name} ${person.attributes.last_name}`);
});

// Get all pages automatically
const allPeople = await client.people.getAllPages({ perPage: 25 });
console.log(`Total: ${allPeople.data.length} people`);
```

### Find or Create a Person

```typescript
// Find existing person or create new one
const person = await client.people.findOrCreate({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '555-1234',
  matchStrategy: 'fuzzy' // or 'exact'
});

console.log(`Person ID: ${person.id}`);
console.log(`Match found: ${person.match?.found}`);
```

### Create a Person

```typescript
const newPerson = await client.people.create({
  first_name: 'Jane',
  last_name: 'Smith'
});

// Add contact information
await client.contacts.createEmail(newPerson.id, {
  address: 'jane@example.com',
  location: 'Home',
  primary: true
});

await client.contacts.createPhone(newPerson.id, {
  number: '555-5678',
  location: 'Home',
  primary: true
});
```

### Set Custom Fields

```typescript
// Set field by slug (recommended)
await client.fields.setPersonFieldBySlug(
  person.id,
  'BIRTHDATE',
  '1990-01-01'
);

// Set field by name
await client.fields.setPersonFieldByName(
  person.id,
  'Membership Status',
  'Member'
);

// Set field with options
await client.fields.setPersonField(person.id, {
  fieldSlug: 'CUSTOM_FIELD',
  value: 'Some value',
  handleFileUploads: true
});
```

### Add to Workflow

```typescript
const workflowCard = await client.workflows.addPersonToWorkflow(
  person.id,
  'workflow-id',
  {
    note: 'Added via integration',
    skipIfExists: true // Don't add if already exists
  }
);
```

## Step 3: Error Handling

```typescript
import { PcoError, ErrorCategory } from '@rachelallyson/planning-center-people-ts';

try {
  const person = await client.people.create({ first_name: 'John' });
} catch (error) {
  if (error instanceof PcoError) {
    switch (error.category) {
      case ErrorCategory.AUTHENTICATION:
        console.error('Authentication failed - check your token');
        break;
      case ErrorCategory.RATE_LIMIT:
        console.error('Rate limited - retry after:', error.getRetryDelay(), 'ms');
        break;
      case ErrorCategory.VALIDATION:
        console.error('Validation error:', error.message);
        break;
      default:
        console.error('Error:', error.message);
    }
  } else {
    // Non-PCO error
    throw error;
  }
}
```

## Step 4: Advanced Features

### Batch Operations

```typescript
const results = await client.batch.execute([
  {
    type: 'people.create',
    data: {
      firstName: 'John',
      lastName: 'Doe'
    }
  },
  {
    type: 'people.addEmail',
    personId: '$0.id', // Reference person from step 0
    data: {
      address: 'john@example.com',
      primary: true
    }
  },
  {
    type: 'people.addPhone',
    personId: '$0.id',
    data: {
      number: '555-1234',
      primary: true
    }
  }
]);

console.log(`Success: ${results.successful.length}`);
console.log(`Failed: ${results.failed.length}`);
console.log(`Success rate: ${(results.successRate * 100).toFixed(1)}%`);
```

### Event Monitoring

```typescript
// Listen to request events
client.on('request:start', (event) => {
  console.log(`Starting: ${event.method} ${event.endpoint}`);
});

client.on('request:complete', (event) => {
  console.log(`Completed: ${event.status} in ${event.duration}ms`);
});

client.on('error', (event) => {
  console.error(`Error in ${event.operation}:`, event.error);
});

client.on('rate:limit', (event) => {
  console.warn(`Rate limit: ${event.remaining}/${event.limit} remaining`);
});
```

### Performance Metrics

```typescript
// Get performance metrics
const metrics = client.getPerformanceMetrics();
console.log('Average response time:', metrics.averageResponseTime);
console.log('Success rate:', metrics.successRate);

// Get rate limit info
const rateLimitInfo = client.getRateLimitInfo();
console.log('Requests remaining:', rateLimitInfo.remaining);
console.log('Window resets in:', rateLimitInfo.windowResetsIn, 'ms');
```

## Complete Example

```typescript
import { PcoClient } from '@rachelallyson/planning-center-people-ts';

async function main() {
  // Create client
  const client = new PcoClient({
    auth: {
      type: 'personal_access_token',
      personalAccessToken: process.env.PCO_PERSONAL_ACCESS_TOKEN!
    },
    caching: {
      fieldDefinitions: true,
      ttl: 300000 // 5 minutes
    },
    retry: {
      enabled: true,
      maxRetries: 3
    }
  });

  try {
    // Find or create person
    const person = await client.people.findOrCreate({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      matchStrategy: 'fuzzy'
    });

    console.log(`Person ID: ${person.id}`);

    // Set custom fields
    await client.fields.setPersonFieldBySlug(person.id, 'BIRTHDATE', '1990-01-01');

    // Add to workflow
    await client.workflows.addPersonToWorkflow(person.id, 'workflow-id', {
      note: 'Added via integration'
    });

    console.log('Success!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
```

## Next Steps

- **[Pagination Guide](./pagination.md)** - Learn about pagination patterns
- **[Error Handling Guide](./error-handling.md)** - Comprehensive error handling
- **[Configuration Reference](../reference/config.md)** - All configuration options
- **[Examples & Recipes](../recipes/examples.md)** - More code examples
