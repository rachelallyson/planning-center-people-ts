# API Reference - v2.0.0

Complete reference for the Planning Center People TypeScript library v2.0.0 - Class-based API with modular architecture.

## Table of Contents

1. [PcoClient Class](#pco-client-class)
2. [People Module](#people-module)
3. [Fields Module](#fields-module)
4. [Workflows Module](#workflows-module)
5. [Contacts Module](#contacts-module)
6. [Households Module](#households-module)
7. [Notes Module](#notes-module)
8. [Lists Module](#lists-module)
9. [Organization Module](#organization-module)
10. [PcoClientManager](#pco-client-manager)
11. [PersonMatcher](#person-matcher)
12. [Event System](#event-system)
13. [Type Definitions](#type-definitions)

## PcoClient Class

The main client class for interacting with the Planning Center People API.

### Constructor

```typescript
new PcoClient(config: PcoClientConfig)
```

**Parameters:**

- `config` - Client configuration object

**Example:**

```typescript
import { PcoClient } from '@rachelallyson/planning-center-people-ts';

const client = new PcoClient({
  auth: {
    type: 'personal_access_token',
    personalAccessToken: 'your-token'
  }
});
```

### Configuration

```typescript
// Personal Access Token configuration
interface PersonalAccessTokenAuth {
  type: 'personal_access_token';
  personalAccessToken: string;
}

// OAuth 2.0 configuration (refresh token handling required)
interface OAuthAuth {
  type: 'oauth';
  accessToken: string;
  refreshToken: string;
  onRefresh: (tokens: { accessToken: string; refreshToken: string }) => Promise<void>;
  onRefreshFailure: (error: Error) => Promise<void>;
}

// Union type for authentication
type PcoAuthConfig = PersonalAccessTokenAuth | OAuthAuth;

interface PcoClientConfig {
  auth: PcoAuthConfig;
  rateLimit?: {
    maxRequests: number;
    perMilliseconds: number;
  };
  timeout?: number;
  baseURL?: string;
}
```

### Event System

The client extends EventEmitter and provides comprehensive event monitoring:

```typescript
// Listen to events
client.on('request:start', (event) => {
  console.log(`Starting ${event.method} ${event.endpoint}`);
});

client.on('request:complete', (event) => {
  console.log(`Completed in ${event.duration}ms`);
});

client.on('error', (event) => {
  console.error('API Error:', event.error.message);
});

client.on('rate:limit', (event) => {
  console.log('Rate limit reached:', event.retryAfter);
});
```

### Available Events

- `request:start` - Fired when a request starts
- `request:complete` - Fired when a request completes
- `error` - Fired when an error occurs
- `rate:limit` - Fired when rate limit is reached
- `auth:failure` - Fired when authentication fails

## People Module

Access via `client.people`

### Core Operations

#### `getAll(params?: GetPeopleParams): Promise<Paginated<PersonResource>>`

Get all people with optional filtering and pagination.

**Parameters:**

- `params` - Optional parameters:
  - `where` - Filter conditions
  - `include` - Related resources to include
  - `perPage` - Number of results per page
  - `page` - Page number

**Example:**

```typescript
const people = await client.people.getAll({
  perPage: 50,
  include: ['emails', 'phone_numbers'],
  where: { first_name: 'John' }
});
```

#### `getById(id: string, include?: string[]): Promise<PersonResource>`

Get a single person by ID.

**Parameters:**

- `id` - Person ID
- `include` - Optional array of related resources to include

**Example:**

```typescript
const person = await client.people.getById('person-id', ['emails', 'phone_numbers']);
```

#### `create(data: PersonAttributes): Promise<PersonResource>`

Create a new person.

**Parameters:**

- `data` - Person data to create

**Example:**

```typescript
const newPerson = await client.people.create({
  first_name: 'John',
  last_name: 'Doe',
  status: 'active'
});
```

#### `update(id: string, data: Partial<PersonAttributes>): Promise<PersonResource>`

Update a person.

**Parameters:**

- `id` - Person ID
- `data` - Person data to update

**Example:**

```typescript
const updatedPerson = await client.people.update('person-id', {
  first_name: 'Jane'
});
```

#### `delete(id: string): Promise<void>`

Delete a person.

**Parameters:**

- `id` - Person ID

**Example:**

```typescript
await client.people.delete('person-id');
```

### Advanced Operations

#### `createWithContacts(personData: PersonAttributes, contacts: ContactData): Promise<PersonResource>`

Create a person with initial contact information.

**Parameters:**

- `personData` - Person data
- `contacts` - Contact information (email, phone, address)

**Example:**

```typescript
const person = await client.people.createWithContacts(
  { first_name: 'John', last_name: 'Doe' },
  {
    email: { address: 'john@example.com', primary: true },
    phone: { number: '+1-555-123-4567', location: 'Mobile' }
  }
);
```

#### `findOrCreate(options: PersonMatchOptions): Promise<PersonResource>`

Find existing person or create new one with smart matching.

**Parameters:**

- `options` - Matching options:
  - `firstName` - First name
  - `lastName` - Last name
  - `email` - Email address (optional)
  - `matchStrategy` - 'exact' | 'fuzzy' (default: 'fuzzy')
  - `createIfNotFound` - Whether to create if not found (default: true)

**Example:**

```typescript
const person = await client.people.findOrCreate({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  matchStrategy: 'fuzzy'
});
```

### Contact Management

#### Email Operations

```typescript
// Get emails
const emails = await client.people.getEmails(personId);

// Add email
const email = await client.people.addEmail(personId, {
  address: 'john@example.com',
  location: 'Home',
  primary: true
});

// Update email
const updatedEmail = await client.people.updateEmail(personId, emailId, {
  location: 'Work'
});

// Delete email
await client.people.deleteEmail(personId, emailId);
```

#### Phone Operations

```typescript
// Get phone numbers
const phones = await client.people.getPhoneNumbers(personId);

// Add phone number
const phone = await client.people.addPhoneNumber(personId, {
  number: '+1-555-123-4567',
  location: 'Mobile',
  primary: true
});

// Update phone number
const updatedPhone = await client.people.updatePhoneNumber(personId, phoneId, {
  location: 'Work'
});

// Delete phone number
await client.people.deletePhoneNumber(personId, phoneId);
```

#### Address Operations

```typescript
// Get addresses
const addresses = await client.people.getAddresses(personId);

// Add address
const address = await client.people.addAddress(personId, {
  address1: '123 Main St',
  city: 'Anytown',
  state: 'CA',
  zip: '12345',
  location: 'Home'
});

// Update address
const updatedAddress = await client.people.updateAddress(personId, addressId, {
  city: 'New City'
});

// Delete address
await client.people.deleteAddress(personId, addressId);
```

#### Social Profile Operations

```typescript
// Get social profiles
const profiles = await client.people.getSocialProfiles(personId);

// Add social profile
const profile = await client.people.addSocialProfile(personId, {
  service: 'facebook',
  username: 'johndoe',
  url: 'https://facebook.com/johndoe'
});

// Delete social profile
await client.people.deleteSocialProfile(personId, profileId);
```

## Fields Module

Access via `client.fields`

### Field Definitions

#### `getFieldDefinitions(params?: GetFieldDefinitionsParams): Promise<Paginated<FieldDefinitionResource>>`

Get all field definitions.

**Example:**

```typescript
const fieldDefs = await client.fields.getFieldDefinitions();
```

#### `getFieldDefinitionById(id: string): Promise<FieldDefinitionResource>`

Get a single field definition.

**Example:**

```typescript
const fieldDef = await client.fields.getFieldDefinitionById('field-def-id');
```

#### `createFieldDefinition(data: FieldDefinitionAttributes): Promise<FieldDefinitionResource>`

Create a new field definition.

**Example:**

```typescript
const fieldDef = await client.fields.createFieldDefinition({
  name: 'Emergency Contact',
  field_type: 'text',
  required: false
});
```

#### `updateFieldDefinition(id: string, data: Partial<FieldDefinitionAttributes>): Promise<FieldDefinitionResource>`

Update a field definition.

**Example:**

```typescript
const updated = await client.fields.updateFieldDefinition('field-def-id', {
  name: 'Updated Name'
});
```

#### `deleteFieldDefinition(id: string): Promise<void>`

Delete a field definition.

**Example:**

```typescript
await client.fields.deleteFieldDefinition('field-def-id');
```

### Field Data Operations

#### `getPersonFieldData(personId: string): Promise<Paginated<FieldDatumResource>>`

Get field data for a person.

**Example:**

```typescript
const fieldData = await client.fields.getPersonFieldData('person-id');
```

#### `setPersonFieldById(personId: string, fieldDefinitionId: string, value: any): Promise<FieldDatumResource>`

Set field data for a person with smart file upload handling.

**Example:**

```typescript
// Text field
const textField = await client.fields.setPersonFieldById(
  'person-id', 
  'field-def-id', 
  'Some text value'
);

// File field (automatically handles file uploads)
const fileField = await client.fields.setPersonFieldById(
  'person-id', 
  'field-def-id', 
  '<a href="https://example.com/document.pdf" download>View File</a>'
);
```

#### `deletePersonFieldData(personId: string, fieldDataId: string): Promise<void>`

Delete field data for a person.

**Example:**

```typescript
await client.fields.deletePersonFieldData('person-id', 'field-data-id');
```

### Field Options

#### `getFieldOptions(fieldDefinitionId: string): Promise<Paginated<FieldOptionResource>>`

Get options for a field definition.

**Example:**

```typescript
const options = await client.fields.getFieldOptions('field-def-id');
```

#### `createFieldOption(fieldDefinitionId: string, data: FieldOptionAttributes): Promise<FieldOptionResource>`

Create a field option.

**Example:**

```typescript
const option = await client.fields.createFieldOption('field-def-id', {
  value: 'Option 1',
  sequence: 1
});
```

## Workflows Module

Access via `client.workflows`

### Workflow Operations

#### `getAll(params?: GetWorkflowsParams): Promise<Paginated<WorkflowResource>>`

Get all workflows.

**Example:**

```typescript
const workflows = await client.workflows.getAll();
```

#### `getById(id: string): Promise<WorkflowResource>`

Get a single workflow.

**Example:**

```typescript
const workflow = await client.workflows.getById('workflow-id');
```

#### `create(data: WorkflowAttributes): Promise<WorkflowResource>`

Create a new workflow.

**Example:**

```typescript
const workflow = await client.workflows.create({
  name: 'New Member Follow-up',
  description: 'Follow up with new members'
});
```

#### `update(id: string, data: Partial<WorkflowAttributes>): Promise<WorkflowResource>`

Update a workflow.

**Example:**

```typescript
const updated = await client.workflows.update('workflow-id', {
  name: 'Updated Name'
});
```

#### `delete(id: string): Promise<void>`

Delete a workflow.

**Example:**

```typescript
await client.workflows.delete('workflow-id');
```

### Workflow Card Operations

#### `getPersonWorkflowCards(personId: string, params?: GetWorkflowCardsParams): Promise<Paginated<WorkflowCardResource>>`

Get workflow cards for a person.

**Example:**

```typescript
const cards = await client.workflows.getPersonWorkflowCards('person-id');
```

#### `createWorkflowCard(personId: string, workflowId: string, data: WorkflowCardAttributes): Promise<WorkflowCardResource>`

Create a workflow card for a person.

**Example:**

```typescript
const card = await client.workflows.createWorkflowCard('person-id', 'workflow-id', {
  title: 'Follow up call',
  description: 'Call to discuss membership'
});
```

#### `updateWorkflowCard(workflowCardId: string, data: Partial<WorkflowCardAssignableAttributes>, personId?: string): Promise<WorkflowCardResource>`

Update a workflow card.

**Example:**

```typescript
const updated = await client.workflows.updateWorkflowCard('card-id', {
  sticky_assignment: true
}, 'person-id');
```

#### `deleteWorkflowCard(personId: string, workflowCardId: string): Promise<void>`

Delete a workflow card.

**Example:**

```typescript
await client.workflows.deleteWorkflowCard('person-id', 'card-id');
```

### Workflow Card Actions

#### `goBackWorkflowCard(personId: string, workflowCardId: string): Promise<WorkflowCardResource>`

Move workflow card back to previous step.

**Example:**

```typescript
const card = await client.workflows.goBackWorkflowCard('person-id', 'card-id');
```

#### `promoteWorkflowCard(personId: string, workflowCardId: string): Promise<WorkflowCardResource>`

Promote workflow card to next step.

**Example:**

```typescript
const card = await client.workflows.promoteWorkflowCard('person-id', 'card-id');
```

#### `removeWorkflowCard(personId: string, workflowCardId: string): Promise<WorkflowCardResource>`

Remove workflow card.

**Example:**

```typescript
const card = await client.workflows.removeWorkflowCard('person-id', 'card-id');
```

#### `restoreWorkflowCard(personId: string, workflowCardId: string): Promise<WorkflowCardResource>`

Restore removed workflow card.

**Example:**

```typescript
const card = await client.workflows.restoreWorkflowCard('person-id', 'card-id');
```

#### `sendEmailWorkflowCard(personId: string, workflowCardId: string, data: WorkflowCardEmailAttributes): Promise<WorkflowCardResource>`

Send email from workflow card.

**Example:**

```typescript
const card = await client.workflows.sendEmailWorkflowCard('person-id', 'card-id', {
  subject: 'Follow up',
  note: 'Thank you for your interest'
});
```

#### `skipStepWorkflowCard(personId: string, workflowCardId: string): Promise<WorkflowCardResource>`

Skip current step in workflow.

**Example:**

```typescript
const card = await client.workflows.skipStepWorkflowCard('person-id', 'card-id');
```

#### `snoozeWorkflowCard(personId: string, workflowCardId: string, data: WorkflowCardSnoozeAttributes): Promise<WorkflowCardResource>`

Snooze workflow card.

**Example:**

```typescript
const card = await client.workflows.snoozeWorkflowCard('person-id', 'card-id', {
  duration: 7 // days
});
```

#### `unsnoozeWorkflowCard(personId: string, workflowCardId: string): Promise<WorkflowCardResource>`

Unsnooze workflow card.

**Example:**

```typescript
const card = await client.workflows.unsnoozeWorkflowCard('person-id', 'card-id');
```

### Workflow Card Notes

#### `getWorkflowCardNotes(personId: string, workflowCardId: string): Promise<Paginated<WorkflowCardNoteResource>>`

Get notes for a workflow card.

**Example:**

```typescript
const notes = await client.workflows.getWorkflowCardNotes('person-id', 'card-id');
```

#### `createWorkflowCardNote(personId: string, workflowCardId: string, data: WorkflowCardNoteAttributes): Promise<WorkflowCardNoteResource>`

Create a note for a workflow card.

**Example:**

```typescript
const note = await client.workflows.createWorkflowCardNote('person-id', 'card-id', {
  note: 'Called and left voicemail'
});
```

## Contacts Module

Access via `client.contacts`

### Email Management

```typescript
// Get all emails
const emails = await client.contacts.getEmails();

// Get emails for person
const personEmails = await client.contacts.getEmailsForPerson('person-id');

// Create email
const email = await client.contacts.createEmail('person-id', {
  address: 'john@example.com',
  location: 'Home',
  primary: true
});

// Update email
const updated = await client.contacts.updateEmail('person-id', 'email-id', {
  location: 'Work'
});

// Delete email
await client.contacts.deleteEmail('person-id', 'email-id');
```

### Phone Management

```typescript
// Get all phone numbers
const phones = await client.contacts.getPhoneNumbers();

// Get phone numbers for person
const personPhones = await client.contacts.getPhoneNumbersForPerson('person-id');

// Create phone number
const phone = await client.contacts.createPhoneNumber('person-id', {
  number: '+1-555-123-4567',
  location: 'Mobile',
  primary: true
});

// Update phone number
const updated = await client.contacts.updatePhoneNumber('person-id', 'phone-id', {
  location: 'Work'
});

// Delete phone number
await client.contacts.deletePhoneNumber('person-id', 'phone-id');
```

### Address Management

```typescript
// Get all addresses
const addresses = await client.contacts.getAddresses();

// Get addresses for person
const personAddresses = await client.contacts.getAddressesForPerson('person-id');

// Create address
const address = await client.contacts.createAddress('person-id', {
  address1: '123 Main St',
  city: 'Anytown',
  state: 'CA',
  zip: '12345',
  location: 'Home'
});

// Update address
const updated = await client.contacts.updateAddress('person-id', 'address-id', {
  city: 'New City'
});

// Delete address
await client.contacts.deleteAddress('person-id', 'address-id');
```

### Social Profile Management

```typescript
// Get all social profiles
const profiles = await client.contacts.getSocialProfiles();

// Get social profiles for person
const personProfiles = await client.contacts.getSocialProfilesForPerson('person-id');

// Create social profile
const profile = await client.contacts.createSocialProfile('person-id', {
  service: 'facebook',
  username: 'johndoe',
  url: 'https://facebook.com/johndoe'
});

// Delete social profile
await client.contacts.deleteSocialProfile('person-id', 'profile-id');
```

## Households Module

Access via `client.households`

### Household Operations

#### `getAll(params?: GetHouseholdsParams): Promise<Paginated<HouseholdResource>>`

Get all households.

**Example:**

```typescript
const households = await client.households.getAll({
  include: ['people']
});
```

#### `getById(id: string, include?: string[]): Promise<HouseholdResource>`

Get a single household.

**Example:**

```typescript
const household = await client.households.getById('household-id', ['people']);
```

#### `create(data: HouseholdAttributes): Promise<HouseholdResource>`

Create a new household.

**Example:**

```typescript
const household = await client.households.create({
  name: 'Smith Family'
});
```

#### `update(id: string, data: Partial<HouseholdAttributes>): Promise<HouseholdResource>`

Update a household.

**Example:**

```typescript
const updated = await client.households.update('household-id', {
  name: 'Updated Name'
});
```

#### `delete(id: string): Promise<void>`

Delete a household.

**Example:**

```typescript
await client.households.delete('household-id');
```

### Household Membership

#### `addPersonToHousehold(householdId: string, personId: string): Promise<void>`

Add a person to a household.

**Example:**

```typescript
await client.households.addPersonToHousehold('household-id', 'person-id');
```

#### `removePersonFromHousehold(householdId: string, personId: string): Promise<void>`

Remove a person from a household.

**Example:**

```typescript
await client.households.removePersonFromHousehold('household-id', 'person-id');
```

## Notes Module

Access via `client.notes`

### Note Operations

#### `getAll(params?: GetNotesParams): Promise<Paginated<NoteResource>>`

Get all notes.

**Example:**

```typescript
const notes = await client.notes.getAll({
  where: { person_id: 'person-id' }
});
```

#### `getById(id: string): Promise<NoteResource>`

Get a single note.

**Example:**

```typescript
const note = await client.notes.getById('note-id');
```

#### `create(data: NoteAttributes): Promise<NoteResource>`

Create a new note.

**Example:**

```typescript
const note = await client.notes.create({
  content: 'This is a note',
  person_id: 'person-id',
  category_id: 'category-id'
});
```

#### `update(id: string, data: Partial<NoteAttributes>): Promise<NoteResource>`

Update a note.

**Example:**

```typescript
const updated = await client.notes.update('note-id', {
  content: 'Updated content'
});
```

#### `delete(id: string): Promise<void>`

Delete a note.

**Example:**

```typescript
await client.notes.delete('note-id');
```

### Note Categories

#### `getNoteCategories(): Promise<Paginated<NoteCategoryResource>>`

Get all note categories.

**Example:**

```typescript
const categories = await client.notes.getNoteCategories();
```

#### `createNoteCategory(data: NoteCategoryAttributes): Promise<NoteCategoryResource>`

Create a new note category.

**Example:**

```typescript
const category = await client.notes.createNoteCategory({
  name: 'Follow-up',
  color: '#FF0000'
});
```

#### `updateNoteCategory(id: string, data: Partial<NoteCategoryAttributes>): Promise<NoteCategoryResource>`

Update a note category.

**Example:**

```typescript
const updated = await client.notes.updateNoteCategory('category-id', {
  name: 'Updated Name'
});
```

#### `deleteNoteCategory(id: string): Promise<void>`

Delete a note category.

**Example:**

```typescript
await client.notes.deleteNoteCategory('category-id');
```

## Lists Module

Access via `client.lists`

### List Operations

#### `getAll(params?: GetListsParams): Promise<Paginated<ListResource>>`

Get all lists.

**Example:**

```typescript
const lists = await client.lists.getAll();
```

#### `getById(id: string): Promise<ListResource>`

Get a single list.

**Example:**

```typescript
const list = await client.lists.getById('list-id');
```

#### `getPeople(listId: string, params?: GetListPeopleParams): Promise<Paginated<PersonResource>>`

Get people in a list.

**Example:**

```typescript
const people = await client.lists.getPeople('list-id');
```

### List Categories

#### `getListCategories(): Promise<Paginated<ListCategoryResource>>`

Get all list categories.

**Example:**

```typescript
const categories = await client.lists.getListCategories();
```

#### `getListCategoryById(id: string): Promise<ListCategoryResource>`

Get a single list category.

**Example:**

```typescript
const category = await client.lists.getListCategoryById('category-id');
```

#### `createListCategory(data: ListCategoryAttributes): Promise<ListCategoryResource>`

Create a new list category.

**Example:**

```typescript
const category = await client.lists.createListCategory({
  name: 'New Category'
});
```

#### `updateListCategory(id: string, data: Partial<ListCategoryAttributes>): Promise<ListCategoryResource>`

Update a list category.

**Example:**

```typescript
const updated = await client.lists.updateListCategory('category-id', {
  name: 'Updated Name'
});
```

#### `deleteListCategory(id: string): Promise<void>`

Delete a list category.

**Example:**

```typescript
await client.lists.deleteListCategory('category-id');
```

## Campus Module

Access via `client.campus`

### Campus Operations

#### `getAll(params?: GetCampusesParams): Promise<Paginated<CampusResource>>`

Get all campuses with optional filtering and pagination.

**Parameters:**

- `params.where` - Filter criteria
- `params.include` - Related resources to include
- `params.per_page` - Number of results per page
- `params.page` - Page number

**Example:**

```typescript
const campuses = await client.campus.getAll({
  per_page: 50,
  include: ['organization']
});
```

#### `getById(id: string, include?: string[]): Promise<CampusResource>`

Get a specific campus by ID.

**Example:**

```typescript
const campus = await client.campus.getById('campus-id', ['organization']);
```

#### `create(data: CampusAttributes): Promise<CampusResource>`

Create a new campus.

**Example:**

```typescript
const campus = await client.campus.create({
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
```

#### `update(id: string, data: Partial<CampusAttributes>): Promise<CampusResource>`

Update an existing campus.

**Example:**

```typescript
const updatedCampus = await client.campus.update('campus-id', {
  city: 'Updated City',
  phone_number: '555-987-6543'
});
```

#### `delete(id: string): Promise<void>`

Delete a campus.

**Example:**

```typescript
await client.campus.delete('campus-id');
```

#### `getLists(campusId: string, params?: GetListsParams): Promise<Paginated<ListResource>>`

Get lists for a specific campus.

**Example:**

```typescript
const lists = await client.campus.getLists('campus-id');
```

#### `getServiceTimes(campusId: string, params?: GetServiceTimesParams): Promise<Paginated<ServiceTimeResource>>`

Get service times for a specific campus.

**Example:**

```typescript
const serviceTimes = await client.campus.getServiceTimes('campus-id');
```

#### `getAllPages(params?: GetCampusesParams): Promise<CampusResource[]>`

Get all campuses with automatic pagination.

**Example:**

```typescript
const allCampuses = await client.campus.getAllPages();
```

## Organization Module

Access via `client.organization`

### Organization Operations

#### `get(): Promise<OrganizationResource>`

Get organization information.

**Example:**

```typescript
const org = await client.organization.get();
console.log(org.attributes?.name);
```

## PcoClientManager

Automatic client caching and lifecycle management.

### Usage

```typescript
import { PcoClientManager } from '@rachelallyson/planning-center-people-ts';

const manager = new PcoClientManager();

// Get or create client
const client = await manager.getClient('user-id', {
  auth: {
    type: 'oauth',
    accessToken: 'token',
    refreshToken: 'refresh-token'
  }
});

// Cleanup
await manager.cleanup();
```

### Methods

#### `getClient(userId: string, config: PcoClientConfig): Promise<PcoClient>`

Get or create a client for a user.

#### `cleanup(): Promise<void>`

Clean up expired clients.

## PersonMatcher

Smart person matching with fuzzy logic.

### Usage

```typescript
import { PersonMatcher } from '@rachelallyson/planning-center-people-ts';

const matcher = new PersonMatcher(client);

// Find existing person
const match = await matcher.findMatch({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  matchStrategy: 'fuzzy'
});

// Find or create
const person = await matcher.findOrCreate({
  firstName: 'John',
  lastName: 'Doe',
  createIfNotFound: true
});
```

### Methods

#### `findMatch(options: PersonMatchOptions): Promise<PersonMatchResult | null>`

Find existing person with matching logic.

#### `findOrCreate(options: PersonMatchOptions): Promise<PersonResource>`

Find existing person or create new one.

## Event System

The client provides comprehensive event monitoring for debugging and monitoring.

### Event Types

```typescript
// Request events
client.on('request:start', (event: RequestStartEvent) => {
  console.log(`Starting ${event.method} ${event.endpoint}`);
});

client.on('request:complete', (event: RequestCompleteEvent) => {
  console.log(`Completed in ${event.duration}ms`);
});

// Error events
client.on('error', (event: ErrorEvent) => {
  console.error('API Error:', event.error.message);
});

// Rate limit events
client.on('rate:limit', (event: RateLimitEvent) => {
  console.log('Rate limit reached, retry after:', event.retryAfter);
});

// Authentication events
client.on('auth:failure', (event: AuthFailureEvent) => {
  console.error('Authentication failed:', event.error.message);
});
```

### Event Interfaces

```typescript
interface RequestStartEvent {
  method: string;
  endpoint: string;
  timestamp: Date;
}

interface RequestCompleteEvent {
  method: string;
  endpoint: string;
  duration: number;
  status: number;
  timestamp: Date;
}

interface ErrorEvent {
  error: Error;
  method: string;
  endpoint: string;
  timestamp: Date;
}

interface RateLimitEvent {
  retryAfter: number;
  limit: number;
  remaining: number;
  resetTime: Date;
}

interface AuthFailureEvent {
  error: Error;
  timestamp: Date;
}
```

## Type Definitions

### Core Types

```typescript
// Client configuration
interface PcoClientConfig {
  auth: {
    type: 'personal_access_token' | 'oauth';
  personalAccessToken?: string;
  accessToken?: string;
  refreshToken?: string;
    onRefresh?: (tokens: TokenResponse) => Promise<void>;
    onRefreshFailure?: (error: Error) => Promise<void>;
  };
  rateLimit?: {
    maxRequests: number;
    perMilliseconds: number;
  };
  timeout?: number;
  baseURL?: string;
}

// Token response
interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

// Pagination
interface Paginated<T> {
  data: T[];
  meta: {
    count: number;
    total_count: number;
    next?: string;
    prev?: string;
  };
}

// Person matching
interface PersonMatchOptions {
  firstName: string;
  lastName: string;
  email?: string;
  matchStrategy?: 'exact' | 'fuzzy';
  createIfNotFound?: boolean;
}

interface PersonMatchResult {
  person: PersonResource;
  confidence: number;
  matchType: 'exact' | 'fuzzy';
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
  status?: string;
  created_at?: string;
  updated_at?: string;
  // ... other attributes
}

interface PersonRelationships {
  emails?: Relationship;
  phone_numbers?: Relationship;
  addresses?: Relationship;
  household?: Relationship;
  // ... other relationships
}

interface CampusResource {
  id: string;
  type: 'Campus';
  attributes: CampusAttributes;
  relationships?: CampusRelationships;
}

interface CampusAttributes {
  latitude?: number;
  longitude?: number;
  description?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  phone_number?: string;
  website?: string;
  twenty_four_hour_time?: boolean;
  date_format?: number;
  church_center_enabled?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface CampusRelationships {
  organization?: Relationship;
}
```

## Next Steps

- 💡 **[API Usage Guide](./API_USAGE_GUIDE.md)** - Comprehensive usage patterns
- 🔐 **[Authentication Guide](./AUTHENTICATION.md)** - Authentication setup
- 🛠️ **[Best Practices](./BEST_PRACTICES.md)** - Production best practices
- 📚 **[Examples](./EXAMPLES.md)** - Real-world examples

---

*This API reference covers the complete v2.0.0 class-based API. For migration from v1.x, see the [Migration Guide](./MIGRATION_V2.md).*
