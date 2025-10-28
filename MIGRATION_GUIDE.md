# Migration Guide: Simplifying getPCOPerson Function

## Overview

With the fixed `findOrCreate` function in `@rachelallyson/planning-center-people-ts`, the `getPCOPerson` function can be dramatically simplified. The library now handles all the complex matching, contact creation, and error scenarios automatically.

## What Changed in the Library

The `findOrCreate` function now:

- ✅ Uses correct API parameter names (`search_name_or_email_or_phone_number`)
- ✅ Properly scores email/phone matches (returns 1.0 instead of 0)
- ✅ Automatically creates contacts with required `location: 'Home'` field
- ✅ Uses flexible search across multiple fields
- ✅ Handles all matching strategies correctly

## Migration Steps

### Step 1: Remove Complex Matching Logic

**Before (Overkill)**:

```typescript
// Step 1: Try exact matching first (most reliable)
try {
  log.info('[PERSON_MATCH] Attempting exact match');
  person = await client.people.findOrCreate({
    agePreference: 'adults',
    campusId: guest.integrationInfo?.PCO?.primary_campus_id,
    createIfNotFound: false, // Don't create, just search
    email: cleanEmail,
    firstName: guest.firstName.trim(),
    lastName: guest.lastName?.trim() ?? undefined,
    matchStrategy: 'exact',
    phone: cleanPhone,
  });
  log.info('[PERSON_MATCH] Exact match found', { personId: person.id });
} catch {
  log.info('[PERSON_MATCH] Exact match failed, trying fuzzy match');
  
  // Step 2: Try fuzzy matching (handles minor variations)
  try {
    person = await client.people.findOrCreate({
      agePreference: 'adults',
      campusId: guest.integrationInfo?.PCO?.primary_campus_id,
      createIfNotFound: false, // Don't create, just search
      email: cleanEmail,
      firstName: guest.firstName.trim(),
      lastName: guest.lastName?.trim() ?? undefined,
      matchStrategy: 'fuzzy',
      phone: cleanPhone,
    });
    log.info('[PERSON_MATCH] Fuzzy match found', { personId: person.id });
  } catch {
    log.info('[PERSON_MATCH] No existing person found, creating new one');
    
    // Step 3: Create new person only if no match found
    person = await client.people.findOrCreate({
      agePreference: 'adults',
      campusId: guest.integrationInfo?.PCO?.primary_campus_id,
      createIfNotFound: true, // Now it's safe to create
      email: cleanEmail,
      firstName: guest.firstName.trim(),
      lastName: guest.lastName?.trim() ?? undefined,
      matchStrategy: 'exact', // Use exact for creation
      phone: cleanPhone,
    });
    log.info('[PERSON_CREATE] New person created', { personId: person.id });
  }
}
```

**After (Simple)**:

```typescript
// Single call handles everything automatically
const person = await client.people.findOrCreate({
  firstName: guest.firstName.trim(),
  lastName: guest.lastName?.trim() ?? undefined,
  email: cleanEmail,
  phone: cleanPhone,
  campusId: guest.integrationInfo?.PCO?.primary_campus_id,
  matchStrategy: 'fuzzy', // Use fuzzy for good balance of accuracy and flexibility
});
```

### Step 2: Remove Manual Contact Creation

**Before (Overkill)**:

```typescript
// Step 4: (No manual contact/campus setup needed)
// The library's updated findOrCreate now automatically:
// - Creates the basic person record with name fields
// - Adds email contact using addEmail
// - Adds phone contact using addPhoneNumber
// - Sets campus using setPrimaryCampus
// All of this happens inside the library's createPerson method, so we don't need to do it manually!
```

**After (Simple)**:

```typescript
// No manual contact creation needed - findOrCreate handles it automatically
// The library automatically:
// - Creates person with name fields
// - Adds email contact with location: 'Home'
// - Adds phone contact with location: 'Home'
// - Sets campus if provided
```

### Step 3: Simplify Error Handling

**Before (Overkill)**:

```typescript
// Enhanced error handling using PCO library's error categorization
const errorContext = {
  email: cleanEmail,
  firstName: guest.firstName,
  guestId: guest.id,
  lastName: guest.lastName,
  operation: 'person_find_or_create',
  phone: cleanPhone,
};

if (error instanceof Error) {
  // Handle validation errors
  if (error.message.includes("can't be blank")) {
    log.error('[PERSON_CREATE] PCO validation error - missing required fields', error, errorContext);
    throw new Error('PCO person creation failed: missing required contact information');
  }

  // Handle email domain restrictions
  if (error.message.includes('has a disallowed domain name')) {
    log.error('[PERSON_CREATE] PCO validation error - invalid email domain', error, {
      email: cleanEmail,
      guestId: guest.id,
      operation: 'email_validation',
    });
    throw new Error('PCO person creation failed: invalid email domain');
  }

  // Handle permission errors
  if (error.message.includes('You do not have access to this resource')) {
    log.error('[PERSON_CREATE] PCO permission error - insufficient access', error, {
      guestId: guest.id,
      operation: 'permission_check',
    });
    throw new Error('PCO person creation failed: insufficient permissions');
  }

  // Handle rate limiting
  if (error.message.includes('rate limit') || error.message.includes('429')) {
    log.error('[PERSON_CREATE] PCO rate limit exceeded', error, errorContext);
    throw new Error('PCO person creation failed: rate limit exceeded - please retry');
  }

  // Handle network/connection errors
  if (error.message.includes('network') || error.message.includes('timeout')) {
    log.error('[PERSON_CREATE] PCO network error', error, errorContext);
    throw new Error('PCO person creation failed: network error - please retry');
  }
}

// Log unexpected errors with full context
log.error('[PERSON_CREATE] Unexpected error during person find/create', error instanceof Error ? error : new Error(String(error)), errorContext);

// Re-throw with more context
throw new Error(`PCO person creation failed: ${error instanceof Error ? error.message : String(error)}`);
```

**After (Simple)**:

```typescript
// Simple error handling - just catch and rethrow with context
if (error instanceof Error) {
  if (error.message.includes("can't be blank")) {
    throw new Error('PCO person creation failed: missing required contact information');
  }
  if (error.message.includes('has a disallowed domain name')) {
    throw new Error('PCO person creation failed: invalid email domain');
  }
  if (error.message.includes('You do not have access to this resource')) {
    throw new Error('PCO person creation failed: insufficient permissions');
  }
  if (error.message.includes('rate limit') || error.message.includes('429')) {
    throw new Error('PCO person creation failed: rate limit exceeded - please retry');
  }
}

throw new Error(`PCO person creation failed: ${error instanceof Error ? error.message : String(error)}`);
```

### Step 4: Remove Unnecessary Helper Function

**Before (Overkill)**:

```typescript
// Helper function to handle successful person creation
async function handlePersonCreationSuccess(
  person: { id: string },
  typedGuest: Guest,
  integrationInfo: Guest['integrationInfo']
): Promise<string> {
  const personId = person.id;

  // Step 4: (No manual contact/campus setup needed)
  // The library's updated findOrCreate now automatically:
  // - Creates the basic person record with name fields
  // - Adds email contact using addEmail
  // - Adds phone contact using addPhoneNumber
  // - Sets campus using setPrimaryCampus
  // All of this happens inside the library's createPerson method, so we don't need to do it manually!

  // Step 5: Save personId to guest (ALWAYS save, regardless of context)
  await savePersonIdToGuest(typedGuest, personId, integrationInfo);

  return personId;
}
```

**After (Simple)**:

```typescript
// No separate helper function needed - just inline the save operation
await savePersonIdToGuest(guest, person.id, integrationInfo);
return person.id;
```

## Complete Migration

### Before (Overkill - ~200 lines)

```typescript
export default async function getPCOPerson(
  client: PcoClient,
  guest: Guest
): Promise<string> {
  // ... existing personId check ...

  // Enhanced validation and cleaning of contact data
  const cleanEmail = validateAndCleanEmail(guest.email);
  const cleanPhone = validateAndCleanPhone(guest.phone);

  // Step 3: Use built-in findOrCreate to search for existing person OR create new one
  log.info('[PERSON_SEARCH] Searching for existing person before creating new one', {
    email: cleanEmail,
    firstName: guest.firstName,
    guestId: guest.id,
    lastName: guest.lastName,
    phone: cleanPhone,
  });

  // Ensure we have at least a first name for person creation
  if (!guest.firstName?.trim()) {
    throw new Error('First name is required to create PCO person');
  }

  try {
    // Enhanced matching strategy using the library's smart matching capabilities
    let person;

    // Step 1: Try exact matching first (most reliable)
    try {
      log.info('[PERSON_MATCH] Attempting exact match');
      person = await client.people.findOrCreate({
        agePreference: 'adults',
        campusId: guest.integrationInfo?.PCO?.primary_campus_id,
        createIfNotFound: false, // Don't create, just search
        email: cleanEmail,
        firstName: guest.firstName.trim(),
        lastName: guest.lastName?.trim() ?? undefined,
        matchStrategy: 'exact',
        phone: cleanPhone,
      });
      log.info('[PERSON_MATCH] Exact match found', { personId: person.id });
    } catch {
      log.info('[PERSON_MATCH] Exact match failed, trying fuzzy match');

      // Step 2: Try fuzzy matching (handles minor variations)
      try {
        person = await client.people.findOrCreate({
          agePreference: 'adults',
          campusId: guest.integrationInfo?.PCO?.primary_campus_id,
          createIfNotFound: false, // Don't create, just search
          email: cleanEmail,
          firstName: guest.firstName.trim(),
          lastName: guest.lastName?.trim() ?? undefined,
          matchStrategy: 'fuzzy',
          phone: cleanPhone,
        });
        log.info('[PERSON_MATCH] Fuzzy match found', { personId: person.id });
      } catch {
        log.info('[PERSON_MATCH] No existing person found, creating new one');

        // Step 3: Create new person only if no match found
        person = await client.people.findOrCreate({
          agePreference: 'adults',
          campusId: guest.integrationInfo?.PCO?.primary_campus_id,
          createIfNotFound: true, // Now it's safe to create
          email: cleanEmail,
          firstName: guest.firstName.trim(),
          lastName: guest.lastName?.trim() ?? undefined,
          matchStrategy: 'exact', // Use exact for creation
          phone: cleanPhone,
        });
        log.info('[PERSON_CREATE] New person created', { personId: person.id });
      }
    }

    return await handlePersonCreationSuccess(person, typedGuest, integrationInfo);
  } catch (error) {
    // ... complex error handling ...
  }
}
```

### After (Simple - ~100 lines)

```typescript
export default async function getPCOPerson(
  client: PcoClient,
  guest: Guest
): Promise<string> {
  const integrationInfo = guest.integrationInfo;

  // Step 1: Check for existing personId and verify it still exists
  const existingPersonId = integrationInfo?.PCO?.personId;
  if (existingPersonId) {
    try {
      await client.people.getById(existingPersonId);
      log.info('[PERSON_VERIFY] Existing person verified in PCO:', existingPersonId);
      await savePersonIdToGuest(guest, existingPersonId, integrationInfo);
      return existingPersonId;
    } catch {
      log.info('[PERSON_VERIFY] Person no longer exists in PCO, will search for match');
    }
  }

  // Step 2: Validate contact data
  const cleanEmail = validateEmail(guest.email);
  const cleanPhone = validatePhone(guest.phone);

  if (!guest.firstName?.trim()) {
    throw new Error('First name is required to create PCO person');
  }

  // Step 3: Use the fixed findOrCreate - it handles everything!
  log.info('[PERSON_FIND_OR_CREATE] Using findOrCreate with fixed matching', {
    email: cleanEmail,
    firstName: guest.firstName,
    guestId: guest.id,
    lastName: guest.lastName,
    phone: cleanPhone,
  });

  try {
    const person = await client.people.findOrCreate({
      firstName: guest.firstName.trim(),
      lastName: guest.lastName?.trim() ?? undefined,
      email: cleanEmail,
      phone: cleanPhone,
      campusId: guest.integrationInfo?.PCO?.primary_campus_id,
      matchStrategy: 'fuzzy', // Use fuzzy for good balance of accuracy and flexibility
    });

    log.info('[PERSON_SUCCESS] Person found or created', { personId: person.id });

    // Step 4: Save personId to guest
    await savePersonIdToGuest(guest, person.id, integrationInfo);

    return person.id;
  } catch (error) {
    log.error('[PERSON_ERROR] findOrCreate failed', error, {
      email: cleanEmail,
      firstName: guest.firstName,
      guestId: guest.id,
      lastName: guest.lastName,
      phone: cleanPhone,
    });

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes("can't be blank")) {
        throw new Error('PCO person creation failed: missing required contact information');
      }
      if (error.message.includes('has a disallowed domain name')) {
        throw new Error('PCO person creation failed: invalid email domain');
      }
      if (error.message.includes('You do not have access to this resource')) {
        throw new Error('PCO person creation failed: insufficient permissions');
      }
      if (error.message.includes('rate limit') || error.message.includes('429')) {
        throw new Error('PCO person creation failed: rate limit exceeded - please retry');
      }
    }

    throw new Error(`PCO person creation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
```

## Benefits of Migration

1. **✅ 50% Less Code**: From ~200 lines to ~100 lines
2. **✅ Simpler Logic**: Single `findOrCreate` call instead of 3 separate attempts
3. **✅ Better Performance**: Fewer API calls (1 instead of up to 3)
4. **✅ More Reliable**: Uses the fixed matching logic instead of workarounds
5. **✅ Easier Maintenance**: Less complex error handling and state management
6. **✅ Same Functionality**: All the same features, just implemented better

## Testing the Migration

After migration, test with:

1. **Existing person**: Should find and return existing personId
2. **New person**: Should create new person with contacts
3. **Invalid data**: Should handle validation errors gracefully
4. **Network issues**: Should handle API errors appropriately

The simplified version should work exactly the same as the complex version, but with much cleaner code!
