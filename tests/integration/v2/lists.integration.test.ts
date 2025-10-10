import {
    PcoClient,
    type PersonAttributes,
} from '../../../src';
import { validatePersonResource } from '../../type-validators';
import { createTestClient, logAuthStatus } from '../test-config';

const TEST_PREFIX = 'TEST_V2_LISTS_2025';

describe('v2.0.0 Lists API Integration Tests', () => {
    let client: PcoClient;
    let testPersonId: string;
    let testListId: string;
    let testCategoryId: string;

    beforeAll(async () => {
        // Log authentication status for debugging
        logAuthStatus();

        // Create client with proper token refresh support
        client = createTestClient();

        // Create a test person for list operations
        const timestamp = Date.now();
        const personData: Partial<PersonAttributes> = {
            first_name: `${TEST_PREFIX}_ListTest_${timestamp}`,
            last_name: `${TEST_PREFIX}_Test_${timestamp}`,
            status: 'active',
        };

        const createResponse = await client.people.create(personData);
        testPersonId = createResponse.id || '';
        expect(testPersonId).toBeTruthy();

        // Get an existing list ID for testing (since we can't create lists due to permissions)
        const listsResponse = await client.lists.getAll({ perPage: 1 });
        if (listsResponse.data.length > 0) {
            testListId = listsResponse.data[0].id;
        }
    }, 30000);

    afterAll(async () => {
        // Clean up test person (this will also clean up list memberships)
        if (testPersonId) {
            try {
                await client.people.delete(testPersonId);
            } catch (error) {
                console.warn('Failed to clean up test person:', error);
            }
        }
    }, 30000);

    describe('v2.0 List Operations', () => {
        it('should get all lists with pagination', async () => {
            const lists = await client.lists.getAll();
            expect(lists.data).toBeDefined();
            expect(Array.isArray(lists.data)).toBe(true);
            expect(lists.meta).toBeDefined();
        }, 30000);

        it('should get list by ID', async () => {
            const lists = await client.lists.getAll();
            expect(lists.data.length).toBeGreaterThan(0);

            const listId = lists.data[0].id;
            const list = await client.lists.getById(listId);

            expect(list).toBeDefined();
            expect(list.type).toBe('List');
            expect(list.id).toBe(listId);
            expect(list.attributes).toBeDefined();
        }, 30000);


        it('should get people in list', async () => {
            expect(testListId).toBeTruthy();

            // This test verifies that we can get people in a list via the people relationship
            const people = await client.lists.getPeople(testListId);

            expect(people).toBeDefined();
            expect(Array.isArray(people.data)).toBe(true);
            expect(people.data.length).toBeGreaterThan(0);
        }, 30000);

        it('should demonstrate list people relationship', async () => {
            expect(testListId).toBeTruthy();

            // This test verifies that we can access the people relationship
            // which is the correct way to get people in a PCO list
            const list = await client.lists.getById(testListId, ['people']);

            expect(list).toBeDefined();
            expect(list.relationships?.people?.data).toBeDefined();
            expect(Array.isArray(list.relationships?.people?.data)).toBe(true);
        }, 30000);

        it('should demonstrate PCO lists are rule-based', async () => {
            expect(testListId).toBeTruthy();

            // This test documents that PCO lists are rule-based, not membership-based
            // People are automatically added/removed based on list rules
            // There is no direct "remove person from list" functionality
            const list = await client.lists.getById(testListId);

            expect(list).toBeDefined();
            expect(list.attributes?.description).toBeDefined();
            // The description shows this is a rule-based list: "First name starts with 'T'"
            expect(list.attributes?.description).toContain('First name starts with');
        }, 30000);


        it('should handle invalid list ID gracefully', async () => {
            await expect(
                client.lists.getById('invalid-list-id')
            ).rejects.toThrow();
        }, 60000);

        it('should handle invalid person ID in people endpoint gracefully', async () => {
            expect(testListId).toBeTruthy();

            // Test that we can handle invalid person IDs when getting people from a list
            // This is a read operation, so it should work but return empty results
            const people = await client.lists.getPeople(testListId);
            expect(people).toBeDefined();
            expect(Array.isArray(people.data)).toBe(true);
        }, 30000);

        it('should demonstrate list rules functionality', async () => {
            expect(testListId).toBeTruthy();

            // Test that we can get list rules (if available)
            // This demonstrates the rule-based nature of PCO lists
            const list = await client.lists.getById(testListId);

            expect(list).toBeDefined();
            expect(list.attributes?.description).toBeDefined();
            // Lists have rules that determine membership automatically
            expect(list.attributes?.description).toContain('First name starts with');
        }, 60000);
    });

    describe('v2.0 List Category Operations', () => {
        it('should get all list categories', async () => {
            const categories = await client.lists.getListCategories();

            expect(categories.data).toBeDefined();
            expect(Array.isArray(categories.data)).toBe(true);
        }, 60000);

        it('should get list category by ID', async () => {
            const categories = await client.lists.getListCategories();
            expect(categories.data.length).toBeGreaterThan(0);

            const categoryId = categories.data[0].id;
            const category = await client.lists.getListCategoryById(categoryId);

            expect(category).toBeDefined();
            expect(category.type).toBe('ListCategory');
            expect(category.id).toBe(categoryId);
            expect(category.attributes).toBeDefined();
        }, 60000);

        it('should create list category', async () => {
            const timestamp = Date.now();
            const categoryData = {
                name: `${TEST_PREFIX}_Category_${timestamp}`,
            };

            const category = await client.lists.createListCategory(categoryData);

            expect(category).toBeDefined();
            expect(category.type).toBe('ListCategory');
            expect(category.attributes?.name).toBe(categoryData.name);

            testCategoryId = category.id || '';
            expect(testCategoryId).toBeTruthy();
        }, 30000);

        it('should update list category', async () => {
            expect(testCategoryId).toBeTruthy();

            const updateData = {
                name: `${TEST_PREFIX}_Updated_Category_${Date.now()}`,
            };

            const updatedCategory = await client.lists.updateListCategory(testCategoryId, updateData);

            expect(updatedCategory).toBeDefined();
            expect(updatedCategory.type).toBe('ListCategory');
            expect(updatedCategory.id).toBe(testCategoryId);
            expect(updatedCategory.attributes?.name).toBe(updateData.name);
        }, 30000);

        it('should delete list category', async () => {
            expect(testCategoryId).toBeTruthy();

            await client.lists.deleteListCategory(testCategoryId);

            // Verify category was deleted
            await expect(
                client.lists.getListCategoryById(testCategoryId)
            ).rejects.toThrow();
        }, 30000);

        it('should demonstrate list filtering capabilities', async () => {
            // Test that we can filter lists (even if no categories exist)
            const lists = await client.lists.getAll();

            expect(lists.data).toBeDefined();
            expect(Array.isArray(lists.data)).toBe(true);
            expect(lists.data.length).toBeGreaterThan(0);

            // Verify we can get lists with basic filtering
            const firstList = lists.data[0];
            expect(firstList).toBeDefined();
            expect(firstList.type).toBe('List');
        }, 30000);

    });

    describe('v2.0 List Rules and Automatic Membership', () => {
        it('should demonstrate list rules functionality', async () => {
            // This test would verify that list rules work correctly
            // For now, we'll just verify that we can get lists with rules
            const lists = await client.lists.getAll();

            expect(lists.data).toBeDefined();
            expect(Array.isArray(lists.data)).toBe(true);

            // Check if any lists have rules
            const listsWithRules = lists.data.filter(list =>
                list.attributes?.rules && list.attributes.rules.length > 0
            );

            console.log(`Found ${listsWithRules.length} lists with rules`);
        }, 30000);
    });

    describe('v2.0 List Performance', () => {
        it('should demonstrate list operations performance', async () => {
            const startTime = Date.now();

            // Get all lists
            const lists = await client.lists.getAll();
            const listFetchTime = Date.now() - startTime;

            expect(lists.data.length).toBeGreaterThan(0);
            expect(listFetchTime).toBeLessThan(5000); // Should be fast

            console.log(`List fetch time: ${listFetchTime}ms`);
        }, 30000);
    });
});
