/**
 * v2.0.0 Mock PcoClient
 */

import type { PcoClientConfig } from '../types/client';
import type { MockClientConfig } from './types';
import { MockResponseBuilder } from './builders';

export class MockPcoClient {
    public people: any;
    public fields: any;
    public workflows: any;
    public contacts: any;
    public households: any;
    public notes: any;
    public lists: any;
    public batch: any;

    private config: PcoClientConfig;
    private mockConfig: MockClientConfig;

    constructor(config: PcoClientConfig, mockConfig: MockClientConfig = {}) {
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
                Promise.resolve(MockResponseBuilder.paginated([MockResponseBuilder.person()]))
            ),

            getById: this.mockConfig.people?.getById || ((id: string) =>
                Promise.resolve(MockResponseBuilder.person({ id }))
            ),

            create: this.mockConfig.people?.create || ((data: any) =>
                Promise.resolve(MockResponseBuilder.person(data))
            ),

            update: this.mockConfig.people?.update || ((id: string, data: any) =>
                Promise.resolve(MockResponseBuilder.person({ id, ...data }))
            ),

            delete: this.mockConfig.people?.delete || (() =>
                Promise.resolve()
            ),

            findOrCreate: this.mockConfig.people?.findOrCreate || ((options: any) =>
                Promise.resolve(MockResponseBuilder.person({
                    first_name: options.firstName,
                    last_name: options.lastName,
                }))
            ),

            search: this.mockConfig.people?.search || ((criteria: any) =>
                Promise.resolve(MockResponseBuilder.paginated([MockResponseBuilder.person()]))
            ),

            getAllPages: this.mockConfig.people?.getAllPages || (() =>
                Promise.resolve({
                    data: [MockResponseBuilder.person()],
                    totalCount: 1,
                    pagesFetched: 1,
                    duration: 100,
                })
            ),

            addEmail: this.mockConfig.people?.addEmail || ((personId: string, data: any) =>
                Promise.resolve(MockResponseBuilder.email(data))
            ),

            addPhoneNumber: this.mockConfig.people?.addPhoneNumber || ((personId: string, data: any) =>
                Promise.resolve(MockResponseBuilder.phoneNumber(data))
            ),

            addAddress: this.mockConfig.people?.addAddress || ((personId: string, data: any) =>
                Promise.resolve(MockResponseBuilder.address(data))
            ),

            addSocialProfile: this.mockConfig.people?.addSocialProfile || ((personId: string, data: any) =>
                Promise.resolve(MockResponseBuilder.socialProfile(data))
            ),
        };
    }

    private createFieldsModule() {
        return {
            getAllFieldDefinitions: this.mockConfig.fields?.getAllFieldDefinitions || (() =>
                Promise.resolve([MockResponseBuilder.fieldDefinition()])
            ),

            getFieldDefinition: this.mockConfig.fields?.getFieldDefinition || ((id: string) =>
                Promise.resolve(MockResponseBuilder.fieldDefinition({ id }))
            ),

            getFieldDefinitionBySlug: this.mockConfig.fields?.getFieldDefinitionBySlug || ((slug: string) =>
                Promise.resolve(MockResponseBuilder.fieldDefinition({ slug }))
            ),

            getFieldDefinitionByName: this.mockConfig.fields?.getFieldDefinitionByName || ((name: string) =>
                Promise.resolve(MockResponseBuilder.fieldDefinition({ name }))
            ),

            setPersonField: this.mockConfig.fields?.setPersonField || (() =>
                Promise.resolve({ id: 'field_data_123', value: 'test' })
            ),

            setPersonFieldById: this.mockConfig.fields?.setPersonFieldById || (() =>
                Promise.resolve({ id: 'field_data_123', value: 'test' })
            ),

            setPersonFieldBySlug: this.mockConfig.fields?.setPersonFieldBySlug || (() =>
                Promise.resolve({ id: 'field_data_123', value: 'test' })
            ),

            setPersonFieldByName: this.mockConfig.fields?.setPersonFieldByName || (() =>
                Promise.resolve({ id: 'field_data_123', value: 'test' })
            ),
        };
    }

    private createWorkflowsModule() {
        return {
            getAll: this.mockConfig.workflows?.getAll || (() =>
                Promise.resolve(MockResponseBuilder.paginated([MockResponseBuilder.workflow()]))
            ),

            getById: this.mockConfig.workflows?.getById || ((id: string) =>
                Promise.resolve(MockResponseBuilder.workflow({ id }))
            ),

            create: this.mockConfig.workflows?.create || ((data: any) =>
                Promise.resolve(MockResponseBuilder.workflow(data))
            ),

            update: this.mockConfig.workflows?.update || ((id: string, data: any) =>
                Promise.resolve(MockResponseBuilder.workflow({ id, ...data }))
            ),

            delete: this.mockConfig.workflows?.delete || (() =>
                Promise.resolve()
            ),

            getAllPages: this.mockConfig.workflows?.getAllPages || (() =>
                Promise.resolve({
                    data: [MockResponseBuilder.workflow()],
                    totalCount: 1,
                    pagesFetched: 1,
                    duration: 100,
                })
            ),

            addPersonToWorkflow: this.mockConfig.workflows?.addPersonToWorkflow || (() =>
                Promise.resolve(MockResponseBuilder.workflowCard())
            ),

            createWorkflowCard: this.mockConfig.workflows?.createWorkflowCard || (() =>
                Promise.resolve(MockResponseBuilder.workflowCard())
            ),

            createWorkflowCardNote: this.mockConfig.workflows?.createWorkflowCardNote || (() =>
                Promise.resolve(MockResponseBuilder.workflowCardNote())
            ),
        };
    }

    private createContactsModule() {
        return {
            getAllEmails: this.mockConfig.contacts?.getAllEmails || (() =>
                Promise.resolve(MockResponseBuilder.paginated([MockResponseBuilder.email()]))
            ),

            createEmail: this.mockConfig.contacts?.createEmail || ((data: any) =>
                Promise.resolve(MockResponseBuilder.email(data))
            ),

            getAllPhoneNumbers: this.mockConfig.contacts?.getAllPhoneNumbers || (() =>
                Promise.resolve(MockResponseBuilder.paginated([MockResponseBuilder.phoneNumber()]))
            ),

            createPhoneNumber: this.mockConfig.contacts?.createPhoneNumber || ((data: any) =>
                Promise.resolve(MockResponseBuilder.phoneNumber(data))
            ),

            getAllAddresses: this.mockConfig.contacts?.getAllAddresses || (() =>
                Promise.resolve(MockResponseBuilder.paginated([MockResponseBuilder.address()]))
            ),

            createAddress: this.mockConfig.contacts?.createAddress || ((data: any) =>
                Promise.resolve(MockResponseBuilder.address(data))
            ),

            getAllSocialProfiles: this.mockConfig.contacts?.getAllSocialProfiles || (() =>
                Promise.resolve(MockResponseBuilder.paginated([MockResponseBuilder.socialProfile()]))
            ),

            createSocialProfile: this.mockConfig.contacts?.createSocialProfile || ((data: any) =>
                Promise.resolve(MockResponseBuilder.socialProfile(data))
            ),
        };
    }

    private createHouseholdsModule() {
        return {
            getAll: this.mockConfig.households?.getAll || (() =>
                Promise.resolve(MockResponseBuilder.paginated([MockResponseBuilder.household()]))
            ),

            getById: this.mockConfig.households?.getById || ((id: string) =>
                Promise.resolve(MockResponseBuilder.household({ id }))
            ),

            create: this.mockConfig.households?.create || ((data: any) =>
                Promise.resolve(MockResponseBuilder.household(data))
            ),

            update: this.mockConfig.households?.update || ((id: string, data: any) =>
                Promise.resolve(MockResponseBuilder.household({ id, ...data }))
            ),

            delete: this.mockConfig.households?.delete || (() =>
                Promise.resolve()
            ),
        };
    }

    private createNotesModule() {
        return {
            getAll: this.mockConfig.notes?.getAll || (() =>
                Promise.resolve(MockResponseBuilder.paginated([MockResponseBuilder.note()]))
            ),

            getById: this.mockConfig.notes?.getById || ((id: string) =>
                Promise.resolve(MockResponseBuilder.note({ id }))
            ),

            create: this.mockConfig.notes?.create || ((data: any) =>
                Promise.resolve(MockResponseBuilder.note(data))
            ),

            update: this.mockConfig.notes?.update || ((id: string, data: any) =>
                Promise.resolve(MockResponseBuilder.note({ id, ...data }))
            ),

            delete: this.mockConfig.notes?.delete || (() =>
                Promise.resolve()
            ),
        };
    }

    private createListsModule() {
        return {
            getAll: this.mockConfig.lists?.getAll || (() =>
                Promise.resolve(MockResponseBuilder.paginated([MockResponseBuilder.list()]))
            ),

            getById: this.mockConfig.lists?.getById || ((id: string) =>
                Promise.resolve(MockResponseBuilder.list({ id }))
            ),

            create: this.mockConfig.lists?.create || ((data: any) =>
                Promise.resolve(MockResponseBuilder.list(data))
            ),

            update: this.mockConfig.lists?.update || ((id: string, data: any) =>
                Promise.resolve(MockResponseBuilder.list({ id, ...data }))
            ),

            delete: this.mockConfig.lists?.delete || (() =>
                Promise.resolve()
            ),
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
