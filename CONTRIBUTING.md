# Contributing Guide

Thank you for contributing to the Planning Center People TypeScript library!

## Prerequisites

- **Node.js**: >= 16.0.0
- **npm**: Latest version
- **TypeScript**: ^5.9.3

## Setup

1. **Clone the repository**:

   ```bash
   git clone https://github.com/rachelallyson/planning-center-people-ts.git
   cd planning-center-people-ts
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Build the project**:

   ```bash
   npm run build
   ```

## Development

### Running Tests

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run all tests (unit + edge cases)
npm run test:all

# Run integration tests (requires .env.test)
npm run test:integration
```

### Integration Tests

Integration tests require a `.env.test` file with PCO credentials:

```env
PCO_APP_ID=your_app_id
PCO_APP_SECRET=your_app_secret
# OR use OAuth:
# PCO_ACCESS_TOKEN=your_access_token
```

**Note**: Integration tests create real data in Planning Center. Use a test account!

### Building

```bash
# Build TypeScript
npm run build

# Build in watch mode (for development)
npm run dev

# Clean build artifacts
npm run clean
```

## Code Style

### TypeScript

- Use **strict mode** (enabled in `tsconfig.json`)
- No `any` types - use proper types
- Use `camelCase` for variables and functions
- Use `PascalCase` for classes and types
- Add JSDoc comments for public APIs

### Module Structure

All modules follow this pattern:

```typescript
class Module {
  getAll(params?: QueryParams): Promise<Paginated<Resource>>
  getById(id: string, include?: string[]): Promise<ResourceResponse<Resource>>
  create(data: CreateData): Promise<ResourceResponse<Resource>>
  update(id: string, data: UpdateData): Promise<ResourceResponse<Resource>>
  delete(id: string): Promise<void>
  getAllPages(params?: QueryParams): Promise<Paginated<Resource>>
}
```

### Error Handling

Always handle errors properly:

```typescript
try {
  await client.people.create({ first_name: 'John' });
} catch (error) {
  if (error instanceof PcoError) {
    switch (error.category) {
      case ErrorCategory.VALIDATION:
        // Handle validation error
        break;
    }
  }
  throw error;
}
```

## Testing

### Unit Tests

- Place tests in `tests/` directory
- Use descriptive test names
- Test both success and error cases
- Use mock clients for unit tests

```typescript
import { createMockClient } from '@rachelallyson/planning-center-people-ts';

describe('MyFeature', () => {
  it('should work correctly', async () => {
    const client = createMockClient({
      // Mock responses
    });
    
    const result = await client.people.getAll();
    expect(result.data).toHaveLength(0);
  });
});
```

### Integration Tests

- Place in `tests/integration/` directory
- Use `createTestClient()` helper
- Clean up test data after tests
- Use descriptive test names (e.g., "TEST_INTEGRATION_2025")

```typescript
import { createTestClient } from './test-config';

describe('Integration Test', () => {
  it('should create and delete person', async () => {
    const client = createTestClient();
    
    // Create test data
    const person = await client.people.create({
      first_name: 'TEST_INTEGRATION_2025'
    });
    
    // Test operations
    // ...
    
    // Cleanup
    await client.people.delete(person.id);
  });
});
```

### Test Coverage

- Aim for >80% coverage
- Check coverage with `npm run test:coverage`
- Coverage reports in `coverage/` directory

## Pull Request Process

1. **Create a feature branch**:

   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make your changes**:
   - Write code
   - Add tests
   - Update documentation

3. **Run tests**:

   ```bash
   npm run test:all
   npm run build
   ```

4. **Commit your changes**:

   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

5. **Push and create PR**:

   ```bash
   git push origin feature/my-feature
   ```

### Commit Message Format

Use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Test changes
- `refactor:` - Code refactoring
- `chore:` - Build/tooling changes

Examples:

- `feat: add person matching by age`
- `fix: resolve rate limit handling`
- `docs: update API reference`

### PR Checklist

- [ ] Code follows style guidelines
- [ ] Tests pass (`npm run test:all`)
- [ ] Build succeeds (`npm run build`)
- [ ] Documentation updated (if needed)
- [ ] CHANGELOG.md updated (if user-facing change)
- [ ] No TypeScript errors
- [ ] No linting errors

## Release Process

Releases are handled by maintainers:

1. **Version bump**: Update `package.json` version
2. **Update CHANGELOG.md**: Add release notes
3. **Build**: `npm run build`
4. **Test**: `npm run test:all`
5. **Publish**: `npm publish` (runs `prepublishOnly` script)

## Documentation

When adding features:

1. **Update concepts** (`docs/concepts.md`) - If adding new mental models
2. **Update config reference** (`docs/reference/config.md`) - If adding config options
3. **Update examples** (`docs/recipes/examples.md`) - If adding common patterns
4. **Update LLM context** (`docs/llm-context.md`) - If changing public API
5. **Update CHANGELOG.md** - For user-facing changes

## Type Definitions

- Place types in `src/types/` directory
- Export public types from `src/index.ts`
- Use strict typing (no `any`)
- Document complex types with JSDoc

## Error Handling

- Use `PcoError` for enhanced errors
- Use `PcoApiError` for HTTP errors
- Include error context for debugging
- Use appropriate error categories

## Questions?

- Check existing issues: <https://github.com/rachelallyson/planning-center-people-ts/issues>
- Review documentation: `docs/README.md`
- Read code examples: `examples/` directory

## Code of Conduct

Be respectful and professional in all interactions.

---

Thank you for contributing! 🎉
