# Core Concepts

This document explains the core mental models, invariants, and architectural patterns used in this library.

## Architecture Overview

### Class-Based Design (v2.0+)

The library uses a **class-based architecture** with a main `PcoClient` class and specialized modules:

```typescript
const client = new PcoClient({
  auth: { type: 'personal_access_token', personalAccessToken: 'token' }
});

// Access modules via client properties
client.people.getAll();
client.fields.setPersonFieldBySlug();
client.workflows.addPersonToWorkflow();
```

### Module Architecture

The client exposes 11 specialized modules, each handling a specific domain:

- **`people`** - Person CRUD, matching, relationships
- **`fields`** - Custom field definitions and data
- **`workflows`** - Workflow cards and state management
- **`contacts`** - Emails, phones, addresses, social profiles
- **`households`** - Household management
- **`notes`** - Person notes and categories
- **`lists`** - People lists and categories
- **`campus`** - Campus management
- **`serviceTime`** - Service time management
- **`forms`** - Forms, submissions, and field data
- **`reports`** - Report management

Each module follows consistent patterns (see [Patterns](#patterns) below).

## Mental Models

### 1. JSON:API Compliance

All API responses follow the [JSON:API 1.0 specification](https://jsonapi.org/):

- **Resource Objects**: `{ type, id, attributes, relationships }`
- **Resource Collections**: `{ data: ResourceObject[], links, meta }`
- **Included Resources**: Related resources in `included` array
- **Links**: Pagination and relationship links

```typescript
// Single resource response
{
  data: {
    type: 'Person',
    id: '123',
    attributes: { first_name: 'John', last_name: 'Doe' },
    relationships: { emails: { data: [{ type: 'Email', id: '456' }] } }
  },
  included: [
    { type: 'Email', id: '456', attributes: { address: 'john@example.com' } }
  ]
}

// Paginated list response
{
  data: [{ type: 'Person', id: '123', attributes: {...} }],
  links: {
    self: '/people?page=1',
    next: '/people?page=2',
    last: '/people?page=10'
  },
  meta: { total_count: 245 }
}
```

### 2. Authentication Lifecycle

Three authentication methods with different lifecycles:

#### Personal Access Token (PAT)

- **Stable**: Never expires (unless revoked)
- **Use Case**: Single-user applications, scripts
- **No Refresh**: Direct authentication

#### OAuth 2.0

- **Expires**: Access tokens expire (typically 1 hour)
- **Refresh Required**: Must handle refresh via callbacks
- **Invariant**: `onRefresh` and `onRefreshFailure` are **required** (v2.1.0+)
- **Use Case**: Multi-user applications, web apps

```typescript
// OAuth requires refresh handling
const client = new PcoClient({
  auth: {
    type: 'oauth',
    accessToken: 'token',
    refreshToken: 'refresh-token',
    onRefresh: async (tokens) => {
      // REQUIRED: Save new tokens
      await saveTokens(tokens);
    },
    onRefreshFailure: async (error) => {
      // REQUIRED: Handle refresh failure
      await handleAuthFailure(error);
    }
  }
});
```

#### Basic Auth

- **App Credentials**: Uses `appId` and `appSecret`
- **Server-to-Server**: For server-side integrations

### 3. Rate Limiting

**Hard Limit**: 100 requests per 20 seconds (enforced by Planning Center API)

The library automatically:

- **Tracks**: Request count and window timing
- **Waits**: Blocks requests when limit reached
- **Respects Headers**: Uses `X-PCO-API-Request-Rate-Limit` and `X-PCO-API-Request-Rate-Period`
- **Emits Events**: Fires `rate:limit` events when approaching limit

```typescript
// Library handles automatically
await client.people.getAll(); // Automatically waits if at limit

// Monitor rate limit status
const info = client.getRateLimitInfo();
console.log(`${info.remaining} requests remaining`);
```

### 4. Pagination Model

Two pagination patterns:

#### Automatic Pagination

```typescript
// Fetches all pages automatically
const allPeople = await client.people.getAllPages({ perPage: 25 });
// Returns: { data: PersonResource[], meta: {...} }
```

#### Manual Pagination

```typescript
// Fetch one page at a time
const page = await client.people.getAll({ perPage: 25 });
// Check for next page
if (page.links?.next) {
  const nextPage = await client.people.getAll({ perPage: 25, page: 2 });
}
```

**Invariants**:

- `links.next` is present if more pages exist
- `links.self` is always present
- `meta.total_count` may be present (optional)

### 5. Error Handling Model

All errors extend `PcoError` or `PcoApiError` with:

- **Category**: `ErrorCategory` enum (AUTHENTICATION, RATE_LIMIT, VALIDATION, etc.)
- **Severity**: `ErrorSeverity` enum (LOW, MEDIUM, HIGH, CRITICAL)
- **Retryable**: Boolean indicating if operation should be retried
- **Context**: Request context (endpoint, method, metadata)

```typescript
try {
  await client.people.create({ first_name: 'John' });
} catch (error) {
  if (error instanceof PcoError) {
    console.log(error.category); // ErrorCategory.VALIDATION
    console.log(error.severity);  // ErrorSeverity.LOW
    console.log(error.retryable); // false
  }
}
```

### 6. Person Matching Model

The `findOrCreate()` method uses intelligent matching:

- **Exact Matching**: Matches exact names (case-insensitive)
- **Fuzzy Matching**: Uses Levenshtein distance for name similarity
- **Email Matching**: Exact email address matching
- **Phone Matching**: Normalized phone number matching
- **Scoring**: Weighted scoring (name: 40%, email: 30%, phone: 15%, age: 15%)
- **Threshold**: Minimum score for match (default: 0.5)

```typescript
// Fuzzy matching (default)
const person = await client.people.findOrCreate({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  matchStrategy: 'fuzzy' // or 'exact'
});
```

### 7. Batch Operations Model

Batch operations execute multiple operations with dependency resolution:

- **Ordered Execution**: Operations execute in order
- **Reference Resolution**: Use `$N.id` to reference previous operation results
- **Partial Success**: Some operations can succeed while others fail
- **Dependency Tracking**: Automatic dependency resolution

```typescript
const results = await client.batch.execute([
  { type: 'people.create', data: { firstName: 'John' } },
  { type: 'people.addEmail', personId: '$0.id', data: { address: 'john@example.com' } }
]);
// $0.id references the person created in step 0
```

## Patterns

### Module Pattern

All modules follow this consistent pattern:

```typescript
// List operations
getAll(params?: QueryParams): Promise<Paginated<Resource>>
getAllPages(params?: QueryParams): Promise<Paginated<Resource>>

// Single resource operations
getById(id: string, include?: string[]): Promise<ResourceResponse<Resource>>

// Mutations
create(data: CreateData): Promise<ResourceResponse<Resource>>
update(id: string, data: UpdateData): Promise<ResourceResponse<Resource>>
delete(id: string): Promise<void>
```

### Query Parameters Pattern

Query parameters use consistent naming:

- `perPage` - Items per page (default: 25, max: 100)
- `page` - Page number (1-indexed)
- `include` - Related resources to include (array of strings)
- `where` - Filter conditions (object with field conditions)
- `order` - Sort order (string like `'first_name'` or `'-created_at'`)

```typescript
// Example query
const people = await client.people.getAll({
  perPage: 50,
  include: ['emails', 'phone_numbers'],
  where: { status: 'active' },
  order: 'first_name'
});
```

### Error Context Pattern

All operations support optional error context:

```typescript
await client.people.create(
  { first_name: 'John' },
  {
    metadata: {
      operation: 'import_user',
      user_id: 'user-123',
      batch_id: 'batch-456'
    }
  }
);
```

Context is included in error objects for better debugging.

## Data Invariants

### Timestamps

- **Format**: UTC ISO 8601 strings (`YYYY-MM-DDTHH:mm:ss.sssZ`)
- **Examples**: `'2025-01-11T12:00:00.000Z'`
- **Timezone**: Always UTC (no timezone conversion)

### IDs

- **Format**: String (no numeric IDs)
- **Examples**: `'person-123'`, `'email-456'`
- **Uniqueness**: Guaranteed per resource type

### Relationships

- **Optional**: All relationships are optional (can be `null`)
- **Structure**: Follow JSON:API relationship structure
- **Included**: Use `include` parameter to fetch related resources

### File Uploads

- **Detection**: Library automatically detects file URLs in HTML
- **Processing**: Handles file uploads to PCO's upload service
- **Field Types**: Only applies to `file` type fields

## Lifecycle

### Client Lifecycle

1. **Instantiation**: `new PcoClient(config)` creates client
2. **Module Initialization**: All modules initialized automatically
3. **HTTP Client**: Internal HTTP client handles all requests
4. **Rate Limiting**: Rate limiter initialized (100 req/20s)
5. **Event System**: Event emitter initialized for monitoring

### Request Lifecycle

1. **Rate Limit Check**: Wait if at limit
2. **Request Start Event**: Emit `request:start` event
3. **HTTP Request**: Make authenticated request
4. **Response Handling**: Parse JSON:API response
5. **Error Handling**: Wrap errors in `PcoApiError` or `PcoError`
6. **Request Complete Event**: Emit `request:complete` or `request:error` event
7. **Rate Limit Update**: Update rate limit tracking

### Token Refresh Lifecycle (OAuth)

1. **401 Response**: Detect expired token
2. **Refresh Attempt**: Call refresh endpoint with refresh token
3. **Success**: Call `onRefresh` callback with new tokens
4. **Retry Request**: Retry original request with new token
5. **Failure**: Call `onRefreshFailure` callback

## Performance Considerations

### Caching

Field definitions can be cached:

- **TTL**: Configurable (default: 5 minutes)
- **Max Size**: Configurable (default: 1000 entries)
- **Scope**: Field definitions only (not person data)

### Batch Operations

Use batch operations for multiple mutations:

- **Efficiency**: Fewer HTTP requests
- **Dependency Resolution**: Automatic reference resolution
- **Error Isolation**: Individual operation errors don't fail entire batch

### Pagination

- **Automatic**: Use `getAllPages()` for convenience
- **Manual**: Use `getAll()` for control over pagination
- **Large Datasets**: Use streaming for very large datasets (see `streamPeopleData()`)

## Security Considerations

### Token Storage

- **Never Commit**: Never commit tokens to version control
- **Environment Variables**: Use environment variables or secure storage
- **Refresh Handling**: Always persist refreshed tokens

### Rate Limiting

- **Respect Limits**: Library handles automatically, but don't bypass
- **Monitor**: Use event system to monitor rate limit status
- **Backoff**: Library uses exponential backoff for retries

### Error Exposure

- **Sanitize**: Don't expose internal error details to end users
- **Logging**: Log errors with context for debugging
- **Monitoring**: Use event system for error monitoring

---

**Next**: See [Quick Start Guide](./guides/quickstart.md) for practical examples.
