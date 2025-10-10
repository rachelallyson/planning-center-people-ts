/**
 * Simplified Testing Factory Functions
 */

import type { PcoClientConfig } from '../types/client';
import { SimpleMockResponseBuilder } from './simple-builders';

export interface SimpleMockClientConfig {
    people?: {
        getAll?: () => Promise<any>;
        getById?: (id: string) => Promise<any>;
        create?: (data: any) => Promise<any>;
        update?: (id: string, data: any) => Promise<any>;
        delete?: (id: string) => Promise<void>;
        findOrCreate?: (options: any) => Promise<any>;
        createWithContacts?: (personData: any, contacts: any) => Promise<any>;
        search?: (criteria: any) => Promise<any>;
        getAllPages?: (options?: any) => Promise<any>;
        addEmail?: (personId: string, data: any) => Promise<any>;
        addPhoneNumber?: (personId: string, data: any) => Promise<any>;
        addAddress?: (personId: string, data: any) => Promise<any>;
        addSocialProfile?: (personId: string, data: any) => Promise<any>;
    };
    fields?: {
        getAllFieldDefinitions?: () => Promise<any[]>;
        getFieldDefinition?: (id: string) => Promise<any>;
        getFieldDefinitionBySlug?: (slug: string) => Promise<any>;
        getFieldDefinitionByName?: (name: string) => Promise<any>;
        setPersonField?: (personId: string, options: any) => Promise<any>;
        setPersonFieldById?: (personId: string, fieldId: string, value: string) => Promise<any>;
        setPersonFieldBySlug?: (personId: string, slug: string, value: string) => Promise<any>;
        setPersonFieldByName?: (personId: string, name: string, value: string) => Promise<any>;
    };
    workflows?: {
        getAll?: (options?: any) => Promise<any>;
        getById?: (id: string) => Promise<any>;
        create?: (data: any) => Promise<any>;
        update?: (id: string, data: any) => Promise<any>;
        delete?: (id: string) => Promise<void>;
        getAllPages?: (options?: any) => Promise<any>;
        addPersonToWorkflow?: (personId: string, workflowId: string, options?: any) => Promise<any>;
        createWorkflowCard?: (workflowId: string, personId: string) => Promise<any>;
        createWorkflowCardNote?: (personId: string, workflowCardId: string, data: any) => Promise<any>;
    };
    batch?: {
        execute?: (operations: any[]) => Promise<any>;
    };
}

export class SimpleMockPcoClient {
    public people: any;
    public fields: any;
    public workflows: any;
    public contacts: any;
    public households: any;
    public notes: any;
    public lists: any;
    public batch: any;

    private config: PcoClientConfig;
    private mockConfig: SimpleMockClientConfig;

    constructor(config: PcoClientConfig, mockConfig: SimpleMockClientConfig = {}) {
        this.config = config;
        this.mockConfig = mockConfig;

        // Initialize modules with mock implementations
        this.people = this.createPeopleModule();
        this.fields = this.createFieldsModule();
        this.workflows = this.createWorkflowsModule();
        this.contacts = this.createContactsModule();
        this.households = this.createHouseholdsModule();
        this.notes = this.createNotesModule();
        this.lists = this.createListsModule();
        this.batch = this.createBatchModule();
    }

    private createPeopleModule() {
        return {
            getAll: this.mockConfig.people?.getAll || (() =>
                Promise.resolve(SimpleMockResponseBuilder.paginated([SimpleMockResponseBuilder.person()]))
            ),

            getById: this.mockConfig.people?.getById || ((id: string) =>
                Promise.resolve(SimpleMockResponseBuilder.person({ id }))
            ),

            create: this.mockConfig.people?.create || ((data: any) =>
                Promise.resolve(SimpleMockResponseBuilder.person(data))
            ),

            update: this.mockConfig.people?.update || ((id: string, data: any) =>
                Promise.resolve(SimpleMockResponseBuilder.person({ id, ...data }))
            ),

            delete: this.mockConfig.people?.delete || (() =>
                Promise.resolve()
            ),

            findOrCreate: this.mockConfig.people?.findOrCreate || ((options: any) =>
                Promise.resolve(SimpleMockResponseBuilder.person({
                    first_name: options.firstName,
                    last_name: options.lastName,
                }))
            ),

            createWithContacts: this.mockConfig.people?.createWithContacts || ((personData: any, contacts: any) =>
                Promise.resolve(SimpleMockResponseBuilder.person({
                    first_name: personData.firstName,
                    last_name: personData.lastName,
                }))
            ),

            search: this.mockConfig.people?.search || ((criteria: any) =>
                Promise.resolve(SimpleMockResponseBuilder.paginated([SimpleMockResponseBuilder.person()]))
            ),

            getAllPages: this.mockConfig.people?.getAllPages || (() =>
                Promise.resolve({
                    data: [SimpleMockResponseBuilder.person()],
                    totalCount: 1,
                    pagesFetched: 1,
                    duration: 100,
                })
            ),

            addEmail: this.mockConfig.people?.addEmail || ((personId: string, data: any) =>
                Promise.resolve(SimpleMockResponseBuilder.email(data))
            ),

            addPhoneNumber: this.mockConfig.people?.addPhoneNumber || ((personId: string, data: any) =>
                Promise.resolve({ type: 'PhoneNumber', id: 'phone_123', attributes: data })
            ),

            addAddress: this.mockConfig.people?.addAddress || ((personId: string, data: any) =>
                Promise.resolve({ type: 'Address', id: 'address_123', attributes: data })
            ),

            addSocialProfile: this.mockConfig.people?.addSocialProfile || ((personId: string, data: any) =>
                Promise.resolve({ type: 'SocialProfile', id: 'social_123', attributes: data })
            ),
        };
    }

    private createFieldsModule() {
        return {
            getAllFieldDefinitions: this.mockConfig.fields?.getAllFieldDefinitions || (() =>
                Promise.resolve([{ type: 'FieldDefinition', id: 'field_1', attributes: { name: 'Birthdate', slug: 'birthdate' } }])
            ),

            getFieldDefinition: this.mockConfig.fields?.getFieldDefinition || ((id: string) =>
                Promise.resolve({ type: 'FieldDefinition', id, attributes: { name: 'Test Field' } })
            ),

            getFieldDefinitionBySlug: this.mockConfig.fields?.getFieldDefinitionBySlug || ((slug: string) =>
                Promise.resolve({ type: 'FieldDefinition', id: 'field_1', attributes: { slug } })
            ),

            getFieldDefinitionByName: this.mockConfig.fields?.getFieldDefinitionByName || ((name: string) =>
                Promise.resolve({ type: 'FieldDefinition', id: 'field_1', attributes: { name } })
            ),

            setPersonField: this.mockConfig.fields?.setPersonField || (() =>
                Promise.resolve({ id: 'field_data_123', value: 'test' })
            ),

            setPersonFieldById: this.mockConfig.fields?.setPersonFieldById || (() =>
                Promise.resolve({ id: 'field_data_123', value: 'test' })
            ),

            setPersonFieldBySlug: this.mockConfig.fields?.setPersonFieldBySlug || ((personId: string, slug: string, value: string) =>
                Promise.resolve({ id: 'field_data_123', value })
            ),

            setPersonFieldByName: this.mockConfig.fields?.setPersonFieldByName || (() =>
                Promise.resolve({ id: 'field_data_123', value: 'test' })
            ),
        };
    }

    private createWorkflowsModule() {
        return {
            getAll: this.mockConfig.workflows?.getAll || (() =>
                Promise.resolve(SimpleMockResponseBuilder.paginated([SimpleMockResponseBuilder.workflow()]))
            ),

            getById: this.mockConfig.workflows?.getById || ((id: string) =>
                Promise.resolve(SimpleMockResponseBuilder.workflow({ id }))
            ),

            create: this.mockConfig.workflows?.create || ((data: any) =>
                Promise.resolve(SimpleMockResponseBuilder.workflow(data))
            ),

            update: this.mockConfig.workflows?.update || ((id: string, data: any) =>
                Promise.resolve(SimpleMockResponseBuilder.workflow({ id, ...data }))
            ),

            delete: this.mockConfig.workflows?.delete || (() =>
                Promise.resolve()
            ),

            getAllPages: this.mockConfig.workflows?.getAllPages || (() =>
                Promise.resolve({
                    data: [SimpleMockResponseBuilder.workflow()],
                    totalCount: 1,
                    pagesFetched: 1,
                    duration: 100,
                })
            ),

            addPersonToWorkflow: this.mockConfig.workflows?.addPersonToWorkflow || (() =>
                Promise.resolve({ type: 'WorkflowCard', id: 'workflow_card_123', attributes: {} })
            ),

            createWorkflowCard: this.mockConfig.workflows?.createWorkflowCard || (() =>
                Promise.resolve({ type: 'WorkflowCard', id: 'workflow_card_123', attributes: {} })
            ),

            createWorkflowCardNote: this.mockConfig.workflows?.createWorkflowCardNote || (() =>
                Promise.resolve({ type: 'WorkflowCardNote', id: 'workflow_card_note_123', attributes: {} })
            ),
        };
    }

    private createContactsModule() {
        return {
            getAllEmails: () => Promise.resolve(SimpleMockResponseBuilder.paginated([SimpleMockResponseBuilder.email()])),
            createEmail: (data: any) => Promise.resolve(SimpleMockResponseBuilder.email(data)),
            getAllPhoneNumbers: () => Promise.resolve(SimpleMockResponseBuilder.paginated([])),
            createPhoneNumber: (data: any) => Promise.resolve({ type: 'PhoneNumber', id: 'phone_123', attributes: data }),
            getAllAddresses: () => Promise.resolve(SimpleMockResponseBuilder.paginated([])),
            createAddress: (data: any) => Promise.resolve({ type: 'Address', id: 'address_123', attributes: data }),
            getAllSocialProfiles: () => Promise.resolve(SimpleMockResponseBuilder.paginated([])),
            createSocialProfile: (data: any) => Promise.resolve({ type: 'SocialProfile', id: 'social_123', attributes: data }),
        };
    }

    private createHouseholdsModule() {
        return {
            getAll: () => Promise.resolve(SimpleMockResponseBuilder.paginated([])),
            getById: (id: string) => Promise.resolve({ type: 'Household', id, attributes: {} }),
            create: (data: any) => Promise.resolve({ type: 'Household', id: 'household_123', attributes: data }),
            update: (id: string, data: any) => Promise.resolve({ type: 'Household', id, attributes: data }),
            delete: () => Promise.resolve(),
        };
    }

    private createNotesModule() {
        return {
            getAll: () => Promise.resolve(SimpleMockResponseBuilder.paginated([])),
            getById: (id: string) => Promise.resolve({ type: 'Note', id, attributes: {} }),
            create: (data: any) => Promise.resolve({ type: 'Note', id: 'note_123', attributes: data }),
            update: (id: string, data: any) => Promise.resolve({ type: 'Note', id, attributes: data }),
            delete: () => Promise.resolve(),
        };
    }

    private createListsModule() {
        return {
            getAll: () => Promise.resolve(SimpleMockResponseBuilder.paginated([])),
            getById: (id: string) => Promise.resolve({ type: 'List', id, attributes: {} }),
            create: (data: any) => Promise.resolve({ type: 'List', id: 'list_123', attributes: data }),
            update: (id: string, data: any) => Promise.resolve({ type: 'List', id, attributes: data }),
            delete: () => Promise.resolve(),
        };
    }

    private createBatchModule() {
        return {
            execute: this.mockConfig.batch?.execute || ((operations: any[]) =>
                Promise.resolve({
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
                })
            ),
        };
    }

    // Event system methods (mock implementations)
    on(eventType: string, handler: Function): void {
        // Mock implementation - does nothing
    }

    off(eventType: string, handler: Function): void {
        // Mock implementation - does nothing
    }

    emit(event: any): void {
        // Mock implementation - does nothing
    }

    getConfig(): PcoClientConfig {
        return this.config;
    }

    getPerformanceMetrics(): any {
        return {};
    }

    getRateLimitInfo(): any {
        return {};
    }

    removeAllListeners(eventType?: string): void {
        // Mock implementation - does nothing
    }

    listenerCount(eventType: string): number {
        return 0;
    }

    eventTypes(): string[] {
        return [];
    }
}

/**
 * Create a simple mock client for testing
 */
export function createSimpleMockClient(
    config: PcoClientConfig,
    mockConfig: SimpleMockClientConfig = {}
): SimpleMockPcoClient {
    return new SimpleMockPcoClient(config, mockConfig);
}

/**
 * Create a test client with common mock responses
 */
export function createTestClient(overrides: SimpleMockClientConfig = {}): SimpleMockPcoClient {
    const defaultConfig: PcoClientConfig = {
        auth: {
            type: 'oauth',
            accessToken: 'test-token',
        },
    };

    const defaultMockConfig: SimpleMockClientConfig = {
        people: {
            getAll: () => Promise.resolve({
                data: [
                    SimpleMockResponseBuilder.person({ id: 'person_1', first_name: 'John', last_name: 'Doe' })
                ],
                meta: { total_count: 1 },
                links: { self: '/people', next: null, prev: null },
            }),

            create: (data: any) => Promise.resolve(
                SimpleMockResponseBuilder.person({
                    id: 'person_new',
                    first_name: data.firstName || data.first_name || 'New',
                    last_name: data.lastName || data.last_name || 'Person',
                })
            ),
        },

        fields: {
            getAllFieldDefinitions: () => Promise.resolve([
                SimpleMockResponseBuilder.person({ type: 'FieldDefinition', id: 'field_1', attributes: { name: 'Birthdate', slug: 'birthdate' } })
            ]),

            setPersonFieldBySlug: (personId: string, slug: string, value: string) =>
                Promise.resolve({ id: 'field_data_123', value }),
        },

        workflows: {
            getAll: () => Promise.resolve({
                data: [SimpleMockResponseBuilder.workflow({ id: 'workflow_1', name: 'New Member Workflow' })],
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
    const mergedMockConfig = { ...defaultMockConfig, ...overrides };

    return createSimpleMockClient(defaultConfig, mergedMockConfig);
}

/**
 * Create a mock client that simulates errors
 */
export function createErrorMockClient(errorType: 'network' | 'auth' | 'validation' | 'rate_limit' = 'network'): SimpleMockPcoClient {
    const config: PcoClientConfig = {
        auth: {
            type: 'oauth',
            accessToken: 'test-token',
        },
    };

    const errorMockConfig: SimpleMockClientConfig = {
        people: {
            getAll: () => {
                const error = new Error(`Mock ${errorType} error`);
                (error as any).status = errorType === 'auth' ? 401 : errorType === 'rate_limit' ? 429 : 500;
                return Promise.reject(error);
            },
        },
    };

    return createSimpleMockClient(config, errorMockConfig);
}

/**
 * Create a mock client with specific response delays
 */
export function createSlowMockClient(delayMs: number = 1000): SimpleMockPcoClient {
    const config: PcoClientConfig = {
        auth: {
            type: 'oauth',
            accessToken: 'test-token',
        },
    };

    const slowMockConfig: SimpleMockClientConfig = {
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

    return createSimpleMockClient(config, slowMockConfig);
}
