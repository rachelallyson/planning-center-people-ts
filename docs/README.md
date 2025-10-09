# Planning Center People TypeScript Library Documentation

Welcome to the comprehensive documentation for the `@rachelallyson/planning-center-people-ts` library. This documentation covers everything you need to know to effectively use this library in your applications.

## 📚 Documentation Overview

### 🚀 Getting Started

- **[Overview](./OVERVIEW.md)** - What this library does and why you should use it
- **[Installation Guide](./INSTALLATION.md)** - Complete setup instructions for all environments
- **[Authentication Guide](./AUTHENTICATION.md)** - All authentication methods and token management

### 📖 Reference & Usage

- **[API Reference](./API_REFERENCE.md)** - Complete reference for all 40+ functions
- **[Examples & Usage Patterns](./EXAMPLES.md)** - Real-world examples and common patterns
- **[Error Handling Guide](./ERROR_HANDLING.md)** - Advanced error management and recovery

### ⚡ Performance & Production

- **[Performance Guide](./PERFORMANCE.md)** - Optimization techniques and bulk operations
- **[Best Practices](./BEST_PRACTICES.md)** - Production-ready patterns and security
- **[Troubleshooting Guide](./TROUBLESHOOTING.md)** - Common issues and solutions

### 🔄 Migration & Updates

- **[Migration Guide](./MIGRATION.md)** - Switching from other libraries

## 🎯 Quick Start

### Installation

```bash
npm install @rachelallyson/planning-center-people-ts
```

### Basic Usage

```typescript
import { createPcoClient, getPeople, createPerson } from '@rachelallyson/planning-center-people-ts';

// Create client
const client = createPcoClient({
  appId: 'your-app-id',
  appSecret: 'your-app-secret',
  personalAccessToken: 'your-token'
});

// Get people
const people = await getPeople(client, { per_page: 50 });

// Create person
const person = await createPerson(client, {
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com'
});
```

## 🌟 Key Features

### ✅ **Strict TypeScript Support**

- Zero `any` types - full type safety
- IntelliSense support in your IDE
- Compile-time error checking

### ✅ **Modern Functional Architecture**

- Clean, composable functions
- No classes or state management
- Tree-shakable imports

### ✅ **Production-Ready Features**

- Built-in rate limiting (100 req/min)
- Automatic retries with exponential backoff
- Comprehensive error handling
- OAuth 2.0 token refresh

### ✅ **Zero Dependencies**

- Uses native fetch API
- No external libraries required
- Works in Node.js 18+, browsers, and Deno

## 📋 What You Can Do

### 👥 **People Management**

- Create, read, update, and delete people
- Manage contact information (emails, phones, addresses)
- Handle custom field data and file uploads
- Organize people into households and lists

### 📋 **Workflow Management**

- Create and manage workflow cards
- Add notes and comments
- Track workflow progress
- Organize by categories

### 🏠 **Household & List Management**

- Group people into households
- Create custom lists and categories
- Export household and list data

### 📊 **Custom Fields & Data**

- Create custom field definitions
- Manage field options and validation
- Handle file uploads intelligently
- Store and retrieve custom data

## 🛠️ Common Use Cases

### Church Management Systems

```typescript
// New member onboarding
const person = await createPerson(client, {
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com'
});

// Add contact information
await createPersonPhoneNumber(client, person.data!.id, {
  number: '+1-555-123-4567',
  location: 'mobile',
  primary: true
});

// Create follow-up workflow
await createWorkflowCard(client, {
  title: 'Welcome John!',
  description: 'New member follow-up process',
  workflow_id: 'new-member-workflow-id',
  person_id: person.data!.id
});
```

### Data Import/Export

```typescript
// Export all people data
const allPeople = await getAllPages(client, '/people');
const csvData = convertToCSV(allPeople);

// Import people from CSV
const importResults = await importPeopleFromCSV(csvData);
```

### Batch Operations

```typescript
// Process large datasets efficiently
const results = await processInBatches(
  personIds,
  10, // Process 10 at a time
  async (batch) => {
    await Promise.all(batch.map(id => getPerson(client, id)));
    await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
  }
);
```

## 🔧 Error Handling

### Comprehensive Error Management

```typescript
import { PcoError, ErrorCategory } from '@rachelallyson/planning-center-people-ts';

try {
  const people = await getPeople(client);
} catch (error) {
  if (error instanceof PcoError) {
    switch (error.category) {
      case ErrorCategory.AUTHENTICATION:
        console.error('Authentication failed - check your credentials');
        break;
      case ErrorCategory.RATE_LIMIT:
        console.error('Rate limited - retry after:', error.getRetryDelay(), 'ms');
        break;
      case ErrorCategory.VALIDATION:
        console.error('Validation error - check your request data');
        break;
    }
  }
}
```

### Automatic Retry Logic

```typescript
import { retryWithBackoff } from '@rachelallyson/planning-center-people-ts';

const result = await retryWithBackoff(
  () => getPerson(client, 'person-id'),
  {
    maxRetries: 3,
    baseDelay: 1000,
    context: { endpoint: '/people/person-id', method: 'GET' }
  }
);
```

## ⚡ Performance Optimization

### Caching

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

### Streaming Large Datasets

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

## 🔐 Security Best Practices

### Environment Variables

```bash
# .env (never commit to version control)
PCO_APP_ID=your_app_id_here
PCO_APP_SECRET=your_app_secret_here
PCO_PERSONAL_ACCESS_TOKEN=your_token_here
```

### Token Encryption

```typescript
// Encrypt tokens in database
function encryptToken(token: string): string {
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}
```

## 🧪 Testing

### Unit Tests

```typescript
import { createPcoClient, getPeople } from '@rachelallyson/planning-center-people-ts';

describe('People API', () => {
  let client: PcoClientState;
  
  beforeEach(() => {
    client = createPcoClient({
      appId: 'test-app-id',
      appSecret: 'test-app-secret',
      personalAccessToken: 'test-token'
    });
  });
  
  it('should get people', async () => {
    const people = await getPeople(client, { per_page: 10 });
    expect(people.data).toBeDefined();
  });
});
```

### Integration Tests

```typescript
// Test against real PCO API
const client = createPcoClient({
  appId: process.env.PCO_APP_ID!,
  appSecret: process.env.PCO_APP_SECRET!,
  personalAccessToken: process.env.PCO_PERSONAL_ACCESS_TOKEN!
});

const people = await getPeople(client);
expect(people.data.length).toBeGreaterThan(0);
```

## 📊 Monitoring & Observability

### Performance Monitoring

```typescript
import { monitorPerformance } from '@rachelallyson/planning-center-people-ts';

const result = await monitorPerformance(
  () => getPeople(client),
  {
    operation: 'get_people',
    metadata: { batch_size: 100 }
  }
);
```

### Error Tracking

```typescript
import { PcoError, ErrorCategory } from '@rachelallyson/planning-center-people-ts';

try {
  const people = await getPeople(client);
} catch (error) {
  if (error instanceof PcoError) {
    // Log to your monitoring service
    logger.error('PCO API Error', {
      category: error.category,
      severity: error.severity,
      status: error.status,
      retryable: error.retryable
    });
  }
}
```

## 🚀 Deployment

### Production Configuration

```typescript
const client = createPcoClient({
  appId: process.env.PCO_APP_ID!,
  appSecret: process.env.PCO_APP_SECRET!,
  personalAccessToken: process.env.PCO_PERSONAL_ACCESS_TOKEN!,
  
  // Production optimizations
  timeout: 30000,
  rateLimit: {
    maxRequests: 90, // Leave headroom
    perMilliseconds: 60000
  },
  
  retry: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000
  }
});
```

### Health Checks

```typescript
export async function healthCheck(req: Request, res: Response) {
  try {
    await getOrganization(client);
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', error: error.message });
  }
}
```

## 🔄 Migration

### From Other Libraries

```typescript
// Old way (class-based)
const client = new OldPcoClient(config);
const people = await client.getPeople();

// New way (functional)
const client = createPcoClient(config);
const people = await getPeople(client);
```

### From Raw API Calls

```typescript
// Old way (manual fetch)
const response = await fetch('https://api.planningcenteronline.com/people/v2/people', {
  headers: { 'Authorization': 'Bearer token' }
});

// New way (library)
const people = await getPeople(client);
```

## 📞 Support & Community

### Getting Help

- **Documentation**: Check the guides above for your specific use case
- **GitHub Issues**: [Report bugs or request features](https://github.com/rachelallyson/planning-center-people-ts/issues)
- **GitHub Discussions**: Ask questions and share experiences

### Resources

- **Planning Center API Docs**: [Official PCO API documentation](https://developer.planningcenteronline.com/)
- **TypeScript Handbook**: [TypeScript documentation](https://www.typescriptlang.org/docs/)

## 📄 License

MIT License - see [LICENSE](../LICENSE) for details.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](../CONTRIBUTING.md) for details.

---

*This documentation is comprehensive and covers all aspects of using the Planning Center People TypeScript library. Start with the [Overview](./OVERVIEW.md) to understand what the library does, then follow the [Installation Guide](./INSTALLATION.md) to get started.*
