# Repository Rules for AI Code Editors

This file contains rules and guidelines for AI code editors (Cursor, Copilot, etc.) working with this repository.

## Critical Rules

### Always Read These Files First

When generating code or making changes, always read:

1. **[docs/llm-context.md](../docs/llm-context.md)** - Quick reference for AI editors
2. **[docs/index.md](../docs/index.md)** - Documentation index
3. **[docs/concepts.md](../docs/concepts.md)** - Core mental models and architecture
4. **[docs/reference/config.md](../docs/reference/config.md)** - All configuration options
5. **[src/index.ts](../src/index.ts)** - Public API surface (source of truth)

### Public API Surface

**Always prefer public exports from `src/index.ts`:**

```typescript
// ✅ CORRECT: Use public exports
import { PcoClient, PcoError, ErrorCategory } from '@rachelallyson/planning-center-people-ts';

// ❌ WRONG: Deep imports
import { PcoClient } from '@rachelallyson/planning-center-people-ts/src/client';
```

**Never deep import from internal modules** - Only use exports from `src/index.ts`.

### Configuration Keys

**Never invent configuration keys** - Only use keys documented in:

- `docs/reference/config.md` - Complete config reference
- `docs/reference/config.schema.json` - JSON Schema for validation

**Examples**:

```typescript
// ✅ CORRECT: Use documented keys
const client = new PcoClient({
  auth: { type: 'personal_access_token', personalAccessToken: 'token' },
  caching: { fieldDefinitions: true, ttl: 300000 },
  retry: { maxRetries: 3 }
});

// ❌ WRONG: Invented keys
const client = new PcoClient({
  auth: { type: 'personal_access_token', personalAccessToken: 'token' },
  cache: { enabled: true }, // ❌ Wrong key name
  retries: 3 // ❌ Wrong key name
});
```

### Environment Variables

**Only use these environment variables**:

- `PCO_APP_ID` - Optional: Used for OAuth token refresh
- `PCO_APP_SECRET` - Optional: Used for OAuth token refresh
- `PCO_ACCESS_TOKEN` - Optional: Can be used in examples/tests

**Never invent new environment variables** - Only use those documented in `docs/reference/config.md`.

### API Patterns

**Always use v2.0+ class-based API:**

```typescript
// ✅ CORRECT: v2.0+ class-based API
const client = new PcoClient({ auth: { type: 'personal_access_token', personalAccessToken: 'token' } });
const people = await client.people.getAll();

// ❌ WRONG: v1.x functional API (deprecated)
import { createPcoClient, getPeople } from '@rachelallyson/planning-center-people-ts';
const client = createPcoClient({ personalAccessToken: 'token' });
const people = await getPeople(client);
```

### OAuth Configuration

**OAuth requires refresh callbacks (v2.1.0+):**

```typescript
// ✅ CORRECT: OAuth with required callbacks
const client = new PcoClient({
  auth: {
    type: 'oauth',
    accessToken: 'token',
    refreshToken: 'refresh-token',
    onRefresh: async (tokens) => await saveTokens(tokens),
    onRefreshFailure: async (error) => console.error(error)
  }
});

// ❌ WRONG: Missing required callbacks
const client = new PcoClient({
  auth: {
    type: 'oauth',
    accessToken: 'token',
    refreshToken: 'refresh-token'
    // Missing onRefresh and onRefreshFailure
  }
});
```

### Testing Patterns

**When uncertain, propose tests first:**

```typescript
// Before implementing, create test:
describe('new feature', () => {
  it('should work correctly', async () => {
    const client = createMockClient();
    // Test implementation
  });
});
```

**Use existing test patterns** from `tests/` directory:

- `tests/v2-client.test.ts` - Client tests
- `tests/integration/` - Integration tests
- `tests/setup.ts` - Test setup

### Database Code

**This library has no database** - It's a client library only. If you see references to Prisma or databases:

- ❌ **Don't add database code** - This is not a database-backed library
- ✅ **Use the HTTP client** - All data comes from Planning Center API
- ✅ **Use in-memory caching** - For field definitions only

### Error Handling

**Always handle errors properly:**

```typescript
// ✅ CORRECT: Proper error handling
try {
  await client.people.create({ first_name: 'John' });
} catch (error) {
  if (error instanceof PcoError) {
    switch (error.category) {
      case ErrorCategory.VALIDATION:
        // Handle validation error
        break;
      case ErrorCategory.RATE_LIMIT:
        // Handle rate limit
        break;
    }
  }
  throw error;
}
```

### Rate Limiting

**Respect rate limits** - Library handles automatically, but don't bypass:

- Limit: 100 requests per 20 seconds
- Library automatically waits when limit reached
- Monitor with `client.getRateLimitInfo()`

### Code Style

**Follow existing patterns:**

- Use TypeScript strict mode
- No `any` types (use proper types)
- Consistent naming (camelCase for variables, PascalCase for classes)
- Comprehensive error handling
- Add JSDoc comments for public APIs

### Module Structure

**All modules follow consistent patterns:**

```typescript
// Module structure:
class Module {
  getAll(params?: QueryParams): Promise<Paginated<Resource>>
  getById(id: string, include?: string[]): Promise<ResourceResponse<Resource>>
  create(data: CreateData): Promise<ResourceResponse<Resource>>
  update(id: string, data: UpdateData): Promise<ResourceResponse<Resource>>
  delete(id: string): Promise<void>
  getAllPages(params?: QueryParams): Promise<Paginated<Resource>>
}
```

### Type Definitions

**Use types from `src/types/`:**

- `src/types/index.ts` - Core types
- `src/types/client.ts` - Client config types
- `src/types/events.ts` - Event types
- `src/types/batch.ts` - Batch operation types

**Never create duplicate types** - Reuse existing types.

### Documentation

**When adding features:**

1. Update `docs/concepts.md` if adding new mental models
2. Update `docs/reference/config.md` if adding config options
3. Update `docs/recipes/examples.md` if adding common patterns
4. Update `docs/llm-context.md` if changing public API
5. Update `CHANGELOG.md` with changes

### Common Mistakes to Avoid

1. ❌ **Don't invent configuration keys** - Check `docs/reference/config.md`
2. ❌ **Don't deep import** - Use `src/index.ts` exports only
3. ❌ **Don't skip OAuth refresh callbacks** - Required in v2.1.0+
4. ❌ **Don't use v1.x API** - Use v2.0+ class-based API
5. ❌ **Don't add database code** - This is a client library only
6. ❌ **Don't bypass rate limits** - Library handles automatically
7. ❌ **Don't use `any` types** - Use proper TypeScript types
8. ❌ **Don't create duplicate types** - Reuse existing types

### When in Doubt

1. **Read the docs** - Start with `docs/llm-context.md`
2. **Check existing code** - Look at similar implementations
3. **Run tests** - Ensure tests pass before committing
4. **Ask** - If unclear, propose a solution and ask for review

---

**Remember**: This is a **client library** for Planning Center API. It doesn't manage databases, file systems, or local state beyond caching. All data comes from the API.
