/**
 * People Core API Integration Tests
 * 
 * Tests for src/people/core.ts functions:
 * - getPeople, getPerson, createPerson, updatePerson, deletePerson
 * 
 * To run: npm run test:integration:people-core
 */

import {
    createPcoClient,
    getPeople,
    getPerson,
    createPerson,
    updatePerson,
    deletePerson,
    type PcoClientState,
    type PersonAttributes,
} from '../../src';
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
} from '../type-validators';

// Test configuration
const TEST_PREFIX = 'TEST_INTEGRATION_2025';
const RATE_LIMIT_MAX = parseInt(process.env.PCO_RATE_LIMIT_MAX || '90');
const RATE_LIMIT_WINDOW = parseInt(process.env.PCO_RATE_LIMIT_WINDOW || '20000');

describe('People Core API Integration Tests', () => {
    let client: PcoClientState;
    let testPersonId = ''

    beforeAll(async () => {
        // Validate environment variables
        const hasAppCredentials = process.env.PCO_APP_ID && process.env.PCO_APP_SECRET;
        const hasOAuthCredentials = process.env.PCO_ACCESS_TOKEN;

        if (!hasAppCredentials && !hasOAuthCredentials) {
            throw new Error(
                'PCO credentials not found. Please set PCO_APP_ID and PCO_APP_SECRET, or PCO_ACCESS_TOKEN in .env.test'
            );
        }

        // Create client with rate limiting
        const config = hasOAuthCredentials
            ? {
                accessToken: process.env.PCO_ACCESS_TOKEN!,
                rateLimit: {
                    maxRequests: RATE_LIMIT_MAX,
                    perMilliseconds: RATE_LIMIT_WINDOW,
                },
                timeout: 30000,
            }
            : {
                appId: process.env.PCO_APP_ID!,
                appSecret: process.env.PCO_APP_SECRET!,
                rateLimit: {
                    maxRequests: RATE_LIMIT_MAX,
                    perMilliseconds: RATE_LIMIT_WINDOW,
                },
                timeout: 30000,
            };

        client = createPcoClient(config);
    }, 30000);

    afterAll(async () => {
        // Clean up test person
        if (testPersonId) {
            await deletePerson(client, testPersonId);
            testPersonId = '';
        }
    }, 30000);

    describe('Read Operations', () => {
        it('should get people list with proper typing', async () => {
            const response = await getPeople(client, {
                include: ['emails', 'phone_numbers'],
                per_page: 5,
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

        it('should filter people by status', async () => {
            const response = await getPeople(client, {
                per_page: 3,
                where: { status: 'active' },
            });

            expect(Array.isArray(response.data)).toBe(true);

            // All returned people should be active
            response.data.forEach((person) => {
                expect(person.attributes?.status).toBe('active');
            });
        }, 30000);

        it('should get a single person with full details', async () => {
            // First get a list to find a person ID
            const peopleResponse = await getPeople(client, { per_page: 1 });

            expect(peopleResponse.data.length).toBeGreaterThan(0);
            const personId = peopleResponse.data[0].id;
            const person = await getPerson(client, personId, ['emails', 'phone_numbers']);

            expect(person.data).toBeDefined();
            expect(person.data?.type).toBe('Person');
            expect(person.data?.id).toBe(personId);
            expect(person.data?.attributes).toBeDefined();
        }, 30000);
    });

    describe('Write Operations', () => {
        it('should create, update, and delete a person', async () => {
            const timestamp = Date.now();
            const personData: Partial<PersonAttributes> = {
                first_name: `${TEST_PREFIX}_John_${timestamp}`,
                last_name: `${TEST_PREFIX}_Doe_${timestamp}`,
                status: 'active',
            };

            // Create person
            const createResponse = await createPerson(client, personData);
            expect(createResponse.data).toBeDefined();
            expect(createResponse.data?.attributes?.first_name).toBe(personData.first_name);
            expect(createResponse.data?.attributes?.last_name).toBe(personData.last_name);

            testPersonId = createResponse.data?.id || '';
            expect(testPersonId).toBeTruthy();

            // Update person
            const updateData: Partial<PersonAttributes> = {
                first_name: `${TEST_PREFIX}_Jane_${timestamp}`,
            };

            const updateResponse = await updatePerson(client, testPersonId!, updateData);
            expect(updateResponse.data?.attributes?.first_name).toBe(updateData.first_name);
            expect(updateResponse.data?.attributes?.last_name).toBe(personData.last_name);

            // Verify update
            const getResponse = await getPerson(client, testPersonId!);
            expect(getResponse.data?.attributes?.first_name).toBe(updateData.first_name);
        }, 30000);

        it('should handle invalid person ID gracefully', async () => {
            await expect(getPerson(client, 'invalid-id')).rejects.toThrow();
        }, 30000);
    });
});
