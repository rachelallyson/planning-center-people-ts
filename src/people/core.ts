import { del, getList, getSingle, patch, PcoClientState, post } from '../core';
import type { ErrorContext } from '../error-handling';
import { buildQueryParams } from '../helpers';
import {
    PeopleIncluded,
    PeopleList,
    PersonAttributes,
    PersonResource,
    PersonSingle,
} from '../types';

/**
 * Get all people with optional filtering and pagination
 */
export async function getPeople(
    client: PcoClientState,
    params?: {
        where?: Record<string, any>;
        include?: string[];
        per_page?: number;
        page?: number;
    },
    context?: Partial<ErrorContext>
): Promise<PeopleList> {
    const result = await getList<PersonResource, PeopleIncluded>(
        client,
        '/people',
        buildQueryParams(params),
        {
            ...context,
            endpoint: '/people',
            method: 'GET',
        }
    );

    return result as PeopleList;
}

/**
 * Get a single person by ID
 */
export async function getPerson(
    client: PcoClientState,
    id: string,
    include?: string[],
    context?: Partial<ErrorContext>
): Promise<PersonSingle> {
    const params: Record<string, any> = {};

    if (include) {
        params.include = include.join(',');
    }

    return (await getSingle<PersonResource, PeopleIncluded>(
        client,
        `/people/${id}`,
        params,
        {
            ...context,
            endpoint: `/people/${id}`,
            method: 'GET',
            personId: id,
        }
    )) as PersonSingle;
}

/**
 * Create a new person
 */
export async function createPerson(
    client: PcoClientState,
    data: Partial<PersonAttributes>,
    context?: Partial<ErrorContext>
): Promise<PersonSingle> {
    return post<PersonResource>(client, '/people', data, undefined, {
        ...context,
        endpoint: '/people',
        method: 'POST',
    });
}

/**
 * Update a person
 */
export async function updatePerson(
    client: PcoClientState,
    id: string,
    data: Partial<PersonAttributes>,
    context?: Partial<ErrorContext>
): Promise<PersonSingle> {
    return patch<PersonResource>(client, `/people/${id}`, data, undefined, {
        ...context,
        endpoint: `/people/${id}`,
        method: 'PATCH',
        personId: id,
    });
}

/**
 * Delete a person
 */
export async function deletePerson(
    client: PcoClientState,
    id: string,
    context?: Partial<ErrorContext>
): Promise<void> {
    return del(client, `/people/${id}`, undefined, {
        ...context,
        endpoint: `/people/${id}`,
        method: 'DELETE',
        personId: id,
        metadata: { operation: 'delete_person' },
        timestamp: new Date().toISOString(),
    });
}
