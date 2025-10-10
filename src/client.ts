/**
 * v2.0.0 Main PcoClient Class
 */

import type { PcoClientConfig } from './types/client';
import type { EventEmitter } from './types/events';
import { PcoEventEmitter } from './monitoring';
import { PcoHttpClient } from './core/http';
import { PaginationHelper } from './core/pagination';
import { PeopleModule } from './modules/people';
import { FieldsModule } from './modules/fields';
import { WorkflowsModule } from './modules/workflows';
import { ContactsModule } from './modules/contacts';
import { HouseholdsModule } from './modules/households';
import { NotesModule } from './modules/notes';
import { ListsModule } from './modules/lists';
import { CampusModule } from './modules/campus';
import { BatchExecutor } from './batch';

export class PcoClient implements EventEmitter {
    public people: PeopleModule;
    public fields: FieldsModule;
    public workflows: WorkflowsModule;
    public contacts: ContactsModule;
    public households: HouseholdsModule;
    public notes: NotesModule;
    public lists: ListsModule;
    public campus: CampusModule;
    public batch: BatchExecutor;

    private httpClient: PcoHttpClient;
    private paginationHelper: PaginationHelper;
    private eventEmitter: PcoEventEmitter;
    private config: PcoClientConfig;

    constructor(config: PcoClientConfig) {
        this.config = config;
        this.eventEmitter = new PcoEventEmitter();
        this.httpClient = new PcoHttpClient(config, this.eventEmitter);
        this.paginationHelper = new PaginationHelper(this.httpClient);

        // Initialize modules
        this.people = new PeopleModule(this.httpClient, this.paginationHelper, this.eventEmitter);
        this.fields = new FieldsModule(this.httpClient, this.paginationHelper, this.eventEmitter);
        this.workflows = new WorkflowsModule(this.httpClient, this.paginationHelper, this.eventEmitter);
        this.contacts = new ContactsModule(this.httpClient, this.paginationHelper, this.eventEmitter);
        this.households = new HouseholdsModule(this.httpClient, this.paginationHelper, this.eventEmitter);
        this.notes = new NotesModule(this.httpClient, this.paginationHelper, this.eventEmitter);
        this.lists = new ListsModule(this.httpClient, this.paginationHelper, this.eventEmitter);
        this.campus = new CampusModule(this.httpClient, this.paginationHelper, this.eventEmitter);
        this.batch = new BatchExecutor(this, this.eventEmitter);

        // Set up event handlers from config
        this.setupEventHandlers();
    }

    // EventEmitter implementation
    on<T extends import('./types/events').PcoEvent>(eventType: T['type'], handler: import('./types/events').EventHandler<T>): void {
        this.eventEmitter.on(eventType, handler);
    }

    off<T extends import('./types/events').PcoEvent>(eventType: T['type'], handler: import('./types/events').EventHandler<T>): void {
        this.eventEmitter.off(eventType, handler);
    }

    emit<T extends import('./types/events').PcoEvent>(event: T): void {
        this.eventEmitter.emit(event);
    }

    /**
     * Get the current configuration
     */
    getConfig(): PcoClientConfig {
        return { ...this.config };
    }

    /**
     * Update the configuration
     */
    updateConfig(updates: Partial<PcoClientConfig>): void {
        this.config = { ...this.config, ...updates };
        // Recreate HTTP client with new config
        this.httpClient = new PcoHttpClient(this.config, this.eventEmitter);
        this.paginationHelper = new PaginationHelper(this.httpClient);

        // Update modules with new HTTP client
        this.updateModules();
    }

    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        return this.httpClient.getPerformanceMetrics();
    }

    /**
     * Get rate limit information
     */
    getRateLimitInfo() {
        return this.httpClient.getRateLimitInfo();
    }

    /**
     * Clear all event listeners
     */
    removeAllListeners(eventType?: import('./types/events').EventType): void {
        this.eventEmitter.removeAllListeners(eventType);
    }

    /**
     * Get the number of listeners for an event type
     */
    listenerCount(eventType: import('./types/events').EventType): number {
        return this.eventEmitter.listenerCount(eventType);
    }

    /**
     * Get all registered event types
     */
    eventTypes(): import('./types/events').EventType[] {
        return this.eventEmitter.eventTypes();
    }

    private setupEventHandlers(): void {
        // Set up config event handlers
        if (this.config.events?.onError) {
            this.on('error', this.config.events.onError as any);
        }

        if (this.config.events?.onAuthFailure) {
            this.on('auth:failure', this.config.events.onAuthFailure as any);
        }

        if (this.config.events?.onRequestStart) {
            this.on('request:start', this.config.events.onRequestStart as any);
        }

        if (this.config.events?.onRequestComplete) {
            this.on('request:complete', this.config.events.onRequestComplete as any);
        }

        if (this.config.events?.onRateLimit) {
            this.on('rate:limit', this.config.events.onRateLimit as any);
        }
    }

    private updateModules(): void {
        // Recreate modules with new HTTP client
        this.people = new PeopleModule(this.httpClient, this.paginationHelper, this.eventEmitter);
        this.fields = new FieldsModule(this.httpClient, this.paginationHelper, this.eventEmitter);
        this.workflows = new WorkflowsModule(this.httpClient, this.paginationHelper, this.eventEmitter);
        this.contacts = new ContactsModule(this.httpClient, this.paginationHelper, this.eventEmitter);
        this.households = new HouseholdsModule(this.httpClient, this.paginationHelper, this.eventEmitter);
        this.notes = new NotesModule(this.httpClient, this.paginationHelper, this.eventEmitter);
        this.lists = new ListsModule(this.httpClient, this.paginationHelper, this.eventEmitter);
        this.batch = new BatchExecutor(this, this.eventEmitter);
    }
}
