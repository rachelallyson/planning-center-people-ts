/**
 * People Lists API Integration Tests
 * 
 * Tests for src/people/lists.ts functions:
 * - getLists, getListById, getListCategories
 * 
 * To run: npm run test:integration:people-lists
 */

import {
    createPcoClient,
    getLists,
    getListById,
    getListCategories,
    type PcoClientState,
} from '../../src';
import {
    validateResourceStructure,
    validateStringAttribute,
    validateDateAttribute,
    validateRelationship,
    validatePaginationLinks,
    validatePaginationMeta,
    validateNumberAttribute,
} from '../type-validators';

// Test configuration
const RATE_LIMIT_MAX = parseInt(process.env.PCO_RATE_LIMIT_MAX || '90');
const RATE_LIMIT_WINDOW = parseInt(process.env.PCO_RATE_LIMIT_WINDOW || '20000');

describe('People Lists API Integration Tests', () => {
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

    describe('List Management', () => {
        it('should get lists with filtering', async () => {

            const response = await getLists(client, { per_page: 5 });

            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);

            // Validate pagination structure
            validatePaginationLinks(response.links);
            validatePaginationMeta(response.meta);

            expect(response.data.length).toBeGreaterThan(0);
            const list = response.data[0];

            // Validate ListResource structure
            validateResourceStructure(list, 'List');

            // Validate ListAttributes
            validateStringAttribute(list.attributes, 'name');
            validateStringAttribute(list.attributes, 'description');
            validateDateAttribute(list.attributes, 'created_at');
            validateDateAttribute(list.attributes, 'updated_at');

            // Validate ListRelationships (should not exist according to API docs)
            expect(list.relationships).toBeUndefined();

        }, 30000);

        it('should get single list by ID', async () => {

            // First get a list to find a list ID
            const listsResponse = await getLists(client, { per_page: 1 });

            expect(listsResponse.data.length).toBeGreaterThan(0);
            const listId = listsResponse.data[0].id;
            const list = await getListById(client, listId, { include: ['list_category'] });

            expect(list.data).toBeDefined();
            expect(list.data?.type).toBe('List');
            expect(list.data?.id).toBe(listId);
            expect(list.data?.attributes).toBeDefined();

            // Validate ListResource structure
            validateResourceStructure(list.data, 'List');

            // Validate ListAttributes
            validateStringAttribute(list.data?.attributes, 'name');
            validateStringAttribute(list.data?.attributes, 'description');
            validateDateAttribute(list.data?.attributes, 'created_at');
            validateDateAttribute(list.data?.attributes, 'updated_at');


            // Validate ListRelationships (should not exist according to API docs)
            expect(list.data?.relationships).toBeUndefined();



            // Check if included list category is present
            const categories = list.included?.filter(r => r.type === 'ListCategory');
            categories?.forEach(category => {
                validateResourceStructure(category, 'ListCategory');
            });


        }, 30000);

        it('should handle invalid list ID gracefully', async () => {
            await expect(getListById(client, 'invalid-id')).rejects.toThrow();
        }, 30000);
    });

    describe('List Categories', () => {
        it('should get list categories', async () => {

            const response = await getListCategories(client, { per_page: 5 });

            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);

            // Validate pagination structure
            validatePaginationLinks(response.links);
            validatePaginationMeta(response.meta);

            expect(response.data.length).toBeGreaterThan(0);
            const category = response.data[0];

            // Validate ListCategoryResource structure
            validateResourceStructure(category, 'ListCategory');

            // Validate ListCategoryAttributes
            validateStringAttribute(category.attributes, 'name');
            validateDateAttribute(category.attributes, 'created_at');
            validateDateAttribute(category.attributes, 'updated_at');

            // Validate ListCategoryRelationships
            validateRelationship(category.relationships?.organization);

        }, 30000);

        it('should validate list category structure', async () => {

            const response = await getListCategories(client, { per_page: 1 });

            expect(response.data.length).toBeGreaterThan(0);
            const category = response.data[0];

            // Validate ListCategoryResource structure
            validateResourceStructure(category, 'ListCategory');

            // Validate ListCategoryAttributes
            validateDateAttribute(category.attributes, 'created_at');
            validateStringAttribute(category.attributes, 'name');
            validateNumberAttribute(category.attributes, 'organization_id');
            validateDateAttribute(category.attributes, 'updated_at');

            // Validate ListCategoryRelationships
            // Note: The API response shows organization relationship, not lists relationship
            validateRelationship(category.relationships?.organization);


        }, 30000);
    });
});
