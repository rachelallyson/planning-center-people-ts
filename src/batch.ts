/**
 * v2.0.0 Batch Operations Executor
 */

import type { PcoClient } from './client';
import type { PcoEventEmitter } from './monitoring';
import type { BatchOperation, BatchResult, BatchOptions, BatchSummary, ResolvedBatchOperation } from './types/batch';

export class BatchExecutor {
    constructor(
        private client: PcoClient,
        private eventEmitter: PcoEventEmitter
    ) { }

    /**
     * Execute a batch of operations
     */
    async execute<T = any>(
        operations: BatchOperation[],
        options: BatchOptions = {}
    ): Promise<BatchSummary> {
        const {
            continueOnError = true,
            maxConcurrency = 5,
            enableRollback = false,
            onOperationComplete,
            onBatchComplete,
        } = options;

        const startTime = Date.now();
        const results: BatchResult[] = [];
        const successfulOperations: ResolvedBatchOperation[] = [];

        try {
            // Resolve operation dependencies and references
            const resolvedOperations = await this.resolveOperations(operations);

            // Execute operations with dependency resolution
            const semaphore = new Semaphore(maxConcurrency);
            const operationResults = new Map<string, Promise<BatchResult>>();

            const executeOperationWithDependencies = async (operation: ResolvedBatchOperation, index: number): Promise<BatchResult> => {
                // Wait for dependencies to complete
                if (operation.dependencies && operation.dependencies.length > 0) {
                    const dependencyPromises = operation.dependencies.map(depId => {
                        // Handle index-based dependencies
                        if (depId.startsWith('$index_')) {
                            const depIndex = parseInt(depId.substring(7));
                            const depOperation = resolvedOperations[depIndex];
                            if (!depOperation) {
                                throw new Error(`Dependency at index ${depIndex} not found`);
                            }
                            const depResult = operationResults.get(depOperation.id);
                            if (!depResult) {
                                throw new Error(`Dependency '${depOperation.id}' not found in operations list`);
                            }
                            return depResult;
                        } else {
                            // Handle operation ID-based dependencies
                            const depResult = operationResults.get(depId);
                            if (!depResult) {
                                throw new Error(`Dependency '${depId}' not found in operations list`);
                            }
                            return depResult;
                        }
                    });

                    await Promise.all(dependencyPromises);
                }

                await semaphore.acquire();

                try {
                    // Create a function to get current results for reference resolution
                    const getCurrentResults = () => results;
                    const result = await this.executeOperation(operation, getCurrentResults);
                    const batchResult: BatchResult = {
                        index,
                        operation,
                        success: true,
                        data: result,
                    };

                    results.push(batchResult);
                    successfulOperations.push(operation);

                    onOperationComplete?.(batchResult);
                    return batchResult;
                } catch (error) {
                    const batchResult: BatchResult = {
                        index,
                        operation,
                        success: false,
                        error: error as Error,
                    };

                    results.push(batchResult);

                    if (!continueOnError) {
                        throw error;
                    }

                    onOperationComplete?.(batchResult);
                    return batchResult;
                } finally {
                    semaphore.release();
                }
            };

            // Create promises for all operations
            const operationPromises = resolvedOperations.map((operation, index) => {
                const promise = executeOperationWithDependencies(operation, index);
                operationResults.set(operation.id, promise);
                return promise;
            });

            await Promise.all(operationPromises);

            const summary: BatchSummary = {
                total: operations.length,
                successful: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length,
                successRate: results.length > 0 ? results.filter(r => r.success).length / results.length : 0,
                duration: Date.now() - startTime,
                results,
            };

            onBatchComplete?.(results);
            return summary;

        } catch (error) {
            // Rollback successful operations if enabled
            if (enableRollback && successfulOperations.length > 0) {
                await this.rollbackOperations(successfulOperations);
            }
            throw error;
        }
    }

    /**
     * Resolve operation dependencies and references
     */
    private async resolveOperations(operations: BatchOperation[]): Promise<ResolvedBatchOperation[]> {
        const resolved: ResolvedBatchOperation[] = [];

        for (let i = 0; i < operations.length; i++) {
            const operation = operations[i];
            const resolvedOperation: ResolvedBatchOperation = { ...operation };

            // Resolve references in data
            if (operation.data) {
                resolvedOperation.resolvedData = await this.resolveReferences(operation.data, resolved);
            }

            // Determine dependencies
            resolvedOperation.dependencies = this.findDependencies(operation, i);

            resolved.push(resolvedOperation);
        }

        return resolved;
    }

    /**
     * Resolve references in operation data
     */
    private async resolveReferences(data: any, previousResults: ResolvedBatchOperation[]): Promise<any> {
        if (typeof data === 'string') {
            // Convert ResolvedBatchOperation[] to BatchResult[] for resolveStringReferences
            const batchResults: BatchResult[] = previousResults.map((op, index) => ({
                index,
                operation: op,
                success: true,
                data: op.resolvedData || op.data,
            }));
            return this.resolveStringReferences(data, batchResults);
        }

        if (Array.isArray(data)) {
            return Promise.all(data.map(item => this.resolveReferences(item, previousResults)));
        }

        if (data && typeof data === 'object') {
            const resolved: any = {};
            for (const [key, value] of Object.entries(data)) {
                resolved[key] = await this.resolveReferences(value, previousResults);
            }
            return resolved;
        }

        return data;
    }

    /**
     * Resolve string references like "$0.id" or "$1.data.attributes.name"
     */
    private resolveStringReferences(str: string, previousResults: BatchResult[]): string {
        return str.replace(/\$(\d+)\.([\w.]+)/g, (match, indexStr, path) => {
            const index = parseInt(indexStr);
            if (index < previousResults.length) {
                const result = previousResults[index];
                // For simple references like $0.id, look in result.data.id
                if (path === 'id' && result.data?.id) {
                    return String(result.data.id);
                }
                // For other paths, look in result.data
                const value = this.getNestedValue(result.data, path);
                return value !== undefined ? String(value) : match;
            }
            return match;
        });
    }

    /**
     * Get nested value from object using dot notation
     */
    private getNestedValue(obj: any, path: string): any {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }

    /**
     * Find dependencies for an operation
     */
    private findDependencies(operation: BatchOperation, currentIndex: number): string[] {
        const dependencies: string[] = [];

        // If operation has explicit dependencies, use those
        if (operation.dependencies && Array.isArray(operation.dependencies)) {
            dependencies.push(...operation.dependencies);
        }

        // Also find references to previous operations by index
        const operationStr = JSON.stringify(operation);
        const referenceMatches = operationStr.match(/\$(\d+)/g);
        if (referenceMatches) {
            for (const match of referenceMatches) {
                const index = parseInt(match.substring(1));
                if (index < currentIndex) {
                    // Convert index to operation ID reference
                    const depRef = `$index_${index}`;
                    if (!dependencies.includes(depRef)) {
                        dependencies.push(depRef);
                    }
                }
            }
        }

        return dependencies;
    }

    /**
     * Execute a single operation
     */
    private async executeOperation(operation: ResolvedBatchOperation, getPreviousResults: () => BatchResult[]): Promise<any> {
        const { type, resolvedData, data, endpoint, resourceType } = operation;
        const operationData = resolvedData || data;


        // Check if type is module.method format
        if (type.includes('.')) {
            // Existing module.method approach
            const [module, method] = type.split('.');

            if (!module || !method) {
                throw new Error(`Invalid operation type: ${type}`);
            }

            // Get the appropriate module
            const moduleInstance = (this.client as any)[module];
            if (!moduleInstance) {
                throw new Error(`Unknown module: ${module}`);
            }

            // Execute the method
            const methodFunc = moduleInstance[method];
            if (typeof methodFunc !== 'function') {
                throw new Error(`Unknown method: ${module}.${method}`);
            }

            return methodFunc.call(moduleInstance, operationData);
        } else {
            // New endpoint-based approach
            const methodMap = {
                'create': 'POST',
                'update': 'PATCH',
                'delete': 'DELETE'
            };
            const httpMethod = methodMap[type as keyof typeof methodMap];
            if (!httpMethod || !endpoint) {
                throw new Error(`Invalid operation: ${type} requires endpoint`);
            }

            // Resolve endpoint references
            const previousResults = getPreviousResults();
            const resolvedEndpoint = this.resolveStringReferences(endpoint, previousResults);

            // Map endpoint to module and method
            if (resolvedEndpoint === '/people') {
                // /people endpoint
                if (type === 'create') {
                    return this.client.people.create(operationData);
                }
            } else if (resolvedEndpoint.startsWith('/people/') && resolvedEndpoint.includes('/emails')) {
                // /people/{id}/emails endpoint
                if (type === 'create') {
                    const personId = resolvedEndpoint.split('/')[2];
                    return this.client.people.addEmail(personId, operationData);
                } else if (type === 'update') {
                    const parts = resolvedEndpoint.split('/');
                    const personId = parts[2];
                    const emailId = parts[4];
                    return this.client.people.updateEmail(personId, emailId, operationData);
                } else if (type === 'delete') {
                    const parts = resolvedEndpoint.split('/');
                    const personId = parts[2];
                    const emailId = parts[4];
                    return this.client.people.deleteEmail(personId, emailId);
                }
            } else if (resolvedEndpoint.startsWith('/people/') && resolvedEndpoint.includes('/phone_numbers')) {
                // /people/{id}/phone_numbers endpoint
                if (type === 'create') {
                    const personId = resolvedEndpoint.split('/')[2];
                    return this.client.people.addPhoneNumber(personId, operationData);
                } else if (type === 'update') {
                    const parts = resolvedEndpoint.split('/');
                    const personId = parts[2];
                    const phoneId = parts[4];
                    return this.client.people.updatePhoneNumber(personId, phoneId, operationData);
                } else if (type === 'delete') {
                    const parts = resolvedEndpoint.split('/');
                    const personId = parts[2];
                    const phoneId = parts[4];
                    return this.client.people.deletePhoneNumber(personId, phoneId);
                }
            } else if (resolvedEndpoint.startsWith('/people/') && !resolvedEndpoint.includes('/emails') && !resolvedEndpoint.includes('/phone_numbers')) {
                // /people/{id} endpoint
                if (type === 'update') {
                    const personId = resolvedEndpoint.split('/')[2];
                    return this.client.people.update(personId, operationData);
                } else if (type === 'delete') {
                    const personId = resolvedEndpoint.split('/')[2];
                    return this.client.people.delete(personId);
                }
            }

            throw new Error(`Unsupported endpoint for batch operation: ${resolvedEndpoint}`);
        }
    }

    /**
     * Rollback successful operations
     */
    private async rollbackOperations(operations: ResolvedBatchOperation[]): Promise<void> {
        // Reverse the order for rollback
        const rollbackOps = [...operations].reverse();

        for (const operation of rollbackOps) {
            try {
                await this.rollbackOperation(operation);
            } catch (error) {
                console.error(`Failed to rollback operation ${operation.type}:`, error);
            }
        }
    }

    /**
     * Rollback a single operation
     */
    private async rollbackOperation(operation: ResolvedBatchOperation): Promise<void> {
        const { type } = operation;
        const [module, method] = type.split('.');

        // Determine rollback method based on operation type
        let rollbackMethod: string;

        if (method.startsWith('create')) {
            rollbackMethod = method.replace('create', 'delete');
        } else if (method.startsWith('add')) {
            rollbackMethod = method.replace('add', 'delete');
        } else {
            // For other operations, we might need to implement specific rollback logic
            return;
        }

        const moduleInstance = (this.client as any)[module];
        if (moduleInstance && typeof moduleInstance[rollbackMethod] === 'function') {
            // This is a simplified rollback - in practice, you'd need to store
            // the created resource IDs to properly rollback
            console.warn(`Rollback not fully implemented for ${type}`);
        }
    }
}

/**
 * Semaphore for controlling concurrency
 */
class Semaphore {
    private permits: number;
    private waiting: (() => void)[] = [];

    constructor(permits: number) {
        this.permits = permits;
    }

    async acquire(): Promise<void> {
        if (this.permits > 0) {
            this.permits--;
            return;
        }

        return new Promise(resolve => {
            this.waiting.push(resolve);
        });
    }

    release(): void {
        this.permits++;
        if (this.waiting.length > 0) {
            const resolve = this.waiting.shift()!;
            this.permits--;
            resolve();
        }
    }
}
