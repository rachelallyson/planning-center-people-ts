# PCO People API Usage Guide

This comprehensive guide covers all aspects of using the `@planning-center-people-ts` package for interacting with the Planning Center Online People API.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication](#authentication)
3. [Basic Operations](#basic-operations)
4. [Advanced Features](#advanced-features)
5. [Error Handling](#error-handling)
6. [Performance Optimization](#performance-optimization)
7. [Best Practices](#best-practices)
8. [Common Patterns](#common-patterns)
9. [Troubleshooting](#troubleshooting)

## Getting Started

### Installation

```bash
npm install @rachelallyson/planning-center-people-ts
```

### Basic Setup

```typescript
import { createPcoClient, getPeople } from '@rachelallyson/planning-center-people-ts';

// Create client with app credentials
const client = createPcoClient({
  appId: 'your-app-id',
  appSecret: 'your-app-secret',
});

// Or with OAuth access token
const client = createPcoClient({
  accessToken: 'your-oauth-token',
});
```

## Authentication

### App Credentials (Recommended for Server Applications)

```typescript
const client = createPcoClient({
  appId: process.env.PCO_APP_ID,
  appSecret: process.env.PCO_APP_SECRET,
});
```

### OAuth 2.0 Access Token (For Multi-User Applications)

```typescript
const client = createPcoClient({
  accessToken: userAccessToken,
});
```

### OAuth 2.0 with Refresh Token Support

```typescript
const client = createPcoClient({
  accessToken: userAccessToken,
  refreshToken: userRefreshToken,
  appId: 'your-app-id',
  appSecret: 'your-app-secret',
  onTokenRefresh: async (newTokens) => {
    // Save new tokens to your database
    await saveTokensToDatabase(userId, newTokens);
  },
  onTokenRefreshFailure: async (error, context) => {
    // Handle refresh token failures
    console.log('Token refresh failed:', error.message);
    if (error.message.includes('invalid_grant')) {
      // User needs to re-authenticate
      await clearUserTokens(userId);
      redirectToLogin();
    }
  },
});
```

### Environment Variables

Create a `.env` file:

```env
PCO_APP_ID=your_app_id_here
PCO_APP_SECRET=your_app_secret_here
```

## Refresh Token Handling

The library provides automatic refresh token handling for OAuth 2.0 applications. When an access token expires (401 error), the library will automatically attempt to refresh it using the provided refresh token.

### Automatic Token Refresh

```typescript
import { createPcoClient, getPeople } from '@rachelallyson/planning-center-people-ts';

const client = createPcoClient({
  accessToken: 'initial-access-token',
  refreshToken: 'refresh-token',
  appId: 'your-app-id',
  appSecret: 'your-app-secret',
  onTokenRefresh: async (newTokens) => {
    // This callback is called whenever tokens are refreshed
    console.log('New access token:', newTokens.access_token);
    console.log('Expires in:', newTokens.expires_in, 'seconds');
    
    // Save to your database
    await saveTokensToDatabase(userId, newTokens);
  },
});

// If the access token is expired, it will be automatically refreshed
const people = await getPeople(client);
```

### Manual Token Refresh

```typescript
import { refreshAccessToken, updateClientTokens } from '@rachelallyson/planning-center-people-ts';

// Manually refresh tokens
const newTokens = await refreshAccessToken(client, 'refresh-token');

// Update client with new tokens
updateClientTokens(client, newTokens);
```

### Error Handling

```typescript
// Option 1: Handle errors in try/catch
try {
  const people = await getPeople(client);
} catch (error) {
  if (error.message.includes('Token refresh failed')) {
    // Refresh token is invalid - user needs to re-authenticate
    redirectToLogin();
  } else {
    // Other API error
    console.error('API error:', error);
  }
}

// Option 2: Use failure callback (recommended)
const client = createPcoClient({
  accessToken: userAccessToken,
  refreshToken: userRefreshToken,
  appId: 'your-app-id',
  appSecret: 'your-app-secret',
  onTokenRefreshFailure: async (error, context) => {
    // This is called automatically when refresh fails
    if (error.message.includes('invalid_grant')) {
      await clearUserTokens(userId);
      redirectToLogin();
    } else if (error.message.includes('Network error')) {
      showNetworkErrorToast();
    }
  },
});
```

### Token Storage Best Practices

```typescript
class TokenManager {
  async saveTokens(userId: string, tokens: TokenResponse): Promise<void> {
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
    
    await database.tokens.upsert({
      userId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt,
    });
  }

  async getTokens(userId: string): Promise<TokenResponse | null> {
    const stored = await database.tokens.findByUserId(userId);
    if (!stored || stored.expiresAt < new Date()) {
      return null;
    }
    
    return {
      access_token: stored.accessToken,
      refresh_token: stored.refreshToken,
      token_type: 'Bearer',
      expires_in: Math.floor((stored.expiresAt.getTime() - Date.now()) / 1000),
    };
  }
}
```

## Basic Operations

### Getting People

```typescript
import { getPeople, getPerson } from '@rachelallyson/planning-center-people-ts';

// Get all people
const people = await getPeople(client);

// Get people with filtering
const activePeople = await getPeople(client, {
  where: { status: 'active' },
  per_page: 50,
});

// Get people with related data
const peopleWithEmails = await getPeople(client, {
  include: ['emails', 'phone_numbers', 'household'],
});

// Get a specific person
const person = await getPerson(client, 'person-id', {
  include: ['emails', 'phone_numbers', 'addresses'],
});
```

### Creating People

```typescript
import { createPerson } from '@rachelallyson/planning-center-people-ts';

const newPerson = await createPerson(client, {
  first_name: 'John',
  last_name: 'Doe',
  status: 'active',
});
```

### Updating People

```typescript
import { updatePerson } from '@rachelallyson/planning-center-people-ts';

const updatedPerson = await updatePerson(client, 'person-id', {
  first_name: 'Jane',
  last_name: 'Smith',
});
```

### Managing Contact Information

```typescript
import { 
  createPersonEmail, 
  createPersonPhoneNumber,
  createPersonAddress 
} from '@rachelallyson/planning-center-people-ts';

// Add email
const email = await createPersonEmail(client, 'person-id', {
  address: 'john@example.com',
  location: 'Home',
  primary: true,
});

// Add phone number
const phone = await createPersonPhoneNumber(client, 'person-id', {
  number: '+1-555-123-4567',
  location: 'Mobile',
  primary: true,
});

// Add address
const address = await createPersonAddress(client, 'person-id', {
  address1: '123 Main St',
  city: 'Anytown',
  state: 'CA',
  zip: '12345',
  location: 'Home',
  primary: true,
});
```

## Advanced Features

### Using Helper Functions

```typescript
import { 
  getCompletePersonProfile,
  createPersonWithContact,
  searchPeople,
  getPersonWorkflowCardsWithNotes 
} from '@rachelallyson/planning-center-people-ts';

// Get complete person profile
const profile = await getCompletePersonProfile(client, 'person-id');

// Create person with initial contact info
const personWithContact = await createPersonWithContact(client, {
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
  phone: '+1-555-123-4567',
  address: {
    address1: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    zip: '12345',
  },
});

// Search for people
const searchResults = await searchPeople(client, {
  name: 'John',
  status: 'active',
});

// Get workflow cards with notes
const workflowCards = await getPersonWorkflowCardsWithNotes(client, 'person-id');
```

### Working with Lists

```typescript
import { getLists, getListById } from '@rachelallyson/planning-center-people-ts';

// Get all lists
const lists = await getLists(client);

// Get specific list
const list = await getListById(client, 'list-id', {
  include: ['people', 'category'],
});
```

### Managing Workflows

```typescript
import { 
  getWorkflows, 
  getWorkflow,
  getWorkflowCards,
  createWorkflowCard 
} from '@rachelallyson/planning-center-people-ts';

// Get all workflows
const workflows = await getWorkflows(client);

// Get workflow cards for a person
const cards = await getWorkflowCards(client, 'person-id');

// Create a new workflow card
const card = await createWorkflowCard(client, 'person-id', 'workflow-id', {
  title: 'Follow up call',
  description: 'Call to discuss membership',
});
```

### Working with Notes

```typescript
import { getNotes, getNote } from '@rachelallyson/planning-center-people-ts';

// Get all notes
const notes = await getNotes(client);

// Get notes for a specific person
const personNotes = await getNotes(client, {
  where: { person_id: 'person-id' },
});
```

### File Upload Handling

The library provides intelligent file upload handling for custom fields that can automatically detect file URLs and handle them appropriately based on the field type.

#### Basic File Upload Detection

```typescript
import { 
  isFileUpload, 
  extractFileUrl, 
  processFileValue 
} from '@rachelallyson/planning-center-people-ts';

// Check if a value contains a file URL
const htmlFileValue = '<a href="https://onark.s3.us-east-1.amazonaws.com/document.pdf" download>View File</a>';
const cleanFileUrl = 'https://onark.s3.us-east-1.amazonaws.com/image.jpg';
const textValue = 'This is just regular text';

console.log(isFileUpload(htmlFileValue)); // true
console.log(isFileUpload(cleanFileUrl)); // true
console.log(isFileUpload(textValue)); // false

// Extract clean URLs from HTML markup
const cleanUrl = extractFileUrl(htmlFileValue);
console.log(cleanUrl); // https://onark.s3.us-east-1.amazonaws.com/document.pdf
```

#### Smart Field Data Creation

The `createPersonFieldData` function automatically determines whether a field is a file field or text field and handles the upload appropriately:

```typescript
import { createPersonFieldData } from '@rachelallyson/planning-center-people-ts';

// This will automatically:
// 1. Check the field definition to determine if it's a file field
// 2. For file fields: Use file upload method (handles both clean URLs and HTML markup)
// 3. For text fields: Clean file URLs from HTML markup and store as text
const result = await createPersonFieldData(
  client,
  'person-id',
  'field-definition-id',
  '<a href="https://example.com/document.pdf" download>View File</a>'
);
```

**Note**: This function will throw an error if the field definition cannot be found, ensuring data integrity.

#### Manual File Processing

For more control, you can manually process file values:

```typescript
import { processFileValue } from '@rachelallyson/planning-center-people-ts';

const fileUrl = 'https://example.com/document.pdf';

// For text fields - returns clean URL string
const textResult = processFileValue(fileUrl, 'text');
console.log(textResult); // "https://example.com/document.pdf"

// For file fields - returns metadata object
const fileResult = processFileValue(fileUrl, 'file');
console.log(fileResult); 
// {
//   url: "https://example.com/document.pdf",
//   filename: "document.pdf",
//   contentType: "application/pdf"
// }
```

#### File Upload Requirements

For file uploads to work properly, you need to install the required dependencies:

```bash
npm install axios form-data
```

The library will automatically use these packages when handling file uploads. If they're not installed, you'll get a helpful error message.

## Error Handling

### Basic Error Handling

```typescript
import { PcoApiError } from '@rachelallyson/planning-center-people-ts';

try {
  const people = await getPeople(client);
} catch (error) {
  if (error instanceof PcoApiError) {
    console.error('API Error:', error.status, error.message);
    console.error('Errors:', error.errors);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Advanced Error Handling with Recovery

```typescript
import { 
  retryWithExponentialBackoff,
  attemptRecovery,
  classifyError 
} from '@rachelallyson/planning-center-people-ts';

try {
  const people = await retryWithExponentialBackoff(
    () => getPeople(client),
    { maxRetries: 3, baseDelay: 1000 }
  );
} catch (error) {
  const classification = classifyError(error);
  
  if (classification.retryable) {
    // Attempt recovery
    const result = await attemptRecovery(
      () => getPeople(client),
      error,
      { client, operation: 'getPeople' }
    );
  } else {
    console.error('Non-retryable error:', classification.userMessage);
  }
}
```

### Circuit Breaker Pattern

```typescript
import { CircuitBreaker } from '@rachelallyson/planning-center-people-ts';

const circuitBreaker = new CircuitBreaker(5, 60000); // 5 failures, 1 minute timeout

try {
  const people = await circuitBreaker.execute(() => getPeople(client));
} catch (error) {
  console.error('Circuit breaker is open or operation failed:', error);
}
```

## Performance Optimization

### Caching

```typescript
import { ApiCache, getCachedPeople } from '@rachelallyson/planning-center-people-ts';

const cache = new ApiCache();

// Use cached version
const people = await getCachedPeople(client, cache, { per_page: 50 }, 300000); // 5 min TTL
```

### Batch Processing

```typescript
import { batchFetchPersonDetails } from '@rachelallyson/planning-center-people-ts';

const personIds = ['id1', 'id2', 'id3', 'id4', 'id5'];
const personDetails = await batchFetchPersonDetails(client, personIds, {
  includeEmails: true,
  includePhones: true,
  batchSize: 10,
});
```

### Streaming Large Datasets

```typescript
import { streamPeopleData } from '@rachelallyson/planning-center-people-ts';

for await (const batch of streamPeopleData(client, {
  perPage: 100,
  maxConcurrent: 3,
  where: { status: 'active' },
})) {
  console.log(`Processing ${batch.length} people`);
  // Process batch
}
```

### Performance Monitoring

```typescript
import { PerformanceMonitor, monitorPerformance } from '@rachelallyson/planning-center-people-ts';

const monitor = new PerformanceMonitor();

class PeopleService {
  @monitorPerformance(monitor, 'getPeople')
  async getPeople() {
    return getPeople(client);
  }
}

// Get metrics
const metrics = monitor.getMetrics();
console.log('Performance metrics:', metrics);
```

## Best Practices

### 1. Use Appropriate Pagination

```typescript
// Good: Use reasonable page sizes
const people = await getPeople(client, { per_page: 50 });

// Avoid: Very large page sizes
const people = await getPeople(client, { per_page: 10000 }); // Too large
```

### 2. Include Only Necessary Data

```typescript
// Good: Include only what you need
const people = await getPeople(client, { 
  include: ['emails'] // Only emails
});

// Avoid: Including everything
const people = await getPeople(client, { 
  include: ['emails', 'phone_numbers', 'addresses', 'social_profiles', 'field_data'] // Too much
});
```

### 3. Handle Rate Limits Gracefully

```typescript
import { retryWithExponentialBackoff } from '@rachelallyson/planning-center-people-ts';

const people = await retryWithExponentialBackoff(
  () => getPeople(client),
  { 
    maxRetries: 3,
    baseDelay: 1000,
    retryableStatuses: [429, 500, 502, 503, 504]
  }
);
```

### 4. Use Bulk Operations for Multiple Items

```typescript
import { executeBulkOperation } from '@rachelallyson/planning-center-people-ts';

const people = [
  { first_name: 'John', last_name: 'Doe' },
  { first_name: 'Jane', last_name: 'Smith' },
];

const results = await executeBulkOperation(
  people,
  (person) => createPerson(client, person),
  { 
    continueOnError: true,
    batchSize: 5,
    onItemComplete: (index, result) => {
      console.log(`Person ${index} processed:`, result);
    }
  }
);

console.log(`Success: ${results.successful.length}, Failed: ${results.failed.length}`);
```

## Common Patterns

### 1. Data Export

```typescript
import { exportAllPeopleData } from '@rachelallyson/planning-center-people-ts';

const allData = await exportAllPeopleData(client, {
  includeInactive: false,
  includeFieldData: true,
  includeWorkflowCards: true,
  batchSize: 50,
});

console.log(`Exported ${allData.length} people`);
```

### 2. Person Search and Filter

```typescript
import { searchPeople } from '@rachelallyson/planning-center-people-ts';

// Search by name
const johns = await searchPeople(client, { name: 'John' });

// Search by email
const emailMatches = await searchPeople(client, { email: 'john@example.com' });

// Search by status
const activePeople = await searchPeople(client, { status: 'active' });
```

### 3. Workflow Management

```typescript
import { 
  getPersonWorkflowCardsWithNotes,
  createWorkflowCardWithNote 
} from '@rachelallyson/planning-center-people-ts';

// Get all workflow cards with notes
const cardsWithNotes = await getPersonWorkflowCardsWithNotes(client, 'person-id');

// Create workflow card with initial note
const cardWithNote = await createWorkflowCardWithNote(
  client, 
  'person-id', 
  'workflow-id',
  {
    title: 'Follow up',
    description: 'Call to discuss membership',
    initialNote: 'Initial contact made'
  }
);
```

### 4. Organization Statistics

```typescript
import { getOrganizationInfo } from '@rachelallyson/planning-center-people-ts';

const orgInfo = await getOrganizationInfo(client);
console.log(`Organization: ${orgInfo.organization.attributes?.name}`);
console.log(`Total People: ${orgInfo.stats.totalPeople}`);
console.log(`Total Households: ${orgInfo.stats.totalHouseholds}`);
```

## Troubleshooting

### Common Issues

#### 1. Authentication Errors

```typescript
// Check your credentials
console.log('App ID:', !!client.config.appId);
console.log('App Secret:', !!client.config.appSecret);
console.log('Access Token:', !!client.config.accessToken);
```

#### 2. Rate Limit Errors

```typescript
// Handle rate limits
try {
  const people = await getPeople(client);
} catch (error) {
  if (error instanceof PcoApiError && error.status === 429) {
    const retryAfter = error.rateLimitHeaders?.['Retry-After'];
    console.log(`Rate limited. Retry after ${retryAfter} seconds`);
  }
}
```

#### 3. Network Timeouts

```typescript
import { withTimeout } from '@rachelallyson/planning-center-people-ts';

try {
  const people = await withTimeout(
    () => getPeople(client),
    30000, // 30 seconds
    'Request timed out'
  );
} catch (error) {
  console.error('Timeout error:', error.message);
}
```

#### 4. Large Dataset Handling

```typescript
import { fetchAllPages } from '@rachelallyson/planning-center-people-ts';

// For very large datasets
const allPeople = await fetchAllPages(
  client,
  (page, perPage) => getPeople(client, { page, per_page: perPage }),
  {
    perPage: 100,
    onProgress: (current, total) => {
      console.log(`Progress: ${current}/${total}`);
    }
  }
);
```

### Debug Mode

```typescript
// Enable debug logging
const client = createPcoClient({
  appId: 'your-app-id',
  appSecret: 'your-app-secret',
  headers: {
    'X-Debug': 'true', // If supported by your setup
  },
});
```

### Error Reporting

```typescript
import { createErrorReport } from '@rachelallyson/planning-center-people-ts';

try {
  const people = await getPeople(client);
} catch (error) {
  const report = createErrorReport(error, {
    operation: 'getPeople',
    client,
    requestInfo: {
      url: '/people/v2/people',
      method: 'GET',
    },
  });
  
  console.error('Error report:', JSON.stringify(report, null, 2));
}
```

## Type Safety

The package provides full TypeScript support with comprehensive type definitions:

```typescript
import type { 
  PersonResource,
  EmailResource,
  PhoneNumberResource,
  AddressResource,
  HouseholdResource,
  SocialProfileResource,
  FieldDatumResource,
  WorkflowCardResource,
  WorkflowCardNoteResource,
  ListResource,
  NoteResource,
  WorkflowResource,
  OrganizationResource,
} from '@rachelallyson/planning-center-people-ts';

// All resources are fully typed
const person: PersonResource = await getPerson(client, 'person-id');
const emails: EmailResource[] = person.relationships?.emails?.data || [];
```

This guide covers the essential patterns and best practices for using the PCO People API client effectively. For more specific use cases, refer to the individual function documentation and examples.
