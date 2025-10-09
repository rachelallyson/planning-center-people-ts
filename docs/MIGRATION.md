# Migration Guide

This guide helps you migrate from other Planning Center libraries or approaches to the `@rachelallyson/planning-center-people-ts` library.

## Table of Contents

1. [Migration Overview](#migration-overview)
2. [From Official PCO SDKs](#from-official-pco-sdks)
3. [From Raw API Calls](#from-raw-api-calls)
4. [From Other PCO Libraries](#from-other-pco-libraries)
5. [From Class-Based Approaches](#from-class-based-approaches)
6. [From JavaScript to TypeScript](#from-javascript-to-typescript)
7. [Migration Checklist](#migration-checklist)
8. [Common Migration Issues](#common-migration-issues)

## Migration Overview

### Why Migrate?

The `@rachelallyson/planning-center-people-ts` library offers several advantages:

- **Better TypeScript Support**: Full type safety with no `any` types
- **Modern Architecture**: Functional approach instead of classes
- **Enhanced Error Handling**: Categorized errors with retry logic
- **No External Dependencies**: Uses native fetch API
- **Better Performance**: Built-in rate limiting and optimization
- **Active Maintenance**: Regular updates and bug fixes

### Migration Benefits

| Feature | Old Approach | New Library |
|---------|--------------|-------------|
| Type Safety | Partial or none | Full TypeScript support |
| Error Handling | Basic HTTP errors | Categorized errors with retry |
| Rate Limiting | Manual implementation | Automatic with smart backoff |
| Dependencies | External libraries | Zero dependencies |
| Architecture | Class-based | Functional |
| Maintenance | Varies | Active development |

## From Official PCO SDKs

### Planning Center Official SDK

**Before (Official SDK):**

```javascript
// Official PCO SDK (if available)
const PcoApi = require('@planningcenter/api');
const api = new PcoApi({
  applicationId: 'your-app-id',
  secret: 'your-app-secret'
});

// Get people
api.people.list().then(people => {
  console.log(people.data);
});

// Create person
api.people.create({
  first_name: 'John',
  last_name: 'Doe'
}).then(person => {
  console.log(person.data);
});
```

**After (This Library):**

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
console.log(people.data);

// Create person
const person = await createPerson(client, {
  first_name: 'John',
  last_name: 'Doe'
});
console.log(person.data);
```

### Key Differences

1. **Functional vs Class-based**: Use functions instead of class methods
2. **TypeScript Support**: Full type safety and IntelliSense
3. **Error Handling**: Better error categorization and retry logic
4. **Configuration**: Simpler client configuration

## From Raw API Calls

### Using Fetch Directly

**Before (Raw Fetch):**

```javascript
// Raw API calls with fetch
async function getPeople() {
  const response = await fetch('https://api.planningcenteronline.com/people/v2/people', {
    headers: {
      'Authorization': 'Bearer your-token',
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  return data.data;
}

async function createPerson(personData) {
  const response = await fetch('https://api.planningcenteronline.com/people/v2/people', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer your-token',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(personData)
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return await response.json();
}

// Usage
try {
  const people = await getPeople();
  const newPerson = await createPerson({
    first_name: 'John',
    last_name: 'Doe'
  });
} catch (error) {
  console.error('API Error:', error.message);
}
```

**After (This Library):**

```typescript
import { createPcoClient, getPeople, createPerson, PcoError, ErrorCategory } from '@rachelallyson/planning-center-people-ts';

// Create client
const client = createPcoClient({
  personalAccessToken: 'your-token'
});

// Usage with proper error handling
try {
  const people = await getPeople(client, { per_page: 50 });
  const newPerson = await createPerson(client, {
    first_name: 'John',
    last_name: 'Doe'
  });
} catch (error) {
  if (error instanceof PcoError) {
    switch (error.category) {
      case ErrorCategory.AUTHENTICATION:
        console.error('Authentication failed');
        break;
      case ErrorCategory.RATE_LIMIT:
        console.error('Rate limited, retry after:', error.getRetryDelay(), 'ms');
        break;
      default:
        console.error('API Error:', error.message);
    }
  }
}
```

### Benefits of Migration

1. **No Manual URL Construction**: Endpoints are handled automatically
2. **Automatic Rate Limiting**: Built-in rate limit handling
3. **Better Error Handling**: Categorized errors with context
4. **Type Safety**: Full TypeScript support
5. **Retry Logic**: Automatic retry with exponential backoff

## From Other PCO Libraries

### Generic PCO Library

**Before (Generic Library):**

```javascript
// Generic PCO library
const PcoClient = require('pco-client');

const client = new PcoClient({
  appId: 'your-app-id',
  appSecret: 'your-app-secret'
});

// Get people
client.get('/people/v2/people').then(response => {
  console.log(response.data);
});

// Create person
client.post('/people/v2/people', {
  first_name: 'John',
  last_name: 'Doe'
}).then(response => {
  console.log(response.data);
});
```

**After (This Library):**

```typescript
import { createPcoClient, getPeople, createPerson } from '@rachelallyson/planning-center-people-ts';

const client = createPcoClient({
  appId: 'your-app-id',
  appSecret: 'your-app-secret',
  personalAccessToken: 'your-token'
});

// Get people with type safety
const people = await getPeople(client, { per_page: 50 });
console.log(people.data); // Fully typed

// Create person with validation
const person = await createPerson(client, {
  first_name: 'John',
  last_name: 'Doe'
});
console.log(person.data); // Fully typed
```

### Axios-based Library

**Before (Axios-based):**

```javascript
// Axios-based PCO library
const axios = require('axios');

const api = axios.create({
  baseURL: 'https://api.planningcenteronline.com/people/v2',
  headers: {
    'Authorization': 'Bearer your-token'
  }
});

// Get people
const getPeople = async () => {
  try {
    const response = await api.get('/people');
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`API Error: ${error.response.status} - ${error.response.data}`);
    }
    throw error;
  }
};

// Create person
const createPerson = async (personData) => {
  try {
    const response = await api.post('/people', personData);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`API Error: ${error.response.status} - ${error.response.data}`);
    }
    throw error;
  }
};
```

**After (This Library):**

```typescript
import { createPcoClient, getPeople, createPerson } from '@rachelallyson/planning-center-people-ts';

const client = createPcoClient({
  personalAccessToken: 'your-token'
});

// No need for manual error handling - it's built-in
const people = await getPeople(client, { per_page: 50 });
const person = await createPerson(client, {
  first_name: 'John',
  last_name: 'Doe'
});
```

## From Class-Based Approaches

### Custom Class Implementation

**Before (Custom Class):**

```javascript
// Custom PCO class
class PcoPeopleAPI {
  constructor(config) {
    this.baseURL = 'https://api.planningcenteronline.com/people/v2';
    this.token = config.token;
    this.appId = config.appId;
    this.appSecret = config.appSecret;
  }
  
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  }
  
  async getPeople(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/people${queryString ? `?${queryString}` : ''}`;
    return await this.request(endpoint);
  }
  
  async getPerson(id, include = []) {
    const queryString = include.length ? `?include=${include.join(',')}` : '';
    return await this.request(`/people/${id}${queryString}`);
  }
  
  async createPerson(data) {
    return await this.request('/people', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
  
  async updatePerson(id, data) {
    return await this.request(`/people/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }
  
  async deletePerson(id) {
    return await this.request(`/people/${id}`, {
      method: 'DELETE'
    });
  }
}

// Usage
const api = new PcoPeopleAPI({
  token: 'your-token',
  appId: 'your-app-id',
  appSecret: 'your-app-secret'
});

const people = await api.getPeople({ per_page: 50 });
const person = await api.getPerson('person-id', ['emails']);
```

**After (This Library):**

```typescript
import { 
  createPcoClient, 
  getPeople, 
  getPerson, 
  createPerson, 
  updatePerson, 
  deletePerson 
} from '@rachelallyson/planning-center-people-ts';

// Create client
const client = createPcoClient({
  personalAccessToken: 'your-token',
  appId: 'your-app-id',
  appSecret: 'your-app-secret'
});

// Usage - same functionality, better implementation
const people = await getPeople(client, { per_page: 50 });
const person = await getPerson(client, 'person-id', ['emails']);
const newPerson = await createPerson(client, { first_name: 'John', last_name: 'Doe' });
const updatedPerson = await updatePerson(client, 'person-id', { first_name: 'Jane' });
await deletePerson(client, 'person-id');
```

### Benefits of Functional Approach

1. **No State Management**: Functions are stateless and predictable
2. **Better Testing**: Easier to unit test individual functions
3. **Tree Shaking**: Import only what you need
4. **Composition**: Easy to combine and extend functionality
5. **Type Safety**: Better TypeScript inference

## From JavaScript to TypeScript

### Adding TypeScript Support

**Before (JavaScript):**

```javascript
// JavaScript implementation
const PcoClient = require('pco-client');

const client = new PcoClient({
  appId: 'your-app-id',
  appSecret: 'your-app-secret'
});

async function getPeople() {
  const response = await client.get('/people');
  return response.data;
}

async function createPerson(personData) {
  const response = await client.post('/people', personData);
  return response.data;
}

// Usage
const people = await getPeople();
const person = await createPerson({
  first_name: 'John',
  last_name: 'Doe'
});
```

**After (TypeScript with This Library):**

```typescript
// TypeScript implementation
import { 
  createPcoClient, 
  getPeople, 
  createPerson,
  type PersonResource,
  type PeopleList,
  type PersonSingle 
} from '@rachelallyson/planning-center-people-ts';

const client = createPcoClient({
  appId: 'your-app-id',
  appSecret: 'your-app-secret',
  personalAccessToken: 'your-token'
});

async function getPeople(): Promise<PersonResource[]> {
  const response: PeopleList = await getPeople(client, { per_page: 50 });
  return response.data;
}

async function createPerson(personData: {
  first_name: string;
  last_name: string;
  email?: string;
}): Promise<PersonResource> {
  const response: PersonSingle = await createPerson(client, personData);
  return response.data!;
}

// Usage with full type safety
const people: PersonResource[] = await getPeople();
const person: PersonResource = await createPerson({
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com'
});

// TypeScript knows the exact structure
console.log(person.attributes.first_name); // ✅ Type-safe
console.log(person.attributes.invalid_field); // ❌ TypeScript error
```

### TypeScript Configuration

**tsconfig.json:**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Migration Checklist

### Pre-Migration

- [ ] **Backup your current implementation**
- [ ] **Document current functionality**
- [ ] **Identify dependencies on current library**
- [ ] **Plan migration timeline**
- [ ] **Set up testing environment**

### Installation & Setup

- [ ] **Install new library**

  ```bash
  npm install @rachelallyson/planning-center-people-ts
  ```

- [ ] **Update TypeScript configuration** (if using TypeScript)
- [ ] **Update environment variables**
- [ ] **Create new client instance**

### Code Migration

- [ ] **Replace client creation**
- [ ] **Update API calls to use new functions**
- [ ] **Update error handling**
- [ ] **Update type definitions** (if using TypeScript)
- [ ] **Test all functionality**

### Testing & Validation

- [ ] **Run existing tests**
- [ ] **Test error scenarios**
- [ ] **Validate rate limiting**
- [ ] **Check performance**
- [ ] **Test in staging environment**

### Deployment

- [ ] **Deploy to staging**
- [ ] **Monitor for issues**
- [ ] **Deploy to production**
- [ ] **Monitor production metrics**
- [ ] **Remove old library** (after validation)

## Common Migration Issues

### Issue: Import/Export Mismatches

**Problem:**

```typescript
// Old way
import { PcoClient } from 'old-library';

// New way - different import structure
import { createPcoClient } from '@rachelallyson/planning-center-people-ts';
```

**Solution:**
Update all import statements to use the new functional approach.

### Issue: Error Handling Changes

**Problem:**

```typescript
// Old way
try {
  const people = await oldApi.getPeople();
} catch (error) {
  console.error('Error:', error.message);
}

// New way - more detailed error information
try {
  const people = await getPeople(client);
} catch (error) {
  if (error instanceof PcoError) {
    console.error('PCO Error:', {
      message: error.message,
      category: error.category,
      severity: error.severity,
      retryable: error.retryable
    });
  }
}
```

**Solution:**
Update error handling to use the new `PcoError` class and error categories.

### Issue: Configuration Changes

**Problem:**

```typescript
// Old way
const client = new OldPcoClient({
  apiKey: 'your-key',
  baseUrl: 'https://api.planningcenteronline.com'
});

// New way - different configuration structure
const client = createPcoClient({
  appId: 'your-app-id',
  appSecret: 'your-app-secret',
  personalAccessToken: 'your-token'
});
```

**Solution:**
Update client configuration to use the new structure.

### Issue: TypeScript Type Changes

**Problem:**

```typescript
// Old way - generic types
interface OldPerson {
  id: string;
  firstName: string;
  lastName: string;
}

// New way - specific PCO types
import type { PersonResource } from '@rachelallyson/planning-center-people-ts';
```

**Solution:**
Update type definitions to use the library's built-in types.

### Issue: Async/Await Patterns

**Problem:**

```typescript
// Old way - callback-based
oldApi.getPeople((error, people) => {
  if (error) {
    console.error(error);
  } else {
    console.log(people);
  }
});

// New way - promise-based
try {
  const people = await getPeople(client);
  console.log(people);
} catch (error) {
  console.error(error);
}
```

**Solution:**
Convert callback-based code to async/await patterns.

## Migration Examples

### Complete Migration Example

**Before (Old Implementation):**

```javascript
// Old implementation
const OldPcoClient = require('old-pco-client');

class PeopleService {
  constructor(config) {
    this.client = new OldPcoClient(config);
  }
  
  async getAllPeople() {
    try {
      const response = await this.client.get('/people');
      return response.data;
    } catch (error) {
      console.error('Error fetching people:', error.message);
      throw error;
    }
  }
  
  async getPerson(id) {
    try {
      const response = await this.client.get(`/people/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching person:', error.message);
      throw error;
    }
  }
  
  async createPerson(personData) {
    try {
      const response = await this.client.post('/people', personData);
      return response.data;
    } catch (error) {
      console.error('Error creating person:', error.message);
      throw error;
    }
  }
}

// Usage
const peopleService = new PeopleService({
  apiKey: 'your-api-key'
});

const people = await peopleService.getAllPeople();
const person = await peopleService.getPerson('person-id');
const newPerson = await peopleService.createPerson({
  first_name: 'John',
  last_name: 'Doe'
});
```

**After (New Implementation):**

```typescript
// New implementation
import { 
  createPcoClient, 
  getPeople, 
  getPerson, 
  createPerson,
  PcoError,
  ErrorCategory,
  type PersonResource,
  type PeopleList,
  type PersonSingle
} from '@rachelallyson/planning-center-people-ts';

class PeopleService {
  private client: PcoClientState;
  
  constructor(config: {
    appId: string;
    appSecret: string;
    personalAccessToken: string;
  }) {
    this.client = createPcoClient(config);
  }
  
  async getAllPeople(): Promise<PersonResource[]> {
    try {
      const response: PeopleList = await getPeople(this.client, { per_page: 100 });
      return response.data;
    } catch (error) {
      this.handleError(error, 'fetching people');
      throw error;
    }
  }
  
  async getPerson(id: string): Promise<PersonResource> {
    try {
      const response: PersonSingle = await getPerson(this.client, id, ['emails', 'phone_numbers']);
      return response.data!;
    } catch (error) {
      this.handleError(error, 'fetching person');
      throw error;
    }
  }
  
  async createPerson(personData: {
    first_name: string;
    last_name: string;
    email?: string;
  }): Promise<PersonResource> {
    try {
      const response: PersonSingle = await createPerson(this.client, personData);
      return response.data!;
    } catch (error) {
      this.handleError(error, 'creating person');
      throw error;
    }
  }
  
  private handleError(error: unknown, operation: string): void {
    if (error instanceof PcoError) {
      console.error(`Error ${operation}:`, {
        message: error.message,
        category: error.category,
        severity: error.severity,
        retryable: error.retryable
      });
      
      // Handle specific error categories
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
    } else {
      console.error(`Unexpected error ${operation}:`, error);
    }
  }
}

// Usage with full type safety
const peopleService = new PeopleService({
  appId: 'your-app-id',
  appSecret: 'your-app-secret',
  personalAccessToken: 'your-token'
});

const people: PersonResource[] = await peopleService.getAllPeople();
const person: PersonResource = await peopleService.getPerson('person-id');
const newPerson: PersonResource = await peopleService.createPerson({
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com'
});
```

## Next Steps

After migration:

1. **Update Documentation**: Update your project documentation to reflect the new library
2. **Train Team**: Ensure your team understands the new patterns and error handling
3. **Monitor Performance**: Watch for any performance improvements or issues
4. **Update Tests**: Update your test suite to work with the new library
5. **Remove Old Dependencies**: Clean up old library dependencies

## Getting Help

If you encounter issues during migration:

1. **Check this guide** for your specific migration scenario
2. **Review the API Reference** for function signatures and usage
3. **Check Examples** for real-world usage patterns
4. **Open an issue** on GitHub with details about your migration

---

*This migration guide covers the most common migration scenarios. For specific migration questions or issues, please [open an issue](https://github.com/rachelallyson/planning-center-people-ts/issues) with details about your current implementation.*
