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
    type PcoClientState,
} from '../../src';
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

            // First get a list to find a note ID
            const notesResponse = await getNotes(client, { per_page: 1 });

            expect(notesResponse.data.length).toBeGreaterThan(0);
            const noteId = notesResponse.data[0].id;
            const note = await getNote(client, noteId, { include: ['note_category'] });

            expect(note.data).toBeDefined();
            expect(note.data?.type).toBe('Note');
            expect(note.data?.id).toBe(noteId);
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
