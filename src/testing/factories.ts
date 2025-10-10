/**
 * v2.0.0 Testing Factory Functions
 */

import type { PcoClientConfig } from '../types/client';
import type { MockClientConfig, RecordingConfig } from './types';
import { MockPcoClient } from './mock-client';
import { RequestRecorder } from './recorder';
import { PcoClient } from '../client';

/**
 * Create a mock client for testing
 */
export function createMockClient(
    config: PcoClientConfig,
    mockConfig: MockClientConfig = {}
): MockPcoClient {
    return new MockPcoClient(config, mockConfig);
}

/**
 * Create a recording client that can record and replay requests
 */
export function createRecordingClient(
    config: PcoClientConfig,
    recordingConfig: RecordingConfig
): PcoClient {
    const recorder = new RequestRecorder(recordingConfig);

    // Create a real client but wrap its HTTP methods to record/replay
    const client = new PcoClient(config);

    // This would require modifying the HTTP client to support recording
    // For now, we'll return the regular client
    // In a full implementation, you'd wrap the HTTP methods

    return client;
}

/**
 * Create a test client with common mock responses
 */
export function createTestClient(overrides: MockClientConfig = {}): MockPcoClient {
    const defaultConfig: PcoClientConfig = {
        auth: {
            type: 'oauth',
            accessToken: 'test-token',
        },
    };

    const defaultMockConfig: MockClientConfig = {
        people: {
            getAll: () => Promise.resolve({
                data: [
                    {
                        type: 'Person',
                        id: 'person_1',
                        attributes: {
                            id: 'person_1',
                            first_name: 'John',
                            last_name: 'Doe',
                            status: 'active',
                        },
                        relationships: {
                            emails: { data: [] },
                            phone_numbers: { data: [] },
                            addresses: { data: [] },
                            social_profiles: { data: [] },
                            field_data: { data: [] },
                            workflow_cards: { data: [] },
                            household: { data: null },
                        },
                    },
                ],
                meta: { total_count: 1 },
                links: { self: '/people', next: null, prev: null },
            }),

            create: (data: any) => Promise.resolve({
                type: 'Person',
                id: 'person_new',
                attributes: {
                    id: 'person_new',
                    first_name: data.firstName || data.first_name || 'New',
                    last_name: data.lastName || data.last_name || 'Person',
                    status: 'active',
                },
                relationships: {
                    emails: { data: [] },
                    phone_numbers: { data: [] },
                    addresses: { data: [] },
                    social_profiles: { data: [] },
                    field_data: { data: [] },
                    workflow_cards: { data: [] },
                    household: { data: null },
                },
            }),
        },

        fields: {
            getAllFieldDefinitions: () => Promise.resolve([
                {
                    type: 'FieldDefinition',
                    id: 'field_1',
                    attributes: {
                        id: 'field_1',
                        name: 'Birthdate',
                        slug: 'birthdate',
                        data_type: 'date',
                        required: false,
                        public: false,
                    },
                    relationships: {
                        tab: { data: { type: 'Tab', id: 'tab_1' } },
                        field_options: { data: [] },
                    },
                },
            ]),
        },

        workflows: {
            getAll: () => Promise.resolve({
                data: [
                    {
                        type: 'Workflow',
                        id: 'workflow_1',
                        attributes: {
                            id: 'workflow_1',
                            name: 'New Member Workflow',
                            description: 'Workflow for new members',
                        },
                        relationships: {
                            cards: { data: [] },
                        },
                    },
                ],
                meta: { total_count: 1 },
                links: { self: '/workflows', next: null, prev: null },
            }),
        },

        batch: {
            execute: (operations: any[]) => Promise.resolve({
                total: operations.length,
                successful: operations.length,
                failed: 0,
                successRate: 1.0,
                duration: 100,
                results: operations.map((op, index) => ({
                    index,
                    operation: op,
                    success: true,
                    data: { id: `result_${index}` },
                })),
            }),
        },
    };

    // Merge with overrides
    const mergedMockConfig = mergeMockConfigs(defaultMockConfig, overrides);

    return createMockClient(defaultConfig, mergedMockConfig);
}

/**
 * Create a mock client that simulates errors
 */
export function createErrorMockClient(errorType: 'network' | 'auth' | 'validation' | 'rate_limit' = 'network'): MockPcoClient {
    const config: PcoClientConfig = {
        auth: {
            type: 'oauth',
            accessToken: 'test-token',
        },
    };

    const errorMockConfig: MockClientConfig = {
        people: {
            getAll: () => {
                const error = new Error(`Mock ${errorType} error`);
                (error as any).status = errorType === 'auth' ? 401 : errorType === 'rate_limit' ? 429 : 500;
                return Promise.reject(error);
            },
        },
    };

    return createMockClient(config, errorMockConfig);
}

/**
 * Create a mock client with specific response delays
 */
export function createSlowMockClient(delayMs: number = 1000): MockPcoClient {
    const config: PcoClientConfig = {
        auth: {
            type: 'oauth',
            accessToken: 'test-token',
        },
    };

    const slowMockConfig: MockClientConfig = {
        people: {
            getAll: () => new Promise(resolve => {
                setTimeout(() => {
                    resolve({
                        data: [],
                        meta: { total_count: 0 },
                        links: { self: '/people', next: null, prev: null },
                    });
                }, delayMs);
            }),
        },
    };

    return createMockClient(config, slowMockConfig);
}

/**
 * Merge two mock configs deeply
 */
function mergeMockConfigs(base: MockClientConfig, override: MockClientConfig): MockClientConfig {
    const result: MockClientConfig = { ...base };

    for (const [key, value] of Object.entries(override)) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            result[key as keyof MockClientConfig] = {
                ...(result[key as keyof MockClientConfig] as any),
                ...value,
            };
        } else {
            result[key as keyof MockClientConfig] = value;
        }
    }

    return result;
}
