import {
    PcoClient,
    type CampusAttributes,
} from '../../../src';
import { createTestClient, logAuthStatus } from '../test-config';

const TEST_PREFIX = 'TEST_V2_CAMPUS_2025';

describe('v2.0.0 Campus API Integration Tests', () => {
    let client: PcoClient;
    let testCampusId: string;

    beforeAll(async () => {
        // Log authentication status for debugging
        logAuthStatus();

        // Create client with proper token refresh support
        client = createTestClient();
    }, 30000);

    afterAll(async () => {
        // Clean up test campus if it was created
        if (testCampusId) {
            try {
                await client.campus.delete(testCampusId);
            } catch (error) {
                console.warn('Failed to clean up test campus:', error);
            }
        }
    }, 30000);

    describe('v2.0 Campus Operations', () => {
        it('should get all campuses', async () => {
            const campuses = await client.campus.getAll();

            expect(campuses).toBeDefined();
            expect(campuses.data).toBeDefined();
            expect(Array.isArray(campuses.data)).toBe(true);
            expect(campuses.meta).toBeDefined();
        }, 30000);

        it('should get all campuses with pagination', async () => {
            const campuses = await client.campus.getAllPages();

            expect(campuses).toBeDefined();
            expect(Array.isArray(campuses)).toBe(true);
            
            // Verify all items are Campus resources
            campuses.forEach(campus => {
                expect(campus.type).toBe('Campus');
                expect(campus.id).toBeTruthy();
            });
        }, 30000);

        it('should create a campus', async () => {
            const timestamp = Date.now();
            const campusData: CampusAttributes = {
                description: `${TEST_PREFIX}_Test_Campus_${timestamp}`,
                street: '123 Test Street',
                city: 'Test City',
                state: 'TS',
                zip: '12345',
                country: 'US',
                phone_number: '555-123-4567',
                website: 'https://testcampus.example.com',
                twenty_four_hour_time: false,
                date_format: 1,
                church_center_enabled: true,
            };

            const campus = await client.campus.create(campusData);

            expect(campus).toBeDefined();
            expect(campus.type).toBe('Campus');
            expect(campus.attributes?.description).toBe(campusData.description);
            expect(campus.attributes?.street).toBe(campusData.street);
            expect(campus.attributes?.city).toBe(campusData.city);
            expect(campus.attributes?.state).toBe(campusData.state);
            expect(campus.attributes?.zip).toBe(campusData.zip);
            expect(campus.attributes?.country).toBe(campusData.country);
            expect(campus.attributes?.phone_number).toBe(campusData.phone_number);
            expect(campus.attributes?.website).toBe(campusData.website);
            expect(campus.attributes?.twenty_four_hour_time).toBe(campusData.twenty_four_hour_time);
            expect(campus.attributes?.date_format).toBe(campusData.date_format);
            expect(campus.attributes?.church_center_enabled).toBe(campusData.church_center_enabled);

            testCampusId = campus.id || '';
            expect(testCampusId).toBeTruthy();
        }, 30000);

        it('should get campus by ID', async () => {
            expect(testCampusId).toBeTruthy();

            const campus = await client.campus.getById(testCampusId);

            expect(campus).toBeDefined();
            expect(campus.type).toBe('Campus');
            expect(campus.id).toBe(testCampusId);
            expect(campus.attributes?.description).toContain(TEST_PREFIX);
        }, 30000);

        it('should update a campus', async () => {
            expect(testCampusId).toBeTruthy();

            const updateData: Partial<CampusAttributes> = {
                description: `${TEST_PREFIX}_Updated_Campus_${Date.now()}`,
                city: 'Updated City',
                phone_number: '555-987-6543',
                twenty_four_hour_time: true,
            };

            const updatedCampus = await client.campus.update(testCampusId, updateData);

            expect(updatedCampus).toBeDefined();
            expect(updatedCampus.type).toBe('Campus');
            expect(updatedCampus.id).toBe(testCampusId);
            expect(updatedCampus.attributes?.description).toBe(updateData.description);
            expect(updatedCampus.attributes?.city).toBe(updateData.city);
            expect(updatedCampus.attributes?.phone_number).toBe(updateData.phone_number);
            expect(updatedCampus.attributes?.twenty_four_hour_time).toBe(updateData.twenty_four_hour_time);
        }, 30000);

        it('should get campus lists', async () => {
            expect(testCampusId).toBeTruthy();

            const lists = await client.campus.getLists(testCampusId);

            expect(lists).toBeDefined();
            expect(lists.data).toBeDefined();
            expect(Array.isArray(lists.data)).toBe(true);
        }, 30000);

        it('should get campus service times', async () => {
            expect(testCampusId).toBeTruthy();

            const serviceTimes = await client.campus.getServiceTimes(testCampusId);

            expect(serviceTimes).toBeDefined();
            expect(serviceTimes.data).toBeDefined();
            expect(Array.isArray(serviceTimes.data)).toBe(true);
        }, 30000);

        it('should delete a campus', async () => {
            expect(testCampusId).toBeTruthy();

            await client.campus.delete(testCampusId);

            // Verify campus was deleted
            await expect(
                client.campus.getById(testCampusId)
            ).rejects.toThrow();

            // Clear the test campus ID since it's been deleted
            testCampusId = '';
        }, 30000);
    });

    describe('v2.0 Campus Error Handling', () => {
        it('should handle invalid campus ID gracefully', async () => {
            await expect(
                client.campus.getById('invalid-campus-id')
            ).rejects.toThrow();
        }, 30000);

        it('should handle campus creation with invalid data', async () => {
            const invalidData = {
                // Missing required fields or invalid data
                invalid_field: 'invalid_value',
            } as any;

            await expect(
                client.campus.create(invalidData)
            ).rejects.toThrow();
        }, 30000);
    });
});
