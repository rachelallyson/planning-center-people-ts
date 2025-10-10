# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.2.0] - 2025-01-17

### 🏢 **NEW FEATURE - Campus Management Support**

This release adds comprehensive Campus management functionality to the Planning Center People API client.

### Added

#### **🏢 Campus Module**

- **Complete Campus CRUD Operations**: Create, read, update, and delete campuses
- **Campus-Specific Operations**: Get campus lists and service times
- **Type-Safe Campus Resource**: Full TypeScript support for campus attributes and relationships
- **Pagination Support**: Automatic pagination for campus listings

#### **📋 Campus Operations**

- `client.campus.getAll()` - Get all campuses with filtering and pagination
- `client.campus.getById(id, include?)` - Get specific campus by ID
- `client.campus.create(data)` - Create new campus
- `client.campus.update(id, data)` - Update existing campus
- `client.campus.delete(id)` - Delete campus
- `client.campus.getLists(campusId)` - Get lists for a specific campus
- `client.campus.getServiceTimes(campusId)` - Get service times for a specific campus
- `client.campus.getAllPagesPaginated()` - Get all campuses with automatic pagination

#### **🏗️ Campus Resource Structure**

- **Location Data**: `latitude`, `longitude`, `street`, `city`, `state`, `zip`, `country`
- **Contact Information**: `phone_number`, `website`
- **Settings**: `twenty_four_hour_time`, `date_format`, `church_center_enabled`
- **Metadata**: `description`, `created_at`, `updated_at`

### Documentation

- **Updated README.md** with Campus Management examples
- **Updated EXAMPLES.md** with comprehensive Campus usage patterns
- **Updated API_REFERENCE.md** with complete Campus Module documentation
- **Added Campus types** to resource types documentation

### Testing

- **Integration Tests**: Complete test suite for Campus operations
- **Type Safety**: Full TypeScript coverage for Campus resources
- **Error Handling**: Comprehensive error handling for Campus operations

### Example Usage

```typescript
import { PcoClient } from '@rachelallyson/planning-center-people-ts';

const client = new PcoClient({
  auth: {
    type: 'personal_access_token',
    personalAccessToken: 'your-token'
  }
});

// Get all campuses
const campuses = await client.campus.getAll();

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

// Get campus-specific data
const campusLists = await client.campus.getLists('campus-id');
const serviceTimes = await client.campus.getServiceTimes('campus-id');
```

## [2.1.0] - 2025-01-17

### 🔒 **SECURITY RELEASE - Required Refresh Token Handling**

This release addresses a critical security issue where OAuth 2.0 clients could lose access when tokens expire without proper refresh handling.

### Breaking Changes

- **OAuth 2.0 Authentication**: `onRefresh` and `onRefreshFailure` callbacks are now **required** for OAuth configurations
- **Type Safety**: Enhanced type-safe authentication configuration prevents invalid configurations at compile time

### Security

- **CRITICAL**: OAuth 2.0 authentication now requires refresh token handling to prevent token loss
- **BREAKING**: Type-safe authentication configuration enforces required fields
- Enhanced token refresh implementation with proper error handling
- Improved authentication type safety with union types

### Fixed

- Fixed person matching to properly handle default fuzzy strategy
- Fixed mock client to support createWithContacts method
- Fixed event system tests to work with mock client
- Fixed phone number builder in mock response builder

### Migration from v2.0.0

**Before (v2.0.0):**

```typescript
const client = new PcoClient({
  auth: {
    type: 'oauth',
    accessToken: 'access-token',
    refreshToken: 'refresh-token'
    // Missing required callbacks - this will now cause TypeScript errors
  }
});
```

**After (v2.1.0):**

```typescript
const client = new PcoClient({
  auth: {
    type: 'oauth',
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    // REQUIRED: Handle token refresh to prevent token loss
    onRefresh: async (tokens) => {
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

## [2.0.0] - 2025-01-17

### 🚀 **MAJOR RELEASE - Complete API Redesign**

This is a **breaking change** release that completely redesigns the API for better developer experience, type safety, and maintainability.

### Added

#### **🏗️ New Class-Based Architecture**

- **PcoClient Class**: Main client with modular architecture
- **PcoClientManager**: Automatic client caching and lifecycle management
- **Event System**: Comprehensive event emission for monitoring and debugging
- **Module Architecture**: Organized API interactions into focused modules

#### **🔧 Core Utilities**

- **Built-in Pagination**: `getAllPages()` method for automatic pagination
- **Batch Operations**: Execute multiple operations with dependency resolution
- **Person Matching**: Smart person matching with fuzzy logic and `findOrCreate`
- **Type-Safe Field Operations**: Enhanced custom field operations with caching
- **Workflow State Management**: Smart workflow operations with duplicate detection

#### **📦 New Modules**

- **PeopleModule**: Core person operations with smart matching
- **FieldsModule**: Type-safe custom field operations with caching
- **WorkflowsModule**: Complete workflow and workflow card management
- **ContactsModule**: Email, phone, address, and social profile management
- **HouseholdsModule**: Household operations and member management
- **NotesModule**: Note and note category operations
- **ListsModule**: List and list category operations with rule-based membership

#### **🔐 Enhanced Authentication**

- **OAuth 2.0 Support**: Full OAuth with automatic token refresh
- **Personal Access Token**: HTTP Basic Auth support
- **Token Refresh**: Automatic refresh with callback support
- **Environment Persistence**: Automatic token persistence in test environments

#### **⚡ Performance & Reliability**

- **Rate Limiting**: Built-in rate limiting (100 req/min)
- **Error Handling**: Comprehensive error handling with retry logic
- **Request Timeouts**: Configurable request timeouts
- **Event Monitoring**: Real-time request/response monitoring

#### **🧪 Testing Infrastructure**

- **MockPcoClient**: Complete mock implementation for testing
- **MockResponseBuilder**: Response building utilities
- **RequestRecorder**: Request recording for testing
- **Integration Tests**: 129 comprehensive integration tests

### Changed

#### **🔄 Breaking Changes**

- **API Design**: Complete redesign from functional to class-based approach
- **Import Structure**: New import structure with `PcoClient` class
- **Method Names**: Updated method names for consistency
- **Type Definitions**: Enhanced type definitions with better type safety

#### **📈 Improvements**

- **Type Safety**: Enhanced TypeScript support with strict typing
- **Error Messages**: More descriptive error messages and handling
- **Documentation**: Comprehensive inline documentation
- **Performance**: Optimized request handling and caching

### Migration Guide

#### **Before (v1.x)**

```typescript
import { createPcoClient, getPeople, createPerson } from '@rachelallyson/planning-center-people-ts';

const client = createPcoClient({
    personalAccessToken: 'your-token',
    appId: 'your-app-id',
    appSecret: 'your-app-secret'
});

const people = await getPeople(client, { per_page: 10 });
const person = await createPerson(client, { first_name: 'John', last_name: 'Doe' });
```

#### **After (v2.0.0)**

```typescript
import { PcoClient } from '@rachelallyson/planning-center-people-ts';

const client = new PcoClient({
    auth: {
        type: 'personal_access_token',
        personalAccessToken: 'your-token'
    }
});

const people = await client.people.getAll({ perPage: 10 });
const person = await client.people.create({ first_name: 'John', last_name: 'Doe' });
```

### Removed

- **Functional API**: All functional API methods removed in favor of class-based approach
- **Legacy Types**: Old type definitions replaced with enhanced versions
- **Deprecated Methods**: All deprecated methods removed

### Fixed

- **Type Safety**: Resolved all TypeScript strict mode issues
- **Error Handling**: Improved error handling and retry logic
- **Rate Limiting**: Fixed rate limiting edge cases
- **Authentication**: Resolved token refresh and persistence issues
- Fixed person matching to properly handle default fuzzy strategy
- Fixed mock client to support createWithContacts method
- Fixed event system tests to work with mock client
- Fixed phone number builder in mock response builder

## [1.1.0] - 2025-10-08

### Added

- **Complete API Modularization**: Split monolithic `people.ts` into 9 focused modules for better maintainability
- **36 New API Functions**: Complete coverage of all PCO People API endpoints
- **File Upload Support**: New file handling capabilities with smart field type detection
- **Comprehensive Integration Tests**: 9 new integration test suites with 2,660+ lines of test coverage
- **Enhanced Helper Functions**: New file processing utilities and validation functions
- **Complete Function Checklist**: Comprehensive documentation of all available functions

### New API Functions

#### Core People Operations (`src/people/core.ts`)

- `getPeople()` - Get all people with filtering and pagination
- `getPerson()` - Get single person by ID
- `createPerson()` - Create new person
- `updatePerson()` - Update existing person
- `deletePerson()` - Delete person

#### Contact Management (`src/people/contacts.ts`)

- `getPersonEmails()` - Get all emails for a person
- `createPersonEmail()` - Create email for a person
- `getPersonPhoneNumbers()` - Get all phone numbers for a person
- `createPersonPhoneNumber()` - Create phone number for a person
- `getPersonAddresses()` - Get all addresses for a person
- `createPersonAddress()` - Create address for a person
- `updatePersonAddress()` - Update existing address
- `getPersonSocialProfiles()` - Get social profiles for a person
- `createPersonSocialProfile()` - Create social profile for a person
- `deleteSocialProfile()` - Delete social profile

#### Field Data Management (`src/people/fields.ts`)

- `createPersonFieldData()` - Create field data with smart file handling
- `deletePersonFieldData()` - Delete field data
- `getPersonFieldData()` - Get custom field data for a person
- `getFieldDefinitions()` - Get all field definitions
- `getFieldDefinition()` - Get single field definition
- `getFieldOptions()` - Get field options for a field definition
- `createFieldOption()` - Create field option
- `getTabs()` - Get field definition tabs
- `createFieldDefinition()` - Create new field definition
- `deleteFieldDefinition()` - Delete field definition

#### Household Operations (`src/people/households.ts`)

- `getHouseholds()` - Get all households
- `getHousehold()` - Get single household by ID

#### List Management (`src/people/lists.ts`)

- `getLists()` - Get all people lists
- `getListById()` - Get single list by ID
- `getListCategories()` - Get all list categories

#### Note Operations (`src/people/notes.ts`)

- `getNotes()` - Get all notes
- `getNote()` - Get single note by ID
- `getNoteCategories()` - Get all note categories

#### Workflow Management (`src/people/workflows.ts`)

- `getWorkflowCardNotes()` - Get notes for a workflow card
- `createWorkflowCardNote()` - Create note for workflow card
- `getWorkflowCards()` - Get workflow cards for a person
- `createWorkflowCard()` - Create workflow card for a person
- `getWorkflows()` - Get all workflows
- `getWorkflow()` - Get single workflow by ID

#### Organization Operations (`src/people/organization.ts`)

- `getOrganization()` - Get organization information

### New Helper Functions

#### File Upload Utilities

- `extractFileUrl()` - Extract clean URLs from HTML markup
- `isFileUrl()` - Check if string is a valid file URL
- `getFileExtension()` - Extract file extension from URL
- `getFilename()` - Extract filename from URL
- `isFileUpload()` - Detect if value contains file upload
- `processFileValue()` - Smart processing of file values based on field type

#### Enhanced Validation

- `validatePersonData()` - Comprehensive person data validation
- `isValidEmail()` - Email format validation
- `isValidPhone()` - Phone number format validation

#### Utility Functions

- `formatPersonName()` - Format person names with nickname support
- `formatDate()` - Flexible date formatting
- `calculateAge()` - Calculate age from birthdate
- `buildQueryParams()` - Transform complex params to flat query params

### Testing

- **9 New Integration Test Suites**: Complete integration testing for all API modules
- **2,660+ Lines of Test Code**: Comprehensive test coverage for all new functions
- **File Upload Testing**: Dedicated tests for file handling functionality
- **Edge Case Coverage**: Testing for error scenarios and edge cases
- **Type Validation**: Runtime validation of all API responses

### Documentation

- **Function Checklist**: Complete documentation of all 36 available functions
- **File Upload Examples**: New example showing file upload usage patterns
- **Updated API Guide**: Enhanced documentation with new function examples
- **Usage Examples**: Comprehensive examples for all new functionality

### Changed

- **Modular Architecture**: Restructured codebase for better maintainability and organization
- **Enhanced Error Handling**: Improved error handling across all new functions
- **Type Safety**: Enhanced TypeScript definitions for all new functions
- **Performance**: Optimized API calls with better parameter handling

### Technical Improvements

- **Better Code Organization**: Logical separation of concerns across modules
- **Consistent Patterns**: Standardized function signatures and error handling
- **Enhanced TypeScript**: Improved type definitions and inference
- **Comprehensive Testing**: Full test coverage for all new functionality
- **Documentation**: Complete API documentation and usage examples

## [1.0.0] - 2025-01-08

### Added

- **Complete PCO People API Client**: Full TypeScript client for Planning Center Online People API
- **22 Resource Types**: Complete type definitions for all PCO People API resources
- **Runtime Type Validation**: Comprehensive validation against real API responses
- **Advanced Error Handling**: 7 different error handling strategies with automatic recovery
- **Performance Optimization**: Caching, streaming, batch processing, and memory management
- **Helper Functions**: 15+ helper functions for common operations
- **Comprehensive Testing**: 125 tests covering unit, integration, and edge cases
- **Production Features**: Circuit breakers, retry logic, rate limiting, and monitoring

### Core Features

- **TypeScript Support**: 100% TypeScript with strict type checking
- **JSON:API 1.0 Compliance**: Follows JSON:API specification exactly
- **Rate Limiting**: Built-in rate limiting with PCO's 100 req/min policy
- **Authentication**: Supports Personal Access Tokens and OAuth 2.0
- **Modern HTTP**: Uses native fetch API (no external dependencies)
- **Functional Approach**: Clean, composable functions instead of classes

### API Coverage

- **Person Management**: Create, read, update, delete people
- **Contact Information**: Manage emails, phone numbers, addresses
- **Households**: Family and household management
- **Field Definitions**: Custom fields and field data
- **Workflows**: Workflow cards and notes
- **Lists**: People lists and categories
- **Notes**: Person notes and categories
- **Organization**: Organization information and statistics

### Error Handling

- **Exponential Backoff**: Configurable retry with jitter
- **Circuit Breaker**: Fault tolerance pattern
- **Bulk Operations**: Individual error handling for bulk operations
- **Timeout Handling**: Configurable operation timeouts
- **Error Classification**: Intelligent error categorization
- **Error Recovery**: Automatic recovery strategies
- **Error Reporting**: Detailed error analysis and reporting

### Performance Features

- **Caching**: In-memory cache with TTL support
- **Streaming**: Memory-efficient processing of large datasets
- **Batch Processing**: Efficient API call batching
- **Pagination**: Automatic pagination with progress tracking
- **Memory Management**: Large dataset processing without memory issues
- **Performance Monitoring**: Built-in performance metrics
- **Concurrency Control**: Semaphore-based rate limiting
- **Adaptive Rate Limiting**: Dynamic rate adjustment

### Helper Functions

- **Person Management**: Complete person profiles, contact creation, search
- **Workflow Management**: Workflow cards with notes, bulk operations
- **Data Export**: Export all people data with filtering
- **Validation**: Data validation before API calls
- **Formatting**: Name formatting, date formatting, age calculation
- **Contact Management**: Primary contact extraction, validation

### Testing

- **Unit Tests**: 95 tests covering all core functionality
- **Integration Tests**: 23 tests against real PCO API
- **Edge Case Tests**: 7 tests for error scenarios and edge cases
- **Type Validation**: Runtime validation of all 22 resource types
- **100% Test Success Rate**: All 125 tests passing

### Documentation

- **API Usage Guide**: Comprehensive 9-section usage guide
- **Type Safety**: Complete TypeScript definitions with examples
- **Best Practices**: Performance optimization and error handling patterns
- **Troubleshooting**: Common issues and solutions
- **Examples**: Basic, advanced, and functional usage examples

### Production Readiness

- **Enterprise Features**: Circuit breakers, monitoring, error recovery
- **Scalability**: Memory-efficient processing for large datasets
- **Reliability**: Comprehensive error handling and retry logic
- **Performance**: Optimized for high-volume operations
- **Monitoring**: Built-in performance and error metrics
- **Type Safety**: Runtime validation ensures API compatibility

## [0.1.0] - 2024-01-XX

### Added

- Initial package structure
- Basic PCO People API client
- Core type definitions
- Basic error handling
- Rate limiting implementation
