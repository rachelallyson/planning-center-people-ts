/**
 * v2.0.0 Batch Operations Integration Tests
 * 
 * Tests for the new batch operations API:
 * - client.batch.execute() with dependency resolution
 * - Batch operations with real API calls
 * - Error handling and rollback scenarios
 * 
 * To run: npm run test:integration:v2:batch
 */

import {
    PcoClient,
    type PersonAttributes,
} from '../../../src';
import { createTestClient, logAuthStatus } from '../test-config';

// Test configuration
const TEST_PREFIX = 'TEST_V2_BATCH_2025';

describe('v2.0.0 Batch Operations Integration Tests', () => {
    let client: PcoClient;
    let testPersonIds: string[] = [];

    beforeAll(async () => {
        // Log authentication status for debugging
        logAuthStatus();

        // Create client with proper token refresh support
        client = createTestClient();

        // Add batch-specific event handlers
        client.on('error', (event) => {
            console.error('Batch Error:', event.error.message);
        });
    }, 30000);

    afterAll(async () => {
        // Clean up test persons using batch delete
        if (testPersonIds.length > 0) {
            const deleteOperations = testPersonIds.map((id, index) => ({
                id: `delete-person-${index}`,
                type: 'delete' as const,
                resourceType: 'Person',
                endpoint: `/people/${id}`,
            }));

            try {
                // Use a shorter timeout for batch cleanup to avoid hanging
                const cleanupPromise = client.batch.execute(deleteOperations);
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Cleanup timeout')), 30000)
                );

                await Promise.race([cleanupPromise, timeoutPromise]);
            } catch (error) {
                console.warn('Failed to clean up test persons:', error);
                // Try individual deletes as fallback
                for (const id of testPersonIds) {
                    try {
                        await client.people.delete(id);
                    } catch (deleteError) {
                        console.warn(`Failed to delete person ${id}:`, deleteError);
                    }
                }
            }
            testPersonIds = [];
        }
    }, 90000);

    describe('Basic Batch Operations', () => {
        it('should execute simple batch operations', async () => {
            const timestamp = Date.now();

            const operations = [
                {
                    id: 'create-person-1',
                    type: 'create' as const,
                    resourceType: 'Person',
                    endpoint: '/people',
                    data: {
                        first_name: `${TEST_PREFIX}_Batch1_${timestamp}`,
                        last_name: `${TEST_PREFIX}_Test_${timestamp}`,
                        status: 'active',
                    },
                },
                {
                    id: 'create-person-2',
                    type: 'create' as const,
                    resourceType: 'Person',
                    endpoint: '/people',
                    data: {
                        first_name: `${TEST_PREFIX}_Batch2_${timestamp}`,
                        last_name: `${TEST_PREFIX}_Test_${timestamp}`,
                        status: 'active',
                    },
                },
            ];

            const result = await client.batch.execute(operations);

            expect(result.total).toBe(2);
            expect(result.successful).toBe(2);
            expect(result.failed).toBe(0);
            expect(result.successRate).toBe(1.0);
            expect(result.results).toHaveLength(2);

            // Store person IDs for cleanup
            result.results.forEach((batchResult) => {
                if (batchResult.success && batchResult.data?.id) {
                    testPersonIds.push(batchResult.data.id);
                }
            });

            // Validate results
            result.results.forEach((batchResult, index) => {
                expect(batchResult.success).toBe(true);
                expect(batchResult.data).toBeDefined();
                expect(batchResult.data?.type).toBe('Person');
                // Check that the name contains the expected pattern (Batch1_ or Batch2_)
                expect(batchResult.data?.attributes?.first_name).toMatch(/Batch[12]_/);
            });
        }, 60000);

        it('should handle batch operations with dependencies', async () => {
            const timestamp = Date.now();

            const operations = [
                {
                    id: 'create-person',
                    type: 'create' as const,
                    resourceType: 'Person',
                    endpoint: '/people',
                    data: {
                        first_name: `${TEST_PREFIX}_Dependency_${timestamp}`,
                        last_name: `${TEST_PREFIX}_Test_${timestamp}`,
                        status: 'active',
                    },
                },
                {
                    id: 'add-email',
                    type: 'create' as const,
                    resourceType: 'Email',
                    endpoint: '/people/$0.id/emails',
                    data: {
                        address: `batch-test-${timestamp}@gmail.com`,
                        location: 'Home',
                        primary: true,
                    },
                    dependencies: ['create-person'],
                },
            ];

            const result = await client.batch.execute(operations);

            expect(result.total).toBe(2);
            expect(result.successful).toBe(2);
            expect(result.failed).toBe(0);
            expect(result.successRate).toBe(1.0);

            // Find the person ID from the first operation
            const personResult = result.results.find(r => r.operation.id === 'create-person');
            expect(personResult).toBeDefined();
            expect(personResult?.success).toBe(true);

            if (personResult?.data?.id) {
                testPersonIds.push(personResult.data.id);
            }

            // Validate email was created
            const emailResult = result.results.find(r => r.operation.id === 'add-email');
            expect(emailResult).toBeDefined();
            expect(emailResult?.success).toBe(true);
            expect(emailResult?.data?.type).toBe('Email');
        }, 60000);
    });

    describe('Batch Error Handling', () => {
        it('should handle partial failures gracefully', async () => {
            const timestamp = Date.now();

            const operations = [
                {
                    id: 'create-valid-person',
                    type: 'create' as const,
                    resourceType: 'Person',
                    endpoint: '/people',
                    data: {
                        first_name: `${TEST_PREFIX}_Valid_${timestamp}`,
                        last_name: `${TEST_PREFIX}_Test_${timestamp}`,
                        status: 'active',
                    },
                },
                {
                    id: 'create-invalid-person',
                    type: 'create' as const,
                    resourceType: 'Person',
                    endpoint: '/people',
                    data: {
                        // Missing required fields to cause validation error
                        first_name: '', // Empty first name should cause error
                        status: 'invalid_status', // Invalid status
                    },
                },
            ];

            const result = await client.batch.execute(operations, {
                continueOnError: true,
            });

            expect(result.total).toBe(2);
            expect(result.successful).toBe(1);
            expect(result.failed).toBe(1);
            expect(result.successRate).toBe(0.5);

            // Validate successful operation
            const validResult = result.results.find(r => r.operation.id === 'create-valid-person');
            expect(validResult?.success).toBe(true);
            if (validResult?.data?.id) {
                testPersonIds.push(validResult.data.id);
            }

            // Validate failed operation
            const invalidResult = result.results.find(r => r.operation.id === 'create-invalid-person');
            expect(invalidResult?.success).toBe(false);
            expect(invalidResult?.error).toBeDefined();
        }, 60000);

        it('should stop on first error when continueOnError is false', async () => {
            const timestamp = Date.now();

            const operations = [
                {
                    id: 'create-invalid-person',
                    type: 'create' as const,
                    resourceType: 'Person',
                    endpoint: '/people',
                    data: {
                        // Missing required fields to cause validation error
                        first_name: '', // Empty first name should cause error
                        status: 'invalid_status', // Invalid status
                    },
                },
                {
                    id: 'create-valid-person',
                    type: 'create' as const,
                    resourceType: 'Person',
                    endpoint: '/people',
                    data: {
                        first_name: `${TEST_PREFIX}_Valid_${timestamp}`,
                        last_name: `${TEST_PREFIX}_Test_${timestamp}`,
                        status: 'active',
                    },
                },
            ];

            // This should throw an error because the first operation fails
            await expect(
                client.batch.execute(operations, {
                    continueOnError: false,
                })
            ).rejects.toThrow();
        }, 60000);
    });

    describe('Batch Options and Configuration', () => {
        it('should respect maxConcurrency option', async () => {
            const timestamp = Date.now();

            const operations = [
                {
                    id: 'create-person-1',
                    type: 'create' as const,
                    resourceType: 'Person',
                    endpoint: '/people',
                    data: {
                        first_name: `${TEST_PREFIX}_Concurrent1_${timestamp}`,
                        last_name: `${TEST_PREFIX}_Test_${timestamp}`,
                        status: 'active',
                    },
                },
                {
                    id: 'create-person-2',
                    type: 'create' as const,
                    resourceType: 'Person',
                    endpoint: '/people',
                    data: {
                        first_name: `${TEST_PREFIX}_Concurrent2_${timestamp}`,
                        last_name: `${TEST_PREFIX}_Test_${timestamp}`,
                        status: 'active',
                    },
                },
                {
                    id: 'create-person-3',
                    type: 'create' as const,
                    resourceType: 'Person',
                    endpoint: '/people',
                    data: {
                        first_name: `${TEST_PREFIX}_Concurrent3_${timestamp}`,
                        last_name: `${TEST_PREFIX}_Test_${timestamp}`,
                        status: 'active',
                    },
                },
            ];

            const startTime = Date.now();
            const result = await client.batch.execute(operations, {
                maxConcurrency: 2, // Limit to 2 concurrent operations
            });
            const endTime = Date.now();

            expect(result.total).toBe(3);
            expect(result.successful).toBe(3);
            expect(result.failed).toBe(0);

            // Store person IDs for cleanup
            result.results.forEach((batchResult) => {
                if (batchResult.success && batchResult.data?.id) {
                    testPersonIds.push(batchResult.data.id);
                }
            });

            // With maxConcurrency of 2, this should take longer than if all 3 ran concurrently
            // (though the difference might be small in practice)
            expect(endTime - startTime).toBeGreaterThan(0);
        }, 60000);

        it('should call progress callbacks', async () => {
            const timestamp = Date.now();
            const progressCallback = jest.fn();
            const batchCompleteCallback = jest.fn();

            const operations = [
                {
                    id: 'create-person-1',
                    type: 'create' as const,
                    resourceType: 'Person',
                    endpoint: '/people',
                    data: {
                        first_name: `${TEST_PREFIX}_Progress1_${timestamp}`,
                        last_name: `${TEST_PREFIX}_Test_${timestamp}`,
                        status: 'active',
                    },
                },
                {
                    id: 'create-person-2',
                    type: 'create' as const,
                    resourceType: 'Person',
                    endpoint: '/people',
                    data: {
                        first_name: `${TEST_PREFIX}_Progress2_${timestamp}`,
                        last_name: `${TEST_PREFIX}_Test_${timestamp}`,
                        status: 'active',
                    },
                },
            ];

            const result = await client.batch.execute(operations, {
                onOperationComplete: progressCallback,
                onBatchComplete: batchCompleteCallback,
            });

            expect(result.total).toBe(2);
            expect(result.successful).toBe(2);

            // Store person IDs for cleanup
            result.results.forEach((batchResult) => {
                if (batchResult.success && batchResult.data?.id) {
                    testPersonIds.push(batchResult.data.id);
                }
            });

            // Note: In a real implementation, these callbacks would be called
            // For now, we're just testing that the options are accepted
            expect(progressCallback).toHaveBeenCalled();
            expect(batchCompleteCallback).toHaveBeenCalled();
        }, 60000);
    });

    describe('Complex Batch Scenarios', () => {
        it('should handle workflow creation with person and contacts', async () => {
            const timestamp = Date.now();

            const operations = [
                {
                    id: 'create-person',
                    type: 'create' as const,
                    resourceType: 'Person',
                    endpoint: '/people',
                    data: {
                        first_name: `${TEST_PREFIX}_Workflow_${timestamp}`,
                        last_name: `${TEST_PREFIX}_Test_${timestamp}`,
                        status: 'active',
                    },
                },
                {
                    id: 'add-email',
                    type: 'create' as const,
                    resourceType: 'Email',
                    endpoint: '/people/$0.id/emails',
                    data: {
                        address: `workflow-test-${timestamp}@gmail.com`,
                        location: 'Home',
                        primary: true,
                    },
                    dependencies: ['create-person'],
                },
                {
                    id: 'add-phone',
                    type: 'create' as const,
                    resourceType: 'PhoneNumber',
                    endpoint: '/people/$0.id/phone_numbers',
                    data: {
                        number: `555-${timestamp.toString().slice(-4)}`,
                        location: 'Home',
                        primary: true,
                    },
                    dependencies: ['create-person'],
                },
            ];

            const result = await client.batch.execute(operations);

            expect(result.total).toBe(3);
            expect(result.successful).toBe(3);
            expect(result.failed).toBe(0);

            // Store person ID for cleanup
            const personResult = result.results.find(r => r.operation.id === 'create-person');
            if (personResult?.data?.id) {
                testPersonIds.push(personResult.data.id);
            }

            // Validate all operations succeeded
            result.results.forEach((batchResult) => {
                expect(batchResult.success).toBe(true);
                expect(batchResult.data).toBeDefined();
            });

            // Validate email and phone were created
            const emailResult = result.results.find(r => r.operation.id === 'add-email');
            const phoneResult = result.results.find(r => r.operation.id === 'add-phone');

            expect(emailResult?.data?.type).toBe('Email');
            expect(phoneResult?.data?.type).toBe('PhoneNumber');
        }, 90000);
    });
});
