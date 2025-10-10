/**
 * v2.0.0 Notes Module
 */

import { BaseModule } from './base';
import type { PcoHttpClient } from '../core/http';
import type { PaginationHelper } from '../core/pagination';
import type { PcoEventEmitter } from '../monitoring';
import type { PaginationOptions, PaginationResult } from '../core/pagination';
import type {
    NoteResource,
    NoteAttributes,
    NoteCategoryResource,
    NoteCategoryAttributes
} from '../types';

export interface NotesListOptions {
    where?: Record<string, any>;
    include?: string[];
    perPage?: number;
    page?: number;
}

export class NotesModule extends BaseModule {
    /**
     * Get all notes
     */
    async getAll(options: NotesListOptions = {}): Promise<{ data: NoteResource[]; meta?: any; links?: any }> {
        const params: Record<string, any> = {};

        if (options.where) {
            Object.entries(options.where).forEach(([key, value]) => {
                params[`where[${key}]`] = value;
            });
        }

        if (options.include) {
            params.include = options.include.join(',');
        }

        if (options.perPage) {
            params.per_page = options.perPage;
        }

        if (options.page) {
            params.page = options.page;
        }

        return this.getList<NoteResource>('/notes', params);
    }

    /**
     * Get all notes across all pages
     */
    async getAllPagesPaginated(options: NotesListOptions = {}, paginationOptions?: PaginationOptions): Promise<PaginationResult<NoteResource>> {
        const params: Record<string, any> = {};

        if (options.where) {
            Object.entries(options.where).forEach(([key, value]) => {
                params[`where[${key}]`] = value;
            });
        }

        if (options.include) {
            params.include = options.include.join(',');
        }

        return this.getAllPages<NoteResource>('/notes', params, paginationOptions);
    }

    /**
     * Get a single note by ID
     */
    async getById(id: string, include?: string[]): Promise<NoteResource> {
        const params: Record<string, any> = {};
        if (include) {
            params.include = include.join(',');
        }

        return this.getSingle<NoteResource>(`/notes/${id}`, params);
    }

    /**
     * Get notes for a specific person
     */
    async getNotesForPerson(personId: string, options: NotesListOptions = {}): Promise<{ data: NoteResource[]; meta?: any; links?: any }> {
        const params: Record<string, any> = {};

        if (options.where) {
            Object.entries(options.where).forEach(([key, value]) => {
                params[`where[${key}]`] = value;
            });
        }

        if (options.include) {
            params.include = options.include.join(',');
        }

        if (options.perPage) {
            params.per_page = options.perPage;
        }

        if (options.page) {
            params.page = options.page;
        }

        return this.getList<NoteResource>(`/people/${personId}/notes`, params);
    }

    /**
     * Create a note for a person
     */
    async create(personId: string, data: NoteAttributes): Promise<NoteResource> {
        return this.createResource<NoteResource>(`/people/${personId}/notes`, data);
    }

    /**
     * Update a note
     */
    async update(id: string, data: Partial<NoteAttributes>): Promise<NoteResource> {
        return this.updateResource<NoteResource>(`/notes/${id}`, data);
    }

    /**
     * Delete a note
     */
    async delete(id: string): Promise<void> {
        return this.deleteResource(`/notes/${id}`);
    }

    /**
     * Get all note categories
     */
    async getNoteCategories(): Promise<{ data: NoteCategoryResource[]; meta?: any; links?: any }> {
        return this.getList<NoteCategoryResource>('/note_categories');
    }

    /**
     * Get a single note category by ID
     */
    async getNoteCategoryById(id: string): Promise<NoteCategoryResource> {
        return this.getSingle<NoteCategoryResource>(`/note_categories/${id}`);
    }

    /**
     * Create a note category
     */
    async createNoteCategory(data: NoteCategoryAttributes): Promise<NoteCategoryResource> {
        return this.createResource<NoteCategoryResource>('/note_categories', data);
    }

    /**
     * Update a note category
     */
    async updateNoteCategory(id: string, data: Partial<NoteCategoryAttributes>): Promise<NoteCategoryResource> {
        return this.updateResource<NoteCategoryResource>(`/note_categories/${id}`, data);
    }

    /**
     * Delete a note category
     */
    async deleteNoteCategory(id: string): Promise<void> {
        return this.deleteResource(`/note_categories/${id}`);
    }
}
