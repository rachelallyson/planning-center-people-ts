/**
 * v2.0.0 Batch Operations Types
 */

export interface BatchOperation {
    type: string;
    data?: any;
    dependencies?: string[];
    [key: string]: any;
}

export interface BatchResult<T = any> {
    index: number;
    operation: BatchOperation;
    success: boolean;
    data?: T;
    error?: Error;
}

export interface BatchOptions {
    /** Continue processing other operations if one fails */
    continueOnError?: boolean;
    /** Maximum number of operations to run in parallel */
    maxConcurrency?: number;
    /** Enable automatic rollback on failure */
    enableRollback?: boolean;
    /** Callback for each completed operation */
    onOperationComplete?: (result: BatchResult) => void;
    /** Callback for batch completion */
    onBatchComplete?: (results: BatchResult[]) => void;
}

export interface BatchSummary {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
    duration: number;
    results: BatchResult[];
}

export interface OperationReference {
    /** Reference to a previous operation result using $index.path syntax */
    reference: string;
    /** The operation index being referenced */
    index: number;
    /** The path within the result object */
    path: string;
}

export interface ResolvedBatchOperation extends BatchOperation {
    /** Resolved data with references replaced */
    resolvedData?: any;
    /** Dependencies on other operations */
    dependencies?: string[];
}
