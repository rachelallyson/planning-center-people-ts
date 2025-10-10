/**
 * Simplified Mock Response Builders for Testing
 */

export class SimpleMockResponseBuilder {
    /**
     * Build a simple mock person resource
     */
    static person(overrides: any = {}): any {
        return {
            type: 'Person',
            id: overrides.id || `person_${Date.now()}`,
            attributes: {
                id: overrides.id || `person_${Date.now()}`,
                first_name: overrides.first_name || 'John',
                last_name: overrides.last_name || 'Doe',
                status: 'active',
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
     * Build a simple mock email resource
     */
    static email(overrides: any = {}): any {
        return {
            type: 'Email',
            id: overrides.id || `email_${Date.now()}`,
            attributes: {
                id: overrides.id || `email_${Date.now()}`,
                address: overrides.address || 'john@example.com',
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
     * Build a simple mock phone number resource
     */
    static phoneNumber(overrides: any = {}): any {
        return {
            type: 'PhoneNumber',
            id: overrides.id || `phone_${Date.now()}`,
            attributes: {
                id: overrides.id || `phone_${Date.now()}`,
                number: overrides.number || '555-1234',
                location: 'Mobile',
                primary: true,
                ...overrides,
            },
            relationships: {
                person: { data: { type: 'Person', id: 'person_123' } },
            },
        };
    }

    /**
     * Build a simple mock workflow resource
     */
    static workflow(overrides: any = {}): any {
        return {
            type: 'Workflow',
            id: overrides.id || `workflow_${Date.now()}`,
            attributes: {
                id: overrides.id || `workflow_${Date.now()}`,
                name: overrides.name || 'New Member Workflow',
                description: overrides.description || 'Workflow for new members',
                ...overrides,
            },
            relationships: {},
        };
    }

    /**
     * Build a simple paginated response
     */
    static paginated(data: any[], meta: any = {}): any {
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
     * Build a simple single resource response
     */
    static single(data: any): any {
        return { data };
    }

    /**
     * Build a simple error response
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
