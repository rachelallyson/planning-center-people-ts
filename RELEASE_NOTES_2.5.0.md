# Release Notes - v2.5.0

## 🎯 **Person Relationship Management & Token Refresh Fix**

This major release introduces comprehensive person relationship management endpoints and fixes critical token refresh issues, significantly enhancing the library's functionality and reliability.

## 🚀 **New Features**

### **👥 Person Relationship Management**

The library now provides dedicated, easy-to-use endpoints for managing all person relationships:

#### **🏢 Campus Management**

```typescript
// Get a person's current campus
const campus = await client.people.getPrimaryCampus('person-123');

// Set/update a person's campus
await client.people.setPrimaryCampus('person-123', 'campus-456');

// Remove campus assignment
await client.people.removePrimaryCampus('person-123');

// Get all people in a campus
const campusMembers = await client.people.getByCampus('campus-456', {
    include: ['primary_campus', 'household'],
    perPage: 50
});
```

#### **🏠 Household Management**

```typescript
// Get a person's household
const household = await client.people.getHousehold('person-123');

// Set a person's household
await client.people.setHousehold('person-123', 'household-789');

// Remove person from household
await client.people.removeFromHousehold('person-123');

// Get all household members
const householdMembers = await client.people.getHouseholdMembers('household-789', {
    include: ['household', 'primary_campus'],
    perPage: 50
});
```

#### **📋 Related Data Access**

```typescript
// Get person's workflow cards
const workflowCards = await client.people.getWorkflowCards('person-123');

// Get person's notes
const notes = await client.people.getNotes('person-123');

// Get person's field data
const fieldData = await client.people.getFieldData('person-123');

// Get person's social profiles
const socialProfiles = await client.people.getSocialProfiles('person-123');
```

### **🔐 Token Refresh Fix**

Fixed the critical "Token refresh failed: 401 Unauthorized" error by including required client credentials:

```typescript
// NEW: Add client credentials to your OAuth configuration
const client = new PcoClient({
    auth: {
        type: 'oauth',
        accessToken: 'your-token',
        refreshToken: 'your-refresh-token',
        clientId: 'your-app-id',        // NEW: Client credentials
        clientSecret: 'your-app-secret', // NEW: Client credentials
        onRefresh: async (tokens) => {
            // Save new tokens
            await saveTokensToDatabase(tokens);
        },
        onRefreshFailure: async (error) => {
            // Handle refresh failure
            console.error('Token refresh failed:', error);
        }
    }
});
```

**Environment Variables Support:**

```bash
export PCO_APP_ID=your-app-id
export PCO_APP_SECRET=your-app-secret
```

## 🔧 **Enhanced Type System**

- **Complete PersonRelationships**: Updated interface with all available relationships
- **Type Safety**: Full TypeScript support for all relationship operations
- **Null Handling**: Proper handling of optional relationships
- **Resource Validation**: Enhanced relationship data validation

## 🛠️ **Migration Guide**

### **From Direct API Calls**

**Before:**

```typescript
// Complex direct API calls
const response = await client.httpClient.request({
    method: 'PATCH',
    endpoint: `/people/${personId}`,
    data: {
        data: {
            type: 'Person',
            id: personId,
            attributes: {
                primary_campus_id: campusId
            }
        }
    }
});
```

**After:**

```typescript
// Simple, intuitive methods
await client.people.setPrimaryCampus(personId, campusId);
```

### **Token Refresh Configuration**

Add client credentials to your existing OAuth configuration:

```typescript
// Add these fields to your existing auth config
const client = new PcoClient({
    auth: {
        type: 'oauth',
        accessToken: 'your-token',
        refreshToken: 'your-refresh-token',
        clientId: process.env.PCO_APP_ID,        // NEW
        clientSecret: process.env.PCO_APP_SECRET, // NEW
        onRefresh: async (tokens) => { /* existing code */ },
        onRefreshFailure: async (error) => { /* existing code */ }
    }
});
```

## 📊 **Performance Improvements**

- **Efficient Single-Request Operations**: All relationship methods use optimized API calls
- **Proper Pagination Support**: Built-in pagination for large datasets
- **Batch Operation Capabilities**: Support for updating multiple people at once
- **Smart Caching**: Reduced API calls through intelligent relationship fetching

## 🛡️ **Error Handling**

Comprehensive error handling for all relationship operations:

```typescript
try {
    await client.people.setPrimaryCampus('person-id', 'campus-id');
    console.log('Campus updated successfully');
} catch (error) {
    if (error.message.includes('404')) {
        console.error('Person or campus not found');
    } else if (error.message.includes('403')) {
        console.error('Insufficient permissions');
    } else {
        console.error('Unexpected error:', error.message);
    }
}
```

## 🧪 **Testing**

- **244 Tests Passing**: All existing functionality preserved
- **Zero Breaking Changes**: Backward compatible with existing code
- **Comprehensive Coverage**: New relationship methods fully tested
- **Token Refresh Validation**: Fixed token refresh issues verified

## 📚 **Documentation**

- **Complete API Reference**: All new methods documented with examples
- **Migration Guide**: Step-by-step migration instructions
- **Usage Examples**: Practical examples for common scenarios
- **Error Handling Guide**: Comprehensive error handling documentation

## 🎉 **What's Next**

This release establishes a solid foundation for person relationship management. Future releases will build upon this with:

- **Advanced Relationship Queries**: More sophisticated relationship filtering
- **Bulk Relationship Operations**: Efficient bulk updates for multiple people
- **Relationship Analytics**: Insights into relationship patterns
- **Enhanced Caching**: Smart caching for relationship data

## 🔗 **Quick Start**

```typescript
import { PcoClient } from '@rachelallyson/planning-center-people-ts';

const client = new PcoClient({
    auth: {
        type: 'oauth',
        accessToken: 'your-token',
        refreshToken: 'your-refresh-token',
        clientId: 'your-app-id',        // NEW
        clientSecret: 'your-app-secret', // NEW
        onRefresh: async (tokens) => { /* handle refresh */ },
        onRefreshFailure: async (error) => { /* handle failure */ }
    }
});

// Get and set campus
const campus = await client.people.getPrimaryCampus('person-123');
await client.people.setPrimaryCampus('person-123', 'campus-456');

// Get and set household
const household = await client.people.getHousehold('person-123');
await client.people.setHousehold('person-123', 'household-789');
```

---

**Ready for Production**: This release is fully tested, documented, and ready for production use. The new relationship management endpoints provide a much more intuitive and type-safe way to work with person relationships in Planning Center.
