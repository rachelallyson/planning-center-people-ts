import { getList, getSingle, PcoClientState } from '../core';
import type { ErrorContext } from '../error-handling';
import { buildQueryParams } from '../helpers';
import {
    NoteCategoriesList,
    NoteCategoryResource,
    NoteResource,
    NoteSingle,
    NotesList,
} from '../types';

/**
 * Get all notes
 */
export async function getNotes(
    client: PcoClientState,
    params?: {
        where?: Record<string, any>;
        include?: string[];
        per_page?: number;
        page?: number;
    },
    context?: Partial<ErrorContext>
): Promise<NotesList> {
    return getList<NoteResource>(client, '/notes', buildQueryParams(params), {
        ...context,
        endpoint: '/notes',
        method: 'GET',
    });
}

/**
 * Get a single note
 */
export async function getNote(
    client: PcoClientState,
    noteId: string,
    params?: {
        where?: Record<string, any>;
        include?: string[];
        per_page?: number;
        page?: number;
    },
    context?: Partial<ErrorContext>
): Promise<NoteSingle> {
    return getSingle<NoteResource>(
        client,
        `/notes/${noteId}`,
        buildQueryParams(params),
        {
            ...context,
            endpoint: `/notes/${noteId}`,
            method: 'GET',
        }
    );
}

/**
 * Get all note categories
 */
export async function getNoteCategories(
    client: PcoClientState,
    params?: {
        where?: Record<string, any>;
        include?: string[];
        per_page?: number;
        page?: number;
    },
    context?: Partial<ErrorContext>
): Promise<NoteCategoriesList> {
    return getList<NoteCategoryResource>(
        client,
        '/note_categories',
        buildQueryParams(params),
        {
            ...context,
            endpoint: '/note_categories',
            method: 'GET',
        }
    );
}
