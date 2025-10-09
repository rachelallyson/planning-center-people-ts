# API Reference

Complete reference for all 40+ functions available in the Planning Center People TypeScript library.

## Table of Contents

1. [Core Functions](#core-functions)
2. [People Operations](#people-operations)
3. [Contact Management](#contact-management)
4. [Field Data Management](#field-data-management)
5. [Household Management](#household-management)
6. [List Management](#list-management)
7. [Note Management](#note-management)
8. [Workflow Management](#workflow-management)
9. [Organization Management](#organization-management)
10. [Error Handling Functions](#error-handling-functions)
11. [Helper Functions](#helper-functions)
12. [Performance Functions](#performance-functions)

## Core Functions

### `createPcoClient(config: PcoClientConfig): PcoClientState`

Creates a new PCO client instance with the specified configuration.

**Parameters:**

- `config` - Client configuration object

**Returns:** `PcoClientState` - Configured client instance

**Example:**

```typescript
import { createPcoClient } from '@rachelallyson/planning-center-people-ts';

const client = createPcoClient({
  appId: 'your-app-id',
  appSecret: 'your-app-secret',
  personalAccessToken: 'your-token',
});
```

### `getSingle<T>(client, endpoint, params?, context?): Promise<JsonApiResponse<T>>`

Makes a GET request for a single resource.

**Parameters:**

- `client` - PCO client instance
- `endpoint` - API endpoint path
- `params` - Optional query parameters
- `context` - Optional error context

**Returns:** `Promise<JsonApiResponse<T>>` - Single resource response

### `getList<T>(client, endpoint, params?, context?): Promise<Paginated<T>>`

Makes a GET request for a list of resources.

**Parameters:**

- `client` - PCO client instance
- `endpoint` - API endpoint path
- `params` - Optional query parameters
- `context` - Optional error context

**Returns:** `Promise<Paginated<T>>` - Paginated list response

### `post<T>(client, endpoint, data, params?, context?): Promise<JsonApiResponse<T>>`

Makes a POST request to create a resource.

**Parameters:**

- `client` - PCO client instance
- `endpoint` - API endpoint path
- `data` - Resource data to create
- `params` - Optional query parameters
- `context` - Optional error context

**Returns:** `Promise<JsonApiResponse<T>>` - Created resource response

### `patch<T>(client, endpoint, data, params?, context?): Promise<JsonApiResponse<T>>`

Makes a PATCH request to update a resource.

**Parameters:**

- `client` - PCO client instance
- `endpoint` - API endpoint path
- `data` - Resource data to update
- `params` - Optional query parameters
- `context` - Optional error context

**Returns:** `Promise<JsonApiResponse<T>>` - Updated resource response

### `del(client, endpoint, params?, context?): Promise<void>`

Makes a DELETE request to remove a resource.

**Parameters:**

- `client` - PCO client instance
- `endpoint` - API endpoint path
- `params` - Optional query parameters
- `context` - Optional error context

**Returns:** `Promise<void>`

### `getAllPages<T>(client, endpoint, params?, context?): Promise<T[]>`

Automatically fetches all pages of a paginated resource.

**Parameters:**

- `client` - PCO client instance
- `endpoint` - API endpoint path
- `params` - Optional query parameters
- `context` - Optional error context

**Returns:** `Promise<T[]>` - Array of all resources from all pages

### `getRateLimitInfo(client): RateLimitInfo`

Gets current rate limit information for the client.

**Parameters:**

- `client` - PCO client instance

**Returns:** `RateLimitInfo` - Current rate limit status

## People Operations

### `getPeople(client, params?, context?): Promise<PeopleList>`

Get all people with optional filtering and pagination.

**Parameters:**

- `client` - PCO client instance
- `params` - Optional parameters:
  - `where` - Filter conditions
  - `include` - Related resources to include
  - `per_page` - Number of results per page
  - `page` - Page number
- `context` - Optional error context

**Returns:** `Promise<PeopleList>` - List of people

**Example:**

```typescript
const people = await getPeople(client, {
  per_page: 50,
  include: ['emails', 'phone_numbers'],
  where: { first_name: 'John' }
});
```

### `getPerson(client, id, include?, context?): Promise<PersonSingle>`

Get a single person by ID.

**Parameters:**

- `client` - PCO client instance
- `id` - Person ID
- `include` - Optional array of related resources to include
- `context` - Optional error context

**Returns:** `Promise<PersonSingle>` - Single person resource

**Example:**

```typescript
const person = await getPerson(client, 'person-id', ['emails', 'phone_numbers']);
```

### `createPerson(client, data, context?): Promise<PersonSingle>`

Create a new person.

**Parameters:**

- `client` - PCO client instance
- `data` - Person data to create
- `context` - Optional error context

**Returns:** `Promise<PersonSingle>` - Created person resource

**Example:**

```typescript
const newPerson = await createPerson(client, {
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com'
});
```

### `updatePerson(client, id, data, context?): Promise<PersonSingle>`

Update a person.

**Parameters:**

- `client` - PCO client instance
- `id` - Person ID
- `data` - Person data to update
- `context` - Optional error context

**Returns:** `Promise<PersonSingle>` - Updated person resource

**Example:**

```typescript
const updatedPerson = await updatePerson(client, 'person-id', {
  first_name: 'Jane'
});
```

### `deletePerson(client, id, context?): Promise<void>`

Delete a person.

**Parameters:**

- `client` - PCO client instance
- `id` - Person ID
- `context` - Optional error context

**Returns:** `Promise<void>`

**Example:**

```typescript
await deletePerson(client, 'person-id');
```

## Contact Management

### Email Management

#### `getPersonEmails(client, personId, context?): Promise<EmailsList>`

Get all emails for a person.

**Parameters:**

- `client` - PCO client instance
- `personId` - Person ID
- `context` - Optional error context

**Returns:** `Promise<EmailsList>` - List of email resources

#### `createPersonEmail(client, personId, data, context?): Promise<EmailSingle>`

Create an email for a person.

**Parameters:**

- `client` - PCO client instance
- `personId` - Person ID
- `data` - Email data to create
- `context` - Optional error context

**Returns:** `Promise<EmailSingle>` - Created email resource

**Example:**

```typescript
const email = await createPersonEmail(client, 'person-id', {
  address: 'john.doe@example.com',
  location: 'work',
  primary: false
});
```

### Phone Number Management

#### `getPersonPhoneNumbers(client, personId, context?): Promise<PhoneNumbersList>`

Get all phone numbers for a person.

**Parameters:**

- `client` - PCO client instance
- `personId` - Person ID
- `context` - Optional error context

**Returns:** `Promise<PhoneNumbersList>` - List of phone number resources

#### `createPersonPhoneNumber(client, personId, data, context?): Promise<PhoneNumberSingle>`

Create a phone number for a person.

**Parameters:**

- `client` - PCO client instance
- `personId` - Person ID
- `data` - Phone number data to create
- `context` - Optional error context

**Returns:** `Promise<PhoneNumberSingle>` - Created phone number resource

**Example:**

```typescript
const phone = await createPersonPhoneNumber(client, 'person-id', {
  number: '+1-555-123-4567',
  location: 'mobile',
  primary: true
});
```

### Address Management

#### `getPersonAddresses(client, personId, context?): Promise<AddressesList>`

Get all addresses for a person.

**Parameters:**

- `client` - PCO client instance
- `personId` - Person ID
- `context` - Optional error context

**Returns:** `Promise<AddressesList>` - List of address resources

#### `createPersonAddress(client, personId, data, context?): Promise<AddressSingle>`

Create an address for a person.

**Parameters:**

- `client` - PCO client instance
- `personId` - Person ID
- `data` - Address data to create
- `context` - Optional error context

**Returns:** `Promise<AddressSingle>` - Created address resource

**Example:**

```typescript
const address = await createPersonAddress(client, 'person-id', {
  street: '123 Main St',
  city: 'Anytown',
  state: 'CA',
  zip: '12345',
  country: 'US',
  location: 'home'
});
```

#### `updatePersonAddress(client, personId, addressId, data, context?): Promise<AddressSingle>`

Update an address for a person.

**Parameters:**

- `client` - PCO client instance
- `personId` - Person ID
- `addressId` - Address ID
- `data` - Address data to update
- `context` - Optional error context

**Returns:** `Promise<AddressSingle>` - Updated address resource

### Social Profile Management

#### `getPersonSocialProfiles(client, personId, context?): Promise<SocialProfilesList>`

Get social profiles for a person.

**Parameters:**

- `client` - PCO client instance
- `personId` - Person ID
- `context` - Optional error context

**Returns:** `Promise<SocialProfilesList>` - List of social profile resources

#### `createPersonSocialProfile(client, personId, data, context?): Promise<SocialProfileSingle>`

Create a social profile for a person.

**Parameters:**

- `client` - PCO client instance
- `personId` - Person ID
- `data` - Social profile data to create
- `context` - Optional error context

**Returns:** `Promise<SocialProfileSingle>` - Created social profile resource

**Example:**

```typescript
const socialProfile = await createPersonSocialProfile(client, 'person-id', {
  service: 'facebook',
  username: 'johndoe',
  url: 'https://facebook.com/johndoe'
});
```

#### `deleteSocialProfile(client, personId, socialProfileId, context?): Promise<void>`

Delete a social profile for a person.

**Parameters:**

- `client` - PCO client instance
- `personId` - Person ID
- `socialProfileId` - Social profile ID
- `context` - Optional error context

**Returns:** `Promise<void>`

## Field Data Management

### Field Data Operations

#### `getPersonFieldData(client, personId, context?): Promise<FieldDataList>`

Get field data for a person (custom fields).

**Parameters:**

- `client` - PCO client instance
- `personId` - Person ID
- `context` - Optional error context

**Returns:** `Promise<FieldDataList>` - List of field data resources

#### `createPersonFieldData(client, personId, fieldDefinitionId, value, context?): Promise<FieldDataSingle>`

Create field data for a person with smart file upload handling.

**Parameters:**

- `client` - PCO client instance
- `personId` - Person ID
- `fieldDefinitionId` - Field definition ID
- `value` - Field value (supports file uploads)
- `context` - Optional error context

**Returns:** `Promise<FieldDataSingle>` - Created field data resource

**Example:**

```typescript
// Text field
const textField = await createPersonFieldData(
  client, 
  'person-id', 
  'field-def-id', 
  'Some text value'
);

// File field (automatically handles file uploads)
const fileField = await createPersonFieldData(
  client, 
  'person-id', 
  'field-def-id', 
  '<a href="https://example.com/document.pdf" download>View File</a>'
);
```

#### `deletePersonFieldData(client, personId, fieldDataId, context?): Promise<void>`

Delete field data for a person.

**Parameters:**

- `client` - PCO client instance
- `personId` - Person ID
- `fieldDataId` - Field data ID
- `context` - Optional error context

**Returns:** `Promise<void>`

### Field Definition Management

#### `getFieldDefinitions(client, params?, context?): Promise<FieldDefinitionsList>`

Get all field definitions.

**Parameters:**

- `client` - PCO client instance
- `params` - Optional parameters:
  - `where` - Filter conditions
  - `include` - Related resources to include
  - `per_page` - Number of results per page
  - `page` - Page number
- `context` - Optional error context

**Returns:** `Promise<FieldDefinitionsList>` - List of field definition resources

#### `getFieldDefinition(client, fieldDefinitionId, context?): Promise<FieldDefinitionSingle>`

Get a single field definition.

**Parameters:**

- `client` - PCO client instance
- `fieldDefinitionId` - Field definition ID
- `context` - Optional error context

**Returns:** `Promise<FieldDefinitionSingle>` - Single field definition resource

#### `createFieldDefinition(client, data, context?): Promise<FieldDefinitionSingle>`

Create a new field definition.

**Parameters:**

- `client` - PCO client instance
- `data` - Field definition data to create
- `context` - Optional error context

**Returns:** `Promise<FieldDefinitionSingle>` - Created field definition resource

**Example:**

```typescript
const fieldDef = await createFieldDefinition(client, {
  name: 'Emergency Contact',
  field_type: 'text',
  required: false,
  description: 'Emergency contact information'
});
```

#### `deleteFieldDefinition(client, fieldDefinitionId, context?): Promise<void>`

Delete a field definition.

**Parameters:**

- `client` - PCO client instance
- `fieldDefinitionId` - Field definition ID
- `context` - Optional error context

**Returns:** `Promise<void>`

### Field Options Management

#### `getFieldOptions(client, fieldDefinitionId, context?): Promise<FieldOptionsList>`

Get options for a field definition.

**Parameters:**

- `client` - PCO client instance
- `fieldDefinitionId` - Field definition ID
- `context` - Optional error context

**Returns:** `Promise<FieldOptionsList>` - List of field option resources

#### `createFieldOption(client, fieldDefinitionId, data, context?): Promise<FieldOptionSingle>`

Create a field option.

**Parameters:**

- `client` - PCO client instance
- `fieldDefinitionId` - Field definition ID
- `data` - Field option data to create
- `context` - Optional error context

**Returns:** `Promise<FieldOptionSingle>` - Created field option resource

**Example:**

```typescript
const option = await createFieldOption(client, 'field-def-id', {
  value: 'Option 1',
  sequence: 1
});
```

### Tabs Management

#### `getTabs(client, context?): Promise<TabsList>`

Get all tabs.

**Parameters:**

- `client` - PCO client instance
- `context` - Optional error context

**Returns:** `Promise<TabsList>` - List of tab resources

## Household Management

### `getHouseholds(client, params?, context?): Promise<HouseholdsList>`

Get all households.

**Parameters:**

- `client` - PCO client instance
- `params` - Optional parameters:
  - `include` - Related resources to include
  - `per_page` - Number of results per page
  - `page` - Page number
- `context` - Optional error context

**Returns:** `Promise<HouseholdsList>` - List of household resources

**Example:**

```typescript
const households = await getHouseholds(client, {
  per_page: 25,
  include: ['people']
});
```

### `getHousehold(client, id, include?, context?): Promise<HouseholdSingle>`

Get a single household.

**Parameters:**

- `client` - PCO client instance
- `id` - Household ID
- `include` - Optional array of related resources to include
- `context` - Optional error context

**Returns:** `Promise<HouseholdSingle>` - Single household resource

**Example:**

```typescript
const household = await getHousehold(client, 'household-id', ['people']);
```

## List Management

### `getLists(client, params?, context?): Promise<ListsList>`

Get all lists.

**Parameters:**

- `client` - PCO client instance
- `params` - Optional parameters:
  - `where` - Filter conditions
  - `include` - Related resources to include
  - `per_page` - Number of results per page
  - `page` - Page number
- `context` - Optional error context

**Returns:** `Promise<ListsList>` - List of list resources

### `getListById(client, listId, context?): Promise<ListSingle>`

Get a single list by ID.

**Parameters:**

- `client` - PCO client instance
- `listId` - List ID
- `context` - Optional error context

**Returns:** `Promise<ListSingle>` - Single list resource

### `getListCategories(client, context?): Promise<ListCategoriesList>`

Get all list categories.

**Parameters:**

- `client` - PCO client instance
- `context` - Optional error context

**Returns:** `Promise<ListCategoriesList>` - List of list category resources

## Note Management

### `getNotes(client, params?, context?): Promise<NotesList>`

Get all notes.

**Parameters:**

- `client` - PCO client instance
- `params` - Optional parameters:
  - `where` - Filter conditions
  - `include` - Related resources to include
  - `per_page` - Number of results per page
  - `page` - Page number
- `context` - Optional error context

**Returns:** `Promise<NotesList>` - List of note resources

### `getNote(client, noteId, params?, context?): Promise<NoteSingle>`

Get a single note.

**Parameters:**

- `client` - PCO client instance
- `noteId` - Note ID
- `params` - Optional parameters:
  - `where` - Filter conditions
  - `include` - Related resources to include
  - `per_page` - Number of results per page
  - `page` - Page number
- `context` - Optional error context

**Returns:** `Promise<NoteSingle>` - Single note resource

### `getNoteCategories(client, context?): Promise<NoteCategoriesList>`

Get all note categories.

**Parameters:**

- `client` - PCO client instance
- `context` - Optional error context

**Returns:** `Promise<NoteCategoriesList>` - List of note category resources

## Workflow Management

### Workflow Cards

#### `getWorkflowCards(client, params?, context?): Promise<WorkflowCardsList>`

Get all workflow cards.

**Parameters:**

- `client` - PCO client instance
- `params` - Optional parameters:
  - `where` - Filter conditions
  - `include` - Related resources to include
  - `per_page` - Number of results per page
  - `page` - Page number
- `context` - Optional error context

**Returns:** `Promise<WorkflowCardsList>` - List of workflow card resources

#### `createWorkflowCard(client, data, context?): Promise<WorkflowCardSingle>`

Create a workflow card.

**Parameters:**

- `client` - PCO client instance
- `data` - Workflow card data to create
- `context` - Optional error context

**Returns:** `Promise<WorkflowCardSingle>` - Created workflow card resource

**Example:**

```typescript
const workflowCard = await createWorkflowCard(client, {
  title: 'Follow up with new member',
  description: 'Call new member to welcome them',
  workflow_id: 'workflow-id',
  person_id: 'person-id'
});
```

### Workflow Card Notes

#### `getWorkflowCardNotes(client, workflowCardId, context?): Promise<WorkflowCardNotesList>`

Get notes for a workflow card.

**Parameters:**

- `client` - PCO client instance
- `workflowCardId` - Workflow card ID
- `context` - Optional error context

**Returns:** `Promise<WorkflowCardNotesList>` - List of workflow card note resources

#### `createWorkflowCardNote(client, workflowCardId, data, context?): Promise<WorkflowCardNoteSingle>`

Create a note for a workflow card.

**Parameters:**

- `client` - PCO client instance
- `workflowCardId` - Workflow card ID
- `data` - Note data to create
- `context` - Optional error context

**Returns:** `Promise<WorkflowCardNoteSingle>` - Created workflow card note resource

**Example:**

```typescript
const note = await createWorkflowCardNote(client, 'workflow-card-id', {
  content: 'Called and left voicemail. Will try again tomorrow.'
});
```

### Workflows

#### `getWorkflows(client, params?, context?): Promise<WorkflowsList>`

Get all workflows.

**Parameters:**

- `client` - PCO client instance
- `params` - Optional parameters:
  - `where` - Filter conditions
  - `include` - Related resources to include
  - `per_page` - Number of results per page
  - `page` - Page number
- `context` - Optional error context

**Returns:** `Promise<WorkflowsList>` - List of workflow resources

#### `getWorkflow(client, workflowId, params?, context?): Promise<WorkflowSingle>`

Get a single workflow.

**Parameters:**

- `client` - PCO client instance
- `workflowId` - Workflow ID
- `params` - Optional parameters:
  - `where` - Filter conditions
  - `include` - Related resources to include
  - `per_page` - Number of results per page
  - `page` - Page number
- `context` - Optional error context

**Returns:** `Promise<WorkflowSingle>` - Single workflow resource

## Organization Management

### `getOrganization(client, params?, context?): Promise<OrganizationSingle>`

Get organization information.

**Parameters:**

- `client` - PCO client instance
- `params` - Optional parameters:
  - `where` - Filter conditions
  - `include` - Related resources to include
  - `per_page` - Number of results per page
  - `page` - Page number
- `context` - Optional error context

**Returns:** `Promise<OrganizationSingle>` - Organization resource

**Example:**

```typescript
const organization = await getOrganization(client);
console.log(organization.data?.attributes?.name);
```

## Error Handling Functions

### `retryWithBackoff<T>(operation, config): Promise<T>`

Retry an operation with exponential backoff.

**Parameters:**

- `operation` - Function to retry
- `config` - Retry configuration:
  - `maxRetries` - Maximum number of retries
  - `baseDelay` - Base delay in milliseconds
  - `maxDelay` - Maximum delay in milliseconds
  - `context` - Error context
  - `onRetry` - Retry callback function

**Returns:** `Promise<T>` - Result of the operation

**Example:**

```typescript
const result = await retryWithBackoff(
  () => getPerson(client, 'person-id'),
  {
    maxRetries: 3,
    baseDelay: 1000,
    context: { endpoint: '/people/person-id', method: 'GET' }
  }
);
```

### `withErrorBoundary<T>(operation, context): Promise<T>`

Wrap an operation with error boundary handling.

**Parameters:**

- `operation` - Function to execute
- `context` - Error context

**Returns:** `Promise<T>` - Result of the operation

**Example:**

```typescript
const result = await withErrorBoundary(
  () => createPerson(client, personData),
  {
    endpoint: '/people',
    method: 'POST',
    metadata: { operation: 'create_person' }
  }
);
```

### `classifyError(error): ErrorCategory`

Classify an error into a category.

**Parameters:**

- `error` - Error to classify

**Returns:** `ErrorCategory` - Error category

### `shouldNotRetry(error): boolean`

Determine if an error should not be retried.

**Parameters:**

- `error` - Error to check

**Returns:** `boolean` - Whether the error should not be retried

## Helper Functions

### `buildQueryParams(params): Record<string, string>`

Build query parameters for API requests.

**Parameters:**

- `params` - Parameters object

**Returns:** `Record<string, string>` - Formatted query parameters

### `formatPersonName(person): string`

Format a person's name from their attributes.

**Parameters:**

- `person` - Person resource

**Returns:** `string` - Formatted name

### `getPrimaryContact(person): ContactInfo | null`

Get primary contact information for a person.

**Parameters:**

- `person` - Person resource

**Returns:** `ContactInfo | null` - Primary contact information

### `isValidEmail(email): boolean`

Validate an email address.

**Parameters:**

- `email` - Email address to validate

**Returns:** `boolean` - Whether the email is valid

### `isValidPhone(phone): boolean`

Validate a phone number.

**Parameters:**

- `phone` - Phone number to validate

**Returns:** `boolean` - Whether the phone number is valid

### File Upload Helpers

#### `isFileUpload(value): boolean`

Check if a value is a file upload.

**Parameters:**

- `value` - Value to check

**Returns:** `boolean` - Whether the value is a file upload

#### `extractFileUrl(value): string | null`

Extract file URL from HTML or plain text.

**Parameters:**

- `value` - Value to extract URL from

**Returns:** `string | null` - Extracted file URL

#### `processFileValue(value, fieldType): string | FileUploadData`

Process a file value for different field types.

**Parameters:**

- `value` - File value to process
- `fieldType` - Type of field ('text' or 'file')

**Returns:** `string | FileUploadData` - Processed value

## Performance Functions

### `batchFetchPersonDetails(client, personIds, options?): Promise<PersonResource[]>`

Fetch multiple person details in batches.

**Parameters:**

- `client` - PCO client instance
- `personIds` - Array of person IDs
- `options` - Optional batch options

**Returns:** `Promise<PersonResource[]>` - Array of person resources

### `processInBatches<T>(items, batchSize, processor): Promise<T[]>`

Process items in batches.

**Parameters:**

- `items` - Array of items to process
- `batchSize` - Size of each batch
- `processor` - Function to process each batch

**Returns:** `Promise<T[]>` - Array of processed results

### `streamPeopleData(client, options?): AsyncGenerator<PersonResource>`

Stream people data for large datasets.

**Parameters:**

- `client` - PCO client instance
- `options` - Optional streaming options

**Returns:** `AsyncGenerator<PersonResource>` - Generator of person resources

### `monitorPerformance<T>(operation, context?): Promise<T>`

Monitor the performance of an operation.

**Parameters:**

- `operation` - Function to monitor
- `context` - Optional performance context

**Returns:** `Promise<T>` - Result of the operation

## Type Definitions

### Common Types

```typescript
// Client configuration
interface PcoClientConfig {
  appId?: string;
  appSecret?: string;
  personalAccessToken?: string;
  accessToken?: string;
  refreshToken?: string;
  baseURL?: string;
  timeout?: number;
  rateLimit?: RateLimitConfig;
  retry?: RetryConfig;
  headers?: Record<string, string>;
  onTokenRefresh?: (tokens: TokenResponse) => Promise<void>;
  onTokenRefreshFailure?: (error: Error, context: ErrorContext) => Promise<void>;
}

// Error context
interface ErrorContext {
  endpoint: string;
  method: string;
  personId?: string;
  metadata?: Record<string, any>;
}

// Rate limit info
interface RateLimitInfo {
  requestsUsed: number;
  requestsRemaining: number;
  windowResetsIn: number;
  windowResetsAt: Date;
}
```

### Resource Types

All resource types follow the JSON:API specification:

```typescript
interface PersonResource {
  id: string;
  type: 'Person';
  attributes: PersonAttributes;
  relationships?: PersonRelationships;
}

interface PersonAttributes {
  first_name: string;
  last_name: string;
  email?: string;
  // ... other attributes
}
```

## Usage Examples

### Basic CRUD Operations

```typescript
import { 
  createPcoClient, 
  getPeople, 
  getPerson, 
  createPerson, 
  updatePerson, 
  deletePerson 
} from '@rachelallyson/planning-center-people-ts';

const client = createPcoClient({
  appId: 'your-app-id',
  appSecret: 'your-app-secret',
  personalAccessToken: 'your-token'
});

// Get all people
const people = await getPeople(client, { per_page: 50 });

// Get specific person
const person = await getPerson(client, 'person-id');

// Create person
const newPerson = await createPerson(client, {
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com'
});

// Update person
const updatedPerson = await updatePerson(client, 'person-id', {
  first_name: 'Jane'
});

// Delete person
await deletePerson(client, 'person-id');
```

### Contact Management

```typescript
import { 
  getPersonEmails, 
  createPersonEmail,
  getPersonPhoneNumbers,
  createPersonPhoneNumber 
} from '@rachelallyson/planning-center-people-ts';

// Get person's emails
const emails = await getPersonEmails(client, 'person-id');

// Add email
const email = await createPersonEmail(client, 'person-id', {
  address: 'john.doe@example.com',
  location: 'work',
  primary: false
});

// Get person's phone numbers
const phones = await getPersonPhoneNumbers(client, 'person-id');

// Add phone number
const phone = await createPersonPhoneNumber(client, 'person-id', {
  number: '+1-555-123-4567',
  location: 'mobile',
  primary: true
});
```

### Custom Fields

```typescript
import { 
  getFieldDefinitions,
  createPersonFieldData,
  getPersonFieldData 
} from '@rachelallyson/planning-center-people-ts';

// Get field definitions
const fieldDefs = await getFieldDefinitions(client);

// Create field data (with smart file upload handling)
const fieldData = await createPersonFieldData(
  client, 
  'person-id', 
  'field-def-id', 
  '<a href="https://example.com/document.pdf" download>View File</a>'
);

// Get person's field data
const personFieldData = await getPersonFieldData(client, 'person-id');
```

### Error Handling

```typescript
import { 
  PcoError, 
  ErrorCategory, 
  retryWithBackoff,
  withErrorBoundary 
} from '@rachelallyson/planning-center-people-ts';

try {
  const people = await getPeople(client);
} catch (error) {
  if (error instanceof PcoError) {
    console.error('PCO Error:', {
      message: error.message,
      category: error.category,
      severity: error.severity,
      retryable: error.retryable
    });
  }
}

// With retry logic
const result = await retryWithBackoff(
  () => getPerson(client, 'person-id'),
  {
    maxRetries: 3,
    baseDelay: 1000,
    context: { endpoint: '/people/person-id', method: 'GET' }
  }
);

// With error boundary
const result = await withErrorBoundary(
  () => createPerson(client, personData),
  {
    endpoint: '/people',
    method: 'POST',
    metadata: { operation: 'create_person' }
  }
);
```

## Next Steps

- 💡 **[Examples](./EXAMPLES.md)** - See real-world usage patterns
- 🛠️ **[Error Handling](./ERROR_HANDLING.md)** - Advanced error management
- ⚡ **[Performance Guide](./PERFORMANCE.md)** - Optimization techniques
- 🔧 **[Troubleshooting](./TROUBLESHOOTING.md)** - Common issues and solutions

---

*This API reference covers all 40+ functions available in the library. For more detailed examples and patterns, see the [Examples Guide](./EXAMPLES.md).*
