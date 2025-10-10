# @rachelallyson/planning-center-people-ts

A modern, type-safe TypeScript library for interacting with the Planning Center Online People API. Built with a class-based architecture, comprehensive error handling, and advanced features like person matching and batch operations.

> **📖 For the latest documentation and examples, see [docs/README.md](docs/README.md)**

## Features

- ✅ **Strict TypeScript**: Full type safety with no `any` types
- ✅ **JSON:API 1.0 Compliant**: Follows the JSON:API specification exactly
- ✅ **Functional Approach**: Clean, composable functions instead of classes
- ✅ **Rate Limiting**: Built-in rate limiting with PCO's 100 req/min policy
- ✅ **Modern HTTP**: Uses native fetch API (no external dependencies)
- ✅ **Authentication**: Supports both Personal Access Tokens and OAuth 2.0
- ✅ **Enhanced Error Handling**: Comprehensive error handling with categories, severity, and retry logic
- ✅ **Automatic Retries**: Configurable exponential backoff with smart retry logic
- ✅ **Request Timeouts**: Configurable request timeouts
- ✅ **Pagination**: Automatic pagination support
- ✅ **File Upload Handling**: Intelligent file upload detection and processing for custom fields
- ✅ **No Index Signatures**: Clean type definitions without index signatures

## Installation

```bash
npm install @planning-center-people-ts
```

**No external dependencies required!** This package uses the native fetch API available in all modern environments.

## Quick Start

```typescript
import {
    createPcoClient,
    getPeople,
    getPerson,
    createPerson,
    updatePerson,
    deletePerson,
} from '@planning-center-people-ts';

// Create a client
const client = createPcoClient({
    personalAccessToken: 'your-token-here',
    appId: 'your-app-id',
    appSecret: 'your-app-secret',
    // Or use OAuth 2.0:
    // accessToken: 'your-oauth-token',
});

// Get all people
const people = await getPeople(client, {
    per_page: 10,
    include: ['emails', 'phone_numbers'],
});

// Get a specific person
const person = await getPerson(client, 'person-id', ['emails']);

// Create a new person
const newPerson = await createPerson(client, {
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
});

// Update a person
const updatedPerson = await updatePerson(client, 'person-id', {
    first_name: 'Jane',
});

// Delete a person
await deletePerson(client, 'person-id');

// Smart file upload handling for custom fields
import { createPersonFieldData } from '@planning-center-people-ts';

// Automatically determines field type and handles file uploads appropriately
await createPersonFieldData(
    client,
    'person-id',
    'field-definition-id',
    '<a href="https://example.com/document.pdf" download>View File</a>'
);
```

## Configuration

### Authentication

The client supports two authentication methods:

#### Personal Access Token (Recommended for single-user apps)

```typescript
const client = createPcoClient({
    personalAccessToken: 'your-token-here',
    appId: 'your-app-id',
    appSecret: 'your-app-secret',
});
```

#### OAuth 2.0 (For multi-user apps)

```typescript
const client = createPcoClient({
    accessToken: 'your-oauth-token',
});
```

### Rate Limiting

Rate limiting is automatically handled, but you can customize it:

```typescript
const client = createPcoClient({
    accessToken: 'your-token',
    rateLimit: {
        maxRequests: 100,        // Default: 100
        perMilliseconds: 60000,  // Default: 60000 (1 minute)
    },
});
```

### Request Timeouts

Configure request timeouts to prevent hanging requests:

```typescript
const client = createPcoClient({
    accessToken: 'your-token',
    timeout: 30000, // 30 seconds
});
```

### Retry Configuration

Configure automatic retry behavior:

```typescript
const client = createPcoClient({
    accessToken: 'your-token',
    retry: {
        maxRetries: 3,           // Default: 3
        baseDelay: 1000,         // Default: 1000ms
        maxDelay: 30000,         // Default: 30000ms
        onRetry: (error, attempt) => {
            console.log(`Retry attempt ${attempt} for ${error.context.endpoint}`);
        },
    },
});
```

### Custom Headers

```typescript
const client = createPcoClient({
    accessToken: 'your-token',
    headers: {
        'X-Custom-Header': 'value',
    },
});
```

### Custom Base URL

```typescript
const client = createPcoClient({
    accessToken: 'your-token',
    baseURL: 'https://api.planningcenteronline.com/people/v2',
});
```

## API Reference

### Core Functions

#### `createPcoClient(config: PcoClientConfig): PcoClientState`

Creates a new PCO client instance.

#### `getSingle<T>(client, endpoint, params?, context?): Promise<JsonApiResponse<T>>`

Makes a GET request for a single resource.

#### `getList<T>(client, endpoint, params?, context?): Promise<Paginated<T>>`

Makes a GET request for a list of resources.

#### `post<T>(client, endpoint, data, params?, context?): Promise<JsonApiResponse<T>>`

Makes a POST request to create a resource.

#### `patch<T>(client, endpoint, data, params?, context?): Promise<JsonApiResponse<T>>`

Makes a PATCH request to update a resource.

#### `del(client, endpoint, params?, context?): Promise<void>`

Makes a DELETE request to remove a resource.

#### `getAllPages<T>(client, endpoint, params?, context?): Promise<T[]>`

Automatically fetches all pages of a paginated resource.

### People API Functions

#### People

- `getPeople(client, params?, context?)` - Get all people
- `getPerson(client, id, include?, context?)` - Get a single person
- `createPerson(client, data, context?)` - Create a new person
- `updatePerson(client, id, data, context?)` - Update a person
- `deletePerson(client, id, context?)` - Delete a person

#### Emails

- `getPersonEmails(client, personId, context?)` - Get all emails for a person
- `createPersonEmail(client, personId, data, context?)` - Create an email for a person

#### Phone Numbers

- `getPersonPhoneNumbers(client, personId, context?)` - Get all phone numbers for a person
- `createPersonPhoneNumber(client, personId, data, context?)` - Create a phone number for a person

#### Addresses

- `getPersonAddresses(client, personId, context?)` - Get all addresses for a person
- `createPersonAddress(client, personId, data, context?)` - Create an address for a person

#### Households

- `getHouseholds(client, params?, context?)` - Get all households
- `getHousehold(client, id, include?, context?)` - Get a single household

#### Field Definitions

- `getFieldDefinitions(client, params?, context?)` - Get all field definitions
- `getFieldOptions(client, fieldDefinitionId, context?)` - Get options for a field definition
- `createFieldOption(client, fieldDefinitionId, data, context?)` - Create a field option

#### Social Profiles

- `getPersonSocialProfiles(client, personId, context?)` - Get social profiles for a person
- `createPersonSocialProfile(client, personId, data, context?)` - Create a social profile for a person

## Enhanced Error Handling

The library provides comprehensive error handling with categorized errors, severity levels, and smart retry logic.

### Error Categories

```typescript
import { ErrorCategory, ErrorSeverity } from '@planning-center-people-ts';

// Error categories for monitoring and handling
ErrorCategory.AUTHENTICATION    // 401 errors
ErrorCategory.AUTHORIZATION     // 403 errors
ErrorCategory.RATE_LIMIT        // 429 errors
ErrorCategory.VALIDATION        // 400/422 errors
ErrorCategory.NETWORK           // Connection/timeout errors
ErrorCategory.EXTERNAL_API      // 5xx server errors
ErrorCategory.TIMEOUT           // Request timeout errors
ErrorCategory.UNKNOWN           // Unknown errors

// Severity levels for prioritization
ErrorSeverity.LOW       // Validation errors, etc.
ErrorSeverity.MEDIUM    // Rate limits, network issues
ErrorSeverity.HIGH      // Auth errors, server errors
ErrorSeverity.CRITICAL  // Critical system failures
```

### Basic Error Handling

```typescript
import { PcoError, ErrorCategory } from '@planning-center-people-ts';

try {
    const people = await getPeople(client);
} catch (error) {
    if (error instanceof PcoError) {
        console.error('PCO Error:', {
            message: error.message,
            status: error.status,
            category: error.category,
            severity: error.severity,
            retryable: error.retryable,
            context: error.context,
        });

        // Handle different error categories
        switch (error.category) {
            case ErrorCategory.AUTHENTICATION:
                console.error('Authentication failed - check your token');
                break;
            case ErrorCategory.RATE_LIMIT:
                console.error('Rate limited - retry after:', error.getRetryDelay(), 'ms');
                break;
            case ErrorCategory.VALIDATION:
                console.error('Validation error - check your request data');
                break;
            case ErrorCategory.NETWORK:
                console.error('Network error - check your connection');
                break;
        }
    }
}
```

### Custom Retry Logic

```typescript
import { retryWithBackoff } from '@planning-center-people-ts';

const result = await retryWithBackoff(
    () => getPerson(client, 'person-id'),
    {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 10000,
        context: {
            endpoint: '/people/person-id',
            method: 'GET',
            metadata: { custom_retry: true },
        },
        onRetry: (error, attempt) => {
            console.log(`Retry attempt ${attempt} for ${error.context.endpoint}`);
        },
    }
);
```

### Error Boundary Wrapper

```typescript
import { withErrorBoundary } from '@planning-center-people-ts';

const result = await withErrorBoundary(
    () => createPerson(client, personData),
    {
        endpoint: '/people',
        method: 'POST',
        metadata: { operation: 'create_person' },
    }
);
```

### Error Context

All API functions accept an optional `context` parameter for better error tracking:

```typescript
const people = await getPeople(client, { per_page: 10 }, {
    metadata: { 
        operation: 'fetch_people_list',
        user_id: 'user123',
        batch_id: 'batch456',
    },
});
```

## Type Safety

All functions are fully typed with TypeScript:

```typescript
// TypeScript knows exactly what properties are available
const person = await getPerson(client, 'person-id');
console.log(person.data?.attributes?.first_name); // ✅ TypeScript knows this exists
console.log(person.data?.attributes?.invalid_prop); // ❌ TypeScript error

// Creating resources is type-safe
const newPerson = await createPerson(client, {
    first_name: 'John', // ✅ Valid property
    invalid_prop: 'value', // ❌ TypeScript error
});
```

## Rate Limiting

Rate limiting is handled automatically:

```typescript
// Check current rate limit status
const rateLimitInfo = getRateLimitInfo(client);
console.log('Requests used:', rateLimitInfo.requestsUsed);
console.log('Requests remaining:', rateLimitInfo.requestsRemaining);
console.log('Window resets in:', rateLimitInfo.windowResetsIn);
```

## Pagination

Handle pagination manually or automatically:

```typescript
// Manual pagination
const people = await getPeople(client, { per_page: 10 });
if (people.links?.next) {
    const nextPage = await getPeople(client, { page: 2 });
}

// Automatic pagination (gets all pages)
const allPeople = await getAllPages(client, '/people');
```

## Environment Support

This package uses the native fetch API, which is available in:

- **Node.js 18+** (built-in)
- **All modern browsers** (built-in)
- **Deno** (built-in)

For older Node.js versions, you can use a fetch polyfill:

```bash
npm install node-fetch
```

```typescript
import fetch from 'node-fetch';
global.fetch = fetch;
```

## Migration from Class-based Approach

If you were using the previous class-based approach:

```typescript
// Old way (class-based)
const client = new PcoClient(config);
const people = await client.getPeople();

// New way (functional)
const client = createPcoClient(config);
const people = await getPeople(client);
```

## Testing

### Unit Tests

Run the comprehensive unit test suite:

```bash
npm test              # Run all unit tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
npm run test:ci       # Run tests for CI/CD
```

The unit tests cover:

- Rate limiting functionality
- Error handling and retry logic
- Core client operations
- All People API functions
- Type safety and edge cases

### Integration Tests

Test against the real PCO API to validate functionality:

```bash
npm run test:integration
```

**Prerequisites:**

1. Copy `.env.test.example` to `.env.test`
2. Fill in your PCO credentials:

   ```env
   PCO_APP_ID=your_app_id_here
   PCO_APP_SECRET=your_app_secret_here
   # OR use OAuth:
   # PCO_ACCESS_TOKEN=your_token_here
   ```

3. Ensure your PCO app has People API permissions

**What Integration Tests Cover:**

- Authentication and configuration
- Read operations (people, households, field definitions)
- Write operations with automatic cleanup
- Rate limiting and performance
- Error handling with real API responses
- Concurrent request handling
- **Runtime type validation** - All 11 core resource types validated against real API responses

**Type Validation:**

The integration tests include comprehensive runtime validation to ensure TypeScript types match actual PCO API responses:

- ✅ **11 Resource Types Validated**: Person, Email, PhoneNumber, Address, Household, SocialProfile, FieldDefinition, FieldOption, FieldDatum, WorkflowCard, WorkflowCardNote
- ✅ **Attribute Type Checking**: Validates all attributes match expected types (string, number, boolean, date, null)
- ✅ **Relationship Validation**: Ensures relationship structures conform to JSON:API specification
- ✅ **Pagination Validation**: Validates links and metadata structures
- ✅ **API Change Detection**: Catches breaking changes in PCO API immediately

See [TYPE_VALIDATION_SUMMARY.md](./TYPE_VALIDATION_SUMMARY.md) for detailed documentation on type validation coverage and approaches for the remaining 11 resource types.

**Safety Features:**

- All test data is automatically cleaned up
- Uses descriptive test names (e.g., "TEST_INTEGRATION_2025")
- Respects PCO rate limits (90 requests per 20 seconds)
- 30-second timeout per test
- Comprehensive error handling

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests (both unit and integration)
5. Submit a pull request

## 📚 Comprehensive Documentation

This library includes extensive documentation covering all aspects of usage:

- **[📖 Complete Documentation](./docs/README.md)** - Comprehensive guide covering all features
- **[🚀 Getting Started](./docs/OVERVIEW.md)** - What this library does and why you should use it
- **[⚙️ Installation Guide](./docs/INSTALLATION.md)** - Complete setup instructions for all environments
- **[🔐 Authentication Guide](./docs/AUTHENTICATION.md)** - All authentication methods and token management
- **[📋 API Reference](./docs/API_REFERENCE.md)** - Complete reference for all 40+ functions
- **[💡 Examples & Patterns](./docs/EXAMPLES.md)** - Real-world examples and common patterns
- **[🛠️ Error Handling](./docs/ERROR_HANDLING.md)** - Advanced error management and recovery
- **[⚡ Performance Guide](./docs/PERFORMANCE.md)** - Optimization techniques and bulk operations
- **[🔧 Troubleshooting](./docs/TROUBLESHOOTING.md)** - Common issues and solutions
- **[🔄 Migration Guide](./docs/MIGRATION.md)** - Switching from other libraries
- **[⭐ Best Practices](./docs/BEST_PRACTICES.md)** - Production-ready patterns and security

## License

MIT
