# Planning Center People TypeScript Library - Complete Overview

## What is this library?

The `@rachelallyson/planning-center-people-ts` library is a **strictly typed TypeScript client** for the Planning Center Online (PCO) People API. It's designed to provide a modern, functional, and type-safe way to interact with Planning Center's People management system.

## Key Features & Benefits

### 🎯 **Strict TypeScript Support**

- **Zero `any` types** - Every function, parameter, and response is fully typed
- **IntelliSense support** - Full autocomplete and type checking in your IDE
- **Compile-time safety** - Catch errors before runtime
- **JSON:API 1.0 compliant** - Follows the JSON:API specification exactly

### 🚀 **Modern Functional Architecture**

- **No classes** - Clean, composable functions instead of object-oriented patterns
- **Immutable design** - Functions don't modify state, making them predictable and testable
- **Tree-shakable** - Import only what you need, reducing bundle size
- **Functional composition** - Easy to combine and extend functionality

### ⚡ **Production-Ready Features**

- **Built-in rate limiting** - Respects PCO's 100 requests/minute limit automatically
- **Automatic retries** - Smart exponential backoff for transient failures
- **Request timeouts** - Configurable timeouts to prevent hanging requests
- **Comprehensive error handling** - Categorized errors with severity levels and retry logic
- **OAuth 2.0 support** - Full token refresh handling for multi-user applications

### 🔧 **Developer Experience**

- **Zero external dependencies** - Uses native fetch API (Node.js 18+, modern browsers)
- **Rich error context** - Detailed error information for debugging
- **Pagination support** - Automatic handling of paginated responses
- **File upload handling** - Smart detection and processing of file uploads for custom fields
- **Performance monitoring** - Built-in performance tracking and optimization tools

## What can you do with it?

### 👥 **People Management**

- Create, read, update, and delete people records
- Manage contact information (emails, phone numbers, addresses)
- Handle social profiles and custom field data
- Organize people into households and lists

### 📋 **Workflow Management**

- Create and manage workflow cards
- Add notes and comments to workflow cards
- Track workflow progress and assignments
- Organize workflows by categories

### 🏠 **Household & List Management**

- Group people into households
- Create and manage custom lists
- Organize people by categories and tags
- Export household and list data

### 📊 **Custom Fields & Data**

- Create custom field definitions
- Manage field options and validation
- Handle file uploads and attachments
- Store and retrieve custom data

### 🏢 **Organization Management**

- Access organization information
- Manage organization settings
- Handle multi-organization scenarios

## Who should use this library?

### ✅ **Perfect for:**

- **Church management systems** - Full-featured CRM for churches
- **Event management** - Track attendees and volunteers
- **Volunteer coordination** - Manage volunteer schedules and assignments
- **Member management** - Handle membership data and communications
- **Data migration** - Import/export people data between systems
- **Custom integrations** - Build custom tools that integrate with PCO

### 🎯 **Ideal use cases:**

- **Web applications** - React, Vue, Angular, or vanilla JS apps
- **Node.js backends** - Express, Next.js, or other server frameworks
- **Mobile apps** - React Native, Expo, or other mobile frameworks
- **Automation scripts** - Data processing and batch operations
- **API integrations** - Connect PCO with other church management tools

## Architecture & Design Principles

### 🏗️ **Functional Design**

```typescript
// Clean, predictable function calls
const client = createPcoClient(config);
const people = await getPeople(client, { per_page: 10 });
const person = await getPerson(client, 'person-id');
```

### 🔒 **Type Safety**

```typescript
// TypeScript knows exactly what's available
const person = await getPerson(client, 'person-id');
console.log(person.data?.attributes?.first_name); // ✅ Type-safe
console.log(person.data?.attributes?.invalid_prop); // ❌ Compile error
```

### 🛡️ **Error Handling**

```typescript
// Comprehensive error information
try {
  const people = await getPeople(client);
} catch (error) {
  if (error instanceof PcoError) {
    console.log('Category:', error.category); // AUTHENTICATION, RATE_LIMIT, etc.
    console.log('Severity:', error.severity); // LOW, MEDIUM, HIGH, CRITICAL
    console.log('Retryable:', error.retryable); // true/false
  }
}
```

### ⚡ **Performance**

```typescript
// Built-in optimizations
const client = createPcoClient({
  rateLimit: { maxRequests: 100, perMilliseconds: 60000 },
  timeout: 30000,
  retry: { maxRetries: 3, baseDelay: 1000 }
});
```

## Comparison with Alternatives

### 🆚 **vs. Official PCO SDKs**

- **Better TypeScript support** - Full type safety vs. partial typing
- **Modern architecture** - Functional vs. class-based
- **Better error handling** - Categorized errors vs. basic error objects
- **No external dependencies** - Native fetch vs. axios/request libraries

### 🆚 **vs. Raw API calls**

- **Type safety** - Compile-time validation vs. runtime errors
- **Rate limiting** - Automatic vs. manual implementation
- **Error handling** - Rich error context vs. basic HTTP errors
- **Retry logic** - Built-in vs. custom implementation
- **Pagination** - Automatic vs. manual page handling

### 🆚 **vs. Other PCO Libraries**

- **Active maintenance** - Regular updates and bug fixes
- **Comprehensive coverage** - All PCO People API endpoints
- **Production ready** - Battle-tested in real applications
- **Modern standards** - ES2020+, TypeScript 5+, Node.js 18+

## Getting Started

### 📦 **Installation**

```bash
npm install @rachelallyson/planning-center-people-ts
```

### 🚀 **Quick Start**

```typescript
import { createPcoClient, getPeople, createPerson } from '@rachelallyson/planning-center-people-ts';

// Create client
const client = createPcoClient({
  appId: 'your-app-id',
  appSecret: 'your-app-secret',
});

// Get people
const people = await getPeople(client, { per_page: 10 });

// Create person
const newPerson = await createPerson(client, {
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com'
});
```

## What's Next?

- 📖 **[Installation Guide](./INSTALLATION.md)** - Detailed setup instructions
- 🔐 **[Authentication Guide](./AUTHENTICATION.md)** - Complete auth setup
- 📚 **[API Reference](./API_REFERENCE.md)** - All 36+ functions documented
- 💡 **[Examples](./EXAMPLES.md)** - Real-world usage patterns
- 🛠️ **[Error Handling](./ERROR_HANDLING.md)** - Advanced error management
- ⚡ **[Performance Guide](./PERFORMANCE.md)** - Optimization techniques
- 🔧 **[Troubleshooting](./TROUBLESHOOTING.md)** - Common issues and solutions

## Support & Community

- 📖 **Documentation** - Comprehensive guides and examples
- 🐛 **Issues** - Report bugs and request features
- 💬 **Discussions** - Ask questions and share experiences
- 🔄 **Updates** - Regular releases with new features and improvements

---

*This library is actively maintained and designed for production use. It's built by developers who use Planning Center in real applications and understand the challenges of church management software.*
