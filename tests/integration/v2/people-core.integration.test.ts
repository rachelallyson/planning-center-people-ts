/**
 * v2.0.0 People Core API Integration Tests
 * 
 * Tests for the new PcoClient v2.0 API:
 * - client.people.getAll(), client.people.get(), client.people.create(), etc.
 * - Built-in pagination with client.people.getAllPages()
 * - Event system monitoring
 * - Client manager caching
 * 
 * To run: npm run test:integration:v2:people-core
 */

import {
    PcoClient,
    PcoClientManager,
    type PcoClientConfig,
    type PersonAttributes,
} from '../../../src';
import { createTestClient, logAuthStatus } from '../test-config';
import {
    validateResourceStructure,
    validateNullableStringAttribute,
    validateBooleanAttribute,
    validateStringAttribute,
    validateDateAttribute,
    validateRelationship,
    validateIncludedResources,
    validatePaginationLinks,
    validatePaginationMeta,
} from '../../type-validators';

// Test configuration
const TEST_PREFIX = 'TEST_V2_INTEGRATION_2025';
const RATE_LIMIT_MAX = parseInt(process.env.PCO_RATE_LIMIT_MAX || '90');
const RATE_LIMIT_WINDOW = parseInt(process.env.PCO_RATE_LIMIT_WINDOW || '20000');

describe('v2.0.0 People Core API Integration Tests', () => {
    let client: PcoClient;
    let testPersonId = '';

    beforeAll(async () => {
        // Log authentication status for debugging
        logAuthStatus();

        // Create client with proper token refresh support
        client = createTestClient();

        // Add people-core-specific event handlers
        client.on('error', (event) => {
            console.error('PCO Error:', event.error.message);
        });
        client.on('request:start', (event) => {
            console.log(`Starting ${event.method} ${event.endpoint}`);
        });
        client.on('request:complete', (event) => {
            console.log(`Completed ${event.method} ${event.endpoint} in ${event.duration}ms`);
        });
    }, 30000);

    afterAll(async () => {
        // Clean up test person using v2.0 API
        if (testPersonId) {
            await client.people.delete(testPersonId);
            testPersonId = '';
        }
    }, 120000);

    describe('v2.0 Client Creation and Configuration', () => {
        it('should create a client with proper configuration', () => {
            expect(client).toBeDefined();
            expect(client.getConfig()).toBeDefined();
            expect(client.getConfig().auth).toBeDefined();
        });

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

        it('should support event system', () => {
            const handler = jest.fn();
            const initialCount = client.listenerCount('request:start');
            client.on('request:start', handler);
            expect(client.listenerCount('request:start')).toBe(initialCount + 1);

            client.off('request:start', handler);
            expect(client.listenerCount('request:start')).toBe(initialCount);
        });
    });

    describe('v2.0 Read Operations', () => {
        it('should get people list with proper typing using v2.0 API', async () => {
            const response = await client.people.getAll({
                include: ['emails', 'phone_numbers'],
                perPage: 5,
            });

            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);
            expect(response).toHaveProperty('links');
            expect(response).toHaveProperty('meta');

            // Validate pagination structure
            validatePaginationLinks(response.links);
            validatePaginationMeta(response.meta);

            expect(response.data.length).toBeGreaterThan(0);
            const person = response.data[0];

            // Validate PersonResource structure
            validateResourceStructure(person, 'Person');

            // Validate PersonAttributes
            validateNullableStringAttribute(person.attributes, 'first_name');
            validateNullableStringAttribute(person.attributes, 'last_name');
            validateNullableStringAttribute(person.attributes, 'given_name');
            validateNullableStringAttribute(person.attributes, 'middle_name');
            validateNullableStringAttribute(person.attributes, 'nickname');
            validateNullableStringAttribute(person.attributes, 'birthdate');
            validateNullableStringAttribute(person.attributes, 'anniversary');
            validateNullableStringAttribute(person.attributes, 'gender');
            validateNullableStringAttribute(person.attributes, 'grade');
            validateBooleanAttribute(person.attributes, 'child');
            validateStringAttribute(person.attributes, 'status');
            validateDateAttribute(person.attributes, 'created_at');
            validateDateAttribute(person.attributes, 'updated_at');
            validateBooleanAttribute(person.attributes, 'site_administrator');
            validateBooleanAttribute(person.attributes, 'accounting_administrator');
            validateNullableStringAttribute(person.attributes, 'people_permissions');
            validateNullableStringAttribute(person.attributes, 'remote_id');

            validateRelationship(person.relationships?.emails);
            validateRelationship(person.relationships?.phone_numbers);
            validateRelationship(person.relationships?.primary_campus);
            validateRelationship(person.relationships?.gender);

            // Validate included resources if present
            // @ts-ignore - response.included is undefined
            validateIncludedResources(response.included, ['Email', 'PhoneNumber']);

        }, 30000);

        it('should filter people by status using v2.0 API', async () => {
            const response = await client.people.getAll({
                perPage: 3,
                where: { status: 'active' },
            });

            expect(Array.isArray(response.data)).toBe(true);

            // All returned people should be active
            response.data.forEach((person) => {
                expect(person.attributes?.status).toBe('active');
            });
        }, 30000);

        it('should get a single person with full details using v2.0 API', async () => {
            // First get a list to find a person ID
            const peopleResponse = await client.people.getAll({ perPage: 1 });

            expect(peopleResponse.data.length).toBeGreaterThan(0);
            const personId = peopleResponse.data[0].id;
            const person = await client.people.getById(personId, ['emails', 'phone_numbers']);

            expect(person).toBeDefined();
            expect(person.type).toBe('Person');
            expect(person.id).toBe(personId);
            expect(person.attributes).toBeDefined();
        }, 30000);
    });

    describe('v2.0 Built-in Pagination', () => {
        it('should get all pages using getAllPages() method', async () => {
            let totalFetched = 0;
            let progressCallbackCalled = false;

            const result = await client.people.getAllPagesPaginated(
                { perPage: 10 },
                {
                    onProgress: (fetched, total) => {
                        totalFetched = fetched;
                        progressCallbackCalled = true;
                        console.log(`Progress: ${fetched}/${total} people fetched`);
                    },
                    maxPages: 3, // Limit to 3 pages for testing
                }
            );

            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);
            expect(result.totalCount).toBeGreaterThan(0);
            expect(result.pagesFetched).toBeGreaterThan(0);
            expect(result.duration).toBeGreaterThan(0);
            expect(progressCallbackCalled).toBe(true);
            expect(totalFetched).toBe(result.data.length);

            // Validate that we got people from multiple pages
            if (result.pagesFetched > 1) {
                expect(result.data.length).toBeGreaterThan(10);
            }
        }, 60000);
    });

    describe('v2.0 Write Operations', () => {
        it('should create, update, and delete a person using v2.0 API', async () => {
            const timestamp = Date.now();
            const personData: Partial<PersonAttributes> = {
                first_name: `${TEST_PREFIX}_John_${timestamp}`,
                last_name: `${TEST_PREFIX}_Doe_${timestamp}`,
                status: 'active',
            };

            // Create person using v2.0 API
            const createResponse = await client.people.create(personData);
            expect(createResponse).toBeDefined();
            expect(createResponse.attributes?.first_name).toBe(personData.first_name);
            expect(createResponse.attributes?.last_name).toBe(personData.last_name);

            testPersonId = createResponse.id || '';
            expect(testPersonId).toBeTruthy();

            // Update person using v2.0 API
            const updateData: Partial<PersonAttributes> = {
                first_name: `${TEST_PREFIX}_Jane_${timestamp}`,
            };

            const updateResponse = await client.people.update(testPersonId!, updateData);
            expect(updateResponse.attributes?.first_name).toBe(updateData.first_name);
            expect(updateResponse.attributes?.last_name).toBe(personData.last_name);

            // Verify update using v2.0 API
            const getResponse = await client.people.getById(testPersonId!);
            expect(getResponse.attributes?.first_name).toBe(updateData.first_name);
        }, 60000);

        it('should handle invalid person ID gracefully using v2.0 API', async () => {
            await expect(client.people.getById('invalid-id')).rejects.toThrow();
        }, 30000);
    });

    describe('v2.0 Contact Operations', () => {
        it('should add email to person using v2.0 API', async () => {
            if (!testPersonId) {
                // Create a test person first
                const timestamp = Date.now();
                const personData: Partial<PersonAttributes> = {
                    first_name: `${TEST_PREFIX}_Contact_${timestamp}`,
                    last_name: `${TEST_PREFIX}_Test_${timestamp}`,
                    status: 'active',
                };
                const createResponse = await client.people.create(personData);
                testPersonId = createResponse.data?.id || '';
            }

            const emailData = {
                address: `test${Date.now()}@gmail.com`, // Use a real domain to avoid validation errors
                location: 'Home',
                primary: true,
            };

            const emailResponse = await client.people.addEmail(testPersonId, emailData);
            expect(emailResponse).toBeDefined();
            expect(emailResponse.attributes?.address).toBe(emailData.address);
            expect(emailResponse.attributes?.primary).toBe(true);
        }, 60000);

        it('should add phone number to person using v2.0 API', async () => {
            if (!testPersonId) {
                // Create a test person first
                const timestamp = Date.now();
                const personData: Partial<PersonAttributes> = {
                    first_name: `${TEST_PREFIX}_Contact_${timestamp}`,
                    last_name: `${TEST_PREFIX}_Test_${timestamp}`,
                    status: 'active',
                };
                const createResponse = await client.people.create(personData);
                testPersonId = createResponse.data?.id || '';
            }

            const phoneData = {
                number: `555-${Date.now().toString().slice(-4)}`,
                location: 'Home',
                primary: true,
            };

            const phoneResponse = await client.people.addPhoneNumber(testPersonId, phoneData);
            expect(phoneResponse).toBeDefined();
            expect(phoneResponse.attributes?.number).toBe(phoneData.number);
            expect(phoneResponse.attributes?.primary).toBe(true);
        }, 30000);
    });

    describe('v2.0 Performance Metrics', () => {
        it('should provide performance metrics', () => {
            const metrics = client.getPerformanceMetrics();
            expect(metrics).toBeDefined();
            expect(typeof metrics).toBe('object');
        });

        it('should provide rate limit information', () => {
            const rateLimitInfo = client.getRateLimitInfo();
            expect(rateLimitInfo).toBeDefined();
            expect(typeof rateLimitInfo).toBe('object');
        });
    });
});

describe('v2.0.0 Client Manager Integration Tests', () => {
    let clientManager: typeof PcoClientManager;

    beforeAll(() => {
        clientManager = PcoClientManager;
    });

    it('should create and cache client instances', async () => {
        const config: PcoClientConfig = {
            auth: {
                type: 'oauth',
                accessToken: process.env.PCO_ACCESS_TOKEN || 'test-token',
            },
        };

        const churchId = 'test-church-123';

        // Get client from manager
        const client1 = clientManager.getClient(config);
        expect(client1).toBeDefined();

        // Get same client again (should be cached)
        const client2 = clientManager.getClient(config);
        expect(client2).toBe(client1); // Should be the same instance

        // Clean up
        clientManager.clearCache();
    });

    it('should clear client cache', () => {
        // Clear all clients
        expect(() => clientManager.clearCache()).not.toThrow();
    });
});
