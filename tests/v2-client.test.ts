/**
 * v2.0.0 Client Tests
 */

import { PcoClient, createTestClient, MockResponseBuilder } from '../src';

describe('PcoClient v2.0.0', () => {
    let client: PcoClient;
    let mockClient: any;

    beforeEach(() => {
        client = new PcoClient({
            auth: {
                type: 'oauth',
                accessToken: 'test-token',
            },
        });

        mockClient = createTestClient();
    });

    describe('Client Creation', () => {
        it('should create a client with OAuth configuration', () => {
            expect(client).toBeDefined();
            expect(client.getConfig().auth.type).toBe('oauth');
            expect(client.getConfig().auth.accessToken).toBe('test-token');
        });

        it('should create a client with basic auth configuration', () => {
            const basicClient = new PcoClient({
                auth: {
                    type: 'basic',
                    appId: 'test-app-id',
                    appSecret: 'test-app-secret',
                },
            });

            expect(basicClient.getConfig().auth.type).toBe('basic');
            expect(basicClient.getConfig().auth.appId).toBe('test-app-id');
        });
    });

    describe('Event System', () => {
        it('should emit events for requests', () => {
            // Test that event listeners can be set up
            const startHandler = jest.fn();
            const completeHandler = jest.fn();

            client.on('request:start', startHandler);
            client.on('request:complete', completeHandler);

            expect(client.listenerCount('request:start')).toBe(1);
            expect(client.listenerCount('request:complete')).toBe(1);

            // Test that listeners can be removed
            client.off('request:start', startHandler);
            client.off('request:complete', completeHandler);

            expect(client.listenerCount('request:start')).toBe(0);
            expect(client.listenerCount('request:complete')).toBe(0);
        });

        it('should remove event listeners', () => {
            const handler = jest.fn();

            client.on('error', handler);
            expect(client.listenerCount('error')).toBe(1);

            client.off('error', handler);
            expect(client.listenerCount('error')).toBe(0);
        });

        it('should remove all listeners', () => {
            client.on('error', jest.fn());
            client.on('auth:failure', jest.fn());

            expect(client.listenerCount('error')).toBe(1);
            expect(client.listenerCount('auth:failure')).toBe(1);

            client.removeAllListeners();

            expect(client.listenerCount('error')).toBe(0);
            expect(client.listenerCount('auth:failure')).toBe(0);
        });
    });

    describe('Performance Metrics', () => {
        it('should return performance metrics', () => {
            const metrics = client.getPerformanceMetrics();
            expect(metrics).toBeDefined();
            expect(typeof metrics).toBe('object');
        });

        it('should return rate limit info', () => {
            const rateLimitInfo = client.getRateLimitInfo();
            expect(rateLimitInfo).toBeDefined();
            expect(typeof rateLimitInfo).toBe('object');
        });
    });

    describe('Module Access', () => {
        it('should provide access to all modules', () => {
            expect(client.people).toBeDefined();
            expect(client.fields).toBeDefined();
            expect(client.workflows).toBeDefined();
            expect(client.contacts).toBeDefined();
            expect(client.households).toBeDefined();
            expect(client.notes).toBeDefined();
            expect(client.lists).toBeDefined();
            expect(client.batch).toBeDefined();
        });
    });

    describe('Configuration Updates', () => {
        it('should update configuration', () => {
            const newConfig = {
                auth: {
                    type: 'oauth' as const,
                    accessToken: 'new-token',
                },
                timeout: 60000,
            };

            client.updateConfig(newConfig);

            expect(client.getConfig().auth.accessToken).toBe('new-token');
            expect(client.getConfig().timeout).toBe(60000);
        });
    });
});

describe('Mock Client', () => {
    let mockClient: any;

    beforeEach(() => {
        mockClient = createTestClient();
    });

    describe('People Module', () => {
        it('should get all people', async () => {
            const result = await mockClient.people.getAll();

            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);
            expect(result.meta).toBeDefined();
        });

        it('should create a person', async () => {
            const personData = {
                firstName: 'John',
                lastName: 'Doe',
            };

            const result = await mockClient.people.create(personData);

            expect(result.id).toBeDefined();
            expect(result.type).toBe('Person');
        });

        it('should find or create a person', async () => {
            const options = {
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'jane@example.com',
            };

            const result = await mockClient.people.findOrCreate(options);

            expect(result.id).toBeDefined();
            expect(result.type).toBe('Person');
        });

        it('should get all pages', async () => {
            const result = await mockClient.people.getAllPages();

            expect(result.data).toBeDefined();
            expect(result.totalCount).toBeDefined();
            expect(result.pagesFetched).toBeDefined();
            expect(result.duration).toBeDefined();
        });
    });

    describe('Fields Module', () => {
        it('should get all field definitions', async () => {
            const result = await mockClient.fields.getAllFieldDefinitions();

            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);
        });

        it('should set person field by slug', async () => {
            const result = await mockClient.fields.setPersonFieldBySlug(
                'person_123',
                'BIRTHDATE',
                '1990-01-01'
            );

            expect(result.id).toBeDefined();
            expect(result.value).toBe('1990-01-01');
        });
    });

    describe('Workflows Module', () => {
        it('should get all workflows', async () => {
            const result = await mockClient.workflows.getAll();

            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);
        });

        it('should add person to workflow', async () => {
            const result = await mockClient.workflows.addPersonToWorkflow(
                'person_123',
                'workflow_456',
                { note: 'Test note' }
            );

            expect(result.id).toBeDefined();
            expect(result.type).toBe('WorkflowCard');
        });
    });

    describe('Batch Operations', () => {
        it('should execute batch operations', async () => {
            const operations = [
                { type: 'people.create', data: { firstName: 'Test', lastName: 'User' } },
                { type: 'people.create', data: { firstName: 'Another', lastName: 'User' } },
            ];

            const result = await mockClient.batch.execute(operations);

            expect(result.total).toBe(2);
            expect(result.successful).toBe(2);
            expect(result.failed).toBe(0);
            expect(result.successRate).toBe(1.0);
            expect(result.results).toHaveLength(2);
        });
    });
});

describe('MockResponseBuilder', () => {
    it('should build a person resource', () => {
        const person = MockResponseBuilder.person({
            first_name: 'Test',
            last_name: 'Person',
        });

        expect(person.type).toBe('Person');
        expect(person.attributes.first_name).toBe('Test');
        expect(person.attributes.last_name).toBe('Person');
        expect(person.relationships).toBeDefined();
    });

    it('should build an email resource', () => {
        const email = MockResponseBuilder.email({
            address: 'test@example.com',
            primary: true,
        });

        expect(email.type).toBe('Email');
        expect(email.attributes.address).toBe('test@example.com');
        expect(email.attributes.primary).toBe(true);
    });

    it('should build a workflow resource', () => {
        const workflow = MockResponseBuilder.workflow({
            name: 'Test Workflow',
            description: 'A test workflow',
        });

        expect(workflow.type).toBe('Workflow');
        expect(workflow.attributes.name).toBe('Test Workflow');
        expect(workflow.attributes.description).toBe('A test workflow');
    });

    it('should build a paginated response', () => {
        const data = [
            MockResponseBuilder.person({ first_name: 'Person 1' }),
            MockResponseBuilder.person({ first_name: 'Person 2' }),
        ];

        const paginated = MockResponseBuilder.paginated(data);

        expect(paginated.data).toHaveLength(2);
        expect(paginated.meta.total_count).toBe(2);
        expect(paginated.links).toBeDefined();
    });

    it('should build a single resource response', () => {
        const person = MockResponseBuilder.person();
        const single = MockResponseBuilder.single(person);

        expect(single.data).toBe(person);
    });

    it('should build an error response', () => {
        const error = MockResponseBuilder.error(404, 'Not Found', { detail: 'Resource not found' });

        expect(error.errors).toHaveLength(1);
        expect(error.errors[0].status).toBe('404');
        expect(error.errors[0].title).toBe('Not Found');
        expect(error.errors[0].detail).toEqual({ detail: 'Resource not found' });
    });
});
