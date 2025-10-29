# Code Recipes & Examples

Copy-paste code snippets for common tasks. All examples use real imports from the package.

## Recipe 1: Find or Create Person

**Context**: You need to find an existing person or create a new one, preventing duplicates.

**Code**:

```typescript
import { PcoClient } from '@rachelallyson/planning-center-people-ts';

const client = new PcoClient({
  auth: {
    type: 'personal_access_token',
    personalAccessToken: 'your-token'
  }
});

const person = await client.people.findOrCreate({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '555-1234',
  matchStrategy: 'fuzzy', // or 'exact'
  createIfNotFound: true
});

console.log(`Person ID: ${person.id}`);
console.log(`Match found: ${person.match?.found}`);
```

**Expected Result**:

```typescript
{
  id: 'person-123',
  attributes: { first_name: 'John', last_name: 'Doe' },
  match: {
    found: true,
    score: 0.95,
    reason: 'Exact email match'
  }
}
```

## Recipe 2: Create Person with Contacts

**Context**: Create a person and immediately add email and phone contacts.

**Code**:

```typescript
import { PcoClient } from '@rachelallyson/planning-center-people-ts';

const client = new PcoClient({
  auth: {
    type: 'personal_access_token',
    personalAccessToken: 'your-token'
  }
});

// Method 1: Using createWithContacts
const person = await client.people.createWithContacts(
  {
    first_name: 'Jane',
    last_name: 'Smith'
  },
  {
    email: {
      address: 'jane@example.com',
      location: 'Home',
      primary: true
    },
    phone: {
      number: '555-5678',
      location: 'Home',
      primary: true
    }
  }
);

// Method 2: Create then add contacts
const person2 = await client.people.create({
  first_name: 'Bob',
  last_name: 'Wilson'
});

await client.contacts.createEmail(person2.id, {
  address: 'bob@example.com',
  location: 'Home',
  primary: true
});

await client.contacts.createPhone(person2.id, {
  number: '555-9999',
  location: 'Home',
  primary: true
});
```

**Expected Result**:

```typescript
{
  id: 'person-456',
  attributes: { first_name: 'Jane', last_name: 'Smith' },
  relationships: {
    emails: { data: [{ type: 'Email', id: 'email-789' }] },
    phone_numbers: { data: [{ type: 'PhoneNumber', id: 'phone-012' }] }
  }
}
```

## Recipe 3: Set Custom Fields

**Context**: Set custom field values for a person (by slug or name).

**Code**:

```typescript
import { PcoClient } from '@rachelallyson/planning-center-people-ts';

const client = new PcoClient({
  auth: {
    type: 'personal_access_token',
    personalAccessToken: 'your-token'
  },
  caching: {
    fieldDefinitions: true // Cache field definitions for performance
  }
});

const personId = 'person-123';

// Set field by slug (fastest, uses cached field definitions)
await client.fields.setPersonFieldBySlug(personId, 'BIRTHDATE', '1990-01-01');

// Set field by name (looks up field definition)
await client.fields.setPersonFieldByName(personId, 'Membership Status', 'Member');

// Set field with options
await client.fields.setPersonField(personId, {
  fieldSlug: 'CUSTOM_FIELD',
  value: 'Some value',
  handleFileUploads: true // Automatically handles file uploads
});
```

**Expected Result**: Field data created successfully (no return value for mutations).

## Recipe 4: Batch Operations

**Context**: Execute multiple operations efficiently with dependency resolution.

**Code**:

```typescript
import { PcoClient } from '@rachelallyson/planning-center-people-ts';

const client = new PcoClient({
  auth: {
    type: 'personal_access_token',
    personalAccessToken: 'your-token'
  }
});

const results = await client.batch.execute([
  // Step 0: Create person
  {
    type: 'people.create',
    data: {
      firstName: 'John',
      lastName: 'Doe'
    }
  },
  // Step 1: Add email (references person from step 0)
  {
    type: 'people.addEmail',
    personId: '$0.id', // Reference step 0 result
    data: {
      address: 'john@example.com',
      location: 'Home',
      primary: true
    }
  },
  // Step 2: Add phone (references person from step 0)
  {
    type: 'people.addPhone',
    personId: '$0.id',
    data: {
      number: '555-1234',
      location: 'Home',
      primary: true
    }
  },
  // Step 3: Set field (references person from step 0)
  {
    type: 'fields.setPersonField',
    personId: '$0.id',
    data: {
      fieldSlug: 'BIRTHDATE',
      value: '1990-01-01'
    }
  }
]);

console.log(`Success: ${results.successful.length}`);
console.log(`Failed: ${results.failed.length}`);
console.log(`Success rate: ${(results.successRate * 100).toFixed(1)}%`);

// Access individual results
results.successful.forEach((result, index) => {
  console.log(`Step ${index} succeeded:`, result.data);
});

results.failed.forEach((result, index) => {
  console.error(`Step ${index} failed:`, result.error);
});
```

**Expected Result**:

```typescript
{
  successful: [
    { data: { id: 'person-123', ... } },
    { data: { id: 'email-456', ... } },
    { data: { id: 'phone-789', ... } },
    { data: { id: 'field-datum-012', ... } }
  ],
  failed: [],
  successRate: 1.0,
  summary: {
    total: 4,
    successful: 4,
    failed: 0
  }
}
```

## Recipe 5: Paginate All People

**Context**: Fetch all people across multiple pages.

**Code**:

```typescript
import { PcoClient } from '@rachelallyson/planning-center-people-ts';

const client = new PcoClient({
  auth: {
    type: 'personal_access_token',
    personalAccessToken: 'your-token'
  }
});

// Method 1: Automatic pagination (recommended)
const allPeople = await client.people.getAllPages({
  perPage: 100, // Max 100 per page
  include: ['emails', 'phone_numbers']
});

console.log(`Total people: ${allPeople.data.length}`);
console.log(`Total pages: ${allPeople.meta?.total_pages}`);

// Method 2: Manual pagination
let page = 1;
let hasMore = true;
const people: any[] = [];

while (hasMore) {
  const response = await client.people.getAll({
    perPage: 100,
    page: page,
    include: ['emails']
  });

  people.push(...response.data);
  hasMore = response.links?.next !== undefined && response.links?.next !== null;
  page++;

  console.log(`Fetched page ${page - 1}`);
}
```

**Expected Result**: Array of all people across all pages.

## Recipe 6: Add Person to Workflow

**Context**: Add a person to a workflow with duplicate detection.

**Code**:

```typescript
import { PcoClient } from '@rachelallyson/planning-center-people-ts';

const client = new PcoClient({
  auth: {
    type: 'personal_access_token',
    personalAccessToken: 'your-token'
  }
});

const personId = 'person-123';
const workflowId = 'workflow-456';

// Add to workflow with duplicate detection
const workflowCard = await client.workflows.addPersonToWorkflow(
  personId,
  workflowId,
  {
    note: 'Added from integration',
    skipIfExists: true,  // Don't add if already completed/removed
    skipIfActive: true    // Don't add if already active
  }
);

console.log(`Workflow card ID: ${workflowCard.id}`);
```

**Expected Result**:

```typescript
{
  id: 'workflow-card-789',
  attributes: {
    status: 'active',
    created_at: '2025-01-11T12:00:00.000Z'
  },
  relationships: {
    person: { data: { type: 'Person', id: 'person-123' } },
    workflow: { data: { type: 'Workflow', id: 'workflow-456' } }
  }
}
```

## Recipe 7: OAuth Token Refresh

**Context**: Handle OAuth token refresh automatically.

**Code**:

```typescript
import { PcoClient } from '@rachelallyson/planning-center-people-ts';

// Store tokens in database
async function saveTokens(userId: string, tokens: { accessToken: string; refreshToken: string }) {
  await db.users.update(userId, {
    pcoAccessToken: tokens.accessToken,
    pcoRefreshToken: tokens.refreshToken
  });
}

async function getTokens(userId: string) {
  const user = await db.users.findById(userId);
  return {
    accessToken: user.pcoAccessToken,
    refreshToken: user.pcoRefreshToken
  };
}

// Create client with refresh handling
const userId = 'user-123';
const tokens = await getTokens(userId);

const client = new PcoClient({
  auth: {
    type: 'oauth',
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    // REQUIRED: Save refreshed tokens
    onRefresh: async (newTokens) => {
      await saveTokens(userId, newTokens);
      console.log('Tokens refreshed and saved');
    },
    // REQUIRED: Handle refresh failures
    onRefreshFailure: async (error) => {
      console.error('Token refresh failed:', error);
      // Redirect to login or notify user
      await redirectToLogin(userId);
    }
  }
});

// Use client - token refresh happens automatically
const people = await client.people.getAll();
```

**Expected Result**: Tokens automatically refreshed and saved when expired.

## Recipe 8: Search People

**Context**: Search for people by name, email, or phone.

**Code**:

```typescript
import { PcoClient } from '@rachelallyson/planning-center-people-ts';
import { searchPeople } from '@rachelallyson/planning-center-people-ts';

const client = new PcoClient({
  auth: {
    type: 'personal_access_token',
    personalAccessToken: 'your-token'
  }
});

// Search by name
const results = await searchPeople(client, {
  query: 'John Doe',
  include: ['emails', 'phone_numbers']
});

// Search by email
const emailResults = await searchPeople(client, {
  email: 'john@example.com'
});

// Search by phone
const phoneResults = await searchPeople(client, {
  phone: '555-1234'
});

console.log(`Found ${results.length} matches`);
results.forEach(person => {
  console.log(`${person.attributes.first_name} ${person.attributes.last_name}`);
});
```

**Expected Result**: Array of matching people.

## Recipe 9: Export All People Data

**Context**: Export all people with related data to CSV or JSON.

**Code**:

```typescript
import { PcoClient } from '@rachelallyson/planning-center-people-ts';
import { exportAllPeopleData } from '@rachelallyson/planning-center-people-ts';

const client = new PcoClient({
  auth: {
    type: 'personal_access_token',
    personalAccessToken: 'your-token'
  }
});

// Export all people with related data
const exportedData = await exportAllPeopleData(client, {
  include: ['emails', 'phone_numbers', 'addresses', 'field_data'],
  perPage: 100
});

// Convert to CSV
function toCSV(data: any[]) {
  const headers = ['ID', 'First Name', 'Last Name', 'Email', 'Phone'];
  const rows = data.map(person => [
    person.id,
    person.attributes.first_name,
    person.attributes.last_name,
    person.relationships.emails?.data[0]?.attributes?.address || '',
    person.relationships.phone_numbers?.data[0]?.attributes?.number || ''
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
}

const csv = toCSV(exportedData);
console.log(csv);

// Or export to JSON
const json = JSON.stringify(exportedData, null, 2);
fs.writeFileSync('people-export.json', json);
```

**Expected Result**: CSV or JSON file with all people data.

## Recipe 10: Event Monitoring

**Context**: Monitor requests, errors, and rate limits using the event system.

**Code**:

```typescript
import { PcoClient } from '@rachelallyson/planning-center-people-ts';

const client = new PcoClient({
  auth: {
    type: 'personal_access_token',
    personalAccessToken: 'your-token'
  }
});

// Listen to request events
client.on('request:start', (event) => {
  console.log(`[${event.timestamp}] Starting: ${event.method} ${event.endpoint}`);
  console.log(`Request ID: ${event.requestId}`);
});

client.on('request:complete', (event) => {
  console.log(`[${event.timestamp}] Completed: ${event.status} in ${event.duration}ms`);
  console.log(`Request ID: ${event.requestId}`);
});

client.on('error', (event) => {
  console.error(`[${event.timestamp}] Error in ${event.operation}:`, event.error);
  console.error(`Context:`, event.context);
});

client.on('rate:limit', (event) => {
  console.warn(`[${event.timestamp}] Rate limit: ${event.remaining}/${event.limit} remaining`);
  console.warn(`Resets at: ${event.resetTime}`);
  
  if (event.remaining < 10) {
    console.warn('⚠️  Rate limit is low!');
  }
});

// Use client - events are emitted automatically
const people = await client.people.getAll();

// Get performance metrics
const metrics = client.getPerformanceMetrics();
console.log('Average response time:', metrics.averageResponseTime, 'ms');
console.log('Success rate:', (metrics.successRate * 100).toFixed(1), '%');

// Get rate limit info
const rateLimitInfo = client.getRateLimitInfo();
console.log('Requests remaining:', rateLimitInfo.remaining);
console.log('Window resets in:', rateLimitInfo.windowResetsIn, 'ms');
```

**Expected Result**: Console output showing all request events and metrics.

**More Examples**: See `examples/` directory in the repository for additional examples.
