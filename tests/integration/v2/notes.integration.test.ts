import {
    PcoClient,
    type PersonAttributes,
} from '../../../src';
import { validatePersonResource } from '../../type-validators';
import { createTestClient, logAuthStatus } from '../test-config';

const TEST_PREFIX = 'TEST_V2_NOTES_2025';

describe('v2.0.0 Notes API Integration Tests', () => {
    let client: PcoClient;
    let testPersonId: string;
    let testNoteId: string;
    let testCategoryId: string;

    beforeAll(async () => {
        // Log authentication status for debugging
        logAuthStatus();

        // Create client with proper token refresh support
        client = createTestClient();

        // Create a test person for note operations
        const timestamp = Date.now();
        const personData: Partial<PersonAttributes> = {
            first_name: `${TEST_PREFIX}_NoteTest_${timestamp}`,
            last_name: `${TEST_PREFIX}_Test_${timestamp}`,
            status: 'active',
        };

        const createResponse = await client.people.create(personData);
        testPersonId = createResponse.id || '';
        expect(testPersonId).toBeTruthy();
    }, 30000);

    afterAll(async () => {
        // Clean up test person (this will also clean up associated notes)
        if (testPersonId) {
            try {
                await client.people.delete(testPersonId);
            } catch (error) {
                console.warn('Failed to clean up test person:', error);
            }
        }
    }, 30000);

    describe('v2.0 Note Operations', () => {
        it('should get all notes with pagination', async () => {
            const notes = await client.notes.getAll();
            expect(notes.data).toBeDefined();
            expect(Array.isArray(notes.data)).toBe(true);
            expect(notes.meta).toBeDefined();
        }, 30000);

        it('should get note by ID', async () => {
            const notes = await client.notes.getAll();

            if (notes.data.length === 0) {
                // Skip this test if no notes exist
                console.log('Skipping note by ID test - no notes available in system');
                return;
            }

            const noteId = notes.data[0].id;
            const note = await client.notes.getById(noteId);

            expect(note).toBeDefined();
            expect(note.type).toBe('Note');
            expect(note.id).toBe(noteId);
            expect(note.attributes).toBeDefined();
        }, 30000);

        it('should create note for person', async () => {
            // First get an existing note category
            const categories = await client.notes.getNoteCategories();
            expect(categories.data.length).toBeGreaterThan(0);
            const categoryId = categories.data[0].id;

            const timestamp = Date.now();
            const noteData = {
                note: `This is a test note created via v2.0 API at ${new Date().toISOString()}`,
                note_category_id: categoryId,
            };

            const note = await client.notes.create(testPersonId, noteData);

            expect(note).toBeDefined();
            expect(note.type).toBe('Note');
            expect(note.attributes?.note).toBe(noteData.note);
            expect(note.relationships?.person?.data?.id).toBe(testPersonId);

            testNoteId = note.id || '';
            expect(testNoteId).toBeTruthy();
        }, 60000);

        it('should get notes for person', async () => {
            const notes = await client.notes.getNotesForPerson(testPersonId);

            expect(notes.data).toBeDefined();
            expect(Array.isArray(notes.data)).toBe(true);

            // If no notes exist, that's okay - just verify the structure
            if (notes.data.length === 0) {
                console.log('No notes found for person - this is expected if note creation is not permitted');
                return;
            }

            // Verify our test note is in the list
            const hasTestNote = notes.data.some(note =>
                note.relationships?.person?.data?.id === testPersonId
            );
            expect(hasTestNote).toBe(true);
        }, 30000);

        it('should update note', async () => {
            if (!testNoteId) {
                const notes = await client.notes.getNotesForPerson(testPersonId);
                testNoteId = notes.data[0].id || '';
            }

            expect(testNoteId).toBeTruthy();

            const updateData = {
                note: `This note was updated via v2.0 API at ${new Date().toISOString()}`,
            };

            const updatedNote = await client.notes.update(testNoteId, updateData);

            expect(updatedNote).toBeDefined();
            expect(updatedNote.type).toBe('Note');
            expect(updatedNote.id).toBe(testNoteId);
            expect(updatedNote.attributes?.note).toBe(updateData.note);
        }, 60000);

        it('should delete note', async () => {
            if (!testNoteId) {
                const notes = await client.notes.getNotesForPerson(testPersonId);
                testNoteId = notes.data[0].id || '';
            }

            expect(testNoteId).toBeTruthy();

            await client.notes.delete(testNoteId);

            // Verify note was deleted
            await expect(
                client.notes.getById(testNoteId)
            ).rejects.toThrow();
        }, 60000);
    });

    describe('v2.0 Note Category Operations', () => {
        it('should get all note categories', async () => {
            const categories = await client.notes.getNoteCategories();

            expect(categories.data).toBeDefined();
            expect(Array.isArray(categories.data)).toBe(true);
        }, 30000);

        it('should get note category by ID', async () => {
            const categories = await client.notes.getNoteCategories();
            expect(categories.data.length).toBeGreaterThan(0);

            const categoryId = categories.data[0].id;
            const category = await client.notes.getNoteCategoryById(categoryId);

            expect(category).toBeDefined();
            expect(category.type).toBe('NoteCategory');
            expect(category.id).toBe(categoryId);
            expect(category.attributes).toBeDefined();
        }, 30000);

        it('should create note category', async () => {
            const timestamp = Date.now();
            const categoryData = {
                name: `${TEST_PREFIX}_Category_${timestamp}`,
            };

            const category = await client.notes.createNoteCategory(categoryData);

            expect(category).toBeDefined();
            expect(category.type).toBe('NoteCategory');
            expect(category.attributes?.name).toBe(categoryData.name);

            testCategoryId = category.id || '';
            expect(testCategoryId).toBeTruthy();
        }, 60000);

        it('should update note category', async () => {
            if (!testCategoryId) {
                // Create a category if we don't have one
                const timestamp = Date.now();
                const categoryData = {
                    name: `${TEST_PREFIX}_Category_${timestamp}`,
                };
                const category = await client.notes.createNoteCategory(categoryData);
                testCategoryId = category.id || '';
            }

            expect(testCategoryId).toBeTruthy();

            const updateData = {
                name: `${TEST_PREFIX}_Updated_Category_${Date.now()}`,
            };

            const updatedCategory = await client.notes.updateNoteCategory(testCategoryId, updateData);

            expect(updatedCategory).toBeDefined();
            expect(updatedCategory.type).toBe('NoteCategory');
            expect(updatedCategory.id).toBe(testCategoryId);
            expect(updatedCategory.attributes?.name).toBe(updateData.name);
        }, 60000);

        it('should create note with category', async () => {
            if (!testCategoryId) {
                // Create a category if we don't have one
                const timestamp = Date.now();
                const categoryData = {
                    name: `${TEST_PREFIX}_Category_${timestamp}`,
                };
                const category = await client.notes.createNoteCategory(categoryData);
                testCategoryId = category.id || '';
            }

            expect(testCategoryId).toBeTruthy();

            const timestamp = Date.now();
            const noteData = {
                note: `This is a test note with category created via v2.0 API at ${new Date().toISOString()}`,
                note_category_id: testCategoryId,
            };

            const note = await client.notes.create(testPersonId, noteData);

            expect(note).toBeDefined();
            expect(note.type).toBe('Note');
            expect(note.attributes?.note).toBe(noteData.note);
            expect(note.relationships?.person?.data?.id).toBe(testPersonId);
            expect(note.relationships?.note_category?.data?.id).toBe(testCategoryId);
        }, 60000);

        it('should filter notes by category', async () => {
            // Get existing categories first
            const categories = await client.notes.getNoteCategories();

            if (categories.data.length === 0) {
                console.log('No note categories available - skipping category filter test');
                return;
            }

            const testCategoryId = categories.data[0].id;

            const notes = await client.notes.getNotesForPerson(testPersonId, {
                where: { note_category_id: testCategoryId },
            });

            expect(notes.data).toBeDefined();
            expect(Array.isArray(notes.data)).toBe(true);

            // If no notes exist in this category, that's okay
            if (notes.data.length === 0) {
                console.log('No notes found in category - this is expected if note creation is not permitted');
                return;
            }

            // Verify all notes are in the specified category
            const allInCategory = notes.data.every(note =>
                note.relationships?.note_category?.data?.id === testCategoryId
            );
            expect(allInCategory).toBe(true);
        }, 30000);

        it('should delete note category', async () => {
            if (!testCategoryId) {
                // Create a category if we don't have one
                const timestamp = Date.now();
                const categoryData = {
                    name: `${TEST_PREFIX}_Category_${timestamp}`,
                };
                const category = await client.notes.createNoteCategory(categoryData);
                testCategoryId = category.id || '';
            }

            expect(testCategoryId).toBeTruthy();

            await client.notes.deleteNoteCategory(testCategoryId);

            // Verify category was deleted
            await expect(
                client.notes.getNoteCategoryById(testCategoryId)
            ).rejects.toThrow();
        }, 60000);
    });

    describe('v2.0 Note Validation', () => {
        it('should handle invalid person ID gracefully', async () => {
            const noteData = {
                content: 'This should fail',
                category: 'General',
            };

            await expect(
                client.notes.create('invalid-person-id', noteData)
            ).rejects.toThrow();
        }, 30000);

        it('should handle invalid note ID gracefully', async () => {
            await expect(
                client.notes.getById('invalid-note-id')
            ).rejects.toThrow();
        }, 30000);

        it('should handle invalid category ID gracefully', async () => {
            await expect(
                client.notes.getNoteCategoryById('invalid-category-id')
            ).rejects.toThrow();
        }, 30000);
    });

    describe('v2.0 Note Performance', () => {
        it('should demonstrate note operations performance', async () => {
            const startTime = Date.now();

            // Get all notes
            const notes = await client.notes.getAll();
            const noteFetchTime = Date.now() - startTime;

            expect(notes.data).toBeDefined();
            expect(Array.isArray(notes.data)).toBe(true);
            expect(noteFetchTime).toBeLessThan(5000); // Should be fast

            console.log(`Note fetch time: ${noteFetchTime}ms`);
        }, 30000);
    });
});
