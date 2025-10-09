# Planning Center People API Functions Checklist

This document provides a comprehensive checklist of all functions available in the `src/people/` module.

## Core People Operations (`src/people/core.ts`)

- [ ] `getPeople(client, params?, context?)` - Get all people with optional filtering and pagination
- [ ] `getPerson(client, id, include?, context?)` - Get a single person by ID
- [ ] `createPerson(client, data, context?)` - Create a new person
- [ ] `updatePerson(client, id, data, context?)` - Update a person
- [ ] `deletePerson(client, id, context?)` - Delete a person

## Contact Operations (`src/people/contacts.ts`)

### Email Management

- [ ] `getPersonEmails(client, personId, context?)` - Get all emails for a person
- [ ] `createPersonEmail(client, personId, data, context?)` - Create an email for a person

### Phone Number Management

- [ ] `getPersonPhoneNumbers(client, personId, context?)` - Get all phone numbers for a person
- [ ] `createPersonPhoneNumber(client, personId, data, context?)` - Create a phone number for a person

### Address Management

- [ ] `getPersonAddresses(client, personId, context?)` - Get all addresses for a person
- [ ] `createPersonAddress(client, personId, data, context?)` - Create an address for a person
- [ ] `updatePersonAddress(client, personId, addressId, data, context?)` - Update an address for a person

### Social Profile Management

- [ ] `getPersonSocialProfiles(client, personId, context?)` - Get social profiles for a person
- [ ] `createPersonSocialProfile(client, personId, data, context?)` - Create a social profile for a person

## Field Data Operations (`src/people/fields.ts`)

### Field Data Management

- [ ] `createPersonFieldData(client, personId, fieldDefinitionId, value, context?)` - Create field data for a person
- [ ] `deletePersonFieldData(client, personId, fieldDataId, context?)` - Delete field data for a person
- [ ] `getPersonFieldData(client, personId, context?)` - Get field data for a person (custom fields)

### File Upload

- [ ] `createPersonFileFieldData(client, personId, fieldDefinitionId, fileUrl, context?)` - Upload a file to PCO and create field data

### Field Definitions

- [ ] `getFieldDefinitions(client, params?, context?)` - Get field definitions
- [ ] `getFieldOptions(client, fieldDefinitionId, context?)` - Get field options for a field definition
- [ ] `createFieldOption(client, fieldDefinitionId, data, context?)` - Create a field option for a field definition

## Household Operations (`src/people/households.ts`)

- [ ] `getHouseholds(client, params?, context?)` - Get all households
- [ ] `getHousehold(client, id, include?, context?)` - Get a single household by ID

## List Operations (`src/people/lists.ts`)

### List Management

- [ ] `getLists(client, params?, context?)` - Get all lists
- [ ] `getListById(client, listId, params?, context?)` - Get a single list

### List Categories

- [ ] `getListCategories(client, params?, context?)` - Get all list categories

## Note Operations (`src/people/notes.ts`)

### Note Management

- [ ] `getNotes(client, params?, context?)` - Get all notes
- [ ] `getNote(client, noteId, params?, context?)` - Get a single note

### Note Categories

- [ ] `getNoteCategories(client, params?, context?)` - Get all note categories

## Workflow Operations (`src/people/workflows.ts`)

### Workflow Card Notes

- [ ] `getWorkflowCardNotes(client, personId, workflowCardId, context?)` - List notes for a workflow card
- [ ] `createWorkflowCardNote(client, personId, workflowCardId, data, context?)` - Create a note for a workflow card

### Workflow Cards

- [ ] `getWorkflowCards(client, personId, context?)` - List workflow cards for a person
- [ ] `createWorkflowCard(client, workflowId, personId, context?)` - Create a workflow card in a workflow for a person

### Workflows

- [ ] `getWorkflows(client, params?, context?)` - Get all workflows
- [ ] `getWorkflow(client, workflowId, params?, context?)` - Get a single workflow

## Organization Operations (`src/people/organization.ts`)

- [ ] `getOrganization(client, params?, context?)` - Get organization information

## Summary

**Total Functions: 36**

### Function Categories

- **Core People**: 5 functions (CRUD operations for people)
- **Contacts**: 9 functions (emails, phones, addresses, social profiles)
- **Field Data**: 7 functions (custom fields, file uploads, field definitions)
- **Households**: 2 functions (household management)
- **Lists**: 3 functions (lists and list categories)
- **Notes**: 3 functions (notes and note categories)
- **Workflows**: 6 functions (workflow cards, notes, workflows)
- **Organization**: 1 function (organization info)

## Usage Notes

- All functions are properly typed with TypeScript
- Include comprehensive error handling
- Follow consistent patterns for API calls, parameter handling, and response processing
- Support optional context parameters for error tracking and debugging
- Use the `buildQueryParams` helper for consistent query parameter formatting

## Import Example

```typescript
import { 
  getPeople, 
  createPerson, 
  getPersonEmails,
  createPersonEmail,
  getWorkflowCards 
} from '@rachelallyson/planning-center-people-ts';
```
