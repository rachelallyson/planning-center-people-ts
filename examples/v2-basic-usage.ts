/**
 * v2.0.0 Basic Usage Examples
 */

import { PcoClient, PcoClientManager } from '@rachelallyson/planning-center-people-ts';

// Example 1: Basic client setup
async function basicSetup() {
    const client = new PcoClient({
        auth: {
            type: 'oauth',
            accessToken: 'your-access-token',
            refreshToken: 'your-refresh-token',
            onRefresh: (tokens) => {
                console.log('Tokens refreshed:', tokens);
                // Save new tokens to your database
            },
        },
        caching: {
            fieldDefinitions: true,
            ttl: 300000, // 5 minutes
        },
        retry: {
            enabled: true,
            maxRetries: 3,
            backoff: 'exponential',
        },
        events: {
            onError: (event) => {
                console.error('PCO Error:', event.error);
                // Send to your error tracking service
            },
            onAuthFailure: (event) => {
                console.error('Auth failed:', event.error);
                // Notify administrators
            },
        },
    });

    return client;
}

// Example 2: Using client manager for caching
async function clientManagerExample() {
    // Get a client with automatic caching
    const client = PcoClientManager.getClient({
        auth: {
            type: 'oauth',
            accessToken: 'your-access-token',
        },
    });

    // Or for multi-tenant applications
    const churchClient = await PcoClientManager.getClientForChurch(
        'church-123',
        async (churchId) => {
            // Fetch configuration from your database
            return {
                auth: {
                    type: 'oauth',
                    accessToken: await getAccessTokenForChurch(churchId),
                },
            };
        }
    );

    return { client, churchClient };
}

// Example 3: People operations with smart matching
async function peopleOperations(client: PcoClient) {
    // Get all people with pagination
    const allPeople = await client.people.getAllPages({
        where: { status: 'active' },
        include: ['emails', 'phone_numbers'],
    });

    console.log(`Found ${allPeople.data.length} people`);

    // Smart person matching and creation
    const person = await client.people.findOrCreate({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '555-1234',
        matchStrategy: 'fuzzy',
        createIfNotFound: true,
    });

    console.log('Person found/created:', person.id);

    // Age preference matching examples
    console.log('\n--- Age Preference Examples ---');

    // Prefer adults (18+ years old)
    const adultPerson = await client.people.findOrCreate({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        agePreference: 'adults',
        matchStrategy: 'fuzzy',
    });
    console.log('Adult person found:', adultPerson.id);

    // Prefer children (under 18 years old)
    const childPerson = await client.people.findOrCreate({
        firstName: 'Bobby',
        lastName: 'Johnson',
        agePreference: 'children',
        matchStrategy: 'fuzzy',
    });
    console.log('Child person found:', childPerson.id);

    // Match by age range
    const youngAdult = await client.people.findOrCreate({
        firstName: 'Alice',
        lastName: 'Brown',
        email: 'alice@example.com',
        minAge: 20,
        maxAge: 30,
        matchStrategy: 'fuzzy',
    });
    console.log('Young adult found:', youngAdult.id);

    // Match by birth year
    const millennial = await client.people.findOrCreate({
        firstName: 'David',
        lastName: 'Wilson',
        birthYear: 1990,
        matchStrategy: 'fuzzy',
    });
    console.log('Millennial found:', millennial.id);

    // Create person with contact information
    const personWithContacts = await client.people.createWithContacts(
        {
            firstName: 'Jane',
            lastName: 'Smith',
        },
        {
            email: { address: 'jane@example.com', primary: true },
            phone: { number: '555-5678', primary: true },
        }
    );

    return { person, personWithContacts };
}

// Example 4: Type-safe field operations
async function fieldOperations(client: PcoClient) {
    const personId = 'person-123';

    // Set field by slug (with automatic field definition lookup)
    await client.fields.setPersonFieldBySlug(personId, 'BIRTHDATE', '1990-01-01');

    // Set field by name
    await client.fields.setPersonFieldByName(personId, 'Membership Status', 'Member');

    // Set field with options
    await client.fields.setPersonField(personId, {
        fieldSlug: 'CUSTOM_FIELD',
        value: 'Some value',
        handleFileUploads: true,
    });

    // Get all field definitions (cached)
    const fieldDefinitions = await client.fields.getAllFieldDefinitions();
    console.log(`Found ${fieldDefinitions.length} field definitions`);
}

// Example 5: Smart workflow operations
async function workflowOperations(client: PcoClient) {
    const personId = 'person-123';
    const workflowId = 'workflow-456';

    // Add person to workflow with duplicate detection
    const workflowCard = await client.workflows.addPersonToWorkflow(
        personId,
        workflowId,
        {
            note: 'Added from integration',
            skipIfExists: true, // Don't add if already completed/removed
            skipIfActive: true, // Don't add if already active
        }
    );

    console.log('Workflow card created:', workflowCard.id);

    // Get all workflows
    const allWorkflows = await client.workflows.getAllPages();
    console.log(`Found ${allWorkflows.data.length} workflows`);
}

// Example 6: Batch operations
async function batchOperations(client: PcoClient) {
    const results = await client.batch.execute([
        {
            type: 'people.create',
            data: {
                firstName: 'John',
                lastName: 'Doe',
            },
        },
        {
            type: 'people.addEmail',
            personId: '$0.id', // Reference the person created in step 0
            data: {
                address: 'john@example.com',
                primary: true,
            },
        },
        {
            type: 'people.addPhone',
            personId: '$0.id',
            data: {
                number: '555-1234',
                primary: true,
            },
        },
    ]);

    console.log(`Batch completed: ${results.successful.length} successful, ${results.failed.length} failed`);
    console.log(`Success rate: ${(results.successRate * 100).toFixed(1)}%`);
}

// Example 7: Event monitoring
async function eventMonitoring(client: PcoClient) {
    // Set up event listeners
    client.on('request:start', (event) => {
        console.log(`Starting request: ${event.method} ${event.endpoint}`);
    });

    client.on('request:complete', (event) => {
        console.log(`Request completed: ${event.status} in ${event.duration}ms`);
    });

    client.on('error', (event) => {
        console.error(`Error in ${event.operation}:`, event.error);
    });

    client.on('rate:limit', (event) => {
        console.warn(`Rate limited: ${event.remaining}/${event.limit} remaining`);
    });

    // Get performance metrics
    const metrics = client.getPerformanceMetrics();
    console.log('Performance metrics:', metrics);

    // Get rate limit info
    const rateLimitInfo = client.getRateLimitInfo();
    console.log('Rate limit info:', rateLimitInfo);
}

// Example 8: Complete workflow
async function completeWorkflow() {
    const client = new PcoClient({
        auth: {
            type: 'oauth',
            accessToken: process.env.PCO_ACCESS_TOKEN!,
        },
    });

    try {
        // 1. Find or create a person
        const person = await client.people.findOrCreate({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            matchStrategy: 'fuzzy',
        });

        // 2. Set custom fields
        await client.fields.setPersonFieldBySlug(person.id, 'BIRTHDATE', '1990-01-01');
        await client.fields.setPersonFieldByName(person.id, 'Membership Status', 'Member');

        // 3. Add to workflow
        const workflowCard = await client.workflows.addPersonToWorkflow(
            person.id,
            'new-member-workflow',
            {
                note: 'New member added via integration',
                skipIfExists: true,
            }
        );

        console.log('Complete workflow finished successfully');
        return { person, workflowCard };
    } catch (error) {
        console.error('Workflow failed:', error);
        throw error;
    }
}

// Helper function for multi-tenant example
async function getAccessTokenForChurch(churchId: string): Promise<string> {
    // This would typically fetch from your database
    return 'church-access-token';
}

export {
    basicSetup,
    clientManagerExample,
    peopleOperations,
    fieldOperations,
    workflowOperations,
    batchOperations,
    eventMonitoring,
    completeWorkflow,
};
