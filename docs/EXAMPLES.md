# Examples & Usage Patterns

This guide provides comprehensive examples for common use cases and patterns with the Planning Center People TypeScript library.

## Table of Contents

1. [Basic Operations](#basic-operations)
2. [Contact Management](#contact-management)
3. [Custom Fields & File Uploads](#custom-fields--file-uploads)
4. [Workflow Management](#workflow-management)
5. [Data Import/Export](#data-importexport)
6. [Batch Operations](#batch-operations)
7. [Error Handling Patterns](#error-handling-patterns)
8. [Performance Optimization](#performance-optimization)
9. [Real-World Applications](#real-world-applications)
10. [Integration Examples](#integration-examples)

## Basic Operations

### Creating and Managing People

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
  appId: process.env.PCO_APP_ID!,
  appSecret: process.env.PCO_APP_SECRET!,
  personalAccessToken: process.env.PCO_PERSONAL_ACCESS_TOKEN!,
});

// Get all people with pagination
async function getAllPeople() {
  const people = await getPeople(client, {
    per_page: 100,
    include: ['emails', 'phone_numbers', 'addresses']
  });
  
  console.log(`Found ${people.data.length} people`);
  return people.data;
}

// Search for people by name
async function searchPeopleByName(firstName: string, lastName?: string) {
  const where: Record<string, any> = { first_name: firstName };
  if (lastName) {
    where.last_name = lastName;
  }
  
  const people = await getPeople(client, {
    where,
    include: ['emails']
  });
  
  return people.data;
}

// Create a new person with contact information
async function createNewMember(memberData: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
}) {
  // Create the person
  const person = await createPerson(client, {
    first_name: memberData.firstName,
    last_name: memberData.lastName,
    email: memberData.email
  });
  
  // Add phone number if provided
  if (memberData.phone) {
    await createPersonPhoneNumber(client, person.data!.id, {
      number: memberData.phone,
      location: 'mobile',
      primary: true
    });
  }
  
  // Add address if provided
  if (memberData.address) {
    await createPersonAddress(client, person.data!.id, {
      street: memberData.address.street,
      city: memberData.address.city,
      state: memberData.address.state,
      zip: memberData.address.zip,
      country: 'US',
      location: 'home'
    });
  }
  
  return person;
}

// Update person information
async function updateMemberInfo(personId: string, updates: {
  firstName?: string;
  lastName?: string;
  email?: string;
}) {
  const updateData: any = {};
  if (updates.firstName) updateData.first_name = updates.firstName;
  if (updates.lastName) updateData.last_name = updates.lastName;
  if (updates.email) updateData.email = updates.email;
  
  return await updatePerson(client, personId, updateData);
}
```

### Household Management

```typescript
import { getHouseholds, getHousehold, getPeople } from '@rachelallyson/planning-center-people-ts';

// Get all households with their members
async function getAllHouseholds() {
  const households = await getHouseholds(client, {
    per_page: 50,
    include: ['people']
  });
  
  return households.data.map(household => ({
    id: household.id,
    name: household.attributes.name,
    memberCount: household.relationships?.people?.data?.length || 0,
    members: household.relationships?.people?.data || []
  }));
}

// Get household details with full member information
async function getHouseholdDetails(householdId: string) {
  const household = await getHousehold(client, householdId, ['people']);
  
  // Get full member details
  const memberIds = household.relationships?.people?.data?.map(p => p.id) || [];
  const members = await Promise.all(
    memberIds.map(id => getPerson(client, id, ['emails', 'phone_numbers']))
  );
  
  return {
    household: household.data,
    members: members.map(m => m.data)
  };
}
```

## Contact Management

### Email Management

```typescript
import { 
  getPersonEmails, 
  createPersonEmail 
} from '@rachelallyson/planning-center-people-ts';

// Get all emails for a person
async function getPersonContactInfo(personId: string) {
  const emails = await getPersonEmails(client, personId);
  
  return {
    emails: emails.data.map(email => ({
      id: email.id,
      address: email.attributes.address,
      location: email.attributes.location,
      primary: email.attributes.primary
    }))
  };
}

// Add multiple email addresses
async function addPersonEmails(personId: string, emailAddresses: {
  address: string;
  location: string;
  primary?: boolean;
}[]) {
  const results = [];
  
  for (const emailData of emailAddresses) {
    const email = await createPersonEmail(client, personId, {
      address: emailData.address,
      location: emailData.location,
      primary: emailData.primary || false
    });
    results.push(email);
  }
  
  return results;
}

// Find primary email address
async function getPrimaryEmail(personId: string) {
  const emails = await getPersonEmails(client, personId);
  const primaryEmail = emails.data.find(email => email.attributes.primary);
  
  return primaryEmail?.attributes.address || null;
}
```

### Phone Number Management

```typescript
import { 
  getPersonPhoneNumbers, 
  createPersonPhoneNumber 
} from '@rachelallyson/planning-center-people-ts';

// Get all phone numbers for a person
async function getPersonPhones(personId: string) {
  const phones = await getPersonPhoneNumbers(client, personId);
  
  return phones.data.map(phone => ({
    id: phone.id,
    number: phone.attributes.number,
    location: phone.attributes.location,
    primary: phone.attributes.primary
  }));
}

// Add phone number with validation
async function addPhoneNumber(personId: string, phoneData: {
  number: string;
  location: 'home' | 'work' | 'mobile' | 'other';
  primary?: boolean;
}) {
  // Basic phone number validation
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  if (!phoneRegex.test(phoneData.number.replace(/[\s\-\(\)]/g, ''))) {
    throw new Error('Invalid phone number format');
  }
  
  return await createPersonPhoneNumber(client, personId, {
    number: phoneData.number,
    location: phoneData.location,
    primary: phoneData.primary || false
  });
}
```

### Address Management

```typescript
import { 
  getPersonAddresses, 
  createPersonAddress, 
  updatePersonAddress 
} from '@rachelallyson/planning-center-people-ts';

// Get all addresses for a person
async function getPersonAddresses(personId: string) {
  const addresses = await getPersonAddresses(client, personId);
  
  return addresses.data.map(address => ({
    id: address.id,
    street: address.attributes.street,
    city: address.attributes.city,
    state: address.attributes.state,
    zip: address.attributes.zip,
    country: address.attributes.country,
    location: address.attributes.location
  }));
}

// Add address with validation
async function addAddress(personId: string, addressData: {
  street: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
  location?: string;
}) {
  // Basic address validation
  if (!addressData.street || !addressData.city || !addressData.state || !addressData.zip) {
    throw new Error('Missing required address fields');
  }
  
  return await createPersonAddress(client, personId, {
    street: addressData.street,
    city: addressData.city,
    state: addressData.state,
    zip: addressData.zip,
    country: addressData.country || 'US',
    location: addressData.location || 'home'
  });
}

// Update address
async function updateAddress(personId: string, addressId: string, updates: {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
}) {
  return await updatePersonAddress(client, personId, addressId, updates);
}
```

## Custom Fields & File Uploads

### Field Definition Management

```typescript
import { 
  getFieldDefinitions, 
  createFieldDefinition, 
  getFieldOptions,
  createFieldOption 
} from '@rachelallyson/planning-center-people-ts';

// Get all custom field definitions
async function getCustomFields() {
  const fieldDefs = await getFieldDefinitions(client, {
    per_page: 100
  });
  
  return fieldDefs.data.map(field => ({
    id: field.id,
    name: field.attributes.name,
    fieldType: field.attributes.field_type,
    required: field.attributes.required,
    description: field.attributes.description
  }));
}

// Create a new custom field
async function createCustomField(fieldData: {
  name: string;
  fieldType: 'text' | 'number' | 'date' | 'file' | 'select';
  required?: boolean;
  description?: string;
  options?: string[];
}) {
  const fieldDef = await createFieldDefinition(client, {
    name: fieldData.name,
    field_type: fieldData.fieldType,
    required: fieldData.required || false,
    description: fieldData.description
  });
  
  // Add options for select fields
  if (fieldData.fieldType === 'select' && fieldData.options) {
    for (let i = 0; i < fieldData.options.length; i++) {
      await createFieldOption(client, fieldDef.data!.id, {
        value: fieldData.options[i],
        sequence: i + 1
      });
    }
  }
  
  return fieldDef;
}
```

### Field Data Management with File Uploads

```typescript
import { 
  getPersonFieldData, 
  createPersonFieldData, 
  deletePersonFieldData,
  isFileUpload,
  extractFileUrl,
  processFileValue 
} from '@rachelallyson/planning-center-people-ts';

// Get all custom field data for a person
async function getPersonCustomData(personId: string) {
  const fieldData = await getPersonFieldData(client, personId);
  
  return fieldData.data.map(data => ({
    id: data.id,
    fieldDefinitionId: data.relationships?.field_definition?.data?.id,
    value: data.attributes.value,
    isFile: isFileUpload(data.attributes.value)
  }));
}

// Add custom field data with smart file handling
async function addCustomFieldData(personId: string, fieldDefinitionId: string, value: string) {
  // The library automatically handles file uploads
  return await createPersonFieldData(client, personId, fieldDefinitionId, value);
}

// Process different types of field values
function processFieldValue(value: string, fieldType: string) {
  if (isFileUpload(value)) {
    const fileUrl = extractFileUrl(value);
    console.log('File URL:', fileUrl);
    
    // Process based on field type
    if (fieldType === 'file') {
      return processFileValue(value, 'file');
    } else {
      return processFileValue(value, 'text');
    }
  }
  
  return value;
}

// Example: Handle document uploads
async function uploadDocument(personId: string, fieldDefinitionId: string, documentUrl: string) {
  // Create HTML link for file field
  const fileValue = `<a href="${documentUrl}" download>View Document</a>`;
  
  return await createPersonFieldData(client, personId, fieldDefinitionId, fileValue);
}

// Example: Handle image uploads
async function uploadImage(personId: string, fieldDefinitionId: string, imageUrl: string) {
  // For image fields, you might want to extract just the URL
  const cleanUrl = extractFileUrl(imageUrl) || imageUrl;
  
  return await createPersonFieldData(client, personId, fieldDefinitionId, cleanUrl);
}
```

## Workflow Management

### Workflow Cards

```typescript
import { 
  getWorkflowCards, 
  createWorkflowCard, 
  getWorkflowCardNotes,
  createWorkflowCardNote 
} from '@rachelallyson/planning-center-people-ts';

// Get all workflow cards for a person
async function getPersonWorkflowCards(personId: string) {
  const workflowCards = await getWorkflowCards(client, {
    where: { person_id: personId },
    include: ['workflow', 'notes']
  });
  
  return workflowCards.data.map(card => ({
    id: card.id,
    title: card.attributes.title,
    description: card.attributes.description,
    status: card.attributes.status,
    workflowId: card.relationships?.workflow?.data?.id,
    notes: card.relationships?.notes?.data || []
  }));
}

// Create a workflow card
async function createFollowUpCard(personId: string, workflowId: string, details: {
  title: string;
  description: string;
  dueDate?: string;
}) {
  return await createWorkflowCard(client, {
    title: details.title,
    description: details.description,
    workflow_id: workflowId,
    person_id: personId,
    due_date: details.dueDate
  });
}

// Add notes to workflow cards
async function addWorkflowNote(workflowCardId: string, content: string) {
  return await createWorkflowCardNote(client, workflowCardId, {
    content: content
  });
}

// Complete workflow management example
async function manageMemberFollowUp(personId: string) {
  // Get person details
  const person = await getPerson(client, personId);
  const personName = `${person.data?.attributes.first_name} ${person.data?.attributes.last_name}`;
  
  // Create follow-up workflow card
  const workflowCard = await createFollowUpCard(personId, 'follow-up-workflow-id', {
    title: `Follow up with ${personName}`,
    description: 'New member follow-up call',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
  });
  
  // Add initial note
  await addWorkflowNote(workflowCard.data!.id, 'Initial follow-up task created');
  
  return workflowCard;
}
```

### Workflow Management

```typescript
import { getWorkflows, getWorkflow } from '@rachelallyson/planning-center-people-ts';

// Get all available workflows
async function getAvailableWorkflows() {
  const workflows = await getWorkflows(client, {
    per_page: 50
  });
  
  return workflows.data.map(workflow => ({
    id: workflow.id,
    name: workflow.attributes.name,
    description: workflow.attributes.description,
    active: workflow.attributes.active
  }));
}

// Get workflow details
async function getWorkflowDetails(workflowId: string) {
  const workflow = await getWorkflow(client, workflowId);
  
  return {
    id: workflow.data?.id,
    name: workflow.data?.attributes.name,
    description: workflow.data?.attributes.description,
    active: workflow.data?.attributes.active
  };
}
```

## Data Import/Export

### Export People Data

```typescript
import { 
  getPeople, 
  getPerson, 
  getAllPages 
} from '@rachelallyson/planning-center-people-ts';

// Export all people data to CSV format
async function exportPeopleToCSV() {
  // Get all people (this will automatically handle pagination)
  const allPeople = await getAllPages(client, '/people');
  
  // Get detailed information for each person
  const detailedPeople = await Promise.all(
    allPeople.map(async (person) => {
      const fullPerson = await getPerson(client, person.id, [
        'emails', 
        'phone_numbers', 
        'addresses', 
        'field_data'
      ]);
      
      return {
        id: fullPerson.data?.id,
        firstName: fullPerson.data?.attributes.first_name,
        lastName: fullPerson.data?.attributes.last_name,
        email: fullPerson.data?.attributes.email,
        // Add contact information
        emails: fullPerson.included?.emails?.map(e => e.attributes.address).join('; ') || '',
        phones: fullPerson.included?.phone_numbers?.map(p => p.attributes.number).join('; ') || '',
        // Add custom field data
        customFields: fullPerson.included?.field_data?.map(f => 
          `${f.attributes.field_definition_name}: ${f.attributes.value}`
        ).join('; ') || ''
      };
    })
  );
  
  // Convert to CSV
  const csvHeaders = Object.keys(detailedPeople[0]).join(',');
  const csvRows = detailedPeople.map(person => 
    Object.values(person).map(value => `"${value}"`).join(',')
  );
  
  return [csvHeaders, ...csvRows].join('\n');
}

// Export specific people data
async function exportPeopleByCriteria(criteria: {
  firstName?: string;
  lastName?: string;
  hasEmail?: boolean;
}) {
  const where: Record<string, any> = {};
  if (criteria.firstName) where.first_name = criteria.firstName;
  if (criteria.lastName) where.last_name = criteria.lastName;
  
  const people = await getPeople(client, {
    where,
    per_page: 100,
    include: ['emails', 'phone_numbers']
  });
  
  // Filter by email if specified
  let filteredPeople = people.data;
  if (criteria.hasEmail) {
    filteredPeople = people.data.filter(person => 
      person.attributes.email || 
      people.included?.emails?.some(email => 
        email.relationships?.person?.data?.id === person.id
      )
    );
  }
  
  return filteredPeople.map(person => ({
    id: person.id,
    name: `${person.attributes.first_name} ${person.attributes.last_name}`,
    email: person.attributes.email,
    // Add other fields as needed
  }));
}
```

### Import People Data

```typescript
// Import people from CSV data
async function importPeopleFromCSV(csvData: string) {
  const lines = csvData.split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
  const rows = lines.slice(1);
  
  const results = [];
  
  for (const row of rows) {
    const values = row.split(',').map(v => v.replace(/"/g, ''));
    const personData: any = {};
    
    // Map CSV columns to person attributes
    headers.forEach((header, index) => {
      const value = values[index];
      switch (header.toLowerCase()) {
        case 'first_name':
        case 'firstname':
          personData.first_name = value;
          break;
        case 'last_name':
        case 'lastname':
          personData.last_name = value;
          break;
        case 'email':
          personData.email = value;
          break;
        // Add more mappings as needed
      }
    });
    
    try {
      const person = await createPerson(client, personData);
      results.push({ success: true, person: person.data });
    } catch (error) {
      results.push({ success: false, error: error.message, data: personData });
    }
  }
  
  return results;
}
```

## Batch Operations

### Batch Processing with Rate Limiting

```typescript
import { 
  batchFetchPersonDetails, 
  processInBatches 
} from '@rachelallyson/planning-center-people-ts';

// Process people in batches to respect rate limits
async function processPeopleInBatches(personIds: string[], batchSize: number = 10) {
  const results = await processInBatches(
    personIds,
    batchSize,
    async (batch) => {
      // Process each batch
      const batchResults = await Promise.all(
        batch.map(async (personId) => {
          try {
            const person = await getPerson(client, personId, ['emails', 'phone_numbers']);
            return { success: true, person: person.data };
          } catch (error) {
            return { success: false, error: error.message, personId };
          }
        })
      );
      
      // Add delay between batches to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return batchResults;
    }
  );
  
  return results.flat();
}

// Batch update people
async function batchUpdatePeople(updates: Array<{
  personId: string;
  data: any;
}>) {
  const results = await processInBatches(
    updates,
    5, // Smaller batch size for updates
    async (batch) => {
      const batchResults = await Promise.all(
        batch.map(async (update) => {
          try {
            const result = await updatePerson(client, update.personId, update.data);
            return { success: true, person: result.data };
          } catch (error) {
            return { success: false, error: error.message, personId: update.personId };
          }
        })
      );
      
      // Delay between batches
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return batchResults;
    }
  );
  
  return results.flat();
}
```

### Concurrent Operations with Error Handling

```typescript
// Process multiple operations concurrently with proper error handling
async function processConcurrentOperations(operations: Array<() => Promise<any>>) {
  const results = await Promise.allSettled(operations);
  
  const successful = results
    .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
    .map(result => result.value);
  
  const failed = results
    .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
    .map(result => result.reason);
  
  return {
    successful,
    failed,
    successCount: successful.length,
    failureCount: failed.length
  };
}

// Example usage
async function updateMultiplePeople(peopleUpdates: Array<{
  personId: string;
  updates: any;
}>) {
  const operations = peopleUpdates.map(update => 
    () => updatePerson(client, update.personId, update.updates)
  );
  
  const results = await processConcurrentOperations(operations);
  
  console.log(`Updated ${results.successCount} people successfully`);
  if (results.failed.length > 0) {
    console.log(`Failed to update ${results.failureCount} people:`, results.failed);
  }
  
  return results;
}
```

## Error Handling Patterns

### Comprehensive Error Handling

```typescript
import { 
  PcoError, 
  ErrorCategory, 
  ErrorSeverity,
  retryWithBackoff,
  withErrorBoundary 
} from '@rachelallyson/planning-center-people-ts';

// Error handling wrapper
async function safeApiCall<T>(
  operation: () => Promise<T>,
  context: { operation: string; personId?: string }
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const result = await withErrorBoundary(operation, {
      endpoint: context.operation,
      method: 'GET',
      personId: context.personId,
      metadata: { operation: context.operation }
    });
    
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof PcoError) {
      const errorInfo = {
        message: error.message,
        category: error.category,
        severity: error.severity,
        status: error.status,
        retryable: error.retryable
      };
      
      console.error('PCO Error:', errorInfo);
      
      // Handle different error categories
      switch (error.category) {
        case ErrorCategory.AUTHENTICATION:
          return { success: false, error: 'Authentication failed. Please check your credentials.' };
        case ErrorCategory.RATE_LIMIT:
          return { success: false, error: 'Rate limit exceeded. Please try again later.' };
        case ErrorCategory.VALIDATION:
          return { success: false, error: 'Invalid data provided. Please check your input.' };
        case ErrorCategory.NETWORK:
          return { success: false, error: 'Network error. Please check your connection.' };
        default:
          return { success: false, error: `API error: ${error.message}` };
      }
    }
    
    return { success: false, error: `Unexpected error: ${error.message}` };
  }
}

// Usage example
async function getPersonSafely(personId: string) {
  const result = await safeApiCall(
    () => getPerson(client, personId, ['emails', 'phone_numbers']),
    { operation: 'get_person', personId }
  );
  
  if (result.success) {
    return result.data;
  } else {
    throw new Error(result.error);
  }
}
```

### Retry Logic with Exponential Backoff

```typescript
// Retry operations with smart backoff
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  context: { operation: string; personId?: string }
): Promise<T> {
  return await retryWithBackoff(operation, {
    maxRetries,
    baseDelay: 1000,
    maxDelay: 30000,
    context: {
      endpoint: context.operation,
      method: 'GET',
      personId: context.personId,
      metadata: { retry_operation: true }
    },
    onRetry: (error, attempt) => {
      console.log(`Retry attempt ${attempt} for ${context.operation}:`, error.message);
    }
  });
}

// Usage example
async function createPersonWithRetry(personData: any) {
  return await retryOperation(
    () => createPerson(client, personData),
    3,
    { operation: 'create_person' }
  );
}
```

## Performance Optimization

### Streaming Large Datasets

```typescript
import { streamPeopleData } from '@rachelallyson/planning-center-people-ts';

// Stream people data for large datasets
async function processLargePeopleDataset() {
  const peopleStream = streamPeopleData(client, {
    per_page: 100,
    include: ['emails']
  });
  
  let processedCount = 0;
  const batchSize = 50;
  let batch: any[] = [];
  
  for await (const person of peopleStream) {
    batch.push(person);
    
    if (batch.length >= batchSize) {
      // Process batch
      await processBatch(batch);
      processedCount += batch.length;
      console.log(`Processed ${processedCount} people`);
      batch = [];
    }
  }
  
  // Process remaining items
  if (batch.length > 0) {
    await processBatch(batch);
    processedCount += batch.length;
  }
  
  console.log(`Total processed: ${processedCount} people`);
}

async function processBatch(batch: any[]) {
  // Process batch of people
  // This could be saving to database, sending emails, etc.
  console.log(`Processing batch of ${batch.length} people`);
}
```

### Caching and Performance Monitoring

```typescript
import { 
  monitorPerformance, 
  ApiCache 
} from '@rachelallyson/planning-center-people-ts';

// Performance monitoring
async function monitoredOperation() {
  return await monitorPerformance(
    async () => {
      const people = await getPeople(client, { per_page: 100 });
      return people.data;
    },
    {
      operation: 'get_people',
      metadata: { batch_size: 100 }
    }
  );
}

// Simple caching example
class PeopleCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private ttl = 5 * 60 * 1000; // 5 minutes
  
  async getPerson(personId: string) {
    const cached = this.cache.get(personId);
    
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      console.log('Cache hit for person:', personId);
      return cached.data;
    }
    
    console.log('Cache miss for person:', personId);
    const person = await getPerson(client, personId);
    
    this.cache.set(personId, {
      data: person,
      timestamp: Date.now()
    });
    
    return person;
  }
  
  clear() {
    this.cache.clear();
  }
}
```

## Real-World Applications

### Church Management System

```typescript
// Complete church management example
class ChurchManagementSystem {
  private client: PcoClientState;
  
  constructor(client: PcoClientState) {
    this.client = client;
  }
  
  // New member onboarding
  async onboardNewMember(memberData: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: any;
    emergencyContact?: any;
  }) {
    // Create person
    const person = await createPerson(this.client, {
      first_name: memberData.firstName,
      last_name: memberData.lastName,
      email: memberData.email
    });
    
    const personId = person.data!.id;
    
    // Add contact information
    if (memberData.phone) {
      await createPersonPhoneNumber(this.client, personId, {
        number: memberData.phone,
        location: 'mobile',
        primary: true
      });
    }
    
    if (memberData.address) {
      await createPersonAddress(this.client, personId, memberData.address);
    }
    
    // Add emergency contact as custom field
    if (memberData.emergencyContact) {
      await createPersonFieldData(
        this.client, 
        personId, 
        'emergency-contact-field-id', 
        JSON.stringify(memberData.emergencyContact)
      );
    }
    
    // Create follow-up workflow
    await createWorkflowCard(this.client, {
      title: `Welcome ${memberData.firstName}!`,
      description: 'New member follow-up process',
      workflow_id: 'new-member-workflow-id',
      person_id: personId
    });
    
    return person;
  }
  
  // Generate member directory
  async generateMemberDirectory() {
    const allPeople = await getAllPages(this.client, '/people');
    
    const directory = await Promise.all(
      allPeople.map(async (person) => {
        const fullPerson = await getPerson(this.client, person.id, [
          'emails', 
          'phone_numbers', 
          'addresses'
        ]);
        
        return {
          name: `${fullPerson.data?.attributes.first_name} ${fullPerson.data?.attributes.last_name}`,
          email: fullPerson.data?.attributes.email,
          phone: fullPerson.included?.phone_numbers?.[0]?.attributes.number,
          address: fullPerson.included?.addresses?.[0] ? {
            street: fullPerson.included.addresses[0].attributes.street,
            city: fullPerson.included.addresses[0].attributes.city,
            state: fullPerson.included.addresses[0].attributes.state,
            zip: fullPerson.included.addresses[0].attributes.zip
          } : null
        };
      })
    );
    
    return directory;
  }
  
  // Send bulk communications
  async sendBulkCommunication(recipients: string[], message: string) {
    const results = await processInBatches(
      recipients,
      10, // Send to 10 people at a time
      async (batch) => {
        // In a real application, this would integrate with your email service
        console.log(`Sending message to ${batch.length} people:`, message);
        
        // Create workflow cards for tracking
        const workflowCards = await Promise.all(
          batch.map(personId => 
            createWorkflowCard(this.client, {
              title: 'Communication Sent',
              description: message,
              workflow_id: 'communication-workflow-id',
              person_id: personId
            })
          )
        );
        
        return workflowCards;
      }
    );
    
    return results.flat();
  }
}
```

### Volunteer Management

```typescript
// Volunteer management system
class VolunteerManagement {
  private client: PcoClientState;
  
  constructor(client: PcoClientState) {
    this.client = client;
  }
  
  // Assign volunteers to events
  async assignVolunteers(eventId: string, volunteerIds: string[], roles: string[]) {
    const assignments = await Promise.all(
      volunteerIds.map(async (volunteerId, index) => {
        const role = roles[index] || 'General Volunteer';
        
        // Create workflow card for volunteer assignment
        const workflowCard = await createWorkflowCard(this.client, {
          title: `Volunteer Assignment - ${role}`,
          description: `Assigned to event ${eventId}`,
          workflow_id: 'volunteer-assignment-workflow-id',
          person_id: volunteerId
        });
        
        // Add custom field data for event assignment
        await createPersonFieldData(
          this.client,
          volunteerId,
          'event-assignment-field-id',
          JSON.stringify({
            eventId,
            role,
            assignedAt: new Date().toISOString()
          })
        );
        
        return {
          volunteerId,
          role,
          workflowCardId: workflowCard.data?.id
        };
      })
    );
    
    return assignments;
  }
  
  // Get volunteer availability
  async getVolunteerAvailability(volunteerId: string) {
    const fieldData = await getPersonFieldData(this.client, volunteerId);
    
    const availabilityData = fieldData.data.find(data => 
      data.relationships?.field_definition?.data?.id === 'availability-field-id'
    );
    
    if (availabilityData) {
      return JSON.parse(availabilityData.attributes.value);
    }
    
    return null;
  }
  
  // Update volunteer availability
  async updateVolunteerAvailability(volunteerId: string, availability: {
    days: string[];
    times: string[];
    specialNotes?: string;
  }) {
    return await createPersonFieldData(
      this.client,
      volunteerId,
      'availability-field-id',
      JSON.stringify(availability)
    );
  }
}
```

## Integration Examples

### Express.js API Server

```typescript
// Express.js API server example
import express from 'express';
import { createPcoClient, getPeople, getPerson, createPerson } from '@rachelallyson/planning-center-people-ts';

const app = express();
app.use(express.json());

const client = createPcoClient({
  appId: process.env.PCO_APP_ID!,
  appSecret: process.env.PCO_APP_SECRET!,
  personalAccessToken: process.env.PCO_PERSONAL_ACCESS_TOKEN!,
});

// Get all people
app.get('/api/people', async (req, res) => {
  try {
    const { per_page = 50, page = 1, include } = req.query;
    
    const people = await getPeople(client, {
      per_page: Number(per_page),
      page: Number(page),
      include: include ? (include as string).split(',') : undefined
    });
    
    res.json({
      data: people.data,
      meta: {
        total: people.meta?.total,
        page: Number(page),
        per_page: Number(per_page)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch people' });
  }
});

// Get specific person
app.get('/api/people/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { include } = req.query;
    
    const person = await getPerson(client, id, 
      include ? (include as string).split(',') : undefined
    );
    
    res.json(person);
  } catch (error) {
    if (error.status === 404) {
      res.status(404).json({ error: 'Person not found' });
    } else {
      res.status(500).json({ error: 'Failed to fetch person' });
    }
  }
});

// Create person
app.post('/api/people', async (req, res) => {
  try {
    const person = await createPerson(client, req.body);
    res.status(201).json(person);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create person' });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### Next.js API Routes

```typescript
// pages/api/people/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { createPcoClient, getPeople, createPerson } from '@rachelallyson/planning-center-people-ts';

const client = createPcoClient({
  appId: process.env.PCO_APP_ID!,
  appSecret: process.env.PCO_APP_SECRET!,
  personalAccessToken: process.env.PCO_PERSONAL_ACCESS_TOKEN!,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { per_page = 50, page = 1 } = req.query;
      
      const people = await getPeople(client, {
        per_page: Number(per_page),
        page: Number(page),
        include: ['emails', 'phone_numbers']
      });
      
      res.json(people);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch people' });
    }
  } else if (req.method === 'POST') {
    try {
      const person = await createPerson(client, req.body);
      res.status(201).json(person);
    } catch (error) {
      res.status(400).json({ error: 'Failed to create person' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
```

### React Component

```typescript
// React component example
import React, { useState, useEffect } from 'react';
import { createPcoClient, getPeople, getPerson } from '@rachelallyson/planning-center-people-ts';

const client = createPcoClient({
  appId: process.env.REACT_APP_PCO_APP_ID!,
  appSecret: process.env.REACT_APP_PCO_APP_SECRET!,
  personalAccessToken: process.env.REACT_APP_PCO_PERSONAL_ACCESS_TOKEN!,
});

interface Person {
  id: string;
  attributes: {
    first_name: string;
    last_name: string;
    email?: string;
  };
}

export function PeopleList() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  
  useEffect(() => {
    async function fetchPeople() {
      try {
        const response = await getPeople(client, { per_page: 50 });
        setPeople(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    
    fetchPeople();
  }, []);
  
  const handlePersonClick = async (person: Person) => {
    try {
      const fullPerson = await getPerson(client, person.id, ['emails', 'phone_numbers']);
      setSelectedPerson(fullPerson.data);
    } catch (err) {
      console.error('Failed to fetch person details:', err);
    }
  };
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <h2>People ({people.length})</h2>
      <div style={{ display: 'flex' }}>
        <div style={{ flex: 1 }}>
          <ul>
            {people.map((person) => (
              <li 
                key={person.id}
                onClick={() => handlePersonClick(person)}
                style={{ cursor: 'pointer', padding: '8px' }}
              >
                {person.attributes.first_name} {person.attributes.last_name}
                {person.attributes.email && (
                  <div style={{ fontSize: '0.8em', color: '#666' }}>
                    {person.attributes.email}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
        
        {selectedPerson && (
          <div style={{ flex: 1, padding: '16px', border: '1px solid #ccc' }}>
            <h3>Person Details</h3>
            <p><strong>Name:</strong> {selectedPerson.attributes.first_name} {selectedPerson.attributes.last_name}</p>
            <p><strong>Email:</strong> {selectedPerson.attributes.email || 'N/A'}</p>
            {/* Add more details as needed */}
          </div>
        )}
      </div>
    </div>
  );
}
```

## Next Steps

- 🛠️ **[Error Handling](./ERROR_HANDLING.md)** - Advanced error management patterns
- ⚡ **[Performance Guide](./PERFORMANCE.md)** - Optimization techniques
- 🔧 **[Troubleshooting](./TROUBLESHOOTING.md)** - Common issues and solutions
- 📚 **[API Reference](./API_REFERENCE.md)** - Complete function reference

---

*These examples demonstrate real-world usage patterns and best practices. For more specific use cases or questions, check our [Troubleshooting Guide](./TROUBLESHOOTING.md) or [open an issue](https://github.com/rachelallyson/planning-center-people-ts/issues).*
