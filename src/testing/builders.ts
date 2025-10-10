/**
 * v2.0.0 Mock Response Builders
 */

import type {
    PersonResource,
    PersonAttributes,
    EmailResource,
    EmailAttributes,
    PhoneNumberResource,
    PhoneNumberAttributes,
    AddressResource,
    AddressAttributes,
    SocialProfileResource,
    SocialProfileAttributes,
    FieldDefinitionResource,
    FieldDefinitionAttributes,
    WorkflowResource,
    WorkflowAttributes,
    WorkflowCardResource,
    WorkflowCardAttributes,
    WorkflowCardNoteResource,
    WorkflowCardNoteAttributes,
    HouseholdResource,
    HouseholdAttributes,
    NoteResource,
    NoteAttributes,
    ListResource,
    ListAttributes
} from '../types';

export class MockResponseBuilder {
    /**
     * Build a mock person resource
     */
    static person(overrides: Partial<PersonAttributes> = {}): PersonResource {
        const id = overrides.id || `person_${Date.now()}`;
        return {
            type: 'Person',
            id,
            attributes: {
                id,
                first_name: 'John',
                last_name: 'Doe',
                given_name: 'John',
                middle_name: undefined,
                nickname: undefined,
                birthdate: undefined,
                anniversary: undefined,
                gender: undefined,
                grade: undefined,
                child: false,
                status: 'active',
                medical_notes: undefined,
                job_title: undefined,
                employer: undefined,
                school: undefined,
                graduation_year: undefined,
                avatar: undefined,
                site_administrator: false,
                accounting_administrator: false,
                people_permissions: undefined,
                directory_status: 'visible',
                login_identifier: undefined,
                membership: undefined,
                remote_id: undefined,
                demographic_avatar_url: undefined,
                inactivated_at: undefined,
                resource_permission_flags: {},
                ...overrides,
            },
            relationships: {
                emails: { data: [] },
                phone_numbers: { data: [] },
                field_data: { data: [] },
                workflow_cards: { data: [] },
                household: { data: null },
            },
        };
    }

    /**
     * Build a mock email resource
     */
    static email(overrides: Partial<EmailAttributes> = {}): EmailResource {
        const id = overrides.id || `email_${Date.now()}`;
        return {
            type: 'Email',
            id,
            attributes: {
                id,
                address: 'john@example.com',
                location: 'Home',
                primary: true,
                ...overrides,
            },
            relationships: {
                person: { data: { type: 'Person', id: 'person_123' } },
            },
        };
    }

    /**
     * Build a mock phone number resource
     */
    static phoneNumber(overrides: Partial<PhoneNumberAttributes> = {}): PhoneNumberResource {
        const id = overrides.id || `phone_${Date.now()}`;
        return {
            type: 'PhoneNumber',
            id,
            attributes: {
                id,
                number: '555-1234',
                location: 'Home',
                primary: true,
                ...overrides,
            },
            relationships: {
                person: { data: { type: 'Person', id: 'person_123' } },
            },
        };
    }

    /**
     * Build a mock address resource
     */
    static address(overrides: Partial<AddressAttributes> = {}): AddressResource {
        const id = overrides.id || `address_${Date.now()}`;
        return {
            type: 'Address',
            id,
            attributes: {
                id,
                street: '123 Main St',
                city: 'Anytown',
                state: 'CA',
                zip: '12345',
                country: 'US',
                location: 'Home',
                primary: true,
                ...overrides,
            },
            relationships: {
                person: { data: { type: 'Person', id: 'person_123' } },
            },
        };
    }

    /**
     * Build a mock social profile resource
     */
    static socialProfile(overrides: Partial<SocialProfileAttributes> = {}): SocialProfileResource {
        const id = overrides.id || `social_${Date.now()}`;
        return {
            type: 'SocialProfile',
            id,
            attributes: {
                id,
                name: 'Facebook',
                url: 'https://facebook.com/johndoe',
                ...overrides,
            },
            relationships: {
                person: { data: { type: 'Person', id: 'person_123' } },
            },
        };
    }

    /**
     * Build a mock field definition resource
     */
    static fieldDefinition(overrides: Partial<FieldDefinitionAttributes> = {}): FieldDefinitionResource {
        const id = overrides.id || `field_${Date.now()}`;
        return {
            type: 'FieldDefinition',
            id,
            attributes: {
                id,
                name: 'Custom Field',
                slug: 'custom_field',
                data_type: 'text',
                required: false,
                public: false,
                config: null,
                deleted_at: null,
                sequence: 1,
                tab_id: 'tab_123',
                ...overrides,
            },
            relationships: {
                tab: { data: { type: 'Tab', id: 'tab_123' } },
            },
        };
    }

    /**
     * Build a mock workflow resource
     */
    static workflow(overrides: Partial<WorkflowAttributes> = {}): WorkflowResource {
        const id = overrides.id || `workflow_${Date.now()}`;
        return {
            type: 'Workflow',
            id,
            attributes: {
                id,
                name: 'New Member Workflow',
                description: 'Workflow for new members',
                ...overrides,
            },
            relationships: {},
        };
    }

    /**
     * Build a mock workflow card resource
     */
    static workflowCard(overrides: Partial<WorkflowCardAttributes> = {}): WorkflowCardResource {
        const id = overrides.id || `workflow_card_${Date.now()}`;
        return {
            type: 'WorkflowCard',
            id,
            attributes: {
                id,
                completed_at: null,
                removed_at: null,
                ...overrides,
            },
            relationships: {
                person: { data: { type: 'Person', id: 'person_123' } },
                workflow: { data: { type: 'Workflow', id: 'workflow_123' } },
            },
        };
    }

    /**
     * Build a mock workflow card note resource
     */
    static workflowCardNote(overrides: Partial<WorkflowCardNoteAttributes> = {}): WorkflowCardNoteResource {
        const id = overrides.id || `workflow_card_note_${Date.now()}`;
        return {
            type: 'WorkflowCardNote',
            id,
            attributes: {
                id,
                note: 'This is a note',
                ...overrides,
            },
            relationships: {
                workflow_card: { data: { type: 'WorkflowCard', id: 'workflow_card_123' } },
            },
        };
    }

    /**
     * Build a mock household resource
     */
    static household(overrides: Partial<HouseholdAttributes> = {}): HouseholdResource {
        const id = overrides.id || `household_${Date.now()}`;
        return {
            type: 'Household',
            id,
            attributes: {
                id,
                name: 'Doe Family',
                ...overrides,
            },
            relationships: {
                people: { data: [] },
            },
        };
    }

    /**
     * Build a mock note resource
     */
    static note(overrides: Partial<NoteAttributes> = {}): NoteResource {
        const id = overrides.id || `note_${Date.now()}`;
        return {
            type: 'Note',
            id,
            attributes: {
                id,
                note: 'This is a note',
                ...overrides,
            },
            relationships: {
                person: { data: { type: 'Person', id: 'person_123' } },
                note_category: { data: null },
            },
        };
    }

    /**
     * Build a mock list resource
     */
    static list(overrides: Partial<ListAttributes> = {}): ListResource {
        const id = overrides.id || `list_${Date.now()}`;
        return {
            type: 'List',
            id,
            attributes: {
                id,
                name: 'My List',
                ...overrides,
            },
            relationships: {
                list_category: { data: null },
                people: { data: [] },
            },
        };
    }

    /**
     * Build a paginated response
     */
    static paginated<T>(data: T[], meta: any = {}): { data: T[]; meta: any; links: any } {
        return {
            data,
            meta: {
                total_count: data.length,
                count: data.length,
                ...meta,
            },
            links: {
                self: '/api/v2/people?page=1',
                next: null,
                prev: null,
            },
        };
    }

    /**
     * Build a single resource response
     */
    static single<T>(data: T): { data: T } {
        return { data };
    }

    /**
     * Build an error response
     */
    static error(status: number, message: string, details: any = {}): any {
        return {
            errors: [
                {
                    status: status.toString(),
                    title: message,
                    detail: details,
                },
            ],
        };
    }
}
