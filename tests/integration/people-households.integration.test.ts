/**
 * People Households API Integration Tests
 * 
 * Tests for src/people/households.ts functions:
 * - getHouseholds, getHousehold
 * 
 * To run: npm run test:integration:people-households
 */

import {
    createPcoClient,
    getHouseholds,
    getHousehold,
    type PcoClientState,
} from '../../src';
import {
    validateResourceStructure,
    validateStringAttribute,
    validateDateAttribute,
    validateRelationship,
    validatePaginationLinks,
    validatePaginationMeta,
} from '../type-validators';

// Test configuration
const RATE_LIMIT_MAX = parseInt(process.env.PCO_RATE_LIMIT_MAX || '90');
const RATE_LIMIT_WINDOW = parseInt(process.env.PCO_RATE_LIMIT_WINDOW || '20000');

describe('People Households API Integration Tests', () => {
    let client: PcoClientState;

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

    describe('Household Operations', () => {
        it('should get households list', async () => {
            const response = await getHouseholds(client, {
                per_page: 5,
            });

            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);

            // Validate pagination structure
            validatePaginationLinks(response.links);
            validatePaginationMeta(response.meta);

            expect(response.data.length).toBeGreaterThan(0);
            const household = response.data[0];

            // Validate HouseholdResource structure
            validateResourceStructure(household, 'Household');


            validateStringAttribute(household.attributes, 'name');
            validateDateAttribute(household.attributes, 'created_at');
            validateDateAttribute(household.attributes, 'updated_at');

            // Validate HouseholdRelationships
            validateRelationship(household.relationships?.people);
            validateRelationship(household.relationships?.primary_contact);

        }, 30000);

        it('should get single household by ID', async () => {
            // First get a list to find a household ID
            const householdsResponse = await getHouseholds(client, { per_page: 1 });

            expect(householdsResponse.data.length).toBeGreaterThan(0);
            const householdId = householdsResponse.data[0].id;
            const household = await getHousehold(client, householdId, ['people']);

            expect(household.data).toBeDefined();
            expect(household.data?.type).toBe('Household');
            expect(household.data?.id).toBe(householdId);
            expect(household.data?.attributes).toBeDefined();

            // Validate HouseholdResource structure
            validateResourceStructure(household.data, 'Household');

            // Validate HouseholdAttributes
            validateStringAttribute(household.data?.attributes, 'name');
            validateDateAttribute(household.data?.attributes, 'created_at');
            validateDateAttribute(household.data?.attributes, 'updated_at');

            // Validate HouseholdRelationships
            validateRelationship(household.data?.relationships?.people);
            validateRelationship(household.data?.relationships?.primary_contact);


        }, 30000);

        it('should get household with included people', async () => {
            // First get a list to find a household ID
            const householdsResponse = await getHouseholds(client, { per_page: 1 });

            expect(householdsResponse.data.length).toBeGreaterThan(0);
            const householdId = householdsResponse.data[0].id;
            const household = await getHousehold(client, householdId, ['people']);

            expect(household.data).toBeDefined();
            expect(household.data?.type).toBe('Household');

            // Check if included people are present

            const people = household.included?.filter(r => r.type === 'Person');

            people?.forEach(person => {
                validateResourceStructure(person, 'Person');
            });


        }, 30000);

        it('should handle invalid household ID gracefully', async () => {
            await expect(getHousehold(client, 'invalid-id')).rejects.toThrow();
        }, 30000);
    });
});
