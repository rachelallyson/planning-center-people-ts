/**
 * v2.0.0 Batch Operations Tests
 */

import { createTestClient, MockResponseBuilder } from '../src';

describe('Batch Operations v2.0.0', () => {
    let mockClient: any;

    beforeEach(() => {
        mockClient = createTestClient();
    });

    describe('Basic Batch Execution', () => {
        it('should execute simple batch operations', async () => {
            const operations = [
                { type: 'people.create', data: { firstName: 'John', lastName: 'Doe' } },
                { type: 'people.create', data: { firstName: 'Jane', lastName: 'Smith' } },
            ];

            const result = await mockClient.batch.execute(operations);

            expect(result.total).toBe(2);
            expect(result.successful).toBe(2);
            expect(result.failed).toBe(0);
            expect(result.successRate).toBe(1.0);
            expect(result.results).toHaveLength(2);
            expect(result.duration).toBeGreaterThan(0);
        });

        it('should handle batch operations with references', async () => {
            const operations = [
                { type: 'people.create', data: { firstName: 'John', lastName: 'Doe' } },
                {
                    type: 'people.addEmail',
                    personId: '$0.id',
                    data: { address: 'john@example.com', primary: true }
                },
                {
                    type: 'people.addPhone',
                    personId: '$0.id',
                    data: { number: '555-1234', primary: true }
                },
            ];

            const result = await mockClient.batch.execute(operations);

            expect(result.total).toBe(3);
            expect(result.successful).toBe(3);
            expect(result.failed).toBe(0);
            expect(result.results).toHaveLength(3);
        });
    });

    describe('Batch with Failures', () => {
        it('should handle partial failures', async () => {
            const failingClient = createTestClient({
                batch: {
                    execute: (operations: any[]) => {
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

            const operations = [
                { type: 'people.create', data: { firstName: 'Success', lastName: 'Person' } },
                { type: 'people.create', data: { firstName: 'Failure', lastName: 'Person' } },
                { type: 'people.create', data: { firstName: 'Another', lastName: 'Success' } },
            ];

            const result = await failingClient.batch.execute(operations);

            expect(result.total).toBe(3);
            expect(result.successful).toBe(2);
            expect(result.failed).toBe(1);
            expect(result.successRate).toBeCloseTo(0.667, 2);
            expect(result.results[1].success).toBe(false);
            expect(result.results[1].error).toBeDefined();
        });
    });

    describe('Batch Options', () => {
        it('should support continueOnError option', async () => {
            const operations = [
                { type: 'people.create', data: { firstName: 'Success', lastName: 'Person' } },
                { type: 'people.create', data: { firstName: 'Failure', lastName: 'Person' } },
            ];

            // Test with continueOnError: true (default)
            const result1 = await mockClient.batch.execute(operations, { continueOnError: true });
            expect(result1.total).toBe(2);

            // Test with continueOnError: false
            const result2 = await mockClient.batch.execute(operations, { continueOnError: false });
            expect(result2.total).toBe(2);
        });

        it('should support maxConcurrency option', async () => {
            const operations = [
                { type: 'people.create', data: { firstName: 'Person', lastName: '1' } },
                { type: 'people.create', data: { firstName: 'Person', lastName: '2' } },
                { type: 'people.create', data: { firstName: 'Person', lastName: '3' } },
            ];

            const result = await mockClient.batch.execute(operations, { maxConcurrency: 2 });
            expect(result.total).toBe(3);
        });

        it('should support progress callbacks', async () => {
            const operations = [
                { type: 'people.create', data: { firstName: 'Person', lastName: '1' } },
                { type: 'people.create', data: { firstName: 'Person', lastName: '2' } },
            ];

            const onOperationComplete = jest.fn();
            const onBatchComplete = jest.fn();

            const result = await mockClient.batch.execute(operations, {
                onOperationComplete,
                onBatchComplete,
            });

            expect(result.total).toBe(2);
            // Note: In a real implementation, these callbacks would be called
            // For the mock, we're just testing that the options are accepted
        });
    });

    describe('Complex Batch Scenarios', () => {
        it('should handle workflow creation with person and notes', async () => {
            const operations = [
                { type: 'people.create', data: { firstName: 'New', lastName: 'Member' } },
                {
                    type: 'workflows.addPersonToWorkflow',
                    personId: '$0.id',
                    workflowId: 'new-member-workflow',
                    data: { note: 'Welcome to our church!' }
                },
                {
                    type: 'people.addEmail',
                    personId: '$0.id',
                    data: { address: 'newmember@example.com', primary: true }
                },
            ];

            const result = await mockClient.batch.execute(operations);

            expect(result.total).toBe(3);
            expect(result.successful).toBe(3);
            expect(result.results[0].operation.type).toBe('people.create');
            expect(result.results[1].operation.type).toBe('workflows.addPersonToWorkflow');
            expect(result.results[2].operation.type).toBe('people.addEmail');
        });

        it('should handle field data creation with person', async () => {
            const operations = [
                { type: 'people.create', data: { firstName: 'Test', lastName: 'User' } },
                {
                    type: 'fields.setPersonField',
                    personId: '$0.id',
                    fieldSlug: 'BIRTHDATE',
                    value: '1990-01-01'
                },
                {
                    type: 'fields.setPersonField',
                    personId: '$0.id',
                    fieldSlug: 'MEMBERSHIP_STATUS',
                    value: 'Member'
                },
            ];

            const result = await mockClient.batch.execute(operations);

            expect(result.total).toBe(3);
            expect(result.successful).toBe(3);
        });
    });

    describe('Batch Result Analysis', () => {
        it('should provide detailed result information', async () => {
            const operations = [
                { type: 'people.create', data: { firstName: 'John', lastName: 'Doe' } },
                { type: 'people.create', data: { firstName: 'Jane', lastName: 'Smith' } },
            ];

            const result = await mockClient.batch.execute(operations);

            expect(result.results).toHaveLength(2);

            result.results.forEach((batchResult: any, index: number) => {
                expect(batchResult.index).toBe(index);
                expect(batchResult.operation).toBeDefined();
                expect(batchResult.success).toBe(true);
                expect(batchResult.data).toBeDefined();
                expect(batchResult.error).toBeUndefined();
            });
        });

        it('should calculate success rate correctly', async () => {
            const operations = [
                { type: 'people.create', data: { firstName: 'Success', lastName: '1' } },
                { type: 'people.create', data: { firstName: 'Success', lastName: '2' } },
                { type: 'people.create', data: { firstName: 'Success', lastName: '3' } },
                { type: 'people.create', data: { firstName: 'Success', lastName: '4' } },
            ];

            const result = await mockClient.batch.execute(operations);

            expect(result.successRate).toBe(1.0);
            expect(result.successful).toBe(4);
            expect(result.failed).toBe(0);
        });
    });

    describe('Error Handling', () => {
        it('should handle batch execution errors gracefully', async () => {
            const errorClient = createTestClient({
                batch: {
                    execute: () => Promise.reject(new Error('Batch execution failed')),
                },
            });

            const operations = [
                { type: 'people.create', data: { firstName: 'Test', lastName: 'User' } },
            ];

            await expect(errorClient.batch.execute(operations)).rejects.toThrow('Batch execution failed');
        });

        it('should handle invalid operation types', async () => {
            const operations = [
                { type: 'invalid.operation', data: { test: 'data' } },
            ];

            // The mock client will handle this gracefully
            const result = await mockClient.batch.execute(operations);
            expect(result.total).toBe(1);
        });
    });
});
