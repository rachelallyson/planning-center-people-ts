# Planning Center People TypeScript Client v2.0.0

A complete redesign of the Planning Center Online People API client with enhanced features, better developer experience, and comprehensive functionality.

## 🚀 What's New in v2.0.0

### ✨ **Complete API Redesign**

- **Class-based fluent API** instead of functional exports
- **Module-based architecture** with namespaced operations
- **Event-driven system** with comprehensive monitoring
- **Type-safe operations** throughout the entire API

### 🔧 **Core Features**

#### **1. Built-in Pagination Helper**

```typescript
// Get all people across all pages automatically
const allPeople = await client.people.getAllPages({ perPage: 100 });

// With progress tracking
const result = await client.people.getAllPages(
  { perPage: 50 },
  { 
    onProgress: (fetched, total) => 
      console.log(`Fetched ${fetched} of ${total} people`)
  }
);
```

#### **2. Automatic Client Caching**

```typescript
// Client manager handles caching and lifecycle automatically
const client = await PcoClientManager.getClient('church-id', config);

// Subsequent calls return the same cached instance
const sameClient = await PcoClientManager.getClient('church-id', config);
```

#### **3. Smart Person Matching**

```typescript
// Find existing person or create new one with fuzzy matching
const person = await client.people.findOrCreate(
  {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    matchStrategy: 'fuzzy'
  },
  {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    status: 'active'
  }
);
```

#### **4. Batch Operations**

```typescript
// Execute multiple operations with dependency resolution
const results = await client.batch.execute([
  { 
    id: 'create-person',
    type: 'create', 
    resourceType: 'Person', 
    endpoint: '/people', 
    data: { first_name: 'John', last_name: 'Doe' } 
  },
  { 
    id: 'add-email',
    type: 'create', 
    resourceType: 'Email', 
    endpoint: '/emails', 
    data: { address: 'john@example.com' },
    dependencies: ['create-person']
  }
]);
```

#### **5. Type-Safe Field Operations**

```typescript
// Automatic field definition lookup and type validation
await client.fields.setPersonFieldBySlug(
  personId, 
  'BIRTHDATE', 
  '1990-01-01'
);

// Or by field name
await client.fields.setPersonFieldByName(
  personId, 
  'Membership Status', 
  'Member'
);
```

#### **6. Enhanced Workflow Management**

```typescript
// Smart workflow operations with duplicate detection
const workflowCard = await client.workflows.addPersonToWorkflow(
  personId,
  workflowId,
  {
    note: 'Added from integration',
    skipIfExists: true,    // Skip if person already has a completed card
    skipIfActive: true     // Skip if person already has an active card
  }
);
```

#### **7. Comprehensive Event System**

```typescript
// Monitor all client activity
client.on('request:start', (event) => {
  console.log(`Starting ${event.method} ${event.endpoint}`);
});

client.on('request:complete', (event) => {
  console.log(`Completed in ${event.duration}ms with status ${event.status}`);
});

client.on('error', (event) => {
  console.error(`Error in ${event.operation}:`, event.error.message);
});

client.on('rate:limit', (event) => {
  console.warn(`Rate limit: ${event.remaining}/${event.limit} remaining`);
});
```

## 📖 **Quick Start**

### Installation

```bash
npm install @rachelallyson/planning-center-people-ts@latest
```

### Basic Usage

```typescript
import { PcoClient, PcoClientManager } from '@rachelallyson/planning-center-people-ts';

// Create a client
const client = new PcoClient({
  auth: {
    type: 'oauth',
    accessToken: 'your-access-token',
    refreshToken: 'your-refresh-token',
    onRefresh: (newTokens) => {
      // Save new tokens to your storage
      saveTokens(newTokens);
    }
  },
  events: {
    onError: (event) => console.error('PCO Error:', event.error),
    onAuthFailure: (event) => console.error('Auth failed:', event.error),
  }
});

// Or use the client manager for automatic caching
const client = await PcoClientManager.getClient('your-church-id', {
  auth: { type: 'oauth', accessToken: 'your-token' }
});
```

### Working with People

```typescript
// Get all people with pagination
const allPeople = await client.people.getAllPages({
  perPage: 100,
  include: ['emails', 'phone_numbers']
});

// Create a person
const person = await client.people.create({
  first_name: 'Jane',
  last_name: 'Smith',
  status: 'active'
});

// Add contact information
const email = await client.people.addEmail(person.id, {
  address: 'jane@example.com',
  primary: true
});

// Smart person matching
const foundOrCreated = await client.people.findOrCreate(
  { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
  { firstName: 'John', lastName: 'Doe', email: 'john@example.com' }
);
```

### Working with Fields

```typescript
// Get all field definitions (cached automatically)
const fieldDefs = await client.fields.getAllFieldDefinitions();

// Set person field by slug
await client.fields.setPersonFieldBySlug(
  personId, 
  'BIRTHDATE', 
  '1990-01-01'
);

// Set person field by name
await client.fields.setPersonFieldByName(
  personId, 
  'Membership Status', 
  'Member'
);
```

### Working with Workflows

```typescript
// Get all workflows
const workflows = await client.workflows.getAllPages();

// Add person to workflow with smart duplicate detection
const workflowCard = await client.workflows.addPersonToWorkflow(
  personId,
  workflowId,
  {
    note: 'Added from integration',
    skipIfExists: true,
    skipIfActive: true
  }
);

// Add a note to the workflow card
const note = await client.workflows.createWorkflowCardNote(
  personId,
  workflowCard.id,
  { note: 'Follow up needed' }
);
```

### Batch Operations

```typescript
// Execute multiple operations with dependencies
const results = await client.batch.execute([
  {
    id: 'create-person',
    type: 'create',
    resourceType: 'Person',
    endpoint: '/people',
    data: { first_name: 'John', last_name: 'Doe' }
  },
  {
    id: 'add-email',
    type: 'create',
    resourceType: 'Email',
    endpoint: '/emails',
    data: { address: 'john@example.com' },
    dependencies: ['create-person']
  }
], {
  continueOnError: true,
  maxConcurrency: 5
});

console.log(`Successfully executed ${results.successful} operations`);
```

## 🔄 **Migration from v1.x**

See the comprehensive [Migration Guide](docs/MIGRATION_V2.md) for detailed instructions on upgrading from v1.x to v2.0.0.

### Quick Migration Example

**v1.x (Old):**

```typescript
import { createPcoClient, getPeople, createPerson } from '@rachelallyson/planning-center-people-ts';

const client = createPcoClient({ accessToken: token });
const people = await getPeople(client, { per_page: 100 });
const person = await createPerson(client, data);
```

**v2.0 (New):**

```typescript
import { PcoClient } from '@rachelallyson/planning-center-people-ts';

const client = new PcoClient({ auth: { type: 'oauth', accessToken: token } });
const people = await client.people.getAll({ perPage: 100 });
const person = await client.people.create(data);
```

## 🏗️ **Architecture**

### Module Structure

- **`client.people`** - Person management and operations
- **`client.fields`** - Custom field operations with caching
- **`client.workflows`** - Workflow and workflow card management
- **`client.contacts`** - Email, phone, address, and social profile operations
- **`client.households`** - Household management
- **`client.notes`** - Note and note category operations
- **`client.lists`** - List and list category operations
- **`client.batch`** - Batch operation execution

### Event System

- **`request:start`** - HTTP request initiated
- **`request:complete`** - HTTP request completed
- **`error`** - Error occurred during operation
- **`auth:failure`** - Authentication failure
- **`rate:limit`** - Rate limit encountered

## 🧪 **Testing**

The library includes comprehensive testing utilities:

```typescript
import { createTestClient } from '@rachelallyson/planning-center-people-ts/testing';

const mockClient = createTestClient({
  people: {
    getAll: () => Promise.resolve({ data: [], meta: { total_count: 0 } }),
    create: (data) => Promise.resolve({ id: '123', ...data })
  }
});
```

## 📚 **Documentation**

- [Migration Guide](docs/MIGRATION_V2.md) - Complete v1.x to v2.0 migration
- [API Reference](docs/API_REFERENCE.md) - Detailed API documentation
- [Examples](examples/) - Comprehensive usage examples
- [Testing Guide](docs/TESTING.md) - Testing utilities and patterns

## 🤝 **Contributing**

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 **License**

MIT License - see [LICENSE](LICENSE) for details.

## 🆘 **Support**

- **Issues**: [GitHub Issues](https://github.com/rachelallyson/planning-center-people-ts/issues)
- **Discussions**: [GitHub Discussions](https://github.com/rachelallyson/planning-center-people-ts/discussions)
- **Documentation**: [Full Documentation](https://github.com/rachelallyson/planning-center-people-ts/tree/main/docs)

---

**v2.0.0** represents a complete redesign focused on developer experience, performance, and maintainability. The new API provides all the features you requested that would have made your migration significantly easier and more robust.
