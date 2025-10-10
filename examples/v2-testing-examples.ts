/**
 * v2.0.0 Testing Examples
 */

import {
    createTestClient,
    createErrorMockClient,
    createSlowMockClient,
    MockResponseBuilder
} from '@rachelallyson/planning-center-people-ts';

// Example 1: Basic test client
async function basicTestingExample() {
    const client = createTestClient();

    // Test people operations
    const people = await client.people.getAll();
    console.log('People:', people.data.length);

    const person = await client.people.create({
        firstName: 'Jane',
        lastName: 'Smith',
    });
    console.log('Created person:', person.id);

    // Test field operations
    const fieldDefs = await client.fields.getAllFieldDefinitions();
    console.log('Field definitions:', fieldDefs.length);

    // Test batch operations
    const batchResults = await client.batch.execute([
        { type: 'people.create', data: { firstName: 'Test', lastName: 'User' } },
        { type: 'people.create', data: { firstName: 'Another', lastName: 'User' } },
    ]);
    console.log('Batch results:', batchResults.successful.length);
}

// Example 2: Custom mock responses
async function customMockExample() {
    const client = createTestClient({
        people: {
            getAll: () => Promise.resolve({
                data: [
                    MockResponseBuilder.person({ first_name: 'Custom', last_name: 'Person' }),
                    MockResponseBuilder.person({ first_name: 'Another', last_name: 'Person' }),
                ],
                meta: { total_count: 2 },
                links: { self: '/people', next: null, prev: null },
            }),

            findOrCreate: (options: any) => Promise.resolve(
                MockResponseBuilder.person({
                    first_name: options.firstName,
                    last_name: options.lastName,
                    id: 'found_person_123',
                })
            ),
        },

        workflows: {
            addPersonToWorkflow: () => Promise.resolve(
                MockResponseBuilder.workflowCard({
                    id: 'workflow_card_123',
                    completed_at: null,
                })
            ),
        },
    });

    const people = await client.people.getAll();
    console.log('Custom people:', people.data.length);

    const person = await client.people.findOrCreate({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
    });
    console.log('Found/created person:', person.id);

    const workflowCard = await client.workflows.addPersonToWorkflow(
        'person_123',
        'workflow_456',
        { note: 'Test note' }
    );
    console.log('Workflow card:', workflowCard.id);
}

// Example 3: Error testing
async function errorTestingExample() {
    const errorClient = createErrorMockClient('auth');

    try {
        await errorClient.people.getAll();
    } catch (error) {
        console.log('Caught expected error:', error.message);
    }

    const rateLimitClient = createErrorMockClient('rate_limit');

    try {
        await rateLimitClient.people.getAll();
    } catch (error) {
        console.log('Caught rate limit error:', error.message);
    }
}

// Example 4: Performance testing
async function performanceTestingExample() {
    const slowClient = createSlowMockClient(2000); // 2 second delay

    console.time('Slow request');
    await slowClient.people.getAll();
    console.timeEnd('Slow request');
}

// Example 5: Integration test simulation
async function integrationTestExample() {
    const client = createTestClient({
        people: {
            create: (data: any) => Promise.resolve(
                MockResponseBuilder.person({
                    id: 'person_new_123',
                    first_name: data.firstName,
                    last_name: data.lastName,
                })
            ),

            addEmail: (personId: string, data: any) => Promise.resolve(
                MockResponseBuilder.email({
                    id: 'email_new_123',
                    address: data.address,
                    person_id: personId,
                })
            ),
        },

        workflows: {
            addPersonToWorkflow: () => Promise.resolve(
                MockResponseBuilder.workflowCard({
                    id: 'workflow_card_new_123',
                })
            ),
        },
    });

    // Simulate a complete workflow
    const person = await client.people.create({
        firstName: 'Integration',
        lastName: 'Test',
    });

    const email = await client.people.addEmail(person.id, {
        address: 'integration@example.com',
        primary: true,
    });

    const workflowCard = await client.workflows.addPersonToWorkflow(
        person.id,
        'new-member-workflow',
        { note: 'Added via integration test' }
    );

    console.log('Integration test completed:');
    console.log('- Person:', person.id);
    console.log('- Email:', email.id);
    console.log('- Workflow card:', workflowCard.id);
}

// Example 6: Batch operation testing
async function batchOperationTestingExample() {
    const client = createTestClient({
        batch: {
            execute: (operations: any[]) => {
                // Simulate some operations failing
                const results = operations.map((op, index) => ({
                    index,
                    operation: op,
                    success: index !== 1, // Second operation fails
                    data: index !== 1 ? { id: `result_${index}` } : undefined,
                    error: index === 1 ? new Error('Simulated failure') : undefined,
                }));

                return Promise.resolve({
                    total: operations.length,
                    successful: results.filter(r => r.success).length,
                    failed: results.filter(r => !r.success).length,
                    successRate: results.filter(r => r.success).length / results.length,
                    duration: 150,
                    results,
                });
            },
        },
    });

    const batchResults = await client.batch.execute([
        { type: 'people.create', data: { firstName: 'First', lastName: 'Person' } },
        { type: 'people.create', data: { firstName: 'Second', lastName: 'Person' } },
        { type: 'people.create', data: { firstName: 'Third', lastName: 'Person' } },
    ]);

    console.log('Batch operation results:');
    console.log(`- Total: ${batchResults.total}`);
    console.log(`- Successful: ${batchResults.successful}`);
    console.log(`- Failed: ${batchResults.failed}`);
    console.log(`- Success rate: ${(batchResults.successRate * 100).toFixed(1)}%`);
}

// Example 7: Event system testing
async function eventSystemTestingExample() {
    const client = createTestClient();

    // Set up event listeners
    client.on('request:start', (event: any) => {
        console.log('Request started:', event.endpoint);
    });

    client.on('request:complete', (event: any) => {
        console.log('Request completed:', event.status, 'in', event.duration, 'ms');
    });

    client.on('error', (event: any) => {
        console.log('Error occurred:', event.error.message);
    });

    // Make some requests to trigger events
    await client.people.getAll();
    await client.fields.getAllFieldDefinitions();
    await client.workflows.getAll();
}

// Run examples
async function runExamples() {
    console.log('=== Basic Testing Example ===');
    await basicTestingExample();

    console.log('\n=== Custom Mock Example ===');
    await customMockExample();

    console.log('\n=== Error Testing Example ===');
    await errorTestingExample();

    console.log('\n=== Performance Testing Example ===');
    await performanceTestingExample();

    console.log('\n=== Integration Test Example ===');
    await integrationTestExample();

    console.log('\n=== Batch Operation Testing Example ===');
    await batchOperationTestingExample();

    console.log('\n=== Event System Testing Example ===');
    await eventSystemTestingExample();
}

export {
    basicTestingExample,
    customMockExample,
    errorTestingExample,
    performanceTestingExample,
    integrationTestExample,
    batchOperationTestingExample,
    eventSystemTestingExample,
    runExamples,
};
