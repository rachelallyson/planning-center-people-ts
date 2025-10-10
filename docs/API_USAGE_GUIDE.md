# API Usage Guide - v2.0.0

This comprehensive guide covers all aspects of using the `@rachelallyson/planning-center-people-ts` v2.0.0 package for interacting with the Planning Center Online People API.

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
import { PcoClient } from '@rachelallyson/planning-center-people-ts';

// Create client with Personal Access Token
const client = new PcoClient({
  auth: {
    type: 'personal_access_token',
    personalAccessToken: 'your-token'
  }
});

// Or with OAuth
const client = new PcoClient({
  auth: {
    type: 'oauth',
    accessToken: 'your-oauth-token',
    refreshToken: 'your-refresh-token',
    onRefresh: async (tokens) => {
      // Save new tokens to your database
      await saveTokensToDatabase(userId, tokens);
    }
  }
});
```

## Authentication

### Personal Access Token (Recommended for Server Applications)

```typescript
const client = new PcoClient({
  auth: {
    type: 'personal_access_token',
    personalAccessToken: process.env.PCO_PERSONAL_ACCESS_TOKEN
  }
});
```

### OAuth 2.0 (For Multi-User Applications)

```typescript
const client = new PcoClient({
  auth: {
    type: 'oauth',
    accessToken: userAccessToken,
    refreshToken: userRefreshToken,
    onRefresh: async (newTokens) => {
      // Save new tokens to your database
      await saveTokensToDatabase(userId, newTokens);
    },
    onRefreshFailure: async (error) => {
      // Handle refresh token failures
      console.error('Token refresh failed:', error.message);
      await clearUserTokens(userId);
    }
  }
});
```

### Environment Variables

Create a `.env` file:

```env
PCO_PERSONAL_ACCESS_TOKEN=your_personal_access_token_here
PCO_ACCESS_TOKEN=your_oauth_access_token_here
PCO_REFRESH_TOKEN=your_oauth_refresh_token_here
```

## Basic Operations

### Getting People

```typescript
// Get all people
const people = await client.people.getAll();

// Get people with filtering
const activePeople = await client.people.getAll({
  where: { status: 'active' },
  perPage: 50
});

// Get people with related data
const peopleWithEmails = await client.people.getAll({
  include: ['emails', 'phone_numbers', 'household']
});

// Get a specific person
const person = await client.people.getById('person-id', ['emails', 'phone_numbers']);
```

### Creating People

```typescript
// Basic person creation
const newPerson = await client.people.create({
  first_name: 'John',
  last_name: 'Doe',
  status: 'active'
});

// Create person with contacts
const personWithContacts = await client.people.createWithContacts(
  { first_name: 'John', last_name: 'Doe' },
  {
    email: { address: 'john@example.com', primary: true },
    phone: { number: '+1-555-123-4567', location: 'Mobile' }
  }
);
```

### Updating People

```typescript
const updatedPerson = await client.people.update('person-id', {
  first_name: 'Jane',
  last_name: 'Smith'
});
```

### Managing Contact Information

```typescript
// Add email
const email = await client.people.addEmail('person-id', {
  address: 'john@example.com',
  location: 'Home',
  primary: true
});

// Add phone number
const phone = await client.people.addPhoneNumber('person-id', {
  number: '+1-555-123-4567',
  location: 'Mobile',
  primary: true
});

// Add address
const address = await client.people.addAddress('person-id', {
  address1: '123 Main St',
  city: 'Anytown',
  state: 'CA',
  zip: '12345',
  location: 'Home',
  primary: true
});
```

## Advanced Features

### Person Matching

The library provides intelligent person matching to avoid duplicates:

```typescript
// Find existing person or create new one
const person = await client.people.findOrCreate({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  matchStrategy: 'fuzzy' // or 'exact'
});

// Just find existing person
const matcher = new PersonMatcher(client);
const match = await matcher.findMatch({
  firstName: 'John',
  lastName: 'Doe',
  matchStrategy: 'fuzzy'
});

if (match) {
  console.log(`Found person with ${match.confidence}% confidence`);
}
```

### Event System

Monitor API calls and errors with the built-in event system:

```typescript
// Listen to request events
client.on('request:start', (event) => {
  console.log(`Starting ${event.method} ${event.endpoint}`);
});

client.on('request:complete', (event) => {
  console.log(`Completed in ${event.duration}ms`);
});

// Listen to errors
client.on('error', (event) => {
  console.error('API Error:', event.error.message);
});

// Listen to rate limiting
client.on('rate:limit', (event) => {
  console.log(`Rate limit reached. Retry after ${event.retryAfter}ms`);
});
```

### Client Management

Use `PcoClientManager` for automatic client caching and lifecycle management:

```typescript
import { PcoClientManager } from '@rachelallyson/planning-center-people-ts';

const manager = new PcoClientManager();

// Get or create client for user
const client = await manager.getClient('user-id', {
  auth: {
    type: 'oauth',
    accessToken: userToken,
    refreshToken: userRefreshToken
  }
});

// Cleanup expired clients
await manager.cleanup();
```

### Working with Workflows

```typescript
// Get all workflows
const workflows = await client.workflows.getAll();

// Get workflow cards for a person
const cards = await client.workflows.getPersonWorkflowCards('person-id');

// Create a new workflow card
const card = await client.workflows.createWorkflowCard('person-id', 'workflow-id', {
  title: 'Follow up call',
  description: 'Call to discuss membership'
});

// Perform workflow actions
await client.workflows.promoteWorkflowCard('person-id', 'card-id');
await client.workflows.snoozeWorkflowCard('person-id', 'card-id', { duration: 7 });
await client.workflows.sendEmailWorkflowCard('person-id', 'card-id', {
  subject: 'Follow up',
  note: 'Thank you for your interest'
});
```

### Custom Fields

```typescript
// Get field definitions
const fieldDefs = await client.fields.getFieldDefinitions();

// Set field data with smart file upload handling
const fieldData = await client.fields.setPersonFieldById(
  'person-id',
  'field-def-id',
  '<a href="https://example.com/document.pdf" download>View File</a>'
);

// Get person's field data
const personFieldData = await client.fields.getPersonFieldData('person-id');
```

### Working with Lists

```typescript
// Get all lists
const lists = await client.lists.getAll();

// Get people in a list
const people = await client.lists.getPeople('list-id');

// Get list categories
const categories = await client.lists.getListCategories();

// Create list category
const category = await client.lists.createListCategory({
  name: 'New Category'
});
```

### Managing Notes

```typescript
// Get all notes
const notes = await client.notes.getAll();

// Get notes for a specific person
const personNotes = await client.notes.getAll({
  where: { person_id: 'person-id' }
});

// Create a note
const note = await client.notes.create({
  content: 'This is a note about the person',
  person_id: 'person-id',
  category_id: 'category-id'
});
```

## Error Handling

### Basic Error Handling

```typescript
import { PcoApiError } from '@rachelallyson/planning-center-people-ts';

try {
  const people = await client.people.getAll();
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
// Using the event system for error handling
client.on('error', (event) => {
  console.error('API Error:', {
    message: event.error.message,
    method: event.method,
    endpoint: event.endpoint,
    timestamp: event.timestamp
  });
  
  // Handle specific error types
  if (event.error instanceof PcoApiError) {
    switch (event.error.status) {
      case 401:
        console.log('Authentication failed - token may be expired');
        break;
      case 403:
        console.log('Insufficient permissions');
        break;
      case 429:
        console.log('Rate limit exceeded');
        break;
      default:
        console.log('Other API error');
    }
  }
});
```

### Retry Logic

```typescript
async function withRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retry
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Unexpected error in retry logic');
}

// Usage
const people = await withRetry(() => client.people.getAll());
```

## Performance Optimization

### Caching Strategy

```typescript
// Simple in-memory cache
const cache = new Map<string, { data: any; expires: number }>();

async function getCachedPeople(params: any = {}) {
  const cacheKey = `people:${JSON.stringify(params)}`;
  const cached = cache.get(cacheKey);
  
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }
  
  const people = await client.people.getAll(params);
  cache.set(cacheKey, {
    data: people,
    expires: Date.now() + 5 * 60 * 1000 // 5 minutes
  });
  
  return people;
}
```

### Batch Processing

```typescript
async function processPeopleInBatches(people: any[], batchSize = 10) {
  const results = [];
  
  for (let i = 0; i < people.length; i += batchSize) {
    const batch = people.slice(i, i + batchSize);
    
    const batchResults = await Promise.allSettled(
      batch.map(async (person) => {
        // Process each person
        return await client.people.update(person.id, { status: 'processed' });
      })
    );
    
    results.push(...batchResults);
  }
  
  return results;
}
```

### Rate Limit Management

```typescript
// Listen to rate limit events
client.on('rate:limit', (event) => {
  console.log(`Rate limit reached. Retry after ${event.retryAfter}ms`);
  
  // Implement your own rate limiting logic
  setTimeout(() => {
    console.log('Rate limit window reset, resuming operations');
  }, event.retryAfter);
});

// Configure client with conservative rate limits
const client = new PcoClient({
  auth: { type: 'personal_access_token', personalAccessToken: 'token' },
  rateLimit: {
    maxRequests: 80, // Leave headroom
    perMilliseconds: 60000
  }
});
```

## Best Practices

### 1. Use Appropriate Pagination

```typescript
// Good: Use reasonable page sizes
const people = await client.people.getAll({ perPage: 50 });

// Avoid: Very large page sizes
const people = await client.people.getAll({ perPage: 10000 }); // Too large
```

### 2. Include Only Necessary Data

```typescript
// Good: Include only what you need
const people = await client.people.getAll({ 
  include: ['emails'] // Only emails
});

// Avoid: Including everything
const people = await client.people.getAll({ 
  include: ['emails', 'phone_numbers', 'addresses', 'social_profiles', 'field_data'] // Too much
});
```

### 3. Handle Rate Limits Gracefully

```typescript
// Use the event system to handle rate limits
client.on('rate:limit', (event) => {
  // Implement exponential backoff
  const delay = Math.min(event.retryAfter * 1.5, 30000);
  setTimeout(() => {
    console.log('Resuming after rate limit');
  }, delay);
});
```

### 4. Use Person Matching to Avoid Duplicates

```typescript
// Always use findOrCreate for new people
const person = await client.people.findOrCreate({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  matchStrategy: 'fuzzy'
});
```

### 5. Implement Proper Error Handling

```typescript
// Use the event system for comprehensive error handling
client.on('error', (event) => {
  // Log errors
  console.error('API Error:', event.error.message);
  
  // Handle specific error types
  if (event.error instanceof PcoApiError) {
    switch (event.error.status) {
      case 401:
        // Handle authentication errors
        break;
      case 403:
        // Handle permission errors
        break;
      case 429:
        // Handle rate limiting
        break;
    }
  }
});
```

## Common Patterns

### 1. Data Export

```typescript
async function exportAllPeopleData() {
  const allPeople = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    const response = await client.people.getAll({
      perPage: 100,
      page,
      include: ['emails', 'phone_numbers', 'addresses']
    });
    
    allPeople.push(...response.data);
    hasMore = response.meta.next !== undefined;
    page++;
  }
  
  return allPeople;
}
```

### 2. Person Search and Filter

```typescript
async function searchPeople(searchTerm: string) {
  // Search by name
  const nameResults = await client.people.getAll({
    where: { first_name: searchTerm }
  });
  
  // Search by email
  const emailResults = await client.people.getAll({
    where: { email: searchTerm }
  });
  
  return {
    byName: nameResults.data,
    byEmail: emailResults.data
  };
}
```

### 3. Workflow Management

```typescript
async function manageWorkflowForPerson(personId: string, workflowId: string) {
  // Get existing workflow cards
  const existingCards = await client.workflows.getPersonWorkflowCards(personId);
  
  // Create new workflow card if none exist
  if (existingCards.data.length === 0) {
    const card = await client.workflows.createWorkflowCard(personId, workflowId, {
      title: 'Initial follow-up',
      description: 'Welcome new member'
    });
    
    // Add initial note
    await client.workflows.createWorkflowCardNote(personId, card.id, {
      note: 'Workflow started automatically'
    });
  }
}
```

### 4. Organization Statistics

```typescript
async function getOrganizationStats() {
  const [people, households, workflows] = await Promise.all([
    client.people.getAll({ perPage: 1 }),
    client.households.getAll({ perPage: 1 }),
    client.workflows.getAll({ perPage: 1 })
  ]);
  
  return {
    totalPeople: people.meta.total_count,
    totalHouseholds: households.meta.total_count,
    totalWorkflows: workflows.meta.total_count
  };
}
```

## Troubleshooting

### Common Issues

#### 1. Authentication Errors

```typescript
// Check your credentials
console.log('Personal Access Token:', !!process.env.PCO_PERSONAL_ACCESS_TOKEN);
console.log('OAuth Access Token:', !!process.env.PCO_ACCESS_TOKEN);
console.log('OAuth Refresh Token:', !!process.env.PCO_REFRESH_TOKEN);
```

#### 2. Rate Limit Errors

```typescript
// Handle rate limits with the event system
client.on('rate:limit', (event) => {
  console.log(`Rate limited. Retry after ${event.retryAfter}ms`);
  console.log(`Limit: ${event.limit}, Remaining: ${event.remaining}`);
});
```

#### 3. Network Timeouts

```typescript
// Configure timeout
const client = new PcoClient({
  auth: { type: 'personal_access_token', personalAccessToken: 'token' },
  timeout: 30000 // 30 seconds
});
```

#### 4. Large Dataset Handling

```typescript
// Stream large datasets
async function* streamAllPeople() {
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    const response = await client.people.getAll({
      perPage: 100,
      page
    });
    
    for (const person of response.data) {
      yield person;
    }
    
    hasMore = response.meta.next !== undefined;
    page++;
  }
}

// Usage
for await (const person of streamAllPeople()) {
  console.log(`Processing ${person.attributes.first_name} ${person.attributes.last_name}`);
}
```

### Debug Mode

```typescript
// Enable debug logging with the event system
client.on('request:start', (event) => {
  console.log(`[DEBUG] Starting ${event.method} ${event.endpoint}`);
});

client.on('request:complete', (event) => {
  console.log(`[DEBUG] Completed ${event.method} ${event.endpoint} in ${event.duration}ms`);
});

client.on('error', (event) => {
  console.error(`[DEBUG] Error in ${event.method} ${event.endpoint}:`, event.error.message);
});
```

### Error Reporting

```typescript
// Comprehensive error reporting
client.on('error', (event) => {
  const errorReport = {
    timestamp: event.timestamp,
    method: event.method,
    endpoint: event.endpoint,
    error: {
      message: event.error.message,
      stack: event.error.stack,
      ...(event.error instanceof PcoApiError && {
        status: event.error.status,
        errors: event.error.errors
      })
    }
  };
  
  console.error('Error report:', JSON.stringify(errorReport, null, 2));
});
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
const person: PersonResource = await client.people.getById('person-id');
const emails: EmailResource[] = person.relationships?.emails?.data || [];
```

This guide covers the essential patterns and best practices for using the PCO People API client v2.0.0 effectively. For more specific use cases, refer to the individual module documentation and examples.
