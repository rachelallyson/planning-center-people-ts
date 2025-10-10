# Planning Center People TypeScript Library - v2.0.0

A modern, type-safe TypeScript library for interacting with the Planning Center Online People API. Built with a class-based architecture, comprehensive error handling, and advanced features like person matching and batch operations.

## 🚀 Features

- **🏗️ Class-Based Architecture**: Modern, intuitive API design
- **🔐 Multiple Authentication Methods**: Personal Access Token and OAuth 2.0 support
- **⚡ Advanced Features**: Person matching, batch operations, and workflow management
- **📊 Event System**: Comprehensive monitoring and debugging capabilities
- **🛡️ Type Safety**: Full TypeScript support with comprehensive type definitions
- **🔄 Automatic Token Refresh**: Built-in OAuth token refresh handling
- **📈 Rate Limiting**: Built-in rate limiting with configurable limits
- **🎯 Smart Person Matching**: Fuzzy matching to prevent duplicates
- **📝 Comprehensive Testing**: 334 tests (205 unit + 129 integration)

## 📦 Installation

```bash
npm install @rachelallyson/planning-center-people-ts
```

## 🚀 Quick Start

### Basic Setup

```typescript
import { PcoClient } from '@rachelallyson/planning-center-people-ts';

// Personal Access Token
const client = new PcoClient({
  auth: {
    type: 'personal_access_token',
    personalAccessToken: 'your-token'
  }
});

// OAuth 2.0
const client = new PcoClient({
  auth: {
    type: 'oauth',
    accessToken: 'your-access-token',
    refreshToken: 'your-refresh-token',
    onRefresh: async (tokens) => {
      // Save new tokens to your database
      await saveTokensToDatabase(userId, tokens);
    }
  }
});
```

### Basic Operations

```typescript
// Get all people
const people = await client.people.getAll({
  perPage: 50,
  include: ['emails', 'phone_numbers']
});

// Get specific person
const person = await client.people.getById('person-id', [
  'emails', 
  'phone_numbers', 
  'addresses'
]);

// Create person
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

// Smart person matching
const person = await client.people.findOrCreate({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  matchStrategy: 'fuzzy'
});
```

## 🏗️ Architecture

### Modular Design

The library is organized into focused modules:

- **`client.people`** - Person management and operations
- **`client.contacts`** - Email, phone, address, and social profile management
- **`client.workflows`** - Workflow and workflow card management
- **`client.fields`** - Custom field definitions and data
- **`client.households`** - Household management
- **`client.notes`** - Note management
- **`client.lists`** - List management
- **`client.organization`** - Organization information

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

## 🔐 Authentication

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
      await saveTokensToDatabase(userId, newTokens);
    },
    onRefreshFailure: async (error) => {
      console.error('Token refresh failed:', error.message);
      await clearUserTokens(userId);
    }
  }
});
```

## 🎯 Advanced Features

### Person Matching

Prevent duplicate people with intelligent matching:

```typescript
import { PersonMatcher } from '@rachelallyson/planning-center-people-ts';

const matcher = new PersonMatcher(client);

// Find existing person
const match = await matcher.findMatch({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  matchStrategy: 'fuzzy'
});

if (match) {
  console.log(`Found person with ${match.confidence}% confidence`);
}

// Find or create
const person = await matcher.findOrCreate({
  firstName: 'John',
  lastName: 'Doe',
  matchStrategy: 'fuzzy'
});
```

### Client Management

Use `PcoClientManager` for automatic client caching:

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
```

### Workflow Management

```typescript
// Get workflow cards for a person
const cards = await client.workflows.getPersonWorkflowCards('person-id');

// Create workflow card
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
```

## 🛡️ Error Handling

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

### Advanced Error Handling

```typescript
// Using the event system for comprehensive error handling
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
    }
  }
});
```

## 📊 Performance

### Caching

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
        return await client.people.update(person.id, { status: 'processed' });
      })
    );
    
    results.push(...batchResults);
  }
  
  return results;
}
```

## 🧪 Testing

The library includes comprehensive testing:

- **205 Unit Tests** - Testing individual components
- **129 Integration Tests** - Testing with real PCO API
- **Mock Support** - Built-in mocking utilities for testing

### Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run tests with coverage
npm run test:coverage
```

## 📚 Documentation

- **[API Reference](./API_REFERENCE.md)** - Complete method documentation
- **[API Usage Guide](./API_USAGE_GUIDE.md)** - Comprehensive usage patterns
- **[Authentication Guide](./AUTHENTICATION.md)** - Authentication setup
- **[Best Practices](./BEST_PRACTICES.md)** - Production best practices
- **[Examples](./EXAMPLES.md)** - Real-world examples
- **[Migration Guide](./MIGRATION_V2.md)** - Migrating from v1.x

## 🔄 Migration from v1.x

The v2.0.0 release includes breaking changes. See the [Migration Guide](./MIGRATION_V2.md) for detailed migration instructions.

### Quick Migration

**Before (v1.x):**

```typescript
import { createPcoClient, getPeople, createPerson } from '@rachelallyson/planning-center-people-ts';

const client = createPcoClient({
  personalAccessToken: 'your-token'
});

const people = await getPeople(client, { per_page: 10 });
const person = await createPerson(client, { first_name: 'John', last_name: 'Doe' });
```

**After (v2.0.0):**

```typescript
import { PcoClient } from '@rachelallyson/planning-center-people-ts';

const client = new PcoClient({
  auth: {
    type: 'personal_access_token',
    personalAccessToken: 'your-token'
  }
});

const people = await client.people.getAll({ perPage: 10 });
const person = await client.people.create({ first_name: 'John', last_name: 'Doe' });
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/rachelallyson/planning-center-people-ts.git

# Install dependencies
npm install

# Run tests
npm test

# Build the library
npm run build
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check our comprehensive [documentation](./docs/)
- **Issues**: [Open an issue](https://github.com/rachelallyson/planning-center-people-ts/issues) for bugs or feature requests
- **Discussions**: [Join the discussion](https://github.com/rachelallyson/planning-center-people-ts/discussions) for questions and ideas

## 🙏 Acknowledgments

- Planning Center Online for providing the excellent People API
- The TypeScript community for the amazing tooling
- All contributors who have helped make this library better

---

**Ready to get started?** Check out our [Quick Start Guide](./API_USAGE_GUIDE.md#getting-started) or browse the [Examples](./EXAMPLES.md) for real-world usage patterns.
