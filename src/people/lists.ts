import { getList, getSingle, PcoClientState } from '../core';
import type { ErrorContext } from '../error-handling';
import { buildQueryParams } from '../helpers';
import {
    ListCategoriesList,
    ListCategoryResource,
    ListResource,
    ListSingle,
    ListsList,
} from '../types';

/**
 * Get all lists
 */
export async function getLists(
    client: PcoClientState,
    params?: {
        where?: Record<string, any>;
        include?: string[];
        per_page?: number;
        page?: number;
    },
    context?: Partial<ErrorContext>
): Promise<ListsList> {
    return getList<ListResource>(client, '/lists', buildQueryParams(params), {
        ...context,
        endpoint: '/lists',
        method: 'GET',
    });
}

/**
 * Get a single list
 */
export async function getListById(
    client: PcoClientState,
    listId: string,
    params?: {
        where?: Record<string, any>;
        include?: string[];
        per_page?: number;
        page?: number;
    },
    context?: Partial<ErrorContext>
): Promise<ListSingle> {
    return getSingle<ListResource>(
        client,
        `/lists/${listId}`,
        buildQueryParams(params),
        {
            ...context,
            endpoint: `/lists/${listId}`,
            method: 'GET',
        }
    );
}

/**
 * Get all list categories
 */
export async function getListCategories(
    client: PcoClientState,
    params?: {
        where?: Record<string, any>;
        include?: string[];
        per_page?: number;
        page?: number;
    },
    context?: Partial<ErrorContext>
): Promise<ListCategoriesList> {
    return getList<ListCategoryResource>(
        client,
        '/list_categories',
        buildQueryParams(params),
        {
            ...context,
            endpoint: '/list_categories',
            method: 'GET',
        }
    );
}
