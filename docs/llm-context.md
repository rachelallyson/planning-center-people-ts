# LLM Context (AI Assistant Map)

> **Purpose**: This file helps AI code editors (Cursor, Copilot, etc.) understand and use this package correctly without reading all source files.

## 🎯 Start Here

- **Main Entry**: [docs/index.md](./index.md) - Complete documentation index
- **Core Concepts**: [docs/concepts.md](./concepts.md) - Architecture and mental models
- **Configuration**: [docs/reference/config.md](./reference/config.md) - All config options
- **Public API**: [src/index.ts](../src/index.ts) - Public exports source of truth
- **API Docs**: [docs/api/](../api/) - Generated API documentation

## 🏗️ Package Overview

**Package**: `@rachelallyson/planning-center-people-ts` v2.8.0  
**Type**: TypeScript library (no CLI, no Prisma schema)  
**Purpose**: Type-safe client for Planning Center Online People API

## 🔑 Invariants (Must Always Be True)

- **Authentication**: OAuth requires `onRefresh` and `onRefreshFailure` callbacks (v2.1.0+)
- **Rate Limits**: 100 requests per 20 seconds (hard limit per PCO API)
- **JSON:API**: All responses follow JSON:API 1.0 specification
- **Timestamps**: All dates/times are UTC ISO 8601 strings
- **Idempotency**: Create operations are idempotent (use `findOrCreate` to prevent duplicates)
- **Type Safety**: All public APIs are strictly typed (no `any` types)
- **Error Handling**: All errors extend `PcoApiError` or `PcoError` with `category` and `severity`
- **Pagination**: List endpoints return `Paginated<T>` with `links.next` for pagination
- **Batch Operations**: Use `client.batch.execute()` for multiple operations; reference previous results with `$N.id`

## 📦 Public Surface (Exports from src/index.ts)

### Main Classes

- `PcoClient` - Main client class (class-based API v2.0+)
- `PcoClientManager` - Client caching and lifecycle management

### Configuration Types

- `PcoClientConfig` - Main client configuration
- `PcoAuthConfig` - Authentication config (union: PersonalAccessTokenAuth | OAuthAuth | BasicAuth)
- `PersonalAccessTokenAuth` - PAT authentication
- `OAuthAuth` - OAuth 2.0 authentication (requires refresh callbacks)

### Event System

- `PcoEvent` - Event union type
- `EventHandler<T>` - Event handler type
- `EventType` - All event types

### Batch Operations

- `BatchOperation` - Batch operation definition
- `BatchResult` - Batch execution result
- `BatchOptions` - Batch configuration
- `BatchSummary` - Batch execution summary

### Core Types

- `Paginated<T>` - Paginated response wrapper
- `Relationship` - JSON:API relationship
- `ResourceIdentifier` - Resource identifier
- `ResourceObject<T>` - Resource object wrapper

### Resource Types (People, Fields, Workflows, etc.)

- All exported from `./types` - See src/index.ts lines 32-101

### Error Handling

- `PcoApiError` - API error class
- `PcoError` - Enhanced error class with category/severity
- `ErrorCategory` - Error categories enum
- `ErrorSeverity` - Error severity enum
- `retryWithBackoff()` - Retry utility
- `withErrorBoundary()` - Error boundary wrapper

### Helper Functions

- `createPersonWithContact()` - Create person with contacts
- `searchPeople()` - Search people helper
- `validatePersonData()` - Validation helper
- Many more - See src/index.ts lines 208-232

### Performance Utilities

- `batchFetchPersonDetails()` - Batch fetching
- `processInBatches()` - Batch processing
- `fetchAllPages()` - Pagination helper
- `ApiCache` - Caching utility
- `PerformanceMonitor` - Performance monitoring

### Testing Utilities (for tests only)

- `MockPcoClient` - Mock client for testing
- `createMockClient()` - Mock client factory
- See src/index.ts lines 248-259

## 🚀 Common Tasks

### 1. Create Client

```typescript
import { PcoClient } from '@rachelallyson/planning-center-people-ts';

const client = new PcoClient({
  auth: { type: 'personal_access_token', personalAccessToken: 'token' }
});
```

### 2. Find or Create Person

```typescript
const person = await client.people.findOrCreate({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  matchStrategy: 'fuzzy'
});
```

### 3. Set Custom Field

```typescript
await client.fields.setPersonFieldBySlug(personId, 'BIRTHDATE', '1990-01-01');
```

### 4. Pagination

```typescript
// Automatic pagination
const allPeople = await client.people.getAllPages({ perPage: 25 });

// Manual pagination
const page = await client.people.getAll({ perPage: 25 });
if (page.links?.next) { /* fetch next page */ }
```

### 5. Batch Operations

```typescript
const results = await client.batch.execute([
  { type: 'people.create', data: { firstName: 'John', lastName: 'Doe' } },
  { type: 'people.addEmail', personId: '$0.id', data: { address: 'john@example.com' } }
]);
```

## ❌ Don'ts (Critical Rules)

1. **Don't invent configuration keys** - Only use keys documented in `docs/reference/config.md`
2. **Don't deep import** - Use exports from `src/index.ts` only (e.g., `import { PcoClient } from '@rachelallyson/planning-center-people-ts'`)
3. **Don't use `new Client()`** - Use `new PcoClient()` (v2.0+ class-based API)
4. **Don't skip OAuth refresh callbacks** - OAuth requires `onRefresh` and `onRefreshFailure` (v2.1.0+)
5. **Don't ignore rate limits** - Library handles automatically, but respect 100 req/20s limit
6. **Don't use v1.x functional API** - Use v2.0+ class-based API (`client.people.getAll()` not `getPeople(client)`)
7. **Don't create duplicate people** - Use `findOrCreate()` with `matchStrategy: 'fuzzy'` to prevent duplicates
8. **Don't hardcode tokens** - Use environment variables or secure storage
9. **Don't bypass error handling** - All operations can throw `PcoApiError` or `PcoError`
10. **Don't assume pagination** - Check `links.next` before fetching next page

## 🔧 Configuration Environment Variables

- `PCO_APP_ID` - Optional: Used for OAuth token refresh if not in config
- `PCO_APP_SECRET` - Optional: Used for OAuth token refresh if not in config
- `PCO_ACCESS_TOKEN` - Optional: Can be used in examples/tests

## 📚 Key Documentation Files

- **[Quick Start](./guides/quickstart.md)** - 5-minute setup guide
- **[Pagination](./guides/pagination.md)** - Pagination patterns
- **[Error Handling](./guides/error-handling.md)** - Error handling guide
- **[Config Reference](./reference/config.md)** - All configuration options
- **[Examples](./recipes/examples.md)** - Copy-paste code snippets
- **[Troubleshooting](./troubleshooting.md)** - Common issues and fixes

## 🧪 Testing Pattern

```typescript
import { createMockClient } from '@rachelallyson/planning-center-people-ts';

const mockClient = createMockClient({
  // Mock responses
});
```

## 🎯 Module Structure

All modules follow this pattern:

- `client.<module>.getAll()` - Get paginated list
- `client.<module>.getById(id)` - Get single resource
- `client.<module>.create(data)` - Create resource
- `client.<module>.update(id, data)` - Update resource
- `client.<module>.delete(id)` - Delete resource
- `client.<module>.getAllPages()` - Get all pages automatically

## 🔍 Finding Code

- **Client implementation**: `src/client.ts`
- **HTTP client**: `src/core/http.ts`
- **Module implementations**: `src/modules/*.ts`
- **Type definitions**: `src/types/*.ts`
- **Error handling**: `src/error-handling.ts`, `src/api-error.ts`
- **Rate limiting**: `src/rate-limiter.ts`
- **Batch operations**: `src/batch.ts`
- **Matching logic**: `src/matching/*.ts`

---

**For AI Editors**: Always prefer public exports from `src/index.ts`. Read `docs/reference/config.md` before adding configuration. Test changes with existing test patterns in `tests/`.
