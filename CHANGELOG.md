# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
