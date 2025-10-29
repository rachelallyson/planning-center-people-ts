# Planning Center People TypeScript Library Documentation

Welcome to the comprehensive documentation for `@rachelallyson/planning-center-people-ts`, a type-safe TypeScript client for the Planning Center Online People API.

## 📚 Documentation Index

### 🚀 Getting Started

- **[Quick Start Guide](./guides/quickstart.md)** - Get up and running in 5 minutes
- **[Core Concepts](./concepts.md)** - Understanding the library's architecture and mental models
- **[Migration Guide](./MIGRATION_V2.md)** - Migrating from v1.x to v2.0+
- **[Authentication](./reference/config.md#authentication)** - Authentication methods and configuration

### 📖 Guides

- **[Pagination](./guides/pagination.md)** - How to handle paginated responses
- **[Error Handling](./guides/error-handling.md)** - Comprehensive error handling guide
- **[API Reference](./reference/)** - Complete API documentation

### 🎯 Reference

- **[Configuration](./reference/config.md)** - All configuration options, environment variables, and defaults
- **[API Reference](./api/)** - Generated TypeScript API documentation (TypeDoc)

### 🍳 Recipes & Examples

- **[Examples & Recipes](./recipes/examples.md)** - Copy-paste code snippets for common tasks
- **[Existing Examples](../examples/)** - Real-world usage examples in the codebase

### 🛠️ Troubleshooting

- **[Troubleshooting Guide](./troubleshooting.md)** - Common issues and solutions

### 🤖 AI Assistant Context

- **[LLM Context](./llm-context.md)** - Quick reference for AI code editors (Cursor, Copilot, etc.)

## 🏗️ Architecture Overview

This library provides a **class-based API** (v2.0+) with modular design:

- **`PcoClient`** - Main client class with 11 specialized modules
- **Modules**: `people`, `fields`, `workflows`, `contacts`, `households`, `notes`, `lists`, `campus`, `serviceTime`, `forms`, `reports`
- **Batch Operations** - Execute multiple operations with dependency resolution
- **Event System** - Monitor requests, errors, and rate limits
- **Smart Matching** - Find or create people with fuzzy/exact matching

## 📦 Installation

```bash
npm install @rachelallyson/planning-center-people-ts
```

## ⚡ Quick Example

```typescript
import { PcoClient } from '@rachelallyson/planning-center-people-ts';

const client = new PcoClient({
  auth: {
    type: 'personal_access_token',
    personalAccessToken: 'your-token'
  }
});

// Find or create a person
const person = await client.people.findOrCreate({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  matchStrategy: 'fuzzy'
});

// Set custom fields
await client.fields.setPersonFieldBySlug(person.id, 'BIRTHDATE', '1990-01-01');

// Add to workflow
await client.workflows.addPersonToWorkflow(person.id, 'workflow-id', {
  note: 'Added via integration'
});
```

## 🔑 Key Features

- ✅ **Type-Safe**: Full TypeScript support with strict typing
- ✅ **JSON:API Compliant**: Follows JSON:API 1.0 specification
- ✅ **Rate Limiting**: Built-in rate limiting (100 req/20s)
- ✅ **Authentication**: Personal Access Token, OAuth 2.0, Basic Auth
- ✅ **Error Handling**: Comprehensive error handling with retries
- ✅ **Batch Operations**: Execute multiple operations efficiently
- ✅ **Person Matching**: Smart fuzzy/exact matching to prevent duplicates
- ✅ **Event Monitoring**: Real-time request/response monitoring
- ✅ **Caching**: Optional field definition caching
- ✅ **File Uploads**: Smart file upload handling for custom fields

## 📋 Module Reference

| Module | Purpose | Key Methods |
|--------|---------|-------------|
| `people` | Person CRUD, matching, relationships | `getAll()`, `findOrCreate()`, `create()` |
| `fields` | Custom field definitions and data | `setPersonFieldBySlug()`, `getAllFieldDefinitions()` |
| `workflows` | Workflow cards and state management | `addPersonToWorkflow()`, `getAllPages()` |
| `contacts` | Emails, phones, addresses, social profiles | `createEmail()`, `createPhone()` |
| `households` | Household management | `getAll()`, `getById()` |
| `notes` | Person notes and categories | `getAll()`, `create()` |
| `lists` | People lists and categories | `getAll()`, `getById()` |
| `campus` | Campus management | `getAll()`, `create()` |
| `serviceTime` | Service time management | `getAll()`, `create()` |
| `forms` | Forms, submissions, and field data | `getAll()`, `getFormSubmissions()` |
| `reports` | Report management | `getAll()`, `create()` |

## 🔗 External Resources

- [Planning Center API Documentation](https://developer.planning.center/docs/#/people)
- [JSON:API Specification](https://jsonapi.org/)
- [Package Repository](https://github.com/rachelallyson/planning-center-people-ts)

## 📝 Version

This documentation is for **v2.8.0** of the library. See [CHANGELOG.md](../CHANGELOG.md) for release history.

## 🤝 Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for development setup, testing, and contribution guidelines.

---

**Next Steps**: Start with the [Quick Start Guide](./guides/quickstart.md) or read about [Core Concepts](./concepts.md).
