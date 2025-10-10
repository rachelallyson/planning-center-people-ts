# Migration Guide: v1.x to v2.0.0

This guide helps you migrate from the v1.x functional API to the v2.0.0 class-based fluent API.

## Breaking Changes

### 1. Client Creation

**v1.x:**

```typescript
import { createPcoClient, getPeople, createPerson } from '@rachelallyson/planning-center-people-ts';

const client = createPcoClient({
  accessToken: 'your-token',
  appId: 'your-app-id',
  appSecret: 'your-app-secret',
});

const people = await getPeople(client, { per_page: 100 });
const person = await createPerson(client, { first_name: 'John', last_name: 'Doe' });
```

**v2.0:**

```typescript
import { PcoClient } from '@rachelallyson/planning-center-people-ts';

const client = new PcoClient({
  auth: {
    type: 'oauth',
    accessToken: 'your-token',
    // Or for basic auth:
    // type: 'basic',
    // appId: 'your-app-id',
    // appSecret: 'your-app-secret',
  },
});

const people = await client.people.getAll({ perPage: 100 });
const person = await client.people.create({ firstName: 'John', lastName: 'Doe' });
```

### 2. Pagination

**v1.x:**

```typescript
import { getAllPages } from '@rachelallyson/planning-center-people-ts';

const allPeople = await getAllPages(client, '/people', { per_page: 100 });
```

**v2.0:**

```typescript
const allPeople = await client.people.getAllPages({
  where: { status: 'active' },
  include: ['emails'],
}, {
  perPage: 100,
  onProgress: (current, total) => {
    console.log(`Progress: ${current}/${total}`);
  },
});
```

### 3. People Operations

**v1.x:**

```typescript
import { 
  getPeople, 
  getPerson, 
  createPerson, 
  updatePerson, 
  deletePerson,
  createPersonEmail,
  createPersonPhoneNumber,
} from '@rachelallyson/planning-center-people-ts';

const people = await getPeople(client, { per_page: 25 });
const person = await getPerson(client, 'person-id', ['emails']);
const newPerson = await createPerson(client, { first_name: 'John' });
const updatedPerson = await updatePerson(client, 'person-id', { last_name: 'Smith' });
await deletePerson(client, 'person-id');

const email = await createPersonEmail(client, 'person-id', { address: 'john@example.com' });
const phone = await createPersonPhoneNumber(client, 'person-id', { number: '555-1234' });
```

**v2.0:**

```typescript
const people = await client.people.getAll({ perPage: 25 });
const person = await client.people.getById('person-id', ['emails']);
const newPerson = await client.people.create({ firstName: 'John' });
const updatedPerson = await client.people.update('person-id', { lastName: 'Smith' });
await client.people.delete('person-id');

const email = await client.people.addEmail('person-id', { address: 'john@example.com' });
const phone = await client.people.addPhoneNumber('person-id', { number: '555-1234' });
```

### 4. Field Operations

**v1.x:**

```typescript
import { 
  getFieldDefinitions, 
  createPersonFieldData,
  getPersonFieldData,
} from '@rachelallyson/planning-center-people-ts';

const fieldDefs = await getFieldDefinitions(client);
const fieldData = await createPersonFieldData(client, 'person-id', 'field-id', 'value');
const personFields = await getPersonFieldData(client, 'person-id');
```

**v2.0:**

```typescript
const fieldDefs = await client.fields.getAllFieldDefinitions();
const fieldData = await client.fields.setPersonFieldById('person-id', 'field-id', 'value');

// Or use type-safe field setters:
await client.fields.setPersonFieldBySlug('person-id', 'BIRTHDATE', '1990-01-01');
await client.fields.setPersonFieldByName('person-id', 'Membership Status', 'Member');

const personFields = await client.fields.getPersonFieldData('person-id');
```

### 5. Workflow Operations

**v1.x:**

```typescript
import { 
  getWorkflows, 
  createWorkflowCard,
  createWorkflowCardNote,
} from '@rachelallyson/planning-center-people-ts';

const workflows = await getWorkflows(client);
const card = await createWorkflowCard(client, 'workflow-id', 'person-id');
const note = await createWorkflowCardNote(client, 'person-id', 'card-id', { note: 'Hello' });
```

**v2.0:**

```typescript
const workflows = await client.workflows.getAll();
const card = await client.workflows.createWorkflowCard('workflow-id', 'person-id');
const note = await client.workflows.createWorkflowCardNote('person-id', 'card-id', { note: 'Hello' });

// Or use smart workflow operations:
const smartCard = await client.workflows.addPersonToWorkflow('person-id', 'workflow-id', {
  note: 'Added from integration',
  skipIfExists: true, // Don't add if already completed/removed
  skipIfActive: true, // Don't add if already active
});
```

### 6. Error Handling

**v1.x:**

```typescript
import { PcoApiError } from '@rachelallyson/planning-center-people-ts';

try {
  await createPerson(client, data);
} catch (error) {
  if (error instanceof PcoApiError) {
    console.error('API Error:', error.status, error.message);
  }
}
```

**v2.0:**

```typescript
import { PcoApiError } from '@rachelallyson/planning-center-people-ts';

// Option 1: Traditional try/catch
try {
  await client.people.create(data);
} catch (error) {
  if (error instanceof PcoApiError) {
    console.error('API Error:', error.status, error.message);
  }
}

// Option 2: Event-based error handling
client.on('error', (event) => {
  console.error('Error in', event.operation, ':', event.error);
});

client.on('auth:failure', (event) => {
  console.error('Authentication failed:', event.error);
});
```

## New Features in v2.0

### 1. Smart Person Matching

```typescript
// Find or create a person with intelligent matching
const person = await client.people.findOrCreate({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '555-1234',
  matchStrategy: 'fuzzy', // 'exact' | 'fuzzy' | 'aggressive'
  createIfNotFound: true,
});
```

### 2. Batch Operations

```typescript
const results = await client.batch.execute([
  {
    type: 'people.create',
    data: { firstName: 'John', lastName: 'Doe' },
  },
  {
    type: 'people.addEmail',
    personId: '$0.id', // Reference the person created in step 0
    data: { address: 'john@example.com', primary: true },
  },
  {
    type: 'people.addPhone',
    personId: '$0.id',
    data: { number: '555-1234', primary: true },
  },
]);

console.log(`Success rate: ${(results.successRate * 100).toFixed(1)}%`);
```

### 3. Client Manager with Caching

```typescript
import { PcoClientManager } from '@rachelallyson/planning-center-people-ts';

// Automatic client caching
const client = PcoClientManager.getClient({
  auth: { type: 'oauth', accessToken: 'token' },
});

// Multi-tenant support
const churchClient = await PcoClientManager.getClientForChurch(
  'church-123',
  async (churchId) => {
    return {
      auth: {
        type: 'oauth',
        accessToken: await getAccessTokenForChurch(churchId),
      },
    };
  }
);
```

### 4. Enhanced Event Monitoring

```typescript
client.on('request:start', (event) => {
  console.log(`Starting: ${event.method} ${event.endpoint}`);
});

client.on('request:complete', (event) => {
  console.log(`Completed: ${event.status} in ${event.duration}ms`);
});

client.on('rate:limit', (event) => {
  console.warn(`Rate limited: ${event.remaining}/${event.limit}`);
});

// Get performance metrics
const metrics = client.getPerformanceMetrics();
console.log('Average response time:', metrics['GET /people']?.averageTime);
```

### 5. Type-Safe Field Operations

```typescript
// Automatic field definition lookup and validation
await client.fields.setPersonFieldBySlug('person-id', 'BIRTHDATE', '1990-01-01');
await client.fields.setPersonFieldByName('person-id', 'Membership Status', 'Member');

// With automatic file upload handling
await client.fields.setPersonField('person-id', {
  fieldSlug: 'DOCUMENT',
  value: '<a href="https://example.com/file.pdf">Document</a>',
  handleFileUploads: true,
});
```

## Migration Checklist

- [ ] Update client creation to use `new PcoClient()`
- [ ] Replace functional imports with client method calls
- [ ] Update parameter names (e.g., `per_page` → `perPage`, `first_name` → `firstName`)
- [ ] Replace `getAllPages()` calls with module-specific methods
- [ ] Update error handling to use event system (optional)
- [ ] Add event listeners for monitoring (optional)
- [ ] Implement client caching with `PcoClientManager` (optional)
- [ ] Use smart person matching for better duplicate handling (optional)
- [ ] Implement batch operations for better performance (optional)

## Backward Compatibility

v2.0.0 maintains backward compatibility by exporting all v1.x functions alongside the new API. However, we recommend migrating to the new API for better performance, type safety, and features.

**Mixed usage (temporary):**

```typescript
import { PcoClient, getPeople, createPerson } from '@rachelallyson/planning-center-people-ts';

const client = new PcoClient({ auth: { type: 'oauth', accessToken: 'token' } });

// New API
const people = await client.people.getAll();

// Old API (still works)
const oldPeople = await getPeople(client as any, { per_page: 100 });
```

## Performance Improvements

v2.0.0 includes several performance improvements:

1. **Automatic caching** of field definitions and other frequently accessed data
2. **Batch operations** for multiple API calls
3. **Smart pagination** with progress tracking
4. **Connection pooling** through client manager
5. **Optimized retry logic** with exponential backoff

## Support

If you encounter issues during migration:

1. Check the [examples](./examples/v2-basic-usage.ts) for common patterns
2. Review the [API documentation](./API_REFERENCE.md)
3. Open an issue on GitHub with your migration questions

The v1.x API will continue to be supported for at least 6 months after v2.0.0 release to allow for gradual migration.
