# Examples - v2.0.0

This guide provides comprehensive examples for using the Planning Center People TypeScript library v2.0.0 in real-world scenarios.

## Table of Contents

1. [Basic Setup](#basic-setup)
2. [People Management](#people-management)
3. [Contact Management](#contact-management)
4. [Workflow Management](#workflow-management)
5. [Campus Management](#campus-management)
6. [Custom Fields](#custom-fields)
7. [Batch Operations](#batch-operations)
8. [Person Matching](#person-matching)
9. [Event Monitoring](#event-monitoring)
10. [Error Handling](#error-handling)
11. [Advanced Patterns](#advanced-patterns)

## Basic Setup

### Simple Client Setup

```typescript
import { PcoClient } from '@rachelallyson/planning-center-people-ts';

// Personal Access Token
const client = new PcoClient({
  auth: {
    type: 'personal_access_token',
    personalAccessToken: process.env.PCO_PERSONAL_ACCESS_TOKEN!
  }
});

// OAuth 2.0 (refresh token handling required)
const client = new PcoClient({
  auth: {
    type: 'oauth',
    accessToken: process.env.PCO_ACCESS_TOKEN!,
    refreshToken: process.env.PCO_REFRESH_TOKEN!,
    // REQUIRED: Handle token refresh to prevent token loss
    onRefresh: async (tokens) => {
      // Save new tokens to your database
      await saveTokensToDatabase(userId, tokens);
    },
    // REQUIRED: Handle refresh failures
    onRefreshFailure: async (error) => {
      console.error('Token refresh failed:', error.message);
      await clearUserTokens(userId);
    }
  }
});
```

### Production Setup with Configuration

```typescript
import { PcoClient, PcoClientManager } from '@rachelallyson/planning-center-people-ts';

// Production client with full configuration
const client = new PcoClient({
  auth: {
    type: 'personal_access_token',
    personalAccessToken: process.env.PCO_PERSONAL_ACCESS_TOKEN!
  },
  rateLimit: {
    maxRequests: 90,
    perMilliseconds: 60000
  },
  timeout: 30000
});

// Client manager for multi-user applications
const manager = new PcoClientManager();

async function getUserClient(userId: string) {
  return await manager.getClient(userId, {
    auth: {
      type: 'oauth',
      accessToken: await getStoredAccessToken(userId),
      refreshToken: await getStoredRefreshToken(userId),
      onRefresh: async (tokens) => {
        await saveUserTokens(userId, tokens);
      }
    }
  });
}
```

## People Management

### Basic CRUD Operations

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
  'addresses', 
  'household'
]);

// Create person
const newPerson = await client.people.create({
  first_name: 'John',
  last_name: 'Doe',
  status: 'active'
});

// Update person
const updatedPerson = await client.people.update('person-id', {
  first_name: 'Jane',
  last_name: 'Smith'
});

// Delete person
await client.people.delete('person-id');
```

### Advanced People Operations

```typescript
// Create person with contacts
const personWithContacts = await client.people.createWithContacts(
  { 
    first_name: 'John', 
    last_name: 'Doe',
    status: 'active'
  },
  {
    email: { 
      address: 'john@example.com', 
      primary: true,
      location: 'Home'
    },
    phone: { 
      number: '+1-555-123-4567', 
      location: 'Mobile',
      primary: true
    },
    address: {
      address1: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zip: '12345',
      location: 'Home',
      primary: true
    }
  }
);

// Find or create person with smart matching
const person = await client.people.findOrCreate({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  matchStrategy: 'fuzzy',
  createIfNotFound: true
});
```

### People Search and Filtering

```typescript
// Search by name
const johns = await client.people.getAll({
  where: { first_name: 'John' },
  perPage: 100
});

// Search by status
const activePeople = await client.people.getAll({
  where: { status: 'active' },
  include: ['emails']
});

// Search with multiple criteria
const searchResults = await client.people.getAll({
  where: { 
    first_name: 'John',
    status: 'active'
  },
  include: ['emails', 'phone_numbers'],
  perPage: 50
});

// Get people with pagination
async function getAllPeople() {
  const allPeople = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    const response = await client.people.getAll({
      perPage: 100,
      page,
      include: ['emails']
    });
    
    allPeople.push(...response.data);
    hasMore = response.meta.next !== undefined;
    page++;
  }
  
  return allPeople;
}
```

## Contact Management

### Email Management

```typescript
// Get all emails for a person
const emails = await client.people.getEmails('person-id');

// Add email
const email = await client.people.addEmail('person-id', {
  address: 'john@example.com',
  location: 'Home',
  primary: true
});

// Update email
const updatedEmail = await client.people.updateEmail('person-id', 'email-id', {
  location: 'Work',
  primary: false
});

// Delete email
await client.people.deleteEmail('person-id', 'email-id');

// Get all emails across all people
const allEmails = await client.contacts.getEmails();
```

### Phone Number Management

```typescript
// Get all phone numbers for a person
const phones = await client.people.getPhoneNumbers('person-id');

// Add phone number
const phone = await client.people.addPhoneNumber('person-id', {
  number: '+1-555-123-4567',
  location: 'Mobile',
  primary: true
});

// Update phone number
const updatedPhone = await client.people.updatePhoneNumber('person-id', 'phone-id', {
  location: 'Work',
  primary: false
});

// Delete phone number
await client.people.deletePhoneNumber('person-id', 'phone-id');
```

### Address Management

```typescript
// Get all addresses for a person
const addresses = await client.people.getAddresses('person-id');

// Add address
const address = await client.people.addAddress('person-id', {
  address1: '123 Main St',
  address2: 'Apt 4B',
  city: 'Anytown',
  state: 'CA',
  zip: '12345',
  country: 'US',
  location: 'Home',
  primary: true
});

// Update address
const updatedAddress = await client.people.updateAddress('person-id', 'address-id', {
  city: 'New City',
  state: 'NY'
});

// Delete address
await client.people.deleteAddress('person-id', 'address-id');
```

### Social Profile Management

```typescript
// Get all social profiles for a person
const profiles = await client.people.getSocialProfiles('person-id');

// Add social profile
const profile = await client.people.addSocialProfile('person-id', {
  service: 'facebook',
  username: 'johndoe',
  url: 'https://facebook.com/johndoe'
});

// Delete social profile
await client.people.deleteSocialProfile('person-id', 'profile-id');
```

## Workflow Management

### Basic Workflow Operations

```typescript
// Get all workflows
const workflows = await client.workflows.getAll();

// Get specific workflow
const workflow = await client.workflows.getById('workflow-id');

// Create workflow
const newWorkflow = await client.workflows.create({
  name: 'New Member Follow-up',
  description: 'Follow up with new members'
});

// Update workflow
const updatedWorkflow = await client.workflows.update('workflow-id', {
  name: 'Updated Workflow Name'
});

// Delete workflow
await client.workflows.delete('workflow-id');
```

### Workflow Card Management

```typescript
// Get workflow cards for a person
const cards = await client.workflows.getPersonWorkflowCards('person-id');

// Create workflow card
const card = await client.workflows.createWorkflowCard('person-id', 'workflow-id', {
  title: 'Follow up call',
  description: 'Call to discuss membership'
});

// Update workflow card
const updatedCard = await client.workflows.updateWorkflowCard('card-id', {
  sticky_assignment: true
}, 'person-id');

// Delete workflow card
await client.workflows.deleteWorkflowCard('person-id', 'card-id');
```

### Workflow Card Actions

```typescript
// Promote workflow card to next step
await client.workflows.promoteWorkflowCard('person-id', 'card-id');

// Go back to previous step
await client.workflows.goBackWorkflowCard('person-id', 'card-id');

// Skip current step
await client.workflows.skipStepWorkflowCard('person-id', 'card-id');

// Snooze workflow card
await client.workflows.snoozeWorkflowCard('person-id', 'card-id', {
  duration: 7 // days
});

// Unsnooze workflow card
await client.workflows.unsnoozeWorkflowCard('person-id', 'card-id');

// Remove workflow card
await client.workflows.removeWorkflowCard('person-id', 'card-id');

// Restore removed workflow card
await client.workflows.restoreWorkflowCard('person-id', 'card-id');

// Send email from workflow card
await client.workflows.sendEmailWorkflowCard('person-id', 'card-id', {
  subject: 'Follow up',
  note: 'Thank you for your interest in our church'
});
```

### Workflow Card Notes

```typescript
// Get notes for a workflow card
const notes = await client.workflows.getWorkflowCardNotes('person-id', 'card-id');

// Create note for workflow card
const note = await client.workflows.createWorkflowCardNote('person-id', 'card-id', {
  note: 'Called and left voicemail. Will try again tomorrow.'
});
```

## Campus Management

### Basic Campus Operations

```typescript
// Get all campuses
const campuses = await client.campus.getAll();

// Get specific campus
const campus = await client.campus.getById('campus-id');

// Create new campus
const newCampus = await client.campus.create({
  description: 'Main Campus',
  street: '123 Church Street',
  city: 'Anytown',
  state: 'CA',
  zip: '12345',
  country: 'US',
  phone_number: '555-123-4567',
  website: 'https://maincampus.example.com',
  twenty_four_hour_time: false,
  date_format: 1,
  church_center_enabled: true
});

// Update campus
const updatedCampus = await client.campus.update('campus-id', {
  city: 'Updated City',
  phone_number: '555-987-6543'
});

// Delete campus
await client.campus.delete('campus-id');
```

### Campus Lists and Service Times

```typescript
// Get lists for a specific campus
const campusLists = await client.campus.getLists('campus-id');

// Get service times for a specific campus
const serviceTimes = await client.campus.getServiceTimes('campus-id');

// Get all campuses with pagination
const allCampuses = await client.campus.getAllPages();
```

### Campus Management with Error Handling

```typescript
try {
  // Create campus with validation
  const campus = await client.campus.create({
    description: 'New Campus Location',
    street: '456 New Street',
    city: 'New City',
    state: 'NC',
    zip: '54321',
    country: 'US'
  });
  
  console.log('Campus created:', campus.id);
  
  // Update campus
  const updatedCampus = await client.campus.update(campus.id, {
    phone_number: '555-111-2222'
  });
  
  console.log('Campus updated successfully');
  
} catch (error) {
  if (error instanceof PcoApiError) {
    console.error('API Error:', error.message);
    console.error('Status:', error.status);
    console.error('Details:', error.details);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Custom Fields

### Field Definitions

```typescript
// Get all field definitions
const fieldDefs = await client.fields.getFieldDefinitions();

// Get specific field definition
const fieldDef = await client.fields.getFieldDefinitionById('field-def-id');

// Create field definition
const newFieldDef = await client.fields.createFieldDefinition({
  name: 'Emergency Contact',
  field_type: 'text',
  required: false,
  description: 'Emergency contact information'
});

// Update field definition
const updatedFieldDef = await client.fields.updateFieldDefinition('field-def-id', {
  name: 'Updated Field Name'
});

// Delete field definition
await client.fields.deleteFieldDefinition('field-def-id');
```

### Field Data Management

```typescript
// Get field data for a person
const fieldData = await client.fields.getPersonFieldData('person-id');

// Set field data (with smart file upload handling)
const textField = await client.fields.setPersonFieldById(
  'person-id',
  'field-def-id',
  'Some text value'
);

// Set file field data
const fileField = await client.fields.setPersonFieldById(
  'person-id',
  'field-def-id',
  '<a href="https://example.com/document.pdf" download>View File</a>'
);

// Delete field data
await client.fields.deletePersonFieldData('person-id', 'field-data-id');
```

### Field Options

```typescript
// Get options for a field definition
const options = await client.fields.getFieldOptions('field-def-id');

// Create field option
const option = await client.fields.createFieldOption('field-def-id', {
  value: 'Option 1',
  sequence: 1
});
```

## Batch Operations

### Batch Processing People

```typescript
// Process multiple people in batches
async function processPeopleInBatches(people: any[], batchSize = 10) {
  const results = [];
  
  for (let i = 0; i < people.length; i += batchSize) {
    const batch = people.slice(i, i + batchSize);
    
    const batchResults = await Promise.allSettled(
      batch.map(async (person) => {
        // Process each person
        return await client.people.update(person.id, { 
          status: 'processed' 
        });
      })
    );
    
    results.push(...batchResults);
  }
  
  return results;
}

// Usage
const people = await client.people.getAll({ perPage: 100 });
const results = await processPeopleInBatches(people.data, 5);
```

### Batch Contact Management

```typescript
// Add multiple contacts to a person
async function addMultipleContacts(personId: string, contacts: any[]) {
  const results = [];
  
  for (const contact of contacts) {
    try {
      let result;
      
      if (contact.type === 'email') {
        result = await client.people.addEmail(personId, contact.data);
      } else if (contact.type === 'phone') {
        result = await client.people.addPhoneNumber(personId, contact.data);
      } else if (contact.type === 'address') {
        result = await client.people.addAddress(personId, contact.data);
      }
      
      results.push({ success: true, result });
          } catch (error) {
      results.push({ success: false, error: error.message });
    }
  }
  
  return results;
}

// Usage
const contacts = [
  { type: 'email', data: { address: 'john@example.com', primary: true } },
  { type: 'phone', data: { number: '+1-555-123-4567', location: 'Mobile' } },
  { type: 'address', data: { address1: '123 Main St', city: 'Anytown' } }
];

const results = await addMultipleContacts('person-id', contacts);
```

## Person Matching

### Basic Person Matching

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
  console.log(`Match type: ${match.matchType}`);
} else {
  console.log('No matching person found');
}

// Find or create person
const person = await matcher.findOrCreate({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  matchStrategy: 'fuzzy',
  createIfNotFound: true
});
```

### Advanced Person Matching

```typescript
// Batch person matching
async function matchMultiplePeople(peopleData: any[]) {
  const results = [];
  
  for (const personData of peopleData) {
    try {
      const match = await matcher.findOrCreate({
        firstName: personData.firstName,
        lastName: personData.lastName,
        email: personData.email,
        matchStrategy: 'fuzzy'
      });
      
      results.push({ 
        input: personData, 
        result: match,
        status: 'success' 
      });
  } catch (error) {
      results.push({ 
        input: personData, 
        error: error.message,
        status: 'error' 
      });
    }
  }
  
  return results;
}

// Usage
const peopleData = [
  { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
  { firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' }
];

const results = await matchMultiplePeople(peopleData);
```

## Event Monitoring

### Basic Event Monitoring

```typescript
// Listen to request events
client.on('request:start', (event) => {
  console.log(`Starting ${event.method} ${event.endpoint}`);
});

client.on('request:complete', (event) => {
  console.log(`Completed ${event.method} ${event.endpoint} in ${event.duration}ms`);
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

### Advanced Event Monitoring

```typescript
// Comprehensive event monitoring
class ApiMonitor {
  private metrics = {
    requestCount: 0,
    errorCount: 0,
    totalDuration: 0,
    rateLimitCount: 0
  };
  
  constructor(private client: PcoClient) {
    this.setupEventListeners();
  }
  
  private setupEventListeners() {
    this.client.on('request:start', (event) => {
      this.metrics.requestCount++;
      console.log(`[${new Date().toISOString()}] Starting ${event.method} ${event.endpoint}`);
    });
    
    this.client.on('request:complete', (event) => {
      this.metrics.totalDuration += event.duration;
      console.log(`[${new Date().toISOString()}] Completed ${event.method} ${event.endpoint} in ${event.duration}ms`);
    });
    
    this.client.on('error', (event) => {
      this.metrics.errorCount++;
      console.error(`[${new Date().toISOString()}] Error in ${event.method} ${event.endpoint}:`, event.error.message);
    });
    
    this.client.on('rate:limit', (event) => {
      this.metrics.rateLimitCount++;
      console.warn(`[${new Date().toISOString()}] Rate limit reached. Retry after ${event.retryAfter}ms`);
    });
  }
  
  getMetrics() {
    return {
      ...this.metrics,
      averageDuration: this.metrics.requestCount > 0 
        ? this.metrics.totalDuration / this.metrics.requestCount 
        : 0
    };
  }
}

// Usage
const monitor = new ApiMonitor(client);

// After some operations
console.log('API Metrics:', monitor.getMetrics());
```

## Error Handling

### Basic Error Handling

```typescript
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
// Comprehensive error handling with retry logic
async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      if (error instanceof PcoApiError) {
        // Don't retry on client errors
        if (error.status >= 400 && error.status < 500) {
          throw error;
        }
      }
      
      // Wait before retry
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Unexpected error in retry logic');
}

// Usage
const people = await executeWithRetry(() => client.people.getAll());
```

### Error Recovery Strategies

```typescript
// Error recovery with fallback strategies
async function getPersonWithFallback(personId: string) {
  try {
    // Try to get person with all includes
    return await client.people.getById(personId, [
      'emails', 
      'phone_numbers', 
      'addresses', 
      'household'
    ]);
  } catch (error) {
    if (error instanceof PcoApiError && error.status === 404) {
      // Person not found
      throw new Error(`Person with ID ${personId} not found`);
    }
    
    // Try fallback without includes
    try {
      return await client.people.getById(personId);
    } catch (fallbackError) {
      throw new Error(`Failed to get person: ${fallbackError.message}`);
    }
  }
}
```

## Advanced Patterns

### Service Layer Pattern

```typescript
// Service layer for people management
class PeopleService {
  constructor(
    private client: PcoClient,
    private cache: Map<string, any> = new Map()
  ) {}
  
  async getPerson(id: string, useCache = true): Promise<PersonResource> {
    const cacheKey = `person:${id}`;
    
    if (useCache && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    const person = await this.client.people.getById(id, [
      'emails', 
      'phone_numbers', 
      'addresses'
    ]);
    
    if (useCache) {
      this.cache.set(cacheKey, person);
    }
    
    return person;
  }
  
  async createPersonWithContacts(
    personData: PersonAttributes,
    contacts: {
      email?: any;
      phone?: any;
      address?: any;
    }
  ): Promise<PersonResource> {
    const person = await this.client.people.createWithContacts(personData, contacts);
    
    // Invalidate cache
    this.cache.clear();
    
    return person;
  }
  
  async updatePerson(id: string, data: Partial<PersonAttributes>): Promise<PersonResource> {
    const person = await this.client.people.update(id, data);
    
    // Update cache
    this.cache.set(`person:${id}`, person);
    
    return person;
  }
}

// Usage
const peopleService = new PeopleService(client);
const person = await peopleService.getPerson('person-id');
```

### Repository Pattern

```typescript
// Repository pattern for data access
interface IPeopleRepository {
  findById(id: string): Promise<PersonResource | null>;
  findAll(params?: any): Promise<PersonResource[]>;
  create(data: PersonAttributes): Promise<PersonResource>;
  update(id: string, data: Partial<PersonAttributes>): Promise<PersonResource>;
  delete(id: string): Promise<void>;
}

class PeopleRepository implements IPeopleRepository {
  constructor(private client: PcoClient) {}
  
  async findById(id: string): Promise<PersonResource | null> {
    try {
      return await this.client.people.getById(id);
    } catch (error) {
      if (error instanceof PcoApiError && error.status === 404) {
        return null;
      }
      throw error;
    }
  }
  
  async findAll(params?: any): Promise<PersonResource[]> {
    const response = await this.client.people.getAll(params);
    return response.data;
  }
  
  async create(data: PersonAttributes): Promise<PersonResource> {
    return await this.client.people.create(data);
  }
  
  async update(id: string, data: Partial<PersonAttributes>): Promise<PersonResource> {
    return await this.client.people.update(id, data);
  }
  
  async delete(id: string): Promise<void> {
    await this.client.people.delete(id);
  }
}

// Usage
const peopleRepo = new PeopleRepository(client);
const person = await peopleRepo.findById('person-id');
```

### Factory Pattern

```typescript
// Factory pattern for client creation
class PcoClientFactory {
  static createPersonalAccessTokenClient(token: string): PcoClient {
    return new PcoClient({
      auth: {
        type: 'personal_access_token',
        personalAccessToken: token
      }
    });
  }
  
  static createOAuthClient(
    accessToken: string, 
    refreshToken: string,
    onRefresh?: (tokens: any) => Promise<void>
  ): PcoClient {
    return new PcoClient({
      auth: {
        type: 'oauth',
        accessToken,
        refreshToken,
        onRefresh
      }
    });
  }
  
  static createProductionClient(): PcoClient {
    return new PcoClient({
      auth: {
        type: 'personal_access_token',
        personalAccessToken: process.env.PCO_PERSONAL_ACCESS_TOKEN!
      },
      rateLimit: {
        maxRequests: 90,
        perMilliseconds: 60000
      },
      timeout: 30000
    });
  }
}

// Usage
const client = PcoClientFactory.createProductionClient();
```

### Observer Pattern

```typescript
// Observer pattern for API monitoring
class ApiObserver {
  private observers: Array<(event: any) => void> = [];
  
  subscribe(observer: (event: any) => void): void {
    this.observers.push(observer);
  }
  
  unsubscribe(observer: (event: any) => void): void {
    const index = this.observers.indexOf(observer);
    if (index > -1) {
      this.observers.splice(index, 1);
    }
  }
  
  notify(event: any): void {
    this.observers.forEach(observer => observer(event));
  }
}

class ApiMonitor {
  constructor(private client: PcoClient, private observer: ApiObserver) {
    this.setupEventListeners();
  }
  
  private setupEventListeners() {
    this.client.on('request:start', (event) => {
      this.observer.notify({ type: 'request:start', data: event });
    });
    
    this.client.on('request:complete', (event) => {
      this.observer.notify({ type: 'request:complete', data: event });
    });
    
    this.client.on('error', (event) => {
      this.observer.notify({ type: 'error', data: event });
    });
  }
}

// Usage
const observer = new ApiObserver();
const monitor = new ApiMonitor(client, observer);

observer.subscribe((event) => {
  console.log(`Event: ${event.type}`, event.data);
});
```

## Next Steps

- 📚 **[API Reference](./API_REFERENCE.md)** - Complete method documentation
- 💡 **[API Usage Guide](./API_USAGE_GUIDE.md)** - Comprehensive usage patterns
- 🔐 **[Authentication Guide](./AUTHENTICATION.md)** - Authentication setup
- 🛠️ **[Best Practices](./BEST_PRACTICES.md)** - Production best practices

---

*These examples demonstrate real-world usage patterns for the v2.0.0 library. For more specific use cases, refer to the [API Reference](./API_REFERENCE.md) or [open an issue](https://github.com/rachelallyson/planning-center-people-ts/issues) for help.*
