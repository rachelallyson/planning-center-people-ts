/**
 * v2.0.0 Testing Types
 */

import type { PcoClientConfig } from '../types/client';
import type {
    PersonResource,
    EmailResource,
    PhoneNumberResource,
    AddressResource,
    SocialProfileResource,
    FieldDefinitionResource,
    WorkflowResource,
    WorkflowCardResource,
    WorkflowCardNoteResource,
    HouseholdResource,
    NoteResource,
    ListResource
} from '../types';

export interface MockClientConfig {
    /** Mock responses for people operations */
    people?: {
        getAll?: () => Promise<{ data: PersonResource[]; meta?: any; links?: any }>;
        getById?: (id: string) => Promise<PersonResource>;
        create?: (data: any) => Promise<PersonResource>;
        update?: (id: string, data: any) => Promise<PersonResource>;
        delete?: (id: string) => Promise<void>;
        findOrCreate?: (options: any) => Promise<PersonResource>;
        search?: (criteria: any) => Promise<{ data: PersonResource[]; meta?: any; links?: any }>;
        getAllPages?: (options?: any) => Promise<{ data: PersonResource[]; totalCount: number; pagesFetched: number; duration: number }>;
        addEmail?: (personId: string, data: any) => Promise<EmailResource>;
        addPhoneNumber?: (personId: string, data: any) => Promise<PhoneNumberResource>;
        addAddress?: (personId: string, data: any) => Promise<AddressResource>;
        addSocialProfile?: (personId: string, data: any) => Promise<SocialProfileResource>;
    };

    /** Mock responses for fields operations */
    fields?: {
        getAllFieldDefinitions?: () => Promise<FieldDefinitionResource[]>;
        getFieldDefinition?: (id: string) => Promise<FieldDefinitionResource>;
        getFieldDefinitionBySlug?: (slug: string) => Promise<FieldDefinitionResource | null>;
        getFieldDefinitionByName?: (name: string) => Promise<FieldDefinitionResource | null>;
        setPersonField?: (personId: string, options: any) => Promise<any>;
        setPersonFieldById?: (personId: string, fieldId: string, value: string) => Promise<any>;
        setPersonFieldBySlug?: (personId: string, slug: string, value: string) => Promise<any>;
        setPersonFieldByName?: (personId: string, name: string, value: string) => Promise<any>;
    };

    /** Mock responses for workflows operations */
    workflows?: {
        getAll?: (options?: any) => Promise<{ data: WorkflowResource[]; meta?: any; links?: any }>;
        getById?: (id: string) => Promise<WorkflowResource>;
        create?: (data: any) => Promise<WorkflowResource>;
        update?: (id: string, data: any) => Promise<WorkflowResource>;
        delete?: (id: string) => Promise<void>;
        getAllPages?: (options?: any) => Promise<{ data: WorkflowResource[]; totalCount: number; pagesFetched: number; duration: number }>;
        addPersonToWorkflow?: (personId: string, workflowId: string, options?: any) => Promise<WorkflowCardResource>;
        createWorkflowCard?: (workflowId: string, personId: string) => Promise<WorkflowCardResource>;
        createWorkflowCardNote?: (personId: string, workflowCardId: string, data: any) => Promise<WorkflowCardNoteResource>;
    };

    /** Mock responses for contacts operations */
    contacts?: {
        getAllEmails?: () => Promise<{ data: EmailResource[]; meta?: any; links?: any }>;
        createEmail?: (data: any) => Promise<EmailResource>;
        getAllPhoneNumbers?: () => Promise<{ data: PhoneNumberResource[]; meta?: any; links?: any }>;
        createPhoneNumber?: (data: any) => Promise<PhoneNumberResource>;
        getAllAddresses?: () => Promise<{ data: AddressResource[]; meta?: any; links?: any }>;
        createAddress?: (data: any) => Promise<AddressResource>;
        getAllSocialProfiles?: () => Promise<{ data: SocialProfileResource[]; meta?: any; links?: any }>;
        createSocialProfile?: (data: any) => Promise<SocialProfileResource>;
    };

    /** Mock responses for households operations */
    households?: {
        getAll?: (options?: any) => Promise<{ data: HouseholdResource[]; meta?: any; links?: any }>;
        getById?: (id: string) => Promise<HouseholdResource>;
        create?: (data: any) => Promise<HouseholdResource>;
        update?: (id: string, data: any) => Promise<HouseholdResource>;
        delete?: (id: string) => Promise<void>;
    };

    /** Mock responses for notes operations */
    notes?: {
        getAll?: (options?: any) => Promise<{ data: NoteResource[]; meta?: any; links?: any }>;
        getById?: (id: string) => Promise<NoteResource>;
        create?: (data: any) => Promise<NoteResource>;
        update?: (id: string, data: any) => Promise<NoteResource>;
        delete?: (id: string) => Promise<void>;
    };

    /** Mock responses for lists operations */
    lists?: {
        getAll?: (options?: any) => Promise<{ data: ListResource[]; meta?: any; links?: any }>;
        getById?: (id: string) => Promise<ListResource>;
        create?: (data: any) => Promise<ListResource>;
        update?: (id: string, data: any) => Promise<ListResource>;
        delete?: (id: string) => Promise<void>;
    };

    /** Mock responses for batch operations */
    batch?: {
        execute?: (operations: any[]) => Promise<any>;
    };
}

export interface RecordingConfig {
    /** Path to save recorded requests/responses */
    recordPath: string;
    /** Whether to record new requests or replay existing ones */
    mode: 'record' | 'replay' | 'auto';
    /** Filter which requests to record */
    filter?: (endpoint: string, method: string) => boolean;
    /** Transform recorded responses */
    transform?: (response: any) => any;
}

export interface RecordedRequest {
    endpoint: string;
    method: string;
    params?: Record<string, any>;
    data?: any;
    response: any;
    timestamp: string;
}

export interface RecordedSession {
    requests: RecordedRequest[];
    metadata: {
        recordedAt: string;
        version: string;
        config: PcoClientConfig;
    };
}
