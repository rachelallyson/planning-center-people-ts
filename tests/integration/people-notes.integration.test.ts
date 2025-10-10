/**
 * People Notes API Integration Tests
 * 
 * Tests for src/people/notes.ts functions:
 * - getNotes, getNote, getNoteCategories
 * 
 * To run: npm run test:integration:people-notes
 */

import {
    createPcoClient,
    getNotes,
    getNote,
    getNoteCategories,
    createPerson,
    deletePerson,
    type PcoClientState,
    PcoClient,
} from '../../src';
import { createTestClient } from './test-config';
import {
    validateResourceStructure,
    validateStringAttribute,
    validateDateAttribute,
    validateRelationship,
    validatePaginationLinks,
    validatePaginationMeta,
    validateBooleanAttribute,
    validateNumberAttribute,
} from '../type-validators';

// Test configuration
const RATE_LIMIT_MAX = parseInt(process.env.PCO_RATE_LIMIT_MAX || '90');
const RATE_LIMIT_WINDOW = parseInt(process.env.PCO_RATE_LIMIT_WINDOW || '20000');

describe('People Notes API Integration Tests', () => {
    let client: PcoClientState;
    let v2Client: PcoClient;
    let testPersonId: string | null = null;
    let testNoteId: string | null = null;

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

        // Create v2 client for note operations
        v2Client = createTestClient();

        // Create test data
        const timestamp = Date.now();
        const personData = {
            first_name: `NotesTest_${timestamp}`,
            last_name: `Person_${timestamp}`,
            status: 'active',
        };

        const personResponse = await createPerson(client, personData);
        testPersonId = personResponse.data?.id || null;
        expect(testPersonId).toBeTruthy();

        // Get a note category first
        const noteCategories = await v2Client.notes.getNoteCategories();
        const noteCategoryId = noteCategories.data[0]?.id;

        if (!noteCategoryId) {
            throw new Error('No note categories found - cannot create test note');
        }

        // Create a test note using v2 API
        const noteData = {
            note: `Test note content for integration testing - ${timestamp}`,
            note_category_id: noteCategoryId,
        };

        const noteResponse = await v2Client.notes.create(testPersonId, noteData);
        testNoteId = noteResponse.id || null;
        expect(testNoteId).toBeTruthy();
    }, 30000);

    afterAll(async () => {
        // Clean up test data
        if (testNoteId && testPersonId) {
            try {
                await v2Client.notes.delete(testPersonId, testNoteId);
            } catch (error) {
                console.log('Note cleanup failed:', error);
            }
        }
        if (testPersonId) {
            try {
                await deletePerson(client, testPersonId);
            } catch (error) {
                console.log('Person cleanup failed:', error);
            }
        }
    }, 30000);

    describe('Note Management', () => {
        it('should get notes list', async () => {
            const response = await getNotes(client, { per_page: 5 });

            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);

            // Validate pagination structure
            validatePaginationLinks(response.links);
            validatePaginationMeta(response.meta);

            expect(response.data.length).toBeGreaterThan(0);
            const note = response.data[0];

            // Validate NoteResource structure
            validateResourceStructure(note, 'Note');

            // Validate NoteAttributes
            validateStringAttribute(note.attributes, 'content');
            validateDateAttribute(note.attributes, 'created_at');
            validateDateAttribute(note.attributes, 'updated_at');

            // Validate NoteRelationships
            validateRelationship(note.relationships?.note_category);
            validateRelationship(note.relationships?.person);
            validateRelationship(note.relationships?.organization);
            validateRelationship(note.relationships?.created_by);

        }, 30000);

        it('should get single note by ID', async () => {
            expect(testNoteId).toBeTruthy();

            const note = await getNote(client, testNoteId!, { include: ['note_category'] });

            expect(note.data).toBeDefined();
            expect(note.data?.type).toBe('Note');
            expect(note.data?.id).toBe(testNoteId);
            expect(note.data?.attributes).toBeDefined();

            // Validate NoteResource structure
            validateResourceStructure(note.data, 'Note');

            // Validate NoteAttributes
            validateStringAttribute(note.data?.attributes, 'content');
            validateDateAttribute(note.data?.attributes, 'created_at');
            validateDateAttribute(note.data?.attributes, 'updated_at');


            // Validate NoteRelationships
            validateRelationship(note.data?.relationships?.note_category);
            validateRelationship(note.data?.relationships?.person);
            validateRelationship(note.data?.relationships?.organization);
            validateRelationship(note.data?.relationships?.created_by);



            // Check if included note category is present
            const categories = note.included?.filter(r => r.type === 'NoteCategory');
            categories?.forEach(category => {
                validateResourceStructure(category, 'NoteCategory');
            });



        }, 30000);

        it('should handle invalid note ID gracefully', async () => {

            await expect(getNote(client, 'invalid-id')).rejects.toThrow();

        }, 30000);
    });

    describe('Note Categories', () => {
        it('should get note categories', async () => {

            const response = await getNoteCategories(client, { per_page: 5 });

            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);

            // Validate pagination structure
            validatePaginationLinks(response.links);
            validatePaginationMeta(response.meta);

            expect(response.data.length).toBeGreaterThan(0);
            const category = response.data[0];

            // Validate NoteCategoryResource structure
            validateResourceStructure(category, 'NoteCategory');

            // Validate NoteCategoryAttributes
            validateStringAttribute(category.attributes, 'name');
            validateDateAttribute(category.attributes, 'created_at');
            validateDateAttribute(category.attributes, 'updated_at');
            validateNumberAttribute(category.attributes, 'organization_id');
            validateBooleanAttribute(category.attributes, 'locked');


            // Validate NoteCategoryRelationships
            // Note: The API response shows organization relationship, not notes relationship
            validateRelationship(category.relationships?.organization);

        }, 30000);

        it('should validate note category structure', async () => {

            const response = await getNoteCategories(client, { per_page: 1 });

            expect(response.data.length).toBeGreaterThan(0);
            const category = response.data[0];

            // Validate NoteCategoryResource structure
            validateResourceStructure(category, 'NoteCategory');

            // Validate NoteCategoryAttributes
            validateStringAttribute(category.attributes, 'name');
            validateDateAttribute(category.attributes, 'created_at');
            validateDateAttribute(category.attributes, 'updated_at');
            validateNumberAttribute(category.attributes, 'organization_id');
            validateBooleanAttribute(category.attributes, 'locked');


            // Validate NoteCategoryRelationships
            // Note: The API response shows organization relationship, not notes relationship
            validateRelationship(category.relationships?.organization);


        }, 30000);
    });
});
